<script setup lang="ts">
import { cloneDeep, kebabCase } from "lodash"
import { any, array, boolean, coerce, object, string, z } from "zod"
import { set, isDefined } from "@vueuse/core"
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"
import { type Tables } from "~/types/database.types"
import {
  ICONS,
  MATCH_AWARD_TYPE_MAPPING,
  MATCH_DECISION_MAPPING,
  MATCH_EVENT_TYPE_MAPPING,
  MATCH_STATUS_MAPPING,
  REFEREE_TYPE_MAPPING,
  MATCH_EVENT_ROLE_MAPPING,
  GOAL_SITUATION_MAPPING,
  GOAL_EXECUTION_MAPPING
} from "#imports"
import { toCalendarDateTime, Time } from "@internationalized/date"

type TeamType = Pick<Tables<{ schema: "football" }, "team">, "id" | "short_name" | "name" | "logo_url" | "nicknames">

const refereeSchema = object({
  person: object({ id: string() }),
  referee_type: RefereeType
})
type RefereeSchema = z.infer<typeof refereeSchema>

const lineupSchema = object({
  player: object({ id: string() }),
  position_id: string().optional(),
  shirt_number: coerce.number().optional(),
  starter: boolean(),
  captain: boolean()
})
type LineupSchema = z.infer<typeof lineupSchema>

const eventPlayerSchema = object({
  player: object({ id: string() }).optional(),
  role: MatchEventRole
}).optional()
type EventPlayerSchema = z.infer<typeof eventPlayerSchema>

const matchEventSchema = object({
  team: object({ id: string() }).optional(),
  minute: coerce.number(),
  stoppage_minute: coerce.number().optional(),
  event_type: MatchEventType,
  goal_execution: GoalExecutionEnum.optional(),
  goal_situation: GoalSituationEnum.optional(),
  event_players: array(eventPlayerSchema).default([])
})
type MatchEventSchema = z.infer<typeof matchEventSchema>

const teamSchema = object({
  team: object({ id: string(), name: string() }).optional(),
  score: coerce.number().optional(),
  penalties: coerce.number().optional(),
  possession: coerce.number().optional(),
  shots: coerce.number().optional(),
  shots_on_target: coerce.number().optional(),
  corners: coerce.number().optional(),
  fouls: coerce.number().optional(),
  offsides: coerce.number().optional(),
  yellow_cards: coerce.number().optional(),
  red_cards: coerce.number().optional(),
  lineup: array(lineupSchema).default([])
})

const schema = object({
  // match fields
  round_id: string().optional(),
  group_id: string().optional(),
  home_team: teamSchema,
  away_team: teamSchema,
  venue: object({ id: string() }).optional(),
  date: any().optional(),
  time: any().optional(),
  status: MatchStatusEnum,
  decision: MatchDecisionEnum,

  // award fields
  award_player: object({ id: string(), team: string() }).optional(),
  award_type: MatchAwardTypeEnum,
  source: string().optional(),

  referees: array(refereeSchema).default([]),
  match_events: array(matchEventSchema).default([])
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
  home_team: {
    lineup: []
  },
  away_team: {
    lineup: []
  },
  referees: [],
  match_events: []
}

const isOpen = ref(false)
const isSaving = ref(false)
const errors = ref()

const state = ref<Partial<Schema>>(cloneDeep(initialState))

const { data: positions, pending: positionsPending } = await useAsyncData(
  () => `${props.seasonId}-add-match-positions`,
  async () => {
    const { data, error } = await supabase.from("position").select("*").order("id", { ascending: true })

    if (error) {
      console.error("Error fetching positions:", error)
    }

    return data || []
  },
  { default: () => [] }
)

const { data: rounds, pending: roundsPending } = await useAsyncData(
  () => `${props.seasonId}-add-match-rounds`,
  async () => {
    const { data: rounds, error: roundsError } = await supabase
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
    const { data: groupsData, error: groupsError } = await supabase.from("group").select("id, name").eq("round_id", state.value.round_id!)

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

const { data: teams, pending: teamsPending } = await useAsyncData<TeamType[]>(
  () => `${props.seasonId}-add-match-teams-${state.value.group_id}`,
  async () => {
    if (state.value.group_id) {
      const { data: teamsData, error: teamsError } = await supabase
        .from("team")
        .select("id, short_name, name, logo_url, nicknames, group_team!inner(group_id)")
        .eq("group_team.group_id", state.value.group_id)

      if (teamsError) {
        console.error("Error fetching teams:", teamsError)
      }
      return teamsData || ([] as TeamType[])
    } else {
      const { data: teamsData, error: teamsError } = await supabase
        .from("team")
        .select("id, short_name, name, logo_url, nicknames, team_season!inner(season_id)")
        .eq("team_season.season_id", props.seasonId)

      if (teamsError) {
        console.error("Error fetching teams:", teamsError)
      }
      return teamsData || ([] as TeamType[])
    }
  },
  { default: () => [], watch: [() => state.value.group_id] }
)

const {
  data: homePlayers,
  pending: homePlayersPending,
  execute: homePlayersExecute
} = await useAsyncData(
  () => `${props.seasonId}-add-match-home-players-${state.value.home_team?.team?.id}`,
  async () => {
    if (state.value.home_team?.team?.id) {
      const { data, error } = await supabase
        .from("player")
        .select("id, aka, ...people(full_name, country:country!nationality_country_id(*)), squad_player!inner(id)")
        .eq("squad_player.season_id", props.seasonId)
        .eq("squad_player.team_id", state.value.home_team.team.id)

      if (error) {
        console.error("Error fetching home team players:", error)
      }

      return data || []
    } else {
      return []
    }
  },
  { default: () => [], watch: [() => state.value.home_team?.team?.id] }
)

watch(
  () => state.value.home_team?.team?.id,
  () => {
    if (state.value.home_team?.team?.id) {
      homePlayersExecute()
    }
  }
)

const {
  data: awayPlayers,
  pending: awayPlayersPending,
  execute: awayPlayersExecute
} = await useAsyncData(
  () => `${props.seasonId}-add-match-away-players-${state.value.away_team?.team?.id}`,
  async () => {
    if (state.value.away_team?.team?.id) {
      const { data, error } = await supabase
        .from("player")
        .select("id, aka, ...people(full_name, country:country!nationality_country_id(*)), squad_player!inner(id)")
        .eq("squad_player.season_id", props.seasonId)
        .eq("squad_player.team_id", state.value.away_team.team.id)

      if (error) {
        console.error("Error fetching away team players:", error)
      }

      return data || []
    } else {
      return []
    }
  },
  { default: () => [], watch: [() => state.value.away_team?.team?.id] }
)

watch(
  () => state.value.away_team?.team?.id,
  () => {
    if (state.value.away_team?.team?.id) {
      awayPlayersExecute()
    }
  }
)

const allPlayers = computed(() => [...homePlayers.value.map(p => ({ ...p, team: "home" })), ...awayPlayers.value.map(p => ({ ...p, team: "away" }))])

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

  try {
    const winningTeam =
      isDefined(event.data.home_team.score) && isDefined(event.data.away_team.score) ?
        event.data.home_team.score > event.data.away_team.score ? "home"
        : event.data.home_team.score < event.data.away_team.score ? "away"
        : "draw"
      : null

    const kickoffTime =
      event.data.date ?
        toCalendarDateTime(event.data.date, event.data.time ?? new Time(0, 0))
          .toDate("America/New_York")
          .toISOString()
      : null

    // Insert match
    const { data, error } = await supabase
      .from("match")
      .insert({
        season_id: props.seasonId,
        round_id: event.data.round_id,
        group_id: event.data.group_id,
        home_team_id: event.data.home_team.team!.id,
        away_team_id: event.data.away_team.team!.id,
        venue_id: event.data.venue?.id,
        kickoff_time: kickoffTime,
        status: event.data.status,
        home_score: event.data.home_team.score,
        away_score: event.data.away_team.score,
        home_penalties: event.data.home_team.penalties,
        away_penalties: event.data.away_team.penalties,
        winning_team_id:
          winningTeam === "home" ? event.data.home_team.team!.id
          : winningTeam === "away" ? event.data.away_team.team!.id
          : null,
        decision: event.data.decision
      })
      .select("id")

    if (error || !data?.[0]?.id) {
      console.error("Error creating match:", error)
      set(errors, error)
      return
    }

    // Insert match stats
    if (event.data.home_team.possession) {
      const { error: statsError } = await supabase.from("match_stats").insert([
        {
          match_id: data[0].id,
          team_id: event.data.home_team.team!.id,
          possession: event.data.home_team.possession,
          corners: event.data.home_team.corners,
          yellow_cards: event.data.home_team.yellow_cards,
          red_cards: event.data.home_team.red_cards,
          shots: event.data.home_team.shots,
          shots_on_target: event.data.home_team.shots_on_target,
          fouls: event.data.home_team.fouls,
          offsides: event.data.home_team.offsides
        },
        {
          match_id: data[0].id,
          team_id: event.data.away_team.team!.id,
          possession: event.data.away_team.possession,
          corners: event.data.away_team.corners,
          yellow_cards: event.data.away_team.yellow_cards,
          red_cards: event.data.away_team.red_cards,
          shots: event.data.away_team.shots,
          shots_on_target: event.data.away_team.shots_on_target,
          fouls: event.data.away_team.fouls,
          offsides: event.data.away_team.offsides
        }
      ])

      if (statsError) {
        console.error("Error creating match stats:", statsError)
        set(errors, statsError)
        toast.add({
          title: "Error creating match stats",
          color: "error"
        })
      }
    }

    // Insert match award
    if (event.data.award_player) {
      const { error: awardError } = await supabase.from("match_award").insert({
        match_id: data[0].id,
        team_id: event.data.award_player.team === "home" ? event.data.home_team.team!.id : event.data.away_team.team!.id,
        player_id: event.data.award_player.id,
        type: event.data.award_type,
        source: event.data.source
      })

      if (awardError) {
        console.error("Error creating match award:", awardError)
        set(errors, awardError)
        toast.add({
          title: "Error creating match award",
          color: "error"
        })
      }
    }

    if (event.data.referees?.length) {
      const { error: refError } = await supabase.from("match_referee").insert(
        event.data.referees.map(ref => ({
          person_id: ref.person.id,
          match_id: data[0]!.id,
          type: ref.referee_type
        }))
      )

      if (refError) {
        console.error("Error creating match referees:", refError)
        set(errors, refError)
        toast.add({
          title: "Error creating match referees",
          color: "error"
        })
      }
    }

    // Insert match lineups
    const { error: lineupError } = await supabase.from("match_lineup").insert([
      ...event.data.home_team.lineup.map(lineup => ({
        match_id: data[0]!.id,
        team_id: event.data.home_team.team!.id,
        player_id: lineup.player.id,
        position_id: lineup.position_id,
        shirt_number: lineup.shirt_number,
        captain: lineup.captain,
        starter: lineup.starter
      })),
      ...event.data.away_team.lineup.map(lineup => ({
        match_id: data[0]!.id,
        team_id: event.data.away_team.team!.id,
        player_id: lineup.player.id,
        position_id: lineup.position_id,
        shirt_number: lineup.shirt_number,
        captain: lineup.captain,
        starter: lineup.starter
      }))
    ])

    if (lineupError) {
      console.error("Error creating match lineups:", lineupError)
      set(errors, lineupError)
      toast.add({
        title: "Error creating match lineups",
        color: "error"
      })
    }

    if (event.data.match_events?.length) {
      for (const matchEvent of event.data.match_events) {
        const { data: eventData, error: eventError } = await supabase
          .from("match_event")
          .insert({
            match_id: data[0]!.id,
            team_id: matchEvent.team!.id,
            minute: matchEvent.minute,
            stoppage_minute: matchEvent.stoppage_minute,
            type: matchEvent.event_type,
            goal_execution: matchEvent.goal_execution,
            goal_situation: matchEvent.goal_situation
          })
          .select("id")

        if (eventError) {
          console.error("Error creating match event:", eventError)
          set(errors, eventError)
          toast.add({
            title: "Error creating match event",
            color: "error"
          })
        } else {
          const { error: eventPlayerError } = await supabase.from("match_event_player").insert(
            matchEvent.event_players.map(eventPlayer => ({
              match_event_id: eventData[0]!.id,
              player_id: eventPlayer!.player!.id,
              role: eventPlayer!.role
            }))
          )

          if (eventPlayerError) {
            console.error("Error creating match event player:", eventPlayerError)
            set(errors, eventPlayerError)
            toast.add({
              title: "Error creating match event player",
              color: "error"
            })
          }
        }
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
        team1: kebabCase(event.data.home_team.team!.name),
        team2: kebabCase(event.data.away_team.team!.name)
      }
    })
  } finally {
    set(isSaving, false)
  }
}
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
      >
        <div class="grid grid-cols-2 items-center gap-3">
          <u-form-field
            name="round_id"
            label="Round"
            :class="groups.length ? 'col-span-1' : 'col-span-2'"
          >
            <u-input-menu
              v-model="state.round_id"
              :items="rounds"
              placeholder="Round"
              :loading="roundsPending"
              value-key="id"
              label-key="name"
              class="w-full"
            />
          </u-form-field>

          <u-form-field
            v-if="groups.length"
            name="group_id"
            label="Group"
          >
            <u-input-menu
              v-model="state.group_id"
              :items="groups"
              placeholder="Group"
              :loading="groupsPending"
              value-key="id"
              label-key="name"
              class="w-full"
            />
          </u-form-field>

          <u-form-field
            name="date"
            label="Date"
          >
            <form-date-picker v-model="state.date" />
          </u-form-field>

          <u-form-field
            name="time"
            label="Time"
          >
            <u-input-time
              v-model="state.time"
              :hour-cycle="24"
              class="w-full"
            />
          </u-form-field>

          <u-form-field
            name="venue"
            label="Venue"
            class="col-span-2"
          >
            <venue-search v-model="<any>state.venue" />
          </u-form-field>

          <u-form-field
            name="status"
            label="Status"
            required
          >
            <u-input-menu
              v-model="state.status"
              :items="Object.entries(MATCH_STATUS_MAPPING).map(([key, value]) => ({ label: value, value: key }))"
              placeholder="Status"
              value-key="value"
              label-key="label"
              clear
              class="w-full"
            />
          </u-form-field>

          <u-form-field
            name="decision"
            label="Decision"
            required
          >
            <u-input-menu
              v-model="state.decision"
              :items="Object.entries(MATCH_DECISION_MAPPING).map(([key, value]) => ({ label: value, value: key }))"
              placeholder="Decision"
              value-key="value"
              label-key="label"
              clear
              class="w-full"
            />
          </u-form-field>

          <u-separator
            label="Referees"
            class="col-span-2"
          />

          <u-form
            v-for="(_, index) in state.referees"
            :key="index"
            nested
            :name="`referees.${index}`"
            :schema="refereeSchema"
            class="col-span-2"
          >
            <div class="grid grid-cols-2 items-end gap-3">
              <u-form-field
                name="person"
                :label="index === 0 ? 'Referee' : ''"
                required
              >
                <person-search v-model="<any>state.referees![index]!.person" />
              </u-form-field>

              <div class="flex items-end gap-2">
                <u-form-field
                  name="referee_type"
                  :label="index === 0 ? 'Type' : ''"
                  required
                  class="flex-1"
                >
                  <u-input-menu
                    v-model="state.referees![index]!.referee_type"
                    :items="Object.entries(REFEREE_TYPE_MAPPING).map(([key, value]) => ({ label: value, value: key }))"
                    placeholder="Type"
                    value-key="value"
                    label-key="label"
                    clear
                    class="w-full"
                  />
                </u-form-field>

                <u-button
                  :icon="ui.icons.error"
                  color="error"
                  class="w-fit"
                  @click="
                    () => {
                      state.referees!.splice(index, 1)
                    }
                  "
                />
              </div>
            </div>
          </u-form>

          <u-button
            :icon="ui.icons.plus"
            label="Add referee"
            block
            size="xs"
            class="col-span-2"
            @click="
              () => {
                state.referees!.push({} as RefereeSchema)
              }
            "
          />

          <div class="flex flex-col gap-3 col-span-2">
            <u-separator label="Home Team" />

            <u-form-field
              name="home_team.team"
              label="Team"
            >
              <u-input-menu
                v-model="<any>state.home_team!.team"
                :items="teams"
                placeholder="Team"
                :loading="teamsPending"
                class="w-full"
                label-key="name"
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

                <template #item-label="{ item }">{{ item.short_name || item.name }}</template>

                <template #item-description="{ item }">{{ item.nicknames[0] }}</template>
              </u-input-menu>
            </u-form-field>

            <div class="grid grid-cols-5 gap-2">
              <u-form-field
                name="home_team.score"
                label="Score"
              >
                <form-input-number
                  v-model="state.home_team!.score"
                  placeholder="Score"
                />
              </u-form-field>

              <u-form-field
                name="home_team.penalties"
                label="Penalties"
              >
                <form-input-number
                  v-model="state.home_team!.penalties"
                  placeholder="Penalties"
                />
              </u-form-field>

              <u-form-field
                name="home_team.possession"
                label="Possession (%)"
              >
                <form-input-number
                  v-model="state.home_team!.possession"
                  placeholder="Possession (%)"
                />
              </u-form-field>

              <u-form-field
                name="home_team.shots"
                label="Shots"
              >
                <form-input-number
                  v-model="state.home_team!.shots"
                  placeholder="Shots"
                />
              </u-form-field>

              <u-form-field
                name="home_team.shots_on_target"
                label="Shots on Target"
              >
                <form-input-number
                  v-model="state.home_team!.shots_on_target"
                  placeholder="Shots on Target"
                />
              </u-form-field>

              <u-form-field
                name="home_team.yellow_cards"
                label="Yellow Cards"
              >
                <form-input-number
                  v-model="state.home_team!.yellow_cards"
                  placeholder="Yellow Cards"
                />
              </u-form-field>

              <u-form-field
                name="home_team.red_cards"
                label="Red Cards"
              >
                <form-input-number
                  v-model="state.home_team!.red_cards"
                  placeholder="Red Cards"
                />
              </u-form-field>

              <u-form-field
                name="home_team.fouls"
                label="Fouls"
              >
                <form-input-number
                  v-model="state.home_team!.fouls"
                  placeholder="Fouls"
                />
              </u-form-field>

              <u-form-field
                name="home_team.offsides"
                label="Offsides"
              >
                <form-input-number
                  v-model="state.home_team!.offsides"
                  placeholder="Offsides"
                />
              </u-form-field>

              <u-form-field
                name="home_team.corners"
                label="Corners"
              >
                <form-input-number
                  v-model="state.home_team!.corners"
                  placeholder="Corners"
                />
              </u-form-field>
            </div>

            <u-form
              v-for="(_, index) in state.home_team!.lineup"
              :key="index"
              nested
              :name="`home_team.lineup.${index}`"
              :schema="lineupSchema"
            >
              <div class="grid grid-cols-11 gap-2 items-end">
                <u-form-field
                  name="player"
                  :label="index === 0 ? 'Player' : ''"
                  class="col-span-3"
                >
                  <u-input-menu
                    v-model="<any>state.home_team!.lineup![index]!.player"
                    :items="homePlayers"
                    placeholder="Player"
                    :loading="homePlayersPending"
                    class="w-full"
                    label-key="full_name"
                  >
                    <template #leading="{ modelValue }">
                      <u-icon
                        v-if="modelValue"
                        :name="modelValue.country!.icon"
                      />
                    </template>

                    <template #item-leading="{ item }">
                      <u-icon
                        v-if="item"
                        :name="item.country!.icon"
                      />
                    </template>

                    <template #item-label="{ item }">{{ item.full_name }}</template>

                    <template #item-description="{ item }">{{ item.aka }}</template>
                  </u-input-menu>
                </u-form-field>

                <u-form-field
                  name="position"
                  :label="index === 0 ? 'Position' : ''"
                  class="col-span-3"
                >
                  <u-input-menu
                    v-model="state.home_team!.lineup![index]!.position_id"
                    :items="positions"
                    placeholder="Position"
                    :loading="positionsPending"
                    class="w-full"
                    value-key="id"
                    label-key="name"
                  />
                </u-form-field>

                <u-form-field
                  name="shirt_number"
                  :label="index === 0 ? 'Number' : ''"
                  class="col-span-2"
                >
                  <form-input-number
                    v-model="state.home_team!.lineup![index]!.shirt_number"
                    placeholder="Number"
                  />
                </u-form-field>

                <div class="col-span-2 space-y-1">
                  <u-switch
                    v-model="state.home_team!.lineup![index]!.starter"
                    label="Starter"
                  />

                  <u-switch
                    v-model="state.home_team!.lineup![index]!.captain"
                    label="Captain"
                  />
                </div>

                <u-button
                  :icon="ui.icons.error"
                  color="error"
                  class="w-fit ml-auto"
                  @click="
                    () => {
                      state.home_team!.lineup!.splice(index, 1)
                    }
                  "
                />
              </div>
            </u-form>

            <u-button
              :icon="ui.icons.plus"
              label="Add player"
              block
              size="xs"
              class="col-span-2"
              @click="
                () => {
                  state.home_team!.lineup!.push({ starter: false, captain: false } as LineupSchema)
                }
              "
            />
          </div>

          <div class="flex flex-col gap-3 col-span-2">
            <u-separator label="Away Team" />

            <u-form-field
              name="away_team.team"
              label="Team"
            >
              <u-input-menu
                v-model="<any>state.away_team!.team"
                :items="teams"
                placeholder="Team"
                :loading="teamsPending"
                class="w-full"
                label-key="name"
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

                <template #item-label="{ item }">{{ item.short_name || item.name }}</template>

                <template #item-description="{ item }">{{ item.nicknames[0] }}</template>
              </u-input-menu>
            </u-form-field>

            <div class="grid grid-cols-5 gap-2">
              <u-form-field
                name="away_team.score"
                label="Score"
              >
                <form-input-number
                  v-model="state.away_team!.score"
                  placeholder="Score"
                />
              </u-form-field>

              <u-form-field
                name="away_team.penalties"
                label="Penalties"
              >
                <form-input-number
                  v-model="state.away_team!.penalties"
                  placeholder="Penalties"
                />
              </u-form-field>

              <u-form-field
                name="away_team.possession"
                label="Possession (%)"
              >
                <form-input-number
                  v-model="state.away_team!.possession"
                  placeholder="Possession (%)"
                />
              </u-form-field>

              <u-form-field
                name="away_team.shots"
                label="Shots"
              >
                <form-input-number
                  v-model="state.away_team!.shots"
                  placeholder="Shots"
                />
              </u-form-field>

              <u-form-field
                name="away_team.shots_on_target"
                label="Shots on Target"
              >
                <form-input-number
                  v-model="state.away_team!.shots_on_target"
                  placeholder="Shots on Target"
                />
              </u-form-field>

              <u-form-field
                name="away_team.yellow_cards"
                label="Yellow Cards"
              >
                <form-input-number
                  v-model="state.away_team!.yellow_cards"
                  placeholder="Yellow Cards"
                />
              </u-form-field>

              <u-form-field
                name="away_team.red_cards"
                label="Red Cards"
              >
                <form-input-number
                  v-model="state.away_team!.red_cards"
                  placeholder="Red Cards"
                />
              </u-form-field>

              <u-form-field
                name="away_team.fouls"
                label="Fouls"
              >
                <form-input-number
                  v-model="state.away_team!.fouls"
                  placeholder="Fouls"
                />
              </u-form-field>

              <u-form-field
                name="away_team.offsides"
                label="Offsides"
              >
                <form-input-number
                  v-model="state.away_team!.offsides"
                  placeholder="Offsides"
                />
              </u-form-field>

              <u-form-field
                name="away_team.corners"
                label="Corners"
              >
                <form-input-number
                  v-model="state.away_team!.corners"
                  placeholder="Corners"
                />
              </u-form-field>
            </div>

            <u-form
              v-for="(_, index) in state.away_team!.lineup"
              :key="index"
              nested
              :name="`away_team.lineup.${index}`"
              :schema="lineupSchema"
            >
              <div class="grid grid-cols-11 gap-2 items-end">
                <u-form-field
                  name="player"
                  :label="index === 0 ? 'Player' : ''"
                  class="col-span-3"
                >
                  <u-input-menu
                    v-model="<any>state.away_team!.lineup![index]!.player"
                    :items="awayPlayers"
                    placeholder="Player"
                    :loading="awayPlayersPending"
                    class="w-full"
                    label-key="full_name"
                  >
                    <template #leading="{ modelValue }">
                      <u-icon
                        v-if="modelValue"
                        :name="modelValue.country!.icon"
                      />
                    </template>

                    <template #item-leading="{ item }">
                      <u-icon
                        v-if="item"
                        :name="item.country!.icon"
                      />
                    </template>

                    <template #item-label="{ item }">{{ item.full_name }}</template>

                    <template #item-description="{ item }">{{ item.aka }}</template>
                  </u-input-menu>
                </u-form-field>

                <u-form-field
                  name="position"
                  :label="index === 0 ? 'Position' : ''"
                  class="col-span-3"
                >
                  <u-input-menu
                    v-model="state.away_team!.lineup![index]!.position_id"
                    :items="positions"
                    placeholder="Position"
                    :loading="positionsPending"
                    class="w-full"
                    value-key="id"
                    label-key="name"
                  />
                </u-form-field>

                <u-form-field
                  name="shirt_number"
                  :label="index === 0 ? 'Number' : ''"
                  class="col-span-2"
                >
                  <form-input-number
                    v-model="state.away_team!.lineup![index]!.shirt_number"
                    placeholder="Number"
                  />
                </u-form-field>

                <div class="col-span-2 space-y-1">
                  <u-switch
                    v-model="state.away_team!.lineup![index]!.starter"
                    label="Starter"
                  />

                  <u-switch
                    v-model="state.away_team!.lineup![index]!.captain"
                    label="Captain"
                  />
                </div>

                <u-button
                  :icon="ui.icons.error"
                  color="error"
                  class="w-fit ml-auto"
                  @click="
                    () => {
                      state.away_team!.lineup!.splice(index, 1)
                    }
                  "
                />
              </div>
            </u-form>

            <u-button
              :icon="ui.icons.plus"
              label="Add player"
              block
              size="xs"
              class="col-span-2"
              @click="
                () => {
                  state.away_team!.lineup!.push({ starter: false, captain: false } as LineupSchema)
                }
              "
            />
          </div>

          <template v-if="allPlayers.length">
            <u-separator
              label="Award"
              class="col-span-2"
            />

            <u-form-field
              name="award_player"
              label="Player"
              class="col-span-2"
            >
              <u-input-menu
                v-model="<any>state.award_player"
                :items="allPlayers"
                placeholder="Player"
                :loading="homePlayersPending || awayPlayersPending"
                class="w-full"
                label-key="full_name"
              >
                <template #leading="{ modelValue }">
                  <u-icon
                    v-if="modelValue"
                    :name="modelValue.country!.icon"
                  />
                </template>

                <template #item-leading="{ item }">
                  <u-icon
                    v-if="item"
                    :name="item.country!.icon"
                  />
                </template>

                <template #item-label="{ item }">{{ item.full_name }}</template>

                <template #item-description="{ item }">{{ item.aka }}</template>
              </u-input-menu>
            </u-form-field>

            <u-form-field
              name="award_type"
              label="Type"
              required
            >
              <u-input-menu
                v-model="state.award_type"
                :items="Object.entries(MATCH_AWARD_TYPE_MAPPING).map(([key, value]) => ({ label: value, value: key }))"
                placeholder="Type"
                value-key="value"
                label-key="label"
                clear
                class="w-full"
              />
            </u-form-field>

            <u-form-field
              name="source"
              label="Source"
            >
              <form-input
                v-model="state.source"
                placeholder="Source"
              />
            </u-form-field>

            <u-separator
              label="Match Events"
              class="col-span-2"
            />

            <u-form
              v-for="(_, index) in state.match_events"
              :key="index"
              nested
              :name="`match_events.${index}`"
              :schema="matchEventSchema"
              class="col-span-2 space-y-3"
            >
              <div class="grid grid-cols-2 gap-3 items-end">
                <u-form-field
                  name="team"
                  label="Team"
                  required
                  class="flex-1"
                >
                  <u-input-menu
                    v-model="<any>state.match_events![index]!.team"
                    :items="teams"
                    placeholder="Team"
                    :loading="teamsPending"
                    class="w-full"
                    label-key="name"
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

                    <template #item-label="{ item }">{{ item.short_name || item.name }}</template>

                    <template #item-description="{ item }">{{ item.nicknames[0] }}</template>
                  </u-input-menu>
                </u-form-field>

                <div class="flex items-end gap-3">
                  <u-form-field
                    name="event_type"
                    label="Type"
                    required
                    class="flex-1"
                  >
                    <u-input-menu
                      v-model="state.match_events![index]!.event_type"
                      :items="Object.entries(MATCH_EVENT_TYPE_MAPPING).map(([key, value]) => ({ label: value, value: key }))"
                      placeholder="Status"
                      value-key="value"
                      label-key="label"
                      clear
                      class="w-full"
                    />
                  </u-form-field>

                  <u-button
                    :icon="ui.icons.error"
                    color="error"
                    class="w-fit ml-auto"
                    @click="
                      () => {
                        state.match_events!.splice(index, 1)
                      }
                    "
                  />
                </div>

                <template v-if="state.match_events![index]!.event_type === 'goal'">
                  <u-form-field
                    name="goal_situation"
                    label="Situation"
                    required
                  >
                    <u-input-menu
                      v-model="state.match_events![index]!.goal_situation"
                      :items="Object.entries(GOAL_SITUATION_MAPPING).map(([key, value]) => ({ label: value, value: key }))"
                      placeholder="Situation"
                      value-key="value"
                      label-key="label"
                      clear
                      class="w-full"
                    />
                  </u-form-field>

                  <u-form-field
                    name="goal_execution"
                    label="Type"
                    required
                    class="flex-1"
                  >
                    <u-input-menu
                      v-model="state.match_events![index]!.goal_execution"
                      :items="Object.entries(GOAL_EXECUTION_MAPPING).map(([key, value]) => ({ label: value, value: key }))"
                      placeholder="Execution"
                      value-key="value"
                      label-key="label"
                      clear
                      class="w-full"
                    />
                  </u-form-field>
                </template>

                <u-form-field
                  name="minute"
                  label="Minute"
                  required
                >
                  <form-input-number
                    v-model="state.match_events![index]!.minute"
                    placeholder="Minute"
                  />
                </u-form-field>

                <u-form-field
                  name="stoppage_minute"
                  label="Stoppage minute"
                >
                  <form-input-number
                    v-model="state.match_events![index]!.stoppage_minute"
                    placeholder="Stoppage minute"
                  />
                </u-form-field>
              </div>

              <u-form
                v-for="(_, i) in state.match_events![index]!.event_players"
                :key="i"
                nested
                :name="`match_events.${index}.event_players.${i}`"
                :schema="eventPlayerSchema"
                class="space-y-3"
              >
                <div class="grid grid-cols-2 items-end gap-3">
                  <u-form-field
                    name="player"
                    :label="i === 0 ? 'Player' : ''"
                    required
                  >
                    <u-input-menu
                      v-model="<any>state.match_events![index]!.event_players![i]!.player"
                      :items="allPlayers"
                      placeholder="Player"
                      :loading="homePlayersPending || awayPlayersPending"
                      class="w-full"
                      label-key="full_name"
                    >
                      <template #leading="{ modelValue }">
                        <u-icon
                          v-if="modelValue"
                          :name="modelValue.country!.icon"
                        />
                      </template>

                      <template #item-leading="{ item }">
                        <u-icon
                          v-if="item"
                          :name="item.country!.icon"
                        />
                      </template>

                      <template #item-label="{ item }">{{ item.full_name }}</template>

                      <template #item-description="{ item }">{{ item.aka }}</template>
                    </u-input-menu>
                  </u-form-field>

                  <div class="flex items-end gap-3">
                    <u-form-field
                      name="role"
                      :label="index === 0 ? 'Role' : ''"
                      class="flex-1"
                      required
                    >
                      <u-input-menu
                        v-model="state.match_events![index]!.event_players![i]!.role"
                        :items="Object.entries(MATCH_EVENT_ROLE_MAPPING).map(([key, value]) => ({ label: value, value: key }))"
                        placeholder="Role"
                        value-key="value"
                        label-key="label"
                        clear
                        class="w-full"
                      />
                    </u-form-field>

                    <u-button
                      :icon="ui.icons.error"
                      color="error"
                      class="w-fit ml-auto"
                      @click="
                        () => {
                          state.match_events![index]!.event_players!.splice(i, 1)
                        }
                      "
                    />
                  </div>
                </div>
              </u-form>

              <u-button
                :icon="ui.icons.plus"
                label="Add player"
                block
                size="xs"
                class="col-span-2"
                @click="
                  () => {
                    state.match_events![index]!.event_players.push({} as EventPlayerSchema)
                  }
                "
              />
            </u-form>

            <u-button
              :icon="ui.icons.plus"
              label="Add event"
              block
              size="xs"
              class="col-span-2"
              @click="
                () => {
                  state.match_events!.push({ event_players: [] as EventPlayerSchema[] } as MatchEventSchema)
                }
              "
            />
          </template>
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
