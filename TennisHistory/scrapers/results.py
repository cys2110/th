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
from datetime import datetime
from lib import round_name_mapping

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

# Endpoint to scrape ATP results
@app.route("/atp/results", methods=["POST"])
def get_atp_results():
    data = request.json

    tournament_id = data.get('tournament_id')
    event_id = data.get('event_id')
    year = data.get('year')

    match_type = data.get('match_type')

    matches = []
    links = []

    url_slug = 'singles' if match_type == 'Singles' else 'doubles'

    url = f"https://www.atptour.com/en/scores/archive/x/{tournament_id}/{year}/results?matchtype={url_slug}"

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
            round_name = round_name_mapping.get(parts[0])
            court_name = parts[1] if len(parts) > 1 else None
            match_time = match_headers[1].get_text(strip=True) if len(match_headers) > 1 else '00:00:00'

            match_detail = {
                'round': round_name,
                'court': court_name,
                'duration': match_time,
                'date': date_obj.strftime("%Y-%m-%d") if date_obj is not None else None,
                'sets': []
            }

            if date_obj is not None:
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
                    match_detail["bye"] = True
                else:
                    id = re.search("/([a-zA-Z0-9]{4})/", link['href'])
                    # if id is None:
                    #     if link.get_text(strip=True) == 'Marcus Willis':
                    #         match_detail[f"p{idx + 1}"] = 'w521'
                    # else:
                    match_detail[f"p{idx + 1}"] = id.group(1)

            # Get scores
            scores_container = match.find_all('div', class_='scores')
            for idx, score_container in enumerate(scores_container):
                scores_items = score_container.find_all('div', class_='score-item')
                setNumber = 0
                for i, score in enumerate(scores_items):
                    spans = score.find_all('span')
                    if (len(spans) > 0):
                        match_detail['sets'].append({
                            'set_no': setNumber + i + 1,
                            'set': int(spans[0].get_text(strip=True)),
                            'tb': int(spans[1].get_text(strip=True)) if len(spans) > 1 else None,
                            'entry_id': 'p1' if idx == 0 else 'p2'
                        })
                    else:
                        setNumber -= 1

            try:
                stats_link = match.find('a', string='Stats').get('href')
                links.append(stats_link)
            except:
                pass

            matches.append(match_detail)

    failed_matches = []

    for match in matches:
        # Get match id
        winner_id = f"{event_id} {match['p1']}" if match_type == 'Singles' else f"{event_id} {match['p1']} {match['p2']}"
        loser_id = f"{event_id} {match['p2']}" if match_type == 'Singles' else f"{event_id} {match['p3']} {match['p4']}"

        try:
            matchesResponse = (supabase
                .table("matches")
                .select("id, rounds!inner(round)")
                .eq("rounds.round", match['round'])
                .eq("rounds.event_id", event_id)
                .in_("team_1_id", [winner_id, loser_id])
                .in_("team_2_id", [winner_id, loser_id])
                .single()
                .execute()
            )

            if match.get('umpire'):
                # Get umpire id
                umpiresResponse = (supabase
                    .rpc("search_people", { "search_term": match["umpire"] })
                    .execute()
                )

            if matchesResponse.data is not None:
                response = (supabase
                    .table("matches")
                    .update({
                        'court': match.get('court'),
                        'duration': match.get('duration'),
                        'date': match.get('date'),
                        'winner_id': winner_id,
                        'loser_id': loser_id,
                        'umpire_id': umpiresResponse.data[0]['id'] if umpiresResponse.data else None
                    })
                    .eq("id", matchesResponse.data['id'])
                    .execute()
                )

                if len(match['sets']) > 0:
                    for match_set in match['sets']:
                        match_set['entry_id'] = winner_id if match_set['entry_id'] == 'p1' else loser_id
                        match_set['match_id'] = matchesResponse.data['id']

                    scoresResponse = (supabase
                        .table("match_scores")
                        .insert(match['sets'])
                        .execute()
                    )
        except Exception as e:
            failed_matches.append(match)
            print(e)
            pass

    print("failed", failed_matches)

    return jsonify({'success': True, "links": links})