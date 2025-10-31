<script setup lang="ts">
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"

const { tournament, refresh } = defineProps<{
  tournament?: TournamentInterface
  refresh?: () => void
}>()

const toast = useToast()
const {
  ui: { icons }
} = useAppConfig()
const open = ref(false)
const uploading = ref(false)

defineShortcuts({
  meta_enter: () => (tournament ? undefined : set(open, !get(open))),
  meta_shift_t: () => (tournament ? set(open, !get(open)) : undefined)
})

const state = reactive<Partial<TournamentSchema>>({
  id: tournament?.id,
  name: tournament?.name,
  tours: tournament?.tours ?? [],
  established: tournament?.established,
  abolished: tournament?.abolished,
  website: tournament?.website
})

const formFields: FormFieldInterface<TournamentSchema>[] = [
  { label: "Name", key: "name", type: "text", required: true, class: "col-span-2" },
  { label: "ID", key: "id", type: "text", subType: "number", required: true },
  { label: "Tours", key: "tours", type: "checkbox", items: TOUR_OPTIONS, required: true },
  { label: "Year Established", key: "established", type: "text", subType: "number" },
  { label: "Year Abolished", key: "abolished", type: "text", subType: "number" },
  { label: "Website", key: "website", type: "textarea", class: "col-span-2" }
]

const handleReset = () => {
  state.id = tournament?.id ?? 0
  state.name = tournament?.name ?? ""
  state.established = tournament?.established
  state.abolished = tournament?.abolished
  state.website = tournament?.website
  state.tours = tournament?.tours ?? []
}

const onError = (event: FormErrorEvent) => {
  toast.add({
    title: "Please ensure fields are filled out correctly",
    description: event.errors.map(e => e.message).join(", "),
    icon: icons.error,
    color: "error"
  })
}

const onSubmit = async (event: FormSubmitEvent<TournamentSchema>) => {
  set(uploading, true)
  try {
    const response = await $fetch(`/api/tournaments/${tournament ? "update" : "create"}`, {
      query: event.data
    })

    if ((response as any).ok) {
      toast.add({
        title: `Tournament ${tournament ? "updated" : "created"}`,
        icon: icons.success,
        color: "success"
      })
      handleReset()
      set(open, false)
      if (refresh) {
        refresh()
      } else {
        await navigateTo({ name: "tournament", params: { id: event.data.id, name: kebabCase(event.data.name) } })
      }
    } else {
      toast.add({
        title: `Error ${tournament ? "updating" : "creating"} tournament`,
        description: (response as any).message,
        icon: icons.error,
        color: "error"
      })
    }
  } catch (e) {
    toast.add({
      title: `Error ${tournament ? "updating" : "creating"} tournament`,
      description: (e as Error).message,
      icon: icons.error,
      color: "error"
    })
  } finally {
    set(uploading, false)
  }
}
</script>

<template>
  <u-modal
    :title="tournament ? `Edit ${tournament.name ?? tournament.id}` : 'Create Tournament'"
    v-model:open="open"
  >
    <u-button
      :icon="tournament ? ICONS.edit : icons.plus"
      :label="tournament ? `Edit ${tournament.name ?? tournament.id}` : 'Create Tournament'"
      block
    />

    <template #body>
      <u-form
        id="tournament-form"
        :schema="tournamentSchema"
        :state
        @submit="onSubmit"
        @error="onError"
      >
        <div class="grid grid-cols-2 gap-5 items-center">
          <form-field
            v-for="field in formFields"
            :key="field.label"
            :field
            v-model="state[field.key]"
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
