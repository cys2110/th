<script setup lang="ts">
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"
import { array, number, object, string, z } from "zod"

const playerSchema = object({
  id: string(),
  label: string(),
  icon: string()
})

const schema = array(
  object({
    country: string(),
    seed: number().optional(),
    singles: array(playerSchema).default([]),
    doubles: array(array(playerSchema)).default([]),
    unplayed: array(playerSchema).default([]),
    withdrawals: array(
      object({
        player: playerSchema,
        reason: string().optional()
      })
    )
  })
)
type Schema = z.infer<typeof schema>

const emits = defineEmits<{ refresh: [] }>()

const {
  params: { edId }
} = useRoute("edition")

const {
  ui: { icons }
} = useAppConfig()

const toast = useToast()
const supabase = useSupabaseClient()

const isOpen = ref(false)
const isUploading = ref(false)
const errors = ref()
const form = useTemplateRef("form")

defineShortcuts({
  ctrl_a: () => set(isOpen, !isOpen.value),
  ctrl_r: () => handleReset(),
  ctrl_enter: () => form.value?.submit()
})

const { data: countries, pending: countriesPending } = await useAsyncData(
  "countries",
  async () => {
    const { data, error } = await supabase.from("countries").select("*").order("name", { ascending: true })

    if (error || !data) {
      console.error("Error fetching countries:", error)
      return []
    }

    const dataWithIcons = data.map(country => ({
      ...country,
      icon: getFlagCode(country)
    }))

    return dataWithIcons
  },
  { default: () => [] }
)

const state = ref<Schema>([])

const handleReset = () => {
  set(state, [])
  set(errors, undefined)
}

const onError = (event: FormErrorEvent) => {
  set(errors, event.errors)
}

const onSubmit = async (event: FormSubmitEvent<Schema>) => {
  set(isUploading, true)

  const eventId = `${edId}-Country`

  try {
    const { error } = await supabase.from("entries").insert(
      event.data.flatMap(entry => {
        return [
          { id: `${eventId} ${entry.country}`, event_id: eventId, country_id: entry.country },
          ...entry.singles.map(player => ({ id: `${eventId} ${player.id}`, event_id: eventId, match_type: "Singles" as const })),
          ...entry.doubles.map(team => ({
            id: `${eventId} ${team.map(player => player.id).join(" ")}`,
            event_id: eventId,
            match_type: "Doubles" as const
          })),
          ...entry.withdrawals.map(wd => ({ id: `${eventId} ${wd.player.id}`, event_id: eventId }))
        ]
      })
    )

    if (error) throw error

    const { error: mappingError } = await supabase.from("player_entry_mapping").insert(
      event.data.flatMap(entry => {
        const allPlayers = useArrayUnique([
          ...entry.singles.map(player => player.id),
          ...entry.doubles.flatMap(team => team.map(player => player.id)),
          ...entry.unplayed.map(player => player.id),
          ...entry.withdrawals.map(wd => wd.player.id)
        ]).value

        return [
          ...allPlayers.map(player => ({ player_id: player, entry_id: `${eventId} ${entry.country}` })),
          ...entry.singles.map(player => ({ player_id: player.id, entry_id: `${eventId} ${player.id}` })),
          ...entry.doubles.flatMap(team =>
            team.map(player => ({ player_id: player.id, entry_id: `${eventId} ${team.map(player => player.id).join(" ")}` }))
          ),
          ...entry.withdrawals.map(wd => ({ player_id: wd.player.id, entry_id: `${eventId} ${wd.player.id}` }))
        ]
      })
    )

    if (mappingError) throw mappingError

    const entriesWithSeeds = event.data.filter(entry => entry.seed)

    if (entriesWithSeeds.length) {
      const { error: seedsError } = await supabase
        .from("seeds")
        .insert(entriesWithSeeds.map(entry => ({ entry_id: `${eventId} ${entry.country}`, event_id: eventId, seed: entry.seed, draw: "Main" })))

      if (seedsError) throw seedsError
    }

    const withdrawals = event.data.flatMap(entry => entry.withdrawals)

    if (withdrawals.length) {
      const { error: withdrawalEntries } = await supabase
        .from("withdrawals")
        .insert(withdrawals.map(wd => ({ event_id: eventId, entry_id: `${eventId} ${wd.player.id}`, reason: wd.reason })))

      if (withdrawalEntries) throw withdrawalEntries
    }

    toast.add({
      title: `Entries for ${edId} successfully created!`,
      icon: icons.success,
      color: "success"
    })

    emits("refresh")
    handleReset()
    set(isOpen, false)
  } catch (error) {
    set(errors, error)
    toast.add({
      title: `Error creating entries`,
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
    title="Create Entries"
    v-model:open="isOpen"
  >
    <u-button :icon="icons.plus" />

    <template #body>
      <u-form
        id="entries-form"
        ref="form"
        :schema
        :state
        @submit="onSubmit"
        @error="onError"
        class="space-y-6"
      >
        <u-form
          v-for="(entry, index) in state"
          :key="index"
          nested
          :name="index.toString()"
          :schema="schema.element"
          class="space-y-3"
        >
          <u-form-field
            label="Country"
            key="country"
            required
          >
            <u-input-menu
              v-model="state[index]!.country"
              :items="countries"
              :icon="ICONS.globe"
              :loading="countriesPending"
              label-key="name"
              value-key="id"
              placeholder="Country"
              clear
              class="w-full"
            />
          </u-form-field>

          <form-field
            :field="{ label: 'Seed', key: 'seed', type: 'number' }"
            v-model="state[index]!"
          />

          <u-form-field
            label="Singles"
            key="singles"
            required
          >
            <player-search
              v-model="state[index]!.singles"
              multiple
            />
          </u-form-field>

          <u-form-field
            v-for="(team, i) in state[index]!.doubles"
            :key="i"
            :name="`${index}.doubles.${i}`"
            :label="i === 0 ? 'Doubles' : undefined"
          >
            <u-field-group>
              <player-search
                v-model="state[index]!.doubles[i]"
                multiple
              />

              <u-button
                :icon="icons.error"
                @click="state[index]!.doubles.splice(i, 1)"
                color="error"
              />
            </u-field-group>
          </u-form-field>

          <u-button
            :icon="icons.plus"
            label="Add doubles team"
            block
            @click="state[index]!.doubles.push([])"
          />

          <u-form-field
            label="Other Team Members"
            key="unplayed"
            required
          >
            <player-search
              v-model="state[index]!.unplayed"
              multiple
            />
          </u-form-field>

          <u-form-field
            v-for="(player, i) in state[index]!.withdrawals"
            :key="i"
            :name="`${index}.withdrawals.${i}`"
            :label="i === 0 ? 'Withdrawals' : undefined"
          >
            <u-field-group>
              <player-search v-model="state[index]!.withdrawals[i]!.player" />

              <form-input
                placeholder="Reason"
                v-model="state[index]!.withdrawals[i]!.reason"
              />

              <u-button
                :icon="icons.error"
                @click="state[index]!.withdrawals.splice(i, 1)"
                color="error"
              />
            </u-field-group>
          </u-form-field>

          <u-button
            :icon="icons.plus"
            label="Add withdrawal"
            block
            @click="
              state[index]!.withdrawals.push({
                player: {
                  id: '',
                  label: '',
                  icon: ''
                }
              })
            "
          />
        </u-form>

        <u-button
          :icon="icons.plus"
          label="Add entry"
          block
          @click="
            state.push({
              country: '',
              singles: [],
              doubles: [],
              unplayed: [],
              withdrawals: []
            })
          "
        />
      </u-form>

      <u-alert
        v-if="errors"
        color="error"
        :title="`Error creating entries for ${edId}`"
        :description="errors"
        class="mt-5"
      />
    </template>

    <template #footer="{ close }">
      <form-footer
        form="entries-form"
        :loading="isUploading"
        @reset="handleReset"
        @close="close"
      />
    </template>
  </u-modal>
</template>
