<script setup lang="ts">
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"

const {
  params: { id, year, edId }
} = useRoute("edition")
const {
  ui: { icons }
} = useAppConfig()
const toast = useToast()
const tournamentStore = useTournamentStore()

const open = ref(false)
const scraping = ref(false)
const initialState = {
  tid: Number(id),
  year: Number(edId.replace(id, "")),
  year2: Number(year),
  type: "Singles" as MatchTypeEnumType
}

const state = ref<Partial<ScrapeFormInput>>({ ...initialState })

const handleReset = () => set(state, { ...initialState })

const onError = (event: FormErrorEvent) => console.error(event.errors)

const onSubmit = async (event: FormSubmitEvent<ScrapeFormSchema>) => {
  set(scraping, true)
  try {
    const response = await $fetch(`${FLASK_ROUTE}/atp_results`, {
      method: "POST",
      timeout: 120_000,
      "Content-Type": "application/json",
      body: JSON.stringify(event.data)
    })
    if ((response as any).success) {
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
      a.download = `${tournamentStore.name}_year_${event.data.year}_${event.data.type}.json`
      a.click()
      URL.revokeObjectURL(url)
      set(open, false)
    } else {
      toast.add({
        title: "Error scraping results",
        icon: icons.error,
        color: "error"
      })
    }
  } catch (e) {
    console.error(e)
    toast.add({
      title: "Error scraping results",
      icon: icons.error,
      color: "error"
    })
  } finally {
    set(scraping, false)
  }
}

const formFields: FormFieldInterface<ScrapeFormSchema>[] = [
  { label: "Site ID", key: "tid2", type: "text", subType: "number" },
  { label: "Match Type", key: "type", type: "radio", items: ["Singles", "Doubles"], required: true }
]
</script>

<template>
  <u-modal
    title="Scrape results"
    v-model:open="open"
  >
    <u-button
      :icon="ICONS.cards"
      color="Doubles"
    />

    <template #body>
      <u-form
        id="results-form"
        :schema="scrapeFormSchema"
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
        form="results-form"
        type="submit"
        label="Scrape"
        :icon="scraping ? ICONS.downloading : ICONS.download"
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
