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
  match_type: "Singles" as MatchEnumType,
  year
}

const state = ref<Partial<ScrapeMatchesType>>({ ...initialState })

const handleReset = () => set(state, { ...initialState })

const onError = (event: FormErrorEvent) => console.error(event.errors)

const onSubmit = async (event: FormSubmitEvent<ScrapeMatchesType>) => {
  set(isScraping, true)

  const url = COUNTRY_DRAWS.includes(id) ? "atp/old-matches" : `${props.tour.toLowerCase()}/stats`

  try {
    await $fetch(`${FLASK_ROUTE}/${url}`, {
      method: "POST",
      timeout: 120_000,
      "Content-Type": "application/json",
      body: JSON.stringify(event.data)
    }).then((response: any) => {
      if (response.success) {
        toast.add({
          title: "Matches scraped",
          icon: icons.success,
          color: "success"
        })

        console.log(response.failed_links)

        set(isOpen, false)
      } else {
        toast.add({
          title: "Error scraping matches",
          icon: icons.error,
          color: "error"
        })
      }
    })
  } catch (e) {
    console.error(e)

    toast.add({
      title: "Error scraping matches",
      icon: icons.error,
      color: "error"
    })
  } finally {
    set(isScraping, false)
  }
}

const formFields = computed<FormFieldInterface<ScrapeMatchesType>[]>(() => {
  if (props.tour === "ATP" || COUNTRY_DRAWS.includes(id)) {
    return [{ label: "Links", key: "links", type: "tags", class: "col-span-2", required: true, icon: ICONS.group }]
  } else {
    return [
      { label: "Tournament ID", key: "tournament_id", type: "text", required: true, class: "col-span-2" },
      { label: "Match Type", key: "match_type", type: "radio", items: MATCH_TYPES, required: true },
      { label: "Draw", key: "draw", type: "radio", items: DRAW_TYPES, required: true },
      { label: "Draw Range", key: "draw_range", type: "tags", max: 2, required: true, icon: ICONS.people },
      { label: "Matches to Skip", key: "skip", type: "tags", icon: ICONS.trophyOff }
    ]
  }
  return []
})
</script>

<template>
  <u-modal
    title="Scrape matches"
    v-model:open="isOpen"
  >
    <u-button
      :icon="ICONS.stats"
      color="warning"
    />

    <template #body>
      <u-form
        id="matches-form"
        :schema="ScrapeMatchesSchema"
        :state
        @submit="onSubmit"
        @error="onError"
      >
        <div class="grid md:grid-cols-2 gap-3 items-center">
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
        form="matches-form"
        :is-uploading="isScraping"
        @reset="handleReset"
        @close="close"
      />
    </template>
  </u-modal>
</template>
