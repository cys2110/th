<script setup lang="ts">
import { ICONS, MATCH_TYPES, prettifyJson, ROUNDS, roundSchema } from "#imports"
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"

const selectedEvent = defineModel<EventSelection>({ default: () => ({}) })
const emit = defineEmits<{ created: [] }>()

const supabase = useSupabaseClient()
const toast = useToast()
const { ui } = useAppConfig()

const initialState = {
  round: undefined,
  tour: undefined,
  match_type: undefined,
  points: undefined,
  pm: undefined,
  pm_tiered: []
}

const state = ref<Partial<RoundInput>>({ ...initialState })
const isUploading = ref(false)
const response = ref()
const errors = ref<Array<{ type: string; details: any }>>([])

const handleReset = () => {
  set(state, { ...initialState, pm_tiered: [] })
  set(response, null)
  set(errors, [])
}

const onError = (event: FormErrorEvent) => {
  errors.value.push({
    type: "Validation",
    details: event.errors
  })
}

const onSubmit = async (event: FormSubmitEvent<RoundSchema>) => {
  set(isUploading, true)

  try {
    const isQualifyingRound = event.data.round.includes("Qualifying") || event.data.round === "Qualifier"

    const { data, error } = await supabase
      .schema("tennis")
      .from("rounds")
      .insert({
        ...event.data,
        tour: selectedEvent.value.event?.tour,
        draw: isQualifyingRound ? "Qualifying" : "Main",
        pm_tiered: event.data.pm_tiered.map(pm => parseCurrency(pm)),
        // @ts-expect-error
        number: ROUND_NUMBER_MAPPING[event.data.round as keyof typeof ROUND_NUMBER_MAPPING],
        event_id: selectedEvent.value.event?.id
      })
      .select("*")

    if (error || !data) {
      console.error(error)
      errors.value.push({
        type: "Error creating round",
        details: error
      })
      return
    }

    set(response, data[0])
    emit("created")
  } finally {
    set(isUploading, false)
  }
}

const parseCurrency = (value: string) => {
  return Number(value.replace(/[^0-9.-]+/g, ""))
}

const formatTieredPm = (pm: string) => {
  const numberPm = Number(pm)

  if (isNaN(numberPm)) {
    toast.add({
      title: "Prize money must be a number",
      icon: ui.icons.error,
      color: "error"
    })
  }

  return numberPm.toLocaleString("en-GB", {
    style: "currency",
    currency: selectedEvent.value?.event?.currency || selectedEvent.value?.edition?.currency || "USD"
  })
}
</script>

<template>
  <div class="grid grid-cols-3 gap-6 items-start">
    <u-card class="col-span-2">
      <template #header>
        <div class="font-semibold">Create Round</div>
      </template>

      <u-form
        id="round-form"
        :schema="roundSchema"
        :state
        @submit="onSubmit"
        @error="onError"
        class="grid grid-cols-4 gap-y-3 gap-x-6"
      >
        <form-field
          v-model="state"
          :field="{
            label: 'Match Type',
            key: 'match_type',
            type: 'radio',
            items: MATCH_TYPES
          }"
        />

        <form-field
          v-model="state"
          :field="{
            label: 'Round',
            key: 'round',
            type: 'inputMenu',
            items: ROUNDS,
            required: true
          }"
        />

        <form-field
          v-model="state"
          :field="{
            label: 'Points',
            key: 'points',
            type: 'number'
          }"
        />

        <form-field
          v-model="state"
          :field="{
            label: 'Prize Money',
            key: 'pm',
            type: 'number',
            currency: selectedEvent.edition?.currency || selectedEvent.event?.currency || 'USD'
          }"
        />

        <u-form-field
          name="pm_tiered"
          label="Tiered Prize Money"
          class="col-span-4"
        >
          <u-input-tags
            v-model="state.pm_tiered"
            placeholder="Tiered prize money"
            :convert-value="formatTieredPm"
            class="w-full"
          />
        </u-form-field>
      </u-form>

      <template #footer>
        <div class="flex gap-3">
          <u-button
            form="round-form"
            color="success"
            type="submit"
            label="Create"
            block
            :icon="ui.icons.plus"
            :loading="isUploading"
            :loading-icon="ICONS.uploading"
          />

          <u-button
            color="warning"
            label="Reset"
            block
            :icon="ui.icons.reload"
            @click="handleReset"
          />
        </div>
      </template>
    </u-card>

    <div class="space-y-6">
      <u-alert
        v-if="errors.length"
        v-for="(error, index) in errors"
        :key="index"
        color="error"
        variant="subtle"
        :title="error.type"
      >
        <template #description>
          {{ prettifyJson(error.details) }}
        </template>
      </u-alert>

      <u-page-card title="Request Body">
        <prose-code class="min-w-0 w-full overflow-x-auto">
          <pre
            class="overflow-x-auto"
            v-html="prettifyJson(state)"
          />
        </prose-code>
      </u-page-card>

      <u-page-card
        v-if="response"
        title="Response"
      >
        <prose-code class="min-w-0 w-full overflow-x-auto">
          <pre
            class="overflow-x-auto"
            v-html="prettifyJson(response)"
          />
        </prose-code>
      </u-page-card>
    </div>
  </div>
</template>
