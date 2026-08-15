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
from supabase.lib.client_options import SyncClientOptions
from pathlib import Path
from datetime import datetime

# Loading supabase authentication details
env_path = Path(__file__).resolve().parent / ".env"
print("Loading:", env_path)

load_status = load_dotenv(env_path, override=True)
print("Loaded:", load_status)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SECRET_KEY") or os.getenv("SUPABASE_KEY")

print("SUPABASE_URL:", SUPABASE_URL)
print("SUPABASE_KEY prefix:", SUPABASE_KEY[:10] if SUPABASE_KEY else None)

supabase = create_client(
    SUPABASE_URL,
    SUPABASE_KEY,
    options=SyncClientOptions(
        auto_refresh_token=False,
        persist_session=False,
    )
)

SELENIUM_REMOTE_URL = os.getenv("SELENIUM_REMOTE_URL", "http://localhost:4444/wd/hub")

def create_remote_chrome_driver():
    options = webdriver.ChromeOptions()
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--no-sandbox")

    driver = webdriver.Remote(
        command_executor=SELENIUM_REMOTE_URL,
        options=options
    )
    driver.set_page_load_timeout(30)

    return driver

# Endpoint to scrape old ATP matches
@app.route("/atp/old-matches", methods=['POST'])
def scrape_old_atp_matches():
    data = request.json
    event_id = data['event_id']
    links = data['links']
    failed_links = []

    matches = []

    for link in links:
        driver = None

        try:
            driver = create_remote_chrome_driver()
            driver.get(link)
            time.sleep(10)

            WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.CLASS_NAME, 'atp_match-stats')))

            layout = driver.find_element(By.CLASS_NAME, 'atp_match-stats').get_attribute('innerHTML')
            soup = BeautifulSoup(layout, 'html.parser')

            match = {
                't1': {},
                't2': {}
            }

            # Get players
            players_info = soup.find_all('div', class_='player-info')

            player_1_link, player_2_link = [info.find('a') for info in players_info]

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
        except TimeoutException as e:
            failed_links.append(link)
            print(f"Could not locate atp_match-stats for {link}: {e}")
        except Exception as e:
            failed_links.append(link)
            print(e)
        finally:
            if driver:
                driver.quit()

    print("failed links:", failed_links)

    rows = []

    for match in matches:
        try:
            response = (supabase
                .table("matches")
                .select("id, rounds!inner(event_id, round)")
                .eq("rounds.event_id", event_id)
                .eq("winner_id", match['t1']['entry_id'])
                .eq("loser_id", match['t2']['entry_id'])
                .single()
                .execute())

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

    return jsonify({ 'matches': matches, 'success': True})

@app.route("/rg-matches", methods=['POST'])
def scrape_rg_matches():
    data = request.json
    event_id = data['event_id']
    links = data['links']

    matches = []
    failed_links = []

    driver = webdriver.Chrome()

    for link in links:
        try:
            driver.get(link)

            def handle_cookies():
                wait = WebDriverWait(driver, timeout=20)
                try:
                    banner = wait.until(EC.visibility_of_element_located((By.ID, 'popin_tc_privacy_container_button')))
                    if banner.is_displayed():
                        driver.find_element(By.ID, 'popin_tc_privacy_button_3').click()
                except TimeoutException:
                    return False

            handle_cookies()
            time.sleep(2)

            link_parts = link.split('/')
            slug = link_parts[-1]

            part_1 = slug[0]
            tour = slug[1]
            match_no = int(slug[2:])

            draw = 'Qualifying' if part_1 == 'Q' else 'Main'

            match_info = {
                'draw': draw,
                'tour': 'ATP' if tour == 'M' else 'WTA',
                'match_type': 'Doubles' if part_1 == 'D' else 'Singles',
                'match_no': match_no if draw == 'Main' else match_no - 15,
                'sets': [],
                'p1': {},
                'p2': {}
            }

            WebDriverWait(driver, 10).until(EC.presence_of_all_elements_located((By.TAG_NAME, 'main')))

            header = driver.find_element(By.CLASS_NAME, 'new-player-picture-content').get_attribute('innerHTML')
            stats_wrapper = driver.find_element(By.ID, 'MatchStats')
            all_button = stats_wrapper.find_element(By.CLASS_NAME, 'feature-tile-action').click()
            stats_section = stats_wrapper.find_element(By.ID, 'Stats_RG2022').get_attribute('innerHTML')


            header_soup = BeautifulSoup(header, 'html.parser')
            stats_soup = BeautifulSoup(stats_section, 'html.parser')

            match_info['court'] = header_soup.find('span', class_='courtNameBold').get_text(strip=True)
            match_info['round'] = header_soup.find('span', class_='roundLabel').get_text(strip=True)
            duration_wrapper = header_soup.find('span', class_='duration').get_text(strip=True)
            match_info['duration'] = f"{duration_wrapper.replace('h', ':').removeprefix('- ')}:00"

            date_wrapper = header_soup.find('span', class_='schedule-date').get_text(strip=True)
            cleaned = re.sub(r'(\d+)(st|nd|rd|th)', r'\1', date_wrapper)
            dt = datetime.strptime(cleaned, "%B %d, %Y")
            match_info['date'] = dt.strftime("%Y-%m-%d")

            player_wrappers = header_soup.find_all('div', class_='result-content')

            winner_index = next(
                (i for i, wrapper in enumerate(player_wrappers)
                if 'winner' in wrapper.get('class', [])),
                None
            )

            match_info['winner'] = winner_index + 1

            score_wrappers = header_soup.find_all('div', class_='group-sets')

            for idx, stat in enumerate(score_wrappers):
                set_items = stat.find_all('div', class_='set')
                for i, score in enumerate(set_items):
                    set_info = {
                        'player': idx + 1,
                        'set_no': i + 1
                    }

                    tb_score_wrapper = score.find('sup')
                    if tb_score_wrapper:
                        tb_score = tb_score_wrapper.get_text(strip=True)
                        set_info['set'] = int(score.get_text(strip=True).removesuffix(tb_score))
                        set_info['tb'] = int(tb_score)
                    else:
                        set_info['set'] = int(score.get_text(strip=True))

                    match_info['sets'].append(set_info)

            # Get stats
            stats_dictionary = {
                'Aces': 'aces',
                'Double faults': 'dfs',
                'Win on 1st serve': ['serve1_w', 'serve1', 'ret1_w', 'ret1'],
                'Win on 2nd serve': ['serve2_w', 'serve2', 'ret2_w', 'ret2'],
                'Break Points Converted': ['bps_saved', 'bps_faced', 'bps_converted', 'bp_opps'],
                'Net points won': ['net_w', 'net'],
                'Winners': 'winners',
                'Unforced errors': 'ues',
                'Max Speed': 'max_speed',
                '1st Serve Average Speed': 'avg1_speed',
                '2nd Serve Average Speed': 'avg2_speed'
            }
            individual_stats = stats_soup.find_all('div', class_='rfk-statTileWrapper')
            for stat in individual_stats:
                stat_label_wrapper = stat.find('div', class_='rfk-labelbold')
                if stat_label_wrapper:
                    stat_label = stat_label_wrapper.get_text(strip=True)
                    if stats_dictionary.get(stat_label) is not None:
                        if stat_label in ('Max Speed', '1st Serve Average Speed', '2nd Serve Average Speed'):
                            key = stats_dictionary[stat_label]
                            p1_stat_wrapper = stat.find('div', class_='rfk-speedkmh1')
                            p1_stat = p1_stat_wrapper.find('div', class_='rfk-value').get_text(strip=True)
                            p2_stat_wrapper = stat.find('div', class_='rfk-speedkmh2')
                            p2_stat = p2_stat_wrapper.find('div', class_='rfk-value').get_text(strip=True)
                            match_info['p1'][key] = int(p1_stat) if p1_stat.isdigit() else None
                            match_info['p2'][key] = int(p2_stat) if p2_stat.isdigit() else None
                        else:
                            p1_stat_wrapper = stat.find('div', class_='rfk-player1')
                            p2_stat_wrapper = stat.find('div', class_='rfk-player2')
                            if stat_label in ('Aces', 'Double faults', 'Winners', 'Unforced errors'):
                                key = stats_dictionary[stat_label]
                                p1_stat = p1_stat_wrapper.get_text(strip=True)
                                p2_stat = p2_stat_wrapper.get_text(strip=True)
                                match_info['p1'][key] = int(p1_stat) if p1_stat.isdigit() else None
                                match_info['p2'][key] = int(p2_stat) if p2_stat.isdigit() else None
                            else:
                                p1_stat = p1_stat_wrapper.find('div', class_="rfk-unhighlighted").get_text(strip=True)
                                p2_stat = p2_stat_wrapper.find('div', class_="rfk-unhighlighted").get_text(strip=True)
                                p1_w, p1_total = p1_stat.split('/')
                                p2_w, p2_total = p2_stat.split('/')
                                if stat_label == 'Net points won':
                                    key1, key2 = stats_dictionary[stat_label]
                                    match_info['p1'][key1] = int(p1_w) if p1_w.isdigit() else None
                                    match_info['p1'][key2] = int(p1_total) if p1_total.isdigit() else None
                                    match_info['p2'][key1] = int(p2_w) if p2_w.isdigit() else None
                                    match_info['p2'][key2] = int(p2_total) if p2_total.isdigit() else None
                                else:
                                    key1, key2, key3, key4 = stats_dictionary[stat_label]
                                    match_info['p1'][key1] = int(p1_w) if p1_w.isdigit() else None
                                    match_info['p1'][key2] = int(p1_total) if p1_total.isdigit() else None
                                    match_info['p2'][key3] = int(p1_total) - int(p1_w)
                                    match_info['p2'][key4] = int(p1_total) if p1_total.isdigit() else None
                                    match_info['p2'][key1] = int(p2_w) if p2_w.isdigit() else None
                                    match_info['p2'][key2] = int(p2_total) if p2_total.isdigit() else None
                                    match_info['p1'][key3] = int(p2_total) - int(p2_w)
                                    match_info['p1'][key4] = int(p2_total) if p2_total.isdigit() else None

            matches.append(match_info)
        except Exception as e:
            failed_links.append(link)
            print(f"Could not locate rg_match-stats for {link}: {e}")

    driver.quit()

    print("Failed links:", failed_links)

    qualifying_round_mapping = {
        'third round': 'Qualifying round 3',
        'second round': 'Qualifying round 2',
        'first round': 'Qualifying round 1'
    }

    singles_round_mapping = {
        'final': 'Final',
        'semifinals': 'Semifinals',
        'quarterfinals': 'Quarterfinals',
        'fourth round': 'Round of 16',
        'third round': 'Round of 32',
        'second round': 'Round of 64',
        'first round': 'Round of 128'
    }

    doubles_round_mapping = {
        'final': 'Final',
        'semifinals': 'Semifinals',
        'quarterfinals': 'Quarterfinals',
        'third round': 'Round of 16',
        'second round': 'Round of 32',
        'first round': 'Round of 64'
    }

    for match in matches:
        try:
            # Fetch match round
            round_response = (supabase
                .table('rounds')
                .select("id")
                .eq('event_id', event_id)
                .eq('round', qualifying_round_mapping[match['round']] if match['draw'] == 'Qualifying' else singles_round_mapping[match['round']] if match['match_type'] == 'Singles' else doubles_round_mapping[match['round']])
                .eq('match_type', match['match_type'])
                .eq('tour', match['tour'])
                .single()
                .execute())

            if not round_response.data:
                raise Exception("Round not found")

            round_id = round_response.data['id']

            # Fetch match
            match_response = (supabase
                .table('matches')
                .select('id, team_1_id, team_2_id')
                .eq('round_id', round_id)
                .eq('match_no', match['match_no'])
                .eq('draw', match['draw'])
                .eq('tour', match['tour'])
                .eq('match_type', match['match_type'])
                .single()
                .execute())

            if not match_response.data:
                raise Exception("Match not found")

            match_id = match_response.data['id']

            update_match_response = (supabase
                .table('matches')
                .update({
                    'court': match['court'],
                    'date': match['date'],
                    'duration': match['duration'],
                    'winner_id': match_response.data['team_1_id'] if match['winner'] == 1 else match_response.data['team_2_id'],
                    'loser_id': match_response.data['team_1_id'] if match['winner'] == 2 else match_response.data['team_2_id'],
                })
                .eq('id', match_id)
                .execute())

            if not update_match_response.data:
                print("Could not update match", match)

            insert_set_response = (supabase
                .table('match_scores')
                .insert([
                    {
                        'match_id': match_id,
                        'entry_id': match_response.data['team_1_id'] if set['player'] == 1 else match_response.data['team_2_id'],
                        'set_no': set['set_no'],
                        'set': set['set'],
                        'tb': set.get('tb'),
                    } for set in match['sets']
                ])
                .execute())

            if not insert_set_response.data:
                print("Could not insert sets for", match)

            if match['p1'].get('serve1'):
                insert_stats_response = (supabase
                    .table('match_stats')
                    .insert([
                        {**match['p1'], 'match_id': match_id, 'entry_id': match_response.data['team_1_id']},
                        {**match['p2'], 'match_id': match_id, 'entry_id': match_response.data['team_2_id']}
                    ])
                    .execute())

                if not insert_stats_response.data:
                    print("Could not insert stats for", match)

        except Exception as e:
            print("Error scraping", match, e)

    return jsonify({ 'success': True, 'failed_links': failed_links, 'matches': matches })