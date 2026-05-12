<script setup lang="ts">
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"
import { number, object, string, z } from "zod"

const schema = object({
  event_id: string().optional(),
  player: object({
    id: string(),
    label: string(),
    icon: string()
  }),
  match_type: MatchTypeEnum,
  rank: number("Rank must be a number").int("Rank must be an integer").nonnegative("Rank cannot be a negative number").optional(),
  points: number("Points must be a number").int("Points must be an integer").nonnegative("Points cannot be negative").optional(),
  pm: number("Prize money must be a number").nonnegative("Prize money cannot be a negative number").optional(),
  teammate: object({
    id: string(),
    label: string(),
    icon: string()
  }).optional(),
  teammate_rank: number("Rank must be a number").int("Rank must be an integer").nonnegative("Rank cannot be a negative number").optional()
})
type Schema = z.infer<typeof schema>

const emits = defineEmits<{ refresh: [] }>()

const {
  params: { id, edId }
} = useRoute("edition")

const {
  ui: { icons }
} = useAppConfig()

const toast = useToast()
const supabase = useSupabaseClient()

const isOpen = ref(false)
const isUploading = ref(false)
const errors = ref()
const form = useTemplateRef("form")

defineShortcuts({
  ctrl_e: () => set(isOpen, !isOpen.value),
  ctrl_r: () => set(state, {}),
  ctrl_enter: () => form.value?.submit()
})

const eventId = computed(() => {
  if (COUNTRY_DRAWS.includes(id)) {
    return `${edId}-Country`
  } else if (id === "9210") {
    return `${edId}-LC`
  } else {
    return undefined
  }
})

const eventsKey = computed(() => `${edId}-events`)

// Get events
const { data: events } = await useAsyncData(
  eventsKey,
  async () => {
    const { data, error } = await supabase.from("events").select("id, tour").eq("edition_id", Number(edId))

    if (error) {
      console.error("Error fetching events:", error)
      return []
    }

    return data
  },
  { default: () => [] }
)

const state = ref<Partial<Schema>>({ event_id: eventId.value, player: undefined, teammate: undefined })

const handleReset = () => {
  set(state, { event_id: eventId.value, player: undefined, teammate: undefined })
  set(errors, undefined)
}

const onError = (event: FormErrorEvent) => {
  set(errors, event.errors)
}

const onSubmit = async (event: FormSubmitEvent<Schema>) => {
  set(isUploading, true)

  const eventId = event.data.event_id || events.value[0]!.id

  let entryId = `${eventId} ${event.data.player.id}`

  if (event.data.teammate?.id) entryId += ` ${event.data.teammate.id}`

  const { error } = await supabase.from("entries").insert({
    id: entryId,
    points: event.data.points,
    pm: event.data.pm,
    match_type: event.data.match_type as "Singles" | "Doubles",
    event_id: eventId
  })

  if (error) {
    errors.value = error
    set(isUploading, false)
    return
  }

  const { error: playerMappingError } = await supabase.from("player_entry_mapping").insert({
    player_id: event.data.player.id,
    entry_id: entryId,
    rank: event.data.rank
  })

  if (playerMappingError) {
    errors.value = playerMappingError
    set(isUploading, false)
    return
  }

  if (event.data.teammate?.id) {
    const { error: teammateMappingError } = await supabase.from("player_entry_mapping").insert({
      player_id: event.data.teammate.id,
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
    icon: icons.success,
    color: "success"
  })

  emits("refresh")
  handleReset()
  set(isUploading, false)
  set(isOpen, false)
}
</script>

<template>
  <u-modal
    title="Create Entry"
    v-model:open="isOpen"
  >
    <u-button :icon="icons.plus" />

    <template #body>
      <u-form
        id="entry-form"
        ref="form"
        :schema
        :state="state"
        @submit="onSubmit"
        @error="onError"
        class="space-y-3"
      >
        <div class="grid grid-cols-2">
          <u-form-field
            name="match_type"
            label="S/D"
            required
          >
            <u-radio-group
              :items="[...MATCH_TYPES]"
              v-model="state.match_type"
              orientation="horizontal"
              loop
            />
          </u-form-field>

          <u-form-field
            v-if="events.length > 1"
            name="event_id"
            label="Tour"
            required
          >
            <u-radio-group
              v-model="state.event_id"
              :items="events"
              value-key="id"
              label-key="tour"
              orientation="horizontal"
              loop
            />
          </u-form-field>
        </div>

        <u-form-field
          :label="state.match_type === 'Doubles' ? 'Player 1' : 'Player'"
          :error-pattern="/^(player_id|rank)$/"
          required
        >
          <u-field-group>
            <player-search v-model="state.player" />

            <form-input-number
              :placeholder="`Enter player${state.match_type === 'Doubles' ? ' 1' : ''} rank`"
              v-model="state.rank"
            />
          </u-field-group>
        </u-form-field>

        <u-form-field
          v-if="state.match_type === 'Doubles'"
          label="Player 2"
          :error-pattern="/^(teammate_id|teammate_rank)$/"
          required
        >
          <u-field-group>
            <player-search v-model="state.teammate" />

            <form-input-number
              :placeholder="`Enter player 2 rank`"
              v-model="state.teammate_rank"
            />
          </u-field-group>
        </u-form-field>

        <div class="grid grid-cols-2 gap-3">
          <u-form-field
            name="points"
            label="Points"
          >
            <form-input-number
              v-model="state.points"
              placeholder="Enter points"
            />
          </u-form-field>

          <u-form-field
            name="pm"
            label="Prize Money"
          >
            <form-input-number
              v-model="state.pm"
              placeholder="Enter prize money"
            />
          </u-form-field>
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
        form="entry-form"
        :loading="isUploading"
        @reset="handleReset"
        @close="close"
      />
    </template>
  </u-modal>
</template>
