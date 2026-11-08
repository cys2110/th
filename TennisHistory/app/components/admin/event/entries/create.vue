<script setup lang="ts">
import { entrySchema, ICONS, MATCH_TYPES, prettifyJson } from "#imports"
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"

const selectedEvent = defineModel<EventSelection>({ default: () => ({}) })
const emit = defineEmits<{ created: [] }>()

const supabase = useSupabaseClient()
const { ui } = useAppConfig()

const initialState = {
  match_type: undefined,
  player: undefined,
  rank: undefined,
  points: undefined,
  pm: undefined,
  teammate: undefined,
  teammate_rank: undefined
}

const state = ref<Partial<EntrySchema>>({ ...initialState })
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

const onSubmit = async (event: FormSubmitEvent<EntrySchema>) => {
  set(isUploading, true)

  try {
    const entryKey = [event.data.player.id, event.data.teammate?.id].filter(Boolean).join("-")

    const { data, error } = await supabase
      .schema("tennis")
      .from("entries")
      .insert({
        points: event.data.points,
        pm: event.data.pm,
        match_type: event.data.match_type,
        event_id: selectedEvent.value.event?.id,
        entry_key: entryKey
      })
      .select("id")

    if (error || !data) {
      console.error(error)
      errors.value.push({
        type: "Error creating entry",
        details: error
      })
      return
    }

    const { data: pemData, error: playerMappingError } = await supabase
      .schema("tennis")
      .from("player_entry_mapping")
      .insert([
        {
          player_id: event.data.player.id,
          entry_id: data[0]!.id,
          rank: event.data.rank,
          player_order: 1
        },
        ...(event.data.match_type === "Doubles" && event.data.teammate?.id ?
          [
            {
              player_id: event.data.teammate.id,
              entry_id: data[0]!.id,
              rank: event.data.teammate_rank,
              player_order: 2
            }
          ]
        : [])
      ])
      .select("*, entry:entries(*)")

    if (playerMappingError) {
      errors.value.push({
        type: "Error creating player entry mapping",
        details: playerMappingError
      })
      return
    }

    set(response, pemData)
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
        <div class="font-semibold">Create Entry</div>
      </template>

      <u-form
        id="entry-form"
        :schema="entrySchema"
        :state
        @submit="onSubmit"
        @error="onError"
        class="space-y-3"
      >
        <div class="grid grid-cols-3 gap-y-3 gap-x-6">
          <form-field
            v-model="state"
            :field="{
              label: 'Match Type',
              key: 'match_type',
              type: 'radio',
              items: MATCH_TYPES,
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
        </div>

        <div
          class="grid gap-x-6 gap-y-6"
          :class="state.match_type === 'Doubles' ? 'grid-cols-4' : 'grid-cols-2'"
        >
          <form-field
            v-model="state"
            :field="{
              label: state.match_type === 'Doubles' ? 'Player 1' : 'Player',
              key: 'player',
              type: 'player',
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

          <template v-if="state.match_type === 'Doubles'">
            <form-field
              v-model="state"
              :field="{
                label: 'Player 2',
                key: 'teammate',
                type: 'player',
                required: true
              }"
            />

            <form-field
              v-model="state"
              :field="{
                label: 'Rank',
                key: 'teammate_rank',
                type: 'number'
              }"
            />
          </template>
        </div>
      </u-form>

      <template #footer>
        <div class="flex gap-3">
          <u-button
            form="entry-form"
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
