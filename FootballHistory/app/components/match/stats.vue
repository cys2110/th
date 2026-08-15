<script setup lang="ts">
import { ICONS } from "#imports"
import { kebabCase } from "lodash"
import { type Tables } from "~/types/database.types"

type TeamType = Pick<Tables<{ schema: "football" }, "team">, "id" | "name" | "short_name" | "logo_url">

const props = defineProps<{
  homeTeam: TeamType
  awayTeam: TeamType
}>()

const route = useRoute("match")
const supabase = useSupabaseClient()

const { data: statsArray, refresh } = await useAsyncData(
  () => `match-stats-${route.params.match_id}`,
  async () => {
    const { data, error } = await supabase.from("match_stats").select("*").eq("match_id", route.params.match_id)

    if (error || !data) {
      console.error("Error fetching match stats:", error)
      return []
    }

    return data
  },
  { default: () => [] }
)

const stats = computed(() => {
  if (statsArray.value.length) {
    const homeStats = statsArray.value.find(item => item.team_id === props.homeTeam.id)
    const awayStats = statsArray.value.find(item => item.team_id === props.awayTeam.id)

    return [
      {
        label: "Shots",
        total: statsArray.value.reduce((acc, item) => acc + (item.shots || 0), 0),
        home: homeStats?.shots || 0,
        away: awayStats?.shots || 0
      },
      {
        label: "Shots on Target",
        total: statsArray.value.reduce((acc, item) => acc + (item.shots_on_target || 0), 0),
        home: homeStats?.shots_on_target || 0,
        away: awayStats?.shots_on_target || 0
      },
      {
        label: "Shots off Target",
        total: statsArray.value.reduce((acc, item) => acc + (item.shots || 0) - (item.shots_on_target || 0), 0),
        home: (homeStats?.shots || 0) - (homeStats?.shots_on_target || 0),
        away: (awayStats?.shots || 0) - (awayStats?.shots_on_target || 0)
      },
      {
        label: "Yellow Cards",
        total: statsArray.value.reduce((acc, item) => acc + (item.yellow_cards || 0), 0),
        home: homeStats?.yellow_cards || 0,
        away: awayStats?.yellow_cards || 0
      },
      {
        label: "Red Cards",
        total: statsArray.value.reduce((acc, item) => acc + (item.red_cards || 0), 0),
        home: homeStats?.red_cards || 0,
        away: awayStats?.red_cards || 0
      },
      {
        label: "Fouls",
        total: statsArray.value.reduce((acc, item) => acc + (item.fouls || 0), 0),
        home: homeStats?.fouls || 0,
        away: awayStats?.fouls || 0
      },
      {
        label: "Offsides",
        total: statsArray.value.reduce((acc, item) => acc + (item.offsides || 0), 0),
        home: homeStats?.offsides || 0,
        away: awayStats?.offsides || 0
      },
      {
        label: "Corners",
        total: statsArray.value.reduce((acc, item) => acc + (item.corners || 0), 0),
        home: homeStats?.corners || 0,
        away: awayStats?.corners || 0
      }
    ]
  } else {
    return []
  }
})

const inContestPercentage = computed(() => 100 - statsArray.value.reduce((acc, item) => acc + (item.possession || 0), 0))
</script>

<template>
  <u-card>
    <template #header>
      <div class="font-semibold">Stats</div>
    </template>

    <div
      v-if="statsArray"
      class="space-y-2 text-xs *:w-full"
    >
      <div class="flex justify-between">
        <u-user
          :name="homeTeam.short_name || homeTeam.name"
          :avatar="{
            src: homeTeam.logo_url || '',
            loading: 'lazy',
            icon: ICONS.team
          }"
          :to="{ name: 'team', params: { id: homeTeam.id, name: kebabCase(homeTeam.name) } }"
        />

        <u-user
          :name="awayTeam.short_name || awayTeam.name"
          :avatar="{
            src: awayTeam.logo_url || '',
            loading: 'lazy',
            icon: ICONS.team
          }"
          :to="{ name: 'team', params: { id: awayTeam.id, name: kebabCase(awayTeam.name) } }"
        />
      </div>

      <div>
        <div class="text-center"> Possession </div>

        <div class="flex items-center w-full overflow-hidden">
          <div
            class="shrink-0 min-w-0 flex items-center"
            :style="{ width: `${statsArray.find(item => item.team_id === props.homeTeam.id)?.possession || 0}%` }"
          >
            <u-progress
              inverted
              :model-value="100"
              :max="100"
              status
            >
              <template #status> {{ statsArray.find(item => item.team_id === props.homeTeam.id)?.possession || 0 }}% </template>
            </u-progress>
          </div>

          <div
            v-if="inContestPercentage"
            class="shrink-0 min-w-0 flex items-center"
            :style="{
              width: `${inContestPercentage}%`
            }"
          >
            <u-progress
              inverted
              :model-value="100"
              :max="100"
              color="warning"
            />
          </div>

          <div
            class="shrink-0 min-w-0 flex items-center"
            :style="{ width: `${statsArray.find(item => item.team_id === props.awayTeam.id)?.possession || 0}%` }"
          >
            <u-progress
              :model-value="100"
              :max="100"
              status
              color="secondary"
            >
              <template #status> {{ statsArray.find(item => item.team_id === props.awayTeam.id)?.possession || 0 }}% </template>
            </u-progress>
          </div>
        </div>

        <div
          v-if="inContestPercentage"
          class="text-center"
        >
          {{ inContestPercentage }}% in contest
        </div>
      </div>

      <template
        v-for="stat in stats"
        :key="stat.label"
      >
        <div>
          <div class="text-center">{{ stat.label }}</div>
          <div class="flex gap-0.5">
            <u-progress
              inverted
              :model-value="stat.home"
              :max="stat.total"
              status
            >
              <template #status>
                {{ stat.home }}
              </template>
            </u-progress>

            <u-progress
              :model-value="stat.away"
              :max="stat.total"
              status
              color="secondary"
            >
              <template #status>
                {{ stat.away }}
              </template>
            </u-progress>
          </div>
        </div>
      </template>
    </div>

    <empty
      v-else
      title="No stats available"
      @refresh="refresh"
    />
  </u-card>
</template>
