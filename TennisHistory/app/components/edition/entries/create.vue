<script setup lang="ts">
import { number, object, string, z } from "zod"
import { set } from "@vueuse/core"
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"

const schema = object({
  tour: object({ id: string(), currency: string().nullish() }),
  match_type: MatchTypeEnum,
  player: object({ id: string() }),
  rank: number().nonnegative().int().optional(),
  points: number().nonnegative().int().optional(),
  pm: number().nonnegative().optional(),
  teammate: object({ id: string() }).optional(),
  teammate_rank: number().nonnegative().int().optional()
}).superRefine((data, ctx) => {
  if (data.match_type === "Doubles" && !data.teammate?.id) ctx.addIssue({ code: "custom", path: ["teammate"], message: "Teammate is required" })
})
type Schema = z.infer<typeof schema>

const emits = defineEmits<{ refresh: [] }>()

defineShortcuts({
  ctrl_a: () => set(isOpen, !isOpen.value)
})

const route = useRoute("edition")
const { ui } = useAppConfig()
const toast = useToast()
const supabase = useSupabaseClient()

const tournamentStore = useTournamentStore()

const isOpen = ref(false)
const isUploading = ref(false)

const {
  data: events,
  pending,
  refresh
} = await useAsyncData(
  () => `entry-create-${JSON.stringify(route.params)}`,
  async () => {
    const { data, error } = await supabase
      .schema("tennis")
      .from("events")
      .select("id, tour, currency, edition:editions!inner(currency)")
      .eq("editions.tournament_id", route.params.id)
      .eq("editions.year", Number(route.params.year))
      .eq("editions.edition_no", Number(route.params.edition_no))

    if (error || !data) {
      console.error("Error fetching events", error)
      return []
    }

    return data.map(event => ({
      ...event,
      currency: event.currency || event.edition?.currency || "USD"
    }))
  },
  { default: () => [] }
)

const state = ref<Partial<Schema>>({})

const handleReset = () => {
  state.value = {}
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
    const entryKey = event.data.match_type === "Singles" ? event.data.player.id : [event.data.player.id, event.data.teammate?.id].join("-")

    const { data, error } = await supabase
      .schema("tennis")
      .from("entries")
      .insert({
        points: event.data.points,
        pm: event.data.pm,
        match_type: event.data.match_type,
        event_id: event.data.tour.id,
        entry_key: entryKey
      })
      .select("id")

    if (error || !data) {
      console.error("Error creating entry:", error)
      throw Error
    }

    const { error: playerMappingError } = await supabase
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

    if (playerMappingError) {
      console.error("Error creating player entry mapping:", playerMappingError)
      throw Error
    }

    toast.add({
      title: "Entry created",
      icon: ui.icons.success,
      color: "success"
    })

    emits("refresh")
    handleReset()
    set(isOpen, false)
  } catch (error) {
    toast.add({
      title: "Error creating entry",
      icon: ui.icons.error,
      color: "error"
    })
  } finally {
    set(isUploading, false)
  }
}

const formFields = computed<FormFieldInterface<Schema>[]>(() => [
  { label: "S/D", key: "match_type", type: "radio", items: MATCH_TYPES, required: true },
  { label: "Tour", key: "tour", type: "inputMenu", items: events.value, labelKey: "tour", required: true },
  { label: state.value.match_type === "Singles" ? "Player" : "Player 1", key: "player", type: "player", required: true },
  { label: "Rank", key: "rank", type: "number" },
  ...(state.value.match_type === "Doubles" ?
    ([
      { label: "Player 2", key: "teammate", type: "player", required: true },
      { label: "Rank", key: "teammate_rank", type: "number" }
    ] as Array<FormFieldInterface<Schema>>)
  : []),
  { label: "Points", key: "points", type: "number" },
  { label: "Prize Money", key: "pm", type: "number", currency: state.value.tour?.currency || "USD" }
])
</script>

<template>
  <u-modal
    title="Create Entry"
    v-model:open="isOpen"
  >
    <u-button :icon="ui.icons.plus" />

    <template #body>
      <u-form
        id="entry-form"
        :schema
        :state
        @submit="onSubmit"
        @error="onError"
      >
        <div class="grid grid-cols-2 gap-3 items-center">
          <form-field
            v-for="field in formFields"
            :key="field.label"
            v-model="state"
            :field
          />
        </div>
      </u-form>
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
