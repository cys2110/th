<script setup lang="ts">
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"
import { array, coerce, object, string, z } from "zod"

const schema = object({
  tournament_id: string(),
  draw: DrawEnum,
  match_type: MatchTypeEnum,
  draw_range: array(coerce.number()).length(2, "Draw range must have a start and end value").default([]),
  skip: array(coerce.number()).default([])
})
type Schema = z.infer<typeof schema>

const {
  params: { id, year, edId }
} = useRoute("edition")

const {
  ui: { icons }
} = useAppConfig()

const toast = useToast()

const isOpen = ref(false)
const isScraping = ref(false)

const state = ref<Partial<Schema>>({})

const handleReset = () => set(state, {})

const onError = (event: FormErrorEvent) => console.error(event.errors)

const onSubmit = async (event: FormSubmitEvent<Schema>) => {
  set(isScraping, true)

  await $fetch(`${FLASK_ROUTE}/wta/stats`, {
    method: "POST",
    timeout: 120_000,
    "Content-Type": "application/json",
    body: JSON.stringify({
      ...event.data,
      event_id: `${edId}-WTA`,
      year
    })
  })
    .then((response: any) => {
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
    .catch(e => console.error(e))
    .finally(() => set(isScraping, false))
}

const formFields: Array<FormFieldInterface<Schema>> = [
  { label: "Tournament ID", key: "tournament_id", type: "text", required: true, class: "col-span-2" },
  { label: "Match Type", key: "match_type", type: "radio", items: MATCH_TYPES, required: true },
  { label: "Draw", key: "draw", type: "radio", items: DRAW_TYPES, required: true },
  { label: "Draw Range", key: "draw_range", type: "tags", max: 2, required: true, icon: ICONS.people },
  { label: "Matches to Skip", key: "skip", type: "tags", icon: ICONS.trophyOff }
]
</script>

<template>
  <u-modal
    title="Scrape Matches"
    v-model:open="isOpen"
  >
    <u-button :icon="ICONS.stats" />

    <template #body>
      <u-form
        id="matches-form"
        :schema
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
        :loading="isScraping"
        label="Scrape"
        :icon="ICONS.download"
        :loading-icon="ICONS.downloading"
        @reset="handleReset"
        @close="close"
      />
    </template>
  </u-modal>
</template>
