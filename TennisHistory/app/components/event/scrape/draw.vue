<script setup lang="ts">
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"

const props = defineProps<{
  tour: TourType
  event_id: string
}>()

const {
  params: { id, year }
} = useRoute("edition")

const {
  ui: { icons }
} = useAppConfig()

const toast = useToast()

const isOpen = ref(false)
const isScraping = ref(false)

const initialState = {
  event_id: props.event_id,
  tournament_id: id,
  year,
  match_type: "Singles" as MatchEnumType,
  draw: "Main" as DrawType,
  format: 3 as 3 | 5
}

const state = ref<Partial<ScrapeDrawType>>({ ...initialState })

const handleReset = () => set(state, { ...initialState })

const onError = (event: FormErrorEvent) => console.error(event.errors)

const onSubmit = async (event: FormSubmitEvent<ScrapeDrawType>) => {
  set(isScraping, true)

  try {
    await $fetch(`${FLASK_ROUTE}/${props.tour.toLowerCase()}/draws`, {
      method: "POST",
      timeout: 120_000,
      "Content-Type": "application/json",
      body: JSON.stringify(event.data)
    }).then((response: any) => {
      if (response.success) {
        toast.add({
          title: "Draw scraped",
          icon: icons.success,
          color: "success"
        })

        set(isOpen, false)
      } else {
        toast.add({
          title: "Error scraping draw",
          icon: icons.error,
          color: "error"
        })
      }
    })
  } catch (e) {
    console.error(e)

    toast.add({
      title: "Error scraping draw",
      icon: icons.error,
      color: "error"
    })
  } finally {
    set(isScraping, false)
  }
}

const formFields = computed<FormFieldInterface<ScrapeDrawType>[]>(() => {
  if (props.tour === "ATP") {
    return [
      { label: "Tournament ID", key: "tournament_id", type: "text", required: true },
      { label: "Draw Size", key: "draw_size", type: "number", required: true },
      { label: "Match Type", key: "match_type", type: "radio", items: MATCH_TYPES, required: true },
      { label: "Draw", key: "draw", type: "radio", items: DRAW_TYPES, required: true },
      {
        label: "Format",
        key: "format",
        type: "radio",
        items: [
          { label: "Best of 3", value: 3 },
          { label: "Best of 5", value: 5 }
        ]
      }
    ]
  } else {
    return [{ label: "Tournament ID", key: "tournament_id", type: "text", class: "col-span-2" }]
  }
})
</script>

<template>
  <u-modal
    title="Scrape draw"
    v-model:open="isOpen"
  >
    <u-button
      :icon="ICONS.draw"
      :ui="{ leadingIcon: 'rotate-270' }"
      color="warning"
    />

    <template #body>
      <u-form
        id="draw-form"
        :schema="ScrapeDrawSchema"
        :state
        @submit="onSubmit"
        @error="onError"
      >
        <div class="grid grid-cols-2 items-center gap-3">
          <form-field
            v-for="field in formFields"
            :key="field.label"
            :field
            v-model="state"
          />
        </div>
      </u-form>
    </template>

    <template #footer="{ close }">
      <form-footer
        form="draw-form"
        :is-uploading="isScraping"
        @reset="handleReset"
        @close="close"
      />
    </template>
  </u-modal>
</template>
