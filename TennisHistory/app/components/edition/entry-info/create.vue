<script setup lang="ts">
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"

const emit = defineEmits<{
  refresh: []
}>()

const {
  params: { edId }
} = useRoute("edition")

const {
  ui: { icons }
} = useAppConfig()

const toast = useToast()
const supabase = useSupabaseClient()

const isOpen = ref(false)
const isUploading = ref(false)
const errors = ref()

// Get entry list
const { data: entries, pending } = await useAsyncData(
  "entry-info-entries",
  async () => {
    const { data, error } = await supabase
      .from("entries")
      .select("id, player_entry_mapping(players(id, first_name, last_name)), events!inner(id, edition_id)")
      .eq("events.edition_id", Number(edId))

    if (error) {
      console.error("Error fetching entries:", error)
      return []
    }

    return data.map(entry => ({
      id: entry.id,
      label: entry.player_entry_mapping.map(pem => `${pem.players.first_name} ${pem.players.last_name}`).join(" / "),
      event_id: entry.events.id,
      players: entry.player_entry_mapping.map(pem => ({
        id: pem.players.id,
        name: `${pem.players.first_name} ${pem.players.last_name}`
      }))
    }))
  },
  { default: () => [] }
)

const playerOptions = ref<{ id: string; name: string }[]>([])

const state = ref<Partial<EntryInfoType>>({})

const handleEntrySelect = () => {
  const entry = entries.value.find(entry => entry.id === state.value.entry_id)
  state.value.event_id = entry!.event_id
  playerOptions.value = entry!.players
}

const handleReset = () => set(state, {})

const onError = (event: FormErrorEvent) => console.error(event.errors)

const onSubmit = async (event: FormSubmitEvent<EntryInfoType>) => {
  set(isUploading, true)

  let error

  switch (event.data.relationship) {
    case "Last Direct Acceptance":
      const { error: ldaError } = await supabase.from("ldas").insert({
        event_id: event.data.event_id,
        entry_id: event.data.entry_id,
        draw: event.data.draw,
        rank: event.data.rank
      })

      if (ldaError) error = ldaError
      break
    case "Status":
      const { error: statusError } = await supabase.from("entry_status").insert({
        event_id: event.data.event_id,
        entry_id: event.data.entry_id,
        status: event.data.status,
        draw: event.data.draw
      })

      if (statusError) error = statusError
      break
    case "Retirement":
    case "Withdrawal":
    case "Default":
    case "Walkover":
      const mapping = {
        Retirement: "retirements",
        Withdrawal: "withdrawals",
        Default: "defaults",
        Walkover: "walkovers"
      } as const

      const { error: withdrawalError } = await supabase.from(mapping[event.data.relationship as keyof typeof mapping]).insert({
        event_id: event.data.event_id,
        entry_id: event.data.entry_id,
        draw: event.data.draw,
        reason: event.data.reason,
        player_id: event.data.player_id
      })

      if (withdrawalError) {
        error = withdrawalError
      } else {
        if (event.data.relationship !== "Withdrawal") {
          const { error: updateMatchError } = await supabase
            .from("matches")
            .update({
              incomplete:
                event.data.relationship === "Walkover" ? "WO"
                : event.data.relationship === "Retirement" ? "R"
                : "D"
            })
            .eq("loser_id", event.data.entry_id)
            .eq("draw", event.data.draw)

          if (updateMatchError) {
            error = updateMatchError
          }
        }
      }
      break
    default:
      toast.add({
        title: "Invalid entry info type",
        icon: icons.error,
        color: "error"
      })
      break
  }

  if (error) {
    errors.value = error
    set(isUploading, false)
    return
  }

  toast.add({
    title: `${event.data.relationship} successfully created!`,
    description: JSON.stringify(event.data),
    icon: icons.success,
    color: "success"
  })

  emit("refresh")
  handleReset()
  set(isOpen, false)
  set(isUploading, false)
}
</script>

<template>
  <u-modal
    title="Create Entry Info"
    v-model:open="isOpen"
  >
    <u-button
      :icon="icons.plus"
      block
      color="warning"
    />

    <template #body>
      <u-form
        id="entry-info-form"
        :schema="EntryInfoSchema"
        :state="state"
        @submit="onSubmit"
        @error="onError"
      >
        <div class="grid grid-cols-2 items-center gap-3">
          <u-form-field
            name="relationship"
            label="Info Type"
            required
          >
            <u-select-menu
              v-model="state.relationship"
              :items="['Status', 'Default', 'Last Direct Acceptance', 'Retirement', 'Walkover', 'Withdrawal']"
              placeholder="Select info type"
              clear
            />
          </u-form-field>

          <u-form-field
            name="draw"
            label="Draw"
            required
          >
            <u-radio-group
              v-model="state.draw"
              :items="[...DRAW_TYPES]"
              orientation="horizontal"
              loop
            />
          </u-form-field>

          <u-form-field
            name="entry_id"
            label="Entry"
            required
            class="col-span-2"
          >
            <u-select-menu
              v-model="state.entry_id"
              @update:model-value="handleEntrySelect"
              :items="entries"
              :loading="pending"
              placeholder="Select entry"
              value-key="id"
            />
          </u-form-field>

          <u-form-field
            v-if="state.relationship === 'Last Direct Acceptance'"
            name="rank"
            label="Rank"
            class="col-span-2"
          >
            <form-input-number
              v-model="state.rank"
              placeholder="Enter rank"
            />
          </u-form-field>

          <u-form-field
            v-else-if="state.relationship === 'Status'"
            name="status"
            label="Status"
            class="col-span-2"
          >
            <u-select-menu
              v-model="state.status"
              :items="Object.entries(STATUS_MAPPING).map(([value, label]) => ({ label, value }))"
              value-key="value"
              clear
              placeholder="Select status"
            />
          </u-form-field>

          <template v-else>
            <u-form-field
              name="reason"
              label="Reason"
            >
              <form-input
                v-model="state.reason"
                placeholder="Enter reason"
              />
            </u-form-field>

            <u-form-field
              name="player_id"
              label="Player"
            >
              <u-select-menu
                v-model="state.player_id"
                :items="playerOptions"
                value-key="id"
                label-key="name"
                clear
                placeholder="Select player"
              />
            </u-form-field>
          </template>
        </div>
      </u-form>

      <u-alert
        v-if="errors"
        color="error"
        title="Error saving round"
        class="mt-5"
      >
        <template #description>
          {{ errors }}
        </template>
      </u-alert>
    </template>

    <template #footer="{ close }">
      <form-footer
        form="entry-info-form"
        :is-uploading
        @reset="handleReset"
        @close="close"
      />
    </template>
  </u-modal>
</template>
