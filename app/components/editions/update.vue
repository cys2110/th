<script setup lang="ts">
import { parseDate } from "@internationalized/date"
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"
const { edition, refresh } = defineProps<{ edition?: EditionInterface; refresh?: () => void }>()
const {
  params: { id, year }
} = useRoute("edition")
const toast = useToast()
const {
  ui: { icons }
} = useAppConfig()
const open = ref(false)
const uploading = ref(false)
const tournamentName = useState<string>("tournamentName")
const tours = useState<(keyof typeof TourEnum)[]>("tours")

defineShortcuts({
  meta_enter: () => (edition ? undefined : set(open, !get(open))),
  meta_shift_e: () => (edition ? set(open, !get(open)) : undefined)
})

const state = reactive<Partial<EditionInput>>({
  id: edition?.id,
  tournament: edition?.tournament
    ? {
        value: edition.tournament.id,
        label: edition.tournament.name
      }
    : {
        value: Number(id),
        label: get(tournamentName)
      },
  tours: edition?.tours ?? tours.value,
  year: edition?.year,
  start_date: edition?.start_date ? parseDate(edition.start_date) : undefined,
  end_date: edition?.end_date ? parseDate(edition.end_date) : undefined,
  sponsor_name: edition?.sponsor_name,
  surface: edition?.surface?.id,
  currency: edition?.currency,
  tfc: edition?.tfc,
  draw_type: edition?.draw_type,
  draw_link: edition?.draw_link,
  category: edition?.category,
  wiki_link: edition?.wiki_link,
  venues: edition?.venues
    ? edition.venues.map(v => ({ value: v.id, label: v.name ? `${v.name}, ${v.city}, ${v.country.name}` : `${v.city}, ${v.country.name}` }))
    : undefined
})

const formFields: FormFieldInterface<EditionSchema>[] = [
  { label: "ID", key: "id", type: "text", subType: "number", required: true },
  { label: "Tournament", key: "tournament", type: "search", subType: "tournaments", required: true },
  {
    label: "Tours",
    key: "tours",
    type: "checkbox",
    items: tours.value?.length ? tours.value.map(t => ({ label: TourEnum[t], value: t })) : TOUR_OPTIONS,
    required: true
  },
  { label: "Year", key: "year", type: "selectMenu", items: ALL_YEARS, required: true },
  { label: "Sponsor Name", key: "sponsor_name", type: "text", class: "col-span-2" },
  { label: "Start Date", key: "start_date", type: "date" },
  { label: "End Date", key: "end_date", type: "date" },
  { label: "Surface", key: "surface", type: "select", items: SURFACE_OPTIONS },
  { label: "Venues", key: "venues", type: "search", subType: "venues", multiple: true },
  { label: "Currency", key: "currency", type: "checkbox", items: CURRENCY_OPTIONS },
  { label: "Total Financial Commitment", key: "tfc", type: "currency" },
  { label: "Category", key: "category", type: "text" },
  { label: "Draw Type", key: "draw_type", type: "select", items: DRAW_OPTIONS },
  { label: "Draw Link", key: "draw_link", type: "textarea", class: "col-span-2" },
  { label: "Wikipedia Link", key: "wiki_link", type: "textarea", class: "col-span-2" }
]

const handleReset = () => {
  state.id = edition?.id
  state.tournament = edition?.tournament
    ? {
        value: edition.tournament.id,
        label: edition.tournament.name
      }
    : {
        value: Number(id),
        label: get(tournamentName)
      }
  state.tours = edition?.tours
  state.year = edition?.year
  state.start_date = edition?.start_date ? parseDate(edition.start_date) : undefined
  state.end_date = edition?.end_date ? parseDate(edition.end_date) : undefined
  state.sponsor_name = edition?.sponsor_name
  state.surface = edition?.surface?.id
  state.currency = edition?.currency
  state.tfc = edition?.tfc
  state.draw_type = edition?.draw_type
  state.draw_link = edition?.draw_link
  state.category = edition?.category
  state.wiki_link = edition?.wiki_link
  state.venues = edition?.venues
    ? edition.venues.map(v => ({ value: v.id, label: v.name ? `${v.name}, ${v.city}, ${v.country.name}` : `${v.city}, ${v.country.name}` }))
    : undefined
}

const onError = (event: FormErrorEvent) => {
  toast.add({
    title: "Please ensure fields are filled out correctly",
    description: event.errors.map(e => e.message).join(", "),
    icon: icons.error,
    color: "error"
  })
}

const onSubmit = async (event: FormSubmitEvent<EditionSchema>) => {
  set(uploading, true)
  try {
    const response = await $fetch(`/api/editions/${edition ? "update" : "create"}`, {
      query: event.data
    })

    if ((response as any).ok) {
      toast.add({
        title: `Edition ${edition ? "updated" : "created"}`,
        icon: icons.success,
        color: "success"
      })
      handleReset()
      set(open, false)
      if (refresh) {
        refresh()
      }
    } else {
      toast.add({
        title: `Error ${edition ? "updating" : "creating"} edition`,
        description: (response as any).message,
        icon: icons.error,
        color: "error"
      })
    }
  } catch (e) {
    toast.add({
      title: `Error ${edition ? "updating" : "creating"} edition`,
      description: (e as Error).message,
      icon: icons.error,
      color: "error"
    })
  } finally {
    set(uploading, false)
  }
}
</script>

<template>
  <u-modal
    :title="edition ? `Edit ${edition.tournament.name} ${year}` : 'Create Edition'"
    v-model:open="open"
  >
    <u-button
      :icon="edition ? ICONS.edit : icons.plus"
      :label="edition ? `Edit ${edition.tournament.name} ${year}` : 'Create Edition'"
      block
    />

    <template #body>
      <u-form
        id="edition-form"
        :schema="editionSchema"
        :state
        @submit="onSubmit"
        @error="onError"
      >
        <div class="grid grid-cols-2 gap-5 items-center">
          <form-field
            v-for="field in formFields"
            :key="field.label"
            :field
            v-model="state[field.key]"
            :currency="state.currency"
          />
        </div>
      </u-form>
    </template>

    <template #footer="{ close }">
      <u-button
        form="edition-form"
        type="submit"
        label="Save"
        :icon="uploading ? ICONS.uploading : icons.check"
        block
      />
      <u-button
        label="Reset"
        :icon="icons.reload"
        @click="handleReset"
        block
        color="warning"
      />
      <u-button
        label="Cancel"
        :icon="icons.error"
        @click="close"
        block
        color="error"
      />
    </template>
  </u-modal>
</template>
