from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, ElementClickInterceptedException
from bs4 import BeautifulSoup
from neo4j import GraphDatabase
from dotenv import load_dotenv
from datetime import datetime
import os
import re
import time
from server import app
from flask import Flask, jsonify, request

# Loading neo4j authentication details
load_status = load_dotenv("Neo4j-4504c504-Created-2025-10-19.txt")
if load_status is False:
    raise RuntimeError('Environment variables not loaded.')
URI = os.getenv("NEO4J_URI")
AUTH = (os.getenv("NEO4J_USERNAME"), os.getenv("NEO4J_PASSWORD"))

# Function to handle cookies
def handle_cookies(driver):
    wait = WebDriverWait(driver, timeout=20)
    try:
        banner = wait.until(EC.visibility_of_element_located((By.ID, 'onetrust-banner-sdk')))
        if banner.is_displayed():
            driver.find_element(By.XPATH, '//*[@id="onetrust-reject-all-handler"]').click()
    except TimeoutException:
        return False

# Endpoint to scrape ATP player data
@app.route("/atp_player/<player_id>", methods=['GET'])
def get_atp_player(player_id):
    url = f"https://www.atptour.com/en/players/x/{player_id}/overview"
    driver = webdriver.Chrome()
    driver.get(url)

    handle_cookies(driver)

    WebDriverWait(driver, 10).until(EC.presence_of_all_elements_located((By.CLASS_NAME, 'container')))

    # Get player name and current URL
    title = driver.title
    player_name = title.split('|')[0].strip()
    atp_link = url.replace('/x/', f"/{player_name.lower().replace(' ', '-')}/")

    # Initialise dictionary to hold player data
    params = {
        "id": player_id,
        "atp_link": atp_link,
        'current_singles': None,
        'ch_singles': None,
        'singles_date': None,
        'current_doubles': None,
        'ch_doubles': None,
        'doubles_date': None
    }

    # Get player stats
    # Singles stats
    driver.find_element(By.LINK_TEXT, 'Singles').click()
    singlesHeader = driver.find_element(By.CLASS_NAME, 'player_profile').get_attribute('innerHTML')
    singlesHeaderSoup = BeautifulSoup(singlesHeader, 'html.parser')
    singles_year_stats, singles_career_stats = singlesHeaderSoup.find_all('div', class_='player-stats-details')
    singles_current_rank_container = singles_year_stats.find('div', class_='stat')
    if singles_current_rank_container:
        params["current_singles"] = int(singles_current_rank_container.get_text(strip=True).removesuffix("Rank"))
    pm_container = singles_career_stats.find('div', class_='prize_money').get_text()
    pm_text = re.search(r"\$([\d,]+)", pm_container).group(1)
    params['pm'] = int(pm_text.replace(",", ""))
    singles_ch_container = singles_career_stats.find('div', class_='stat')
    if singles_ch_container:
        singles_ch_label = singles_ch_container.get_text(strip=True)
        singles_ch_text = re.search(r"(\d+)Career High Rank \((\d{4}\.\d{2}\.\d{2})\)", singles_ch_label)
        params['ch_singles'] = int(singles_ch_text.group(1)) if singles_ch_text else None
        params['singles_date'] = singles_ch_text.group(2).replace('.', '-') if singles_ch_text else None

    # Doubles stats
    driver.find_element(By.LINK_TEXT, 'Doubles').click()
    doublesHeader = driver.find_element(By.CLASS_NAME, 'player_profile').get_attribute('innerHTML')
    doublesHeaderSoup = BeautifulSoup(doublesHeader, 'html.parser')
    doubles_year_stats, doubles_career_stats = doublesHeaderSoup.find_all('div', class_='player-stats-details')
    doubles_current_rank_container = doubles_year_stats.find('div', class_='stat')
    if doubles_current_rank_container:
        params["current_doubles"] = int(doubles_current_rank_container.get_text(strip=True).removesuffix("Rank"))
    doubles_ch_container = doubles_career_stats.find('div', class_='stat')
    if doubles_ch_container:
        doubles_ch_label = doubles_ch_container.get_text(strip=True)
        doubles_ch_text = re.search(r"(\d+)Career High Rank \((\d{4}\.\d{2}\.\d{2})\)", doubles_ch_label)
        params['ch_doubles'] = int(doubles_ch_text.group(1)) if doubles_ch_text else None
        params['doubles_date'] = doubles_ch_text.group(2).replace('.', '-') if doubles_ch_text else None

    # Get player details
    details = driver.find_element(By.CLASS_NAME, 'pd_content').get_attribute('innerHTML')
    detailsSoup = BeautifulSoup(details, 'html.parser')
    pd_items = detailsSoup.find_all('li')
    for item in pd_items:
        text = item.get_text(strip=True)
        if text.startswith("Country"):
            params['country'] = text.removeprefix('Country')
        elif text.startswith('Turned pro'):
            pro_search = re.search(r"(\d{4})", text)
            params['year'] = pro_search.group(1) if pro_search else None
        elif text.startswith('Height'):
            height_text = re.search(r"(\d+)cm", text)
            params['height'] = int(height_text.group(1)) if height_text else None
        elif text.startswith("DOB") or text.startswith("Age"):
            params['dob'] = re.search(r"(\d{4}\/\d{2}\/\d{2})", text).group(1).replace('/', '-')
        elif text.startswith("Coach"):
            coach_text = text.removeprefix('Coach')
            if 'None' in coach_text or coach_text == "":
                params['coach'] = None
            elif ',' in coach_text or 'and' in coach_text.lower() or ' & ' in coach_text.lower() or ' / ' in coach_text or '/' in coach_text:
                coaches = re.split(r',| and | & | / |/', coach_text)
                params['coach'] = [coach.strip() for coach in coaches if coach.strip()]
            else:
                params['coach'] = [coach_text]
        elif text.startswith("Plays"):
            params['rh'] = 'Right' if "Right" in text else 'Left' if "Left" in text else None
            params['bh'] = 'Two' if "Two" in text else 'One' if "One" in text else None

    driver.quit()

    def addPlayers(db):
        query = """
            CYPHER 25
            MATCH (p:Player {id: $id})
            MERGE (c1:Country {name: $country})
            MERGE (p)-[:REPRESENTS]->(c1)
            SET
                p.pm = $pm,
                p.site_link = $atp_link,
                p.updated_at = date(),
                p.current_singles = $current_singles,
                p.ch_singles = $ch_singles,
                p.singles_ch_date = date($singles_date),
                p.current_doubles = $current_doubles,
                p.ch_doubles = $ch_doubles,
                p.doubles_ch_date = date($doubles_date)
        """

        if params.get('rh') is not None:
            query += """
                SET p.rh = $rh
            """

        if params.get('bh') is not None:
            query += """
                SET p.bh = $bh
            """

        if params.get('dob') is not None:
            query += """
                SET p.dob = date($dob)
            """

        if params.get('height') is not None:
            query += """
                SET p.height = $height
            """

        if params.get('year') is not None:
            query += """
                MERGE (y:Year {id: toInteger($year)})
                MERGE (p)-[:TURNED_PRO]->(y)
            """

        if params.get('coach') is not None:
            query += """
                WITH p
                UNWIND $coach AS coach_name
                OPTIONAL MATCH (c:Coach) WHERE apoc.text.compareCleaned(c.id, coach_name) OR apoc.text.compareCleaned(c.first_name || ' ' || c.last_name, coach_name)
                CALL (p, c, coach_name) {
                    WHEN c IS NULL THEN {
                        MERGE (c1:Coach {id: coach_name})
                        MERGE (c1)-[:COACHES]->(p)
                    } ELSE {
                        MERGE (c)-[:COACHES]->(p)
                    }
                }
            """

        db.run(query, **params)

    with GraphDatabase.driver(URI, auth=AUTH) as driver:
        with driver.session(database="neo4j") as session:
            records = session.execute_write(addPlayers)

    return jsonify({"ok": True, "player_id": player_id})

# Endpoint to scrape ATP draw data
@app.route("/atp_draw", methods=['POST'])
def get_atp_draw():
    data = request.json
    tid = data.get('tid')
    year = data.get('year')
    year2 = data.get('year2') if data.get('year2') else year
    tid2 = data.get('tid2') if data.get('tid2') else tid
    draw_size = data.get('draw_size')
    match_type = data.get('type')
    draw = data.get('draw')
    sets = data.get('sets') if data.get('sets') else 'BestOf3'
    matches = []

    url_slug = ""
    if match_type == 'Singles':
        url_slug = 'singles' if draw == 'Main' else 'qualifiersingles'
    elif match_type == 'Doubles':
        url_slug = 'doubles' if draw == 'Main' else 'qualifierdoubles'

    url = f"https://www.atptour.com/en/scores/archive/x/{tid2}/{year2}/draws?matchtype={url_slug}"

    driver = webdriver.Chrome()
    driver.get(url)

    WebDriverWait(driver, 10).until(EC.presence_of_all_elements_located((By.CLASS_NAME, 'atp-draw-container')))
    layout = driver.find_element(By.CLASS_NAME, 'atp-draw-container').get_attribute('innerHTML')

    soup = BeautifulSoup(layout, 'html.parser')

    round_name_mapping = {
        'Finals': 'Final',
        "Final": "Final",
        'Semi-Finals': 'Semifinals',
        "Semifinals": "Semifinals",
        'Quarter-Finals': 'Quarterfinals',
        "Quarterfinals": "Quarterfinals",
        'Round of 16': 'Round of 16',
        'Round of 32': 'Round of 32',
        'Round of 64': 'Round of 64',
        'Round of 128': 'Round of 128',
        '3rd Round Qualifying': 'Qualifying round 3',
        '2nd Round Qualifying': 'Qualifying round 2',
        '1st Round Qualifying': 'Qualifying round 1'
    }

    round_mapping = {
        'Final': 1,
        'Semifinals': 2,
        'Quarterfinals': 4,
        'Round of 16': 8,
        'Round of 32': 16,
        'Round of 64': 32,
        'Round of 128': 64
    }

    if draw_size:
        if draw_size == 4:
            round_mapping['Qualifying round 2'] = 1
            round_mapping['Qualifying round 1'] = 2
        elif draw_size == 16:
            round_mapping['Qualifying round 2'] = 1
            round_mapping['Qualifying round 1'] = 5
        elif draw_size == 24:
            round_mapping['Qualifying round 2'] = 1
            round_mapping['Qualifying round 1'] = 7
        elif draw_size == 28:
            round_mapping['Qualifying round 2'] = 1
            round_mapping['Qualifying round 1'] = 8
        elif draw_size == 32:
            round_mapping['Qualifying round 1'] = 1
        elif draw_size == 48:
            round_mapping['Qualifying round 2'] = 1
            round_mapping['Qualifying round 1'] = 13
        elif draw_size == 128:
            round_mapping['Qualifying round 3'] = 1
            round_mapping['Qualifying round 2'] = 17
            round_mapping['Qualifying round 1'] = 49

    for round in soup.find_all('div', class_='draw'):
        # Get round name
        round_header = round.find('div', class_='draw-header')
        round_name = round_name_mapping[round_header.get_text(strip=True)]

        # Get matches
        match_no = round_mapping[round_name]
        round_matches = round.find_all('div', class_='draw-stats')
        for match in round_matches:
            match_info = {
                'id': f"{tid}{year}-ATP {match_type[0]} {draw[0]} {match_no}",
                'match_no': match_no,
                'round': round_name,
                'p1': {},
                'p2': {},
                'p3': {},
                'p4': {},
                'bye': False
            }

            match_no += 1

            players = match.find_all('div', class_ = 'name')

            skip1 = False

            for index, player in enumerate(players):
                if player.get_text(strip=True) in ('Bye', 'Bye1'):
                    match_info['bye'] = True
                    if match_type == 'Doubles' and index == 0 and len(players) < 4:
                        skip1 = True
                elif player.get_text(strip=True) in ('Qualifier', 'TBA', 'Alternate'):
                    if match_type == 'Doubles' and index == 0 and len(players) < 4:
                        skip1 = True
                else:
                    try:
                        p_link = player.find('a')
                        id = re.search(r'/([a-zA-Z0-9]{4})/', p_link['href'])
                        match_info[f"p{index + 1 if not skip1 else index + 2}"]['id'] = id.group(1)
                        status_tag = player.find('span')
                        if status_tag:
                            status_text = status_tag.get_text(strip=True).strip("()")
                            # Extract seed
                            seed_text = re.search(r'\d+', status_text)
                            match_info[f"p{index + 1}"]['seed'] = int(seed_text.group()) if seed_text else None
                            # Extract status
                            status_text = re.search(r'[A-Za-z]+', status_text)
                            match_info[f"p{index + 1}"]['status'] = status_text.group() if status_text else None
                    except:
                        pass
            matches.append(match_info)

    driver.quit()

    def add_events(db):
        for match in matches:
            # Base params
            params = {
                'eid': f"{tid}{year}-ATP",
                'mid': match['id'],
                'round': match['round'],
                'match_no': match['match_no'],
                'type': match_type,
                'draw': draw,
                'sets': sets,
                'bye': match['bye']
            }

            # Base query
            query = """
                CYPHER 25
                MATCH (e:Event {id: $eid})-[:ROUND_OF]-(r:Round:$($type):ATP:$($draw) {round: $round})
                MERGE (m:Match:ATP:$($type):$($draw) {id: $mid, match_no: $match_no})
                MERGE (m)-[:PLAYED]->(r)
                CALL (m) {
                    WHEN $bye = true THEN SET m.incomplete = 'B'
                    ELSE SET m:$($sets)
                }
            """

            # Handle P1
            if match['p1'].get('id') is not None:
                query += """
                    MERGE (p1:Player:ATP {id: $p1id})
                    MERGE (f1:Entry:$($type) {id: $entry1})
                    MERGE (s1:Score:T1:$($type):$($draw):ATP {id: $score1})
                    MERGE (p1)-[:ENTERED]->(f1)
                    MERGE (f1)-[:SCORED]->(s1)
                    MERGE (s1)-[:SCORED]->(m)
                """
                params['p1id'] = match['p1']['id']
                params['entry1'] = f"{tid}{year}-ATP {match['p1']['id']}" if match_type == 'Singles' else f"{tid}{year}-ATP {match['p1']['id']} {match['p2']['id']}"
                params['score1'] = f"{match['id']} {match['p1']['id']}" if match_type == 'Singles' else f"{match['id']} {match['p1']['id']} {match['p2']['id']}"

                if match['p1'].get('seed') is not None:
                    params['p1seed'] = match['p1']['seed']
                    if draw == 'Main':
                        query += """
                            SET f1.seed = $p1seed
                            MERGE (f1)-[:SEEDED]->(e)
                        """
                    else:
                        query += """
                            SET f1.q_seed = $p1seed
                            MERGE (f1)-[:Q_SEEDED]->(e)
                        """

                if match['p1'].get('status') is not None:
                    params['p1status'] = match['p1']['status']
                    if draw == 'Main':
                        query += """
                            SET f1.status = $p1status
                        """
                    else:
                        query += """
                            SET f1.q_status = $p1status
                        """

                if match['bye'] == True:
                    query += """
                        SET s1:Winner
                    """

            # Handle P2
            if match['p2'].get('id') is not None:
                query += """
                    MERGE (p2:Player:ATP {id: $p2id})
                """
                params['p2id'] = match['p2']['id']

                if match_type == 'Singles':
                    query += """
                        MERGE (f2:Entry:$($type) {id: $entry2})
                        MERGE (p2)-[:ENTERED]->(f2)
                        MERGE (s2:Score:T2:Singles:$($draw):ATP {id: $score2})
                        MERGE (f2)-[:SCORED]->(s2)
                        MERGE (s2)-[:SCORED]->(m)
                    """
                    params['entry2'] = f"{tid}{year}-ATP {match['p2']['id']}"
                    params['score2'] = f"{match['id']} {match['p2']['id']}"

                    if match['p2'].get('seed') is not None:
                        params['p2seed'] = match['p2']['seed']
                        if draw == 'Main':
                            query += """
                                SET f2.seed = $p2seed
                                MERGE (f2)-[:SEEDED]->(e)
                            """
                        else:
                            query += """
                                SET f2.q_seed = $p2seed
                                MERGE (f2)-[:Q_SEEDED]->(e)
                            """

                    if match['p2'].get('status') is not None:
                        params['p2status'] = match['p2']['status']
                        if draw == 'Main':
                            query += """
                            SET f2.status = $p2status
                        """
                        else:
                            query += """
                                SET f2.q_status = $p2status
                            """

                    if match['bye'] == True:
                        query += "SET s2:Winner"

                elif match_type == 'Doubles':
                    query += """
                        MERGE (p2)-[:ENTERED]->(f1)
                    """

            # Handle Team 2
            if match_type == 'Doubles':
                if match['p3'].get('id') is not None:
                    query += """
                        MERGE (p3:Player:ATP {id: $p3id})
                        MERGE (p4:Player:ATP {id: $p4id})
                        MERGE (f2:Entry:Doubles {id: $entry3})
                        MERGE (s2:Score:T2:Doubles:$($draw):ATP {id: $score2})
                        MERGE (p3)-[:ENTERED]->(f2)
                        MERGE (p4)-[:ENTERED]->(f2)
                        MERGE (f2)-[:SCORED]->(s2)
                        MERGE (s2)-[:SCORED]->(m)
                    """
                    params['p3id'] = match['p3']['id']
                    params['p4id'] = match['p4']['id']
                    params['entry3'] = f"{tid}{year}-ATP {match['p3']['id']} {match['p4']['id']}"
                    params['score2'] = f"{match['id']} {match['p3']['id']} {match['p4']['id']}"

                    if match["p3"].get('seed') is not None:
                        if draw == 'Main':
                            query += """
                                SET f2.seed = $p3seed
                                MERGE (f2)-[:SEEDED]->(e)
                            """
                        else:
                            query += """
                                SET f2.q_seed = $p3seed
                                MERGE (f2)-[:Q_SEEDED]->(e)
                            """
                        params['p3seed'] = match["p3"]['seed']

                    if match["p3"].get('status') is not None:
                        if draw == 'Main':
                            query += """
                                SET f2.status = $p3status
                            """
                        else:
                            query += """
                                SET f2.q_status = $p3status
                            """
                        params['p3status'] = match['p3']['status']

                    if match['bye'] == True:
                        query += """
                            SET s2:Winner
                        """

            db.run(query, **params)

    with GraphDatabase.driver(URI, auth=AUTH) as driver:
        driver.verify_connectivity()
        with driver.session(database="neo4j") as session:
            records = session.execute_write(add_events)

    return jsonify({"ok": True, "tid": tid, "year": year})

# Endpoint to scrape ATP results data
@app.route("/atp_results", methods=['POST'])
def get_atp_results():
    data = request.json
    tid = data.get('tid')
    year = data.get('year')
    year2 = data.get('year2') if data.get('year2') else year
    tid2 = data.get('tid2') if data.get('tid2') else tid
    match_type = data.get('type')
    matches = []
    links = []

    url_slug = 'singles' if match_type == 'Singles' else 'doubles'

    url = f"https://www.atptour.com/en/scores/archive/x/{tid2}/{year2}/results?matchtype={url_slug}"

    driver = webdriver.Chrome()
    driver.get(url)

    WebDriverWait(driver, 10).until(EC.presence_of_all_elements_located((By.CLASS_NAME, 'content')))

    layout = driver.find_element(By.CLASS_NAME, 'atp_accordion-items').get_attribute('innerHTML')

    driver.quit()

    soup = BeautifulSoup(layout, 'html.parser')

    containers = soup.find_all('div', class_='atp_accordion-item')

    for container in containers:
        date_container = container.find('h4')
        date_obj = None
        if date_container:
            stripped_date = re.match(r"([A-Za-z]{3}, \d{2} [A-Za-z]+, \d{4})", date_container.get_text(strip=True))
            date_obj = datetime.strptime(stripped_date.group(1), "%a, %d %B, %Y") if stripped_date else None

        matches_details = container.find_all('div', class_='match')

        for match in matches_details:

            # Get match details
            header_div = match.find('div', class_='match-header')
            match_headers = header_div.find_all('span')

            match_header = match_headers[0].get_text(strip=True)
            parts = [p.strip() for p in match_header.split(' - ', 1)]
            court_name = parts[1] if len(parts) > 1 else None
            match_time = match_headers[1].get_text(strip=True) if len(match_headers) > 1 else '00:00:00'
            hours, minutes, seconds = map(int, match_time.split(':')) if len(match_time.split(':')) == 3 else (int(match_time.split(':')[0]), int(match_time.split(':')[1]), 0)

            match_detail = {
                'court': court_name,
                'hours': hours,
                'minutes': minutes,
                'seconds': seconds
            }

            if not date_obj is None:
                match_detail['date'] = date_obj.strftime("%Y-%m-%d")

            # Get umpire
            umpire_container = match.find('div', class_='match-umpire')
            if umpire_container:
                umpire_text = umpire_container.get_text(strip=True).removeprefix('Ump: ')
                if umpire_text != "":
                    match_detail['umpire'] = umpire_text

            players_container = match.find_all('div', class_='name')

            for idx, player in enumerate(players_container):
                link = player.find('a')
                if link.get_text(strip=True) == 'Bye':
                    continue
                else:
                    id = re.search("/([a-zA-Z0-9]{4})/", link['href'])
                    # if id is None:
                    #     if link.get_text(strip=True) == 'Marcus Willis':
                    #         match_detail[f"p{idx + 1}"] = 'w521'
                    # else:
                    match_detail[f"p{idx + 1}"] = id.group(1)

            try:
                stats_link = match.find('a', string='Stats').get('href')
                links.append(stats_link)
            except:
                continue

            matches.append(match_detail)

    def add_results(db):

        for match in matches:
            if (match_type == 'Doubles' and match.get('p3') is None) or (match_type == 'Singles' and match.get('p1') is None):
                continue
            else:
                params = {
                    "p1id": match['p1'],
                    "p2id": match['p2'] if match_type == 'Singles' else match['p3'],
                    "eid": f"{tid}{year}-ATP",
                    "court": match['court'],
                    "hours": match['hours'],
                    "minutes": match['minutes'],
                    "seconds": match['seconds'],
                    'type': match_type
                }


                # query = f"""
                #     MATCH (:Player:ATP {{id: $p1id}})-[]-(:Entry:Doubles)-[]-(s1:Score)-[]-(m:Doubles:ATP:Main)-[]-(s2:Score)-[]-(:Entry:Doubles)-[]-(:Player:ATP {{id: $p3id}})
                #     WHERE m.id STARTS WITH $eid
                #     SET m.duration = duration({{hours: $hours, minutes: $minutes}}), s1:Winner, s2:Loser
                # """
                query = f"""
                    CYPHER 25
                    MATCH (:Player:ATP {{id: $p1id}})-[]-(:Entry:$($type))-[]-(s1:Score)-[]-(m:$($type):ATP)-[]-(s2:Score)-[]-(:Entry:$($type))-[]-(:Player:ATP {{id: $p2id}})
                    WHERE m.id STARTS WITH $eid
                    SET m.court = $court, m.duration = duration({{hours: $hours, minutes: $minutes, seconds: $seconds}}), s1:Winner, s2:Loser
                """

                if match.get('date') is not None:
                    query += """
                        SET m.date = date($date)
                    """
                    params['date'] = match['date']

                if match.get('umpire') is not None:
                    query += """
                        OPTIONAL MATCH (u:Umpire) WHERE apoc.text.compareCleaned(u.id, $umpire)
                        CALL (u, m) {
                            WHEN u IS NULL THEN {
                                MERGE (u1:Umpire {id: $umpire})
                                MERGE (u1)-[:UMPIRED]->(m)
                            } ELSE {
                                MERGE (u)-[:UMPIRED]->(m)
                            }
                        }
                    """
                    params['umpire'] = match['umpire']

                # query = f"""
                #     MATCH (:Player:ATP {{id: $p1id}})-[]-(f1:Entry:Doubles)-[]-(s1:Score)-[]-(m:Doubles:ATP)-[]-(s2:Score)-[]-(:Entry:Doubles)-[]-(:Player:ATP {{id: $p3id}})
                #     WHERE m.id CONTAINS $eid
                #     MATCH (:Player:ATP {{id: $p2id}})-[]-(f2:Entry:Doubles)-[]-(s1)
                #     MATCH (m)-[]-(r:Round)-[]-(e:Event)
                #     MERGE (u:Umpire {{id: $umpire}})
                #     MERGE (u)-[:UMPIRED]->(m)
                #     SET m.date = date($date), m.court = $court, m.duration = duration({{hours: $hours, minutes: $minutes, seconds: $seconds}}), s1:Winner, s2:Loser
                #     WITH f1, f2, m, e
                #     WHERE m.match_no > 1
                #     MATCH (m2:Doubles:ATP {{match_no: floor(m.match_no / 2)}})-[]-(:Round:Doubles:ATP)-[]-(e)
                #     MERGE (s:Score {{id: m2.id + ' ' + p.id}})
                #     MERGE (f1)-[:SCORED]->(s)
                #     MERGE (f2)-[:SCORED]->(s)
                #     MERGE (s)-[:SCORED]->(m2)
                #     WITH s, m
                #     FOREACH (ignoreMe IN CASE WHEN m.match_no % 2 = 1 THEN [1] ELSE [] END |
                #     SET s:T2)
                #     FOREACH (ignoreMe IN CASE WHEN m.match_no % 2 = 0 THEN [1] ELSE [] END |
                #     SET s:T1)
                # """

                db.run(query, **params)

    with GraphDatabase.driver(URI, auth=AUTH) as driver:
        with driver.session(database="neo4j") as session:
            records = session.execute_write(add_results)

    return jsonify({"ok": True, "links": links})

# Endpoint to scrape ATP match stats
@app.route("/atp_stats", methods=['POST'])
def get_atp_stats():
    data = request.json
    eid = data.get('eid')
    match_type = data.get('type')
    links = data.get('links')
    matches = []

    driver = webdriver.Chrome()

    for match in links:
        print(match)
        try:
            driver.get(f"https://www.atptour.com{match}")
            time.sleep(10)

            WebDriverWait(driver, 10).until(EC.presence_of_all_elements_located((By.CLASS_NAME, 'RGMatchStats')))

            layout = driver.find_element(By.CLASS_NAME, 'atp_layout-container').get_attribute('innerHTML')
            soup = BeautifulSoup(layout, 'html.parser')

            match_info = {
                'p1': {},
                'p2': {}
            }

            # Get players
            stats_box = soup.find_all('div', class_='stats-item')
            for idx, stat in enumerate(stats_box):
                player = stat.find('div', class_='name')
                p_link = player.find('a')
                p_id = re.search(r'/([a-zA-Z0-9]{4})/', p_link['href']).group(1)
                match_info[f"p{idx + 1}_id"] = p_id

                scores_items = stat.find_all('div', class_='score-item')
                for i, score in enumerate(scores_items):
                    spans = score.find_all('span')
                    match_info[f"p{idx + 1}"][f"s{i + 1}"] = int(spans[0].get_text(strip=True))
                    if len(spans) > 1:
                        match_info[f"p{idx + 1}"][f"t{i + 1}"] = int(spans[1].get_text(strip=True))

            # Get stats
            stats_dictionary = {
                'Aces': 'aces',
                'Double Faults': 'dfs',
                '1st serve points won': ['serve1_w', 'serve1', 'ret1_w', 'ret1'],
                '2nd serve points won': ['serve2_w', 'serve2', 'ret2_w', 'ret2'],
                'Break Points Saved': ['bps_saved', 'bps_faced', 'bps_converted', 'bp_opps'],
                'Net points won': ['net_w', 'net'],
                'Winners': 'winners',
                'Unforced Errors': 'ues',
                'Max Speed': 'max_speed',
                '1st Serve Average Speed': 'avg1_speed',
                '2nd Serve Average Speed': 'avg2_speed',
                'Service Games Played': 'serve_games',
                'Return Games Played': 'return_games'
            }
            individual_stats = soup.find_all('div', class_='desktopView')
            for stat in individual_stats:
                stat_label = stat.find('div', class_='labelWrappper').get_text(strip=True)
                if stats_dictionary.get(stat_label) is not None:
                    if stat_label in ('Max Speed', '1st Serve Average Speed', '2nd Serve Average Speed'):
                        key = stats_dictionary[stat_label]
                        p1_stat = stat.find('div', class_='speedkmh1').get_text(strip=True)
                        p2_stat = stat.find('div', class_='speedkmh2').get_text(strip=True)
                        match_info['p1'][key] = int(re.search(r'\d{2,3}', p1_stat).group()) if re.search(r'\d{2,3}', p1_stat) is not None else None
                        match_info['p2'][key] = int(re.search(r'\d{2,3}', p2_stat).group()) if re.search(r'\d{2,3}', p2_stat) is not None else None
                    else:
                        p1_stat = stat.find('div', class_='player1').get_text(strip=True)
                        p2_stat = stat.find('div', class_='player2').get_text(strip=True)
                        if stat_label in ('Aces', 'Double Faults', 'Winners', 'Unforced Errors', 'Service Games Played', 'Return Games Played'):
                            key = stats_dictionary[stat_label]
                            match_info['p1'][key] = int(p1_stat)
                            match_info['p2'][key] = int(p2_stat)
                        elif stat_label == 'Net points won':
                            key1, key2 = stats_dictionary[stat_label]
                            p1_stripped = re.search(r'\b(\d{1,3})/(\d{1,3})\b', p1_stat)
                            p2_stripped = re.search(r'\b(\d{1,3})/(\d{1,3})\b', p2_stat)
                            match_info['p1'][key1] = int(p1_stripped.group(1))
                            match_info['p1'][key2] = int(p1_stripped.group(2))
                            match_info['p2'][key1] = int(p2_stripped.group(1))
                            match_info['p2'][key2] = int(p2_stripped.group(2))
                        else:
                            key1, key2, key3, key4 = stats_dictionary[stat_label]
                            p1_stripped = re.search(r'\b(\d{1,3})/(\d{1,3})\b', p1_stat)
                            p2_stripped = re.search(r'\b(\d{1,3})/(\d{1,3})\b', p2_stat)
                            match_info['p1'][key1] = int(p1_stripped.group(1))
                            match_info['p1'][key2] = int(p1_stripped.group(2))
                            match_info['p2'][key3] = int(p1_stripped.group(2)) - int(p1_stripped.group(1))
                            match_info['p2'][key4] = int(p1_stripped.group(2))
                            match_info['p2'][key1] = int(p2_stripped.group(1))
                            match_info['p2'][key2] = int(p2_stripped.group(2))
                            match_info['p1'][key3] = int(p2_stripped.group(2)) - int(p2_stripped.group(1))
                            match_info['p1'][key4] = int(p2_stripped.group(2))

            matches.append(match_info)
        except ValueError:
            print(ValueError)
            break

    driver.quit()

    def add_stats(db):
        for match in matches:
            result = db.run("""
                MATCH (:Player:ATP {id: $p1})-[]-(:Entry:$($type))-[]-(s1:Score)-[]-(m:$($type):ATP)-[]-(s2:Score)-[]-(:Entry:$($type))-[]-(:Player:ATP {id: $p2})
                WHERE m.id STARTS WITH $eid
                SET s1 += $p1_stats, s2 += $p2_stats
                """, p1=match['p1_id'], p2=match['p2_id'], type=match_type, eid=f"{eid}-ATP", p1_stats=match['p1'], p2_stats=match['p2'])

    with GraphDatabase.driver(URI, auth=AUTH) as driver:
        with driver.session(database="neo4j") as session:
            records = session.execute_write(add_stats)

    return jsonify({"ok": True, "eid": eid, "matches": len(matches)})

# Endpoint to scrape ATP results data
@app.route("/atp_activity", methods=['POST'])
def get_atp_activity():
    data = request.json
    tid = data.get('tid')
    tid2 = data.get('tid2') if data.get('tid2') else tid
    year = data.get('year')
    year2 = data.get('year2') if data.get('year2') else year
    match_type = data.get('type')
    category = data.get('category')
    players = data.get('players')
    activity = []

    driver = webdriver.Chrome()

    for player in players:
        driver.get(f"https://www.atptour.com/en/players/x/{player}/player-activity?matchType={match_type}&year={year2}&tournament={tid2}_{category}")

        player_activity = {
            'player': player
        }

        WebDriverWait(driver, 10).until(EC.presence_of_all_elements_located((By.CLASS_NAME, 'atp_player-activity')))

        layout = driver.find_element(By.CLASS_NAME, 'atp_player-activity').get_attribute('innerHTML')
        soup = BeautifulSoup(layout, 'html.parser')

        tournament_rows = soup.find_all('div', class_='tournament')

        if len(tournament_rows) == 1:
            row = tournament_rows[0]
        elif len(tournament_rows) > 1:
            target_row = None
            for row in tournament_rows:
                a_tag = row.find('a', href=True)
                if a_tag and f"/{tid2}/overview" in a_tag['href']:
                    target_row = row
                    break

            if not target_row:
                print(f"No activity found for {player}")
                continue

            row = target_row
        else:
            print(f"No activity found for {player}")
            continue

        footer = row.next_sibling

        if not footer or footer == "":
            print(f"No activity found for {player}")
            continue

        footer_text = footer.get_text(strip=True).split(', ')
        for text in footer_text:
            label, value = text.split(':')
            if label == 'Points':
                player_activity['points'] = int(value.strip())
            elif label == 'ATP Ranking':
                player_activity['rank'] = int(value.strip())
            elif label == 'Prize Money':
                for prefix in [' $', ' €', ' £', ' A$']:
                    if value.startswith(prefix):
                        value = value.removeprefix(prefix)
                        break
                player_activity['pm'] = int(value.strip().replace(',', ''))

        activity.append(player_activity)

    driver.quit()

    def add_activity(db):
        for act in activity:
            query = """
                MATCH (p:Player {id: $player})-[t:ENTERED]->(f:Entry:$($type) WHERE f.id STARTS WITH $entry_id)
                SET t.rank = $rank, f.pm = $pm, f.points = $points
            """

            params = {
                'player': act['player'],
                'type': match_type,
                'entry_id': f"{tid}{year}-ATP",
                'rank': act.get('rank'),
                'pm': act.get('pm'),
                'points': act.get('points')
            }
            db.run(query, **params)

    with GraphDatabase.driver(URI, auth=AUTH) as driver:
        with driver.session(database="neo4j") as session:
            records = session.execute_write(add_activity)

    return jsonify({"ok": True})

if __name__ == "__main__":
    app.run(debug=True)