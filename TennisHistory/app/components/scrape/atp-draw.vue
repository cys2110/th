<script setup lang="ts">
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"
import { literal, number, object, string, z } from "zod"

const schema = object({
  tournament_id: string(),
  draw_size: number("Draw size must be a number").int("Draw size must be an integer").positive("Draw size much be positive"),
  match_type: MatchTypeEnum,
  draw: DrawEnum,
  format: literal([3, 5])
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

const state = ref<Partial<Schema>>({
  tournament_id: id
})

const handleReset = () => {
  set(state, {})
}

const onError = (event: FormErrorEvent) => {
  console.error(event.errors)
}

const onSubmit = async (event: FormSubmitEvent<Schema>) => {
  set(isScraping, true)

  await $fetch(`${FLASK_ROUTE}/atp/draws`, {
    method: "POST",
    timeout: 120_000,
    "Content-Type": "application/json",
    body: JSON.stringify({
      ...event.data,
      event_id: `${edId}-ATP`,
      year
    })
  })
    .then((response: any) => {
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
    .catch(e => {
      console.error(e)
    })
    .finally(() => {
      set(isScraping, false)
    })
}

const formFields: Array<FormFieldInterface<Schema>> = [
  { label: "Tournament ID", key: "tournament_id", type: "text", required: true, class: "col-span-2" },
  { label: "S/D", key: "match_type", type: "radio", items: MATCH_TYPES, required: true },
  { label: "Draw", key: "draw", type: "radio", items: DRAW_TYPES, required: true },
  {
    label: "Format",
    key: "format",
    type: "radio",
    items: [
      { label: "Best of 3", value: 3 },
      { label: "Best of 5", value: 5 }
    ]
  },
  { label: "Draw Size", key: "draw_size", type: "number", required: true }
]
</script>

<template>
  <u-modal
    title="Scrape Draw"
    v-model:open="isOpen"
  >
    <u-button
      :icon="ICONS.draw"
      :ui="{ leadingIcon: 'rotate-270' }"
    />

    <template #body>
      <u-form
        id="draw-form"
        :schema
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
