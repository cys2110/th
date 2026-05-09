<script setup lang="ts">
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"

const {
  ui: { icons }
} = useAppConfig()

const router = useRouter()
const toast = useToast()
const supabase = useSupabaseClient()

const isOpen = ref(false)
const isUploading = ref(false)

const errors = ref()

const state = ref<Partial<TournamentType>>({})

const handleReset = () => {
  set(state, {})
  errors.value = undefined
}

const onError = (event: FormErrorEvent) => (errors.value = event.errors)

const onSubmit = async (event: FormSubmitEvent<TournamentType>) => {
  set(isUploading, true)

  try {
    const { error } = await supabase.from("tournaments").insert(event.data)

    if (error) throw error

    toast.add({
      title: `${event.data.name} successfully created!`,
      description: JSON.stringify(event.data),
      icon: icons.success,
      color: "success"
    })

    router.push({
      name: "tournament",
      params: {
        id: event.data.id,
        name: kebabCase(event.data.name)
      }
    })
  } catch (error) {
    errors.value = error
  } finally {
    set(isUploading, false)
  }
}

const formFields: FormFieldInterface<TournamentType>[] = [
  { label: "ID", key: "id", type: "text", subType: "number", required: true },
  { label: "Tours", key: "tours", type: "checkbox", items: TOUR_OPTIONS, required: true, icon: ICONS.tour },
  { label: "Name", key: "name", type: "text", required: true, class: "col-span-2" },
  { label: "Established", key: "established", type: "text", subType: "number", description: "Year the tournament was established" },
  { label: "Abolished", key: "abolished", type: "text", subType: "number", description: "Year the tournament was abolished" },
  { label: "Website", key: "website", type: "textarea", class: "col-span-2" }
]
</script>

<template>
  <u-modal
    :title="`Create ${state.name || 'Tournament'}`"
    v-model:open="isOpen"
  >
    <u-button
      color="warning"
      :icon="icons.plus"
    />

    <template #body>
      <u-form
        id="tournament-form"
        :schema="TournamentSchema"
        :state
        @submit="onSubmit"
        @error="onError"
      >
        <div class="grid grid-cols-2 items-center gap-3">
          <form-field
            v-for="field in formFields"
            :key="field.label"
            :field
            v-model="state"
          />
        </div>
      </u-form>

      <u-alert
        v-if="errors"
        color="error"
        :title="`Error saving ${state.name}`"
        class="mt-5"
      >
        <template #description>
          {{ errors }}
        </template>
      </u-alert>
    </template>

    <template #footer="{ close }">
      <form-footer
        form="tournament-form"
        :is-uploading
        @reset="handleReset"
        @close="close"
      />
    </template>
  </u-modal>
</template>
