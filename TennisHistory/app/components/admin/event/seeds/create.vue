<script setup lang="ts">
import { ICONS, MATCH_TYPES, prettifyJson, seedSchema } from "#imports"
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"

const selectedEvent = defineModel<EventSelection>({ default: () => ({}) })
const emit = defineEmits<{ created: [] }>()

const supabase = useSupabaseClient()
const { ui } = useAppConfig()

const initialState = {
  entry: undefined,
  seed: undefined,
  draw: undefined,
  match_type: undefined,
  rank: undefined
}

const state = ref<Partial<SeedSchema>>({ ...initialState })
const isUploading = ref(false)
const response = ref()
const errors = ref<Array<{ type: string; details: any }>>([])

const handleReset = () => {
  set(state, { ...initialState })
  set(response, null)
  set(errors, [])
}

const onError = (event: FormErrorEvent) => {
  errors.value.push({
    type: "Validation",
    details: event.errors
  })
}

const { entries, pending, fetchEntries } = useEntryList(
  () => selectedEvent.value.tournament?.id,
  () => selectedEvent.value.edition?.year,
  () => selectedEvent.value.edition?.edition_no
)

const onSubmit = async (event: FormSubmitEvent<SeedSchema>) => {
  set(isUploading, true)

  try {
    const { entry, ...rest } = event.data

    const { data, error } = await supabase
      .schema("tennis")
      .from("seeds")
      .insert({
        ...rest,
        event_id: entry.event_id,
        entry_id: entry.entry_id
      })
      .select("*")

    if (error || !data) {
      console.error(error)
      errors.value.push({
        type: "Error creating seed",
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
</script>

<template>
  <div class="grid grid-cols-3 gap-6 items-start">
    <u-card class="col-span-2">
      <template #header>
        <div class="font-semibold">Create Seed</div>
      </template>

      <u-form
        id="seed-form"
        :schema="seedSchema"
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
            label: 'Draw',
            key: 'draw',
            type: 'radio',
            items: ['Main', 'Qualifying'],
            required: true
          }"
        />

        <form-field
          v-model="state"
          :field="{
            label: 'Seed',
            key: 'seed',
            type: 'number',
            required: true
          }"
        />

        <form-field
          v-model="state"
          :field="{
            label: 'Rank',
            key: 'rank',
            type: 'number'
          }"
        />

        <u-form-field
          name="entry"
          :label="state.match_type === 'Doubles' ? 'Team' : 'Player'"
          required
          class="col-span-4"
        >
          <u-input-menu
            v-model="<any>state.entry"
            :items="
              entries.filter(entry => {
                const isMatchTypeMatch = !state.match_type || state.match_type === entry.match_type
                const isEventMatch = selectedEvent.event?.id === entry.event_id
                return isMatchTypeMatch && isEventMatch
              })
            "
            :placeholder="`Select ${state.match_type === 'Doubles' ? 'Team' : 'Player'}`"
            :loading="pending"
            label-key="players"
            clear
            class="w-full"
          >
            <template #content-bottom>
              <u-button
                :icon="ui.icons.reload"
                label="Refresh"
                block
                @click="fetchEntries"
              />
            </template>
          </u-input-menu>
        </u-form-field>
      </u-form>

      <template #footer>
        <div class="flex gap-3">
          <u-button
            form="seed-form"
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
