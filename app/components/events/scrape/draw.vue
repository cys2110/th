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

defineShortcuts({
  meta_shift_d: () => set(open, !get(open))
})

const state = reactive<Partial<ScrapeInput>>({
  tid: Number(id),
  year: Number(edId.replace(id, "")),
  year2: Number(year),
  type: "Singles",
  draw: "Main"
})

const formFields = computed<FormFieldInterface<ScrapeSchema>[]>(
  () =>
    [
      { label: "Site ID", key: "tid2", type: "text", subType: "number", class: "col-span-2" },
      ...(tour === "ATP" ? [{ label: "Draw Size", key: "draw_size", type: "number" }] : []),
      ...(tour === "ATP" ? [{ label: "Match Type", key: "type", type: "radio", items: ["Singles", "Doubles"] }] : []),
      ...(tour === "ATP" ? [{ label: "Draw", key: "draw", type: "radio", items: ["Main", "Qualifying"] }] : []),
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
    ] as FormFieldInterface<ScrapeSchema>[]
)

const handleReset = () => {
  state.type = "Singles"
  state.draw = "Main"
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

            <form-input-number
              v-else-if="field.type === 'number'"
              v-model="(state[field.key] as number)"
              :placeholder="field.label"
            />

            <u-radio-group
              v-else
              :legend="field.label"
              v-model="(state[field.key] as string)"
              :items="field.items"
              orientation="horizontal"
            />
          </template>
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
