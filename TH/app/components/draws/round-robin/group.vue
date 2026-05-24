<script setup lang="ts">
const props = defineProps<{ group: RoundRobinGroup }>()

const {
  params: { id }
} = useRoute("draws")

const contestants = computed(() => {
  const uniqueEntries = new Map<string, { entry_id: string; seed: number | null; rank: number; team: RoundRobinMatch["team_1"]["team"] }>()

  props.group.matches.forEach(m => {
    uniqueEntries.set(m.team_1_id, {
      entry_id: m.team_1_id,
      seed: m.team_1.seed,
      rank: m.team_1.team.reduce((acc: any, cur: any) => acc + (cur.rank || 9999), 0),
      team: m.team_1.team
    })

    uniqueEntries.set(m.team_2_id, {
      entry_id: m.team_2_id,
      seed: m.team_2.seed,
      rank: m.team_2.team.reduce((acc: any, cur: any) => acc + (cur.rank || 9999), 0),
      team: m.team_2.team
    })
  })

  return [...uniqueEntries.values()]
})

const entryStats = computed(() => {
  const entries = new Map()

  contestants.value.forEach(entry => {
    const entryMatches = props.group.matches.filter(m => m.team_1_id === entry.entry_id || m.team_2_id === entry.entry_id)

    const matchesWon = entryMatches.filter(m => m.winner_id === entry.entry_id).length
    const matchesLost = entryMatches.filter(m => m.winner_id !== entry.entry_id).length
    const matchesPlayed = entryMatches.length

    let setsWon = 0
    let setsLost = 0

    entryMatches.forEach(m => {
      const scores = m.scores.filter(s => s.entry_id === entry.entry_id)

      scores.forEach(score => {
        const opponentScore = m.scores.find(s => s.entry_id !== entry.entry_id && s.set_no === score.set_no)

        if (score.set > opponentScore!.set) {
          setsWon++
        } else {
          setsLost++
        }
      })
    })

    const scores = entryMatches.flatMap(m => m.scores.filter(s => s.entry_id === entry.entry_id))
    const opponentScores = entryMatches.flatMap(m => m.scores.filter(s => s.entry_id !== entry.entry_id))

    entries.set(entry.entry_id, {
      entryId: entry.entry_id,
      matchesWon,
      matchesLost,
      matchesPlayed,
      setsWon,
      setsLost,
      gamesWon: scores.reduce((acc, cur) => acc + cur.set, 0),
      gamesLost: opponentScores.reduce((acc, cur) => acc + cur.set, 0)
    })
  })

  return entries
})

const pct = (won: number, lost: number) => {
  const total = won + lost
  return total ? won / total : 0
}

const compareThreeWay = (a: any, b: any) => {
  const aStats = entryStats.value.get(a.entry_id)
  const bStats = entryStats.value.get(b.entry_id)

  if (!aStats || !bStats) return 0

  const aSetsPct = pct(aStats.setsWon, aStats.setsLost)
  const bSetsPct = pct(bStats.setsWon, bStats.setsLost)

  if (aSetsPct !== bSetsPct) return bSetsPct - aSetsPct

  const aGamesPct = pct(aStats.gamesWon, aStats.gamesLost)
  const bGamesPct = pct(bStats.gamesWon, bStats.gamesLost)

  if (aGamesPct !== bGamesPct) return bGamesPct - aGamesPct

  return a.rank - b.rank
}

const groupStandings = computed(() => {
  const sorted = contestants.value.sort((a, b) => {
    const aStats = entryStats.value.get(a.entry_id)
    const bStats = entryStats.value.get(b.entry_id)

    if (!aStats || !bStats) return 0

    if (aStats.matchesWon !== bStats.matchesWon) return bStats.matchesWon - aStats.matchesWon

    if (aStats.matchesWon + aStats.matchesLost !== bStats.matchesWon + bStats.matchesLost)
      return bStats.matchesWon + bStats.matchesLost - aStats.matchesWon - aStats.matchesLost

    return 0
  })

  const result: typeof sorted = []

  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i]
    const currentStats = entryStats.value.get(current!.entry_id)

    const tiedGroup = sorted.filter(entry => {
      const stats = entryStats.value.get(entry.entry_id)

      return stats?.matchesWon === currentStats?.matchesWon && stats?.matchesPlayed === currentStats?.matchesPlayed
    })

    if (result.some(entry => entry.entry_id === current!.entry_id)) {
      continue
    }

    if (tiedGroup.length === 2) {
      const [a, b] = tiedGroup

      const h2hMatch = props.group.matches.find(
        match =>
          (match.team_1_id === a!.entry_id && match.team_2_id === b!.entry_id) || (match.team_1_id === b!.entry_id && match.team_2_id === a!.entry_id)
      )

      if (h2hMatch && h2hMatch.winner_id === a!.entry_id) {
        result.push(a!, b!)
      } else {
        result.push(b!, a!)
      }
    } else if (tiedGroup.length >= 3) {
      result.push(...tiedGroup.sort(compareThreeWay))
    } else {
      result.push(current!)
    }
  }

  return result
})

const getMatch = (entry1: string, entry2: string): RoundRobinMatch | undefined => {
  return props.group.matches.find(m => (m.team_1_id === entry1 && m.team_2_id === entry2) || (m.team_1_id === entry2 && m.team_2_id === entry1))
}
</script>

<template>
  <dashboard-subpanel :title="group.group">
    <div>
      <div class="font-semibold">Standings</div>
      <ol class="text-sm">
        <li
          v-for="(entry, index) in groupStandings"
          class="flex items-center gap-2"
        >
          {{ index + 1 }}. <players-link :players="entry.team" />
        </li>
      </ol>
    </div>

    <div class="text-sm my-6">
      <table class="w-full [&_th]:px-2 [&_th]:py-1 [&_td]:px-2 [&_td]:py-1">
        <thead class="border-b border-muted">
          <tr class="divide-x divide-default">
            <th>{{ id === "605" ? "Seed" : "Rank" }}</th>
            <th>Entry</th>
            <th
              v-for="entry in contestants"
              :key="entry.entry_id"
            >
              {{ entry.team.map(p => `${p.first_name.charAt(0)}. ${p.last_name}`).join("/") }}
            </th>
            <th>RR W-L</th>
            <th>Set W-L</th>
            <th>Games W-L</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-default">
          <tr
            v-for="entry in contestants"
            :key="entry.entry_id"
            class="divide-x divide-default"
          >
            <td class="text-center">{{ id === "605" ? entry.seed : entry.rank }}</td>
            <td>
              <players-link :players="entry.team" />
            </td>
            <td
              v-for="(e, index) in contestants"
              :key="index"
              :class="{
                'bg-primary': e.entry_id === entry.entry_id,
                'font-medium text-success': getMatch(entry.entry_id, e.entry_id)?.winner_id === entry.entry_id
              }"
            >
              <div class="flex justify-center items-center gap-1">
                <div
                  v-if="entry.entry_id !== e.entry_id"
                  v-for="i in Array.from({ length: getMatch(entry.entry_id, e.entry_id)?.format || 3 }, (_, index) => index + 1)"
                  :key="index"
                >
                  <span>{{ getMatch(entry.entry_id, e.entry_id)?.scores.find(s => s.set_no === i && s.entry_id === entry.entry_id)?.set }}</span>
                  <span>{{ getMatch(entry.entry_id, e.entry_id)?.scores.find(s => s.set_no === i && s.entry_id === e.entry_id)?.set }}</span>
                  <sup v-if="getMatch(entry.entry_id, e.entry_id)?.scores.find(s => s.set_no === i && isDefined(s.tb))">
                    {{
                      Math.min(
                        ...(getMatch(entry.entry_id, e.entry_id)
                          ?.scores.filter(s => s.set_no === i)
                          .map(s => s.tb || 0) || [])
                      )
                    }}
                  </sup>
                </div>
              </div>
            </td>
            <td class="text-center"> {{ entryStats.get(entry.entry_id)?.matchesWon }}-{{ entryStats.get(entry.entry_id)?.matchesLost }} </td>
            <td class="text-center">
              {{ entryStats.get(entry.entry_id)?.setsWon }}-{{ entryStats.get(entry.entry_id)?.setsLost }} ({{
                (
                  (entryStats.get(entry.entry_id)?.setsWon / (entryStats.get(entry.entry_id)?.setsWon + entryStats.get(entry.entry_id)?.setsLost)) *
                  100
                ).toFixed(2)
              }}%)
            </td>
            <td class="text-center">
              {{ entryStats.get(entry.entry_id)?.gamesWon }}-{{ entryStats.get(entry.entry_id)?.gamesLost }} ({{
                (
                  (entryStats.get(entry.entry_id)?.gamesWon /
                    (entryStats.get(entry.entry_id)?.gamesWon + entryStats.get(entry.entry_id)?.gamesLost)) *
                  100
                ).toFixed(2)
              }}%)
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </dashboard-subpanel>
</template>
