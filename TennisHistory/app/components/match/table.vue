<script setup lang="ts">
import type { Database } from "~/types/database.types"
import { isDefined } from "@vueuse/core"
import { convertKmhToMph, percentage } from "#imports"

type MatchStats = Database["tennis"]["Tables"]["match_stats"]["Row"]

const props = defineProps<{ match: MatchDetailsQuery }>()

type Stat = {
  label: string
  t1_numerator: number
  t2_numerator: number
  t1_denominator?: number
  t2_denominator?: number
  low?: boolean
  comparison?: "break-points-saved" | "break-points-converted"
  speed?: boolean
}

type StatCategory = {
  label: string
  stats: Array<Stat>
}

const isTeamBest = (stat: Stat, team: 1 | 2) => {
  const numerator = team === 1 ? stat.t1_numerator : stat.t2_numerator
  const denominator = team === 1 ? stat.t1_denominator : stat.t2_denominator
  const opponentNumerator = team === 1 ? stat.t2_numerator : stat.t1_numerator
  const opponentDenominator = team === 1 ? stat.t2_denominator : stat.t1_denominator

  if (stat.comparison === "break-points-saved") {
    if (!denominator || !opponentDenominator) return !denominator && Boolean(opponentDenominator)

    return numerator / denominator > opponentNumerator / opponentDenominator
  }

  if (stat.comparison === "break-points-converted") {
    if (!denominator || !opponentDenominator) return Boolean(denominator) && !opponentDenominator

    return numerator / denominator > opponentNumerator / opponentDenominator
  }

  if (denominator) {
    if (!opponentDenominator) return false

    const value = numerator / denominator
    const opponentValue = opponentNumerator / opponentDenominator

    return stat.low ? value < opponentValue : value > opponentValue
  }

  return stat.low ? numerator < opponentNumerator : numerator > opponentNumerator
}

const isTeam1Best = (stat: Stat) => isTeamBest(stat, 1)
const isTeam2Best = (stat: Stat) => isTeamBest(stat, 2)

const stats = computed<Array<StatCategory>>(() => {
  const team1Stats = props.match.team_1_stats as MatchStats
  const team2Stats = props.match.team_2_stats as MatchStats

  const baseStats: Array<StatCategory> = [
    {
      label: "Service Stats",
      stats: [
        {
          label: "Aces",
          t1_numerator: team1Stats.aces ?? 0,
          t2_numerator: team2Stats.aces ?? 0
        },
        {
          label: "Double Faults",
          t1_numerator: team1Stats.dfs ?? 0,
          t2_numerator: team2Stats.dfs ?? 0,
          low: true
        },
        {
          label: "First Serve %",
          t1_numerator: team1Stats.serve1 ?? 0,
          t1_denominator: (team1Stats.serve1 ?? 0) + (team1Stats.serve2 ?? 0),
          t2_numerator: team2Stats.serve1 ?? 0,
          t2_denominator: (team2Stats.serve1 ?? 0) + (team2Stats.serve2 ?? 0)
        },
        {
          label: "1st Serve Points Won",
          t1_numerator: team1Stats.serve1_w ?? 0,
          t1_denominator: team1Stats.serve1 ?? 0,
          t2_numerator: team2Stats.serve1_w ?? 0,
          t2_denominator: team2Stats.serve1 ?? 0
        },
        {
          label: "2nd Serve Points Won",
          t1_numerator: team1Stats.serve2_w ?? 0,
          t1_denominator: team1Stats.serve2 ?? 0,
          t2_numerator: team2Stats.serve2_w ?? 0,
          t2_denominator: team2Stats.serve2 ?? 0
        },
        {
          label: "Break Points Saved",
          t1_numerator: team1Stats.bps_saved ?? 0,
          t1_denominator: team1Stats.bps_faced ?? 0,
          t2_numerator: team2Stats.bps_saved ?? 0,
          t2_denominator: team2Stats.bps_faced ?? 0,
          comparison: "break-points-saved"
        },
        {
          label: "Service Games Played",
          t1_numerator: team1Stats.serve_games ?? 0,
          t2_numerator: team2Stats.serve_games ?? 0
        }
      ]
    },
    {
      label: "Return Stats",
      stats: [
        {
          label: "1st Serve Return Points Won",
          t1_numerator: team1Stats.ret1_w ?? 0,
          t1_denominator: team1Stats.ret1 ?? 0,
          t2_numerator: team2Stats.ret1_w ?? 0,
          t2_denominator: team2Stats.ret1 ?? 0
        },
        {
          label: "2nd Serve Return Points Won",
          t1_numerator: team1Stats.ret2_w ?? 0,
          t1_denominator: team1Stats.ret2 ?? 0,
          t2_numerator: team2Stats.ret2_w ?? 0,
          t2_denominator: team2Stats.ret2 ?? 0
        },
        {
          label: "Break Points Converted",
          t1_numerator: team1Stats.bps_converted ?? 0,
          t1_denominator: team1Stats.bp_opps ?? 0,
          t2_numerator: team2Stats.bps_converted ?? 0,
          t2_denominator: team2Stats.bp_opps ?? 0,
          comparison: "break-points-converted"
        },
        {
          label: "Return Games Played",
          t1_numerator: team1Stats.return_games ?? 0,
          t2_numerator: team2Stats.return_games ?? 0
        }
      ]
    },
    {
      label: "Point Stats",
      stats: [
        ...(isDefined(team1Stats.net_w) ?
          [
            {
              label: "Net Points",
              t1_numerator: team1Stats.net_w ?? 0,
              t1_denominator: team1Stats.net ?? 0,
              t2_numerator: team2Stats.net_w ?? 0,
              t2_denominator: team2Stats.net ?? 0
            }
          ]
        : []),
        ...(isDefined(team1Stats.winners) ?
          [
            {
              label: "Winners",
              t1_numerator: team1Stats.winners ?? 0,
              t2_numerator: team2Stats.winners ?? 0
            }
          ]
        : []),
        ...(isDefined(team1Stats.ues) ?
          [
            {
              label: "Unforced Errors",
              t1_numerator: team1Stats.ues ?? 0,
              t2_numerator: team2Stats.ues ?? 0,
              low: true
            }
          ]
        : []),
        {
          label: "Service Points Won",
          t1_numerator: (team1Stats.serve1_w ?? 0) + (team1Stats.serve2_w ?? 0),
          t1_denominator: (team1Stats.serve1 ?? 0) + (team1Stats.serve2 ?? 0),
          t2_numerator: (team2Stats.serve1_w ?? 0) + (team2Stats.serve2_w ?? 0),
          t2_denominator: (team2Stats.serve1 ?? 0) + (team2Stats.serve2 ?? 0)
        },
        {
          label: "Return Points Won",
          t1_numerator: (team1Stats.ret1_w ?? 0) + (team1Stats.ret2_w ?? 0),
          t1_denominator: (team1Stats.ret1 ?? 0) + (team1Stats.ret2 ?? 0),
          t2_numerator: (team2Stats.ret1_w ?? 0) + (team2Stats.ret2_w ?? 0),
          t2_denominator: (team2Stats.ret1 ?? 0) + (team2Stats.ret2 ?? 0)
        },
        {
          label: "Total Points Won",
          t1_numerator: (team1Stats.serve1_w ?? 0) + (team1Stats.serve2_w ?? 0) + (team1Stats.ret1_w ?? 0) + (team1Stats.ret2_w ?? 0),
          t1_denominator: (team1Stats.serve1 ?? 0) + (team1Stats.serve2 ?? 0) + (team1Stats.ret1 ?? 0) + (team1Stats.ret2 ?? 0),
          t2_numerator: (team2Stats.serve1_w ?? 0) + (team2Stats.serve2_w ?? 0) + (team2Stats.ret1_w ?? 0) + (team2Stats.ret2_w ?? 0),
          t2_denominator: (team2Stats.serve1 ?? 0) + (team2Stats.serve2 ?? 0) + (team2Stats.ret1 ?? 0) + (team2Stats.ret2 ?? 0)
        }
      ]
    }
  ]

  if (team1Stats.avg1_speed && team2Stats.avg1_speed) {
    baseStats.push({
      label: "Service Speed",
      stats: [
        {
          label: "Max Speed",
          t1_numerator: team1Stats.max_speed ?? 0,
          t2_numerator: team2Stats.max_speed ?? 0,
          speed: true
        },
        {
          label: "1st Serve Average Speed",
          t1_numerator: team1Stats.avg1_speed ?? 0,
          t2_numerator: team2Stats.avg1_speed ?? 0,
          speed: true
        },
        {
          label: "2nd Serve Average Speed",
          t1_numerator: team1Stats.avg2_speed ?? 0,
          t2_numerator: team2Stats.avg2_speed ?? 0,
          speed: true
        }
      ]
    })
  }

  return baseStats
})
</script>

<template>
  <u-container class="max-w-6xl">
    <div class="w-full [&_.stat-value]:py-2 [&_.stat-value]:col-span-2 divide-y divide-muted">
      <template
        v-for="(statCategory, index) in stats"
        :key="statCategory.label"
      >
        <div class="grid grid-cols-5 gap-2">
          <player-link
            v-if="match.team1 && index === 0"
            :team="match.team1.team"
            size="xl"
            class="col-span-2"
          />

          <div
            class="text-center font-bold uppercase py-4"
            :class="{ 'col-span-5': index > 0 }"
          >
            {{ statCategory.label }}
          </div>

          <player-link
            v-if="match.team2 && index === 0"
            :team="match.team2.team"
            size="xl"
            class="col-span-2 justify-end"
          />
        </div>

        <div
          v-for="stat in statCategory.stats"
          :key="stat.label"
          class="grid grid-cols-5 gap-2"
        >
          <div class="stat-value">
            <u-progress
              :model-value="stat.t1_numerator"
              :max="stat.t1_denominator ?? stat.t1_numerator + stat.t2_numerator"
              inverted
              color="info"
              :ui="{ status: isTeam1Best(stat) ? 'font-semibold' : '' }"
            >
              <template #status>
                <div v-if="stat.speed">{{ stat.t1_numerator }} km/h ({{ convertKmhToMph(stat.t1_numerator) }} mph)</div>

                <div v-else-if="isDefined(stat.t1_denominator)">
                  <span>{{ stat.t1_numerator }}/{{ stat.t1_denominator }}</span>
                  <span> ({{ percentage(stat.t1_numerator, stat.t1_denominator) }}%)</span>
                </div>

                <div v-else>{{ stat.t1_numerator }}</div>
              </template>
            </u-progress>
          </div>

          <div class="font-semibold bg-elevated flex justify-center items-center text-center">
            <div>
              {{ stat.label }}
            </div>
          </div>

          <div class="stat-value">
            <u-progress
              :model-value="stat.t2_numerator"
              :max="stat.t2_denominator ?? stat.t2_numerator + stat.t1_numerator"
              color="Active"
              :ui="{ status: isTeam2Best(stat) ? 'font-semibold' : '' }"
            >
              <template #status>
                <div v-if="stat.speed">{{ stat.t2_numerator }} km/h ({{ convertKmhToMph(stat.t2_numerator) }} mph)</div>

                <div v-else-if="isDefined(stat.t2_denominator)">
                  <span>{{ stat.t2_numerator }}/{{ stat.t2_denominator }}</span>
                  <span> ({{ percentage(stat.t2_numerator, stat.t2_denominator) }}%)</span>
                </div>

                <div v-else>{{ stat.t2_numerator }}</div>
              </template>
            </u-progress>
          </div>
        </div>
      </template>
    </div>
  </u-container>
</template>
