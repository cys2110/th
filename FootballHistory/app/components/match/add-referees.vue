<script setup lang="ts">
import { array, boolean, object, string, z } from "zod"
import { set } from "@vueuse/core"
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"
import { REFEREE_TYPE_MAPPING } from "#imports"

const refereeSchema = object({
  person: object({ id: string() }),
  referee_type: RefereeType
})
type RefereeSchema = z.infer<typeof refereeSchema>

const schema = array(refereeSchema).default([])

type Schema = z.infer<typeof schema>

const emits = defineEmits<{ refresh: [] }>()

const route = useRoute("match")
const toast = useToast()
const supabase = useSupabaseClient()
const { ui } = useAppConfig()

const isOpen = ref(false)
const isSaving = ref(false)
const errors = ref()

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
    const { error } = await supabase.from("match_referee").insert(
      event.data.map(referee => ({
        match_id: route.params.match_id,
        person_id: referee.person.id,
        type: referee.referee_type
      }))
    )

    if (error) {
      console.error("Error creating referees:", error)
      set(errors, error)
    }

    toast.add({
      title: error ? "Error adding referees" : "Referees successfully created!",
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
    title="Add Referees"
  >
    <u-button :icon="ui.icons.plus" />

    <template #body>
      <u-alert
        v-if="errors"
        color="error"
        title="Error adding referees"
        :description="errors"
        class="mb-5"
      />

      <u-form
        id="referee-form"
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
          :schema="refereeSchema"
          class="space-y-3"
        >
          <div class="grid grid-cols-2 gap-2 items-end">
            <u-form-field
              name="person"
              :label="index === 0 ? 'Referee' : ''"
              required
            >
              <person-search v-model="<any>state[index]!.person" />
            </u-form-field>

            <u-form-field
              name="referee_type"
              :label="index === 0 ? 'Type' : ''"
              required
              class="flex-1"
            >
              <u-field-group class="w-full">
                <u-input-menu
                  v-model="state[index]!.referee_type"
                  :items="Object.entries(REFEREE_TYPE_MAPPING).map(([key, value]) => ({ label: value, value: key }))"
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
          </div>
        </u-form>

        <u-button
          :icon="ui.icons.plus"
          label="Add referee"
          block
          size="xs"
          @click="
            () => {
              state.push({} as RefereeSchema)
            }
          "
        />
      </u-form>
    </template>

    <template #footer="{ close }">
      <form-footer
        form="referee-form"
        :loading="isSaving"
        @reset="handleReset"
        @close="close"
      />
    </template>
  </u-modal>
</template>
