<script setup lang="ts">
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"
import { array, coerce, object, string, z } from "zod"
import { set } from "@vueuse/core"
import type { TourEnum as TourType } from "#imports"

const schema = object({
  round: string().min(1, "Round is required"),
  tour: TourEnum,
  match_type: MatchTypeEnum,
  points: coerce.number().nonnegative("Points cannot be a negative number").optional(),
  pm: coerce.number().nonnegative("Prize money cannot be a negative number").optional(),
  pm_tiered: array(string()).default([])
})
type SchemaInput = z.input<typeof schema>
type Schema = z.infer<typeof schema>

const props = defineProps<{ options: Array<{ event_id: string; tour: TourType; currency: string }> }>()

const emits = defineEmits<{ refresh: [] }>()

defineShortcuts({
  ctrl_a: () => set(isOpen, !isOpen.value)
})

const route = useRoute("edition")
const toast = useToast()
const supabase = useSupabaseClient()
const { ui } = useAppConfig()

const tournamentStore = useTournamentStore()

const isOpen = ref(false)
const isUploading = ref(false)

const state = ref<Partial<SchemaInput>>({})

const formatTieredPm = (pm: string) => {
  const numberPm = Number(pm)

  if (isNaN(numberPm)) {
    toast.add({
      title: "Prize money must be a number",
      icon: ui.icons.error,
      color: "error"
    })
  }

  return numberPm.toLocaleString("en-GB", { style: "currency", currency: props.options.find(o => o.tour === state.value.tour)?.currency || "USD" })
}

const parseCurrency = (value: string) => {
  return Number(value.replace(/[^0-9.-]+/g, ""))
}

const handleReset = () => {
  const { tour, match_type } = state.value
  set(state, { tour, match_type })
}

const onError = (event: FormErrorEvent) => {
  toast.add({
    title: "Validation error",
    icon: ui.icons.error,
    color: "error"
  })
  console.error("Validation error:", event)
}

const onSubmit = async (event: FormSubmitEvent<Schema>) => {
  set(isUploading, true)

  try {
    const isQualifyingRound = event.data.round.includes("Qualifying") || event.data.round === "Qualifier"

    const { error } = await supabase
      .schema("tennis")
      .from("rounds")
      .insert({
        ...event.data,
        draw: isQualifyingRound ? "Qualifying" : "Main",
        pm_tiered: event.data.pm_tiered.map(pm => parseCurrency(pm)),
        // @ts-expect-error
        number: ROUND_NUMBER_MAPPING[event.data.round as keyof typeof ROUND_NUMBER_MAPPING],
        event_id: props.options.find(o => o.tour === event.data.tour)!.event_id
      })

    if (error) {
      console.error("Error creating round:", error)
      throw Error
    }

    toast.add({
      title: `${event.data.tour} ${event.data.match_type} ${event.data.round} successfully created!`,
      icon: ui.icons.success,
      color: "success"
    })

    handleReset()
    emits("refresh")
    set(isOpen, false)
  } catch (error) {
    toast.add({
      title: `Error creating ${event.data.tour} ${event.data.match_type} ${event.data.round}`,
      icon: ui.icons.error,
      color: "error"
    })
  } finally {
    set(isUploading, false)
  }
}

const formFields = computed<Array<FormFieldInterface<Schema>>>(() => [
  { label: "tour", key: "tour", type: "radio", items: props.options.map(o => o.tour) },
  { label: "Match Type", key: "match_type", type: "radio", items: MATCH_TYPES },
  { label: "Round", key: "round", type: "inputMenu", items: ROUNDS, required: true, class: "col-span-2" },
  { label: "Points", key: "points", type: "number" },
  {
    label: "Prize Money",
    key: "pm",
    type: "number",
    currency: props.options.find(o => o.tour === state.value.tour)?.currency || "USD",
    disabled: !state.value.tour
  }
])
</script>

<template>
  <u-modal
    title="Create Round"
    v-model:open="isOpen"
  >
    <u-button :icon="ui.icons.plus" />

    <template #body>
      <u-form
        id="award-form"
        :schema
        :state
        @submit="onSubmit"
        @error="onError"
      >
        <div class="grid grid-cols-2 gap-3">
          <form-field
            v-for="field in formFields"
            :key="field.label"
            :field
            v-model="state"
          />
        </div>

        <u-form-field
          name="pm_tiered"
          label="Tiered Prize Money"
          class="mt-3"
        >
          <u-input-tags
            v-model="state.pm_tiered"
            placeholder="Tiered prize money"
            :convert-value="formatTieredPm"
            class="w-full"
          />
        </u-form-field>
      </u-form>
    </template>

    <template #footer="{ close }">
      <form-footer
        form="award-form"
        :loading="isUploading"
        @reset="handleReset"
        @close="close"
      />
    </template>
  </u-modal>
</template>
