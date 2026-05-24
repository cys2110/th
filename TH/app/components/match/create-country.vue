<script setup lang="ts">
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"
import { any, array, literal, number, object, string, z } from "zod"

const schema = object({
  tie: object({
    id: string(),
    label: string(),
    round_id: string(),
    country_1: string(),
    country_2: string()
  }),
  match_no: number(),
  tour: TourEnum.optional(),
  match_type: MatchTypeEnum,
  format: literal([3, 5]),
  team_1_id: string(),
  team_2_id: string(),
  winner: literal([1, 2]).optional(),
  incomplete: IncompleteEnum.optional(),
  court: string().optional(),
  date: any().optional(),
  duration: string().optional(),
  umpire: object({
    id: string(),
    label: string()
  }).optional(),
  sets: array(MatchScoreSchema).default([]),
  stats: array(MatchStatSchema).default([])
})
type Schema = z.infer<typeof schema>

const emits = defineEmits<{ refresh: [] }>()

const {
  params: { edId }
} = useRoute("edition")

const {
  ui: { icons }
} = useAppConfig()

const toast = useToast()
const supabase = useSupabaseClient()

const tournamentStore = useTournamentStore()

const isUploading = ref(false)
const isOpen = ref(false)
const errors = ref()
const form = useTemplateRef("form")

defineShortcuts({
  ctrl_a: () => set(isOpen, !isOpen.value),
  ctrl_r: () => handleReset(),
  ctrl_enter: () => form.value?.submit()
})

const tiesKey = computed(() => `${edId}-Country-ties`)
const { data: ties, pending: tiesPending } = await useAsyncData(
  tiesKey,
  async () => {
    const { data, error } = await supabase
      .from("ties")
      .select("*, rounds!inner(*), country_1:country_1_id(countries(*)), country_2:country_2_id(countries(*))")
      .eq("rounds.event_id", `${edId}-Country`)

    if (error || !data) {
      console.error("Error fetching ties:", error)
      return []
    }

    return data.map(tie => ({
      id: tie.id,
      // @ts-expect-error
      label: `${tie.group_name || tie.rounds.round} - ${tie.country_1.countries.id} v ${tie.country_2.countries.id}`,
      round_id: tie.rounds.id,
      // @ts-expect-error
      country_1: tie.country_1.countries.id,
      // @ts-expect-error
      country_2: tie.country_2.countries.id
    }))
  },
  { default: () => [] }
)

const entriesKey = computed(() => `${edId}-entries`)

const { data: entries, pending: entriesPending } = await useAsyncData(
  entriesKey,
  async () => {
    const { data, error } = await supabase
      .from("entries")
      .select("id, match_type, player_entry_mapping(country_id, players(first_name, last_name))")
      .eq("event_id", `${edId}-Country`)
      .is("country_id", null)
      .order("id", { ascending: true })

    if (error || !data) {
      console.error("Error fetching entries:", error)
      return []
    }

    return data.map(entry => ({
      id: entry.id,
      match_type: entry.match_type,
      country: entry.player_entry_mapping[0]?.country_id,
      label: entry.player_entry_mapping.map(pem => `${pem.players.first_name} ${pem.players.last_name}`).join(" / ")
    }))
  },
  { default: () => [] }
)

const state = ref<Partial<Schema>>({
  format: 3,
  sets: [],
  stats: []
})

watch(
  () => [state.value.format, state.value.team_1_id, state.value.team_2_id],
  () => {
    const { format, team_1_id, team_2_id } = state.value

    if (format && team_1_id && team_2_id) {
      state.value.sets = Array.from({ length: format }, (_, i) => ({ set_no: i + 1, super_tb: false }))
    }

    if (team_1_id && team_2_id) {
      state.value.stats = [{ entry_id: team_1_id }, { entry_id: team_2_id }]
    }
  },
  { deep: true }
)

const handleReset = () => {
  set(state, {})
  set(errors, undefined)
}

const onError = (event: FormErrorEvent) => {
  set(errors, event.errors)
}

const onSubmit = async (event: FormSubmitEvent<Schema>) => {
  set(isUploading, true)
  set(errors, undefined)

  const { tie, winner, date, umpire, sets, stats, ...rest } = event.data

  try {
    const { data, error } = await supabase
      .from("matches")
      .insert({
        ...rest,
        draw: "Main",
        round_id: tie.round_id,
        tie_id: tie.id,
        date: date?.toString() || null,
        umpire_id: umpire?.id || null,
        winner_id:
          winner ?
            winner === 1 ?
              rest.team_1_id
            : rest.team_2_id
          : null,
        loser_id:
          winner && rest.team_1_id && rest.team_2_id ?
            winner === 1 ?
              rest.team_2_id
            : rest.team_1_id
          : null
      })
      .select("id")

    if (error || !data?.[0]) throw error

    const matchId = data[0].id

    const setsToInsert = sets.filter(set => set.t1)

    if (setsToInsert.length) {
      const { error: setsError } = await supabase.from("match_scores").insert(
        setsToInsert.flatMap(set => {
          const maxTb =
            set.tb ?
              (set.super_tb && set.tb > 8) || set.tb > 5 ? set.tb + 2
              : set.super_tb ? 10
              : 7
            : null

          return [
            { match_id: matchId, entry_id: rest.team_1_id!, set_no: set.set_no, set: set.t1, tb: set.t1 === 7 ? maxTb : set.tb },
            { match_id: matchId, entry_id: rest.team_2_id!, set_no: set.set_no, set: set.t2, tb: set.t2 === 7 ? maxTb : set.tb }
          ]
        })
      )

      if (setsError) {
        console.error("Error adding sets", setsError)

        toast.add({
          title: "Error adding sets",
          icon: icons.error,
          color: "error"
        })
      }
    }

    const statsToInsert = stats.filter(stat => stat.serve1)

    if (statsToInsert) {
      const { error: statsError } = await supabase.from("match_stats").insert(
        statsToInsert.map(stat => ({
          ...stat,
          match_id: matchId
        }))
      )

      if (statsError) {
        console.error("Error adding stats", statsError)

        toast.add({
          title: "Error adding stats",
          icon: icons.error,
          color: "error"
        })
      }
    }

    const { match_no, format } = event.data

    set(state, { tie, format, match_no: match_no + 1 })
    emits("refresh")
    set(isOpen, false)
  } catch (error) {
    set(errors, error)

    toast.add({
      title: "Error creating match",
      icon: icons.error,
      color: "error"
    })
  } finally {
    set(isUploading, false)
  }
}

const formFields = computed<FormFieldInterface<Schema>[]>(
  () =>
    [
      { label: "Match No.", key: "match_no", type: "number", required: true },
      {
        label: "Tie",
        key: "tie",
        type: "inputMenu",
        items: ties.value,
        loading: tiesPending.value,
        required: true,
        class: tournamentStore.tours.length > 1 ? "col-span-1" : "col-span-2"
      },
      {
        label: state.value.match_type === "Doubles" ? "Team 1" : "Player 1",
        key: "team_1_id",
        type: "inputMenu",
        class: "col-span-2",
        items: entries.value.filter(entry => {
          const isCountryMatch = !state.value.tie || state.value.tie.country_1 === entry.country

          const isMatchTypeMatch = !state.value.match_type || state.value.match_type === entry.match_type

          return isCountryMatch && isMatchTypeMatch
        }),
        loading: entriesPending.value,
        valueKey: "id",
        labelKey: "label"
      },
      {
        label: state.value.match_type === "Doubles" ? "Team 2" : "Player 2",
        key: "team_2_id",
        type: "inputMenu",
        class: "col-span-2",
        items: entries.value.filter(entry => {
          const isCountryMatch = !state.value.tie || state.value.tie.country_2 === entry.country
          const isMatchTypeMatch = !state.value.match_type || state.value.match_type === entry.match_type

          return isCountryMatch && isMatchTypeMatch
        }),
        loading: entriesPending.value,
        valueKey: "id",
        labelKey: "label"
      },
      {
        label: "Winner",
        key: "winner",
        type: "radio",
        items: [
          { label: `${state.value.match_type === "Doubles" ? "Team" : "Player"} 1`, value: 1 },
          { label: `${state.value.match_type === "Doubles" ? "Team" : "Player"} 2`, value: 2 }
        ]
      },
      { label: "Date", key: "date", type: "date" },
      { label: "Court", key: "court", type: "text" },
      { label: "Duration", key: "duration", type: "text", placeholder: "HH:MM:SS" },
      { label: "Umpire", key: "umpire", type: "slot", class: "col-span-2" },
      { label: "Group", key: "group_name", type: "text", class: "col-span-2" },
      {
        label: "Incomplete",
        key: "incomplete",
        type: "radio",
        items: [
          { label: "Bye", value: "B" },
          { label: "Walkover", value: "WO" },
          { label: "Retirement", value: "R" },
          { label: "Default", value: "D" }
        ],
        class: "col-span-2"
      }
    ] as FormFieldInterface<Schema>[]
)

const statsFields: Array<{ label: string; key?: keyof MatchStatType; children?: Array<keyof MatchStatType> }> = [
  { label: "Aces", key: "aces" },
  { label: "Double Faults", key: "dfs" },
  { label: "1st Serve Win %", children: ["serve1_w", "serve1"] },
  { label: "2nd Serve Win %", children: ["serve2_w", "serve2"] },
  { label: "Break Points Saved %", children: ["bps_saved", "bps_faced"] },
  { label: "1st Return Win %", children: ["ret1_w", "ret1"] },
  { label: "2nd Return Win %", children: ["ret2_w", "ret2"] },
  { label: "Break Points Converted %", children: ["bps_converted", "bp_opps"] },
  { label: "Net Points Won %", children: ["net_w", "net"] },
  { label: "Winners", key: "winners" },
  { label: "Unforced Errors", key: "ues" },
  { label: "Service Games Played", key: "serve_games" },
  { label: "Return Games Won", key: "return_games" },
  { label: "Max Serve Speed (km/h)", key: "max_speed" },
  { label: "Avg 1st Serve Speed (km/h)", key: "avg1_speed" },
  { label: "Avg 2nd Serve Speed (km/h)", key: "avg2_speed" }
]
</script>

<template>
  <u-modal
    title="Create Match"
    v-model:open="isOpen"
  >
    <u-button :icon="icons.plus" />

    <template #body>
      <u-form
        id="match-form"
        ref="form"
        :schema
        :state="state"
        @submit="onSubmit"
        @error="onError"
        class="space-y-3"
      >
        <div
          class="grid gap-3 items-center"
          :class="tournamentStore.tours.length > 1 ? 'grid-cols-3' : 'grid-cols-2'"
        >
          <form-field
            v-model="state"
            :field="{
              label: 'Format',
              key: 'format',
              type: 'radio',
              items: [
                { label: 'Best of 3', value: 3 },
                { label: 'Best of 5', value: 5 }
              ]
            }"
          />

          <form-field
            v-if="tournamentStore.tours.length > 1"
            v-model="state"
            :field="{ label: 'Tour', key: 'tour', type: 'radio', items: tournamentStore.tours }"
          />

          <form-field
            v-model="state"
            :field="{ label: 'S/D', key: 'match_type', type: 'radio', items: MATCH_TYPES, required: true }"
          />
        </div>

        <div class="grid grid-cols-2 gap-3 items-center">
          <form-field
            v-for="field in formFields"
            :key="field.label"
            :field="field"
            v-model="state"
          >
            <person-search
              v-model="state.umpire"
              placeholder="Umpire"
            />
          </form-field>
        </div>

        <div
          v-if="state.format && state.team_1_id && state.team_2_id"
          class="space-y-3 my-4"
        >
          <u-form
            v-for="(set, index) in state.sets"
            :key="set.set_no"
            :schema="MatchScoreSchema"
            :name="`sets.${index}`"
            nested
          >
            <div class="text-sm font-semibold">Set {{ set.set_no }}</div>
            <div class="grid grid-cols-4 gap-3">
              <u-form-field
                name="t1"
                :label="`${state.match_type === 'Doubles' ? 'Team' : 'Player'} 1`"
              >
                <form-input-number
                  v-model="set.t1"
                  placeholder="Set"
                />
              </u-form-field>

              <u-form-field
                name="t2"
                :label="`${state.match_type === 'Doubles' ? 'Team' : 'Player'} 2`"
              >
                <form-input-number
                  v-model="set.t2"
                  placeholder="Set"
                />
              </u-form-field>

              <u-form-field
                name="tb"
                label="Tiebreak"
              >
                <form-input-number
                  v-model="set.tb"
                  placeholder="Tiebreak"
                />
              </u-form-field>

              <u-form-field
                name="super_tb"
                label="Super Tiebreak"
              >
                <u-radio-group
                  v-model="set.super_tb"
                  :items="[
                    { value: true, label: 'Yes' },
                    { value: false, label: 'No' }
                  ]"
                  orientation="horizontal"
                  loop
                />
              </u-form-field>
            </div>
          </u-form>
        </div>

        <div
          v-if="state.stats?.[0] && state.stats?.[1]"
          class="space-y-3"
        >
          <div class="text-sm font-semibold">Stats</div>
          <div
            v-for="stat in statsFields"
            :key="stat.label"
            class="grid grid-cols-3 gap-3"
          >
            <u-form-field
              v-if="stat.key"
              :name="`stats.0.${stat.key}`"
            >
              <!--@vue-expect-error-->
              <form-input-number
                v-model="state.stats[0][stat.key]"
                :placeholder="stat.label"
              />
            </u-form-field>

            <u-field-group v-else>
              <!--@vue-expect-error-->
              <form-input-number
                v-for="child in stat.children"
                :key="child"
                v-model="state.stats[0][child]"
                :placeholder="startCase(child)"
              />
            </u-field-group>

            <div class="text-sm font-medium">{{ stat.label }}</div>

            <u-form-field
              v-if="stat.key"
              :name="`stats.1.${stat.key}`"
            >
              <!--@vue-expect-error-->
              <form-input-number
                v-model="state.stats[1][stat.key]"
                :placeholder="stat.label"
              />
            </u-form-field>

            <u-field-group v-else>
              <!--@vue-expect-error-->
              <form-input-number
                v-for="child in stat.children"
                :key="child"
                v-model="state.stats[1][child]"
                :placeholder="startCase(child)"
              />
            </u-field-group>
          </div>
        </div>
      </u-form>

      <u-alert
        v-if="errors"
        color="error"
        :title="`Error saving match`"
        :description="errors"
        class="mt-5"
      />
    </template>

    <template #footer="{ close }">
      <form-footer
        form="match-form"
        :loading="isUploading"
        @reset="handleReset"
        @close="close"
      />
    </template>
  </u-modal>
</template>
