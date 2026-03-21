<script setup lang="ts">
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"

const props = defineProps<{
  event_id: string
}>()

const {
  params: { id, year, edId }
} = useRoute("edition")

const {
  ui: { icons }
} = useAppConfig()

const toast = useToast()

const isOpen = ref(false)
const isScraping = ref(false)

const tournamentStore = useTournamentStore()

const initialState = {
  tournament_id: id,
  event_id: props.event_id,
  year,
  match_type: "Singles" as MatchEnumType
}

const state = ref<Partial<ScrapeResultsType>>({ ...initialState })

const handleReset = () => set(state, { ...initialState })

const onError = (event: FormErrorEvent) => console.error(event.errors)

const onSubmit = async (event: FormSubmitEvent<ScrapeResultsType>) => {
  set(isScraping, true)

  try {
    await $fetch(`${FLASK_ROUTE}/atp/results`, {
      method: "POST",
      timeout: 120_000,
      "Content-Type": "application/json",
      body: JSON.stringify(event.data)
    }).then((response: any) => {
      if (response.success) {
        toast.add({
          title: "Results scraped",
          icon: icons.success,
          color: "success"
        })

        const blob = new Blob([JSON.stringify(response, null, 2)], {
          type: "application/json"
        })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `${tournamentStore.name}_year_${event.data.year}_${event.data.match_type}.json`
        a.click()
        URL.revokeObjectURL(url)

        set(isOpen, false)
      } else {
        toast.add({
          title: "Error scraping results",
          icon: icons.error,
          color: "error"
        })
      }
    })
  } catch (e) {
    console.error(e)

    toast.add({
      title: "Error scraping results",
      icon: icons.error,
      color: "error"
    })
  } finally {
    set(isScraping, false)
  }
}

const formFields: FormFieldInterface<ScrapeResultsType>[] = [
  { label: "Tournament ID", key: "tournament_id", type: "text", required: true },
  { label: "Match Type", key: "match_type", type: "radio", items: MATCH_TYPES, required: true }
]
</script>

<template>
  <u-modal
    title="Scrape results"
    v-model:open="isOpen"
  >
    <u-button
      :icon="ICONS.cards"
      color="warning"
    />

    <template #body>
      <u-form
        id="results-form"
        :schema="ScrapeResultsSchema"
        :state
        @submit="onSubmit"
        @error="onError"
      >
        <div class="grid md:grid-cols-2 gap-3 items-center">
          <form-field
            v-for="field in formFields"
            :key="field.label"
            :field
            v-model="state"
          />
        </div>
      </u-form>
    </template>

    <template #footer="{ close }">
      <form-footer
        form="results-form"
        :is-uploading="isScraping"
        @reset="handleReset"
        @close="close"
      />
    </template>
  </u-modal>
</template>
