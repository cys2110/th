<script setup lang="ts">
import { parseDate } from "@internationalized/date"
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"
import { cloneDeep, isEqual } from "lodash"

const { event, edition, refresh } = defineProps<{
  event?: EventType
  edition: EditionDetailsType
  refresh: () => void
}>()

const {
  params: { edId, year }
} = useRoute("edition")
const {
  ui: { icons }
} = useAppConfig()
const toast = useToast()

const uploading = ref(false)
const open = ref(false)

const initialState = {
  ...event,
  edition: Number(edId),
  tour: event?.tour
    ? (tourEnum[event.tour as keyof typeof tourEnum] as TourEnumType)
    : edition?.tours?.[0]
    ? (tourEnum[edition.tours[0] as keyof typeof tourEnum] as TourEnumType)
    : undefined,
  currency: event?.currency ? { value: event.currency, label: currencyEnum[event.currency as keyof typeof currencyEnum] } : undefined,
  dates: {
    start: event?.start_date ? parseDate(event.start_date) : undefined,
    end: event?.end_date ? parseDate(event.end_date) : undefined
  },
  surface: event?.surface?.id,
  venues: event?.venues
    ? event.venues.map(v => ({ value: v.id, label: v.name ? `${v.name}, ${v.city}, ${v.country!.name}` : `${v.city}, ${v.country!.name}` }))
    : undefined,
  supervisors: event?.supervisors ? event.supervisors.map(s => ({ value: s.id, label: s.id })) : undefined
}

const state = ref<Partial<EventFormInput>>(cloneDeep(initialState))

const formFields = computed<FormFieldInterface<EventFormSchema>[]>(
  () =>
    [
      !event &&
        (!edition || (edition?.tours && edition.tours.length > 1)) && {
          label: "Tour",
          key: "tour",
          type: "radio",
          items: edition ? edition.tours!.map((t: any) => ({ label: t, value: tourEnum[t as keyof typeof tourEnum] })) : [],
          required: true
        },
      {
        label: "Level",
        key: "level",
        type: "radio",
        items: LEVEL_OPTIONS,
        required: true
      },
      { label: "Dates", key: "dates", type: "dates", class: "col-span-2" },
      { label: "Sponsor Name", key: "sponsor_name", type: "text", class: "col-span-2" },
      { label: "Official Site Link", key: "site_link", type: "textarea", class: "col-span-2" },
      { label: "Wikipedia Link", key: "wiki_link", type: "textarea", class: "col-span-2" },
      { label: "Category", key: "category", type: "text" },
      { label: "Surface", key: "surface", type: "inputMenu", items: SURFACE_OPTIONS },
      { label: "Venues", key: "venues", type: "search", subType: "Venue", multiple: true, class: "col-span-2" },
      {
        label: "Award",
        type: "fieldGroup",
        errorPattern: /^(currency|pm|tfc)%/,
        class: "col-span-2",
        children: [
          { label: "Currency", key: "currency", type: "inputMenu", placeholder: "e.g., $", items: CURRENCY_OPTIONS },
          { label: "Prize Money", key: "pm", type: "number", currency: state.value.currency?.value || "USD" },
          { label: "Total Financial Commitment", key: "tfc", type: "number", currency: state.value.currency?.value || "USD" }
        ]
      },
      { label: "Supervisors", key: "supervisors", type: "search", subType: "Supervisor", multiple: true, class: "col-span-2" },
      { label: "Singles Draw Type", key: "s_draw", type: "inputMenu", items: DRAW_OPTIONS },
      { label: "Doubles Draw Type", key: "d_draw", type: "inputMenu", items: DRAW_OPTIONS },
      { label: "Qualifying Singles Draw Type", key: "qs_draw", type: "inputMenu", items: DRAW_OPTIONS },
      { label: "Qualifying Doubles Draw Type", key: "qd_draw", type: "inputMenu", items: DRAW_OPTIONS },
      { label: "Singles Draw Link", key: "s_link", type: "textarea", class: "col-span-2" },
      { label: "Doubles Draw Link", key: "d_link", type: "textarea", class: "col-span-2" },
      { label: "Qualifying Singles Draw Link", key: "qs_link", type: "textarea", class: "col-span-2" },
      { label: "Qualifying Doubles Draw Link", key: "qd_link", type: "textarea", class: "col-span-2" }
    ].filter(Boolean) as FormFieldInterface<EventFormSchema>[]
)

const handleReset = () => set(state, cloneDeep(initialState))

const onError = (event: FormErrorEvent) => console.error(event.errors)

const onSubmit = async (e: FormSubmitEvent<EventFormSchema>) => {
  set(uploading, true)

  // Get dirty fields from the form
  const fields = Object.keys(e.data) as (keyof EventFormSchema)[]
  const dirtyFields: Partial<EventFormSchema> = {}
  fields.forEach(field => {
    if (!isEqual(e.data[field], initialState[field])) {
      // @ts-expect-error
      dirtyFields[field] = e.data[field] ?? null
    }
  })

  if (Object.keys(dirtyFields).length) {
    dirtyFields["id"] = e.data.id // Always include the event ID
    dirtyFields["edition"] = e.data.edition // Ensure edition ID is included
    dirtyFields["tour"] = e.data.tour // Ensure tour is included

    const response = await $fetch(`/api/events/${event ? "update" : "create"}`, {
      method: "POST",
      body: dirtyFields
    })

    if ((response as any).ok) {
      toast.add({
        title: `${edition?.tournament?.name} ${year} ${e.data.tour} ${event ? "updated" : "created"}`,
        icon: icons.success,
        color: "success"
      })

      refresh() // Refresh event details

      nextTick(() => {
        handleReset() // Reset form

        set(open, false) // Close modal
      })
    } else {
      toast.add({
        title: `Error ${event ? "updating" : "creating"} event`,
        icon: icons.error,
        color: "error"
      })
    }
  } else {
    toast.add({
      title: "No changes to save",
      icon: icons.caution,
      color: "warning"
    })
  }

  set(uploading, false)
}
</script>

<template>
  <u-modal
    :title="event ? event.tour : 'Create Event'"
    v-model:open="open"
  >
    <u-button
      :icon="event ? ICONS.edit : icons.plus"
      :label="event ? event.tour : 'Create Event'"
      block
    />

    <template #body>
      <!--@vue-expect-error-->
      <u-form
        id="event-form"
        :schema="eventFormSchema"
        :state="state"
        @submit="onSubmit"
        @error="onError"
      >
        <div class="grid grid-cols-2 gap-3 items-center">
          <form-field
            v-for="field in formFields"
            :key="field.label"
            :field="field"
            v-model="state"
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
