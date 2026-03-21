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

const { results, loading, searchTerm } = usePlayerSearch()
const selectedPlayer = ref<{ id: string; label: string }>()

const isOpen = ref(false)
const isUploading = ref(false)
const errors = ref()

const eventId = computed(() => `${edId}-Country`)

const { data: countries, pending } = await useAsyncData(
  "country-entry",
  async () => {
    const { data, error } = await supabase
      .from("entries")
      .select("id, country:countries(*)")
      .eq("event_id", eventId.value)
      .not("country_id", "is", null)

    if (error || !data) {
      console.error("Error fetching country entries:", error)
      return []
    }

    return data.map(entry => ({
      ...entry,
      name: entry.country?.name,
      icon: getFlagCode(entry.country!)
    }))
  },
  { default: () => [] }
)

const state = ref<Partial<PlayerCountryEntryType>>({})

watch(selectedPlayer, newPlayer => {
  state.value.player_id = newPlayer?.id
})

const handleReset = () => {
  set(state, {})
  set(selectedPlayer, undefined)
}

const onError = (event: FormErrorEvent) => console.error(event.errors)

const onSubmit = async (event: FormSubmitEvent<PlayerCountryEntryType>) => {
  set(isUploading, true)

  const { error } = await supabase.from("player_entry_mapping").insert(event.data)

  if (error) {
    errors.value = error
    set(isUploading, false)
    return
  }

  toast.add({
    title: `${event.data.player_id} entry successfully created!`,
    description: JSON.stringify(event.data),
    icon: icons.success,
    color: "success"
  })

  emit("refresh")
  handleReset()
  set(isUploading, false)
  set(isOpen, false)
}

const formFields = computed<FormFieldInterface<PlayerCountryEntryType>[]>(() => [
  {
    label: "Country",
    key: "entry_id",
    type: "inputMenu",
    required: true,
    valueKey: "id",
    labelKey: "name",
    loading: pending.value,
    items: countries.value
  },
  {
    label: "Player",
    key: "player_id",
    type: "slot",
    required: true
  },
  {
    label: "Singles Rank",
    key: "rank",
    type: "number"
  },
  {
    label: "Doubles Rank",
    key: "doubles_rank",
    type: "number"
  }
])
</script>

<template>
  <u-modal
    title="Create Country Player Entry"
    v-model:open="isOpen"
  >
    <u-button
      :icon="ICONS.player"
      color="warning"
    />

    <template #body>
      <u-form
        id="player-entry-form"
        :schema="PlayerCountryEntrySchema"
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
          >
            <u-select-menu
              v-model="selectedPlayer"
              :items="results"
              placeholder="Select player"
              :icon="ICONS.player"
              :loading
              clear
              v-model:search-term="searchTerm"
            />
          </form-field>
        </div>
      </u-form>

      <u-alert
        v-if="errors"
        color="error"
        :title="`Error saving ${state.entry_id} ${state.player_id} entry`"
        class="mt-5"
      >
        <template #description>
          {{ errors }}
        </template>
      </u-alert>
    </template>

    <template #footer="{ close }">
      <form-footer
        form="player-entry-form"
        :is-uploading
        @reset="handleReset"
        @close="close"
      />
    </template>
  </u-modal>
</template>
