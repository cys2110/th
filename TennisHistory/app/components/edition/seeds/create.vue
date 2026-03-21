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

// Get events
const { data: events } = await useAsyncData("seed-events", async () => {
  const { data, error } = await supabase.from("events").select("id, tour").eq("edition_id", Number(edId))

  if (error) {
    console.error("Error fetching events:", error)
    return []
  }

  return data
})

// Get entry list
const { data: entries, pending } = await useAsyncData("seed-entries", async () => {
  const { data, error } = await supabase
    .from("entries")
    .select("id, player_entry_mapping(players(first_name, last_name)), events!inner(edition_id)")
    .eq("events.edition_id", Number(edId))

  if (error) {
    console.error("Error fetching entries:", error)
    return []
  }

  return data.map(entry => ({
    id: entry.id,
    label: entry.player_entry_mapping.map(pem => `${pem.players.first_name} ${pem.players.last_name}`).join(" / ")
  }))
})

const state = ref<Partial<SeedType>>({})

const handleReset = () => set(state, {})

const onError = (event: FormErrorEvent) => console.error(event.errors)

const onSubmit = async (event: FormSubmitEvent<SeedType>) => {
  set(isUploading, true)

  const { error } = await supabase.from("seeds").insert(event.data)

  if (error) {
    errors.value = error
    set(isUploading, false)
    return
  }

  toast.add({
    title: `${event.data.seed} successfully created!`,
    description: JSON.stringify(event.data),
    icon: icons.success,
    color: "success"
  })

  emit("refresh")

  handleReset()
  set(isOpen, false)
  set(isUploading, false)
}

const formFields = computed<FormFieldInterface<SeedType>[]>(() => [
  { label: "Tour", key: "event_id", type: "radio", items: events.value, required: true, valueKey: "id", labelKey: "tour" },
  { label: "Type", key: "match_type", type: "radio", items: MATCH_TYPES, required: true },
  { label: "Draw", key: "draw", type: "radio", items: DRAW_TYPES, required: true },
  {
    label: state.value.match_type === "Doubles" ? "Team" : "Plyer",
    key: "entry_id",
    type: "inputMenu",
    required: true,
    icon: ICONS.player,
    items: entries.value,
    loading: pending.value,
    placeholder: `Select ${state.value.match_type === "Doubles" ? "team" : "player"}`,
    valueKey: "id",
    labelKey: "label"
  },
  { label: "Seed", key: "seed", type: "number", required: true },
  { label: "Rank", key: "rank", type: "number" }
])
</script>

<template>
  <u-modal
    title="Create Seed"
    v-model:open="isOpen"
  >
    <u-button
      :icon="icons.plus"
      color="warning"
    />

    <template #body>
      <u-form
        id="seed-form"
        :schema="SeedSchema"
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
        form="seed-form"
        :is-uploading
        @reset="handleReset"
        @close="close"
      />
    </template>
  </u-modal>
</template>
