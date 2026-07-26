<script setup lang="ts">
import { formatDate, ICONS } from "#imports"
import type { TableColumn } from "@nuxt/ui"
import { kebabCase } from "lodash"

const route = useRoute("player")
const supabase = useSupabaseClient()
const { ui } = useAppConfig()

const {
  data: stats,
  pending,
  refresh
} = await useAsyncData(
  () => `match-stats-${route.params.id}`,
  async () => {
    const { data, error } = await supabase
      .from("player_match_stats")
      .select(
        "*, season(name, competition(id, name)), home_team:team!home_team_id(name, short_name, logo_url), away_team:team!away_team_id(name, short_name, logo_url)"
      )
      .eq("id", route.params.id)

    if (error || !data) {
      console.error("Error fetching player match stats:", error)
      return []
    }

    return data.map(item => ({
      ...item,
      home_team: { ...item.home_team, name: item.home_team?.short_name || item.home_team!.name },
      away_team: { ...item.away_team, name: item.away_team?.short_name || item.away_team!.name }
    }))
  },
  { default: () => [] }
)
type StatsType = (typeof stats.value)[number]

const selectedCompetition = ref<string | null>(null)
const competitionOptions = computed(() =>
  useArrayUnique(stats.value.map(item => item.season!.competition.name)).value.sort((a, b) => a!.localeCompare(b!))
)

const columns: Array<TableColumn<StatsType>> = [
  { id: "competition", header: "Competition" },
  { accessorKey: "kickoff_time", header: "Date" },
  { id: "teams", header: "" },
  { id: "score", header: "Score" },
  { id: "appearance" },
  { accessorKey: "minutes_played", header: "Minutes Played" },
  { id: "goals" },
  { id: "penalties" },
  { id: "discipline" },
  { id: "goalkeeping" }
]
</script>

<template>
  <div class="space-y-6">
    <u-input-menu
      v-model="selectedCompetition"
      :items="competitionOptions"
      placeholder="Competition"
      clear
    />

    <u-table
      :data="stats"
      :columns
      :loading="pending"
      sticky
      class="scrollbar"
    >
      <template #loading>
        <loading-icon />
      </template>

      <template #empty>
        <empty
          title="No matches found"
          icon="fluent:people-team-delete-20-regular"
        />
      </template>

      <template #competition-cell="{ row }">
        <u-link
          :to="{
            name: 'season',
            params: {
              id: row.original.season!.competition.id,
              name: kebabCase(row.original.season?.competition.name!),
              season: encodeURIComponent(row.original.season!.name)
            }
          }"
          class="hover-link primary-link"
        >
          {{ row.original.season?.competition.name }}
        </u-link>
      </template>

      <template #kickoff_time-cell="{ row }">
        {{ row.original.kickoff_time && formatDate(row.original.kickoff_time) }}
      </template>

      <template #teams-cell="{ row }">
        <div>
          <u-user
            :name="row.original.home_team.short_name || row.original.home_team.name!"
            :avatar="{ src: row.original.home_team.logo_url || '', loading: 'lazy', icon: ICONS.team }"
            :to="{ name: 'team', params: { id: row.original.home_team_id!, name: kebabCase(row.original.home_team.name!) } }"
            size="xs"
            :ui="{ name: (row.original.home_score || 0) > (row.original.away_score || 0) ? 'font-semibold' : 'text-muted font-normal' }"
          />
          <u-user
            :name="row.original.away_team.short_name || row.original.away_team.name!"
            :avatar="{ src: row.original.away_team.logo_url || '', loading: 'lazy', icon: ICONS.team }"
            :to="{ name: 'team', params: { id: row.original.away_team_id!, name: kebabCase(row.original.away_team.name!) } }"
            size="xs"
            :ui="{ name: (row.original.away_score || 0) > (row.original.home_score || 0) ? 'font-semibold' : 'text-muted font-normal' }"
          />
        </div>
      </template>

      <template #appearance-cell="{ row }">
        <u-icon
          :name="
            ICONS[
              row.original.starter ? 'whistle'
              : row.original.appearance ? 'substitution'
              : 'bench'
            ]
          "
          class="text-2xl"
        />
      </template>

      <template #score-cell="{ row }">
        <div class="grid grid-cols-2 items-center gap-1 w-fit mx-auto">
          <div>
            <div :class="{ 'font-semibold text-accented': (row.original.home_score || 0) > (row.original.away_score || 0) }">
              {{ row.original.home_score }}
            </div>
            <div :class="{ 'font-semibold text-accented': (row.original.away_score || 0) > (row.original.home_score || 0) }">
              {{ row.original.away_score }}
            </div>
          </div>

          <u-badge
            :label="row.original.result?.charAt(0)"
            :color="
              row.original.result === 'Win' ? 'success'
              : row.original.result === 'Loss' ? 'error'
              : 'warning'
            "
          />
        </div>
      </template>

      <template #goals-header>
        <div>Scoring</div>
        <div class="flex justify-center gap-2">
          <u-icon
            :name="ICONS.football"
            class="text-success text-lg"
          />
          <u-icon
            :name="ICONS.assist"
            class="text-info text-lg"
          />
          <u-badge
            label="OG"
            color="error"
          />
        </div>
      </template>

      <template #goals-cell="{ row }">
        <div class="flex justify-center items-center gap-1">
          <u-badge
            color="success"
            :label="row.original.goals?.toString()"
          />
          <u-badge
            color="info"
            :label="row.original.assists?.toString()"
          />
          <u-badge
            color="error"
            :label="row.original.own_goals?.toString()"
          />
        </div>
      </template>

      <template #penalties-header>
        <div>Penalties</div>
        <div class="flex justify-center items-center gap-2">
          <u-icon
            :name="ICONS.football"
            class="text-success text-lg"
          />
          <u-icon
            :name="ICONS.keeper"
            class="text-warning text-lg"
          />
          <u-icon
            :name="ICONS.football_off"
            class="text-error text-lg"
          />
        </div>
      </template>

      <template #penalties-cell="{ row }">
        <div class="flex justify-center items-center gap-1">
          <u-badge
            color="success"
            :label="row.original.penalties?.toString()"
          />
          <u-badge
            color="warning"
            :label="((row.original.penalties_taken || 0) - (row.original.penalties || 0) - (row.original.penalties_missed || 0)).toString()"
          />
          <u-badge
            color="error"
            :label="row.original.penalties_missed?.toString()"
          />
        </div>
      </template>

      <template #discipline-header>
        <div>Discipline</div>
        <div class="flex justify-center items-center gap-2">
          <u-icon
            :name="ICONS.card"
            class="text-yellow text-lg"
          />
          <u-icon
            :name="ICONS.second_card"
            class="text-orange text-lg"
          />
          <u-icon
            :name="ICONS.card"
            class="text-error text-lg"
          />
        </div>
      </template>

      <template #discipline-cell="{ row }">
        <div class="flex justify-center items-center gap-1">
          <u-badge
            color="yellow"
            :label="row.original.yellow_cards?.toString()"
          />
          <u-badge
            color="orange"
            :label="row.original.second_yellows?.toString()"
          />
          <u-badge
            color="error"
            :label="row.original.red_cards?.toString()"
          />
        </div>
      </template>

      <template #goalkeeping-header>
        <div>Goalkeeping</div>
        <div class="flex justify-center items-center gap-2">
          <u-icon
            :name="ICONS.keeper"
            class="text-info text-lg"
          />
          <u-badge
            label="P"
            color="secondary"
          />
          <u-icon
            :name="ui.icons.success"
            class="text-success text-xl"
          />
        </div>
      </template>

      <template #goalkeeping-cell="{ row }">
        <div class="flex justify-center items-center gap-0.5">
          <u-badge
            color="info"
            :label="row.original.saves?.toString()"
          />
          <u-badge
            color="secondary"
            :label="row.original.penalty_saves?.toString()"
          />
          <u-icon
            :name="ui.icons[row.original.clean_sheet ? 'success' : 'error']"
            class="text-lg"
            :class="row.original.clean_sheet ? 'text-success' : 'text-error'"
          />
        </div>
      </template>
    </u-table>
  </div>
</template>
