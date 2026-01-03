<script setup lang="ts">
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"
import { cloneDeep, isEqual } from "lodash"

const props = defineProps<{
  tournament?: TournamentType
  refresh?: () => void
}>()

const toast = useToast()
const router = useRouter()
const {
  ui: { icons }
} = useAppConfig()

const open = ref(false)
const uploading = ref(false)

const initialState = {
  ...props.tournament,
  tours: props.tournament?.tours ? props.tournament.tours.map(tour => tourEnumTransform.parse(tour) as TourInputEnumType) : []
}

const state = ref<Partial<TournamentFormInput>>(cloneDeep(initialState))

const handleReset = () => set(state, cloneDeep(initialState))

const onError = (event: FormErrorEvent) => console.error(event.errors)

const onSubmit = async (event: FormSubmitEvent<TournamentFormSchema>) => {
  set(uploading, true)

  // Only send the changed fields to reduce payload size
  const fields = Object.keys(event.data) as (keyof TournamentFormSchema)[]
  const dirtyFields: Partial<TournamentFormSchema> = {}

  for (const field of fields) {
    if (field === "id") continue // Always include ID to identify the tournament

    if (!isEqual(event.data[field], initialState[field])) {
      // @ts-expect-error
      dirtyFields[field] = event.data[field] ?? null
    }
  }

  if (Object.keys(dirtyFields).length) {
    const response: WriteResponseType = await $fetch(`/api/tournaments/${props.tournament ? "update" : "create"}`, {
      method: "POST",
      body: dirtyFields
    })

    if (response.success) {
      toast.add({
        title: `${event.data.name} successfully ${props.tournament ? "updated" : "created"}`,
        icon: icons.success,
        color: "success"
      })

      if (props.refresh) {
        // Refresh tournament details and update form with latest data
        props.refresh()

        nextTick(() => {
          handleReset()
        })
      } else {
        // Navigate to the new tournament page
        router.push({
          name: "tournament",
          params: {
            id: event.data.id,
            name: kebabCase(event.data.name)
          }
        })
      }
    } else {
      toast.add({
        title: `Error ${props.tournament ? "updating" : "creating"} ${event.data.name}`,
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

const formFields: FormFieldInterface<TournamentFormSchema>[] = [
  { label: "ID", key: "id", type: "text", subType: "number", required: true, disabled: !!props.tournament },
  { label: "Tours", key: "tours", type: "checkbox", items: TOUR_OPTIONS, required: true },
  { label: "Name", key: "name", type: "text", required: true, class: "col-span-2" },
  { label: "Established", placeholder: "Enter year established", key: "established", type: "text", subType: "number" },
  { label: "Abolished", placeholder: "Enter year abolished", key: "abolished", type: "text", subType: "number" },
  { label: "Website", placeholder: "Enter website URL", key: "website", type: "textarea", class: "col-span-2" }
]
</script>

<template>
  <u-modal
    :title="state?.name ?? 'Create Tournament'"
    v-model:open="open"
  >
    <u-button
      :icon="tournament ? ICONS.edit : icons.plus"
      :label="tournament?.name ?? 'Create Tournament'"
      color="Doubles"
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
        :icon="uploading ? ICONS.uploading : icons.upload"
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
