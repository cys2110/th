<script setup lang="ts">
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"

const {
  params: { year }
} = useRoute("event")
const {
  ui: { icons }
} = useAppConfig()
const toast = useToast()

const open = ref(false)
const scraping = ref(false)

defineShortcuts({
  meta_shift_r: () => set(open, !get(open))
})

const state = reactive<Partial<ScrapeInput>>({
  year: Number(year),
  type: "Singles"
})

const formFields: FormFieldInterface<ScrapeSchema>[] = [
  { label: "DB ID", key: "tid", type: "text", subType: "number", required: true },
  { label: "Site ID", key: "tid2", type: "text", subType: "number" },
  { label: "Year Slug", key: "year", type: "text", subType: "number", required: true },
  { label: "Year", key: "year2", type: "text", subType: "number" },
  { label: "Match Type", key: "type", type: "radio", items: ["Singles", "Doubles"], required: true }
]

const handleReset = () => {
  state.year = Number(year)
  state.type = "Singles"
}

const onError = (event: FormErrorEvent) => {
  toast.add({
    title: "Please ensure fields are filled out correctly",
    description: event.errors.map(e => e.message).join(", "),
    icon: icons.error,
    color: "error"
  })
}

const onSubmit = async (event: FormSubmitEvent<ScrapeSchema>) => {
  set(scraping, true)
  try {
    const response = await $fetch(`${FLASK_ROUTE}/atp_results`, {
      method: "POST",
      timeout: 120_000,
      "Content-Type": "application/json",
      body: JSON.stringify(event.data)
    })
    if ((response as any).ok) {
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
      a.download = "atp_results.json"
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
</script>

<template>
  <u-modal
    title="Scrape results"
    v-model:open="open"
  >
    <u-button
      label="Scrape results"
      :icon="scraping ? ICONS.downloading : ICONS.download"
      block
    />

    <template #body>
      <u-form
        id="results-form"
        :schema="scrapeSchema"
        :state
        @submit="onSubmit"
      >
        <div class="grid grid-cols-2 gap-5">
          <form-field
            v-for="field in formFields"
            :key="field.key"
            :field
            v-model="state[field.key]"
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
