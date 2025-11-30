<script setup lang="ts">
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"

const {
  params: { year, id, edId, tour }
} = useRoute("event")
const {
  ui: { icons }
} = useAppConfig()
const toast = useToast()

const open = ref(false)
const scraping = ref(false)
const refreshCounter = defineModel<number>()

const initialState = {
  tid: Number(id),
  year: Number(edId.replace(id, "")),
  year2: Number(year),
  type: "Singles" as MatchTypeEnumType,
  players: []
}

const state = ref<Partial<ScrapeFormInput>>({ ...initialState })

const formFields: FormFieldInterface<ScrapeFormSchema>[] = [
  { label: "Site ID", key: "tid2", type: "text", subType: "number" },
  { label: "Match Type", key: "type", type: "radio", items: ["Singles", "Doubles"], required: true },
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
    class: "col-span-2"
  },
  {
    label: "Players",
    key: "players",
    type: "search",
    subType: "PlayerEntry",
    placeholder: "Players",
    required: true,
    multiple: true,
    class: "col-span-2",
    id: `${edId}-${tour}`,
    icon: ICONS.player
  }
]

const handleReset = () => set(state, { ...initialState })

const onError = (event: FormErrorEvent) => console.error(event.errors)

const onSubmit = async (event: FormSubmitEvent<ScrapeFormSchema>) => {
  set(scraping, true)
  try {
    const response = await $fetch(`${FLASK_ROUTE}/atp_activity`, {
      method: "POST",
      timeout: 120_000,
      "Content-Type": "application/json",
      body: JSON.stringify(event.data)
    })
    if ((response as any).ok) {
      toast.add({
        title: "Activity scraped",
        icon: icons.success,
        color: "success"
      })
      set(open, false)
      state.value.players = []
      if (refreshCounter.value !== undefined) {
        refreshCounter.value++
      }
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
    set(scraping, false)
  }
}
</script>

<template>
  <u-modal
    title="Scrape activity"
    v-model:open="open"
  >
    <u-button :icon="scraping ? ICONS.downloading : ICONS.download" />

    <template #body>
      <u-form
        id="activity-form"
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
        form="activity-form"
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
