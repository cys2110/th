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
@app.route("/atp/player/<player_id>", methods=['GET'])
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
        'ch_singles_date': None,
        'current_doubles': None,
        'ch_doubles': None,
        'ch_doubles_date': None
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
        params['ch_singles_date'] = singles_ch_text.group(2).replace('.', '-') if singles_ch_text else None

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
        params['ch_doubles_date'] = doubles_ch_text.group(2).replace('.', '-') if doubles_ch_text else None

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

    try:
        response = (supabase.table("players")
            .update({
                "bh": params.get("bh"),
                "ch_doubles": params.get("ch_doubles"),
                "ch_doubles_date": params.get("ch_doubles_date"),
                "ch_singles": params.get("ch_singles"),
                "ch_singles_date": params.get("ch_singles_date"),
                "current_singles": params.get("current_singles"),
                "current_doubles": params.get("current_doubles"),
                "dob": params.get("dob"),
                "turned_pro": params.get("year"),
                "height": params.get("height"),
                "rh": params.get("rh"),
                "site_link": params.get("atp_link"),
                "pm": params.get("pm")
            })
        .eq("id", player_id)
        .execute())

        print(response)

        if params.get("country") is not None:
            countryData = (supabase.table("countries").select("id").eq("name", params.get("country")).single().execute())

            if countryData.data.get('id') is not None:
                countryResponse = (supabase.table("player_country_mapping").insert({
                    'player_id': player_id,
                    'country_id': countryData.data['id']
                }).execute())

                print(countryResponse)

        if params.get('coach') is not None and len(params['coach']) > 0:
            for coach in params['coach']:
                coachData = (supabase.rpc("search_people", {
                    "search_term": coach
                }).execute())

                if coachData.data is not None and len(coachData.data) == 1:
                    coachResponse = (supabase.table("player_coach_mapping").insert({
                        'player_id': player_id,
                        'coach_id': coachData.data[0]['id'],
                        'status': 'Current'
                    }).execute())

                    print(coachResponse)
    except Exception as e:
        print(e)
        raise

    return jsonify({"success": True, "player": params})

@app.route("/atp/activity", methods=['POST'])
def get_atp_activity():
    data = request.json
    tournament_id = data.get('tournament_id')
    year = data.get('year')
    match_type = data.get('match_type')
    category = data.get('category')
    players = data.get('players')
    activity = []

    driver = webdriver.Chrome()

    for player in players:
        driver.get(f"https://www.atptour.com/en/players/x/{player['player_id']}/player-activity?matchType={match_type}&year={year}&tournament={tournament_id}_{category}")

        player_activity = {
            'entry_id': player['entry_id'],
            'player_id': player['player_id']
        }

        WebDriverWait(driver, 10).until(EC.presence_of_all_elements_located((By.CLASS_NAME, 'atp_player-activity')))
        time.sleep(2)

        layout = driver.find_element(By.CLASS_NAME, 'atp_player-activity').get_attribute('innerHTML')
        soup = BeautifulSoup(layout, 'html.parser')

        tournament_rows = soup.find_all('div', class_='tournament')

        if len(tournament_rows) == 1:
            row = tournament_rows[0]
        elif len(tournament_rows) > 1:
            target_row = None
            for row in tournament_rows:
                a_tag = row.find('a', href=True)
                if a_tag and f"/{tournament_id}/overview" in a_tag['href']:
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

    for item in activity:
        try:
            supabase.table("entries").update({
                'points': item['points'],
                'pm': item['pm']
            }).eq("id", item['entry_id'])

            supabase.table("player_entry_mapping").update({
                'rank': item['rank']
            }).eq("entry_id", item['entry_id']).eq("player_id", item['player_id'])
        except Exception as e:
            print(item['player_id'], e)
            continue

    return jsonify({"success": True})

@app.route("/wta/player/<player_id>", methods=['GET'])
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
            country_text = data.get('nationality').get('name')
            print(country_text)
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

    try:
        response = (supabase.table("players").update({
            'ch_singles_date': player.get('singles_ch_date'),
            'ch_doubles_date': player.get('doubles_ch_date'),
            'ch_singles': player.get('ch_singles'),
            'ch_doubles': player.get('ch_doubles'),
            'current_singles': player.get('current_singles'),
            'current_doubles': player.get('current_doubles'),
            'pm': player.get('pm'),
            'dob': player.get('dob'),
            'first_name': player.get('first_name'),
            'last_name': player.get('last_name'),
            'rh': player.get('rh'),
            'height': player.get('height')
        }).eq("id", player_id).execute())

        print(response)

        countryData = (supabase.table("countries").select("id").eq("name", country).single().execute())

        if countryData.data is not None:
            countryResponse = (supabase.table("player_country_mapping").insert({
                    'player_id': player_id,
                    'country_id': countryData.data['id']
                }).execute())

            print(countryResponse)
    except Exception as e:
        print(e)
        raise

    return jsonify({"success": True, "player": player})