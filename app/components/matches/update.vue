<script setup lang="ts">
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"
import { parseDuration, parseDate } from "@internationalized/date"

const { match } = defineProps<{ match?: MatchInterface }>()
const {
  params: { edId, tour, mid }
} = useRoute("match")
const { type, draw } = destructureMid(mid ?? "")

defineShortcuts({
  meta_shift_m: () => (match ? undefined : set(open, !get(open)))
})

const toast = useToast()
const {
  ui: { icons }
} = useAppConfig()
const open = ref(false)
const uploading = ref(false)

const duration = computed(() => {
  if (match?.duration) {
    const { seconds } = parseDuration(match.duration)
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }
  return undefined
})

const state = reactive<Partial<MatchInput>>({
  id: match?.id,
  event: `${edId}-${tour}`,
  tour,
  type: type!,
  draw: draw!,
  round: match?.round,
  match_no: match?.match_no,
  incomplete: match?.incomplete,
  court: match?.court,
  date: match?.date ? parseDate(match.date) : undefined,
  duration: duration.value,
  umpire: match?.umpire ? { value: match.umpire.id, label: match.umpire.id } : undefined,
  s1: [],
  s2: [],
  s3: [],
  s4: [],
  s5: []
})

const formFields = computed<FormFieldInterface<MatchSchema>[]>(
  () =>
    [
      { label: "Type", key: "type", type: "radio", items: ["Singles", "Doubles"], required: true },
      { label: "Draw", key: "draw", type: "radio", items: ["Main", "Qualifying"], required: true },
      { label: "Round", key: "round", type: "inputMenu", items: Object.keys(RoundEnum), required: true },
      { label: "Match No.", key: "match_no", type: "number", required: true },
      {
        label: "Incomplete",
        key: "incomplete",
        type: "radio",
        items: [
          { value: "B", label: "Bye" },
          { value: "WO", label: "Walkover" }
        ]
      },
      { label: "Date", key: "date", type: "date" },
      { label: "Court", key: "court", type: "text" },
      { label: "Duration", key: "duration", type: "text" },
      { label: "Umpire", key: "umpire", type: "search", subType: "umpires" },
      !match && {
        label: "Best of",
        key: "sets",
        type: "radio",
        items: [
          { value: "BestOf3", label: "Best of 3" },
          { value: "BestOf5", label: "Best of 5" }
        ]
      },
      !match && { label: "Winner", key: "winner", type: "select", items: ["Team 1", "Team 2"], class: "col-span-2" }
    ].filter(Boolean) as FormFieldInterface<MatchSchema>[]
)

const numberOfSets = computed(() => {
  if (state.sets === "BestOf5") return 5
  return 3
})

const handleReset = () => {
  state.type = match?.type
  state.draw = match?.draw
  state.round = match?.round
  state.match_no = match?.match_no
  state.incomplete = match?.incomplete
}

const onError = (event: FormErrorEvent) => {
  toast.add({
    title: "Please ensure fields are filled out correctly",
    description: event.errors.map(e => e.message).join(", "),
    icon: icons.error,
    color: "error"
  })
}

const onSubmit = async (event: FormSubmitEvent<MatchSchema>) => {
  set(uploading, true)
  try {
    const response = await $fetch(`/api/matches/${match ? "update" : "create"}`, {
      query: event.data
    })

    if ((response as any).ok) {
      toast.add({
        title: `Match ${match ? "updated" : "created"}`,
        icon: icons.success,
        color: "success"
      })
      handleReset()
      set(open, false)
    } else {
      toast.add({
        title: `Error ${match ? "updating" : "creating"} match`,
        description: (response as any).message,
        icon: icons.error,
        color: "error"
      })
    }
  } catch (e) {
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
      block
      size="xs"
      :label="match ? `Edit Match` : `Create Match`"
    />

    <template #body>
      <u-form
        id="match-form"
        :schema="matchSchema"
        :state
        @submit="onSubmit"
        @error="onError"
      >
        <div class="grid grid-cols-2 gap-5 items-center">
          <form-field
            v-for="field in formFields"
            :key="field.label"
            :field="field"
            v-model="state[field.key]"
          />

          <form-select-search
            v-if="state.type && !match"
            v-model="state.team1"
            type="events/entries"
            :placeholder="state.type === 'Doubles' ? 'Select Team 1' : 'Select Player 1'"
            :id="edId"
            :tour="(tour as keyof typeof TourEnum)"
            :match-type="state.type"
            block
          />

          <form-select-search
            v-if="state.type && !match"
            v-model="state.team2"
            type="events/entries"
            :placeholder="state.type === 'Doubles' ? 'Select Team 2' : 'Select Player 2'"
            :id="edId"
            :tour="(tour as keyof typeof TourEnum)"
            :match-type="state.type"
            block
          />

          <div
            class="col-span-2"
            v-if="!match"
          >
            <u-form-field label="Score">
              <div class="flex flex-col gap-1">
                <u-field-group
                  v-for="n in numberOfSets"
                  :key="n"
                >
                  <u-button
                    disabled
                    :label="`Set ${n}`"
                  />

                  <form-input-number
                    :placeholder="`${state.type === 'Doubles' ? 'Team' : 'Player'} 1 Score`"
                    v-model="(state[`s${n}` as keyof typeof state] as number[])[0]"
                  />
                  <form-input-number
                    :placeholder="`${state.type === 'Doubles' ? 'Team' : 'Player'} 2 Score`"
                    v-model="(state[`s${n}` as keyof typeof state] as number[])[1]"
                  />
                  <form-input-number
                    placeholder="Tiebreak Low Score"
                    v-model="(state[`t${n}` as keyof typeof state] as number)"
                  />
                </u-field-group>
              </div>
            </u-form-field>
          </div>
        </div>
      </u-form>
    </template>

    <template #footer="{ close }">
      <u-button
        form="person-form"
        type="submit"
        label="Save"
        :icon="uploading ? ICONS.uploading : icons.check"
        block
      />
      <u-button
        label="Reset"
        @click="handleReset"
        :icon="icons.reload"
        block
        color="warning"
      />
      <u-button
        label="Cancel"
        color="error"
        @click="close"
        :icon="icons.close"
        block
      />
    </template>
  </u-modal>
</template>
