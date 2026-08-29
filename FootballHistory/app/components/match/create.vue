<script setup lang="ts">
import { cloneDeep, deburr, kebabCase } from "lodash"
import { any, coerce, object, string, z } from "zod"
import { set, isDefined } from "@vueuse/core"
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"
import { ICONS, MATCH_DECISION_MAPPING, MATCH_STATUS_MAPPING } from "#imports"
import { toCalendarDateTime, Time } from "@internationalized/date"

const teamSchema = object({
  team: object({ id: string(), short_name: string() }).optional(),
  score: coerce.number().optional(),
  penalties: coerce.number().optional(),
  possession: coerce.number().optional(),
  shots: coerce.number().optional(),
  shots_on_target: coerce.number().optional(),
  corners: coerce.number().optional(),
  fouls: coerce.number().optional(),
  offsides: coerce.number().optional(),
  yellow_cards: coerce.number().optional(),
  red_cards: coerce.number().optional()
})
type TeamSchema = z.infer<typeof teamSchema>

const schema = object({
  round_id: string().optional(),
  group_id: string().optional(),
  home_team: teamSchema,
  away_team: teamSchema,
  match_no: coerce.number(),
  venue: object({ id: string() }).optional(),
  date: any().optional(),
  time: any().optional(),
  status: MatchStatusEnum,
  decision: MatchDecisionEnum
})

type Schema = z.infer<typeof schema>

defineShortcuts({
  ctrl_a: () => set(isOpen, !isOpen.value)
})

const props = defineProps<{ seasonId: string }>()

const router = useRouter()
const toast = useToast()
const supabase = useSupabaseClient()
const { ui } = useAppConfig()

const initialState = {
  home_team: {},
  away_team: {}
}

const isOpen = ref(false)
const isSaving = ref(false)
const errors = ref()

const state = ref<Partial<Schema>>(cloneDeep(initialState))

const { data: rounds, pending: roundsPending } = await useAsyncData(
  () => `${props.seasonId}-add-match-rounds`,
  async () => {
    const { data: rounds, error: roundsError } = await supabase
      .schema("football")
      .from("round")
      .select("id, name")
      .eq("season_id", props.seasonId)
      .order("round_order", { ascending: true })

    if (roundsError) {
      console.error("Error fetching rounds:", roundsError)
    }

    return rounds || []
  },
  { default: () => [] }
)

const {
  data: groups,
  pending: groupsPending,
  execute: fetchGroups
} = await useAsyncData(
  () => `${props.seasonId}-add-match-groups-${state.value.round_id}`,
  async () => {
    const { data: groupsData, error: groupsError } = await supabase
      .schema("football")
      .from("group")
      .select("id, name")
      .eq("round_id", state.value.round_id!)

    if (groupsError) {
      console.error("Error fetching groups:", groupsError)
    }

    return groupsData || []
  },
  { default: () => [], watch: [() => state.value.round_id], immediate: false }
)

watch(
  () => state.value.round_id,
  () => {
    if (state.value.round_id) {
      fetchGroups()
    }
  }
)

const { data: teams, pending: teamsPending } = await useAsyncData(
  () => `${props.seasonId}-add-match-teams-${state.value.group_id}`,
  async () => {
    if (state.value.group_id) {
      const { data: teamsData, error: teamsError } = await supabase
        .schema("football")
        .from("team")
        .select("id, short_name, name, logo_url, nicknames, group_team!inner(group_id)")
        .eq("group_team.group_id", state.value.group_id)

      if (teamsError) {
        console.error("Error fetching teams:", teamsError)
      }
      return (teamsData || [])?.map(team => ({ ...team, aka: team.short_name || team.name }))
    } else {
      const { data: teamsData, error: teamsError } = await supabase
        .schema("football")
        .from("team")
        .select("id, short_name, name, logo_url, nicknames, team_season!inner(season_id)")
        .eq("team_season.season_id", props.seasonId)

      if (teamsError) {
        console.error("Error fetching teams:", teamsError)
      }
      return (teamsData || [])?.map(team => ({ ...team, aka: team.short_name || team.name }))
    }
  },
  { default: () => [], watch: [() => state.value.group_id] }
)

const handleReset = () => {
  set(state, cloneDeep(initialState))
  set(errors, undefined)
}

const onError = (event: FormErrorEvent) => {
  console.error(event.errors)
  set(errors, JSON.stringify(event.errors))
}

const onSubmit = async (event: FormSubmitEvent<Schema>) => {
  set(isSaving, true)

  const { home_team, away_team, venue, date, time, ...rest } = event.data

  try {
    const winningTeam =
      isDefined(home_team.score) && isDefined(away_team.score) ?
        home_team.score > away_team.score ? "home"
        : home_team.score < away_team.score ? "away"
        : "draw"
      : null
    const kickoffTime =
      date ?
        toCalendarDateTime(date, time ?? new Time(0, 0))
          .toDate("America/New_York")
          .toISOString()
      : null
    // Insert match
    const { data, error } = await supabase
      .schema("football")
      .from("match")
      .insert({
        ...rest,
        season_id: props.seasonId,
        home_team_id: home_team.team!.id,
        away_team_id: away_team.team!.id,
        venue_id: venue?.id,
        kickoff_time: kickoffTime,
        home_score: home_team.score,
        away_score: away_team.score,
        home_penalties: home_team.penalties,
        away_penalties: away_team.penalties,
        winning_team_id:
          winningTeam === "home" ? home_team.team!.id
          : winningTeam === "away" ? away_team.team!.id
          : null
      })
      .select("id")
    if (error || !data?.[0]?.id) {
      console.error("Error creating match:", error)
      set(errors, error)
      return
    }

    // Insert match stats
    if (home_team.possession) {
      const { team: homeTeam, score: homeScore, penalties: homePenalties, ...homeTeamRest } = home_team
      const { team: awayTeam, score: awayScore, penalties: awayPenalties, ...awayTeamRest } = away_team

      const { data: stats, error: statsError } = await supabase
        .schema("football")
        .from("match_stats")
        .insert([
          {
            ...homeTeamRest,
            match_id: data[0].id,
            team_id: homeTeam!.id
          },
          {
            ...awayTeamRest,
            match_id: data[0].id,
            team_id: awayTeam!.id
          }
        ])
        .select("*")

      if (statsError) {
        console.error("Error creating match stats:", statsError)
        set(errors, statsError)
        toast.add({
          title: "Error creating match stats",
          color: "error"
        })
      }
    }
    toast.add({
      title: error ? "Error creating match" : "Match successfully created!",
      icon: ui.icons[error ? "error" : "success"],
      color: error ? "error" : "success"
    })
    handleReset()
    set(isOpen, false)
    router.push({
      name: "match",
      params: {
        match_id: data[0].id,
        team1: deburr(kebabCase(home_team.team!.short_name)),
        team2: deburr(kebabCase(away_team.team!.short_name))
      }
    })
  } finally {
    set(isSaving, false)
  }
}

const formFields = computed<Array<FormFieldInterface<Schema>>>(
  () =>
    [
      {
        label: "Round",
        key: "round_id",
        type: "inputMenu",
        items: rounds.value,
        loading: roundsPending.value,
        valueKey: "id",
        labelKey: "name",
        class: groups.value.length ? "col-span-1" : "col-span-2"
      },
      ...(groups.value.length ?
        [{ label: "Group", key: "group_id", type: "inputMenu", items: groups.value, loading: groupsPending.value, valueKey: "id", labelKey: "name" }]
      : []),
      { label: "Date", key: "date", type: "date" },
      { label: "Time", key: "time", type: "time" },
      { label: "Match No.", key: "match_no", type: "number", required: true },
      { label: "Venue", key: "venue", type: "slot" },
      {
        label: "Status",
        key: "status",
        type: "inputMenu",
        items: Object.entries(MATCH_STATUS_MAPPING).map(([key, value]) => ({ label: value, value: key })),
        valueKey: "value",
        required: true
      },
      {
        label: "Decision",
        key: "decision",
        type: "inputMenu",
        items: Object.entries(MATCH_DECISION_MAPPING).map(([key, value]) => ({ label: value, value: key })),
        valueKey: "value",
        required: true
      }
    ] as Array<FormFieldInterface<Schema>>
)

const teamFields = computed<Array<FormFieldInterface<TeamSchema>>>(() => [
  { label: "Team", key: "team", type: "slot", required: true, class: "col-span-5" },
  { label: "Score", key: "score", type: "number" },
  { label: "Penalties", key: "penalties", type: "number" },
  { label: "Possession (%)", key: "possession", type: "number", decimal: true },
  { label: "Shots", key: "shots", type: "number" },
  { label: "Shots on Target", key: "shots_on_target", type: "number" },
  { label: "Yellow Cards", key: "yellow_cards", type: "number" },
  { label: "Red Cards", key: "red_cards", type: "number" },
  { label: "Fouls", key: "fouls", type: "number" },
  { label: "Offsides", key: "offsides", type: "number" },
  { label: "Corners", key: "corners", type: "number" }
])
</script>

<template>
  <u-modal
    v-model:open="isOpen"
    title="Create Match"
  >
    <u-button :icon="ui.icons.plus" />

    <template #body>
      <u-alert
        v-if="errors"
        color="error"
        title="Error creating match"
        :description="errors"
        class="mb-5"
      />

      <u-form
        id="match-form"
        :schema
        :state
        @submit="onSubmit"
        @error="onError"
        class="space-y-3"
      >
        <div class="grid grid-cols-2 items-center gap-3">
          <form-field
            v-for="field in formFields"
            :key="field.label"
            :field
            v-model="state"
          >
            <venue-search v-model="<any>state.venue" />
          </form-field>
        </div>

        <u-separator label="Home Team" />

        <div class="grid grid-cols-5 gap-2">
          <u-form-field
            v-for="field in teamFields"
            :key="field.label"
            :name="`home_team.${field.key}`"
            :label="field.label"
            :required="field.required"
            :class="field.class"
          >
            <form-input-number
              v-if="field.type === 'number'"
              v-model="<any>state.home_team![field.key as keyof TeamSchema]"
              :placeholder="field.label"
              :decimal="field.decimal"
            />

            <u-input-menu
              v-else
              v-model="<any>state.home_team!.team"
              :items="teams"
              placeholder="Team"
              :loading="teamsPending"
              class="w-full"
              label-key="aka"
              :filter-fields="['name', 'short_name']"
            >
              <template #leading="{ modelValue }">
                <u-avatar
                  :src="modelValue?.logo_url || ''"
                  loading="lazy"
                  :icon="ICONS.team"
                  class="size-3"
                />
              </template>

              <template #item-leading="{ item }">
                <u-avatar
                  :src="item.logo_url || ''"
                  loading="lazy"
                  :icon="ICONS.team"
                />
              </template>

              <template #item-description="{ item }">{{ item.nicknames[0] }}</template>
            </u-input-menu>
          </u-form-field>
        </div>

        <u-separator label="Away Team" />

        <div class="grid grid-cols-5 gap-2">
          <u-form-field
            v-for="field in teamFields"
            :key="field.label"
            :name="`away_team.${field.key}`"
            :label="field.label"
            :required="field.required"
            :class="field.class"
          >
            <form-input-number
              v-if="field.type === 'number'"
              v-model="<any>state.away_team![field.key as keyof TeamSchema]"
              :placeholder="field.label"
              :decimal="field.decimal"
            />

            <u-input-menu
              v-else
              v-model="<any>state.away_team!.team"
              :items="teams"
              placeholder="Team"
              :loading="teamsPending"
              class="w-full"
              label-key="aka"
              :filter-fields="['name', 'short_name']"
            >
              <template #leading="{ modelValue }">
                <u-avatar
                  :src="modelValue?.logo_url || ''"
                  loading="lazy"
                  :icon="ICONS.team"
                  class="size-3"
                />
              </template>

              <template #item-leading="{ item }">
                <u-avatar
                  :src="item.logo_url || ''"
                  loading="lazy"
                  :icon="ICONS.team"
                />
              </template>

              <template #item-description="{ item }">{{ item.nicknames[0] }}</template>
            </u-input-menu>
          </u-form-field>
        </div>
      </u-form>
    </template>

    <template #footer="{ close }">
      <form-footer
        form="match-form"
        :loading="isSaving"
        @reset="handleReset"
        @close="close"
      />
    </template>
  </u-modal>
</template>
