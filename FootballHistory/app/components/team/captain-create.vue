<script setup lang="ts">
import { any, object, string, z } from "zod"
import { set } from "@vueuse/core"
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"
import { ICONS } from "#imports"

const schema = object({
  player: object({ id: string() }),
  start_date: any().optional(),
  end_date: any().optional(),
  captain_type: string()
})
type Schema = z.infer<typeof schema>

defineShortcuts({
  ctrl_a: () => set(isOpen, !isOpen.value)
})

const emits = defineEmits<{ refresh: [] }>()

const route = useRoute("team")
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
  () => `team-players-${route.params.id}`,
  async () => {
    const { data, error } = await supabase
      .schema("football")
      .from("player_team_tenure")
      .select("...player(id, aka, ...people(full_name, ...country!nationality_country_id(icon))), team_id")
      .eq("team_id", route.params.id)

    if (error) {
      console.error("Error fetching team players:", error)
      return []
    }

    return useArrayUnique(
      data.map(player => ({ ...player, name: player.aka || player.full_name })),
      (a, b) => a.id === b.id
    ).value
  },
  { default: () => [] }
)

const state = ref<Partial<Schema>>({})

const handleReset = () => {
  set(state, {})
  set(errors, undefined)
}

const onError = (event: FormErrorEvent) => set(errors, JSON.stringify(event.errors))

const onSubmit = async (event: FormSubmitEvent<Schema>) => {
  set(isSaving, true)

  try {
    const { error } = await supabase.schema("football").from("team_captain").insert({
      team_id: route.params.id,
      player_id: event.data.player.id,
      captain_type: event.data.captain_type,
      start_date: event.data.start_date?.toString(),
      end_date: event.data.end_date?.toString()
    })

    if (error) {
      throw new Error(`Error creating captain: ${error.message}`)
    }

    handleReset()
    emits("refresh")
    set(isOpen, false)
  } catch (error) {
    console.error(error)
    set(errors, error)
    toast.add({
      title: "Error creating captain",
      icon: ui.icons.error,
      color: "error"
    })
  } finally {
    set(isSaving, false)
  }
}

const formFields: Array<FormFieldInterface<Schema>> = [
  { label: "Player", key: "player", type: "slot", required: true },
  { label: "Type", key: "captain_type", type: "text", required: true },
  { label: "Start Date", key: "start_date", type: "date" },
  { label: "End Date", key: "end_date", type: "date" }
]
</script>

<template>
  <u-modal
    v-model:open="isOpen"
    title="Create Captain"
  >
    <u-button :icon="ui.icons.plus" />

    <template #body>
      <u-alert
        v-if="errors"
        color="error"
        title="Error creating captain"
        :description="errors"
        class="mb-5"
      />

      <u-form
        id="captain-form"
        :schema
        :state
        @submit="onSubmit"
        @error="onError"
      >
        <div class="grid grid-cols-2 items-center gap-3">
          <form-field
            v-for="field in formFields"
            :key="field.label"
            v-model="state"
            :field
          >
            <u-input-menu
              v-if="field.key === 'player'"
              v-model="<any>state.player"
              :loading="pending"
              clear
              placeholder="Player"
              :items="players"
              class="w-full"
              label-key="name"
              description-key="aka"
              :filter-fields="['aka', 'full_name']"
            >
              <template #leading="{ modelValue }">
                <u-icon :name="modelValue?.icon || ICONS.player" />
              </template>

              <template #item-label="{ item }">{{ item.full_name }}</template>

              <template #content-bottom>
                <u-button
                  block
                  label="Refresh"
                  :icon="ui.icons.reload"
                  @click="() => refresh()"
                />
              </template>
            </u-input-menu>
          </form-field>
        </div>
      </u-form>
    </template>

    <template #footer="{ close }">
      <form-footer
        form="captain-form"
        :loading="isSaving"
        @reset="handleReset"
        @close="close"
      />
    </template>
  </u-modal>
</template>
