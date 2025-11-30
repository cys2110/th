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
    with open('wimbledon_wta_doubles_main.json', 'r') as f:
        data = json.load(f)
        # data = file[0]['match']

except FileNotFoundError:
    print("Error: 'data.json' not found. Please create the file.")
except json.JSONDecodeError as e:
    print(f"Error decoding JSON from 'data.json': {e}")

def add_matches(db):
    for item in data:
        params = item['match']
        # params = item
        params['score1_properties']['id'] = params['score1_properties']['id'].replace('5402025', '5402025-WTA D M')
        params['score2_properties']['id'] = params['score2_properties']['id'].replace('5402025', '5402025-WTA D M')
        query = """
            MATCH (m:Match:Doubles:Main:WTA {match_no: $match_no}) WHERE m.id STARTS WITH '5402025-WTA'
            MATCH (f1:Entry:Doubles) WHERE f1.id CONTAINS $entry1[0] AND f1.id CONTAINS $entry1[1]
            MATCH (f2:Entry:Doubles) WHERE f2.id CONTAINS $entry2[0] AND f2.id CONTAINS $entry2[1]
            MERGE (s1:$($score1_labels) {id: $score1_properties.id})
            MERGE (s2:$($score2_labels) {id: $score2_properties.id})
            SET s1 += $score1_properties
            SET s2 += $score2_properties
            MERGE (f1)-[:SCORED]->(s1)
            MERGE (f2)-[:SCORED]->(s2)
            MERGE (s1)-[:SCORED]->(m)
            MERGE (s2)-[:SCORED]->(m)
        """

        db.run(query, **params)

with GraphDatabase.driver(URI, auth=AUTH) as driver:
        with driver.session(database="neo4j") as session:
            records = session.execute_write(add_matches)