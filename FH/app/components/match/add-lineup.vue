<script setup lang="ts">
import { array, boolean, coerce, object, string, z } from "zod"
import { set } from "@vueuse/core"
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"

const lineupSchema = object({
  player: object({ id: string() }),
  position_id: string().optional(),
  shirt_number: coerce.number().optional(),
  starter: boolean(),
  captain: boolean()
})
type LineupSchema = z.infer<typeof lineupSchema>

const schema = array(lineupSchema).default([])

type Schema = z.infer<typeof schema>

const props = defineProps<{
  teamId: string
  seasonId: string
}>()

const emits = defineEmits<{ refresh: [] }>()

const route = useRoute("match")
const toast = useToast()
const supabase = useSupabaseClient()
const { ui } = useAppConfig()

const isOpen = ref(false)
const isSaving = ref(false)
const errors = ref()

const state = ref<Schema>([])

const { data: positions, pending: positionsPending } = await useAsyncData(
  () => `${route.params.match_id}-lineup-positions`,
  async () => {
    const { data, error } = await supabase.from("position").select("*").order("id", { ascending: true })

    if (error) {
      console.error("Error fetching positions:", error)
    }

    return data || []
  },
  { default: () => [] }
)

const { data: players, pending } = await useAsyncData(
  () => `${route.params.match_id}-add-lineup-${props.teamId}`,
  async () => {
    const { data, error } = await supabase
      .from("player")
      .select("id, aka, ...people(full_name, country:country!nationality_country_id(*)), squad_player!inner(id)")
      .eq("squad_player.season_id", props.seasonId)
      .eq("squad_player.team_id", props.teamId)

    if (error) {
      console.error("Error fetching team players:", error)
    }

    return (data || [])?.map(item => ({
      ...item,
      name: item.aka || item.full_name
    }))
  },
  { default: () => [] }
)

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
    const { error } = await supabase.from("match_lineup").insert(
      event.data.map(lineup => ({
        match_id: route.params.match_id,
        team_id: props.teamId,
        player_id: lineup.player.id,
        position_id: lineup.position_id,
        shirt_number: lineup.shirt_number,
        captain: lineup.captain,
        starter: lineup.starter
      }))
    )

    if (error) {
      console.error("Error creating match lineups:", error)
      set(errors, error)
    }

    toast.add({
      title: error ? "Error adding lineup" : "Lineup successfully created!",
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
    title="Add Lineup"
  >
    <u-button :icon="ui.icons.plus" />

    <template #body>
      <u-alert
        v-if="errors"
        color="error"
        title="Error adding lineup"
        :description="errors"
        class="mb-5"
      />

      <u-form
        id="lineup-form"
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
          :schema="lineupSchema"
        >
          <div class="grid grid-cols-11 gap-2 items-end">
            <u-form-field
              name="player"
              :label="index === 0 ? 'Player' : ''"
              class="col-span-3"
            >
              <u-input-menu
                v-model="<any>state[index]!.player"
                :items="players"
                placeholder="Player"
                :loading="pending"
                class="w-full"
                label-key="name"
                description-key="aka"
                :filter-fields="['full_name', 'aka']"
              >
                <template #leading="{ modelValue }">
                  <u-icon
                    v-if="modelValue"
                    :name="modelValue.country!.icon"
                  />
                </template>

                <template #item-leading="{ item }">
                  <u-icon
                    v-if="item"
                    :name="item.country!.icon"
                  />
                </template>

                <template #item-label="{ item }">{{ item.full_name }}</template>

                <template #item-description="{ item }">{{ item.aka }}</template>
              </u-input-menu>
            </u-form-field>

            <u-form-field
              name="position"
              :label="index === 0 ? 'Position' : ''"
              class="col-span-3"
            >
              <u-input-menu
                v-model="state[index]!.position_id"
                :items="positions"
                placeholder="Position"
                :loading="positionsPending"
                class="w-full"
                value-key="id"
                label-key="name"
              />
            </u-form-field>

            <u-form-field
              name="shirt_number"
              :label="index === 0 ? 'Number' : ''"
              class="col-span-2"
            >
              <form-input-number
                v-model="state[index]!.shirt_number"
                placeholder="Number"
              />
            </u-form-field>

            <div class="col-span-2 space-y-1">
              <u-switch
                v-model="state[index]!.starter"
                label="Starter"
              />

              <u-switch
                v-model="state[index]!.captain"
                label="Captain"
              />
            </div>

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
              state.push({ starter: false, captain: false } as LineupSchema)
            }
          "
        />
      </u-form>
    </template>

    <template #footer="{ close }">
      <form-footer
        form="lineup-form"
        :loading="isSaving"
        @reset="handleReset"
        @close="close"
      />
    </template>
  </u-modal>
</template>
