<script setup lang="ts">
import { type FormErrorEvent, type FormSubmitEvent } from "@nuxt/ui"

const {
  params: { tour, edId, year }
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
  eid: Number(edId),
  type: "Singles",
  year: Number(year)
})

const formFields = computed<FormFieldInterface<ScrapeSchema>[]>(
  () =>
    [
      ...(tour === "WTA" ? [{ label: "WTA ID", key: "wid", type: "text", subType: "number" }] : []),
      { label: "Match Type", key: "type", type: "radio", items: ["Singles", "Doubles"] },
      ...(tour === "WTA" ? [{ label: "Draw", key: "draw", type: "radio", items: ["Main", "Qualifying"] }] : []),
      ...(tour === "WTA" ? [{ label: "Draw Range", key: "draw_range", type: "tags", max: 2 }] : []),
      ...(tour === "WTA" ? [{ label: "Matches to Skip", key: "skip", type: "tags" }] : []),
      ...(tour === "ATP" ? [{ label: "Links", key: "links", type: "tags", class: "col-span-2" }] : [])
    ] as FormFieldInterface<ScrapeSchema>[]
)

const cleanLink = (link: string) => link.replaceAll(/^[\s"'“”‘’\[\]]+|[\s"'“”‘’\[\]]+$/g, "")

const handleReset = () => {
  state.type = "Singles"
  state.links = []
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
  console.log(event.data)
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
      state.links = []
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

            <form-tags
              v-else-if="field.type === 'tags'"
              v-model="(state[field.key] as string[])"
              :placeholder="field.label"
              :class="field.class"
              :max="field.max"
              :convert-value="field.key === 'links' ? cleanLink : undefined"
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
