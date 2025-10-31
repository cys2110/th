<script setup lang="ts">
import { type FormErrorEvent, type FormSubmitEvent } from "@nuxt/ui"

const {
  params: { tour, edId }
} = useRoute("event")
const {
  ui: { icons }
} = useAppConfig()
const toast = useToast()

const open = ref(false)
const scraping = ref(false)

defineShortcuts({
  meta_shift_m: () => set(open, !get(open))
})

const state = reactive<Partial<ScrapeInput>>({
  eid: edId,
  type: "Singles"
})

const formFields = computed<FormFieldInterface<ScrapeSchema>[]>(
  () =>
    [
      { label: "Event ID", key: "eid", type: "text", subType: "number", required: true },
      ...(tour === "WTA" ? [{ label: "WTA ID", key: "wid", type: "text", subType: "number", required: true }] : []),
      ...(tour === "WTA" ? [{ label: "Year", key: "year", type: "text", subType: "number", required: true }] : []),
      { label: "Match Type", key: "type", type: "radio", items: ["Singles", "Doubles"], required: true },
      ...(tour === "WTA" ? [{ label: "Draw", key: "draw", type: "radio", items: ["Main", "Qualifying"], required: true }] : []),
      ...(tour === "WTA" ? [{ label: "Draw Range", key: "draw_range", type: "tags", max: 2, required: true }] : []),
      ...(tour === "WTA" ? [{ label: "Matches to Skip", key: "skip", type: "tags" }] : []),
      ...(tour === "ATP" ? [{ label: "Links", key: "links", type: "tags", class: "col-span-2" }] : [])
    ] as FormFieldInterface<ScrapeSchema>[]
)

const handleReset = () => {
  state.type = "Singles"
  state.links = []
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
    const response = await $fetch(`${FLASK_ROUTE}/${tour.toLowerCase()}_stats`, {
      method: "POST",
      timeout: 120_000,
      "Content-Type": "application/json",
      body: JSON.stringify(event.data)
    })
    if ((response as any).ok) {
      toast.add({
        title: "Matches scraped",
        icon: icons.success,
        color: "success"
      })
      handleReset()
      set(open, false)
    } else {
      toast.add({
        title: "Error scraping matches",
        icon: icons.error,
        color: "error"
      })
    }
  } catch (e) {
    console.error(e)
    toast.add({
      title: "Error scraping matches",
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
    title="Scrape matches"
    v-model:open="open"
  >
    <u-button
      label="Scrape matches"
      :icon="scraping ? ICONS.downloading : ICONS.download"
      block
    />

    <template #body>
      <u-form
        id="matches-form"
        :schema="scrapeSchema"
        :state
        @submit="onSubmit"
        @error="onError"
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
        form="matches-form"
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
