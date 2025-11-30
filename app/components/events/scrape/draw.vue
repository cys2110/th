<script setup lang="ts">
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"

const {
  params: { tour, year, id, edId }
} = useRoute("event")
const {
  ui: { icons }
} = useAppConfig()
const toast = useToast()

const open = ref(false)
const scraping = ref(false)

const initialState = {
  tid: Number(id),
  year: Number(edId.replace(id, "")),
  year2: Number(year),
  type: "Singles" as MatchTypeEnumType,
  draw: "Main" as DrawEnumType
}

const state = ref<Partial<ScrapeFormInput>>({ ...initialState })

const formFields = computed<FormFieldInterface<ScrapeFormSchema>[]>(
  () =>
    [
      { label: "Site ID", key: "tid2", type: "text", subType: "number", class: "col-span-2" },
      ...(tour === "ATP" ? [{ label: "Draw Size", key: "draw_size", type: "number", required: true }] : []),
      ...(tour === "ATP" ? [{ label: "Match Type", key: "type", type: "radio", items: ["Singles", "Doubles"], required: true }] : []),
      ...(tour === "ATP" ? [{ label: "Draw", key: "draw", type: "radio", items: ["Main", "Qualifying"], required: true }] : []),
      ...(tour === "ATP"
        ? [
            {
              label: "Best of",
              key: "sets",
              type: "radio",
              items: [
                { label: "Best of 3", value: "BestOf3" },
                { label: "Best of 5", value: "BestOf5" }
              ]
            }
          ]
        : [])
    ] as FormFieldInterface<ScrapeFormSchema>[]
)

const handleReset = () => set(state, { ...initialState })

const onError = (event: FormErrorEvent) => console.error(event.errors)

const onSubmit = async (event: FormSubmitEvent<ScrapeFormSchema>) => {
  set(scraping, true)
  try {
    const response = await $fetch(`${FLASK_ROUTE}/${tour.toLowerCase()}_draw`, {
      method: "POST",
      timeout: 120_000,
      "Content-Type": "application/json",
      body: JSON.stringify(event.data)
    })
    if ((response as any).ok) {
      toast.add({
        title: "Draw scraped",
        icon: icons.success,
        color: "success"
      })
      set(open, false)
    } else {
      toast.add({
        title: "Error scraping draw",
        icon: icons.error,
        color: "error"
      })
    }
  } catch (e) {
    console.error(e)
    toast.add({
      title: "Error scraping draw",
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
    title="Scrape draw"
    v-model:open="open"
  >
    <u-button
      label="Scrape draws"
      :icon="scraping ? ICONS.downloading : ICONS.download"
      block
    />

    <template #body>
      <u-form
        id="draw-form"
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
        form="draw-form"
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
