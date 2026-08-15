<script setup lang="ts">
import { any, boolean, coerce, object, string, z } from "zod"
import { set } from "@vueuse/core"
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"

const schema = object({
  player: object({ id: string() }),
  aka: string().optional(),
  height_cm: coerce.number().optional(),
  preferred_foot: PreferredFootEnum.optional(),
  position: PositionGroupEnum.optional()
})
type Schema = z.infer<typeof schema>

defineShortcuts({
  ctrl_a: () => set(isOpen, !isOpen.value)
})

const emits = defineEmits<{ refresh: [] }>()

const toast = useToast()
const supabase = useSupabaseClient()
const { ui } = useAppConfig()

const federationSearch = useFederationSearch()

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

    const { error } = await supabase.from("player").insert({
      ...rest,
      person_id: player.id
    })

    if (error) {
      console.error("Error creating player:", error)
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

const formFields: Array<FormFieldInterface<Schema>> = [
  { label: "Person", key: "player", type: "person", required: true },
  { label: "Alias", key: "aka", type: "text" },
  { label: "Height (cm)", key: "height_cm", type: "number" },
  {
    label: "Preferred Foot",
    key: "preferred_foot",
    type: "radio",
    items: Object.entries(PREFERRED_FOOT_MAPPING).map(([label, value]) => ({ label: value, value: label })),
    valueKey: "value"
  },
  { label: "Position", key: "position", type: "radio", items: POSITION_GROUPS, valueKey: "value", class: "col-span-2" }
]
</script>

<template>
  <u-modal
    v-model:open="isOpen"
    title="Create Player"
  >
    <u-button :icon="ui.icons.plus" />

    <template #body>
      <u-alert
        v-if="errors"
        color="error"
        title="Error creating player"
        :description="errors"
        class="mb-5"
      />

      <u-form
        id="player-form"
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
          />
        </div>
      </u-form>
    </template>

    <template #footer="{ close }">
      <form-footer
        form="player-form"
        :loading="isSaving"
        @reset="handleReset"
        @close="close"
      />
    </template>
  </u-modal>
</template>
