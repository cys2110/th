<script setup lang="ts">
import { array, boolean, number, object, string, z } from "zod"
import { set } from "@vueuse/core"
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"
import { ICONS, PENALTY_OUTCOME_MAPPING } from "#imports"
import { type Tables } from "~/types/database.types"

type TeamType = Pick<Tables<{ schema: "football" }, "team">, "id" | "name" | "short_name" | "logo_url">

const penaltySchema = object({
  player: object({ id: string() }),
  team: object({ id: string() }),
  goalkeeper: object({ id: string() }),
  attempt_number: number().int("Attempt number must be an integer").nonnegative("Attempt number cannot be negative"),
  outcome: string().min(1, "Outcome is required"),
  is_sudden_death: boolean().default(false)
})
type PenaltySchema = z.infer<typeof penaltySchema>

const schema = array(penaltySchema).default([])

type Schema = z.infer<typeof schema>

const props = defineProps<{
  homeTeam: TeamType
  awayTeam: TeamType
}>()

const emits = defineEmits<{ refresh: [] }>()

const route = useRoute("match")
const toast = useToast()
const supabase = useSupabaseClient()
const { ui } = useAppConfig()

const {
  data: players,
  pending,
  refresh
} = await useAsyncData(
  () => `match-lineups-${route.params.match_id}`,
  async () => {
    const { data, error } = await supabase
      .from("match_lineup")
      .select("team_id, shirt_number, starter, captain, position, ...player(id, aka, ...people(full_name, ...country!nationality_country_id(icon)))")
      .eq("match_id", route.params.match_id)
      .order("captain", { ascending: false })
      .order("starter", { ascending: false })
      .order("shirt_number", { ascending: true })

    if (error || !data) {
      console.error("Error fetching match lineups:", error)
      return { home: [], away: [] }
    }

    return {
      home: data
        .filter(item => item.team_id === props.homeTeam.id)
        .map(item => ({
          ...item,
          name: item.aka || item.full_name
        })),
      away: data
        .filter(item => item.team_id === props.awayTeam.id)
        .map(item => ({
          ...item,
          name: item.aka || item.full_name
        }))
    }
  },
  { default: () => ({ home: [], away: [] }) }
)

const isOpen = ref(false)
const isSaving = ref(false)
const errors = ref()

const state = ref<Schema>([])

const handleReset = () => {
  set(state, [])
  set(errors, undefined)
}

const onError = (event: FormErrorEvent) => {
  console.error(event.errors)
  set(errors, JSON.stringify(event.errors))
}

const onSubmit = async (event: FormSubmitEvent<Schema>) => {
  set(isSaving, true)

  try {
    const { error } = await supabase.from("penalty_shootout_attempt").insert(
      event.data.map(penalty => {
        const { player, goalkeeper, team, ...rest } = penalty

        return {
          ...rest,
          team_id: team.id,
          goalkeeper_id: goalkeeper.id,
          player_id: penalty.player.id,
          match_id: route.params.match_id
        }
      })
    )

    if (error) {
      console.error("Error creating penalties:", error)
      set(errors, error)
    }

    toast.add({
      title: error ? "Error adding penalty" : "Penalty successfully created!",
      icon: ui.icons[error ? "error" : "success"],
      color: error ? "error" : "success"
    })

    handleReset()
    set(isOpen, false)
    emits("refresh")
  } finally {
    set(isSaving, false)
  }
}
</script>

<template>
  <u-modal
    v-model:open="isOpen"
    title="Add Penalties"
  >
    <u-button :icon="ui.icons.plus" />

    <template #body>
      <u-alert
        v-if="errors"
        color="error"
        title="Error adding penalty"
        :description="errors"
        class="mb-5"
      />

      <u-form
        id="penalty-form"
        :schema
        :state
        @submit="onSubmit"
        @error="onError"
        class="space-y-3"
      >
        <u-form
          v-for="(_, index) in state"
          :key="index"
          nested
          :name="index.toString()"
          :schema="penaltySchema"
          class="space-y-3"
        >
          <u-form-field
            name="team_id"
            label="Team"
          >
            <u-field-group class="w-full">
              <u-input-menu
                v-model="<any>state[index]!.team"
                :items="[homeTeam, awayTeam]"
                placeholder="Team"
                class="w-full"
                label-key="name"
                description="short_name"
              >
                <template #leading="{ modelValue }">
                  <u-avatar
                    :src="modelValue?.logo_url || ''"
                    loading="lazy"
                    :icon="ICONS.team"
                    class="size-3"
                  />
                </template>

                <template #item-leading="{ item }">
                  <u-avatar
                    :src="item.logo_url || ''"
                    loading="lazy"
                    :icon="ICONS.team"
                  />
                </template>
              </u-input-menu>

              <u-button
                :icon="ui.icons.error"
                color="error"
                class="w-fit ml-auto"
                @click="
                  () => {
                    state.splice(index, 1)
                  }
                "
              />
            </u-field-group>
          </u-form-field>

          <div
            v-if="state[index]!.team?.id"
            class="grid grid-cols-2 gap-2 items-end"
          >
            <u-form-field
              name="player"
              label="Player"
            >
              <u-input-menu
                v-model="<any>state[index]!.player"
                :items="state[index]!.team.id === homeTeam.id ? players.home : players.away"
                placeholder="Player"
                class="w-full"
                label-key="name"
                description-key="aka"
                :filter-fields="['aka', 'full_name']"
              >
                <template #leading="{ modelValue }">
                  <u-icon :name="modelValue?.icon || ICONS.globe" />
                </template>

                <template #item-label="{ item }">{{ item.full_name }}</template>
              </u-input-menu>
            </u-form-field>

            <u-form-field
              name="goalkeeper"
              label="Goalkeeper"
            >
              <u-input-menu
                v-model="<any>state[index]!.goalkeeper"
                :items="
                  state[index]!.team.id === homeTeam.id ?
                    players.away.filter(player => player.position === 'goalkeeper')
                  : players.home.filter(player => player.position === 'goalkeeper')
                "
                placeholder="Goalkeeper"
                class="w-full"
                label-key="name"
                description-key="aka"
                :filter-fields="['aka', 'full_name']"
              >
                <template #leading="{ modelValue }">
                  <u-icon :name="modelValue?.icon || ICONS.globe" />
                </template>

                <template #item-label="{ item }">{{ item.full_name }}</template>
              </u-input-menu>
            </u-form-field>
          </div>

          <div class="grid grid-cols-3 gap-3">
            <u-form-field
              name="attempt_number"
              label="Attempt #"
            >
              <form-input-number
                v-model="state[index]!.attempt_number"
                placeholder="Attempt #"
              />
            </u-form-field>

            <u-form-field
              name="outcome"
              label="Outcome"
            >
              <u-input-menu
                v-model="state[index]!.outcome"
                :items="Object.entries(PENALTY_OUTCOME_MAPPING).map(([key, value]) => ({ label: value, value: key }))"
                placeholder="Outcome"
                class="w-full"
                value-key="value"
                label-key="label"
              />
            </u-form-field>

            <u-form-field
              name="is_sudden_death"
              label="Sudden death"
            >
              <u-switch v-model="state[index]!.is_sudden_death" />
            </u-form-field>
          </div>
        </u-form>

        <u-button
          :icon="ui.icons.plus"
          label="Add penalty"
          block
          size="xs"
          @click="
            () => {
              state.push({} as PenaltySchema)
            }
          "
        />
      </u-form>
    </template>

    <template #footer="{ close }">
      <form-footer
        form="penalty-form"
        :loading="isSaving"
        @reset="handleReset"
        @close="close"
      />
    </template>
  </u-modal>
</template>
