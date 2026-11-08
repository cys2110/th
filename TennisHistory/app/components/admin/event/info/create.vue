<script setup lang="ts">
import { entryInfoSchema, ICONS, MATCH_TYPES, prettifyJson, STATUS_MAPPING } from "#imports"
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"

const selectedEvent = defineModel<EventSelection>({ default: () => ({}) })
const emit = defineEmits<{ created: [] }>()

const supabase = useSupabaseClient()
const { ui } = useAppConfig()

const initialState = {
  relationship: undefined,
  entry: undefined,
  draw: undefined,
  match_type: undefined,
  rank: undefined,
  status: undefined,
  reason: undefined,
  player_id: undefined
}

const state = ref<Partial<EntryInfoSchema>>({ ...initialState })
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

const onSubmit = async (event: FormSubmitEvent<EntryInfoSchema>) => {
  set(isUploading, true)

  try {
    switch (event.data.relationship) {
      case "Last Direct Acceptance":
        const { data: ldaData, error: ldaError } = await supabase
          .schema("tennis")
          .from("ldas")
          .insert({
            event_id: event.data.entry.event_id,
            entry_id: event.data.entry.entry_id,
            draw: event.data.draw,
            rank: event.data.rank
          })
          .select("*, entry:entries(entry_key)")

        if (ldaError) {
          errors.value.push({
            type: "Error adding last direct acceptance",
            details: ldaError
          })
        }

        set(response, ldaData)
        break
      case "Status":
        const { data: statusData, error: statusError } = await supabase
          .schema("tennis")
          .from("entry_status")
          .insert({
            event_id: event.data.entry.event_id,
            entry_id: event.data.entry.entry_id,
            status: event.data.status!,
            draw: event.data.draw
          })
          .select("*, entry:entries(entry_key)")

        if (statusError) {
          errors.value.push({
            type: "Error adding status",
            details: statusError
          })
        }

        set(response, statusData)
        break
      default:
        const mapping = {
          Retirement: "retirements",
          Withdrawal: "withdrawals",
          Default: "defaults",
          Walkover: "walkovers"
        } as const

        const { data: withdrawalData, error: withdrawalError } = await supabase
          .schema("tennis")
          .from(mapping[event.data.relationship as keyof typeof mapping])
          .insert({
            event_id: event.data.entry.event_id,
            entry_id: event.data.entry.entry_id,
            draw: event.data.draw,
            reason: event.data.reason,
            player_id: event.data.player_id
          })
          .select("*, entry:entries(entry_key)")

        if (withdrawalError) {
          errors.value.push({
            type: `Error adding ${event.data.relationship}`,
            details: withdrawalError
          })
          return
        }

        set(response, withdrawalData)

        if (event.data.relationship !== "Withdrawal") {
          const { error: updateMatchError } = await supabase
            .schema("tennis")
            .from("matches")
            .update({
              incomplete:
                event.data.relationship === "Walkover" ? "WO"
                : event.data.relationship === "Retirement" ? "R"
                : "D"
            })
            .eq("loser_id", event.data.entry.entry_id)
            .eq("draw", event.data.draw)

          if (updateMatchError) {
            errors.value.push({
              type: "Error updating matches",
              details: updateMatchError
            })
          }
        }
        break
    }

    handleReset()
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
        <div class="font-semibold">Create Entry Information</div>
      </template>

      <u-form
        id="entry-info-form"
        :schema="entryInfoSchema"
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
            label: 'Info Type',
            key: 'relationship',
            type: 'inputMenu',
            items: ['Status', 'Default', 'Last Direct Acceptance', 'Retirement', 'Walkover', 'Withdrawal'],
            required: true,
            class: 'col-span-2'
          }"
        />

        <u-form-field
          name="entry"
          :label="state.match_type === 'Doubles' ? 'Team' : 'Player'"
          required
          class="col-span-2"
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

        <form-field
          v-if="state.relationship === 'Last Direct Acceptance'"
          v-model="state"
          :field="{
            label: 'Rank',
            key: 'rank',
            type: 'number',
            class: 'col-span-2'
          }"
        />

        <form-field
          v-else-if="state.relationship === 'Status'"
          v-model="state"
          :field="{
            label: 'Status',
            key: 'status',
            type: 'inputMenu',
            items: Object.entries(STATUS_MAPPING).map(([value, label]) => ({ label, value })),
            valueKey: 'value',
            class: 'col-span-2'
          }"
        />

        <template v-else>
          <form-field
            v-model="state"
            :field="{
              label: 'Reason',
              key: 'reason',
              type: 'text',
              class: state.match_type === 'Doubles' ? 'col-span-1' : 'col-span-2'
            }"
          />

          <form-field
            v-if="state.match_type === 'Doubles'"
            v-model="state"
            :field="{
              label: 'Player',
              key: 'player_id',
              type: 'inputMenu',
              items: state.entry?.team || [],
              valueKey: 'id',
              labelKey: 'full_name'
            }"
          />
        </template>
      </u-form>

      <template #footer>
        <div class="flex gap-3">
          <u-button
            form="entry-info-form"
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
