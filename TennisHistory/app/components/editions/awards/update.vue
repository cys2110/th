<script setup lang="ts">
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"
import { cloneDeep, isEqual } from "lodash"

const { award, refresh } = defineProps<{
  award?: AwardType
  refresh: () => void
  iconOnly?: boolean
}>()

const {
  params: { edId }
} = useRoute("edition")
const toast = useToast()
const {
  ui: { icons }
} = useAppConfig()

const open = ref(false)
const uploading = ref(false)

const initialState = {
  ...award,
  edition: Number(edId),
  tour: award?.tour ? (tourEnum[award.tour as keyof typeof tourEnum] as TourEnumType) : undefined
}
const state = ref<Partial<AwardFormInput>>(cloneDeep(initialState))

const { data: currency, execute } = await useFetch("/api/currency", {
  query: { edId, tour: initialState.tour },
  default: () => "USD",
  immediate: false
})

watch(
  () => state.value.tour,
  () => {
    if (!award) execute()
  },
  { immediate: true }
)

const formFields: FormFieldInterface<AwardFormInput>[] = [
  { label: "Round", key: "round", type: "inputMenu", items: Object.keys(roundEnum), required: true, class: "col-span-2" },
  { label: "Tour", key: "tour", type: "radio", items: TOUR_OPTIONS, required: true },
  { label: "Type", key: "type", type: "radio", items: ["Singles", "Doubles"], required: true },
  { label: "Points", key: "points", type: "number" },
  { label: "Prize Money", key: "pm", type: "number", currency: award?.currency ?? currency.value ?? "USD" }
]

const handleReset = () => set(state, cloneDeep(initialState))

const onError = (event: FormErrorEvent) => console.error(event.errors)

const onSubmit = async (event: FormSubmitEvent<AwardFormSchema>) => {
  set(uploading, true)

  // Get dirty fields from the form
  const fields = Object.keys(event.data) as (keyof AwardFormSchema)[]
  const dirtyFields: Partial<AwardFormSchema> = {}
  fields.forEach(field => {
    if (!isEqual(event.data[field], initialState[field as keyof typeof initialState])) {
      // @ts-expect-error
      dirtyFields[field] = event.data[field] ?? null
    }
  })

  if (Object.keys(dirtyFields).length) {
    dirtyFields["id"] = event.data.id // always include the award ID

    if (!award) {
      dirtyFields["event"] = event.data.event // always include the event
    }

    const response = await $fetch(`/api/editions/awards/${award ? "update" : "create"}`, {
      method: "POST",
      body: dirtyFields
    })

    if ((response as any).ok) {
      toast.add({
        title: `Round ${award ? "updated" : "created"}`,
        icon: icons.success,
        color: "success"
      })

      refresh()
      handleReset()
      set(open, false)
    } else {
      toast.add({
        title: `Error ${award ? "updating" : "creating"} round`,
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
    :title="award ? `${award.tour} ${award.type} ${award.round}` : 'Create Round'"
    v-model:open="open"
  >
    <u-button
      :icon="award ? ICONS.edit : icons.plus"
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
