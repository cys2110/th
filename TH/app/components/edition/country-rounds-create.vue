<script setup lang="ts">
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"
import { any, array, object, string, z } from "zod"

const tieSchema = object({
  round: RoundEnum,
  winner: string(),
  date: any().optional(),
  venue: object({
    id: string(),
    label: string(),
    icon: string()
  }).optional(),
  group_name: string().optional(),
  country_1_id: string(),
  country_2_id: string()
})

const schema = array(tieSchema).default([])
type Schema = z.infer<typeof schema>

const {
  ui: { icons }
} = useAppConfig()

const {
  params: { edId }
} = useRoute("edition")

const toast = useToast()
const supabase = useSupabaseClient()

const { results, loading, searchTerm } = useVenueSearch()

const isOpen = ref(false)
const isUploading = ref(false)
const errors = ref()

const entriesKey = computed(() => `${edId}-country-entries`)

const { data: entries, pending: entriesPending } = await useAsyncData(
  entriesKey,
  async () => {
    const { data, error } = await supabase
      .from("entries")
      .select("id, countries(*), events!inner(edition_id)")
      .eq("events.edition_id", Number(edId))
      .not("country_id", "is", null)

    if (error) {
      console.error("Error fetching entries:", error)
      return []
    }

    return data.map(entry => ({
      id: entry.id,
      label: entry.countries?.name,
      icon: getFlagCode(entry.countries as CountryInterface)
    }))
  },
  { default: () => [] }
)

const state = ref<Partial<Schema>>([])

const handleReset = () => {
  set(state, [])
  set(errors, undefined)
}

const onError = (event: FormErrorEvent) => {
  set(errors, event.errors)
}

const onSubmit = async (event: FormSubmitEvent<Schema>) => {
  set(isUploading, true)

  try {
    const uniqueRounds = useArrayUnique(event.data.map(tie => tie.round)).value

    const { data: rounds, error: roundsError } = await supabase
      .from("rounds")
      .insert(
        uniqueRounds.map(round => ({
          number: ROUND_NUMBER_MAPPING[round],
          round,
          draw: "Main",
          event_id: `${edId}-Country`
        }))
      )
      .select("id, round")

    if (roundsError) throw roundsError

    const { error } = await supabase.from("ties").insert(
      event.data.map((tie, index) => ({
        round_id: rounds.find(round => round.round === tie.round)!.id,
        date: tie.date?.toString() || null,
        venue_id: tie.venue?.id || null,
        group_name: tie.group_name || null,
        tie_number: index + 1,
        country_1_id: tie.country_1_id,
        country_2_id: tie.country_2_id,
        winner_id: tie.winner === "1" ? tie.country_1_id : tie.country_2_id,
        loser_id: tie.winner === "2" ? tie.country_1_id : tie.country_2_id
      }))
    )

    if (error) throw error

    toast.add({
      title: `Rounds successfully created!`,
      icon: icons.success,
      color: "success"
    })

    handleReset()
    set(isOpen, false)
  } catch (error) {
    set(errors, error)
    toast.add({
      title: `Error creating rounds`,
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
    title="Create Rounds"
    v-model:open="isOpen"
  >
    <u-button :icon="ICONS.level" />

    <template #body>
      <u-form
        id="rounds-form"
        :schema
        :state
        @submit="onSubmit"
        @error="onError"
        class="space-y-6"
      >
        <u-form
          v-for="(_, index) in state"
          :key="index"
          nested
          :name="index.toString()"
          :schema="tieSchema"
          class="space-y-3"
        >
          <form-field
            v-model="state[index]!"
            :field="{ label: 'Round', key: 'round', type: 'inputMenu', items: ROUNDS, required: true }"
          />

          <div class="grid grid-cols-2 items-center gap-3">
            <form-field
              v-model="state[index]!"
              :field="{
                label: 'Country 1',
                key: 'country_1_id',
                type: 'inputMenu',
                items: entries,
                loading: entriesPending,
                valueKey: 'id',
                labelKey: 'label',
                required: true
              }"
            />

            <form-field
              v-model="state[index]!"
              :field="{
                label: 'Country 2',
                key: 'country_2_id',
                type: 'inputMenu',
                items: entries,
                loading: entriesPending,
                valueKey: 'id',
                labelKey: 'label',
                required: true
              }"
            />

            <form-field
              v-model="state[index]!"
              :field="{ label: 'Winner', key: 'winner', type: 'radio', items: ['1', '2'], required: true }"
            />

            <form-field
              v-model="state[index]!"
              :field="{ label: 'Date', key: 'date', type: 'date' }"
            />
          </div>

          <u-form-field
            label="Venue"
            name="venue"
          >
            <u-input-menu
              v-model="state[index]!.venue"
              v-model:search-term="searchTerm"
              :items="results"
              :icon="ICONS.venue"
              :loading="loading"
              placeholder="Venue"
              class="w-full"
              clear
            />
          </u-form-field>

          <form-field
            v-model="state[index]!"
            :field="{ label: 'Group', key: 'group_name', type: 'text' }"
          />
        </u-form>

        <u-button
          :icon="icons.plus"
          label="Add tie"
          block
          @click="
            state.push({
              round: 'Final',
              winner: '',
              country_1_id: '',
              country_2_id: ''
            })
          "
        />
      </u-form>
    </template>

    <template #footer="{ close }">
      <form-footer
        form="rounds-form"
        :loading="isUploading"
        @reset="handleReset"
        @close="close"
      />
    </template>
  </u-modal>
</template>
