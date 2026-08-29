<script setup lang="ts">
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"
import { number, object, string, z } from "zod"
import { set } from "@vueuse/core"
import { ICONS } from "#imports"

const schema = object({
  entry: object({
    id: string(),
    event_id: string(),
    label: string()
  }),
  seed: number(),
  draw: DrawEnumType,
  tour: string().optional(),
  match_type: MatchTypeEnum,
  rank: number().optional()
})
type Schema = z.infer<typeof schema>

const emits = defineEmits<{ refresh: [] }>()

defineShortcuts({
  ctrl_a: () => set(isOpen, !isOpen.value)
})

const { ui } = useAppConfig()
const route = useRoute("edition")

const toast = useToast()
const supabase = useSupabaseClient()

const isOpen = ref(false)
const isUploading = ref(false)

// Get events
const { data: events, pending: eventsPending } = await useAsyncData(
  () => `create-seed-${JSON.stringify(route.params)}`,
  async () => {
    const { data, error } = await supabase
      .schema("tennis")
      .from("events")
      .select("id, tour, editions!inner(id)")
      .eq("editions.tournament_id", route.params.id)
      .eq("editions.year", Number(route.params.year))
      .eq("editions.edition_no", Number(route.params.edition_no))

    if (error) {
      console.error("Error fetching events:", error)
      return []
    }

    return data
  },
  { default: () => [] }
)

const { entries, pending, fetchEntries } = useEntryList(route.params.id, route.params.year, route.params.edition_no)

const state = ref<Partial<Schema>>({})

const handleReset = () => {
  const { tour, draw, match_type } = state.value
  set(state, { tour, draw, match_type })
}

const onError = (event: FormErrorEvent) => {
  toast.add({
    title: "Validation error",
    icon: ui.icons.error,
    color: "error"
  })
  console.error("Validation error:", event)
}

const onSubmit = async (event: FormSubmitEvent<Schema>) => {
  set(isUploading, true)

  try {
    const { entry, tour, ...rest } = event.data

    const { error } = await supabase
      .schema("tennis")
      .from("seeds")
      .insert({
        ...rest,
        event_id: entry.event_id,
        entry_id: entry.id
      })

    if (error) {
      console.error("Error creating seed:", error)
    }

    toast.add({
      title: "Seed successfully created!",
      icon: ui.icons.success,
      color: "success"
    })

    emits("refresh")
    handleReset()
    set(isOpen, false)
  } catch (error) {
    toast.add({
      title: `Error creating seed`,
      icon: ui.icons.error,
      color: "error"
    })
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
    <u-button :icon="ui.icons.plus" />

    <template #body>
      <u-form
        id="seed-form"
        ref="form"
        :schema
        :state
        @submit="onSubmit"
        @error="onError"
      >
        <div class="grid grid-cols-4 gap-3">
          <form-field
            v-model="state"
            :field="{
              label: 'Tour',
              key: 'tour',
              type: 'inputMenu',
              items: events,
              valueKey: 'id',
              labelKey: 'tour',
              required: true,
              class: 'col-span-2'
            }"
          />

          <u-form-field
            name="match_type"
            label="S/D"
            required
          >
            <u-radio-group
              :items="['Singles', 'Doubles']"
              v-model="state.match_type"
              loop
            />
          </u-form-field>

          <u-form-field
            name="draw"
            label="Draw"
            required
          >
            <u-radio-group
              :items="['Main', 'Qualifying']"
              v-model="state.draw"
              loop
            />
          </u-form-field>

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
                  const isEventMatch = !state.tour || entry.event_id === state.tour
                  return isMatchTypeMatch && isEventMatch
                })
              "
              :placeholder="`Select ${state.match_type === 'Doubles' ? 'Team' : 'Player'}`"
              :loading="pending"
              label-key="label"
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
            v-model="state"
            :field="{ label: 'Seed', key: 'seed', type: 'number', required: true, class: 'col-span-2' }"
          />

          <form-field
            v-model="state"
            :field="{ label: 'Rank', key: 'rank', type: 'number', class: 'col-span-2' }"
          />
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
