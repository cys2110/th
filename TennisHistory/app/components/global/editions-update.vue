<script setup lang="ts">
import { parseDate } from "@internationalized/date"
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"
import type { FetchError } from "ofetch"

const props = defineProps<{
  edition?: EditionDetailsType
  refresh?: () => void
}>()

const {
  params: { id, name, year }
} = useRoute("edition")
const toast = useToast()
const {
  ui: { icons }
} = useAppConfig()
const router = useRouter()
const tournamentStore = useTournamentStore()

const open = ref(false)
const uploading = ref(false)

const initialState = {
  ...props.edition,
  currency: props.edition?.currency
    ? { value: props.edition.currency, label: currencyEnum[props.edition.currency as keyof typeof currencyEnum] }
    : undefined,
  tournament: Number(id),
  year: year ? Number(year) : undefined,
  tours: (props.edition?.tours ?? tournamentStore.tours!).map(tour => {
    return tourEnum[tour] as TourInputEnumType
  }),
  dates: {
    start: props.edition?.start_date ? parseDate(props.edition.start_date) : undefined,
    end: props.edition?.end_date ? parseDate(props.edition.end_date) : undefined
  },
  surface: props.edition?.surface?.id,
  venues: props.edition?.venues
    ? props.edition.venues.map(v => ({ value: v.id, label: v.name ? `${v.name}, ${v.city}, ${v.country!.name}` : `${v.city}, ${v.country!.name}` }))
    : undefined
}

const state = ref<Partial<EditionFormInput>>(cloneDeep(initialState))

const handleReset = () => set(state, cloneDeep(initialState))

const onError = (event: FormErrorEvent) => console.error(event.errors)

const onSubmit = async (event: FormSubmitEvent<EditionFormSchema>) => {
  set(uploading, true)

  // Get dirty fields from the form
  const fields = Object.keys(event.data) as (keyof EditionFormSchema)[]
  const dirtyFields: Partial<EditionFormSchema> = {}

  for (const field of fields) {
    if (field === "id") dirtyFields[field] = event.data[field] // Always include the edition ID

    if (!props.edition && (field === "tournament" || field === "tours")) {
      // Always include the tournament ID and tours when creating a new edition
      // @ts-expect-error
      dirtyFields[field] = event.data[field]
    }

    if (!isEqual(event.data[field], initialState[field])) {
      // @ts-expect-error
      dirtyFields[field] = event.data[field] ?? null
    }
  }

  if (Object.keys(dirtyFields).length) {
    try {
      const response = await $fetch(`/api/editions/${props.edition ? "update" : "create"}`, {
        method: "POST",
        body: dirtyFields
      })

      if (response?.success) {
        toast.add({
          title: `${tournamentStore.name} ${event.data.year} ${props.edition ? "updated" : "created"}`,
          icon: icons.success,
          color: "success"
        })

        if (props.refresh) {
          props.refresh() // Refresh edition details

          await nextTick(() => {
            handleReset() // Reset form
            set(open, false) // Close modal
          })
        } else {
          // Navigate to the new edition page
          router.push({
            name: "edition",
            params: { id, name, edId: event.data.id, year: event.data.year }
          })
        }
      } else {
        toast.add({
          title: `Error ${props.edition ? "updating" : "creating"} edition`,
          icon: icons.error,
          color: "error"
        })
      }
    } catch (e) {
      if (typeof e === "object" && e && "statusMessage" in e) {
        const err = e as FetchError<ValidationError>

        if (err.statusMessage === "Invalid request body") {
          console.error(
            "Validation errors: ",
            err.data?.validationErrors.map(e => `${e.path.join(".")}: ${e.message}`)
          )
        }
      } else {
        console.error(e)
      }
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

const formFields = computed<FormFieldInterface<EditionFormSchema>[]>(
  () =>
    [
      { label: "ID", key: "id", type: "text", subType: "number", required: true, disabled: !!props.edition },
      { label: "Year", key: "year", type: "inputMenu", items: ALL_YEARS, required: true },
      { label: "Sponsor Name", key: "sponsor_name", type: "text", class: "col-span-2" },
      ...(tournamentStore.tours.length > 1
        ? [
            {
              label: "Tours",
              key: "tours",
              type: "checkbox",
              required: true,
              items: tournamentStore.tours.length
                ? tournamentStore.tours.map((t: any) => ({ label: t, value: tourEnum[t as keyof typeof tourEnum] }))
                : TOUR_OPTIONS
            }
          ]
        : []),
      {
        label: "Category",
        key: "category",
        type: "text",
        class: tournamentStore.tours.length > 1 ? "col-span-1" : "col-span-2"
      },
      { label: "Dates", key: "dates", type: "dates", class: "col-span-2" },
      { label: "Surface", key: "surface", type: "inputMenu", items: SURFACE_OPTIONS },
      {
        label: "Award",
        type: "fieldGroup",
        errorPattern: /^(currency|tfc)$/,
        children: [
          { label: "Currency", key: "currency", type: "inputMenu", placeholder: "e.g., $", items: CURRENCY_OPTIONS },
          { label: "Total Financial Commitment", placeholder: "TFC", key: "tfc", type: "number", currency: state.value.currency?.value || "USD" }
        ]
      },
      { label: "Venues", key: "venues", type: "search", subType: "Venue", multiple: true, class: "col-span-2" },
      { label: "Draw Type", key: "draw_type", type: "inputMenu", items: DRAW_OPTIONS, class: "col-span-2" },
      { label: "Draw Link", key: "draw_link", type: "textarea", class: "col-span-2" },
      { label: "Wikipedia Link", key: "wiki_link", type: "textarea", class: "col-span-2" }
    ].filter(Boolean) as FormFieldInterface<EditionFormSchema>[]
)
</script>

<template>
  <u-modal
    :title="year ? `${tournamentStore.name} ${year}` : 'Create Edition'"
    v-model:open="open"
  >
    <u-button
      :icon="edition ? ICONS.edit : icons.plus"
      :label="year ? `${tournamentStore.name} ${year}` : 'Create Edition'"
      block
      color="Doubles"
    />

    <template #body>
      <u-form
        id="edition-form"
        :schema="editionFormSchema"
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
        form="edition-form"
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
