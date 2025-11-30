<script setup lang="ts">
import { parseDate } from "@internationalized/date"
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"
import { cloneDeep, isEqual } from "lodash"

const { edition, tournament, refresh } = defineProps<{
  edition?: EditionType
  tournament?: TournamentType
  refresh?: () => void
}>()

const {
  params: { id, name, year }
} = useRoute("edition")

const toast = useToast()
const {
  ui: { icons }
} = useAppConfig()
const open = ref(false)
const uploading = ref(false)

const initialState = {
  ...edition,
  currency: edition?.currency ? { value: edition.currency, label: currencyEnum[edition.currency as keyof typeof currencyEnum] } : undefined,
  tournament: Number(id),
  year: year ? Number(year) : undefined,
  tours: (edition?.tours ?? tournament?.tours!).map(tour => {
    return tourEnum[tour]
  }),
  dates: {
    start: edition?.start_date ? parseDate(edition.start_date) : undefined,
    end: edition?.end_date ? parseDate(edition.end_date) : undefined
  },
  surface: edition?.surface?.id,
  venues: edition?.venues
    ? edition.venues.map(v => ({ value: v.id, label: v.name ? `${v.name}, ${v.city}, ${v.country!.name}` : `${v.city}, ${v.country!.name}` }))
    : undefined
}

const state = ref<Partial<EditionFormInput>>(cloneDeep(initialState))

const formFields = computed<FormFieldInterface<EditionFormSchema>[]>(
  () =>
    [
      !edition && { label: "ID", key: "id", type: "text", subType: "number", required: true },
      { label: "Year", key: "year", type: "inputMenu", items: ALL_YEARS, required: true },
      { label: "Sponsor Name", key: "sponsor_name", type: "text", class: "col-span-2" },
      ((tournament?.tours && tournament?.tours.length > 1) || (edition?.tournament?.tours && edition?.tournament?.tours.length > 1)) && {
        label: "Tours",
        key: "tours",
        type: "checkbox",
        required: true,
        items:
          edition?.tournament?.tours || tournament?.tours
            ? (edition?.tournament?.tours || tournament?.tours!).map((t: any) => ({ label: t, value: tourEnum[t as keyof typeof tourEnum] }))
            : TOUR_OPTIONS
      },
      {
        label: "Category",
        key: "category",
        type: "text",
        class: (tournament?.tours && tournament?.tours.length > 1) || edition ? "col-span-1" : "col-span-2"
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

const handleReset = () => set(state, cloneDeep(initialState))

const onError = (event: FormErrorEvent) => console.error(event.errors)

const onSubmit = async (event: FormSubmitEvent<EditionFormSchema>) => {
  set(uploading, true)

  // Get dirty fields from the form
  const fields = Object.keys(event.data) as (keyof EditionFormSchema)[]
  const dirtyFields: Partial<EditionFormSchema> = {}
  fields.forEach(field => {
    if (!isEqual(event.data[field], initialState[field])) {
      // @ts-expect-error
      dirtyFields[field] = event.data[field] ?? null
    }
  })

  if (Object.keys(dirtyFields).length) {
    dirtyFields["id"] = event.data.id // Always include the edition ID
    dirtyFields["tournament"] = event.data.tournament // Always include the tournament ID
    dirtyFields["tours"] = event.data.tours // Always include the tours

    const response = await $fetch(`/api/editions/${edition ? "update" : "create"}`, {
      method: "POST",
      body: dirtyFields
    })

    if ((response as any).ok) {
      toast.add({
        title: `${edition?.tournament?.name ?? tournament?.name} ${event.data.year} ${edition ? "updated" : "created"}`,
        icon: icons.success,
        color: "success"
      })

      if (refresh) {
        refresh() // Refresh edition details
        handleReset() // Reset form
      } else {
        handleReset() // Reset form
        // Navigate to the new edition page
        await navigateTo({
          name: "edition",
          params: { id, name, edId: event.data.id, year: event.data.year }
        })
      }

      set(open, false) // Close modal
    } else {
      toast.add({
        title: `Error ${edition ? "updating" : "creating"} edition`,
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
    :title="edition && year ? `${edition.tournament?.name} ${year}` : 'Create Edition'"
    v-model:open="open"
  >
    <u-button
      :icon="edition ? ICONS.edit : icons.plus"
      :label="edition && year ? `${edition.tournament?.name} ${year}` : 'Create Edition'"
      block
    />

    <template #body>
      <!--@vue-expect-error-->
      <u-form
        id="edition-form"
        :schema="editionFormSchema"
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
