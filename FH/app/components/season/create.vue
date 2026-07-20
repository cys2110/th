<script setup lang="ts">
import { any, number, object, string, z } from "zod"
import { set } from "@vueuse/core"
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"
import { ICONS } from "#imports"

const schema = object({
  competition_id: string(),
  name: string().min(1, "Name is required"),
  dates: any(),
  win_points: number().int("Win points must be an integer"),
  draw_points: number().int("Win points must be an integer"),
  loss_points: number().int("Win points must be an integer")
})
type Schema = z.infer<typeof schema>

defineShortcuts({
  ctrl_a: () => set(isOpen, !isOpen.value)
})

const emits = defineEmits<{ refresh: [] }>()

const toast = useToast()
const supabase = useSupabaseClient()
const { ui } = useAppConfig()

const { data: competitions, pending } = await useAsyncData(
  "competitions",
  async () => {
    const { data, error } = await supabase.from("competition").select("*").order("name", { ascending: true })

    if (error || !data) {
      console.error("Error fetching competitions:", error)
      return []
    }

    return data
  },
  { default: () => [] }
)

const isOpen = ref(false)
const isSaving = ref(false)
const errors = ref()

const state = ref<Partial<Schema>>({ win_points: 3, draw_points: 1, loss_points: 0 })

const handleReset = () => {
  set(state, { win_points: 3, draw_points: 1, loss_points: 0 })
  set(errors, undefined)
}

const onError = (event: FormErrorEvent) => set(errors, JSON.stringify(event.errors))

const onSubmit = async (event: FormSubmitEvent<Schema>) => {
  set(isSaving, true)

  try {
    const { dates, ...rest } = event.data

    const { data, error } = await supabase
      .from("season")
      .insert({
        ...rest,
        start_date: dates?.start?.toString() || null,
        end_date: dates?.end?.toString() || null
      })
      .select("id")

    toast.add({
      title: error ? `Error creating ${event.data.name}` : `${event.data.name} successfully created!`,
      icon: ui.icons[error ? "error" : "success"],
      color: error ? "error" : "success"
    })

    if (error) {
      throw new Error(`Error creating season: ${error.message}`)
    }

    handleReset()
    set(isOpen, false)
    emits("refresh")
  } catch (error) {
    console.error(error)
    set(errors, error)
  } finally {
    set(isSaving, false)
  }
}

const formFields = computed<Array<FormFieldInterface<Schema>>>(() => [
  {
    label: "Competition",
    key: "competition_id",
    type: "inputMenu",
    items: competitions.value,
    loading: pending.value,
    valueKey: "id",
    labelKey: "name",
    required: true
  },
  { label: "Name", key: "name", type: "text", required: true },
  { label: "Dates", key: "dates", type: "dates", required: true },
  { label: "Win Points", key: "win_points", type: "number", required: true },
  { label: "Draw Points", key: "draw_points", type: "number", required: true },
  { label: "Loss Points", key: "loss_points", type: "number", required: true }
])
</script>

<template>
  <u-modal
    v-model:open="isOpen"
    :title="`Create ${state.name || 'Season'}`"
  >
    <u-button :icon="ui.icons.plus" />

    <template #body>
      <u-alert
        v-if="errors"
        color="error"
        :title="`Error creating ${state.name}`"
        :description="errors"
        class="mb-5"
      />

      <u-form
        id="season-form"
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
        form="season-form"
        :loading="isSaving"
        @reset="handleReset"
        @close="close"
      />
    </template>
  </u-modal>
</template>
