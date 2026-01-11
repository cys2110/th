<script setup lang="ts">
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"
import type { FetchError } from "ofetch"

const props = withDefaults(
  defineProps<{
    award?: AwardType
    refresh?: () => void
    iconOnly?: boolean
  }>(),
  {
    iconOnly: false
  }
)

const {
  params: { edId }
} = useRoute("edition")
const toast = useToast()
const {
  ui: { icons }
} = useAppConfig()
const tournamentStore = useTournamentStore()

const open = ref(false)
const uploading = ref(false)

const initialState = {
  ...props.award,
  edition: Number(edId),
  tour: props.award?.tour ? (tourEnum[props.award.tour as keyof typeof tourEnum] as TourInputEnumType) : undefined
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
    if (!props.award) execute()
  },
  { immediate: true }
)

const handleReset = () => set(state, cloneDeep(initialState))

const onError = (event: FormErrorEvent) => console.error(event.errors)

const onSubmit = async (event: FormSubmitEvent<AwardFormSchema>) => {
  set(uploading, true)

  // Get dirty fields from the form
  const fields = Object.keys(event.data) as (keyof AwardFormSchema)[]
  const dirtyFields: Partial<AwardFormSchema> = {}

  for (const field of fields) {
    if (field === "id" || field === "event") dirtyFields[field] = event.data[field] // always include ID and the event to identify the award

    if (!isEqual(event.data[field], initialState[field as keyof typeof initialState])) {
      // @ts-expect-error
      dirtyFields[field] = event.data[field] ?? null
    }
  }

  if (Object.keys(dirtyFields).length) {
    try {
      const response = await $fetch(`/api/edition/awards/${props.award ? "update" : "create"}`, {
        method: "POST",
        body: dirtyFields
      })

      if (response?.success) {
        toast.add({
          title: `Round ${props.award ? "updated" : "created"}`,
          icon: icons.success,
          color: "success"
        })

        if (props.refresh) {
          props.refresh()
        }

        await nextTick(() => {
          handleReset()
          set(open, false)
        })
      } else {
        toast.add({
          title: `Error ${props.award ? "updating" : "creating"} round`,
          icon: icons.error,
          color: "error"
        })
      }
    } catch (e) {
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
        title: `Error ${props.award ? "updating" : "creating"} round`,
        description: (e as Error).message,
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

const tourOptions = tournamentStore.tours.map(t => ({
  label: t,
  value: tourEnum[t as keyof typeof tourEnum] as TourInputEnumType
}))

const formFields = computed<FormFieldInterface<AwardFormInput>[]>(() => [
  {
    label: "Round",
    key: "round",
    type: "inputMenu",
    items: Object.keys(roundEnum),
    required: true,
    class: tournamentStore.tours.length > 1 ? "col-span-2" : ""
  },
  ...(tournamentStore.tours.length > 1
    ? [{ label: "Tour", key: "tour" as keyof AwardFormInput, type: "radio", items: tourOptions, required: true }]
    : []),
  { label: "Type", key: "type", type: "radio", items: ["Singles", "Doubles"], required: true },
  { label: "Points", key: "points", type: "number" },
  { label: "Prize Money", key: "pm", type: "number", currency: props.award?.currency ?? currency.value ?? "USD" }
])
</script>

<template>
  <u-modal
    :title="award ? `${award.tour} ${award.type} ${award.round}` : 'Create Round'"
    v-model:open="open"
  >
    <u-button
      :icon="award ? ICONS.edit : icons.plus"
      :block="!iconOnly"
      color="Doubles"
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
