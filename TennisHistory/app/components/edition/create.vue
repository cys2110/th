<script setup lang="ts">
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"
import { PostgrestError } from "@supabase/supabase-js"
import { any, array, number, object, string, url, z } from "zod"

const schema = object({
  id: number("Edition ID must be a number").int("Edition ID must be an integer").positive("Edition ID must be a positive number"),
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
  ctrl_e: () => set(isOpen, !isOpen.value),
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
    const { dates, tours, ...rest } = event.data

    const { error } = await supabase.from("editions").insert({
      ...rest,
      start_date: dates?.start?.toString() || null,
      end_date: dates?.end?.toString() || null,
      tournament_id: Number(id),
      tours:
        tours.length ? tours
        : tournamentStore.tours.length ? tournamentStore.tours
        : []
    })

    if (error) throw error

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
        edId: event.data.id
      }
    })
  } catch (error) {
    set(errors, error instanceof PostgrestError ? error.details : (error as any).message)

    toast.add({
      title: `Error creating ${tournamentStore.name} ${event.data.year}`,
      icon: icons.error,
      color: "error"
    })
  } finally {
    set(isUploading, false)
  }
}

const formFields = computed<Array<FormFieldInterface<Schema>>>(
  () =>
    [
      { label: "Edition ID", key: "id", type: "text", subType: "number", required: true },
      { label: "Year", key: "year", type: "inputMenu", items: OPEN_ERA_YEARS, required: true, icon: ICONS.years },
      { label: "Sponsor Name", key: "sponsor_name", type: "text", class: "col-span-2" },
      ...(tournamentStore.tours.length > 1 ?
        [
          {
            label: "Tours",
            key: "tours",
            type: "checkbox",
            items: tournamentStore.tours,
            required: true,
            icon: ICONS.tour
          }
        ]
      : []),
      {
        label: "Category",
        key: "category",
        type: "inputMenu",
        items: CATEGORIES,
        icon: ICONS.category,
        class: tournamentStore.tours.length > 1 ? "col-span-1" : "col-span-2"
      },
      { label: "Dates", key: "dates", type: "dates", class: "col-span-2" },
      { label: "Award", type: "slot", errorPattern: /^(currency|tfc)$/, class: "col-span-2" },
      { label: "Wikipedia Link", key: "wiki_link", type: "textarea", class: "col-span-2" },
      { label: "Draw Type", key: "draw_type", type: "inputMenu", items: DRAWS, icon: ICONS.draw, class: "col-span-2" },
      { label: "Draw Link", key: "draw_link", type: "textarea", class: "col-span-2" }
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
      <u-form
        id="edition-form"
        ref="form"
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
        </div>
      </u-form>

      <u-alert
        v-if="errors"
        color="error"
        :title="`Error saving ${state.id}`"
        :description="errors"
        class="mt-5"
      />
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
