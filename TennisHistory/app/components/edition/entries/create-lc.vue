<script setup lang="ts">
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"
import { array, number, object, string, z } from "zod"

const playerSchema = object({
  id: string(),
  label: string(),
  icon: string()
})
type PlayerSchema = z.infer<typeof playerSchema>

const schema = object({
  europe: object({
    points: number(),
    captain: playerSchema,
    vice_captain: playerSchema,
    singles: array(playerSchema).default([]),
    doubles: array(array(playerSchema)).default([]),
    alternates: array(playerSchema).default([]),
    withdrawn: array(playerSchema).default([])
  }),
  world: object({
    points: number(),
    captain: playerSchema,
    vice_captain: playerSchema,
    singles: array(playerSchema).default([]),
    doubles: array(array(playerSchema)).default([]),
    alternates: array(playerSchema).default([]),
    withdrawn: array(playerSchema).default([])
  })
})
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

const europeSinglesPlayers = usePlayerSearch()
const worldSinglesPlayers = usePlayerSearch()
const europeDoublesPlayers = usePlayerSearch()
const worldDoublesPlayers = usePlayerSearch()

const isOpen = ref(false)
const isUploading = ref(false)
const errors = ref()
const form = useTemplateRef("form")
const europeSourceSelection = ref<Array<PlayerSchema>>([])
const europeTargetSelection = ref<Array<PlayerSchema>>([])
const worldSourceSelection = ref<Array<PlayerSchema>>([])
const worldTargetSelection = ref<Array<PlayerSchema>>([])

defineShortcuts({
  ctrl_a: () => set(isOpen, !isOpen.value),
  ctrl_r: () => handleReset(),
  ctrl_enter: () => form.value?.submit()
})

const initialState = {
  europe: {
    points: 0,
    captain: {
      id: "",
      label: "",
      icon: ""
    },
    vice_captain: {
      id: "",
      label: "",
      icon: ""
    },
    singles: [],
    doubles: [],
    alternates: [],
    withdrawn: []
  },
  world: {
    points: 0,
    captain: {
      id: "",
      label: "",
      icon: ""
    },
    vice_captain: {
      id: "",
      label: "",
      icon: ""
    },
    singles: [],
    doubles: [],
    alternates: [],
    withdrawn: []
  }
}

const state = ref<Schema>(cloneDeep(initialState))

const handleReset = () => {
  set(state, cloneDeep(initialState))
  set(errors, undefined)
}

const onError = (event: FormErrorEvent) => {
  set(errors, event.errors)
}

const onSubmit = async (event: FormSubmitEvent<Schema>) => {
  set(isUploading, true)

  const eventId = `${edId}-LC`

  const europeId = `${eventId} Europe`
  const worldId = `${eventId} World`

  const { europe, world } = event.data

  try {
    const { error } = await supabase.from("entries").insert([
      {
        id: europeId,
        points: europe.points,
        event_id: eventId,
        team_name: "Europe",
        captain: europe.captain.id,
        vc: europe.vice_captain.id
      },
      {
        id: worldId,
        points: world.points,
        event_id: eventId,
        team_name: "World",
        captain: world.captain.id,
        vc: world.vice_captain.id
      },
      ...[...europe.singles, ...world.singles].map(player => ({
        id: `${eventId} ${player.id}`,
        event_id: eventId,
        match_type: "Singles" as const
      })),
      ...[...europe.doubles, ...world.doubles].map(team => ({
        id: `${eventId} ${team.map(player => player.id).join(" ")}`,
        event_id: eventId,
        match_type: "Doubles" as const
      })),
      ...[...europe.alternates, ...world.alternates, ...europe.withdrawn, ...world.withdrawn].map(player => ({
        id: `${eventId} ${player.id}`,
        event_id: eventId
      }))
    ])

    if (error) throw error

    const europePlayers = useArrayUnique(
      [...europe.singles, ...europe.alternates, ...europe.withdrawn, ...europe.doubles.flatMap(team => team.map(player => player))],
      (a, b) => a.id === b.id
    ).value
    const worldPlayers = useArrayUnique(
      [...world.singles, ...world.alternates, ...world.withdrawn, ...world.doubles.flatMap(team => team.map(player => player))],
      (a, b) => a.id === b.id
    ).value

    const { error: mappingError } = await supabase.from("player_entry_mapping").insert([
      ...europePlayers.map(player => ({
        player_id: player.id,
        entry_id: europeId
      })),
      ...worldPlayers.map(player => ({
        player_id: player.id,
        entry_id: worldId
      })),
      ...[
        ...event.data.europe.singles,
        ...event.data.world.singles,
        ...event.data.europe.alternates,
        ...event.data.europe.withdrawn,
        ...event.data.world.alternates,
        ...event.data.world.withdrawn
      ].map(player => ({ player_id: player.id, entry_id: `${eventId} ${player.id}` })),
      ...[...event.data.europe.doubles, ...event.data.world.doubles].flatMap(team =>
        team.map(player => ({ player_id: player.id, entry_id: `${eventId} ${team.map(player => player.id).join(" ")}` }))
      )
    ])

    if (mappingError) throw mappingError

    if (event.data.europe.alternates.length || event.data.world.alternates.length) {
      const { error: alternatesError } = await supabase.from("entry_status").insert(
        [...event.data.europe.alternates, ...event.data.world.alternates].map(player => ({
          event_id: eventId,
          entry_id: `${eventId} ${player.id}`,
          status: "AL",
          draw: "Main"
        }))
      )

      if (alternatesError) {
        console.error("Error creating alternates:", alternatesError)

        toast.add({
          title: `Error creating alternates`,
          icon: icons.error,
          color: "error"
        })
      }
    }

    if (event.data.europe.withdrawn.length || event.data.world.withdrawn.length) {
      const { error: withdrawnError } = await supabase.from("withdrawals").insert(
        [...event.data.europe.withdrawn, ...event.data.world.withdrawn].map(player => ({
          event_id: eventId,
          entry_id: `${eventId} ${player.id}`,
          draw: "Main"
        }))
      )

      if (withdrawnError) {
        console.error("Error creating withdrawals:", withdrawnError)

        toast.add({
          title: `Error creating withdrawals`,
          icon: icons.error,
          color: "error"
        })
      }
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

const transferSelection = (team: "europe" | "world") => {
  state.value[team].singles = [...state.value[team].singles, ...(team === "europe" ? europeSourceSelection.value : worldSourceSelection.value)]

  if (team === "europe") {
    europeSourceSelection.value = []
  } else {
    worldSourceSelection.value = []
  }
}

const removeSelection = (team: "europe" | "world") => {
  state.value[team].singles = state.value[team].singles.filter(player =>
    team === "europe" ? !europeTargetSelection.value.includes(player) : !worldTargetSelection.value.includes(player)
  )

  if (team === "europe") {
    europeTargetSelection.value = []
  } else {
    worldTargetSelection.value = []
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
        class="space-y-3"
      >
        <div class="font-bold text-sm">Europe</div>

        <form-field
          :field="{ label: 'Points', key: 'europe.points', type: 'number', required: true }"
          v-model="state"
        />

        <u-form-field
          name="europe.captain"
          label="Captain"
          required
        >
          <player-search v-model="state.europe.captain" />
        </u-form-field>

        <u-form-field
          name="europe.vice_captain"
          label="Vice-Captain"
          required
        >
          <player-search v-model="state.europe.vice_captain" />
        </u-form-field>

        <u-form-field
          name="europe.singles"
          label="Singles"
          required
        >
          <div class="flex justify-evenly items-stretch gap-3 w-full">
            <div class="flex-1 flex flex-col gap-1">
              <div class="text-xs font-medium text-dimmed">All Players</div>

              <u-listbox
                v-model="europeSourceSelection"
                :items="europeSinglesPlayers.results.value"
                v-model:search-term="europeSinglesPlayers.searchTerm.value"
                multiple
                filter
                class="flex-1"
              >
                <template #empty>
                  <div class="px-2">No matching players</div>
                </template>
              </u-listbox>
            </div>

            <div class="flex flex-col items-center justify-center gap-1">
              <u-button
                :icon="icons.chevronRight"
                @click="transferSelection('europe')"
                :disabled="!europeSourceSelection.length"
              />

              <u-button
                :icon="icons.chevronLeft"
                @click="removeSelection('europe')"
                :disabled="!europeTargetSelection.length"
              />
            </div>

            <div class="flex-1 flex flex-col gap-1">
              <div class="text-xs font-medium text-dimmed">Selected Players</div>

              <u-listbox
                v-model="europeTargetSelection"
                :items="state.europe.singles"
                multiple
                class="flex-1"
              >
                <template #empty>
                  <div class="px-2">No players selected </div>
                </template>
              </u-listbox>
            </div>
          </div>
        </u-form-field>

        <u-form
          v-for="(team, index) in state.europe.doubles"
          :key="index"
          nested
          :name="`europe.doubles.${index}`"
          :schema="schema.shape.europe.shape.doubles.unwrap().element"
        >
          <u-form-field :label="index === 0 ? 'Doubles Teams' : undefined">
            <u-field-group>
              <u-select-menu
                v-model="state.europe.doubles[index]"
                :items="europeDoublesPlayers.results.value"
                v-model:search-term="europeDoublesPlayers.searchTerm.value"
                :loading="europeDoublesPlayers.loading.value"
                multiple
                class="w-full"
              />

              <u-button
                :icon="icons.error"
                @click="state.europe.doubles.splice(index, 1)"
              />
            </u-field-group>
          </u-form-field>
        </u-form>

        <u-button
          :icon="icons.plus"
          label="Add Doubles Team"
          block
          @click="state.europe.doubles.push([])"
        />

        <u-form-field
          name="europe.alternates"
          label="Alternates"
          required
        >
          <player-search
            v-model="state.europe.alternates"
            multiple
          />
        </u-form-field>

        <u-form-field
          name="europe.withdrawn"
          label="Withdrawals"
          required
        >
          <player-search
            v-model="state.europe.withdrawn"
            multiple
          />
        </u-form-field>

        <div class="font-bold text-sm">World</div>

        <form-field
          :field="{ label: 'Points', key: 'world.points', type: 'number', required: true }"
          v-model="state"
        />

        <u-form-field
          name="world.captain"
          label="Captain"
          required
        >
          <player-search v-model="state.world.captain" />
        </u-form-field>

        <u-form-field
          name="world.vice_captain"
          label="Vice-Captain"
          required
        >
          <player-search v-model="state.world.vice_captain" />
        </u-form-field>

        <u-form-field
          name="world.singles"
          label="Singles"
          required
        >
          <div class="flex justify-evenly items-stretch gap-3 w-full">
            <div class="flex-1 flex flex-col gap-1">
              <div class="text-xs font-medium text-dimmed">All Players</div>

              <u-listbox
                v-model="worldSourceSelection"
                :items="worldSinglesPlayers.results.value"
                v-model:search-term="worldSinglesPlayers.searchTerm.value"
                multiple
                filter
                class="flex-1"
              >
                <template #empty>
                  <div class="px-2">No matching players</div>
                </template>
              </u-listbox>
            </div>

            <div class="flex flex-col items-center justify-center gap-1">
              <u-button
                :icon="icons.chevronRight"
                @click="transferSelection('world')"
                :disabled="!worldSourceSelection.length"
              />

              <u-button
                :icon="icons.chevronLeft"
                @click="removeSelection('world')"
                :disabled="!worldTargetSelection.length"
              />
            </div>

            <div class="flex-1 flex flex-col gap-1">
              <div class="text-xs font-medium text-dimmed">Selected Players</div>

              <u-listbox
                v-model="worldTargetSelection"
                :items="state.world.singles"
                multiple
                class="flex-1"
              >
                <template #empty>
                  <div class="px-2">No players selected </div>
                </template>
              </u-listbox>
            </div>
          </div>
        </u-form-field>

        <u-form
          v-for="(team, index) in state.world.doubles"
          :key="index"
          nested
          :name="`world.doubles.${index}`"
          :schema="schema.shape.world.shape.doubles.unwrap().element"
        >
          <u-form-field :label="index === 0 ? 'Doubles Teams' : undefined">
            <u-field-group>
              <u-select-menu
                v-model="state.world.doubles[index]"
                :items="worldDoublesPlayers.results.value"
                v-model:search-term="worldDoublesPlayers.searchTerm.value"
                :loading="worldDoublesPlayers.loading.value"
                multiple
                class="w-full"
              />

              <u-button
                :icon="icons.error"
                @click="state.world.doubles.splice(index, 1)"
              />
            </u-field-group>
          </u-form-field>
        </u-form>

        <u-button
          :icon="icons.plus"
          label="Add Doubles Team"
          block
          @click="state.world.doubles.push([])"
        />

        <u-form-field
          name="world.alternates"
          label="Alternates"
          required
        >
          <player-search
            v-model="state.world.alternates"
            multiple
          />
        </u-form-field>

        <u-form-field
          name="world.withdrawn"
          label="Withdrawals"
          required
        >
          <player-search
            v-model="state.world.withdrawn"
            multiple
          />
        </u-form-field>
      </u-form>

      <u-alert
        v-if="errors"
        color="error"
        :title="`Error saving entries`"
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
