<script setup lang="ts">
// @ts-nocheck
import { parseDate } from "@internationalized/date"
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"
import { cloneDeep, isEqual } from "lodash"

const { matchId } = defineProps<{
  matchId?: string
}>()

const {
  params: { edId, tour }
} = useRoute("match")
const {
  ui: { icons }
} = useAppConfig()
const toast = useToast()

const uploading = ref(false)
const open = ref(false)

const { data: match, execute } = await useFetch("/api/matches/form", {
  query: { matchId },
  immediate: false
})

onMounted(() => {
  if (matchId) {
    execute()
  }
})

const initialState = computed(() => ({
  ...(match.value
    ? {
        ...match.value,
        date: match.value.date ? parseDate(match.value.date) : undefined,
        umpire: match.value.umpire ? { value: match.value.umpire.id, label: match.value.umpire.id } : undefined,
        team1: match.value.team1
          ? {
              value: match.value.team1.id,
              label: match.value.team1.team.map(p => `${p.first_name} ${p.last_name}`).join(" / ")
            }
          : undefined,
        team2: match.value.team2
          ? {
              value: match.value.team2.id,
              label: match.value.team2.team.map(p => `${p.first_name} ${p.last_name}`).join(" / ")
            }
          : undefined,
        noOfSets: match.value.noOfSets ? (match.value.noOfSets === 3 ? "BestOf3" : "BestOf5") : (undefined as "BestOf3" | "BestOf5" | undefined)
      }
    : {
        t1: {},
        t2: {}
      }),
  event: `${edId}-${tour}`
}))

const state = computed(() => cloneDeep(initialState.value))

const formFields = computed<FormFieldInterface<MatchFormSchema>[]>(
  () =>
    [
      { label: "S/D", key: "type", type: "radio", items: ["Singles", "Doubles"], required: true },
      { label: "Draw", key: "draw", type: "radio", items: ["Main", "Qualifying"], required: true },
      {
        label: "No. of Sets",
        key: "noOfSets",
        type: "radio",
        items: [
          { label: "Best of 3", value: "BestOf3" },
          { label: "Best of 5", value: "BestOf5" }
        ]
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
          { label: "Bye", value: "Bye" },
          { label: "Walkover", value: "WO" }
        ]
      },
      {
        label: "Winner",
        key: "winner",
        type: "radio",
        items: [
          { label: state.value.type === "Doubles" ? "Team 1" : "Player 1", value: 1 },
          { label: state.value.type === "Doubles" ? "Team 2" : "Player 2", value: 2 }
        ]
      },
      {
        label: state.value.type === "Doubles" ? "Team 1" : "Player 1",
        key: "team1",
        type: "search",
        subType: "Entry",
        matchType: state.value.type ?? "Singles",
        placeholder: state.value.type === "Doubles" ? "Team 1" : "Player 1",
        id: `${edId}-${tour}`
      },
      {
        label: state.value.type === "Doubles" ? "Team 2" : "Player 2",
        key: "team2",
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
  { label: "Tiebreak 1", key: "tb1" },
  { label: "Set 2", key: "s2" },
  { label: "Tiebreak 2", key: "tb2" },
  { label: "Set 3", key: "s3" },
  { label: "Tiebreak 3", key: "tb3" },
  { label: "Set 4", key: "s4" },
  { label: "Tiebreak 4", key: "tb4" },
  { label: "Set 5", key: "s5" },
  { label: "Tiebreak 5", key: "tb5" }
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

  const response = await $fetch(`/api/matches/${matchId ? "update" : "create"}`, {
    method: "POST",
    body: event.data
  })

  if ((response as any).ok) {
    toast.add({
      title: `Match ${matchId ? "updated" : "created"} successfully`,
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
    :title="matchId ? 'Edit Match' : 'Create Match'"
    v-model:open="open"
  >
    <u-button
      :icon="matchId ? ICONS.edit : icons.plus"
      :label="matchId ? 'Edit Match' : 'Create Match'"
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
                v-model="state['t1']![field.key as keyof typeof state['t1']]"
              />
              <form-input-number
                :placeholder="state.type === 'Doubles' ? 'Team 2' : 'Player 2'"
                v-model="state['t2']![field.key as keyof typeof state['t2']]"
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
                v-model="state['t1']!['incomplete']"
                :items="[
                  { label: 'Retired', value: 'R' },
                  { label: 'Walkover', value: 'WO' },
                  { label: 'Default', value: 'Def' }
                ]"
                orientation="horizontal"
              />
              <u-radio-group
                :legend="state.type === 'Doubles' ? 'Team 2' : 'Player 2'"
                v-model="state['t2']!['incomplete']"
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
                v-model="state['t1']![field.key as keyof typeof state['t1']]"
              />
              <form-input-number
                :placeholder="state.type === 'Doubles' ? 'Team 2' : 'Player 2'"
                v-model="state['t2']![field.key as keyof typeof state['t2']]"
              />
            </u-field-group>

            <div
              v-else
              class="flex items-center gap-3"
            >
              <div class="flex items-center gap-1">
                <form-input-number
                  :placeholder="`${state.type === 'Doubles' ? 'T1' : 'P1'} Won`"
                  v-model="state['t1']![field.children![0] as keyof typeof state['t1']]"
                />
                /
                <form-input-number
                  :placeholder="`${state.type === 'Doubles' ? 'T1' : 'P1'} Total`"
                  v-model="state['t1']![field.children![1] as keyof typeof state['t1']]"
                />
              </div>
              <div class="flex items-center gap-1">
                <form-input-number
                  :placeholder="`${state.type === 'Doubles' ? 'T2' : 'P2'} Won`"
                  v-model="state['t2']![field.children![0] as keyof typeof state['t2']]"
                />
                /
                <form-input-number
                  :placeholder="`${state.type === 'Doubles' ? 'T2' : 'P2'} Total`"
                  v-model="state['t2']![field.children![1] as keyof typeof state['t2']]"
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
