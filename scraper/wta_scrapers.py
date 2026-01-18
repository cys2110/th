from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from bs4 import BeautifulSoup
from neo4j import GraphDatabase
from dotenv import load_dotenv
from datetime import datetime
import os
import re
import json
import time
from server import app
from flask import Flask, jsonify, request

# Loading neo4j authentication details
load_status = load_dotenv("Neo4j-a4c75a44-Created-2025-03-21.txt")
if load_status is False:
    raise RuntimeError('Environment variables not loaded.')
URI = os.getenv("NEO4J_URI")
AUTH = (os.getenv("NEO4J_USERNAME"), os.getenv("NEO4J_PASSWORD"))

@app.route('/wta_player/<player_id>', methods=['GET'])
def get_wta_player(player_id):
    player = { 'id': player_id }

    driver = webdriver.Chrome()
    driver.get(f"https://www.wtatennis.com/players/{player['id']}/x")
    time.sleep(3)

    WebDriverWait(driver, 10).until(EC.presence_of_all_elements_located((By.CLASS_NAME, 'page-grid-wrapper')))

    header_html = driver.find_element(By.CLASS_NAME, 'page-hero').get_attribute('innerHTML')
    main_html = driver.find_element(By.CLASS_NAME, 'page-content').get_attribute('innerHTML')

    driver.quit()

    header = BeautifulSoup(header_html, 'html.parser')
    main = BeautifulSoup(main_html, 'html.parser')

    stats_block = header.select_one('section')
    script_block = header.find('script', type='application/ld+json')
    name_tag = header.select_one('h1.profile-header__name')
    country = ""
    bio_block = main.find_all('div', class_ = 'profile-bio__info-block')

    if stats_block:
        stats_details = stats_block.get('data-player-stats')
        if stats_details:
            parsed = json.loads(stats_details)
            career_stats = parsed['career']
            ytd_stats = parsed['ytd']

            singlesHighRank = career_stats['singles']['highRankDate']
            singlesDate = datetime.strptime(singlesHighRank, "%d %b %y") if singlesHighRank else None
            player['singles_ch_date'] = singlesDate.strftime("%Y-%m-%d")
            doublesHighRank = career_stats['doubles']['highRankDate']
            doublesDate = datetime.strptime(doublesHighRank, "%d %b %y") if doublesHighRank else None
            player['doubles_ch_date'] = doublesDate.strftime("%Y-%m-%d")
            player['ch_singles'] = None if career_stats['singles']['rank'] == '-' else int(career_stats['singles']['rank'])
            player['ch_doubles'] = None if career_stats['doubles']['rank'] == '-' else int(career_stats['doubles']['rank'])
            player['pm'] = 0 if career_stats['prizeMoney'] == '-' else int(career_stats['prizeMoney'])

            player['current_singles'] = None if ytd_stats['singles']['rank'] == '-' else int(ytd_stats['singles']['rank'])
            player['current_doubles'] = None if ytd_stats['doubles']['rank'] == '-' else int(ytd_stats['doubles']['rank'])

    else:
        print("No stats block found")

    if script_block:
        country_mapping = {
            'Czech Republic': 'Czechia',
            'The Netherlands': 'Netherlands',
            'Republic of Egypt': 'Egypt',
            'Korea (South)': 'South Korea',
            'Macedonia': 'North Macedonia',
            'Hong-Kong, China': 'Hong Kong'
        }
        try:
            data = json.loads(script_block.string)
            country_text = data.get('nationality')
            country = country_mapping[country_text] if country_text in country_mapping else country_text
            player['dob'] = data.get('birthDate')
        except json.JSONDecodeError as e:
            print(f"Error decoding JSON: {e}")
    else:
        print("No script block found")

    if name_tag:
        parts = list(name_tag.stripped_strings)
        player['first_name'], player['last_name'] = parts
    else:
        print("No name tag found")

    if bio_block:
        plays_detail = bio_block[0].find('span', class_ = 'profile-bio__info-content')
        if plays_detail:
            plays = plays_detail.get_text(strip=True)
            player['rh'] = 'Right' if plays == 'Right-Handed' else 'Left' if plays == 'Left-Handed' else None

        height_detail = bio_block[2].find('span', class_ = 'profile-bio__info-content')
        if height_detail:
            height_m_string = re.search(r'(\d+(?:\.\d+)?\s*m)', height_detail.get_text(strip=True))
            if height_m_string:
                m_str = height_m_string.group(1)
                meters = float(m_str.rstrip('m'))
                player['height'] = int(meters * 100)

    def addResults(db):
        params = {
            'player': player,
            'country': country
        }

        query = f"""
            MATCH (c:Country {{name: $country}})
            MATCH (p:Player:WTA {{id: $player.id}})
            MERGE (p)-[:REPRESENTS]->(c)
            SET p.first_name = $player.first_name, p.last_name = $player.last_name, p.ch_singles = $player.ch_singles, p.ch_doubles = $player.ch_doubles, p.current_singles = $player.current_singles, p.current_doubles = $player.current_doubles, p.pm = $player.pm, p.site_link = 'https://www.wtatennis.com/players/' || p.id || '/' || toLower($player.first_name) || '-' || toLower($player.last_name), p.singles_ch_date = date($player.singles_ch_date), p.doubles_ch_date = date($player.doubles_ch_date), p.updated_at = date()
        """

        if player.get('dob') is not None:
            query += """
                SET p.dob = date($player.dob)
            """

        if player.get('height') is not None:
            query += """
                SET p.height = $player.height
            """

        if player.get('rh') is not None:
            query += """
                SET p.rh = $player.rh
            """

        db.run(query, **params)

    with GraphDatabase.driver(URI, auth=AUTH) as driver:
        with driver.session(database="neo4j") as session:
            records = session.execute_write(addResults)

    return jsonify({"success": True, "player_id": player_id})

@app.route('/wta_draw', methods=['POST'])
def get_draw():
    data = request.json
    tid = data.get('tid')
    year = data.get('year')
    year2 = data.get('year2') if data.get('year2') else year
    wid = data.get('tid2') if data.get('tid2') else tid
    matches = []

    driver = webdriver.Chrome()
    driver.get(f"https://www.wtatennis.com/tournaments/{wid}/x/{year2}/draws")

    WebDriverWait(driver, 10).until(EC.presence_of_all_elements_located((By.CLASS_NAME, 'tournament-draw__round-container-scrollbar')))

    all_layouts = driver.find_element(By.CSS_SELECTOR, 'section.tournament-draw').get_attribute('innerHTML')
    soup = BeautifulSoup(all_layouts, 'html.parser')

    draw_containers = soup.find_all('div', class_='tournament-draw__tab')

    for draw_layout in draw_containers:
        draw_type = draw_layout.get('data-event-type')
        draw_mapping = {
            'LS': ['Main', 'Singles'],
            'LD': ['Main', 'Doubles'],
            'RS': ['Qualifying', 'Singles']
        }

        round_mapping = {
            128: 'Round of 128',
            64: 'Round of 64',
            32: 'Round of 32',
            16: 'Round of 16',
            8: 'Quarterfinals',
            4: 'Semifinals',
            2: 'Final'
        }

        rounds = draw_layout.find_all('div', class_ = 'tournament-draw__round-container')

        for idx, round in enumerate(rounds):
            round_number = int(round.get('data-round'))
            round_name = round_mapping.get(round_number) if draw_type != 'RS' else f"Qualifying round {idx + 1}"

            matches_container = round.find_all('div', class_ = 'tournament-draw__match-table')

            for index, match_container in enumerate(matches_container):
                if draw_type != 'RS':
                    match_no = int((round_number // 2) + index)
                else:
                    if idx == len(rounds) - 1:
                        match_no = 1 + index
                    else:
                        match_no = int((round_number // 4) + 1 + index)

                match_info = {
                    'eid': f"{tid}{year}-WTA",
                    'id': f"{tid}{year}-WTA {match_no}",
                    'draw': draw_mapping[draw_type][0],
                    'type': draw_mapping[draw_type][1],
                    'match_no': match_no,
                    'round': round_name,
                    'p1': None,
                    'p2': None,
                    'p3': None,
                    'p4': None,
                    'p1_seed': None,
                    'p2_seed': None,
                    'p1_score': {},
                    'p2_score': {},
                    'bye': False,
                    'winner': None
                }

                match = match_container.find('div', class_ = 'js-tennis-match-wta')
                if match:
                    match_info['winner'] = match.get('data-winner-id')

                    player_rows = match.find_all('tr', class_ = 'match-table__row')

                    for i, player_row in enumerate(player_rows):
                        player_data_ids = player_row.get('data-player-row-id')
                        if player_data_ids == 'player':
                            match_info['bye'] = True
                        else:
                            player_ids = player_data_ids.removeprefix('player-').split('-')
                            match_info[f"p{i + 1}"] = player_ids[0]
                            if len(player_ids) > 1:
                                match_info[f"p{i + 3}"] = player_ids[1]

                            seed_tag = player_row.find('span', class_ = 'match-table__player-seed')
                            if seed_tag:
                                seed_text = seed_tag.get_text(strip=True).strip("()")
                                match_info[f"p{i + 1}_seed"] = int(seed_text) if seed_text.isdigit() else None

                            for j in range(1, 4):
                                score_tag = player_row.find('td', class_ = f"js-score-set-{j}{'a' if i == 0 else 'b'}")

                                if score_tag:
                                    # Extract tie-break text if it exists
                                    tb_tag = score_tag.find('sup', class_="match-table__tie-break")
                                    if tb_tag:
                                        tb_text = tb_tag.get_text(strip=True)
                                        match_info[f"p{i + 1}_score"][f't{j}'] = int(tb_text)
                                        tb_tag.decompose()  # Remove the <sup> tag from score_tag so it doesn't affect .get_text()

                                    score_text = score_tag.get_text(strip=True)
                                    if score_text:
                                        match_info[f"p{i + 1}_score"][f's{j}'] = int(score_text) if score_text.isdigit() else None
                matches.append(match_info)
    driver.quit()

    def add_events(db):
        for match in matches:
            params = match
            params['s1_label'] = 'Winner' if match.get('winner') is not None and (match['winner'] == match['p1'] or match['winner'] == match['p3']) else 'Loser' if match.get('winner') is not None else None
            params['s2_label'] = 'Winner' if match.get('winner') is not None and (match['winner'] == match['p2'] or match['winner'] == match['p4']) else 'Loser' if match.get('winner') is not None else None
            params['f1_id'] = f"{match['eid']} {match['p1']}" if match['type'] == 'Singles' else f"{match['eid']} {match['p1']} {match['p3']}"
            params['f2_id'] = f"{match['eid']} {match['p2']}" if match['type'] == 'Singles' else f"{match['eid']} {match['p2']} {match['p4']}"
            params['s1_id'] = f"{match['id']} {match['p1']}" if match['type'] == 'Singles' else f"{match['id']} {match['p1']} {match['p3']}"
            params['s2_id'] = f"{match['id']} {match['p2']}" if match['type'] == 'Singles' else f"{match['id']} {match['p2']} {match['p4']}"

            # Base query
            query = """
                CYPHER 25
                MATCH (e:Event {id: $eid})-[:ROUND_OF]-(r:Round:WTA:$($type):$($draw) {round: $round})
                MERGE (m:Match:WTA:$($type):$($draw) {id: $id, match_no: $match_no})
                MERGE (m)-[:PLAYED]->(r)

                CALL (m) {
                    WHEN $bye = true THEN SET m.incomplete = 'B'
                    ELSE SET m:Best3
                }
            """

            # Handle P1
            if match.get('p1') is not None:
                query += """
                    MERGE (p1:Player:WTA {id: $p1})
                    MERGE (f1:Entry:$($type) {id: $f1_id})
                    MERGE (s1:Score:WTA:T1:$($type):$($draw) {id: $s1_id})
                    SET s1 += $p1_score
                    MERGE (p1)-[:ENTERED]->(f1)
                    MERGE (f1)-[:SCORED]->(s1)
                    MERGE (s1)-[:SCORED]->(m)

                    CALL (f1, e) {
                        WHEN $p1_seed IS NOT NULL AND $draw = 'Main' THEN {
                            SET f1.seed = $p1_seed
                            MERGE (f1)-[:SEEDED]->(e)
                        }
                        WHEN $p1_seed IS NOT NULL AND $draw = 'Qualifying' THEN {
                            SET f1.q_seed = $p1_seed
                            MERGE (f1)-[:Q_SEEDED]->(e)
                        }
                    }

                    CALL (s1) {
                        WHEN $bye = true THEN SET s1:Winner
                        WHEN $s1_label IS NOT NULL THEN SET s1:$($s1_label)
                    }

                    CALL (s1, e) {
                        WHEN $type = 'Doubles' THEN {
                            MERGE (p3:Player:WTA {id: $p3})
                            MERGE (p3)-[:ENTERED]->(f1)
                        }
                    }
                """

            # Handle P2
            if match.get('p2') is not None:
                query += """
                    MERGE (p2:Player:WTA {id: $p2})
                    MERGE (f2:Entry:$($type) {id: $f2_id})
                    MERGE (s2:Score:WTA:T2:$($type):$($draw) {id: $s2_id})
                    SET s2 += $p2_score
                    MERGE (p2)-[:ENTERED]->(f2)
                    MERGE (f2)-[:SCORED]->(s2)
                    MERGE (s2)-[:SCORED]->(m)

                    CALL (f2, e) {
                        WHEN $p2_seed IS NOT NULL AND $draw = 'Main' THEN {
                            SET f2.seed = $p2_seed
                            MERGE (f2)-[:SEEDED]->(e)
                        }
                        WHEN $p2_seed IS NOT NULL AND $draw = 'Qualifying' THEN {
                            SET f2.q_seed = $p2_seed
                            MERGE (f2)-[:Q_SEEDED]->(e)
                        }
                    }

                    CALL (s2) {
                        WHEN $bye = true THEN SET s2:Winner
                        WHEN $s2_label IS NOT NULL THEN SET s2:$($s2_label)
                    }

                    CALL (s2, e) {
                        WHEN $type = 'Doubles' THEN {
                            MERGE (p4:Player:WTA {id: $p4})
                            MERGE (p4)-[:ENTERED]->(f2)
                        }
                    }
                """

            db.run(query, **params)

    with GraphDatabase.driver(URI, auth=AUTH) as driver:
        with driver.session(database="neo4j") as session:
            records = session.execute_write(add_events)

    return jsonify({"success": True, 'tid': tid, 'year': year})

@app.route('/wta_stats', methods=['POST'])
def get_wta_stats():
    data = request.json
    wid = data.get('wid')
    year = data.get('year')
    eid = data.get('eid')
    draw_type = data.get('draw')
    match_type = data.get('type')
    range_start, range_end = data.get('draw_range')
    skip = data.get('skip') if data.get('skip') else []
    matches = []

    driver = webdriver.Chrome()

    urlPrefix = 'LS' if match_type == 'Singles' and draw_type == 'Main' else 'LD' if match_type == 'Doubles' and draw_type == 'Main' else 'RS'

    for i in range(range_start, range_end):
        if i not in skip:
            print(i)
            match_no = f"00{i}" if i < 10 else f"0{i}" if i < 100 else str(i)
            try:
                driver.get(f"https://www.wtatennis.com/tournaments/{wid}/x/{year}/scores/{urlPrefix}{match_no}")
                time.sleep(10)

                WebDriverWait(driver, 10).until(EC.presence_of_all_elements_located((By.CLASS_NAME, 'page-background')))

                match_container = driver.find_element(By.CSS_SELECTOR, 'section.mc-live-score')
                match_soup = BeautifulSoup(match_container.get_attribute('innerHTML'), 'html.parser')

                match_stats_container = driver.find_element(By.ID, 'match-stats').get_attribute('innerHTML')
                match_stats_soup = BeautifulSoup(match_stats_container, 'html.parser')

                match_info_container = driver.find_element(By.ID, 'match-details').get_attribute('innerHTML')
                match_info_soup = BeautifulSoup(match_info_container, 'html.parser')

                match_info = {
                    'p1': {},
                    'p2': {}
                }

                # Get match details
                player_ids = match_container.get_attribute('data-player-ids')
                match_info['p1_id'], match_info['p2_id'] = player_ids.split(', ')
                match_time = match_soup.find('div', class_ = 'tennis-match__status-time').get_text(strip=True)
                match_info['hours'], match_info['minutes'] = map(int, match_time.removeprefix('Finished: ').split(':'))
                match_info_details = match_info_soup.find_all('div', class_ = 'match-info__row')
                for detail in match_info_details:
                    detail_label = detail.find('div', class_ = 'match-info__title')
                    if detail_label.get_text(strip=True) == 'Start Time':
                        long_date = detail.find('div', class_ = 'match-info__value').get_text(strip=True)
                        parsed_date = datetime.strptime(long_date, "%a %d %b %Y")
                        match_info['date'] = parsed_date.strftime("%Y-%m-%d")
                    elif detail_label.get_text(strip=True) == 'Court':
                        court_string = detail.find('div', class_ = 'match-info__value').get_text(strip=True)
                        if court_string != '-':
                            match_info['court'] = court_string


                # Get stats
                match_stats = match_stats_soup.find('div', class_ = 'js-match-stats')
                service_stats = match_stats.find('h3', string= 'Service')

                if service_stats:
                    stats_block = service_stats.find_next_sibling('div', class_ = 'compare-stats-block__list')
                    stats_dictionary = {
                        'Aces': 'aces',
                        'Double Faults': 'dfs',
                        '1st Serve Points Won': ['serve1_w', 'serve1', 'ret1_w', 'ret1'],
                        '2nd Serve Points Won': ['serve2_w', 'serve2', 'ret2_w', 'ret2'],
                        'Break Points Saved': ['bps_saved', 'bps_faced', 'bps_converted', 'bp_opps'],
                        'Service Games Played': ['serve_games', 'return_games']
                    }
                    match_stats_rows = stats_block.find_all('div', class_ = 'compare-stats-block__row')
                    for row in match_stats_rows:
                        columns = row.find_all('div', class_ = 'compare-stats-block__content-col')
                        label = columns[1].get_text(strip=True)

                        if stats_dictionary.get(label) is not None:
                            p1_stat = columns[0].get_text(strip=True)
                            p2_stat = columns[2].get_text(strip=True)

                            if label in ('Aces', 'Double Faults'):
                                key = stats_dictionary[label]
                                match_info['p1'][key] = int(p1_stat)
                                match_info['p2'][key] = int(p2_stat)
                            elif label == 'Service Games Played':
                                key1, key2 = stats_dictionary[label]
                                match_info['p1'][key1] = int(p1_stat)
                                match_info['p2'][key1] = int(p2_stat)
                                match_info['p1'][key2] = int(p2_stat)
                                match_info['p2'][key2] = int(p1_stat)
                            else:
                                key1, key2, key3, key4 = stats_dictionary[label]
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
            params = {
                'p1_id': match['p1_id'],
                'p2_id': match['p2_id'],
                'eid': f"{eid}-WTA",
                'p1_stats': match['p1'],
                'p2_stats': match['p2'],
                'date': match['date'],
                'hours': match['hours'],
                'minutes': match['minutes'],
                'draw': draw_type,
                'type': match_type,
                'court': match.get('court', None)
            }

            query = """
                MATCH (:Player:WTA {id: $p1_id})-[]-(:Entry:$($type))-[]-(s1:Score)-[]-(m:WTA:$($draw) WHERE m.id STARTS WITH $eid)-[]-(s2:Score)-[]-(:Entry:$($type))-[]-(:Player:WTA {id: $p2_id})
                SET s1 += $p1_stats, s2 += $p2_stats, m.date = date($date), m.duration = duration({hours: $hours, minutes: $minutes}), m.court = $court
            """

            db.run(query, **params)

    with GraphDatabase.driver(URI, auth=AUTH) as driver:
        with driver.session(database="neo4j") as session:
            records = session.execute_write(add_stats)

    return jsonify({"success": True, 'wid': wid, 'year': year})

if __name__ == '__main__':
    app.run(debug=True)