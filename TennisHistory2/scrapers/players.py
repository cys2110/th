import os
import time
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

# Function to handle cookies
def handle_cookies(driver):
    wait = WebDriverWait(driver, timeout=20)
    try:
        banner = wait.until(EC.visibility_of_element_located((By.ID, 'onetrust-banner-sdk')))
        if banner.is_displayed():
            driver.find_element(By.XPATH, '//*[@id="onetrust-reject-all-handler"]').click()
    except TimeoutException:
        return False

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

@app.route("/atp/activity", methods=['POST'])
def get_atp_activity():
    data = request.json
    tournament_id = data.get('tournament_id')
    year = data.get('year')
    match_type = data.get('match_type')
    category = data.get('category')
    players = data.get('players')
    activity = []

    for player in players:
        driver = None

        player_activity = {
            'entry_id': player['entry_id'],
            'player_id': player['id']
        }

        try:
            driver = create_remote_chrome_driver()
            driver.get(f"https://www.atptour.com/en/players/x/{player['id']}/player-activity?matchType={match_type}&year={year}&tournament={tournament_id}_{category}")

            WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.CLASS_NAME, 'atp_player-activity')))
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
        except TimeoutException:
            print(f"Could not locate atp_player-activity for {player}")
            continue
        except Exception as e:
            print(f"Error scraping activity for {player}: {e}")
            continue
        finally:
            if driver:
                driver.quit()

    for item in activity:
        try:
            supabase.table("entries").update({
                'points': item['points'],
                'pm': item['pm']
            }).eq("id", item['entry_id']).execute()

            supabase.table("player_entry_mapping").update({
                'rank': item['rank']
            }).eq("entry_id", item['entry_id']).eq("player_id", item['player_id']).execute()
        except Exception as e:
            print(item['player_id'], e)
            continue

    return jsonify({"success": True})
