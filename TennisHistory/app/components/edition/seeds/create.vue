<script setup lang="ts">
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"
import { array, number, object, string, z } from "zod"

const schema = object({
  event_id: string().optional(),
  entry: object({
    id: string(),
    event_id: string(),
    match_type: MatchTypeEnum.nullable(),
    tour: TourEnum.nullable(),
    players: array(
      object({
        id: string(),
        first_name: string(),
        last_name: string(),
        full_name: string(),
        country: array(
          object({
            id: string(),
            name: string(),
            continent: ContinentEnum,
            alpha_2: string().nullable()
          })
        )
      })
    ),
    label: string()
  }),
  seed: number(),
  draw: DrawEnum,
  match_type: MatchTypeEnum,
  rank: number().optional()
})
type Schema = z.infer<typeof schema>

const emits = defineEmits<{ refresh: [] }>()

const {
  ui: { icons }
} = useAppConfig()

const {
  params: { edId }
} = useRoute("edition")

const toast = useToast()
const supabase = useSupabaseClient()

const isOpen = ref(false)
const isUploading = ref(false)
const errors = ref()
const form = useTemplateRef("form")

defineShortcuts({
  ctrl_a: () => set(isOpen, !isOpen.value),
  ctrl_r: () => set(state, {}),
  ctrl_enter: () => form.value?.submit()
})

const eventsKey = computed(() => `${edId}-events`)

// Get events
const { data: events, pending: eventsPending } = await useAsyncData(
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

const { entries, pending, fetchEntries } = useEntryList(Number(edId))

const state = ref<Partial<Schema>>({})

const handleReset = () => {
  const { event_id, draw, match_type } = state.value
  set(state, { event_id, draw, match_type })
  set(errors, undefined)
}

const onError = (event: FormErrorEvent) => set(errors, event.errors)

const onSubmit = async (event: FormSubmitEvent<Schema>) => {
  set(isUploading, true)
  set(errors, undefined)

  try {
    const { match_type, event_id, entry, ...rest } = event.data
    const { error } = await supabase.from("seeds").insert({
      ...rest,
      match_type,
      event_id: event_id ?? events.value[0]!.id,
      entry_id: entry.id
    })

    if (error) {
      set(errors, error)

      toast.add({
        title: `Error creating ${event.data.event_id} ${event.data.draw} ${event.data.seed}`,
        icon: icons.error,
        color: "error"
      })
    }

    toast.add({
      title: `${event.data.event_id} ${event.data.draw} ${event.data.seed} successfully created!`,
      icon: icons.success,
      color: "success"
    })

    emits("refresh")
    handleReset()
    set(isOpen, false)
  } finally {
    set(isUploading, false)
  }
}
</script>

<template>
  <u-modal
    title="Create Seed"
    v-model:open="isOpen"
  >
    <u-button :icon="icons.plus" />

    <template #body>
      <u-alert
        v-if="errors"
        color="error"
        title="Error saving round"
        :description="errors"
        class="mb-5"
      />

      <u-form
        id="seed-form"
        ref="form"
        :schema
        :state
        @submit="onSubmit"
        @error="onError"
        class="space-y-3"
      >
        <div
          class="grid items-center gap-3"
          :class="events.length > 1 ? 'grid-cols-3' : 'grid-cols-2'"
        >
          <u-form-field
            v-if="events.length > 1"
            name="event_id"
            label="Tour"
            required
          >
            <u-radio-group
              v-model="state.event_id"
              :items="events"
              orientation="horizontal"
              loop
              value-key="id"
              label-key="tour"
              :loading="eventsPending"
            />
          </u-form-field>

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
            name="draw"
            label="Draw"
            required
          >
            <u-radio-group
              :items="[...DRAW_TYPES]"
              v-model="state.draw"
              orientation="horizontal"
              loop
            />
          </u-form-field>
        </div>

        <u-form-field
          name="entry_id"
          :label="state.match_type === 'Doubles' ? 'Team' : 'Player'"
          required
          class="col-span-2"
        >
          <u-input-menu
            v-model="state.entry"
            :items="
              entries.filter(entry => {
                const isMatchTypeMatch = !state.match_type || state.match_type === entry.match_type
                const isTourMatch = !state.event_id || (entry.tour && state.event_id.includes(entry.tour))
                return isMatchTypeMatch && isTourMatch
              })
            "
            :placeholder="`Select ${state.match_type === 'Doubles' ? 'Team' : 'Player'}`"
            :loading="pending"
            label-key="label"
            clear
            :ui="{
              root: 'w-full',
              base: state.entry && state.match_type === 'Doubles' ? 'pl-10' : '',
              itemLabel: state.match_type === 'Doubles' ? 'ml-8' : 'ml-4'
            }"
          >
            <template #leading="{ modelValue }">
              <u-icon
                v-if="modelValue"
                v-for="(player, index) in modelValue.players"
                :key="player.id"
                :name="getFlagCode(player.country)"
                class="absolute size-4 rounded-sm"
                :class="{ 'z-10 left-5': index === 1 }"
              />

              <u-icon
                v-else
                :name="ICONS.player"
              />
            </template>

            <template #item-leading="{ item }">
              <div class="relative">
                <u-icon
                  v-for="(player, index) in item.players"
                  :key="player.id"
                  :name="getFlagCode(player.country)"
                  class="absolute size-4 rounded-sm"
                  :class="{ 'z-10 left-3': index === 1 }"
                />
              </div>
            </template>
          </u-input-menu>
        </u-form-field>

        <div class="grid grid-cols-2 items-center gap-3">
          <u-form-field
            name="seed"
            label="Seed"
          >
            <form-input-number
              v-model="state.seed"
              placeholder="Enter seed"
            />
          </u-form-field>

          <u-form-field
            name="rank"
            label="Rank"
          >
            <form-input-number
              v-model="state.rank"
              placeholder="Enter rank"
            />
          </u-form-field>
        </div>
      </u-form>
    </template>

    <template #footer="{ close }">
      <form-footer
        form="seed-form"
        :loading="isUploading"
        @reset="handleReset"
        @close="close"
      />
    </template>
  </u-modal>
</template>
