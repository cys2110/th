import os
import re
import time
import json
from server import app
from flask import jsonify, request
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from supabase import create_client
from pathlib import Path
from datetime import datetime

# Loading supabase authentication details
env_path = Path(__file__).resolve().parent / ".env"
print("Loading:", env_path)

load_status = load_dotenv(env_path, override=True)
print("Loaded:", load_status)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

print("SUPABASE_URL:", SUPABASE_URL)
print("SUPABASE_KEY exists:", bool(SUPABASE_KEY))

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

@app.route("/atp/stats", methods=["POST"])
def get_atp_stats():
    data = request.json
    event_id = data.get('event_id')
    links = data.get('links')
    matches = []

    driver = webdriver.Chrome()

    failed_links = []

    for match in links:
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
            players_container = soup.find(id="Stat-header")
            def extract_team_id(container):
                links = container.select('.name a')
                ids = [
                    match.group(1).lower()
                    for link in links
                    if (match := re.search(r'/([a-zA-Z0-9]{4})/', link.get('href', '')))
                ]
                return f"{event_id} {' '.join(ids)}"

            team1_id = extract_team_id(players_container.select_one('.team1'))
            team2_id = extract_team_id(players_container.select_one('.team2'))
            match_info['p1']['entry_id'] = team1_id
            match_info['p2']['entry_id'] = team2_id

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
        except Exception as e:
            failed_links.append(match)
            print(e)
            pass

    driver.quit()

    matchesToInsert = []
    failed_matches = []

    for match in matches:
        try:
            # Get match id
            matchesResponse = (
                supabase
                .table("matches")
                .select("id, rounds!inner(event_id)")
                .eq("team_1_id", match['p1']['entry_id'])
                .eq("team_2_id", match['p2']['entry_id'])
                .eq("rounds.event_id", event_id)
                .single()
                .execute()
            )

            if matchesResponse.data is not None:
                match['p1']['match_id'] = matchesResponse.data['id']
                match['p2']['match_id'] = matchesResponse.data['id']
                matchesToInsert.append(match['p1'])
                matchesToInsert.append(match['p2'])
        except Exception as e:
            failed_matches.append(match)
            print(e)
            pass

    if len(matchesToInsert) > 0:
        supabase.table("match_stats").insert(matchesToInsert).execute()

    print("failed matches", failed_matches)

    return jsonify({"success": True, "matches": matches, "failed_links": failed_links})

# Endpoint to scrape old ATP matches
@app.route("/atp/old-matches", methods=['POST'])
def scrape_old_atp_matches():
    data = request.json
    event_id = data['event_id']
    # match_type = data['match_type']
    links = data['links']
    failed_links = []

    matches = []

    driver = webdriver.Chrome()

    for link in links:
        try:
            driver.get(f"https://www.atptour.com{link}")
            time.sleep(10)

            layout = driver.find_element(By.CLASS_NAME, 'atp_match-stats').get_attribute('innerHTML')
            soup = BeautifulSoup(layout, 'html.parser')

            match = {
                't1': {},
                't2': {}
            }

            # Get players
            player_1_box = soup.find('div', class_='player-team')
            player_2_box = soup.find('div', class_='opponent-team')

            player_1_link = player_1_box.find('a')
            player_2_link = player_2_box.find('a')

            player_1_id = re.search(r'/([a-zA-Z0-9]{4})/', player_1_link['href']).group(1)
            player_2_id = re.search(r'/([a-zA-Z0-9]{4})/', player_2_link['href']).group(1)

            match['t1']['entry_id'] = f"{event_id} {player_1_id}"
            match['t2']['entry_id'] = f"{event_id} {player_2_id}"

            # Get stats
            stats_dictionary = {
                'Aces': 'aces',
                'Double Faults': 'dfs',
                '1st Serve Points Won': ['serve1_w', 'serve1', 'ret1_w', 'ret1'],
                '2nd Serve Points Won': ['serve2_w', 'serve2', 'ret2_w', 'ret2'],
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

            match_stats_container = soup.find('div', class_='stas-internal--match')

            stats_items = match_stats_container.find_all('li')

            for stat in stats_items:
                stat_label = stat.find('div', class_='stats-item-legend').get_text(strip=True)

                if stats_dictionary.get(stat_label) is not None:
                    if stat_label in ('Max Speed', '1st Serve Average Speed', '2nd Serve Average Speed'):
                        key = stats_dictionary[stat_label]
                        p1_stat = stat.find('div', class_='speedkmh1').get_text(strip=True)
                        p2_stat = stat.find('div', class_='speedkmh2').get_text(strip=True)
                        match['t1'][key] = int(re.search(r'\d{2,3}', p1_stat).group())
                        match['t2'][key] = int(re.search(r'\d{2,3}', p2_stat).group())
                    else:
                        p1_stat_container = stat.find('div', class_='player-stats-item')
                        p1_stat = p1_stat_container.find('div', class_='value').get_text(strip=True)
                        p2_stat_container = stat.find('div', class_='opponent-stats-item')
                        p2_stat = p2_stat_container.find('div', class_='value').get_text(strip=True)
                        if stat_label in ('Aces', 'Double Faults', 'Winners', 'Unforced Errors', 'Service Games Played', 'Return Games Played'):
                            key = stats_dictionary[stat_label]
                            match['t1'][key] = int(p1_stat) if p1_stat else 0
                            match['t2'][key] = int(p2_stat) if p2_stat else 0
                        elif stat_label == 'Net points won':
                            key1, key2 = stats_dictionary[stat_label]
                            p1_stripped = re.search(r'\b(\d{1,3})/(\d{1,3})\b', p1_stat)
                            p2_stripped = re.search(r'\b(\d{1,3})/(\d{1,3})\b', p2_stat)
                            match['t1'][key1] = int(p1_stripped.group(1))
                            match['t1'][key2] = int(p1_stripped.group(2))
                            match['t2'][key1] = int(p2_stripped.group(1))
                            match['t2'][key2] = int(p2_stripped.group(2))
                        else:
                            key1, key2, key3, key4 = stats_dictionary[stat_label]
                            p1_stripped = re.search(r'\b(\d{1,3})/(\d{1,3})\b', p1_stat)
                            p2_stripped = re.search(r'\b(\d{1,3})/(\d{1,3})\b', p2_stat)
                            match['t1'][key1] = int(p1_stripped.group(1)) if p1_stripped else 0
                            match['t1'][key2] = int(p1_stripped.group(2)) if p1_stripped else 0
                            match['t2'][key3] = int(p1_stripped.group(2)) - int(p1_stripped.group(1)) if p1_stripped else 0
                            match['t2'][key4] = int(p1_stripped.group(2)) if p1_stripped else 0
                            match['t2'][key1] = int(p2_stripped.group(1)) if p2_stripped else 0
                            match['t2'][key2] = int(p2_stripped.group(2)) if p2_stripped else 0
                            match['t1'][key3] = int(p2_stripped.group(2)) - int(p2_stripped.group(1)) if p2_stripped else 0
                            match['t1'][key4] = int(p2_stripped.group(2)) if p2_stripped else 0

            matches.append(match)
        except Exception as e:
            failed_links.append(link)
            print(e)
            pass

    driver.quit()

    print("failed links:", failed_links)

    rows = []

    for match in matches:
        try:
            response = (supabase.table("matches").select("id, rounds!inner(event_id)").eq("rounds.event_id", event_id).eq("team_1_id", match['t1']['entry_id']).eq("team_2_id", match['t2']['entry_id']).single().execute())

            if response.data is not None:
                rows.append({**match['t1'], 'match_id': response.data['id']})
                rows.append({**match['t2'], 'match_id': response.data['id']})
        except Exception as e:
            print(e)
            pass

    try:
        response = (supabase.table("match_stats").insert(rows).execute())
    except Exception as e:
        print(e)
        pass

    return jsonify(matches)

def get_wta_ids(competitor):
    player_link = competitor.get('@id')
    if not player_link:
        return None

    try:
        return player_link.split('/players/')[1].split('/')[0]
    except:
        return None

@app.route('/wta/stats', methods=['POST'])
def get_wta_stats():
    data = request.json
    tournament_id = data.get('tournament_id')
    year = data.get('year')
    event_id = data.get('event_id')
    draw_type = data.get('draw')
    match_type = data.get('match_type')
    range_start, range_end = data.get('draw_range')
    skip = data.get('skip') if data.get('skip') else []
    matches = []
    match_stats = []
    failed_matches = []

    driver = webdriver.Chrome()

    urlPrefix = 'LS' if match_type == 'Singles' and draw_type == 'Main' else 'LD' if match_type == 'Doubles' and draw_type == 'Main' else 'RS'

    for i in range(range_start, range_end):
        if i not in skip:
            match_no = f"00{i}" if i < 10 else f"0{i}" if i < 100 else str(i)
            try:
                driver.get(f"https://www.wtatennis.com/tournaments/{tournament_id}/x/{year}/scores/{urlPrefix}{match_no}")
                time.sleep(5)

                WebDriverWait(driver, 10).until(EC.presence_of_all_elements_located((By.CLASS_NAME, 'page-background')))

                header_html = driver.find_element(By.CSS_SELECTOR, 'header.page-hero').get_attribute('innerHTML')
                header = BeautifulSoup(header_html, 'html.parser')

                match_stats_container = driver.find_element(By.ID, 'match-stats').get_attribute('innerHTML')
                match_stats_soup = BeautifulSoup(match_stats_container, 'html.parser')

                script_block = header.find('script', type='application/ld+json')

                match_info = {
                    'p1': {},
                    'p2': {}
                }

                # Get match details
                if script_block:
                    details_json = json.loads(script_block.string)
                    competitors = details_json.get('performer')
                    date = details_json.get('endDate')
                    additional_info = details_json.get('additionalProperty')

                    if date:
                        match_info['date'] = date

                    if competitors:
                        team1 = competitors[0:len(competitors)//2]
                        entry_1_id = f"{event_id} {' '.join([get_wta_ids(competitor) for competitor in team1])}"
                        match_info['team_1_id'] = entry_1_id

                        team2 = competitors[len(competitors)//2:]
                        entry_2_id = f"{event_id} {' '.join([get_wta_ids(competitor) for competitor in team2])}"
                        match_info['team_2_id'] = entry_2_id

                    if additional_info:
                        # Get court
                        court = next((info for info in additional_info if info['name'] == 'Court'), None)
                        if court:
                            match_info['court'] = court['value']

                        # Get duration
                        duration = next((info for info in additional_info if info['name'] == 'Match Duration'), None)
                        if duration:
                            match_info['duration'] = duration['value']

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
                failed_matches.append(i)
                print(ValueError)
                break

    driver.quit()

    matchStatsToInsert = []

    for match in matches:
        try:
            # Get match id
            matches_response = (
                supabase
                .table("matches")
                .select("id, rounds!inner(event_id)")
                .eq("team_1_id", match['team_1_id'])
                .eq("team_2_id", match["team_2_id"])
                .eq("rounds.event_id", event_id)
                .single()
                .execute()
            )

            if matches_response.data is not None:
                update_response = (
                    supabase
                    .table("matches")
                    .update({ "date": match.get("date"), "court": match.get("court"), "duration": match.get("duration")})
                    .eq("id", matches_response.data['id'])
                    .execute()
                )
                matchStatsToInsert.append({
                    **match['p1'],
                    "match_id": matches_response.data['id'],
                    'entry_id': match['team_1_id']
                })
                matchStatsToInsert.append({
                    **match['p2'],
                    "match_id": matches_response.data['id'],
                    'entry_id': match['team_2_id']
                })

        except Exception as e:
            failed_matches.append(match)
            print(e)
            pass

    if len(matchStatsToInsert) > 0:
        supabase.table("match_stats").insert(matchStatsToInsert).execute()

    return jsonify({"success": True, 'failed_matches': failed_matches })