<script setup lang="ts">
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"

const emit = defineEmits<{
  refresh: []
}>()

const {
  params: { year, id, edId }
} = useRoute("edition")

const {
  ui: { icons }
} = useAppConfig()

const toast = useToast()
const supabase = useSupabaseClient()

const isOpen = ref(false)
const isUploading = ref(false)
const errors = ref()

const { data: players, pending } = await useAsyncData("entries-individual-players", async () => {
  const { data, error } = await supabase
    .from("entries")
    .select("id, player_entry_mapping(players(id, first_name, last_name), countries(*)), events!inner(edition_id)")
    .eq("events.edition_id", Number(edId))

  if (error || !data) {
    console.error("Error fetching players:", error)
    return []
  }

  return data.flatMap(entry =>
    entry.player_entry_mapping.map(pem => ({
      entry_id: entry.id,
      player_id: pem.players.id,
      name: `${pem.players.first_name} ${pem.players.last_name}`,
      icon: getFlagCode(pem.countries!)
    }))
  )
})

const initialState = {
  tournament_id: id,
  year,
  type: "Singles" as MatchEnumType,
  players: []
}

const state = ref<Partial<ScrapeActivityType>>({ ...initialState })

const handleReset = () => {
  set(state, { ...initialState })
}

const onError = (event: FormErrorEvent) => console.error(event.errors)

const onSubmit = async (event: FormSubmitEvent<ScrapeActivityType>) => {
  set(isUploading, true)
  try {
    const response = await $fetch(`${FLASK_ROUTE}/atp/activity`, {
      method: "POST",
      timeout: 120_000,
      "Content-Type": "application/json",
      body: JSON.stringify(event.data)
    })

    if ((response as any).success) {
      toast.add({
        title: "Activity scraped",
        icon: icons.success,
        color: "success"
      })

      set(isOpen, false)
      state.value.players = []
      emit("refresh")
    } else {
      toast.add({
        title: "Error scraping activity",
        icon: icons.error,
        color: "error"
      })
    }
  } catch (e) {
    console.error(e)
    toast.add({
      title: "Error scraping activity",
      icon: icons.error,
      color: "error"
    })
  } finally {
    set(isUploading, false)
  }
}

const formFields: FormFieldInterface<ScrapeActivityType>[] = [
  { label: "Tournament ID", key: "tournament_id", type: "text" },
  { label: "Match Type", key: "match_type", type: "radio", items: MATCH_TYPES, required: true },
  {
    label: "Category",
    key: "category",
    type: "inputMenu",
    items: [
      { value: "WC", label: "ATP Finals" },
      { value: "GS", label: "Grand Slam" },
      { value: "1000", label: "ATP Masters 1000" },
      { value: "500", label: "ATP 500" },
      { value: "250", label: "ATP 250" },
      { value: "CH", label: "Challenger" },
      { value: "FU", label: "Futures" }
    ],
    required: true,
    class: "col-span-2",
    valueKey: "value"
  },
  {
    label: "Players",
    key: "players",
    type: "inputMenu",
    items: players.value,
    loading: pending.value,
    class: "col-span-2",
    required: true,
    labelKey: "name"
  }
]
</script>

<template>
  <u-modal
    title="Scrape activity"
    v-model:open="isOpen"
  >
    <u-button
      :icon="isUploading ? ICONS.downloading : ICONS.download"
      color="warning"
    />

    <template #body>
      <u-form
        id="activity-form"
        :schema="ScrapeActivitySchema"
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
        :title="`Error saving entry`"
        class="mt-5"
      >
        <template #description>
          {{ errors }}
        </template>
      </u-alert>
    </template>

    <template #footer="{ close }">
      <form-footer
        form="activity-form"
        :is-uploading
        @reset="handleReset"
        @close="close"
      />
    </template>
  </u-modal>
</template>
