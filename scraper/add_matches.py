import json
import os
from dotenv import load_dotenv
from neo4j import GraphDatabase

# Loading neo4j authentication details
load_status = load_dotenv("Neo4j-4504c504-Created-2025-10-19.txt")
if load_status is False:
    raise RuntimeError('Environment variables not loaded.')
URI = os.getenv("NEO4J_URI")
AUTH = (os.getenv("NEO4J_USERNAME"), os.getenv("NEO4J_PASSWORD"))

try:
    with open('ao_atp_doubles.json', 'r') as f:
        file = json.load(f)
        data = file[0]['match']

        for item in data:
            date_obj = item['properties'].get('date')
            duration_obj = item['properties'].get('duration')

            # item['properties']['id'] = item['properties']['id'].replace("5802025", "5802025-WTA S Q") if 'Qualifying' in item['round'] else item['properties']['id'].replace('5802025', '5802025-WTA S M')
            item['properties']['id'] = item['properties']['id'].replace("5802025", "5802025-ATP D M")

            if (date_obj is not None):
                item['properties']['date'] = f"{date_obj['year']}-{date_obj['month']}-{date_obj['day']}"

            if (duration_obj is not None):
                hours = duration_obj['seconds'] // 3600
                minutes = (duration_obj['seconds'] % 3600) // 60
                seconds = duration_obj['seconds'] % 60
                item['properties']['duration'] = {
                    'hours': hours,
                    'minutes': minutes,
                    'seconds': seconds
                }
except FileNotFoundError:
    print("Error: 'data.json' not found. Please create the file.")
except json.JSONDecodeError as e:
    print(f"Error decoding JSON from 'data.json': {e}")

def add_matches(db):
    for match in data:
        query = """
            MATCH (r:Round:Singles {round: $round }) WHERE r.id STARTS WITH '5802025-ATP'
            MERGE (m:Match:$($labels) {id: $properties.id})
            MERGE (m)-[:PLAYED]->(r)
            SET m.date = date($properties.date), m.duration = duration($properties.duration), m.match_no = $properties.match_no, m.court = $properties.court
        """

        db.run(query, **match)

with GraphDatabase.driver(URI, auth=AUTH) as driver:
        with driver.session(database="neo4j") as session:
            records = session.execute_write(add_matches)