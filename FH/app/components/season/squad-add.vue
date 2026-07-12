<script setup lang="ts">
import { coerce, object, string, z } from "zod"
import { set } from "@vueuse/core"
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"
import { ICONS } from "#imports"

const schema = object({
  player: object({
    id: string(),
    full_name: string(),
    aka: string().nullish(),
    icon: string()
  }),
  shirt_number: coerce.number().optional(),
  position: PositionGroupEnum.optional()
})
type Schema = z.infer<typeof schema>

defineShortcuts({
  ctrl_a: () => set(isOpen, !isOpen.value)
})

const props = defineProps<{
  seasonId: string
}>()

const emits = defineEmits<{ refresh: [] }>()

const route = useRoute("team-season")
const toast = useToast()
const supabase = useSupabaseClient()
const { ui } = useAppConfig()

const teamSearch = useTeamSearch()
const playerSearch = usePlayerSearch()

const isOpen = ref(false)
const isSaving = ref(false)
const errors = ref()

const state = ref<Partial<Schema>>({})

const handleReset = () => {
  set(state, {})
  set(errors, undefined)
}

const onError = (event: FormErrorEvent) => set(errors, JSON.stringify(event.errors))

const onSubmit = async (event: FormSubmitEvent<Schema>) => {
  set(isSaving, true)

  try {
    const { player, ...rest } = event.data
    const { data, error } = await supabase
      .from("squad_player")
      .insert({
        ...rest,
        player_id: event.data.player.id,
        team_id: route.params.team_id,
        season_id: props.seasonId
      })
      .select("id")

    toast.add({
      title: error ? `Error creating squad player` : `Squad player successfully created!`,
      icon: ui.icons[error ? "error" : "success"],
      color: error ? "error" : "success"
    })

    if (error) {
      console.error("Error creating squad player:", error)
      set(errors, error)
      return
    }

    handleReset()
    emits("refresh")
    set(isOpen, false)
  } finally {
    set(isSaving, false)
  }
}

const formFields = computed<Array<FormFieldInterface<Schema>>>(
  () =>
    [
      { label: "Player", key: "player", type: "slot", required: true },
      { label: "Shirt Number", key: "shirt_number", type: "number" },
      {
        label: "Position",
        key: "position",
        type: "radio",
        items: Object.entries(POSITION_GROUP_MAPPING).map(([key, value]) => ({ label: value, value: key })),
        valueKey: "value",
        class: "col-span-2"
      }
    ] as Array<FormFieldInterface<Schema>>
)
</script>

<template>
  <u-modal
    v-model:open="isOpen"
    :title="`Create Squad Player`"
  >
    <u-button :icon="ui.icons.plus" />

    <template #body>
      <u-alert
        v-if="errors"
        color="error"
        :title="`Error creating squad player`"
        :description="errors"
        class="mb-5"
      />

      <u-form
        id="squad-form"
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
              v-model:search-term="playerSearch.searchTerm.value"
              :loading="playerSearch.pending.value"
              clear
              placeholder="Player"
              :items="<any>playerSearch.players.value"
              class="w-full"
              ignore-filter
              label-key="full_name"
            >
              <template #leading="{ modelValue }">
                <u-icon :name="modelValue?.icon || ICONS.globe" />
              </template>

              <template #item-leading="{ item }">
                <u-icon :name="item.icon" />
              </template>

              <template #item-label="{ item }">{{ item.full_name }}</template>

              <template #item-description="{ item }">{{ item.aka }}</template>
            </u-input-menu>
          </form-field>
        </div>
      </u-form>
    </template>

    <template #footer="{ close }">
      <form-footer
        form="squad-form"
        :loading="isSaving"
        @reset="handleReset"
        @close="close"
      />
    </template>
  </u-modal>
</template>
