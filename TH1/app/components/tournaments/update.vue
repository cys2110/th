<script setup lang="ts">
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"

const props = defineProps<{
  tournament?: TournamentType
  refresh?: () => void
}>()

const {
  ui: { icons }
} = useAppConfig()
const router = useRouter()
const toast = useToast()

const open = ref(false)
const uploading = ref(false)

const initialState: Partial<TournamentFormSchema> = { ...props.tournament }

const state = ref<Partial<TournamentFormSchema>>(cloneDeep(initialState))

const handleReset = () => set(state, cloneDeep(initialState))

const onError = (event: FormErrorEvent) => console.error(event.errors)

const onSubmit = async (event: FormSubmitEvent<TournamentFormSchema>) => {
  set(uploading, true)

  // Only send fields that have changed to reduce payload size
  const fields = Object.keys(event.data) as (keyof TournamentFormSchema)[]
  const dirtyFields: Partial<TournamentFormSchema> = {
    id: event.data.id, // Always include ID to identify the tournament
    name: event.data.name // Always include name for server error message
  }

  for (const field of fields) {
    if (field === "id" || field === "name") continue // Already included

    if (!isEqual(event.data[field], initialState[field])) {
      dirtyFields[field] = (event.data[field] as any) ?? null
    }
  }

  if (Object.keys(dirtyFields).length > 2) {
    await $fetch(`/api/tournaments/${props.tournament ? "update" : "create"}`, {
      method: "POST",
      body: dirtyFields
    })
      .then(async response => {
        toast.add({
          title: `${event.data.name} successfully ${props.tournament ? "updated" : "created"}`,
          icon: icons.success,
          color: "success"
        })

        if (props.refresh) {
          props.refresh()

          await nextTick(() => {
            handleReset()

            set(open, false)
          })
        } else {
          router.push({
            name: "tournament",
            params: {
              id: event.data.id,
              name: kebabCase(event.data.name)
            }
          })
        }
      })
      .catch(error => {
        if (error.statusMessage === "Validation errors") {
          console.error(error.statusMessage, error.data?.data.validationErrors)
        } else {
          console.error(error)
        }

        toast.add({
          title: `Error ${props.tournament ? "updating" : "creating"} ${event.data.name}`,
          description: error.statusMessage || "An unexpected error occurred.",
          icon: icons.error,
          color: "error"
        })
      })
      .finally(() => {
        set(uploading, false)
      })
  } else {
    toast.add({
      title: `No changes to save for ${event.data.name}`,
      icon: icons.caution,
      color: "warning"
    })

    set(uploading, false)
  }
}

const formFields: FormFieldInterface<TournamentFormSchema>[] = [
  { label: "ID", key: "id", type: "text", subType: "number", required: true, disabled: !!props.tournament },
  { label: "Tours", key: "tours", type: "checkbox", items: TOUR_OPTIONS, required: true, icon: ICONS.tour },
  { label: "Name", key: "name", type: "text", required: true, class: "col-span-2" },
  { label: "Established", placeholder: "Enter year established", key: "established", type: "text", subType: "number" },
  { label: "Abolished", placeholder: "Enter year abolished", key: "abolished", type: "text", subType: "number" },
  { label: "Website", placeholder: "Enter website URL", key: "website", type: "textarea", class: "col-span-2" }
]
</script>

<template>
  <u-modal
    :title="state.name ?? 'Create Tournament'"
    v-model:open="open"
  >
    <u-button
      :icon="tournament ? ICONS.edit : icons.plus"
      :label="tournament?.name ?? 'Create Tournament'"
      color="warning"
      block
    />

    <template #body>
      <u-form
        id="tournament-form"
        :schema="tournamentFormSchema"
        :state
        @submit="onSubmit"
        @error="onError"
      >
        <div class="grid grid-cols-2 gap-3 items-center">
          <form-field
            v-for="field in formFields"
            :key="field.label"
            :field
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
        color="success"
        block
      />

      <u-button
        label="Reset"
        :icon="icons.reload"
        color="warning"
        @click="handleReset"
        block
      />

      <u-button
        label="Cancel"
        :icon="icons.error"
        color="error"
        @click="close"
        block
      />
    </template>
  </u-modal>
</template>
