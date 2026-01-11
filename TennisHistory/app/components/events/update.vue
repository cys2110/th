<script setup lang="ts">
import { parseDate } from "@internationalized/date"
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"
import type { FetchError } from "ofetch"

const props = defineProps<{
  event?: EventType
  refresh: () => void
}>()

const {
  params: { edId, year }
} = useRoute("edition")
const {
  ui: { icons }
} = useAppConfig()
const toast = useToast()
const tournamentStore = useTournamentStore()

const uploading = ref(false)
const open = ref(false)

const initialState = {
  ...props.event,
  id: props.event?.id ?? (COUNTRY_DRAWS.includes(tournamentStore.id) ? `${edId}-Country` : undefined),
  edition: Number(edId),
  tour: props.event?.tour
    ? (tourEnum[props.event.tour as keyof typeof tourEnum] as TourInputEnumType)
    : (tourEnum[tournamentStore.tours[0] as keyof typeof tourEnum] as TourInputEnumType),
  currency: props.event?.currency
    ? { value: props.event.currency, label: currencyEnum[props.event.currency as keyof typeof currencyEnum] }
    : undefined,
  dates: {
    start: props.event?.start_date ? parseDate(props.event.start_date) : undefined,
    end: props.event?.end_date ? parseDate(props.event.end_date) : undefined
  },
  surface: props.event?.surface?.id,
  venues: props.event?.venues
    ? props.event.venues.map(v => ({ value: v.id, label: v.name ? `${v.name}, ${v.city}, ${v.country!.name}` : `${v.city}, ${v.country!.name}` }))
    : undefined,
  supervisors: props.event?.supervisors ? props.event.supervisors.map(s => ({ value: s.id, label: s.id })) : undefined
}

const state = ref<Partial<EventFormInput>>(cloneDeep(initialState))

const handleReset = () => set(state, cloneDeep(initialState))

const onError = (event: FormErrorEvent) => console.error(event.errors)

const onSubmit = async (e: FormSubmitEvent<EventFormSchema>) => {
  set(uploading, true)

  // Get dirty fields from the form
  const fields = Object.keys(e.data) as (keyof EventFormSchema)[]
  const dirtyFields: Partial<EventFormSchema> = {}

  for (const field of fields) {
    if (field === "id" || field === "edition" || field === "tour") {
      // @ts-expect-error
      dirtyFields[field] = e.data[field]
    } else {
      if (!isEqual(e.data[field], initialState[field as keyof typeof initialState])) {
        // @ts-expect-error
        dirtyFields[field] = e.data[field] ?? null
      }
    }
  }

  if (Object.keys(dirtyFields).length) {
    try {
      const response = await $fetch(`/api/events/${props.event ? "update" : "create"}`, {
        method: "POST",
        body: dirtyFields
      })

      if (response.success) {
        toast.add({
          title: `${tournamentStore.name} ${year} ${e.data.tour} ${props.event ? "updated" : "created"}`,
          icon: icons.success,
          color: "success"
        })

        props.refresh() // Refresh event details

        nextTick(() => {
          handleReset() // Reset form

          set(open, false) // Close modal
        })
      } else {
        toast.add({
          title: `Error ${props.event ? "updating" : "creating"} ${tournamentStore.name} ${year} ${e.data.tour}`,
          icon: icons.error,
          color: "error"
        })
      }
    } catch (error) {
      if (typeof error === "object" && error && "statusMessage" in error) {
        const err = error as FetchError<ValidationError>

        if (err.statusMessage === "Invalid request body") {
          console.error(
            "Validation errors: ",
            err.data?.validationErrors.map(e => `${e.path.join(".")}: ${e.message}`)
          )
        }
      } else {
        console.error(error)
      }

      toast.add({
        title: `Error ${props.event ? "updating" : "creating"} ${tournamentStore.name} ${year} ${e.data.tour}`,
        description: (error as Error).message,
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

const formFields = computed<FormFieldInterface<EventFormSchema>[]>(
  () =>
    [
      ...(!props.event && tournamentStore.tours.length > 1 && !COUNTRY_DRAWS.includes(tournamentStore.id)
        ? [
            {
              label: "Tour",
              key: "tour",
              type: "radio",
              items: tournamentStore.tours!.map((t: any) => ({ label: t, value: tourEnum[t as keyof typeof tourEnum] })),
              required: true
            }
          ]
        : []),
      {
        label: "Level",
        key: "level",
        type: "radio",
        items: Object.values(LevelEnum.enum),
        required: true
      },
      {
        label: "Dates",
        key: "dates",
        type: "dates",
        class: !props.event && tournamentStore.tours.length > 1 && !COUNTRY_DRAWS.includes(tournamentStore.id) ? "col-span-2" : "col-span-1"
      },
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
</script>

<template>
  <u-modal
    :title="event ? `${tournamentStore.name} ${year} - ${event.tour}` : 'Create Event'"
    v-model:open="open"
  >
    <u-button
      :icon="event ? ICONS.edit : icons.plus"
      :label="event ? event.tour : 'Create Event'"
      block
      color="Doubles"
    />

    <template #body>
      <u-form
        id="event-form"
        :schema="eventFormSchema"
        :state="state"
        @submit="onSubmit as any"
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
        :icon="uploading ? ICONS.uploading : icons.upload"
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
