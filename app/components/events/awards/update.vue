<script setup lang="ts">
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"

const { round, refresh } = defineProps<{
  round?: RoundInterface
  refresh: () => void
  iconOnly?: boolean
  block?: boolean
}>()

const {
  params: { edId, tour }
} = useRoute("event")
const toast = useToast()
const {
  ui: { icons }
} = useAppConfig()

const open = ref(false)
const uploading = ref(false)

defineShortcuts({
  meta_shift_o: () => (round ? undefined : set(open, !get(open)))
})

const { data: currency } = await useFetch("/api/get-currency", {
  query: { edId, tour },
  default: () => "USD"
})

const state = reactive<Partial<RoundSchema>>({
  id: round?.id,
  edition: Number(edId),
  tour,
  round: round?.round,
  type: round?.type ?? "Singles",
  draw: round
    ? ["Qualifier", "Qualifying round 1", "Qualifying round 2", "Qualifying round 3"].includes(round.round)
      ? "Qualifying"
      : "Main"
    : "Main",
  number: round?.number,
  points: round?.points,
  pm: round?.pm
})

const formFields: FormFieldInterface<RoundSchema>[] = [
  { label: "Round", key: "round", type: "inputMenu", items: Object.keys(RoundEnum), required: true },
  { label: "Type", key: "type", type: "radio", items: ["Singles", "Doubles"], required: true },
  { label: "Draw", key: "draw", type: "radio", items: ["Main", "Qualifying"], required: true },
  { label: "Number", key: "number", type: "number", required: true },
  { label: "Points", key: "points", type: "number" },
  { label: "Prize Money", key: "pm", type: "currency" }
]

const handleReset = () => {
  state.draw = round
    ? ["Qualifier", "Qualifying round 1", "Qualifying round 2", "Qualifying round 3"].includes(round.round)
      ? "Qualifying"
      : "Main"
    : undefined
  state.round = round?.round
  state.type = round?.type
  state.number = round?.number
  state.points = round?.points
  state.pm = round?.pm
}

const onError = (event: FormErrorEvent) => {
  toast.add({
    title: "Please ensure fields are filled out correctly",
    description: event.errors.map(e => e.message).join(", "),
    icon: icons.error,
    color: "error"
  })
}

const onSubmit = async (event: FormSubmitEvent<RoundSchema>) => {
  set(uploading, true)
  try {
    const response = await $fetch(`/api/events/awards/${round ? "update" : "create"}`, {
      query: event.data
    })

    if ((response as any).ok) {
      toast.add({
        title: `Round ${round ? "updated" : "created"}`,
        icon: icons.success,
        color: "success"
      })
      handleReset()
      set(open, false)
      if (refresh) {
        refresh()
      }
    } else {
      toast.add({
        title: `Error ${round ? "updating" : "creating"} round`,
        description: (response as any).message,
        icon: icons.error,
        color: "error"
      })
    }
  } catch (e) {
    toast.add({
      title: `Error ${round ? "updating" : "creating"} round`,
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
    :title="round ? `Edit ${round.round} ${round.type}` : 'Create Round'"
    v-model:open="open"
  >
    <u-button
      :icon="round ? ICONS.edit : icons.plus"
      :label="iconOnly ? undefined : 'Create Round'"
      :block
    />

    <template #body>
      <u-form
        id="round-form"
        :schema="roundSchema"
        :state
        @submit="onSubmit"
        @error="onError"
      >
        <div class="grid grid-cols-2 gap-5 items-center">
          <form-field
            v-for="field in formFields"
            :key="field.label"
            :field
            v-model="state[field.key]"
            :currency="round?.currency || currency"
          />
        </div>
      </u-form>
    </template>

    <template #footer="{ close }">
      <u-button
        form="round-form"
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
