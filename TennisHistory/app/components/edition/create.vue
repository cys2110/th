<script setup lang="ts">
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"
import { any, array, coerce, object, string, url, z } from "zod"
import { set } from "@vueuse/core"

const schema = object({
  category: string().optional(),
  currency: string().optional(),
  draw_link: url("Draw link must be a valid URL").optional(),
  draw_type: DrawTypeEnum.optional(),
  draw_size: coerce.number("Draw size must be a number").int("Draw size must be an integer").positive("Draw size much be positive").optional(),
  dates: any().optional(),
  sponsor_name: string().optional(),
  tfc: coerce.number("Total financial commitment must be a number").nonnegative("Total financial commitment cannot be a negative number").optional(),
  tours: array(TourEnum).default([]),
  year: any(),
  edition_no: coerce
    .number("Edition number must be a number")
    .int("Edition number must be an integer")
    .positive("Edition number much be positive")
    .default(0),
  surface: string().optional(),
  venue: object({ id: string() }).optional()
})
type SchemaInput = z.input<typeof schema>
type Schema = z.infer<typeof schema>

defineShortcuts({
  ctrl_a: () => set(isOpen, !isOpen.value)
})

const router = useRouter()
const route = useRoute("tournament")
const toast = useToast()
const supabase = useSupabaseClient()
const { ui } = useAppConfig()

const tournamentStore = useTournamentStore()

const isOpen = ref(false)
const isUploading = ref(false)

const state = ref<Partial<SchemaInput>>({ tours: tournamentStore.tours })

const handleReset = () => {
  set(state, { tours: tournamentStore.tours })
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
    const { dates, year, surface, venue, ...rest } = event.data
    let surfaceId: string | null = null

    if (surface) {
      const { data: surfaceData, error: surfaceError } = await supabase.schema("tennis").from("surface").select("id").eq("name", surface).single()

      if (surfaceError || !surfaceData) {
        console.error("Error fetching surface:", surfaceError)
        throw Error
      }

      surfaceId = surfaceData.id
    }

    const { error } = await supabase
      .schema("tennis")
      .from("editions")
      .insert({
        ...rest,
        tournament_id: route.params.id,
        start_date: dates?.start?.toString(),
        end_date: dates?.end?.toString(),
        surface_id: surfaceId,
        venue_id: venue?.id,
        year: year.year
      })

    if (error) {
      console.error("Error creating edition:", error)
      throw Error
    }

    toast.add({
      title: `${tournamentStore.name} ${event.data.year.year}${event.data.edition_no ? ` [${event.data.edition_no}]` : ""} successfully created!`,
      icon: ui.icons.success,
      color: "success"
    })

    handleReset()
    set(isOpen, false)

    router.push({
      name: "edition",
      params: {
        ...route.params,
        year: event.data.year.year,
        edition_no: event.data.edition_no
      }
    })
  } catch (error) {
    toast.add({
      title: `Error creating ${tournamentStore.name} ${event.data.year.year}${event.data.edition_no ? ` [${event.data.edition_no}]` : ""}`,
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
      ...(tournamentStore.tours.length > 1 ?
        [{ label: "Tours", key: "tours", type: "checkbox", items: tournamentStore.tours, required: true, icon: ICONS.tour, class: "col-span-2" }]
      : []),
      { label: "Year", key: "year", type: "calendar", required: true },
      { label: "Dates", key: "dates", type: "dates" },
      { label: "Sponsor Name", key: "sponsor_name", type: "text", class: "col-span-2" },
      { label: "Edition Number", key: "edition_no", type: "number" },
      { label: "Category", key: "category", type: "inputMenu", items: CATEGORIES },
      { label: "Currency", key: "currency", type: "inputMenu", items: CURRENCIES, valueKey: "value" },
      { label: "Total Financial Commitment", key: "tfc", type: "number", disabled: !state.value.currency, currency: state.value.currency || "USD" },
      { label: "Draw Type", key: "draw_type", type: "inputMenu", items: DRAW_TYPES },
      { label: "Draw Size", key: "draw_size", type: "number" },
      { label: "Draw Link", key: "draw_link", type: "textarea", class: "col-span-2" },
      { label: "Surface", key: "surface", type: "inputMenu", items: SURFACES },
      { label: "Venue", key: "venue", type: "venue" }
    ] as Array<FormFieldInterface<Schema>>
)
</script>

<template>
  <u-modal
    :title="`Create ${tournamentStore.name} ${state.year ? `${state.year.year}${state.edition_no ? ` [${state.edition_no}]` : ''}` : 'Edition'}`"
    v-model:open="isOpen"
  >
    <u-button :icon="ui.icons.plus" />

    <template #body>
      <u-form
        id="edition-form"
        :schema
        :state
        @submit="onSubmit"
        @error="onError"
      >
        <div class="grid grid-cols-2 items-center gap-3">
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
        form="edition-form"
        :loading="isUploading"
        @reset="handleReset"
        @close="close"
      />
    </template>
  </u-modal>
</template>
