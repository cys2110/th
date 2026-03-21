<script setup lang="ts">
import { CalendarDate } from "@internationalized/date"
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"

const {
  params: { edId }
} = useRoute("edition")

const {
  ui: { icons }
} = useAppConfig()

const toast = useToast()
const supabase = useSupabaseClient()

const isUploading = ref(false)
const isOpen = ref(false)
const errors = ref()

const { data: ties, pending: tiesPending } = await useAsyncData(
  "match-ties",
  async () => {
    const { data, error } = await supabase
      .from("ties")
      .select("*, rounds!inner(*), winner:entries!winner_id(country_id), loser:entries!loser_id(country_id)")
      .eq("rounds.event_id", `${edId}-Country`)

    if (error || !data) {
      console.error("Error fetching ties:", error)
      return []
    }

    return data.map(tie => ({
      id: tie.id,
      label: `${tie.group_name || tie.rounds.round} - ${tie.winner!.country_id} v ${tie.loser!.country_id}`,
      round_id: tie.rounds.id
    }))
  },
  { default: () => [] }
)

const { data: entries, pending: entriesPending } = await useAsyncData(
  "match-entries",
  async () => {
    const { data, error } = await supabase
      .from("entries")
      .select("id, player_entry_mapping(players(first_name, last_name))")
      .eq("event_id", `${edId}-Country`)
      .is("country_id", null)

    if (error || !data) {
      console.error("Error fetching entries:", error)
      return []
    }

    return data.map(entry => ({
      id: entry.id,
      team: entry.player_entry_mapping.map(pem => `${pem.players.first_name} ${pem.players.last_name}`).join(" / ")
    }))
  },
  { default: () => [] }
)

const initialState: Partial<CountryMatchType> = {
  draw: "Main",
  format: 3,
  sets: [],
  // @ts-expect-error
  stats: [{}, {}]
}

const state = ref<Partial<CountryMatchType>>({ ...initialState })

watch(
  () => state.value.tie_id,
  newTieId => {
    if (newTieId) {
      const round = ties.value.find(tie => tie.id === newTieId)
      state.value.round_id = round?.round_id
    }
  }
)

const date = shallowRef<CalendarDate | undefined>()

watch(date, newDate => {
  state.value.date = newDate?.toString() || null
})

const winner = ref<string>()

watch(
  () => [winner.value, state.value.team_1_id, state.value.team_2_id],
  () => {
    if (winner.value === "Team 1") {
      state.value.winner_id = state.value.team_1_id
      state.value.loser_id = state.value.team_2_id
    } else if (winner.value === "Team 2") {
      state.value.winner_id = state.value.team_2_id
      state.value.loser_id = state.value.team_1_id
    }
  }
)

const formFields = computed<FormFieldInterface<CountryMatchType>[]>(() => [
  { label: "S/D", key: "match_type", type: "radio", items: ["Singles", "Doubles"], required: true },
  {
    label: "Format",
    key: "format",
    type: "radio",
    items: [
      { value: 3, label: "Best of 3" },
      { value: 5, label: "Best of 5" }
    ],
    required: true
  },
  {
    label: "Tie",
    key: "tie_id",
    type: "inputMenu",
    required: true,
    loading: tiesPending.value,
    items: ties.value,
    valueKey: "id",
    labelKey: "label",
    placeholder: "Select tie"
  },
  { label: "Match No.", key: "match_no", type: "number", required: true },
  { label: "Date", key: "date", type: "date" },
  { label: "Court", key: "court", type: "text" },
  { label: "Duration", key: "duration", type: "text", description: "HH:MM:SS" },
  { label: "Umpire", key: "umpire_id", type: "slot" },
  {
    label: state.value.match_type === "Doubles" ? "Team 1" : "Player 1",
    key: "team_1_id",
    type: "inputMenu",
    loading: entriesPending.value,
    items: entries.value,
    valueKey: "id",
    labelKey: "team",
    placeholder: `Select ${state.value.match_type === "Doubles" ? "Team" : "Player"} 1`,
    icon: ICONS.player
  },
  {
    label: state.value.match_type === "Doubles" ? "Team 2" : "Player 2",
    key: "team_2_id",
    type: "inputMenu",
    loading: entriesPending.value,
    items: entries.value,
    valueKey: "id",
    labelKey: "team",
    placeholder: `Select ${state.value.match_type === "Doubles" ? "Team" : "Player"} 2`,
    icon: ICONS.player
  },
  {
    label: "Winner",
    type: "slot",
    required: true
  },
  {
    label: "Incomplete",
    key: "incomplete",
    type: "radio",
    items: Object.entries(INCOMPLETE_MAPPING).map(([value, label]) => ({ label, value })),
    class: "col-span-2"
  }
])

watch(
  () => [state.value.format, state.value.team_1_id, state.value.team_2_id],
  () => {
    if (state.value.format && state.value.team_1_id && state.value.team_2_id) {
      state.value.sets = Array.from({ length: state.value.format * 2 }, (_, i) => ({
        entry_id: i % 2 === 0 ? (state.value.team_2_id as string) : (state.value.team_1_id as string),
        set_no: Math.round((i + 1) / 2),
        set: null,
        tb: null
      }))
    }
  },
  { immediate: true }
)

const statsFields = [
  { label: "Aces", key: "aces" },
  { label: "Double Faults", key: "dfs" },
  { label: "1st Serve Win %", errorPattern: /^(serve1_w|serve1)$/, children: ["serve1_w", "serve1"] },
  { label: "2nd Serve Win %", errorPattern: /^(serve2_w|serve2)$/, children: ["serve2_w", "serve2"] },
  { label: "Break Points Saved %", errorPattern: /^(bps_saved|bps_faced)$/, children: ["bps_saved", "bps_faced"] },
  { label: "1st Return Win %", errorPattern: /^(ret1_w|ret1)$/, children: ["ret1_w", "ret1"] },
  { label: "2nd Return Win %", errorPattern: /^(ret2_w|ret2)$/, children: ["ret2_w", "ret2"] },
  { label: "Break Points Converted %", errorPattern: /^(bps_converted|bp_opps)$/, children: ["bps_converted", "bp_opps"] },
  { label: "Net Points Won %", errorPattern: /^(net_w|net)$/, children: ["net_w", "net"] },
  { label: "Winners", key: "winners" },
  { label: "Unforced Errors", key: "ues" },
  { label: "Service Games Played", key: "serve_games" },
  { label: "Return Games Won", key: "return_games" },
  { label: "Max Serve Speed (km/h)", key: "max_serve" },
  { label: "Avg 1st Serve Speed (km/h)", key: "avg1_speed" },
  { label: "Avg 2nd Serve Speed (km/h)", key: "avg2_speed" }
]

const stats = ref<Partial<MatchStatType>[]>([{}, {}])

watch(
  () => state.value.team_1_id,
  () => {
    if (state.value.team_1_id) {
      // @ts-expect-error
      state.value.stats[0] = {
        ...stats.value[0],
        entry_id: state.value.team_1_id
      }
    }
  }
)

watch(
  () => state.value.team_2_id,
  () => {
    if (state.value.team_2_id) {
      // @ts-expect-error
      state.value.stats[1] = {
        ...stats.value[1],
        entry_id: state.value.team_2_id
      }
    }
  }
)

const handleReset = () => {
  state.value = { ...initialState }
  errors.value = undefined
  date.value = undefined
  winner.value = undefined
}

const onError = (event: FormErrorEvent) => console.error(event.errors)

const onSubmit = async (event: FormSubmitEvent<CountryMatchType>) => {
  set(isUploading, true)

  const { sets, stats, ...rest } = event.data

  const { data, error } = await supabase
    .from("matches")
    .insert({ ...rest })
    .select("id")

  if (error) {
    errors.value = error
    set(isUploading, false)
    return
  }

  const setsToInsert = sets.filter(set => !!set.set).map(set => ({ ...set, match_id: data![0]!.id }))
  const statsToInsert = stats.filter(stat => !!stat.serve1_w).map(stat => ({ ...stat, match_id: data![0]!.id }))

  const { error: setsError } = await supabase.from("match_scores").insert(setsToInsert)
  const { error: statsError } = await supabase.from("match_stats").insert(statsToInsert)

  if (setsError || statsError) {
    errors.value = setsError || statsError
    set(isUploading, false)
    return
  }

  toast.add({
    title: "Match successfully created!",
    description: JSON.stringify(event.data),
    icon: icons.success,
    color: "success"
  })

  handleReset()
  set(isOpen, false)

  set(isUploading, false)
}
</script>

<template>
  <u-modal
    title="Create Match"
    v-model:open="isOpen"
  >
    <u-button
      :icon="icons.plus"
      color="warning"
    />

    <template #body>
      <u-form
        id="match-form"
        :schema="CountryMatchSchema"
        :state="state"
        @submit="onSubmit"
        @error="onError"
      >
        <div class="grid grid-cols-2 gap-3 items-center">
          <form-field
            v-for="field in formFields"
            :key="field.label"
            :field
            v-model="state"
            v-model:date="date"
          >
            <person-search
              v-if="field.label === 'Umpire'"
              v-model="<string>state[field.key!]"
              placeholder="Select umpire"
              :icon="ICONS.umpire"
            />

            <u-radio-group
              v-else-if="field.label === 'Winner'"
              :items="['Team 1', 'Team 2']"
              v-model="winner"
              orientation="horizontal"
            />
          </form-field>
        </div>

        <div
          v-if="state.sets!.length"
          class="mt-3 space-y-2"
        >
          <div class="font-semibold">Score</div>
          <u-form
            v-for="(item, count) in state.sets"
            :key="count"
            :name="`sets.${count}`"
            :schema="MatchScoreSchema"
            nested
          >
            <u-form-field
              :error-pattern="/^(set|tb)$/"
              :label="`Set ${item.set_no} - ${item.entry_id}`"
              orientation="horizontal"
              :ui="{
                root: 'grid grid-cols-2'
              }"
            >
              <u-field-group class="w-full">
                <form-input-number
                  placeholder="Enter set"
                  v-model="item.set"
                />

                <form-input-number
                  placeholder="Enter tiebreak"
                  v-model="item.tb"
                />
              </u-field-group>
            </u-form-field>
          </u-form>
        </div>

        <div v-if="state.team_1_id && state.team_2_id">
          <div class="font-semibold">Stats</div>

          <div class="grid grid-cols-2 gap-3">
            <div class="font-medium text-sm">Team 1</div>
            <div class="font-medium text-sm">Team 2</div>
            <u-form
              v-for="(item, count) in state.stats"
              :key="count"
              :name="`stats.${count}`"
              :schema="MatchStatSchema"
              nested
              class="space-y-2"
            >
              <u-form-field
                v-for="field in statsFields"
                :key="field.label"
                :name="field.key"
                :error-pattern="field.errorPattern"
                :label="field.label"
              >
                <form-input-number
                  v-if="field.key"
                  :placeholder="`Enter ${field.label.toLowerCase()}`"
                  v-model="<number>item[field.key as keyof typeof item]"
                />

                <u-field-group
                  v-else
                  class="w-full"
                >
                  <form-input-number
                    v-for="child in field.children"
                    :key="child"
                    :placeholder="`Enter ${child}`"
                    v-model="<number>item[child as keyof typeof item]"
                  />
                </u-field-group>
              </u-form-field>
            </u-form>
          </div>
        </div>
      </u-form>

      <u-alert
        v-if="errors"
        color="error"
        :title="`Error saving match`"
        class="mt-5"
      >
        <template #description>
          {{ errors }}
        </template>
      </u-alert>
    </template>

    <template #footer="{ close }">
      <form-footer
        form="match-form"
        :is-uploading
        @reset="handleReset"
        @close="close"
      />
    </template>
  </u-modal>
</template>
