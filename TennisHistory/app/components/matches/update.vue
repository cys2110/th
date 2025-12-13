<script setup lang="ts">
// @ts-nocheck
import { parseDate } from "@internationalized/date"
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"
import { cloneDeep } from "lodash"

const { match } = defineProps<{
  match?: RawMatchType
}>()
const {
  params: { edId }
} = useRoute("match")
const {
  ui: { icons }
} = useAppConfig()
const toast = useToast()

const tour = useRouteQuery("tour")
const draw = useRouteQuery("draw")
const type = useRouteQuery("type")

const uploading = ref(false)
const open = ref(false)

const initialState = computed(() => ({
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
  tour: tour.value ?? undefined,
  draw: draw.value ?? undefined,
  type: type.value ?? undefined
}))

const state = ref(cloneDeep(initialState.value))

const formFields = computed<FormFieldInterface<MatchFormSchema>[]>(
  () =>
    [
      { label: "S/D", key: "type", type: "radio", items: ["Singles", "Doubles"], required: true },
      { label: "Draw", key: "draw", type: "radio", items: ["Main", "Qualifying"], required: true },
      {
        label: "No. of Sets",
        key: "noOfSets",
        type: "radio",
        items: ["Best Of 3", "Best Of 5"]
      },
      { label: "Round", key: "round", type: "inputMenu", items: ROUND_OPTIONS, required: true },
      { label: "Match No.", key: "match_no", type: "number", required: true },
      { label: "Date", key: "date", type: "date" },
      { label: "Court", key: "court", type: "text" },
      { label: "Duration", key: "duration", type: "text", placeholder: "HH:MM:SS" },
      { label: "Umpire", key: "umpire", type: "search", subType: "Umpire" },
      { label: "Group", key: "group", type: "text" },
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
        type: "search",
        subType: "Entry",
        matchType: state.value.type ?? "Singles",
        placeholder: state.value.type === "Doubles" ? "Team 1" : "Player 1",
        id: `${edId}-${tour}`
      },
      {
        label: state.value.type === "Doubles" ? "Team 2" : "Player 2",
        key: "t2",
        type: "search",
        subType: "Entry",
        matchType: state.value.type ?? "Singles",
        placeholder: state.value.type === "Doubles" ? "Team 2" : "Player 2",
        id: `${edId}-${tour}`
      }
    ] as FormFieldInterface<MatchFormSchema>[]
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

const onSubmit = async (event: FormSubmitEvent<MatchFormSchema>) => {
  set(uploading, true)

  const response = await $fetch(`/api/matches/${match ? "update" : "create"}`, {
    method: "POST",
    body: event.data
  })

  if ((response as any).ok) {
    toast.add({
      title: `Match ${match ? "updated" : "created"} successfully`,
      icon: icons.success,
      color: "success"
    })

    set(open, false)
    reloadNuxtApp()
  } else {
    toast.add({
      title: "Error updating match",
      icon: icons.error,
      color: "error"
    })
  }

  set(uploading, false)
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
    />

    <template #body>
      <!--@vue-expect-error-->
      <u-form
        id="match-form"
        :schema="matchFormSchema"
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
          />

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
        :icon="uploading ? ICONS.uploading : icons.check"
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
