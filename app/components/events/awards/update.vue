<script setup lang="ts">
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"
import { isEqual } from "lodash"

const { round, refresh } = defineProps<{
  round?: AwardType
  refresh: () => void
  iconOnly?: boolean
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

const { data: currency } = await useFetch("/api/currency", {
  query: { edId, tour },
  default: () => "USD"
})

const initialState = {
  ...round,
  event: `${edId}-${tour}`,
  tour: tour as TourEnumType,
  draw: (round
    ? ["Qualifier", "Qualifying round 1", "Qualifying round 2", "Qualifying round 3"].includes(round.round)
      ? "Qualifying"
      : "Main"
    : undefined) as DrawEnumType
}

const state = ref<Partial<AwardFormInput>>({ ...initialState })

const formFields = computed<FormFieldInterface<AwardFormInput>[]>(() => [
  { label: "Round", key: "round", type: "inputMenu", items: Object.keys(roundEnum), required: true },
  { label: "Type", key: "type", type: "radio", items: ["Singles", "Doubles"], required: true },
  { label: "Draw", key: "draw", type: "radio", items: ["Main", "Qualifying"], required: true },
  { label: "Number", key: "number", type: "number", required: true },
  { label: "Points", key: "points", type: "number" },
  { label: "Prize Money", key: "pm", type: "number", currency: currency.value }
])

const handleReset = () => set(state, { ...initialState })

const onError = (event: FormErrorEvent) => console.error(event.errors)

const onSubmit = async (event: FormSubmitEvent<AwardFormSchema>) => {
  set(uploading, true)

  // Get dirty fields from the form
  const fields = Object.keys(event.data) as (keyof AwardFormSchema)[]
  const dirtyFields: Partial<AwardFormSchema> = {}
  fields.forEach(field => {
    if (!isEqual(event.data[field], initialState[field])) {
      // @ts-expect-error
      dirtyFields[field] = event.data[field] ?? null
    }
  })

  if (Object.keys(dirtyFields).length) {
    dirtyFields["id"] = event.data.id // always include the award ID
    dirtyFields["event"] = event.data.event // always include the edition
    dirtyFields["tour"] = event.data.tour // always include the tour

    const response = await $fetch(`/api/events/awards/${round ? "update" : "create"}`, {
      method: "POST",
      body: dirtyFields
    })

    if ((response as any).ok) {
      toast.add({
        title: `Round ${round ? "updated" : "created"}`,
        icon: icons.success,
        color: "success"
      })

      if (refresh) {
        refresh()
      }

      handleReset()
      set(open, false)
    } else {
      toast.add({
        title: `Error ${round ? "updating" : "creating"} round`,
        description: (response as any).message,
        icon: icons.error,
        color: "error"
      })
    }
  } else {
    toast.add({
      title: "No changes to save",
      icon: icons.caution,
      color: "warning"
    })
  }

  set(uploading, false)
}
</script>

<template>
  <u-modal
    :title="round ? `${round.round} ${round.type}` : 'Create Round'"
    v-model:open="open"
  >
    <u-button
      :icon="round ? ICONS.edit : icons.plus"
      :block="!iconOnly"
    >
      <template
        #default
        v-if="!iconOnly"
      >
        <slot />
        <template v-if="!$slots['default']"> Create Round </template>
      </template>
    </u-button>

    <template #body>
      <u-form
        id="round-form"
        ref="form"
        :schema="awardFormSchema"
        :state
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
