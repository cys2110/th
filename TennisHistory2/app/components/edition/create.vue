<script setup lang="ts">
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"
import { CalendarDate } from "@internationalized/date"

const {
  ui: { icons }
} = useAppConfig()

const router = useRouter()
const toast = useToast()
const supabase = useSupabaseClient()

const tournamentStore = useTournamentStore()

const isOpen = ref(false)
const isUploading = ref(false)
const errors = ref()

const initialState = {
  tournament_id: Number(tournamentStore.id),
  tours: tournamentStore.tours
}

const state = ref<Partial<EditionCreateType>>({ ...initialState })
const dates = shallowRef<{ start: CalendarDate | undefined; end: CalendarDate | undefined }>({ start: undefined, end: undefined })

watch(
  dates,
  newDates => {
    state.value.start_date = newDates.start?.toString() || null
    state.value.end_date = newDates.end?.toString() || null
  },
  { deep: true }
)

const handleReset = () => {
  set(state, { ...initialState })
  errors.value = undefined
}

const onError = (event: FormErrorEvent) => (errors.value = event.errors)

const onSubmit = async (event: FormSubmitEvent<EditionCreateType>) => {
  set(isUploading, true)

  const { error } = await supabase.from("editions").insert(event.data)

  if (error) {
    errors.value = error
    set(isUploading, false)
    return
  }

  toast.add({
    title: `${tournamentStore.name} ${event.data.year} successfully created!`,
    description: JSON.stringify(event.data),
    icon: icons.success,
    color: "success"
  })

  router.push({
    name: "edition",
    params: {
      id: tournamentStore.id,
      name: kebabCase(tournamentStore.paramName),
      year: event.data.year,
      edId: event.data.id
    }
  })
}

const formFields = computed<FormFieldInterface<EditionCreateType>[]>(() => {
  const fields: FormFieldInterface<EditionCreateType>[] = [
    { label: "ID", key: "id", type: "text", subType: "number", required: true },
    { label: "Year", key: "year", type: "inputMenu", items: ALL_YEARS, required: true, icon: ICONS.years },
    {
      label: "Sponsor Name",
      key: "sponsor_name",
      type: "text",
      class: tournamentStore.tours.length > 1 ? "col-span-2" : "col-span-1"
    }
  ]

  if (tournamentStore.tours.length > 1) {
    fields.push({
      label: "Tours",
      key: "tours",
      type: "checkbox",
      items: tournamentStore.tours.length ? tournamentStore.tours : TOUR_OPTIONS,
      required: true,
      icon: ICONS.tour
    })
  }

  fields.push(
    {
      label: "Category",
      key: "category",
      type: "inputMenu",
      items: CATEGORIES,
      icon: ICONS.category,
      class: tournamentStore.tours.length > 1 ? "col-span-2" : "col-span-1"
    },
    { label: "Dates", type: "dates", class: "col-span-2" },
    { label: "Award", type: "slot", errorPattern: /^(currency|tfc)$/, class: "col-span-2" },
    { label: "Draw Type", key: "draw_type", type: "inputMenu", items: DRAWS, icon: ICONS.draw, class: "col-span-2", rotateIcon: true },
    { label: "Draw Link", key: "draw_link", type: "textarea", class: "col-span-2", icon: ICONS.group },
    { label: "Wikipedia Link", key: "wiki_link", type: "textarea", class: "col-span-2", icon: ICONS.wikipedia }
  )

  return fields
})
</script>

<template>
  <u-modal
    title="Create Edition"
    v-model:open="isOpen"
  >
    <u-button
      color="warning"
      :icon="icons.plus"
    />

    <template #body>
      <u-form
        id="edition-form"
        :schema="EditionCreateSchema"
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
            v-model:dates="dates"
          >
            <u-field-group class="w-full">
              <u-input-menu
                placeholder="e.g., $"
                :items="CURRENCY_OPTIONS"
                v-model="state.currency"
                value-key="value"
                label-key="label"
              />

              <form-input-number
                placeholder="Enter TFC"
                :currency="state.currency || 'USD'"
                v-model="state.tfc"
              />
            </u-field-group>
          </form-field>
        </div>
      </u-form>

      <u-alert
        v-if="errors"
        color="error"
        :title="`Error saving ${state.id}`"
        class="mt-5"
      >
        <template #description>
          {{ errors }}
        </template>
      </u-alert>
    </template>

    <template #footer="{ close }">
      <form-footer
        form="edition-form"
        :is-uploading
        @reset="handleReset"
        @close="close"
      />
    </template>
  </u-modal>
</template>
