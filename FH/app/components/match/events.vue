<script setup lang="ts">
import { ICONS, MATCH_EVENT_TYPE_MAPPING, MATCH_EVENT_ROLE_MAPPING, GOAL_EXECUTION_MAPPING, GOAL_SITUATION_MAPPING } from "#imports"
import { kebabCase } from "lodash"
import { type Tables } from "~/types/database.types"

type TeamType = Pick<Tables<{ schema: "football" }, "team">, "id" | "name" | "short_name" | "logo_url">

const props = defineProps<{
  homeTeam: TeamType
  awayTeam: TeamType
}>()

const route = useRoute("match")
const supabase = useSupabaseClient()

const {
  data: events,
  pending,
  refresh
} = await useAsyncData(
  () => `match-events-${route.params.match_id}`,
  async () => {
    const { data, error } = await supabase
      .from("match_event")
      .select("*, players:match_event_player(role, ...player(id, aka, ...people(full_name, country!nationality_country_id(*))))")
      .eq("match_id", route.params.match_id)
      .order("minute", { ascending: true })
      .order("stoppage_minute", { ascending: true })

    if (error || !data) {
      console.error("Error fetching events:", error)
      return []
    }

    return data
  },
  { default: () => [] }
)

const getIcon = (type: string) => {
  switch (type) {
    case "goal":
      return ICONS.football
    case "injury":
      return ICONS.injury
    case "substitution":
      return ICONS.substitution
    case "save":
    case "penalty_saved":
      return ICONS.keeper
    case "penalty_missed":
      return ICONS.football_off
    case "second_yellow_card":
      return ICONS.second_card
    default:
      return ICONS.card
  }
}

const getTextColour = (type: string) => {
  switch (type) {
    case "goal":
    case "save":
      return "text-success"
    case "injury":
    case "red_card":
    case "penalty_missed":
    case "penalty_saved":
      return "text-error"
    case "yellow_card":
    case "second_yellow_card":
      return "text-warning"
    default:
      return "text-info"
  }
}

const sortPlayers = (a: any, b: any) => {
  const sortingOrder = [
    "keeper",
    "assist",
    "scorer",
    "own_goal_scorer",
    "penalty_won_by",
    "fouled_player",
    "penalty_conceded_by",
    "committed_by",
    "penalty_taker",
    "sub_on",
    "sub_off",
    "carded_player",
    "injured_player"
  ]

  return sortingOrder.indexOf(a.role) - sortingOrder.indexOf(b.role)
}

const getPlayerIcon = (role: string) => {
  switch (role) {
    case "keeper":
      return ICONS.keeper
    case "scorer":
      return ICONS.football
    case "sub_on":
      return ICONS.sub_on
    case "sub_off":
      return ICONS.sub_off
    case "assist":
      return ICONS.assist
    case "penalty_taker":
    case "own_goal_scorer":
      return ICONS.player
    default:
      return undefined
  }
}
</script>

<template>
  <u-card>
    <template #header>
      <div class="font-semibold">Events</div>

      <dev-only>
        <lazy-match-add-events
          :home-team="homeTeam"
          :away-team="awayTeam"
          hydrate-on-idle
          @refresh="refresh"
        />
      </dev-only>
    </template>

    <u-timeline
      :items="<any>events"
      :ui="{ indicator: 'text-lg' }"
    >
      <template #indicator="{ item }">
        <u-icon
          :name="getIcon(item.type)"
          :class="getTextColour(item.type)"
        />
      </template>

      <template #wrapper="{ item }">
        <div
          class="w-full ring p-5 rounded-xl"
          :class="item.team_id === homeTeam.id ? 'ring-primary' : 'ring-secondary'"
        >
          <div class="text-dimmed text-xs/5">
            {{
              item.type === "substitution" ?
                item.minute === 46 ? "HT"
                : item.minute === 91 ? "PET"
                : item.minute === 106 ? "ET - HT"
                : `${item.minute}'`
              : `${item.minute}'`
            }}
            <span v-if="item.stoppage_minute"> + {{ item.stoppage_minute }}'</span>
          </div>

          <u-user
            :name="item.team_id === homeTeam.id ? homeTeam.short_name || homeTeam.name : awayTeam.short_name || awayTeam.name"
            :avatar="{
              src: item.team_id === homeTeam.id ? homeTeam.logo_url || '' : awayTeam.logo_url || '',
              loading: 'lazy',
              icon: ICONS.team
            }"
            :ui="{ root: 'my-2', name: 'text-base' }"
          >
            <template #description>
              <span>{{ MATCH_EVENT_TYPE_MAPPING[item.type as keyof typeof MATCH_EVENT_TYPE_MAPPING] }}</span>
              <span v-if="item.type === 'goal' && item.goal_situation !== 'unknown'">
                - {{ GOAL_SITUATION_MAPPING[item.goal_situation as keyof typeof GOAL_SITUATION_MAPPING] }}
                <span v-if="item.goal_execution !== 'unknown'">
                  - {{ GOAL_EXECUTION_MAPPING[item.goal_execution as keyof typeof GOAL_EXECUTION_MAPPING] }}</span
                >
              </span>
            </template>
          </u-user>

          <div class="grid grid-cols-3 gap-3">
            <u-page-feature
              v-for="player in item.players.sort(sortPlayers)"
              :key="player.id"
              :title="player.full_name!"
              :description="
                player.role === 'carded_player' ? undefined : MATCH_EVENT_ROLE_MAPPING[player.role as keyof typeof MATCH_EVENT_ROLE_MAPPING]
              "
              :icon="getPlayerIcon(player.role)"
              :to="{ name: 'player', params: { id: player.id, name: kebabCase(player.full_name) } }"
              :ui="{
                title: 'text-sm',
                description: 'text-xs',
                leadingIcon:
                  player.role === 'sub_on' ? 'text-success'
                  : player.role === 'sub_off' ? 'text-error'
                  : player.role === 'scorer' ? 'text-success'
                  : 'text-default'
              }"
            />
          </div>
        </div>
      </template>
    </u-timeline>
  </u-card>
</template>
