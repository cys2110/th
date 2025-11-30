<script setup lang="ts">
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"
import { isEqual } from "lodash"

const { tournament, refresh } = defineProps<{
  tournament?: TournamentType
  refresh?: () => void
}>()

const toast = useToast()
const {
  ui: { icons }
} = useAppConfig()

const open = ref(false)
const uploading = ref(false)

const initialState = {
  ...tournament,
  tours: tournament?.tours
    ? tournament.tours.map(tour => {
        return tourEnum[tour]
      })
    : []
}

const state = ref<Partial<TournamentFormInput>>({ ...initialState })

const formFields = computed<FormFieldInterface<TournamentFormSchema>[]>(
  () =>
    [
      { label: "Name", key: "name", type: "text", required: true, class: tournament ? "col-span-1" : "col-span-2" },
      !tournament && { label: "ID", key: "id", type: "text", subType: "number", required: true },
      { label: "Tours", key: "tours", type: "checkbox", items: TOUR_OPTIONS, required: true },
      { label: "Established", placeholder: "Enter year established", key: "established", type: "text", subType: "number" },
      { label: "Abolished", placeholder: "Enter year abolished", key: "abolished", type: "text", subType: "number" },
      { label: "Website", placeholder: "Enter website URL", key: "website", type: "textarea", class: "col-span-2" }
    ].filter(Boolean) as FormFieldInterface<TournamentFormSchema>[]
)

const handleReset = () => set(state, { ...initialState })

const onError = (event: FormErrorEvent) => console.error(event.errors)

const onSubmit = async (event: FormSubmitEvent<TournamentFormSchema>) => {
  set(uploading, true)

  // Get dirty fields from the form
  const fields = Object.keys(event.data) as (keyof TournamentFormSchema)[]
  const dirtyFields: Partial<TournamentFormSchema> = {}
  fields.forEach(field => {
    if (!isEqual(event.data[field], initialState[field])) {
      // @ts-expect-error
      dirtyFields[field] = event.data[field] ?? null
    }
  })

  if (Object.keys(dirtyFields).length) {
    dirtyFields["id"] = event.data.id // Always include the tournament ID

    const response = await $fetch(`/api/tournaments/${tournament ? "update" : "create"}`, {
      method: "POST",
      body: dirtyFields
    })

    if ((response as any).ok) {
      toast.add({
        title: `${event.data.name} ${tournament ? "updated" : "created"}`,
        icon: icons.success,
        color: "success"
      })

      if (refresh) {
        refresh() // Refresh tournament details
        handleReset() // Reset form
      } else {
        handleReset() // Reset form
        // Navigate to the new tournament page
        await navigateTo({
          name: "tournament",
          params: { id: event.data.id.toString(), name: kebabCase(event.data.name) }
        })
      }

      set(open, false) // Close modal
    } else {
      toast.add({
        title: `Error ${tournament ? "updating" : "creating"} tournament`,
        icon: icons.error,
        color: "error"
      })
    }
  } else {
    toast.add({
      title: "No changes to save",
      icon: icons.caution,
      color: "warning"
    })
  }

  set(uploading, false)
}
</script>

<template>
  <u-modal
    :title="tournament?.name ?? 'Create Tournament'"
    v-model:open="open"
  >
    <u-button
      :icon="tournament ? ICONS.edit : icons.plus"
      :label="tournament?.name ?? 'Create Tournament'"
      block
    />

    <template #body>
      <u-form
        id="tournament-form"
        :schema="tournamentFormSchema"
        :state="state"
        @submit="onSubmit"
        @error="onError"
      >
        <div class="grid grid-cols-2 gap-3 items-center">
          <form-field
            v-for="field in formFields"
            :key="field.label"
            :field="field"
            v-model="state"
          />
        </div>
      </u-form>
    </template>

    <template #footer="{ close }">
      <u-button
        form="tournament-form"
        type="submit"
        label="Save"
        :icon="uploading ? ICONS.uploading : icons.check"
        block
      />
      <u-button
        label="Reset"
        :icon="icons.reload"
        @click="handleReset"
        block
        color="warning"
      />
      <u-button
        label="Cancel"
        :icon="icons.error"
        @click="close"
        block
        color="error"
      />
    </template>
  </u-modal>
</template>
