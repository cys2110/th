<script setup lang="ts">
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"
import { object, string, z } from "zod"

const schema = object({
  category: string(),
  tournament_id: string()
})
type Schema = z.infer<typeof schema>

const props = defineProps<{ matchType: MatchEnumType; players: Array<{ id: string; entry_id: string }>; disabled?: boolean }>()

const emits = defineEmits<{ refresh: [] }>()

const {
  params: { year, id }
} = useRoute("edition")

const {
  ui: { icons }
} = useAppConfig()

const toast = useToast()

const isOpen = ref(false)
const isUploading = ref(false)
const errors = ref()

const state = ref<Partial<Schema>>({ tournament_id: id })

const handleReset = () => {
  set(state, { tournament_id: id })
  set(errors, undefined)
}

const onError = (event: FormErrorEvent) => {
  set(errors, event.errors)
}

const onSubmit = async (event: FormSubmitEvent<Schema>) => {
  set(isUploading, true)
  try {
    const response = await $fetch(`${FLASK_ROUTE}/atp/activity`, {
      method: "POST",
      timeout: 240_000,
      "Content-Type": "application/json",
      body: JSON.stringify({
        ...event.data,
        match_type: props.matchType,
        year,
        players: props.players
      })
    })

    if ((response as any).success) {
      toast.add({
        title: "Activity scraped",
        icon: icons.success,
        color: "success"
      })

      set(isOpen, false)
      emits("refresh")
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
    set(isUploading, false)
  }
}

const formFields: Array<FormFieldInterface<Schema>> = [
  { label: "Tournament ID", key: "tournament_id", type: "text" },
  {
    label: "Category",
    key: "category",
    type: "inputMenu",
    items: [
      { value: "WC", label: "ATP Finals" },
      { value: "GS", label: "Grand Slam" },
      { value: "1000", label: "ATP Masters 1000" },
      { value: "500", label: "ATP 500" },
      { value: "250", label: "ATP 250" },
      { value: "CH", label: "Challenger" },
      { value: "FU", label: "Futures" }
    ],
    required: true,
    valueKey: "value"
  }
]
</script>

<template>
  <u-modal
    title="Scrape activity"
    v-model:open="isOpen"
  >
    <u-button
      :icon="isUploading ? ICONS.downloading : ICONS.download"
      :disabled
    />

    <template #body>
      <u-form
        id="activity-form"
        :schema
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

      <u-alert
        v-if="errors"
        color="error"
        :title="`Error saving entry`"
        :description="errors"
        class="mt-5"
      />
    </template>

    <template #footer="{ close }">
      <form-footer
        form="activity-form"
        :loading="isUploading"
        @reset="handleReset"
        @close="close"
      />
    </template>
  </u-modal>
</template>
