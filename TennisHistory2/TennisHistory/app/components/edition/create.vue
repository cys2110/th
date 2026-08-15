<script setup lang="ts">
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"
import { any, array, number, object, string, url, z } from "zod"

const schema = object({
  number: number("Edition ID must be a number").int("Edition ID must be an integer").positive("Edition ID must be a positive number").optional(),
  year: number("Year must be a number").int("Year must be an integer").positive("Year must be a positive number"),
  tours: array(TourEnum).default([]),
  dates: any().optional(),
  sponsor_name: string().optional(),
  category: CategoryEnum.optional(),
  currency: CurrencyEnum.optional(),
  wiki_link: url("Wikipedia link must be valid URL").optional(),
  tfc: number("Total financial commitment must be a number").nonnegative("Total financial commitment cannot be a negative number").optional(),
  draw_link: url("Draw link must be a valid URL").optional(),
  draw_type: DrawsEnum.optional()
})
type Schema = z.infer<typeof schema>

const {
  ui: { icons }
} = useAppConfig()

const router = useRouter()
const toast = useToast()
const supabase = useSupabaseClient()

const {
  params: { id, name }
} = useRoute("tournament")

const tournamentStore = useTournamentStore()

const isOpen = ref(false)
const isUploading = ref(false)
const errors = ref()
const form = useTemplateRef("form")

defineShortcuts({
  ctrl_a: () => set(isOpen, !isOpen.value),
  ctrl_r: () => set(state, {}),
  ctrl_enter: () => form.value?.submit()
})

const state = ref<Partial<Schema>>({})

const handleReset = () => {
  set(state, {})
  set(errors, undefined)
}

const onError = (event: FormErrorEvent) => {
  set(errors, event.errors)
}

const onSubmit = async (event: FormSubmitEvent<Schema>) => {
  set(isUploading, true)

  try {
    const { dates, tours, number, ...rest } = event.data

    const edId = `${id}${event.data.year}${number || ""}`

    const { error } = await supabase.from("editions").insert({
      ...rest,
      id: Number(edId),
      start_date: dates?.start?.toString() || null,
      end_date: dates?.end?.toString() || null,
      tournament_id: Number(id),
      tours:
        tours.length ? tours
        : tournamentStore.tours.length ? tournamentStore.tours
        : []
    })

    if (error) {
      set(errors, error)

      toast.add({
        title: `Error creating ${tournamentStore.name} ${event.data.year}`,
        icon: icons.error,
        color: "error"
      })
    }

    toast.add({
      title: `${tournamentStore.name} ${event.data.year} successfully created!`,
      icon: icons.success,
      color: "success"
    })

    router.push({
      name: "edition",
      params: {
        id,
        name,
        year: event.data.year,
        edId
      }
    })
  } finally {
    set(isUploading, false)
  }
}

const formFields = computed<Array<FormFieldInterface<Schema>>>(
  () =>
    [
      { label: "Sponsor Name", key: "sponsor_name", type: "text" },
      { label: "Dates", key: "dates", type: "dates" },
      { label: "Wikipedia Link", key: "wiki_link", type: "textarea" },
      {
        label: "Category",
        key: "category",
        type: "inputMenu",
        items: CATEGORIES,
        icon: ICONS.category
      },
      { label: "Award", type: "slot", errorPattern: /^(currency|tfc)$/ },
      { label: "Draw Type", key: "draw_type", type: "inputMenu", items: DRAWS },
      { label: "Draw Link", key: "draw_link", type: "textarea" }
    ] as Array<FormFieldInterface<Schema>>
)
</script>

<template>
  <u-modal
    title="Create Edition"
    v-model:open="isOpen"
  >
    <u-button :icon="icons.plus" />

    <template #body>
      <u-alert
        v-if="errors"
        color="error"
        :title="`Error saving ${id}${state.year}${state.number || ''}`"
        :description="errors"
        class="mb-5"
      />

      <u-form
        id="edition-form"
        ref="form"
        :schema
        :state
        @submit="onSubmit"
        @error="onError"
        class="space-y-3"
      >
        <div
          class="grid items-center gap-3"
          :class="tournamentStore.tours.length > 1 ? 'grid-cols-3' : 'grid-cols-2'"
        >
          <form-field
            :field="{ label: 'Edition Number', key: 'number', type: 'text', subType: 'number' }"
            v-model="state"
          />

          <form-field
            :field="{ label: 'Year', key: 'year', type: 'inputMenu', items: OPEN_ERA_YEARS, required: true, icon: ICONS.years }"
            v-model="state"
          />

          <form-field
            v-if="tournamentStore.tours.length > 1"
            :field="{ label: 'Tours', key: 'tours', type: 'checkbox', items: tournamentStore.tours, required: true, icon: ICONS.tour }"
            v-model="state"
          />
        </div>

        <form-field
          v-for="field in formFields"
          :key="field.label"
          :field
          v-model="state"
        >
          <u-field-group>
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
