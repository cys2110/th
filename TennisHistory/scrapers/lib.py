import re

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
    '1st Round Qualifying': 'Qualifying round 1',
    'Round Robin': 'Round robin',
    'Round robin': 'Round robin'
}

country_tournaments = [8888, 615, 9900]

country_round_mapping = {
    'Finals': 'Final',
    "Final": "Final",
    'Semi-Finals': 'Semifinals',
    "Semifinals": "Semifinals",
    'Quarter-Finals': 'Quarterfinals',
    "Quarterfinals": "Quarterfinals",
    'Round Robin': 'Group stage',
    'Round robin': 'Group stage'
}

def extract_atp_id_from_link(link):
    return re.search(r'/([a-zA-Z0-9]{4})/', link).group(1)