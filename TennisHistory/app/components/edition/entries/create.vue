<script setup lang="ts">
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"

const emit = defineEmits<{
  refresh: []
}>()

const {
  params: { id, edId, year }
} = useRoute("edition")

const toast = useToast()
const supabase = useSupabaseClient()

const {
  ui: { icons }
} = useAppConfig()

const isOpen = ref(false)
const isUploading = ref(false)
const errors = ref()

const eventId = computed(() => {
  if (COUNTRY_DRAWS.includes(id)) {
    return `${edId}-Country`
  } else if (id === "9210") {
    return `${edId}-LC`
  } else {
    return edId
  }
})

const state = ref<Partial<EntryType>>({
  event_id: eventId.value
})

const handleReset = () => {
  state.value = { event_id: eventId.value }
  errors.value = undefined
}

const onError = (event: FormErrorEvent) => console.error(event.errors)

const onSubmit = async (event: FormSubmitEvent<EntryType>) => {
  set(isUploading, true)

  let entryId = `${event.data.event_id} ${event.data.player_id}`

  if (event.data.teammate_id) entryId += ` ${event.data.teammate_id}`

  const { error } = await supabase.from("entries").insert({
    id: entryId,
    points: event.data.points,
    pm: event.data.pm,
    match_type: event.data.match_type as "Singles" | "Doubles",
    event_id: event.data.event_id
  })

  if (error) {
    errors.value = error
    set(isUploading, false)
    return
  }

  const { error: playerMappingError } = await supabase.from("player_entry_mapping").insert({
    player_id: event.data.player_id,
    entry_id: entryId,
    rank: event.data.rank
  })

  if (playerMappingError) {
    errors.value = playerMappingError
    set(isUploading, false)
    return
  }

  if (event.data.teammate_id) {
    const { error: teammateMappingError } = await supabase.from("player_entry_mapping").insert({
      player_id: event.data.teammate_id,
      entry_id: entryId,
      rank: event.data.teammate_rank
    })

    if (teammateMappingError) {
      errors.value = teammateMappingError
      set(isUploading, false)
      return
    }
  }

  toast.add({
    title: `${entryId} successfully created.`,
    description: JSON.stringify(event.data),
    icon: icons.success,
    color: "success"
  })

  emit("refresh")
  handleReset()
  set(isUploading, false)
  set(isOpen, false)
}

const formFields = computed<FormFieldInterface<EntryType>[]>(() => {
  const fields: FormFieldInterface<EntryType>[] = [
    { label: "S/D", key: "match_type", type: "radio", items: ["Singles", "Doubles"], required: true },
    { label: state.value.match_type === "Doubles" ? "Player 1" : "Player", type: "slot", errorPattern: /^(player_id|rank)$/, required: true }
  ]

  if (state.value.match_type === "Doubles") {
    fields.push({
      label: "Player 2",
      type: "slot",
      required: true,
      errorPattern: /^(teammate_id|teammate_rank)$/
    })
  }

  fields.push({ label: "Points", key: "points", type: "number" }, { label: "Prize Money", key: "pm", type: "number" })

  return fields
})
</script>

<template>
  <u-modal
    title="Create Entry"
    v-model:open="isOpen"
  >
    <u-button
      :icon="icons.plus"
      color="warning"
    />

    <template #body>
      <u-form
        id="entry-form"
        :schema="EntrySchema"
        :state="state"
        @submit="onSubmit"
        @error="onError"
        class="space-y-3"
      >
        <form-field
          v-for="field in formFields"
          :key="field.label"
          :field="field"
          v-model="state"
          orientation="horizontal"
        >
          <u-field-group
            v-if="field.label === 'Player 2'"
            class="w-full"
          >
            <player-search v-model="state.teammate_id" />

            <form-input-number
              placeholder="Enter Player 2 Rank"
              v-model="state.teammate_rank"
            />
          </u-field-group>

          <u-field-group
            v-else
            class="w-full"
          >
            <player-search v-model="state.player_id" />

            <form-input-number
              :placeholder="state.match_type === 'Doubles' ? 'Enter Player 1 Rank' : 'Enter Player Rank'"
              v-model="state.rank"
            />
          </u-field-group>
        </form-field>
      </u-form>

      <u-alert
        v-if="errors"
        color="error"
        :title="`Error saving entry`"
        class="mt-5"
      >
        <template #description>
          {{ errors }}
        </template>
      </u-alert>
    </template>

    <template #footer="{ close }">
      <form-footer
        form="entry-form"
        :is-uploading
        @reset="handleReset"
        @close="close"
      />
    </template>
  </u-modal>
</template>
