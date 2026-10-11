declare global {
  interface ActivityResult {
    player_id: string
    rank: number
    points: number
    pm: number
  }

  interface RankingResult {
    start_date: string
    rank: number
    match_type: MatchTypeEnum
  }
}

export {}
