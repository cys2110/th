import os
import re
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
from lib import round_name_mapping, extract_atp_id_from_link

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

# Endpoint to scrape ATP draws
@app.route("/atp/draws", methods=["POST"])
def get_atp_draw():
    data = request.json

    tournament_id = data.get("tournament_id")
    event_id = data.get("event_id")
    year = data.get("year")

    draw_size = data.get("draw_size")
    match_type = data.get("match_type")
    draw = data.get("draw")
    match_format = data.get("format")

    matches = []

    # Fetch rounds
    rounds_response = (
        supabase
        .table("rounds")
        .select("id, round")
        .eq("event_id", event_id)
        .eq("match_type", match_type)
        .execute()
    )

    entries = {}
    player_entry_mapping = {}
    seeds = {}
    statuses = {}

    url_slug = ""
    if match_type == 'Singles':
        url_slug = 'singles' if draw == 'Main' else 'qualifiersingles'
    elif match_type == 'Doubles':
        url_slug = 'doubles' if draw == 'Main' else 'qualifierdoubles'

    url = f"https://www.atptour.com/en/scores/archive/x/{tournament_id}/{year}/draws?matchtype={url_slug}"

    driver = webdriver.Chrome()
    driver.get(url)

    WebDriverWait(driver, 10).until(EC.presence_of_all_elements_located((By.CLASS_NAME, 'atp-draw-container')))
    layout = driver.find_element(By.CLASS_NAME, 'atp-draw-container').get_attribute('innerHTML')

    soup = BeautifulSoup(layout, 'html.parser')

    driver.quit()

    round_mapping = {
        'Final': 1,
        'Semifinals': 2,
        'Quarterfinals': 4,
        'Round of 16': 8,
        'Round of 32': 16,
        'Round of 64': 32,
        'Round of 128': 64
    }

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
        # Get round id
        round_header = round.find('div', class_='draw-header')
        round_name = round_name_mapping[round_header.get_text(strip=True)]
        round_id = next((round for round in rounds_response.data if round["round"] == round_name), None)['id']

        # Get matches
        match_no = round_mapping[round_name]
        round_matches = round.find_all('div', class_='draw-stats')
        for match in round_matches:
            match_info = {
                'match_no': match_no,
                'round_id': round_id,
                'tour': 'ATP',
                'match_type': match_type,
                'draw': draw,
                'format': match_format
            }

            match_no += 1

            teams = match.find_all('div', class_ = 'player-info')

            for index, team in enumerate(teams):
                players = team.find_all('div', class_ = 'name')

                entry_id = f"{event_id}"
                entry_info = {}
                player_ids = []

                for idx, player in enumerate(players):
                    player_text = player.get_text(strip=True)

                    if player_text in ('Bye', 'Bye1'):
                        match_info['incomplete'] = 'B'
                    elif not player_text in ('Qualifier', 'TBA', 'Alternate'):
                        player_link = player.find('a')
                        player_id = extract_atp_id_from_link(player_link['href'])

                        entry_id += f" {player_id}"
                        player_ids.append(player_id)

                    # Get seed and status if first player in team
                    if idx == 0:
                        entry_info_tag = player.find('span')

                        if entry_info_tag:
                            entry_info_text = entry_info_tag.get_text(strip=True).strip("()")

                            # Extract seed
                            seed_text = re.search(r'\d+', entry_info_text)
                            if seed_text:
                                entry_info['seed'] = int(seed_text.group())

                            # Extract status
                            status_text = re.search(r'[A-Za-z]+', entry_info_text)
                            if status_text:
                                entry_info['status'] = status_text.group().replace('Alt', 'AL')

                if len(player_ids):
                    match_info[f"team_{index + 1}_id"] = entry_id

                    entries[entry_id] = {
                        'id': entry_id,
                        'match_type': match_type,
                        'event_id': event_id
                    }

                    for id in player_ids:
                        player_entry_mapping[id] = {
                            'player_id': id,
                            'entry_id': entry_id
                        }

                    if entry_info.get('seed'):
                        seeds[entry_id] = {
                            'event_id': event_id,
                            'entry_id': entry_id,
                            'seed': entry_info['seed'],
                            'draw': draw,
                            'match_type': match_type
                        }

                    if entry_info.get('status'):
                        statuses[entry_id] = {
                            'event_id': event_id,
                            'entry_id': entry_id,
                            'status': entry_info['status'],
                            'draw': draw
                        }

            matches.append(match_info)

    entries_to_insert = list(entries.values())
    mappings_to_insert = list(player_entry_mapping.values())
    seeds_to_insert = list(seeds.values())
    statuses_to_insert = list(statuses.values())

    # Insert entries
    try:
        entries_response = (
            supabase
            .table("entries")
            .upsert(entries_to_insert, on_conflict="id")
            .execute()
        )
    except Exception as e:
        print(e)
        raise

    # Insert mappings
    try:
        mappings_response = (
            supabase
            .table("player_entry_mapping")
            .upsert(mappings_to_insert, on_conflict="player_id,entry_id")
            .execute()
        )
    except Exception as e:
        print(e)
        raise

    # Create seeds
    try:
        seeds_response = (
            supabase
            .table("seeds")
            .insert(seeds_to_insert)
            .execute()
        )
    except Exception as e:
        print(e)

    # Create statuses
    try:
        statuses_response = (
            supabase
            .table("statuses")
            .insert(statuses_to_insert)
            .execute()
        )
    except Exception as e:
        print(e)

    try:
        matches_response = (
            supabase
            .table("matches")
            .insert(matches)
            .execute()
        )
    except Exception as e:
        print(e)
        raise

    return jsonify({ "success": True, 'matches': matches_response.data, 'entries': entries_response.data, 'mappings': mappings_response.data, 'seeds': seeds_response.data, 'statuses': statuses_response.data })

@app.route("/wta/draws", methods=["POST"])
def get_draw():
    data = request.json
    tournament_id = data.get("tournament_id")
    event_id = data.get("event_id")
    year = data.get('year')
    matches = []

    entries = {}
    player_entry_mapping = {}
    seeds = {}
    scores = []

    draw_mapping = {
        'LS': ['Main', 'Singles'],
        'LD': ['Main', 'Doubles'],
        'RS': ['Qualifying', 'Singles']
    }

    # Fetch rounds
    rounds_response = (
        supabase
        .table("rounds")
        .select("id, round, match_type")
        .eq("event_id", event_id)
        .execute()
    )

    driver = webdriver.Chrome()
    driver.get(f"https://www.wtatennis.com/tournaments/{tournament_id}/x/{year}/draws")

    WebDriverWait(driver, 10).until(EC.presence_of_all_elements_located((By.CLASS_NAME, 'tournament-draw__round-container-scrollbar')))

    all_layouts = driver.find_element(By.CSS_SELECTOR, 'section.tournament-draw').get_attribute('innerHTML')
    soup = BeautifulSoup(all_layouts, 'html.parser')

    draw_containers = soup.find_all('div', class_='tournament-draw__tab')

    for draw_layout in draw_containers:
        draw_type = draw_layout.get('data-event-type')

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

            round_id = next((round for round in rounds_response.data if round['round'] == round_name and draw_mapping[draw_type][1] == round['match_type']), None)['id']

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
                    'match_no': match_no,
                    'round_id': round_id,
                    'tour': 'WTA',
                    'match_type': draw_mapping[draw_type][1],
                    'draw': draw_mapping[draw_type][0],
                    'format': 3
                }

                match = match_container.find('div', class_ = 'js-tennis-match-wta')
                if match:
                    winner_id = f"{event_id}"
                    singles_winner_id = match.get('data-winner-id')
                    doubles_winner_id = match.get('data-double-winner-id')

                    if singles_winner_id:
                        winner_id += f" {singles_winner_id}"

                    if doubles_winner_id:
                        winner_id += f" {doubles_winner_id}"

                    match_info['winner_id'] = winner_id

                    player_rows = match.find_all('tr', class_ = 'match-table__row')

                    for i, player_row in enumerate(player_rows):
                        player_data_ids = player_row.get('data-player-row-id')
                        if player_data_ids == 'player':
                            match_info['incomplete'] = 'B'
                        else:
                            player_ids = player_data_ids.removeprefix('player-').split('-')
                            entry_id = f"{event_id} {(' ').join(player_ids)}"
                            match_info[f"team_{i + 1}_id"] = entry_id

                            entries[entry_id] = {
                                'id': entry_id,
                                'match_type': draw_mapping[draw_type][1],
                                'event_id': event_id
                            }

                            for p in player_ids:
                                player_entry_mapping[f"{p} {entry_id}"] = {
                                    'player_id': p,
                                    'entry_id': entry_id
                                }

                            seed_tag = player_row.find('span', class_ = 'match-table__player-seed')

                            if seed_tag:
                                seed_text = seed_tag.get_text(strip=True).strip("()")
                                seeds[entry_id] = {
                                    'event_id': event_id,
                                    'entry_id': entry_id,
                                    'seed': int(seed_text) if seed_text.isdigit() else None,
                                    'draw': draw_mapping[draw_type][0],
                                    'match_type': draw_mapping[draw_type][1]
                                }

                            for j in range(1, 4):
                                score_tag = player_row.find('td', class_ = f"js-score-set-{j}{'a' if i == 0 else 'b'}")

                                if score_tag:
                                    score_info = {
                                        'entry_id': entry_id,
                                        'set_no': j,
                                        'match_no': match_no,
                                        'draw': draw_mapping[draw_type][0],
                                        'match_type': draw_mapping[draw_type][1]
                                    }

                                    # Extract tie-break text if it exists
                                    tb_tag = score_tag.find('sup', class_="match-table__tie-break")
                                    if tb_tag:
                                        tb_text = tb_tag.get_text(strip=True)
                                        score_info['tb'] = int(tb_text) if tb_text.isdigit() else None
                                        tb_tag.decompose()  # Remove the <sup> tag from score_tag so it doesn't affect .get_text()

                                    score_text = score_tag.get_text(strip=True)
                                    if score_text:
                                        score_info['set'] = int(score_text) if score_text.isdigit() else None

                                    if score_info.get('set'):
                                        scores.append(score_info)

                if match_info.get('team_1_id') and match_info.get('team_2_id'):
                    match_info['loser_id'] = match_info['team_1_id'] if match_info['winner_id'] == match_info['team_2_id'] else match_info['team_2_id']
                matches.append(match_info)
    driver.quit()

    # entries fields
    try:
        entries_response = (
            supabase
            .table("entries")
            .insert(list(entries.values()))
            .execute()
        )
    except Exception as e:
        print(e)
        raise

    # pem fields
    try:
        pem_response = (
            supabase
            .table("player_entry_mapping")
            .insert(list(player_entry_mapping.values()))
            .execute()
        )
    except Exception as e:
        print(e)
        raise

    # seed fields
    try:
        seed_response = (
            supabase
            .table("seeds")
            .insert(list(seeds.values()))
            .execute()
        )
    except Exception as e:
        print(e)
        raise

    # match fields
    try:
        match_response = (
            supabase
            .table("matches")
            .insert(matches)
            .execute()
        )
    except Exception as e:
        print(e)
        raise

    failed_scores = []
    scoresToInsert = []

    # match_scores
    for score in scores:
        corresponding_match = next((match for match in match_response.data if match['match_no'] == score['match_no'] and match['draw'] == score['draw'] and match['match_type'] == score['match_type']), None)

        if corresponding_match:
            scoresToInsert.append({
                'match_id': corresponding_match['id'],
                'entry_id': score['entry_id'],
                'set_no': score['set_no'],
                'set': score['set'],
                'tb': score.get('tb')
            })
        else:
            failed_scores.append(score)
            continue

    try:
        score_response = (
            supabase
            .table("match_scores")
            .insert(scoresToInsert)
            .execute()
        )
    except Exception as e:
        print(e)
        raise

    print("failed scores:", failed_scores)

    return jsonify({"success": True, 'matches': match_response.data, 'entries': entries_response.data, 'pem': pem_response.data, 'seeds': seed_response.data, 'scores': score_response.data})