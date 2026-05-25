<script setup lang="ts">
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"
import { PostgrestError } from "@supabase/supabase-js"
import { array, number, object, string, z } from "zod"

const schema = object({
  round: RoundEnum,
  tour: TourEnum,
  match_type: MatchTypeEnum,
  points: number("Points must be a number").nonnegative("Points cannot be a negative number").optional(),
  pm: number("Prize money must be a number").nonnegative("Prize money cannot be a negative number").optional(),
  pm_tiered: array(string()).default([])
})
type Schema = z.infer<typeof schema>

const emits = defineEmits<{ refresh: [] }>()

const {
  ui: { icons }
} = useAppConfig()

const {
  params: { edId }
} = useRoute("edition")

const toast = useToast()
const supabase = useSupabaseClient()

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

const { data: currencies } = await useAsyncData("currencies", async () => {
  const { data, error } = await supabase.from("events").select("currency, tour").eq("edition_id", Number(edId))

  if (error) {
    console.error("Error fetching currencies:", error)
    return {}
  }

  const currencyMap: Partial<Record<TourType, CurrencyType>> = {}

  data.forEach(event => {
    if (event.tour && event.currency) currencyMap[event.tour] = event.currency
  })

  return currencyMap
})

const state = ref<Partial<Schema>>({
  tour: tournamentStore.tours[0]
})

const formatTieredPm = (pm: string) => {
  const numberPm = Number(pm)

  if (isNaN(numberPm)) {
    toast.add({
      title: "Prize money must be a number",
      icon: icons.error,
      color: "error"
    })
  }

  return numberPm.toLocaleString("en-GB", {
    style: "currency",
    currency: currencies.value ? currencies.value[state.value.tour as keyof typeof currencies.value] : "USD"
  })
}

const parseCurrency = (value: string) => {
  return Number(value.replace(/[^0-9.-]+/g, ""))
}

const handleReset = () => {
  const { tour, match_type } = state.value
  set(state, { tour, match_type })
  set(errors, undefined)
}

const onError = (event: FormErrorEvent) => {
  set(errors, event.errors)
}

const onSubmit = async (event: FormSubmitEvent<Schema>) => {
  set(isUploading, true)

  try {
    const { error } = await supabase.from("rounds").insert({
      ...event.data,
      event_id: `${edId}-${event.data.tour}`,
      draw: event.data.round.includes("Qualifying") || event.data.round === "Qualifier" ? "Qualifying" : "Main",
      number: ROUND_NUMBER_MAPPING[event.data.round],
      pm_tiered: event.data.pm_tiered.map(pm => parseCurrency(pm))
    })

    if (error) throw error

    toast.add({
      title: `${event.data.tour} ${event.data.match_type} ${event.data.round} successfully created!`,
      icon: icons.success,
      color: "success"
    })

    emits("refresh")
    handleReset()
    set(isOpen, false)
  } catch (error) {
    set(errors, error instanceof PostgrestError ? error.details : (error as any).message)

    toast.add({
      title: `Error creating ${event.data.tour} ${event.data.match_type} ${event.data.round}`,
      icon: icons.error,
      color: "error"
    })
  } finally {
    set(isUploading, false)
  }
}
</script>

<template>
  <u-modal
    title="Create Round"
    v-model:open="isOpen"
  >
    <u-button :icon="icons.plus" />

    <template #body>
      <u-alert
        v-if="errors"
        color="error"
        title="Error saving round"
        :description="errors"
        class="mb-5"
      />

      <u-form
        id="award-form"
        ref="form"
        :schema
        :state
        @submit="onSubmit"
        @error="onError"
        class="space-y-3"
      >
        <div
          class="grid items-center gap-3"
          :class="tournamentStore.tours.length > 1 ? 'grid-cols-2' : 'grid-cols-1'"
        >
          <u-form-field
            v-if="tournamentStore.tours.length > 1"
            name="tour"
            label="Tour"
            required
          >
            <u-radio-group
              :items="tournamentStore.tours"
              v-model="state.tour"
              orientation="horizontal"
              loop
            />
          </u-form-field>

          <u-form-field
            name="match_type"
            label="S/D"
            required
          >
            <u-radio-group
              :items="[...MATCH_TYPES]"
              v-model="state.match_type"
              orientation="horizontal"
              loop
            />
          </u-form-field>
        </div>

        <u-form-field
          name="round"
          label="Round"
          required
          class="col-span-2"
        >
          <u-input-menu
            v-model="state.round"
            :items="[...ROUNDS]"
            placeholder="Select round"
            :icon="ICONS.level"
            clear
            class="w-full"
          />
        </u-form-field>

        <div class="grid grid-cols-2 items-center gap-3">
          <u-form-field
            name="pm"
            label="Prize Money"
          >
            <form-input-number
              v-model="state.pm"
              placeholder="Enter prize money"
              :currency="currencies ? currencies[state.tour as keyof typeof currencies] : 'USD'"
            />
          </u-form-field>

          <u-form-field
            name="points"
            label="Points"
          >
            <form-input-number
              v-model="state.points"
              placeholder="Enter points"
            />
          </u-form-field>
        </div>

        <u-form-field
          name="pm_tiered"
          label="Tiered Prize Money"
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
