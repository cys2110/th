<script setup lang="ts">
import { array, coerce, object, string, z } from "zod"
import { set } from "@vueuse/core"
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"
import { GOAL_EXECUTION_MAPPING, GOAL_SITUATION_MAPPING, ICONS, MATCH_EVENT_ROLE_MAPPING, MATCH_EVENT_TYPE_MAPPING } from "#imports"
import { type Tables } from "~/types/database.types"

type TeamType = Pick<Tables<{ schema: "football" }, "team">, "id" | "name" | "short_name" | "logo_url">

const eventPlayerSchema = object({
  player: object({ id: string() }).optional(),
  role: MatchEventRole
}).optional()
type EventPlayerSchema = z.infer<typeof eventPlayerSchema>

const matchEventSchema = object({
  team: object({ id: string() }),
  minute: coerce.number(),
  stoppage_minute: coerce.number().optional(),
  type: MatchEventType,
  goal_execution: GoalExecutionEnum.optional(),
  goal_situation: GoalSituationEnum.optional(),
  players: array(eventPlayerSchema).default([])
})
type MatchEventSchema = z.infer<typeof matchEventSchema>

const schema = array(matchEventSchema).default([])

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

const isOpen = ref(false)
const isSaving = ref(false)
const errors = ref()

const {
  data: players,
  pending,
  refresh
} = await useAsyncData(
  () => `match-players-${route.params.match_id}`,
  async () => {
    const { data, error } = await supabase
      .from("match_lineup")
      .select("position_id, ...player(id, aka, ...people(full_name, ...country!nationality_country_id(icon)))")
      .eq("match_id", route.params.match_id)

    if (error || !data) {
      console.error("Error fetching players:", error)
      return []
    }

    return data.map(item => ({
      ...item,
      name: item.aka || item.full_name
    }))
  },
  { default: () => [] }
)

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
    for (const matchEvent of event.data) {
      const { players, team, ...rest } = matchEvent

      const { data, error } = await supabase
        .from("match_event")
        .insert({
          ...rest,
          match_id: route.params.match_id,
          team_id: team.id
        })
        .select("id")

      if (error) {
        console.error("Error creating match event:", error)
        throw new Error(`Error creating match event: ${error.message}`)
      }

      const { error: eventPlayerError } = await supabase.from("match_event_player").insert(
        players.map(player => ({
          match_event_id: data[0]!.id,
          player_id: player!.player!.id,
          role: player!.role
        }))
      )

      if (eventPlayerError) {
        console.error("Error creating match event player:", eventPlayerError)
        throw new Error(`Error creating match event player: ${eventPlayerError.message}`)
      }
    }

    toast.add({
      title: "Match events successfully created!",
      icon: ui.icons.success,
      color: "success"
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
    title="Add Match Events"
  >
    <u-button :icon="ui.icons.plus" />

    <template #body>
      <u-alert
        v-if="errors"
        color="error"
        title="Error adding match events"
        :description="errors"
        class="mb-5"
      />

      <u-form
        id="event-form"
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
          :schema="matchEventSchema"
          class="space-y-3"
        >
          <div class="grid grid-cols-2 gap-3 items-end">
            <u-form-field
              name="team"
              label="Team"
              required
              class="flex-1"
            >
              <u-input-menu
                v-model="<any>state[index]!.team"
                :items="[homeTeam, awayTeam]"
                placeholder="Team"
                class="w-full"
                label-key="name"
                description="short_name"
                :filter-fields="['name', 'short_name']"
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
            </u-form-field>

            <u-form-field
              name="event_type"
              label="Type"
              required
            >
              <u-field-group class="w-full">
                <u-input-menu
                  v-model="state[index]!.type"
                  :items="Object.entries(MATCH_EVENT_TYPE_MAPPING).map(([key, value]) => ({ label: value, value: key }))"
                  placeholder="Type"
                  value-key="value"
                  label-key="label"
                  clear
                  class="w-full"
                />

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

            <template v-if="state[index]!.type === 'goal'">
              <u-form-field
                name="goal_situation"
                label="Situation"
                required
              >
                <u-input-menu
                  v-model="state[index]!.goal_situation"
                  :items="Object.entries(GOAL_SITUATION_MAPPING).map(([key, value]) => ({ label: value, value: key }))"
                  placeholder="Situation"
                  value-key="value"
                  label-key="label"
                  clear
                  class="w-full"
                />
              </u-form-field>

              <u-form-field
                name="goal_execution"
                label="Type"
                required
              >
                <u-input-menu
                  v-model="state[index]!.goal_execution"
                  :items="Object.entries(GOAL_EXECUTION_MAPPING).map(([key, value]) => ({ label: value, value: key }))"
                  placeholder="Execution"
                  value-key="value"
                  label-key="label"
                  clear
                  class="w-full"
                />
              </u-form-field>
            </template>

            <u-form-field
              name="minute"
              label="Minute"
              required
            >
              <form-input-number
                v-model="state[index]!.minute"
                placeholder="Minute"
              />
            </u-form-field>

            <u-form-field
              name="stoppage_minute"
              label="Stoppage minute"
            >
              <form-input-number
                v-model="state[index]!.stoppage_minute"
                placeholder="Stoppage minute"
              />
            </u-form-field>
          </div>

          <u-form
            v-for="(_, i) in state[index]!.players"
            :key="i"
            nested
            :name="`match_events.${index}.event_players.${i}`"
            :schema="eventPlayerSchema"
            class="space-y-3"
          >
            <div class="grid grid-cols-2 items-end gap-3">
              <u-form-field
                name="player"
                :label="i === 0 ? 'Player' : ''"
                required
              >
                <u-input-menu
                  v-model="<any>state[index]!.players![i]!.player"
                  :items="players"
                  placeholder="Player"
                  :loading="pending"
                  class="w-full"
                  label-key="name"
                  description-key="aka"
                  :filter-fields="['full_name', 'aka']"
                >
                  <template #leading="{ modelValue }">
                    <u-icon :name="modelValue?.icon || ICONS.player" />
                  </template>

                  <template #item-label="{ item }">{{ item.full_name }}</template>
                </u-input-menu>
              </u-form-field>

              <u-form-field
                name="role"
                :label="i === 0 ? 'Role' : ''"
                required
              >
                <u-field-group class="w-full">
                  <u-input-menu
                    v-model="state[index]!.players![i]!.role"
                    :items="Object.entries(MATCH_EVENT_ROLE_MAPPING).map(([key, value]) => ({ label: value, value: key }))"
                    placeholder="Role"
                    value-key="value"
                    label-key="label"
                    clear
                    class="w-full"
                  />

                  <u-button
                    :icon="ui.icons.error"
                    color="error"
                    class="w-fit ml-auto"
                    @click="
                      () => {
                        state[index]!.players!.splice(i, 1)
                      }
                    "
                  />
                </u-field-group>
              </u-form-field>
            </div>
          </u-form>

          <u-button
            :icon="ui.icons.plus"
            label="Add player"
            block
            size="xs"
            class="col-span-2"
            @click="
              () => {
                state[index]!.players.push({} as EventPlayerSchema)
              }
            "
          />
        </u-form>

        <u-button
          :icon="ui.icons.plus"
          label="Add match event"
          block
          size="xs"
          @click="
            () => {
              state.push({ players: [] as EventPlayerSchema[] } as MatchEventSchema)
            }
          "
        />
      </u-form>
    </template>

    <template #footer="{ close }">
      <form-footer
        form="event-form"
        :loading="isSaving"
        @reset="handleReset"
        @close="close"
      />
    </template>
  </u-modal>
</template>
