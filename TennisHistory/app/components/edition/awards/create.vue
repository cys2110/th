<script setup lang="ts">
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"

const emit = defineEmits<{
  refresh: []
}>()

const {
  ui: { icons }
} = useAppConfig()

const {
  params: { edId }
} = useRoute("edition")

const toast = useToast()
const supabase = useSupabaseClient()

const tournamentStore = useTournamentStore()

const isOpen = ref(false)
const isUploading = ref(false)
const errors = ref()

const { data: currencies } = await useAsyncData("currencies", async () => {
  const { data, error } = await supabase.from("events").select("currency, tour").eq("edition_id", Number(edId))

  if (error) {
    console.error("Error fetching currencies:", error)
    return {}
  }

  const currencyMap: Partial<Record<TourType, CurrencyType>> = {}

  data.forEach(event => {
    if (event.tour && event.currency) currencyMap[event.tour] = event.currency
  })

  return currencyMap
})

const state = ref<Partial<AwardType>>({
  tour: tournamentStore.tours[0]
})

const handleReset = () => {
  set(state, { tour: tournamentStore.tours[0] })
  errors.value = undefined
}

const onError = (event: FormErrorEvent) => (errors.value = event.errors)

const onSubmit = async (event: FormSubmitEvent<AwardType>) => {
  set(isUploading, true)

  const { error } = await supabase.from("rounds").insert({
    ...event.data,
    event_id: `${edId}-${event.data.tour}`,
    draw: event.data.round.includes("Qualifying") || event.data.round === "Qualifier" ? "Qualifying" : "Main",
    number: ROUND_NUMBER_MAPPING[event.data.round]
  })

  if (error) {
    errors.value = error
    set(isUploading, false)
    return
  }

  toast.add({
    title: `${event.data.round} successfully created!`,
    description: JSON.stringify(event.data),
    icon: icons.success,
    color: "success"
  })

  emit("refresh")
  handleReset()
  set(isOpen, false)
  set(isUploading, false)
}

const formFields = computed<FormFieldInterface<AwardType>[]>(() => {
  const fields: FormFieldInterface<AwardType>[] = [
    {
      label: "Round",
      key: "round",
      type: "inputMenu",
      items: ROUNDS,
      icon: ICONS.level,
      required: true,
      class: tournamentStore.tours.length > 1 ? "col-span-2" : "col-span-1"
    }
  ]

  if (tournamentStore.tours.length > 1) {
    fields.push({
      label: "Tours",
      key: "tour",
      type: "radio",
      items: tournamentStore.tours.length ? tournamentStore.tours : TOUR_OPTIONS,
      required: true
    })
  }

  fields.push(
    { label: "S/D", key: "match_type", type: "radio", items: MATCH_TYPES },
    {
      label: "Prize Money",
      key: "pm",
      type: "number",
      currency: state.value.tour && currencies.value ? currencies.value[state.value.tour as keyof typeof currencies.value] : "USD"
    },
    { label: "Points", key: "points", type: "number" }
  )

  return fields
})
</script>

<template>
  <u-modal
    title="Create Round"
    v-model:open="isOpen"
  >
    <u-button
      color="warning"
      :icon="icons.plus"
    />

    <template #body>
      <u-form
        id="award-form"
        :schema="AwardSchema"
        :state
        @submit="onSubmit"
        @error="onError"
      >
        <div class="grid grid-cols-2 items-center gap-3">
          <form-field
            v-for="field in formFields"
            :key="field.label"
            :field
            v-model="state"
          />
        </div>
      </u-form>

      <u-alert
        v-if="errors"
        color="error"
        title="Error saving round"
        class="mt-5"
      >
        <template #description>
          {{ errors }}
        </template>
      </u-alert>
    </template>

    <template #footer="{ close }">
      <form-footer
        form="award-form"
        :is-uploading
        @reset="handleReset"
        @close="close"
      />
    </template>
  </u-modal>
</template>
