<script setup lang="ts">
const tour = defineModel<keyof typeof tourEnum>("tour")
const type = defineModel<MatchTypeEnumType>("type")
const draw = defineModel<DrawEnumType>("draw")

const {
  params: { edId }
} = useRoute("draws")
const {
  ui: { icons }
} = useAppConfig()

// API call
const { data } = await useFetch("/api/edition/draws", {
  query: { edId, tour, type, draw },
  default: () => []
})

const filteredData = computed(() => {
  const allData = data.value.filter(m => m.round === "Round robin")

  return allData
})

watch(
  filteredData,
  () => {
    console.log("Filtered Data:", filteredData.value)
  },
  { immediate: true, deep: true }
)

const groupStandings = computed(() => {
  const uniqueGroups = useArrayUnique(filteredData.value.map((m: DrawMatchType) => m.group!)).value

  const groups: any[] = []

  uniqueGroups.forEach(group => {
    const groupMatches = filteredData.value.filter(m => m.group === group)

    const groupedStandings: any = {}
    const usedContestants = new Set()

    groupMatches.forEach(m => {
      const t1Id = m.t1!.id
      const t2Id = m.t2!.id

      if (!usedContestants.has(t1Id)) {
        groupedStandings[t1Id] = {
          contestants: m.t1!.team,
          matchesWon: 0,
          matchesLost: 0,
          setsWon: 0,
          setsLost: 0,
          gamesWon: 0,
          gamesLost: 0
        }
        usedContestants.add(t1Id)
      }
      if (!usedContestants.has(t2Id)) {
        groupedStandings[t2Id] = {
          contestants: m.t2!.team,
          matchesWon: 0,
          matchesLost: 0,
          setsWon: 0,
          setsLost: 0,
          gamesWon: 0,
          gamesLost: 0
        }
        usedContestants.add(t2Id)
      }

      if (m.winning_team === "t1") {
        groupedStandings[t1Id].matchesWon += 1
        groupedStandings[t2Id].matchesLost += 1
      } else if (m.winning_team === "t2") {
        groupedStandings[t2Id].matchesWon += 1
        groupedStandings[t1Id].matchesLost += 1
      }

      const numberOfSets = [
        [m.team1?.s1, m.team2?.s1],
        [m.team1?.s2, m.team2?.s2],
        [m.team1?.s3, m.team2?.s3],
        [m.team1?.s4, m.team2?.s4],
        [m.team1?.s5, m.team2?.s5]
      ].filter(([t1, t2]) => t1 !== null || t2 !== null).length

      for (let i = 0; i < numberOfSets; i++) {
        groupedStandings[t1Id].gamesWon += (m.team1 as any)[`s${i + 1}`]
        groupedStandings[t1Id].gamesLost += (m.team2 as any)[`s${i + 1}`]
        groupedStandings[t2Id].gamesWon += (m.team2 as any)[`s${i + 1}`]
        groupedStandings[t2Id].gamesLost += (m.team1 as any)[`s${i + 1}`]

        if ((m.team1 as any)[`s${i + 1}`] > (m.team2 as any)[`s${i + 1}`]) {
          groupedStandings[m.t1!.id].setsWon += 1
          groupedStandings[m.t2!.id].setsLost += 1
        } else if ((m.team1 as any)[`s${i + 1}`] < (m.team2 as any)[`s${i + 1}`]) {
          groupedStandings[m.t2!.id].setsWon += 1
          groupedStandings[m.t1!.id].setsLost += 1
        }
      }
    })

    // Sort standings
    const sortedStandings = Object.entries(groupedStandings).sort(([, a]: [string, any], [, b]: [string, any]) => {
      if (b.matchesWon !== a.matchesWon) return b.matchesWon - a.matchesWon
      const aSetDiff = a.setsWon - a.setsLost
      const bSetDiff = b.setsWon - b.setsLost
      if (bSetDiff !== aSetDiff) return bSetDiff - aSetDiff
      const aGameDiff = a.gamesWon - a.gamesLost
      const bGameDiff = b.gamesWon - b.gamesLost
      return bGameDiff - aGameDiff
    })

    groups.push({
      group,
      standings: sortedStandings
    })
  })

  return groups
})

watch(
  groupStandings,
  () => {
    console.log("Group Standings:", groupStandings.value)
  },
  { immediate: true, deep: true }
)
</script>

<template>
  <div>
    <!-- Group Standings -->
    <dashboard-subpanel
      title="Group Standings"
      :icon="ICONS.seeds"
    >
      <div class="grid grid-cols-2 gap-5">
        <u-card
          v-for="group in groupStandings"
          :key="group.group"
          :ui="{ root: 'ring-primary', header: 'font-semibold' }"
        >
          <template #header>
            {{ group.group }}
          </template>

          <table class="[&_td]:px-3 w-full">
            <thead>
              <tr>
                <th>Team</th>
                <th>Matches</th>
                <th>Sets</th>
                <th>Games</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="team in group.standings"
                :key="team[0]"
                class="*:not-first:text-center"
              >
                <td>
                  <player-link
                    v-for="player in team[1].contestants"
                    :key="player.id"
                    :player
                  />
                </td>
                <td>
                  <div>{{ team[1].matchesWon }}-{{ team[1].matchesLost }}</div>
                  <div class="text-muted">{{ percentage(team[1].matchesWon, team[1].matchesWon + team[1].matchesLost) }}%</div>
                </td>
                <td>
                  <div>{{ team[1].setsWon }}-{{ team[1].setsLost }}</div>
                  <div class="text-muted">{{ percentage(team[1].setsWon, team[1].setsWon + team[1].setsLost) }}%</div>
                </td>
                <td>
                  <div>{{ team[1].gamesWon }}-{{ team[1].gamesLost }}</div>
                  <div class="text-muted">{{ percentage(team[1].gamesWon, team[1].gamesWon + team[1].gamesLost) }}%</div>
                </td>
              </tr>
            </tbody>
          </table>
        </u-card>
      </div>
    </dashboard-subpanel>
  </div>
</template>
