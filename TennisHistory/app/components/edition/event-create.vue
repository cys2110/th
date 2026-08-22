<script setup lang="ts">
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"
import { any, array, coerce, object, string, url, z } from "zod"
import { set } from "@vueuse/core"

const schema = object({
  tour: TourEnum,
  category: string(),
  currency: string(),
  dates: any().optional(),
  level: LevelEnum,
  sponsor_name: string().optional(),
  undefeated_bonus: coerce.number("Undefeated bonus must be a number").nonnegative("Undefeated bonus cannot be a negative number").optional(),
  surface: string().optional(),
  venue: object({ id: string() }).optional(),
  supervisors: array(object({ id: string() })).default([]),
  pm: coerce.number("Prize money must be a number").nonnegative("Prize money cannot be a negative number").optional(),
  tfc: coerce.number("Total financial commitment must be a number").nonnegative("Total financial commitment cannot be a negative number").optional(),
  s_draw: DrawTypeEnum.optional(),
  s_link: url("Draw link must be a valid URL").optional(),
  s_draw_size: coerce.number("Draw size must be a number").int("Draw size must be an integer").positive("Draw size much be positive").optional(),
  d_draw: DrawTypeEnum.optional(),
  d_link: url("Draw link must be a valid URL").optional(),
  d_draw_size: coerce.number("Draw size must be a number").int("Draw size must be an integer").positive("Draw size much be positive").optional(),
  qs_draw: DrawTypeEnum.optional(),
  qs_link: url("Draw link must be a valid URL").optional(),
  qs_draw_size: coerce.number("Draw size must be a number").int("Draw size must be an integer").positive("Draw size much be positive").optional(),
  qd_draw: DrawTypeEnum.optional(),
  qd_link: url("Draw link must be a valid URL").optional(),
  qd_draw_size: coerce.number("Draw size must be a number").int("Draw size must be an integer").positive("Draw size much be positive").optional()
})
type SchemaInput = z.infer<typeof schema>
type Schema = z.infer<typeof schema>

const props = defineProps<{ editionId: string }>()

const emits = defineEmits<{ refresh: [] }>()

defineShortcuts({
  ctrl_a: () => set(isOpen, !isOpen.value)
})

const route = useRoute("edition")
const toast = useToast()
const supabase = useSupabaseClient()
const { ui } = useAppConfig()

const tournamentStore = useTournamentStore()

const isOpen = ref(false)
const isUploading = ref(false)

const state = ref<Partial<SchemaInput>>({})

const handleReset = () => {
  set(state, {})
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
    const { surface, supervisors, venue, dates, tour, ...rest } = event.data
    let surfaceId: string | null = null

    if (surface) {
      const { data: surfaceData, error: surfaceError } = await supabase.schema("tennis").from("surface").select("id").eq("name", surface).single()

      if (surfaceError || !surfaceData) {
        console.error("Error fetching surface:", surfaceError)
        throw Error
      }

      surfaceId = surfaceData.id
    }

    const { data, error } = await supabase
      .schema("tennis")
      .from("events")
      .insert({
        ...rest,
        tour: tour || tournamentStore.tours[0],
        start_date: dates?.start?.toString(),
        end_date: dates?.end?.toString(),
        edition_id: props.editionId,
        surface_id: surfaceId,
        venue_id: venue?.id
      })
      .select("id")

    if (error) {
      console.error("Error creating event:", error)
      throw Error
    }

    const { error: supervisorsMappingError } = await supabase
      .schema("tennis")
      .from("event_supervisor_mapping")
      .insert(supervisors.map(s => ({ event_id: data[0]!.id, supervisor_id: s.id })))

    if (supervisorsMappingError) {
      console.error("Error mapping supervisors:", supervisorsMappingError)
      throw Error
    }

    toast.add({
      title: `${tournamentStore.name} ${route.params.year} ${event.data.tour} successfully created!`,
      icon: ui.icons.success,
      color: "success"
    })

    emits("refresh")
    handleReset()
    set(isOpen, false)
  } catch (error) {
    toast.add({
      title: `Error creating ${tournamentStore.name} ${route.params.year} ${event.data.tour}`,
      icon: ui.icons.error,
      color: "error"
    })
  } finally {
    set(isUploading, false)
  }
}

const formFields = computed<Array<FormFieldInterface<Schema>>>(
  () =>
    [
      ...(tournamentStore.tours.length > 1 ? [{ label: "Tour", key: "tour", type: "radio", items: tournamentStore.tours, required: true }] : []),
      { label: "Level", key: "level", type: "radio", items: LEVELS, required: true },
      { label: "Sponsor Name", key: "sponsor_name", type: "text", class: "col-span-2" },
      { label: "Dates", key: "dates", type: "dates", class: "row-span-5" },
      { label: "Category", key: "category", type: "inputMenu", items: CATEGORIES },
      { label: "Currency", key: "currency", type: "inputMenu", items: CURRENCIES, valueKey: "value" },
      { label: "Prize Money", key: "pm", type: "number", disabled: !state.value.currency, currency: state.value.currency || "USD" },
      { label: "Total Financial Commitment", key: "tfc", type: "number", disabled: !state.value.currency, currency: state.value.currency || "USD" },
      {
        label: "Undefeated Bonus",
        key: "undefeated_bonus",
        type: "number",
        disabled: !state.value.currency,
        currency: state.value.currency || "USD"
      },
      { label: "Surface", key: "surface", type: "inputMenu", items: SURFACES },
      { label: "Venue", key: "venue", type: "venue" },
      { label: "Supervisors", key: "supervisors", type: "person", multiple: true, class: "col-span-2" },
      { label: "Singles Draw Type", key: "s_draw", type: "inputMenu", items: DRAW_TYPES },
      { label: "Singles Draw Size", key: "s_draw_size", type: "number" },
      { label: "Singles Draw Link", key: "s_link", type: "textarea", class: "col-span-2" },
      { label: "Doubles Draw Type", key: "d_draw", type: "inputMenu", items: DRAW_TYPES },
      { label: "Doubles Draw Size", key: "d_draw_size", type: "number" },
      { label: "Doubles Draw Link", key: "d_link", type: "textarea", class: "col-span-2" },
      { label: "Qualifying Singles Draw Type", key: "qs_draw", type: "inputMenu", items: DRAW_TYPES },
      { label: "Qualifying Singles Draw Size", key: "qs_draw_size", type: "number" },
      { label: "Qualifying Singles Draw Link", key: "qs_link", type: "textarea", class: "col-span-2" },
      { label: "Qualifying Doubles Draw Type", key: "qd_draw", type: "inputMenu", items: DRAW_TYPES },
      { label: "Qualifying Doubles Draw Size", key: "qd_draw_size", type: "number" },
      { label: "Qualifying Doubles Draw Link", key: "qd_link", type: "textarea", class: "col-span-2" }
    ] as Array<FormFieldInterface<Schema>>
)
</script>

<template>
  <u-modal
    title="Create Event"
    v-model:open="isOpen"
  >
    <u-button :icon="ui.icons.plus" />

    <template #body>
      <u-form
        id="event-form"
        :schema
        :state
        @submit="onSubmit"
        @error="onError"
      >
        <div class="grid grid-cols-2 gap-3">
          <form-field
            v-for="field in formFields"
            :key="field.label"
            :field
            v-model="state"
          />
        </div>
      </u-form>
    </template>

    <template #footer="{ close }">
      <form-footer
        form="event-form"
        :loading="isUploading"
        @reset="handleReset"
        @close="close"
      />
    </template>
  </u-modal>
</template>
