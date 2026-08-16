<script setup lang="ts">
import { COMPETITION_CATEGORIES, COMPETITION_TYPES, TEAM_TYPES } from "#imports"

const route = useRoute("player")
const supabase = useSupabaseClient()

const { data, pending, refresh } = await useAsyncData(
  () => `career-stats-${route.params.id}`,
  async () => {
    const { data, error } = await supabase
      .schema("football")
      .from("player_career_stats")
      .select("*, team(name, short_name, logo_url)")
      .eq("id", route.params.id)

    if (error || !data) {
      console.error("Error fetching player career stats:", error)
      return []
    }

    return data.map(item => ({ ...item, team: { ...item.team, name: item.team?.short_name || item.team!.name } }))
  },
  { default: () => [] }
)

const filters = ref<Record<string, any>>({})
const teamOptions = computed(() => useArrayUnique(data.value.map(item => item.team)).value.sort((a, b) => a.name.localeCompare(b.name)))
const competitionOptions = computed(() => useArrayUnique(data.value.map(item => item.competition)).value.sort((a, b) => a!.localeCompare(b!)))

const stats = computed(() => {
  const filteredData = data.value.filter(item => {
    const competitionMatch = !filters.value.competition || item.competition === filters.value.competition
    const competitionTypeMatch = !filters.value.competition_type || item.competition_type === filters.value.competition_type
    const competitionCategoryMatch = !filters.value.competition_category || item.competition_category === filters.value.competition_category
    const teamMatch = !filters.value.team || item.team?.name === filters.value.team.name
    const teamTypeMatch = !filters.value.team_type || item.team_type === filters.value.team_type

    return competitionMatch && competitionTypeMatch && competitionCategoryMatch && teamMatch && teamTypeMatch
  })

  return {
    appearances: filteredData.reduce((acc, item) => acc + (item.appearances || 0), 0),
    starts: filteredData.reduce((acc, item) => acc + (item.starter || 0), 0),
    minutes_played: filteredData.reduce((acc, item) => acc + (item.minutes_played || 0), 0),
    goals: filteredData.reduce((acc, item) => acc + (item.goals || 0), 0),
    assists: filteredData.reduce((acc, item) => acc + (item.assists || 0), 0),
    own_goals: filteredData.reduce((acc, item) => acc + (item.own_goals || 0), 0),
    red_cards: filteredData.reduce((acc, item) => acc + (item.red_cards || 0), 0),
    yellow_cards: filteredData.reduce((acc, item) => acc + (item.yellow_cards || 0), 0),
    second_yellows: filteredData.reduce((acc, item) => acc + (item.second_yellows || 0), 0),
    saves: filteredData.reduce((acc, item) => acc + (item.saves || 0), 0),
    clean_sheets: filteredData.reduce((acc, item) => acc + (item.clean_sheets || 0), 0),
    penalty_saves: filteredData.reduce((acc, item) => acc + (item.penalty_saves || 0), 0),
    penalties: filteredData.reduce((acc, item) => acc + (item.penalties || 0), 0),
    penalties_taken: filteredData.reduce((acc, item) => acc + (item.penalties_taken || 0), 0),
    penalties_missed: filteredData.reduce((acc, item) => acc + (item.penalties_missed || 0), 0)
  } as const
})

const isGoalkeeper = computed(() => data.value.some(item => item.goalkeeper))
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center gap-3">
      <u-input-menu
        v-model="filters.competition"
        :items="competitionOptions"
        placeholder="Competition"
        clear
      />

      <u-input-menu
        v-model="filters.competition_category"
        :items="COMPETITION_CATEGORIES"
        placeholder="Competition Category"
        value-key="value"
        clear
      />

      <u-input-menu
        v-model="filters.competition_type"
        :items="COMPETITION_TYPES"
        placeholder="Competition Type"
        value-key="value"
        clear
      />

      <u-input-menu
        v-model="filters.team"
        :items="teamOptions"
        placeholder="Team"
        label-key="name"
        clear
      />

      <u-input-menu
        v-model="filters.team_type"
        :items="TEAM_TYPES"
        placeholder="Team Type"
        value-key="value"
        clear
      />
    </div>

    <div class="flex flex-wrap justify-evenly gap-3 p-3">
      <u-card
        class="text-sm"
        :ui="{ root: 'flex-1', header: 'font-semibold' }"
      >
        <template #header>
          <div class="flex justify-between items-center">
            <span>Appearances</span>

            <u-icon
              name="game-icons:soccer-ball"
              class="text-lg"
            />
          </div>
        </template>

        <div class="*:flex *:justify-between *:gap-3 *:*:first:text-muted *:*:last:font-medium">
          <div>
            <div>Total</div>
            <div>{{ stats.appearances.toLocaleString() }}</div>
          </div>

          <div>
            <div>Starts</div>
            <div>{{ stats.starts.toLocaleString() }}</div>
          </div>

          <div>
            <div>Minutes Played</div>
            <div>{{ stats.minutes_played.toLocaleString() }}</div>
          </div>

          <div>
            <div>Avg. Minutes</div>
            <div>{{ Math.round(stats.minutes_played / stats.appearances || 0).toLocaleString() }}</div>
          </div>
        </div>
      </u-card>

      <u-card
        class="text-sm"
        :ui="{ root: 'flex-1', header: 'font-semibold' }"
      >
        <template #header>
          <div class="flex justify-between items-center">
            <span>Goals</span>

            <u-icon
              name="emojione-monotone:goal-net"
              class="text-lg"
            />
          </div>
        </template>

        <div class="*:flex *:justify-between *:gap-3 *:*:first:text-muted *:*:last:font-medium">
          <div>
            <div>Total</div>
            <div>{{ stats.goals.toLocaleString() }}</div>
          </div>

          <div>
            <div>Assists</div>
            <div>{{ stats.assists.toLocaleString() }}</div>
          </div>

          <div>
            <div>Own Goals</div>
            <div>{{ stats.own_goals.toLocaleString() }}</div>
          </div>
        </div>
      </u-card>

      <u-card
        class="text-sm"
        :ui="{ root: 'flex-1', header: 'font-semibold' }"
      >
        <template #header>
          <div class="flex justify-between items-center">
            <span>Penalties</span>

            <u-icon
              name="game-icons:soccer-kick"
              class="text-xl"
            />
          </div>
        </template>

        <div class="*:flex *:justify-between *:gap-3 *:*:first:text-muted *:*:last:font-medium">
          <div>
            <div>Scored</div>
            <div>{{ stats.penalties.toLocaleString() }}</div>
          </div>

          <div>
            <div>Saved</div>
            <div>{{ (stats.penalties_taken - stats.penalties - stats.penalties_missed).toLocaleString() }}</div>
          </div>

          <div>
            <div>Missed</div>
            <div>{{ stats.penalties_missed.toLocaleString() }}</div>
          </div>
        </div>
      </u-card>

      <u-card
        class="text-sm"
        :ui="{ root: 'flex-1', header: 'font-semibold' }"
      >
        <template #header>
          <div class="flex justify-between items-center">
            <span>Discipline</span>

            <u-icon
              name="streamline:cards-remix"
              class="text-lg"
            />
          </div>
        </template>

        <div class="*:flex *:justify-between *:gap-3 *:*:first:text-muted *:*:last:font-medium">
          <div>
            <div>Yellow cards</div>
            <div>{{ stats.yellow_cards.toLocaleString() }}</div>
          </div>

          <div>
            <div>Second Yellow Cards</div>
            <div>{{ stats.second_yellows.toLocaleString() }}</div>
          </div>

          <div>
            <div>Red Cards</div>
            <div>{{ stats.red_cards.toLocaleString() }}</div>
          </div>
        </div>
      </u-card>

      <u-card
        v-if="isGoalkeeper || stats.saves || stats.clean_sheets || stats.penalty_saves"
        class="text-sm"
        :ui="{ root: 'flex-1', header: 'font-semibold' }"
      >
        <template #header>
          <div class="flex justify-between items-center">
            <span>Goalkeeping</span>

            <u-icon
              name="game-icons:goal-keeper"
              class="text-lg"
            />
          </div>
        </template>

        <div class="*:flex *:justify-between *:gap-3 *:*:first:text-muted *:*:last:font-medium">
          <div>
            <div>Saves</div>
            <div>{{ stats.saves.toLocaleString() }}</div>
          </div>

          <div>
            <div>Penalty Saves</div>
            <div>{{ stats.penalty_saves.toLocaleString() }}</div>
          </div>

          <div>
            <div>Clean Sheets</div>
            <div>{{ stats.clean_sheets.toLocaleString() }}</div>
          </div>
        </div>
      </u-card>
    </div>
  </div>
</template>
