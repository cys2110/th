export const MATCH_STATS = [
  {
    label: "Aces",
    category: "Service Stats",
    key: "aces",
    low: false,
    percent: false
  },
  {
    label: "Double faults",
    category: "Service Stats",
    key: "dfs",
    low: true,
    percent: false
  },
  {
    label: "First serve",
    category: "Service Stats",
    numerators: ["serve1"],
    denominators: ["serve1", "serve2"],
    low: false,
    percent: true
  },
  {
    label: "1st serve points won",
    category: "Service Stats",
    numerators: ["serve1_w"],
    denominators: ["serve1"],
    low: false,
    percent: true
  },
  {
    label: "2nd serve points won",
    category: "Service Stats",
    numerators: ["serve2_w"],
    denominators: ["serve2"],
    low: false,
    percent: true
  },
  {
    label: "Break points saved",
    category: "Service Stats",
    numerators: ["bps_saved"],
    denominators: ["bps_faced"],
    low: false,
    percent: true
  },
  {
    label: "Service games won",
    category: "Service Stats",
    numerators: ["bps_saved", "bps_faced"],
    denominators: ["serve_games"],
    low: false,
    percent: true
  },
  {
    label: "1st serve return points won",
    category: "Return Stats",
    numerators: ["ret1_w"],
    denominators: ["ret1"],
    low: false,
    percent: true
  },
  {
    label: "2nd serve return points won",
    category: "Return Stats",
    numerators: ["ret2_w"],
    denominators: ["ret2"],
    low: false,
    percent: true
  },
  {
    label: "Break points converted",
    category: "Return Stats",
    numerators: ["bps_converted"],
    denominators: ["bp_opps"],
    low: false,
    percent: true
  },
  {
    label: "Return games won",
    category: "Return Stats",
    numerators: ["bps_converted"],
    denominators: ["return_games"],
    low: false,
    percent: true
  },
  {
    label: "Winners",
    category: "Points Stats",
    key: "winners",
    low: false,
    percent: false
  },
  {
    label: "Unforced errors",
    category: "Points Stats",
    key: "ues",
    low: true,
    percent: false
  },
  {
    label: "Net points won",
    category: "Points Stats",
    numerators: ["net_w"],
    denominators: ["net"],
    low: false,
    percent: false
  },
  {
    label: "Service points won",
    category: "Points Stats",
    numerators: ["serve1_w", "serve2_w"],
    denominators: ["serve1", "serve2"],
    low: false,
    percent: true
  },
  {
    label: "Return points won",
    category: "Points Stats",
    numerators: ["ret1_w", "ret2_w"],
    denominators: ["ret1", "ret2"],
    low: false,
    percent: true
  },
  {
    label: "Total points won",
    category: "Points Stats",
    numerators: ["serve1_w", "serve2_w", "ret1_w", "ret2_w"],
    denominators: ["serve1", "serve2", "ret1", "ret2"],
    low: false,
    percent: true
  },
  {
    label: "Max speed (km/h)",
    category: "Service Speed",
    key: "max_speed",
    low: false,
    percent: false
  },
  {
    label: "1st serve average speed (km/h)",
    category: "Service Speed",
    key: "avg1_speed",
    low: false,
    percent: false
  },
  {
    label: "2nd serve average speed (km/h)",
    category: "Service Speed",
    key: "avg2_speed",
    low: false,
    percent: false
  }
]
