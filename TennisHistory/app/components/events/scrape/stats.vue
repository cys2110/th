<script setup lang="ts">
import { type FormErrorEvent, type FormSubmitEvent } from "@nuxt/ui"

const { tour } = defineProps<{
  tour: keyof typeof tourEnum
}>()

const {
  params: { edId, year }
} = useRoute("edition")
const {
  ui: { icons }
} = useAppConfig()
const toast = useToast()

const open = ref(false)
const scraping = ref(false)

const initialState = {
  eid: Number(edId),
  year: Number(year),
  type: "Singles" as MatchTypeEnumType
}

const state = ref<Partial<ScrapeFormInput>>({ ...initialState })

const formFields = computed<FormFieldInterface<ScrapeFormSchema>[]>(
  () =>
    [
      ...(tour === "WTA" ? [{ label: "WTA ID", key: "wid", type: "text", subType: "number", required: true }] : []),
      { label: "Match Type", key: "type", type: "radio", items: ["Singles", "Doubles"], required: true },
      ...(tour === "WTA" ? [{ label: "Draw", key: "draw", type: "radio", items: ["Main", "Qualifying"], required: true }] : []),
      ...(tour === "WTA" ? [{ label: "Draw Range", key: "draw_range", type: "tags", max: 2, required: true }] : []),
      ...(tour === "WTA" ? [{ label: "Matches to Skip", key: "skip", type: "tags" }] : []),
      ...(tour === "ATP" ? [{ label: "Links", key: "links", type: "tags", class: "col-span-2", required: true }] : [])
    ] as FormFieldInterface<ScrapeFormSchema>[]
)

const handleReset = () => set(state, { ...initialState })

const onError = (event: FormErrorEvent) => console.error(event.errors)

const onSubmit = async (event: FormSubmitEvent<ScrapeFormSchema>) => {
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
      state.value.links = []
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
    <u-button :icon="ICONS.stats" />

    <template #body>
      <u-form
        id="matches-form"
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
