<script setup lang="ts">
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"

const {
  params: { year, id, edId }
} = useRoute("event")
const {
  ui: { icons }
} = useAppConfig()
const toast = useToast()

const open = ref(false)
const scraping = ref(false)
const refreshCounter = defineModel<number>()

defineShortcuts({
  meta_shift_d: () => set(open, !get(open))
})

const state = reactive<Partial<ScrapeInput>>({
  tid: Number(id),
  year: Number(edId.replace(id, "")),
  year2: Number(year),
  type: "Singles"
})

const formFields: FormFieldInterface<ScrapeSchema>[] = [
  { label: "Site ID", key: "tid2", type: "text", subType: "number" },
  { label: "Match Type", key: "type", type: "radio", items: ["Singles", "Doubles"] },
  {
    label: "Category",
    key: "category",
    type: "inputMenu",
    items: [
      { value: "GS", label: "Grand Slam" },
      { value: "1000", label: "ATP Masters 1000" },
      { value: "500", label: "ATP 500" },
      { value: "250", label: "ATP 250" },
      { value: "CH", label: "Challenger" },
      { value: "FU", label: "Futures" }
    ]
  }
]

const handleReset = () => {
  state.type = "Singles"
}

const onError = (event: FormErrorEvent) => {
  console.error(event.errors)
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
      state.players = []
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
        :schema="scrapeSchema"
        :state
        @submit="onSubmit"
        @error="onError"
      >
        <div class="grid grid-cols-2 items-center gap-5">
          <template
            v-for="field in formFields"
            :key="field.label"
          >
            <form-input
              v-if="field.type === 'text'"
              v-model="(state[field.key] as any)"
              :placeholder="field.label"
              :type="field.subType"
              :class="field.class"
            />

            <form-select-menu
              v-else-if="field.type === 'inputMenu'"
              v-model="(state[field.key] as any[])"
              :items="(field.items as any[])"
              :placeholder="field.label"
              block
              class="col-span-2"
            />

            <u-radio-group
              v-else
              :legend="field.label"
              v-model="(state[field.key] as string)"
              :items="field.items"
              orientation="horizontal"
            />
          </template>

          <form-select-search
            v-model="state['players']"
            type="events/entries/players"
            placeholder="Players"
            block
            multiple
            class="col-span-2"
            :id="edId"
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
