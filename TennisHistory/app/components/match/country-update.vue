<script setup lang="ts">
// @ts-nocheck
import { parseDate } from "@internationalized/date"
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"
import type { FetchError } from "ofetch"

const { match } = defineProps<{
  match?: RawCountryMatchType
}>()
const {
  params: { edId }
} = useRoute("match")
const {
  ui: { icons }
} = useAppConfig()
const toast = useToast()

const type = useRouteQuery("type")

const uploading = ref(false)
const open = ref(false)

const { data: ties, status: tieStatus } = await useFetch("/api/edition/ties", {
  query: { edId },
  default: () => [],
  onResponseError: ({ error }) => console.error("Error fetching ties:", error)
})

const { data: teams, status } = await useFetch("/api/edition/entries/team-list", {
  query: { edId },
  default: () => [],
  onResponseError: ({ error }) => console.error("Error fetching teams:", error)
})

const initialState = computed<Partial<CountryMatchFormSchema>>(() => ({
  ...(match
    ? {
        ...match,
        date: match.date ? parseDate(match.date) : undefined,
        umpire: match.umpire ? { value: match.umpire.id, label: match.umpire.id } : undefined,
        t1: match.t1
          ? {
              value: match.t1.id,
              label: match.t1.team.map(p => `${p.first_name} ${p.last_name}`).join(" / ")
            }
          : undefined,
        t2: match.t2
          ? {
              value: match.t2.id,
              label: match.t2.team.map(p => `${p.first_name} ${p.last_name}`).join(" / ")
            }
          : undefined,
        noOfSets: match.noOfSets ? (match.noOfSets === 3 ? "Best Of 3" : "Best Of 5") : (undefined as "Best Of 3" | "Best Of 5" | undefined),
        duration: match.duration ? getDurationString(match.duration) : undefined
      }
    : {
        team1: {},
        team2: {}
      }),
  edition: Number(edId),
  type: type.value ?? undefined
}))

const state = ref(cloneDeep(initialState.value))

const formFields = computed<FormFieldInterface<CountryMatchFormSchema>[]>(
  () =>
    [
      { label: "S/D", key: "type", type: "radio", items: ["Singles", "Doubles"], required: true },
      { label: "Tie", key: "tie", type: "inputMenu", items: ties.value, required: true },
      { label: "Match No.", key: "match_no", type: "number", required: true },
      { label: "Date", key: "date", type: "date" },
      { label: "Court", key: "court", type: "text" },
      { label: "Duration", key: "duration", type: "text", placeholder: "HH:MM:SS" },
      { label: "Umpire", key: "umpire", type: "search", subType: "Umpire", class: "col-span-2" },
      {
        label: "Incomplete",
        key: "incomplete",
        type: "radio",
        items: [
          { label: "Bye", value: "B" },
          { label: "Walkover", value: "WO" }
        ]
      },
      {
        label: "Winner",
        key: "winning_team",
        type: "radio",
        items: [
          { label: state.value.type === "Doubles" ? "Team 1" : "Player 1", value: "t1" },
          { label: state.value.type === "Doubles" ? "Team 2" : "Player 2", value: "t2" }
        ]
      },
      {
        label: state.value.type === "Doubles" ? "Team 1" : "Player 1",
        key: "t1",
        type: "slot"
      },
      {
        label: state.value.type === "Doubles" ? "Team 2" : "Player 2",
        key: "t2",
        type: "slot"
      }
    ] as FormFieldInterface<CountryMatchFormSchema>[]
)

const scoreFormFields = [
  { label: "Set 1", key: "s1" },
  { label: "Tiebreak 1", key: "t1" },
  { label: "Set 2", key: "s2" },
  { label: "Tiebreak 2", key: "t2" },
  { label: "Set 3", key: "s3" },
  { label: "Tiebreak 3", key: "t3" },
  { label: "Set 4", key: "s4" },
  { label: "Tiebreak 4", key: "t4" },
  { label: "Set 5", key: "s5" },
  { label: "Tiebreak 5", key: "t5" }
]

const statsFields = [
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
  { label: "Max Serve Speed (km/h)", key: "max_serve", class: "col-span-2" },
  { label: "Avg 1st Serve Speed (km/h)", key: "avg1_speed" },
  { label: "Avg 2nd Serve Speed (km/h)", key: "avg2_speed" }
]

const handleReset = () => {
  state.value = cloneDeep(initialState.value)
}

const onError = (event: FormErrorEvent) => console.error("Form Error:", event.errors)

const onSubmit = async (event: FormSubmitEvent<CountryMatchFormSchema>) => {
  set(uploading, true)

  try {
    const response = await $fetch(`/api/matches/country-${match ? "update" : "create"}`, {
      method: "POST",
      body: event.data
    })

    if (response?.success) {
      toast.add({
        title: `Match ${match ? "updated" : "created"} successfully`,
        icon: icons.success,
        color: "success"
      })

      set(open, false)
      reloadNuxtApp()
    } else {
      toast.add({
        title: `Error ${match ? "updating" : "creating"} match`,
        icon: icons.error,
        color: "error"
      })
    }
  } catch (e) {
    console.error("Error submitting form:", e)
    if (typeof e === "object" && e && "statusMessage" in e) {
      const err = e as FetchError<ValidationError>

      if (err.statusMessage === "Invalid request body") {
        console.error(
          "Validation errors: ",
          err.data?.validationErrors.map(e => `${e.path.join(".")}: ${e.message}`)
        )
      }
    } else {
      console.error(e)
    }

    toast.add({
      title: `Error ${match ? "updating" : "creating"} match`,
      description: (e as Error).message,
      icon: icons.error,
      color: "error"
    })
  } finally {
    set(uploading, false)
  }
}
</script>

<template>
  <u-modal
    :title="match ? 'Edit Match' : 'Create Match'"
    v-model:open="open"
  >
    <u-button
      :icon="match ? ICONS.edit : icons.plus"
      :label="match ? 'Edit Match' : 'Create Match'"
      block
      color="Doubles"
    />

    <template #body>
      <u-form
        id="match-form"
        :schema="countryMatchFormSchema"
        :state="state"
        @submit="onSubmit"
        @error="onError"
      >
        <div class="grid grid-cols-2 gap-3 items-center">
          <form-field
            v-for="field in formFields"
            :key="field.label"
            :field="field"
            v-model="state"
          >
            <u-input-menu
              v-model="state[field.key]"
              :items="teams"
              :loading="status === 'pending'"
              :placeholder="`Select ${state.type === 'Singles' ? 'Player' : 'Team'} ${field.key === 't1' ? '1' : '2'}`"
              :icon="ICONS.player"
            />
          </form-field>

          <u-form-field
            v-for="field in scoreFormFields"
            :key="field.label"
            :label="field.label"
          >
            <u-field-group class="w-full">
              <form-input-number
                :placeholder="state.type === 'Doubles' ? 'Team 1' : 'Player 1'"
                v-model="state['team1']![field.key as keyof typeof state['team1']]"
              />
              <form-input-number
                :placeholder="state.type === 'Doubles' ? 'Team 2' : 'Player 2'"
                v-model="state['team2']![field.key as keyof typeof state['team2']]"
              />
            </u-field-group>
          </u-form-field>

          <u-form-field
            label="Incomplete"
            class="col-span-2"
          >
            <div class="grid grid-cols-2">
              <u-radio-group
                :legend="state.type === 'Doubles' ? 'Team 1' : 'Player 1'"
                v-model="state['team1']!['incomplete']"
                :items="[
                  { label: 'Retired', value: 'R' },
                  { label: 'Walkover', value: 'WO' },
                  { label: 'Default', value: 'Def' }
                ]"
                orientation="horizontal"
              />
              <u-radio-group
                :legend="state.type === 'Doubles' ? 'Team 2' : 'Player 2'"
                v-model="state['team2']!['incomplete']"
                :items="[
                  { label: 'Retired', value: 'R' },
                  { label: 'Walkover', value: 'WO' },
                  { label: 'Default', value: 'Def' }
                ]"
                orientation="horizontal"
              />
            </div>
          </u-form-field>

          <u-form-field
            v-for="field in statsFields"
            :key="field.label"
            :label="field.label"
            :class="{ 'col-span-2': !!field.children || field.class }"
          >
            <u-field-group
              v-if="field.key"
              class="w-full"
            >
              <form-input-number
                :placeholder="state.type === 'Doubles' ? 'Team 1' : 'Player 1'"
                v-model="state['team1']![field.key as keyof typeof state['team1']]"
              />
              <form-input-number
                :placeholder="state.type === 'Doubles' ? 'Team 2' : 'Player 2'"
                v-model="state['team2']![field.key as keyof typeof state['team2']]"
              />
            </u-field-group>

            <div
              v-else
              class="flex items-center gap-3"
            >
              <div class="flex items-center gap-1">
                <form-input-number
                  :placeholder="`${state.type === 'Doubles' ? 'T1' : 'P1'} Won`"
                  v-model="state['team1']![field.children![0] as keyof typeof state['team1']]"
                />
                /
                <form-input-number
                  :placeholder="`${state.type === 'Doubles' ? 'T1' : 'P1'} Total`"
                  v-model="state['team1']![field.children![1] as keyof typeof state['team1']]"
                />
              </div>
              <div class="flex items-center gap-1">
                <form-input-number
                  :placeholder="`${state.type === 'Doubles' ? 'T2' : 'P2'} Won`"
                  v-model="state['team2']![field.children![0] as keyof typeof state['team2']]"
                />
                /
                <form-input-number
                  :placeholder="`${state.type === 'Doubles' ? 'T2' : 'P2'} Total`"
                  v-model="state['team2']![field.children![1] as keyof typeof state['team2']]"
                />
              </div>
            </div>
          </u-form-field>
        </div>
      </u-form>
    </template>

    <template #footer="{ close }">
      <u-button
        form="match-form"
        type="submit"
        label="Save"
        :icon="uploading ? ICONS.uploading : icons.upload"
        block
      />
      <u-button
        label="Reset"
        :icon="icons.reload"
        @click="handleReset"
        block
        color="warning"
      />
      <u-button
        label="Cancel"
        :icon="icons.error"
        @click="close"
        block
        color="error"
      />
    </template>
  </u-modal>
</template>
