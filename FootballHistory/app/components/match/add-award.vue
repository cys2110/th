<script setup lang="ts">
import { boolean, coerce, object, string, z } from "zod"
import { set } from "@vueuse/core"
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"
import { ICONS, MATCH_AWARDS } from "#imports"

const schema = object({
  player: object({ id: string(), team_id: string() }),
  award_type: string(),
  is_shared: boolean().default(false),
  award_level: coerce.number().optional()
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
    const { player, ...rest } = event.data

    const { error } = await supabase.from("match_award").insert({
      ...rest,
      match_id: route.params.match_id,
      team_id: player.team_id,
      player_id: player.id
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

const formFields: Array<FormFieldInterface<Schema>> = [
  { label: "Player", key: "player", type: "slot", required: true, class: "col-span-2" },
  { label: "Award Type", key: "award_type", type: "radio", items: MATCH_AWARDS, required: true, valueKey: "value", class: "col-span-2" },
  { label: "Shared", key: "is_shared", type: "switch" },
  { label: "Award Level", key: "award_level", type: "number" }
]
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
        title="Error adding award"
        :description="errors"
        class="mb-5"
      />

      <u-form
        id="award-form"
        :schema
        :state
        @submit="onSubmit"
        @error="onError"
      >
        <div class="grid grid-cols-2 gap-3">
          <form-field
            v-for="field in formFields"
            :key="field.label"
            :field
            v-model="state"
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

              <template #content-bottom>
                <u-button
                  block
                  :icon="ui.icons.reload"
                  @click="refresh()"
                >
                  Refresh
                </u-button>
              </template>
            </u-input-menu>
          </form-field>
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
