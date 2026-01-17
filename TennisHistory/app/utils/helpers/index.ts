export const dateTimeFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC"
})

export const getFlagCode = (country: CountryType) => {
  const circleFlagsMapping: Record<typeof country.id, string> = {
    URS: "soviet-union",
    YUG: "yu",
    TCH: "cs",
    NMI: "mp"
  }

  if (circleFlagsMapping[country.id]) {
    return `circle-flags:${circleFlagsMapping[country.id]}`
  } else if (!country.alpha2) {
    if (country.id === "POC") {
      return "flag:pc-4x3"
    }
    return `twemoji:flag-${kebabCase(country.name)}`
  } else if (["ch", "np"].includes(country.alpha2)) {
    return `flag:${country.alpha2}-1x1`
  }
  return `flag:${country.alpha2}-4x3`
}

export const getDurationString = (durationInSeconds: number) => {
  const hours = Math.floor(durationInSeconds / 3600)
  const minutes = Math.floor((durationInSeconds % 3600) / 60)
  const seconds = durationInSeconds % 60

  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
}

export const shortDateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "numeric",
  year: "2-digit",
  timeZone: "UTC"
})

export const transformMatchStats = (data: RawMatchType) => {
  const { team1, team2, ...rest } = data

  return {
    ...rest,
    team1: {
      s1: team1?.s1,
      s2: team1?.s2,
      s3: team1?.s3,
      s4: team1?.s4,
      s5: team1?.s5,
      t1: team1?.t1,
      t2: team1?.t2,
      t3: team1?.t3,
      t4: team1?.t4,
      t5: team1?.t5,
      incomplete: team1?.incomplete
    },
    team2: {
      s1: team2?.s1,
      s2: team2?.s2,
      s3: team2?.s3,
      s4: team2?.s4,
      s5: team2?.s5,
      t1: team2?.t1,
      t2: team2?.t2,
      t3: team2?.t3,
      t4: team2?.t4,
      t5: team2?.t5,
      incomplete: team2?.incomplete
    },
    stats: [
      {
        label: "Aces",
        category: "Service Stats",
        t1: `${team1?.aces ?? 0}`,
        t2: `${team2?.aces ?? 0}`,
        t1_pc: (team1?.aces ?? 0) + (team2?.aces ?? 0) === 0 ? 0 : percentage(team1?.aces ?? 0, (team1?.aces ?? 0) + (team2?.aces ?? 0)),
        t2_pc: (team1?.aces ?? 0) + (team2?.aces ?? 0) === 0 ? 0 : percentage(team2?.aces ?? 0, (team1?.aces ?? 0) + (team2?.aces ?? 0))
      },
      {
        label: "Double faults",
        category: "Service Stats",
        low: true,
        t1: `${team1?.dfs ?? 0}`,
        t2: `${team2?.dfs ?? 0}`,
        t1_pc: (team1?.dfs ?? 0) + (team2?.dfs ?? 0) === 0 ? 0 : percentage(team1?.dfs ?? 0, (team1?.dfs ?? 0) + (team2?.dfs ?? 0)),
        t2_pc: (team1?.dfs ?? 0) + (team2?.dfs ?? 0) === 0 ? 0 : percentage(team2?.dfs ?? 0, (team1?.dfs ?? 0) + (team2?.dfs ?? 0))
      },
      {
        label: "First serve",
        category: "Service Stats",
        percent: true,
        t1: `${team1?.serve1 ?? 0}/${(team1?.serve1 ?? 0) + (team1?.serve2 ?? 0)}`,
        t2: `${team2?.serve1 ?? 0}/${(team2?.serve1 ?? 0) + (team2?.serve2 ?? 0)}`,
        t1_pc: (team1?.serve1 ?? 0) + (team1?.serve2 ?? 0) === 0 ? 0 : percentage(team1?.serve1 ?? 0, (team1?.serve1 ?? 0) + (team1?.serve2 ?? 0)),
        t2_pc: (team2?.serve1 ?? 0) + (team2?.serve2 ?? 0) === 0 ? 0 : percentage(team2?.serve1 ?? 0, (team2?.serve1 ?? 0) + (team2?.serve2 ?? 0))
      },
      {
        label: "1st serve points won",
        category: "Service Stats",
        percent: true,
        t1: `${team1?.serve1_w ?? 0}/${team1?.serve1 ?? 0}`,
        t2: `${team2?.serve1_w ?? 0}/${team2?.serve1 ?? 0}`,
        t1_pc: team1?.serve1 === 0 || team1?.serve1 === undefined ? 0 : percentage(team1!.serve1_w ?? 0, team1!.serve1 ?? 0),
        t2_pc: team2?.serve1 === 0 || team2?.serve1 === undefined ? 0 : percentage(team2!.serve1_w ?? 0, team2!.serve1 ?? 0)
      },
      {
        label: "2nd serve points won",
        category: "Service Stats",
        percent: true,
        t1: `${team1?.serve2_w ?? 0}/${team1?.serve2 ?? 0}`,
        t2: `${team2?.serve2_w ?? 0}/${team2?.serve2 ?? 0}`,
        t1_pc: team1?.serve2 === 0 || team1?.serve2 === undefined ? 0 : percentage(team1!.serve2_w ?? 0, team1!.serve2 ?? 0),
        t2_pc: team2?.serve2 === 0 || team2?.serve2 === undefined ? 0 : percentage(team2!.serve2_w ?? 0, team2!.serve2 ?? 0)
      },
      {
        label: "Break points saved",
        category: "Service Stats",
        percent: true,
        t1: `${team1?.bps_saved ?? 0}/${team1?.bps_faced ?? 0}`,
        t2: `${team2?.bps_saved ?? 0}/${team2?.bps_faced ?? 0}`,
        t1_pc: team1?.bps_faced === 0 || team1?.bps_faced === undefined ? 0 : percentage(team1!.bps_saved ?? 0, team1!.bps_faced ?? 0),
        t2_pc: team2?.bps_faced === 0 || team2?.bps_faced === undefined ? 0 : percentage(team2!.bps_saved ?? 0, team2!.bps_faced ?? 0)
      },
      {
        label: "Service games won",
        category: "Service Stats",
        percent: true,
        t1: `${(team1?.serve_games ?? 0) - (team2?.bps_converted ?? 0)}/${team1?.serve_games ?? 0}`,
        t2: `${(team2?.serve_games ?? 0) - (team1?.bps_converted ?? 0)}/${team2?.serve_games ?? 0}`,
        t1_pc:
          team1?.serve_games === 0 || team1?.serve_games === undefined
            ? 0
            : percentage((team1!.serve_games ?? 0) - (team2!.bps_converted ?? 0), team1!.serve_games ?? 0),
        t2_pc:
          team2?.serve_games === 0 || team2?.serve_games === undefined
            ? 0
            : percentage((team2!.serve_games ?? 0) - (team1!.bps_converted ?? 0), team2!.serve_games ?? 0)
      },
      {
        label: "1st serve return points won",
        category: "Return Stats",
        percent: true,
        t1: `${team1?.ret1_w ?? 0}/${team1?.ret1 ?? 0}`,
        t2: `${team2?.ret1_w ?? 0}/${team2?.ret1 ?? 0}`,
        t1_pc: team1?.ret1 === 0 || team1?.ret1 === undefined ? 0 : percentage(team1!.ret1_w ?? 0, team1!.ret1 ?? 0),
        t2_pc: team2?.ret1 === 0 || team2?.ret1 === undefined ? 0 : percentage(team2!.ret1_w ?? 0, team2!.ret1 ?? 0)
      },
      {
        label: "2nd serve return points won",
        category: "Return Stats",
        percent: true,
        t1: `${team1?.ret2_w ?? 0}/${team1?.ret2 ?? 0}`,
        t2: `${team2?.ret2_w ?? 0}/${team2?.ret2 ?? 0}`,
        t1_pc: team1?.ret2 === 0 || team1?.ret2 === undefined ? 0 : percentage(team1!.ret2_w ?? 0, team1!.ret2 ?? 0),
        t2_pc: team2?.ret2 === 0 || team2?.ret2 === undefined ? 0 : percentage(team2!.ret2_w ?? 0, team2!.ret2 ?? 0)
      },
      {
        label: "Break points converted",
        category: "Return Stats",
        percent: true,
        t1: `${team1?.bps_converted ?? 0}/${team1?.bp_opps ?? 0}`,
        t2: `${team2?.bps_converted ?? 0}/${team2?.bp_opps ?? 0}`,
        t1_pc: team1?.bp_opps === 0 || team1?.bp_opps === undefined ? 0 : percentage(team1!.bps_converted ?? 0, team1!.bp_opps ?? 0),
        t2_pc: team2?.bp_opps === 0 || team2?.bp_opps === undefined ? 0 : percentage(team2!.bps_converted ?? 0, team2!.bp_opps ?? 0)
      },
      {
        label: "Return games won",
        category: "Return Stats",
        percent: true,
        t1: `${team1?.bps_converted ?? 0}/${team1?.return_games ?? 0}`,
        t2: `${team2?.bps_converted ?? 0}/${team2?.return_games ?? 0}`,
        t1_pc: team1?.return_games === 0 || team1?.return_games === undefined ? 0 : percentage(team1!.bps_converted ?? 0, team1!.return_games ?? 0),
        t2_pc: team2?.return_games === 0 || team2?.return_games === undefined ? 0 : percentage(team2!.bps_converted ?? 0, team2!.return_games ?? 0)
      },
      {
        label: "Winners",
        category: "Points Stats",
        t1: `${team1?.winners ?? 0}`,
        t2: `${team2?.winners ?? 0}`,
        t1_pc:
          (team1?.winners ?? 0) + (team2?.winners ?? 0) === 0 ? 0 : percentage(team1?.winners ?? 0, (team1?.winners ?? 0) + (team2?.winners ?? 0)),
        t2_pc:
          (team1?.winners ?? 0) + (team2?.winners ?? 0) === 0 ? 0 : percentage(team2?.winners ?? 0, (team1?.winners ?? 0) + (team2?.winners ?? 0))
      },
      {
        label: "Unforced errors",
        category: "Points Stats",
        t1: `${team1?.ues ?? 0}`,
        t2: `${team2?.ues ?? 0}`,
        t1_pc: (team1?.ues ?? 0) + (team2?.ues ?? 0) === 0 ? 0 : percentage(team1?.ues ?? 0, (team1?.ues ?? 0) + (team2?.ues ?? 0)),
        t2_pc: (team1?.ues ?? 0) + (team2?.ues ?? 0) === 0 ? 0 : percentage(team2?.ues ?? 0, (team1?.ues ?? 0) + (team2?.ues ?? 0)),
        low: true
      },
      {
        label: "Net points won",
        category: "Points Stats",
        percent: true,
        t1: `${team1?.net_w ?? 0}/${team1?.net ?? 0}`,
        t2: `${team2?.net_w ?? 0}/${team2?.net ?? 0}`,
        t1_pc: team1?.net === 0 || team1?.net === undefined ? 0 : percentage(team1!.net_w ?? 0, team1!.net ?? 0),
        t2_pc: team2?.net === 0 || team2?.net === undefined ? 0 : percentage(team2!.net_w ?? 0, team2!.net ?? 0)
      },
      {
        label: "Service points won",
        category: "Points Stats",
        percent: true,
        t1: `${(team1?.serve1_w ?? 0) + (team1?.serve2_w ?? 0)}/${(team1?.serve1 ?? 0) + (team1?.serve2 ?? 0)}`,
        t2: `${(team2?.serve1_w ?? 0) + (team2?.serve2_w ?? 0)}/${(team2?.serve1 ?? 0) + (team2?.serve2 ?? 0)}`,
        t1_pc:
          (team1?.serve1 ?? 0) + (team1?.serve2 ?? 0) === 0
            ? 0
            : percentage((team1?.serve1_w ?? 0) + (team1?.serve2_w ?? 0), (team1?.serve1 ?? 0) + (team1?.serve2 ?? 0)),
        t2_pc:
          (team2?.serve1 ?? 0) + (team2?.serve2 ?? 0) === 0
            ? 0
            : percentage((team2?.serve1_w ?? 0) + (team2?.serve2_w ?? 0), (team2?.serve1 ?? 0) + (team2?.serve2 ?? 0))
      },
      {
        label: "Return points won",
        category: "Points Stats",
        percent: true,
        t1: `${(team1?.ret1_w ?? 0) + (team1?.ret2_w ?? 0)}/${(team1?.ret1 ?? 0) + (team1?.ret2 ?? 0)}`,
        t2: `${(team2?.ret1_w ?? 0) + (team2?.ret2_w ?? 0)}/${(team2?.ret1 ?? 0) + (team2?.ret2 ?? 0)}`,
        t1_pc:
          (team1?.ret1 ?? 0) + (team1?.ret2 ?? 0) === 0
            ? 0
            : percentage((team1?.ret1_w ?? 0) + (team1?.ret2_w ?? 0), (team1?.ret1 ?? 0) + (team1?.ret2 ?? 0)),
        t2_pc:
          (team2?.ret1 ?? 0) + (team2?.ret2 ?? 0) === 0
            ? 0
            : percentage((team2?.ret1_w ?? 0) + (team2?.ret2_w ?? 0), (team2?.ret1 ?? 0) + (team2?.ret2 ?? 0))
      },
      {
        label: "Total points won",
        category: "Points Stats",
        percent: true,
        t1: `${(team1?.serve1_w ?? 0) + (team1?.serve2_w ?? 0) + (team1?.ret1_w ?? 0) + (team1?.ret2_w ?? 0)}/${
          (team1?.serve1 ?? 0) + (team1?.serve2 ?? 0) + (team1?.ret1 ?? 0) + (team1?.ret2 ?? 0)
        }`,
        t2: `${(team2?.serve1_w ?? 0) + (team2?.serve2_w ?? 0) + (team2?.ret1_w ?? 0) + (team2?.ret2_w ?? 0)}/${
          (team2?.serve1 ?? 0) + (team2?.serve2 ?? 0) + (team2?.ret1 ?? 0) + (team2?.ret2 ?? 0)
        }`,
        t1_pc:
          (team1?.serve1 ?? 0) + (team1?.serve2 ?? 0) + (team1?.ret1 ?? 0) + (team1?.ret2 ?? 0) === 0
            ? 0
            : percentage(
                (team1?.serve1_w ?? 0) + (team1?.serve2_w ?? 0) + (team1?.ret1_w ?? 0) + (team1?.ret2_w ?? 0),
                (team1?.serve1 ?? 0) + (team1?.serve2 ?? 0) + (team1?.ret1 ?? 0) + (team1?.ret2 ?? 0)
              ),
        t2_pc:
          (team2?.serve1 ?? 0) + (team2?.serve2 ?? 0) + (team2?.ret1 ?? 0) + (team2?.ret2 ?? 0) === 0
            ? 0
            : percentage(
                (team2?.serve1_w ?? 0) + (team2?.serve2_w ?? 0) + (team2?.ret1_w ?? 0) + (team2?.ret2_w ?? 0),
                (team2?.serve1 ?? 0) + (team2?.serve2 ?? 0) + (team2?.ret1 ?? 0) + (team2?.ret2 ?? 0)
              )
      },
      {
        label: "Max speed (km/h)",
        category: "Service Speed",
        t1: `${team1?.max_speed ?? 0}`,
        t2: `${team2?.max_speed ?? 0}`,
        t1_pc:
          (team1?.max_speed ?? 0) + (team2?.max_speed ?? 0) === 0
            ? 0
            : percentage(team1?.max_speed ?? 0, (team1?.max_speed ?? 0) + (team2?.max_speed ?? 0)),
        t2_pc:
          (team1?.max_speed ?? 0) + (team2?.max_speed ?? 0) === 0
            ? 0
            : percentage(team2?.max_speed ?? 0, (team1?.max_speed ?? 0) + (team2?.max_speed ?? 0))
      },
      {
        label: "1st serve average speed (km/h)",
        category: "Service Speed",
        t1: `${team1?.avg1_speed ?? 0}`,
        t2: `${team2?.avg1_speed ?? 0}`,
        t1_pc:
          (team1?.avg1_speed ?? 0) + (team2?.avg1_speed ?? 0) === 0
            ? 0
            : percentage(team1?.avg1_speed ?? 0, (team1?.avg1_speed ?? 0) + (team2?.avg1_speed ?? 0)),
        t2_pc:
          (team1?.avg1_speed ?? 0) + (team2?.avg1_speed ?? 0) === 0
            ? 0
            : percentage(team2?.avg1_speed ?? 0, (team1?.avg1_speed ?? 0) + (team2?.avg1_speed ?? 0))
      },
      {
        label: "2nd serve average speed (km/h)",
        category: "Service Speed",
        t1: `${team1?.avg2_speed ?? 0}`,
        t2: `${team2?.avg2_speed ?? 0}`,
        t1_pc:
          (team1?.avg2_speed ?? 0) + (team2?.avg2_speed ?? 0) === 0
            ? 0
            : percentage(team1?.avg2_speed ?? 0, (team1?.avg2_speed ?? 0) + (team2?.avg2_speed ?? 0)),
        t2_pc:
          (team1?.avg2_speed ?? 0) + (team2?.avg2_speed ?? 0) === 0
            ? 0
            : percentage(team2?.avg2_speed ?? 0, (team1?.avg2_speed ?? 0) + (team2?.avg2_speed ?? 0))
      }
    ]
  }
}

export type MatchStatsType = typeof transformMatchStats extends (data: any) => infer R ? R : never
