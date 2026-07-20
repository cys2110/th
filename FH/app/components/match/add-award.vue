<script setup lang="ts">
import { array, boolean, number, object, string, z } from "zod"
import { set } from "@vueuse/core"
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"
import { ICONS, MATCH_AWARD_TYPE_MAPPING, PENALTY_OUTCOME_MAPPING } from "#imports"
import { type Tables } from "~/types/database.types"

const schema = object({
  player: object({ id: string(), team_id: string() }),
  type: MatchAwardTypeEnum,
  source: string().optional()
})

type Schema = z.infer<typeof schema>

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
  () => `match-award-players-${route.params.match_id}`,
  async () => {
    const { data, error } = await supabase
      .from("match_lineup")
      .select("team_id, ...player(id, aka, ...people(full_name, ...country!nationality_country_id(icon)))")
      .eq("match_id", route.params.match_id)

    if (error || !data) {
      console.error("Error fetching match lineups:", error)
      return []
    }

    return data.map(item => ({
      ...item,
      name: item.aka || item.full_name
    }))
  },
  { default: () => [] }
)

const isOpen = ref(false)
const isSaving = ref(false)
const errors = ref()

const state = ref<Partial<Schema>>({})

const handleReset = () => {
  set(state, {})
  set(errors, undefined)
}

const onError = (event: FormErrorEvent) => {
  console.error(event.errors)
  set(errors, JSON.stringify(event.errors))
}

const onSubmit = async (event: FormSubmitEvent<Schema>) => {
  set(isSaving, true)

  try {
    const { error } = await supabase.from("match_award").insert({
      match_id: route.params.match_id,
      team_id: event.data.player.team_id,
      player_id: event.data.player.id,
      type: event.data.type,
      source: event.data.source
    })

    if (error) {
      console.error("Error creating award:", error)
      set(errors, error)
    }

    toast.add({
      title: error ? "Error adding award" : "Award successfully created!",
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
    title="Add Award"
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
        id="award-form"
        :schema
        :state
        @submit="onSubmit"
        @error="onError"
        class="space-y-3"
      >
        <u-form-field
          name="award_player"
          label="Player"
          class="col-span-2"
        >
          <u-input-menu
            v-model="<any>state.player"
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

        <div class="grid grid-cols-2 gap-3">
          <u-form-field
            name="award_type"
            label="Type"
            required
          >
            <u-input-menu
              v-model="state.type"
              :items="Object.entries(MATCH_AWARD_TYPE_MAPPING).map(([key, value]) => ({ label: value, value: key }))"
              placeholder="Type"
              value-key="value"
              label-key="label"
              clear
              class="w-full"
            />
          </u-form-field>

          <u-form-field
            name="source"
            label="Source"
          >
            <form-input
              v-model="state.source"
              placeholder="Source"
            />
          </u-form-field>
        </div>
      </u-form>
    </template>

    <template #footer="{ close }">
      <form-footer
        form="award-form"
        :loading="isSaving"
        @reset="handleReset"
        @close="close"
      />
    </template>
  </u-modal>
</template>
