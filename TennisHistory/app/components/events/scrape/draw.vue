<script setup lang="ts">
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"

const props = defineProps<{
  tour: keyof typeof tourEnum
}>()

const {
  params: { year, id, edId }
} = useRoute("edition")
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

const state = ref<Partial<ScrapeFormInput>>(cloneDeep(initialState))

const handleReset = () => set(state, { ...initialState })

const onError = (event: FormErrorEvent) => console.error(event.errors)

const onSubmit = async (event: FormSubmitEvent<ScrapeFormSchema>) => {
  set(scraping, true)

  try {
    const response = await $fetch(`${FLASK_ROUTE}/${props.tour.toLowerCase()}_draw`, {
      method: "POST",
      timeout: 120_000,
      "Content-Type": "application/json",
      body: JSON.stringify(event.data)
    })
    if ((response as any).success) {
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

const formFields = computed<FormFieldInterface<ScrapeFormSchema>[]>(() => {
  if (props.tour === "ATP") {
    return [
      { label: "Site ID", key: "tid2", type: "text", subType: "number", class: "col-span-2" },
      { label: "Draw Size", key: "draw_size", type: "number", required: true },
      { label: "Match Type", key: "type", type: "radio", items: ["Singles", "Doubles"], required: true },
      { label: "Draw", key: "draw", type: "radio", items: ["Main", "Qualifying"], required: true },
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
  } else {
    return [{ label: "Site ID", key: "tid2", type: "text", subType: "number", class: "col-span-2" }]
  }
})
</script>

<template>
  <u-modal
    title="Scrape draw"
    v-model:open="open"
  >
    <u-button
      :icon="ICONS.draw"
      :ui="{ leadingIcon: 'rotate-270' }"
      color="Doubles"
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
