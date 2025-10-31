<script setup lang="ts">
import { parseDate } from "@internationalized/date"
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"
const { edition, refresh } = defineProps<{
  edition?: EditionInterface
  refresh?: () => void
  iconOnly?: boolean
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
const tournamentName = useState<string>("tournamentName")
const tours = useState<(keyof typeof TourEnum)[]>("tours")

defineShortcuts({
  meta_enter: () => (edition ? undefined : set(open, !get(open))),
  meta_shift_e: () => (edition ? set(open, !get(open)) : undefined)
})

const state = reactive<Partial<EditionInput>>({
  ...edition,
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
  start_date: edition?.start_date ? parseDate(edition.start_date) : undefined,
  end_date: edition?.end_date ? parseDate(edition.end_date) : undefined,
  surface: edition?.surface?.id,
  venues: edition?.venues
    ? edition.venues.map(v => ({ value: v.id, label: v.name ? `${v.name}, ${v.city}, ${v.country.name}` : `${v.city}, ${v.country.name}` }))
    : undefined
})

const formFields = computed<FormFieldInterface<EditionSchema>[]>(
  () =>
    [
      { label: "ID", key: "id", type: "text", subType: "number" },
      { label: "Year", key: "year", type: "inputMenu", items: ALL_YEARS },
      {
        label: "Tournament",
        key: "tournament",
        type: "search",
        subType: "tournaments",
        class: !tours || tours.value.length > 1 ? "col-span-1" : "col-span-2"
      },
      (!tours || tours.value.length > 1) && {
        label: "Tours",
        key: "tours",
        type: "checkbox",
        items: tours.value?.length ? tours.value.map(t => ({ label: TourEnum[t], value: t })) : TOUR_OPTIONS
      },
      { label: "Sponsor Name", key: "sponsor_name", type: "text", class: "col-span-2" },
      { label: "Start Date", key: "start_date", type: "date" },
      { label: "End Date", key: "end_date", type: "date" },
      { label: "Surface", key: "surface", type: "inputMenu", items: SURFACE_OPTIONS },
      { label: "Venues", key: "venues", type: "search", subType: "venues", multiple: true },
      { label: "Currency", key: "currency", type: "checkbox", items: CURRENCY_OPTIONS },
      { label: "Total Financial Commitment", key: "tfc", type: "currency" },
      { label: "Category", key: "category", type: "text" },
      { label: "Draw Type", key: "draw_type", type: "inputMenu", items: DRAW_OPTIONS },
      { label: "Draw Link", key: "draw_link", type: "textarea", class: "col-span-2" },
      { label: "Wikipedia Link", key: "wiki_link", type: "textarea", class: "col-span-2" }
    ].filter(Boolean) as FormFieldInterface<EditionSchema>[]
)

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
  console.error(event.errors)
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
      } else {
        await navigateTo({
          name: "edition",
          params: {
            id,
            name,
            edId: event.data.id,
            year: event.data.year
          }
        })
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
      :label="iconOnly ? undefined : edition ? `Edit ${edition.tournament.name} ${year}` : 'Create Edition'"
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
          <template
            v-for="field in formFields"
            :key="field.label"
          >
            <form-input
              v-if="field.type === 'text'"
              v-model="state[field.key]"
              :placeholder="field.label"
              :type="field.subType"
              :class="field.class"
            />

            <form-select-search
              v-else-if="field.type === 'search'"
              v-model="(state[field.key] as any)"
              :type="field.subType!"
              :placeholder="field.label"
              block
              :class="field.class"
            />

            <u-checkbox-group
              v-else-if="field.type === 'checkbox'"
              v-model="(state[field.key] as any)"
              :items="field.items"
              :legend="field.label"
              orientation="horizontal"
            />

            <form-select-menu
              v-else-if="field.type === 'inputMenu'"
              v-model="(state[field.key] as any)"
              :items="(field.items as any[])"
              :placeholder="field.label"
              :multiple="field.multiple"
              block
            />

            <form-date-picker
              v-else-if="field.type === 'date'"
              v-model="(state[field.key] as any)"
              :placeholder="field.label"
            />

            <form-textarea
              v-else-if="field.type === 'textarea'"
              v-model="(state[field.key] as string)"
              :placeholder="field.label"
              :class="field.class"
            />

            <form-currency
              v-else
              v-model="(state[field.key] as number)"
              :placeholder="field.label"
              :currency="(state['currency'] as keyof typeof CurrencyEnum)"
            />
          </template>
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
