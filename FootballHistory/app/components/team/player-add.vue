<script setup lang="ts">
import { any, array, coerce, object, string, z } from "zod"
import { set } from "@vueuse/core"
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"
import { ICONS } from "#imports"

const schema = object({
  player: object({ id: string() }),
  relationship_type: PlayerTeamRelationshipEnum,
  start_date: any().optional(),
  end_date: any().optional(),
  parent_team: object({ id: string() }).optional()
}).superRefine((data, ctx) => {
  if (data.relationship_type === "loan" && !data.parent_team) {
    ctx.addIssue({
      path: ["parent_team"],
      code: "custom",
      message: "Parent team is required for loan relationships"
    })
  }
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

const teamSearch = useTeamSearch()
const playerSearch = usePlayerSearch()

const isOpen = ref(false)
const isSaving = ref(false)
const errors = ref()

const state = ref<Partial<Schema>>({
  relationship_type: "permanent"
})

const handleReset = () => {
  set(state, { relationship_type: "permanent" })
  set(errors, undefined)
}

const onError = (event: FormErrorEvent) => set(errors, JSON.stringify(event.errors))

const onSubmit = async (event: FormSubmitEvent<Schema>) => {
  set(isSaving, true)

  try {
    const { error } = await supabase.from("player_team_tenure").insert({
      player_id: event.data.player.id,
      team_id: route.params.id,
      start_date: event.data.start_date?.toString(),
      end_date: event.data.end_date?.toString(),
      relationship_type: event.data.relationship_type,
      parent_team_id: event.data.parent_team?.id
    })

    toast.add({
      title: error ? `Error creating player team relationship` : `Player team relationship successfully created!`,
      icon: ui.icons[error ? "error" : "success"],
      color: error ? "error" : "success"
    })

    if (error) {
      console.error("Error creating person:", error)
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
      {
        label: "Relationship Type",
        key: "relationship_type",
        type: "radio",
        items: PLAYER_TEAM_RELATIONSHIPS,
        value: "value"
      },
      { label: "Start Date", key: "start_date", type: "date" },
      { label: "End Date", key: "end_date", type: "date" },
      ...(state.value.relationship_type === "loan" ? [{ label: "Permanent Team", key: "parent_team", type: "slot", class: "col-span-2" }] : [])
    ] as Array<FormFieldInterface<Schema>>
)
</script>

<template>
  <u-modal
    v-model:open="isOpen"
    :title="`Create Player Team Relationship`"
  >
    <u-button :icon="ui.icons.plus" />

    <template #body>
      <u-alert
        v-if="errors"
        color="error"
        :title="`Error creating player team relationship`"
        :description="errors"
        class="mb-5"
      />

      <u-form
        id="relationship-form"
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
                <u-icon :name="modelValue?.icon || ICONS.player" />
              </template>

              <template #item-label="{ item }">{{ item.full_name }}</template>

              <template #item-description="{ item }">{{ item.aka }}</template>
            </u-input-menu>

            <u-input-menu
              v-if="field.key === 'parent_team'"
              v-model="<any>state.parent_team"
              v-model:search-term="teamSearch.searchTerm.value"
              :loading="teamSearch.pending.value"
              clear
              placeholder="Team"
              :items="<any>teamSearch.teams.value"
              class="w-full"
              ignore-filter
              label-key="aka"
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

              <template #item-label="{ item }">{{ item.short_name || item.name }}</template>

              <template #item-description="{ item }">{{ item.nicknames[0] }}</template>
            </u-input-menu>
          </form-field>
        </div>
      </u-form>
    </template>

    <template #footer="{ close }">
      <form-footer
        form="relationship-form"
        :loading="isSaving"
        @reset="handleReset"
        @close="close"
      />
    </template>
  </u-modal>
</template>
