<script setup lang="ts">
import { parseDate } from "@internationalized/date"
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"
const { event, refresh } = defineProps<{ event?: EventInterface; refresh?: () => void }>()
const {
  params: { edId, year, tour, id, name }
} = useRoute("event")
const {
  ui: { icons }
} = useAppConfig()
const toast = useToast()

const tours = useState<(keyof typeof TourEnum)[]>("tours")
const uploading = ref(false)
const open = ref(false)

defineShortcuts({
  meta_enter: () => (event ? undefined : set(open, !get(open))),
  meta_shift_e: () => (event ? set(open, !get(open)) : undefined)
})

const state = reactive<Partial<EventInput>>({
  id: event?.id,
  edition: Number(edId),
  tour: event?.tour,
  level: event?.level,
  category: event?.category,
  start_date: event?.start_date ? parseDate(event.start_date) : undefined,
  end_date: event?.end_date ? parseDate(event.end_date) : undefined,
  surface: event?.surface?.id,
  pm: event?.pm,
  currency: event?.currency,
  tfc: event?.tfc,
  sponsor_name: event?.sponsor_name,
  venues: event?.venues
    ? event.venues.map(v => ({ value: v.id, label: v.name ? `${v.name}, ${v.city}, ${v.country.name}` : `${v.city}, ${v.country.name}` }))
    : undefined,
  supervisors: event?.supervisors ? event.supervisors.map(s => ({ value: s.id, label: s.id })) : undefined,
  s_draw: event?.s_draw,
  d_draw: event?.d_draw,
  qs_draw: event?.qs_draw,
  qd_draw: event?.qd_draw,
  s_link: event?.s_link,
  d_link: event?.d_link,
  qs_link: event?.qs_link,
  qd_link: event?.qd_link,
  site_link: event?.site_link
})

const formFields: FormFieldInterface<EventSchema>[] = [
  {
    label: "Tour",
    key: "tour",
    type: "radio",
    items: tours.value?.length ? tours.value.map(t => ({ label: TourEnum[t], value: t })) : TOUR_OPTIONS,
    required: true
  },
  { label: "Level", key: "level", type: "radio", items: ["Tour", "Challenger", "ITF"], required: true },
  { label: "Sponsor Name", key: "sponsor_name", type: "text", class: "col-span-2" },
  { label: "Official Site Link", key: "site_link", type: "textarea", class: "col-span-2" },
  { label: "Start Date", key: "start_date", type: "date" },
  { label: "End Date", key: "end_date", type: "date" },
  { label: "Category", key: "category", type: "text" },
  { label: "Surface", key: "surface", type: "select", items: SURFACE_OPTIONS },
  { label: "Currency", key: "currency", type: "radio", items: CURRENCY_OPTIONS },
  { label: "Prize Money", key: "pm", type: "currency" },
  { label: "Total Financial Commitment", key: "tfc", type: "currency" },
  { label: "Venues", key: "venues", type: "search", subType: "venues" },
  { label: "Supervisors", key: "supervisors", type: "search", subType: "supervisors", multiple: true, class: "col-span-2" },
  { label: "Singles Draw Type", key: "s_draw", type: "select", items: DRAW_OPTIONS },
  { label: "Doubles Draw Type", key: "d_draw", type: "select", items: DRAW_OPTIONS },
  { label: "Qualifying Singles Draw Type", key: "qs_draw", type: "select", items: DRAW_OPTIONS },
  { label: "Qualifying Doubles Draw Type", key: "qd_draw", type: "select", items: DRAW_OPTIONS },
  { label: "Singles Draw Link", key: "s_link", type: "textarea", class: "col-span-2" },
  { label: "Doubles Draw Link", key: "d_link", type: "textarea", class: "col-span-2" },
  { label: "Qualifying Singles Draw Link", key: "qs_link", type: "textarea", class: "col-span-2" },
  { label: "Qualifying Doubles Draw Link", key: "qd_link", type: "textarea", class: "col-span-2" }
]

const handleReset = () => {
  state.id = event?.id
  state.edition = Number(edId)
  state.tour = event?.tour
  state.level = event?.level
  state.category = event?.category
  state.start_date = event?.start_date ? parseDate(event.start_date) : undefined
  state.end_date = event?.end_date ? parseDate(event.end_date) : undefined
  state.surface = event?.surface?.id
  state.pm = event?.pm
  state.currency = event?.currency
  state.tfc = event?.tfc
  state.sponsor_name = event?.sponsor_name
  state.venues = event?.venues
    ? event.venues.map(v => ({ value: v.id, label: v.name ? `${v.name}, ${v.city}, ${v.country.name}` : `${v.city}, ${v.country.name}` }))
    : undefined
  state.supervisors = event?.supervisors ? event.supervisors.map(s => ({ value: s.id, label: s.id })) : undefined
  state.s_draw = event?.s_draw
  state.d_draw = event?.d_draw
  state.qs_draw = event?.qs_draw
  state.qd_draw = event?.qd_draw
  state.s_link = event?.s_link
  state.d_link = event?.d_link
  state.qs_link = event?.qs_link
  state.qd_link = event?.qd_link
  state.site_link = event?.site_link
}

const onError = (event: FormErrorEvent) => {
  toast.add({
    title: "Please ensure fields are filled out correctly",
    description: event.errors.map(e => e.message).join(", "),
    icon: icons.error,
    color: "error"
  })
}

const onSubmit = async (form: FormSubmitEvent<EventSchema>) => {
  set(uploading, true)
  try {
    const response = await $fetch(`/api/events/${event ? "update" : "create"}`, {
      query: form.data
    })

    if ((response as any).ok) {
      toast.add({
        title: `Event ${event ? "updated" : "created"}`,
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
        title: `Error ${event ? "updating" : "creating"} event`,
        description: (response as any).message,
        icon: icons.error,
        color: "error"
      })
    }
  } catch (e) {
    toast.add({
      title: `Error ${event ? "updating" : "creating"} event`,
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
    :title="event ? `Edit ${event.edition.tournament.name} ${year} ${tour}` : 'Create Event'"
    v-model:open="open"
  >
    <u-button
      :icon="event ? ICONS.edit : icons.plus"
      :label="event ? `Edit ${event.edition.tournament.name} ${year} ${tour}` : 'Create Event'"
      block
    />

    <template #body>
      <u-form
        id="event-form"
        :schema="eventSchema"
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
          />
        </div>
      </u-form>
    </template>

    <template #footer="{ close }">
      <u-button
        form="event-form"
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
