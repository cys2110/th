<script setup lang="ts">
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"

const emit = defineEmits<{
  refresh: []
}>()

const {
  params: { edId }
} = useRoute("edition")

const {
  ui: { icons }
} = useAppConfig()

const toast = useToast()
const supabase = useSupabaseClient()

const isOpen = ref(false)
const isUploading = ref(false)
const errors = ref()

const { data: countries, pending } = await useAsyncData(
  "countries",
  async () => {
    const { data, error } = await supabase.from("countries").select("*").order("name", { ascending: true })

    if (error || !data) {
      console.error("Error fetching countries:", error)
      return []
    }

    return data.map(country => ({
      ...country,
      icon: getFlagCode(country)
    }))
  },
  { default: () => [] }
)

const initialState = {
  event_id: `${edId}-Country`
}

const state = ref<Partial<CountryEntryType>>({ ...initialState })

watch(
  () => state.value.country_id,
  () => {
    if (state.value.country_id) {
      state.value.id = `${state.value.event_id} ${state.value.country_id}`
    }
  }
)

const handleReset = () => set(state, { ...initialState })

const onError = (event: FormErrorEvent) => console.error(event.errors)

const onSubmit = async (event: FormSubmitEvent<CountryEntryType>) => {
  set(isUploading, true)

  const { error } = await supabase.from("entries").insert(event.data)

  if (error) {
    errors.value = error
    set(isUploading, false)
    return
  }

  toast.add({
    title: `${event.data.id} successfully created!`,
    description: JSON.stringify(event.data),
    icon: icons.success,
    color: "success"
  })

  emit("refresh")
  handleReset()
  set(isUploading, false)
  set(isOpen, false)
}

const formFields = computed<FormFieldInterface<CountryEntryType>[]>(() => [
  {
    label: "Country",
    key: "country_id",
    type: "inputMenu",
    required: true,
    valueKey: "id",
    icon: ICONS.globe,
    loading: pending.value,
    items: countries.value,
    labelKey: "name"
  },
  { label: "Seed", key: "seed", type: "number" }
])
</script>

<template>
  <u-modal
    title="Create Country Entry"
    v-model:open="isOpen"
  >
    <u-button
      :icon="ICONS.globe"
      color="warning"
    />

    <template #body>
      <u-form
        id="entry-form"
        :schema="CountryEntrySchema"
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

      <u-alert
        v-if="errors"
        color="error"
        :title="`Error saving ${state.id}`"
        class="mt-5"
      >
        <template #description>
          {{ errors }}
        </template>
      </u-alert>
    </template>

    <template #footer="{ close }">
      <form-footer
        form="entry-form"
        :is-uploading
        @reset="handleReset"
        @close="close"
      />
    </template>
  </u-modal>
</template>
