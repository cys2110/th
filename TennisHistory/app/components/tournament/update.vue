<script setup lang="ts">
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"

const props = defineProps<{
  tournament: TournamentType
}>()

const emit = defineEmits<{
  refresh: []
}>()

const toast = useToast()

const {
  ui: { icons }
} = useAppConfig()

const tournamentStore = useTournamentStore()

const isUploading = ref(false)

const state = ref(cloneDeep(props.tournament))

const handleReset = () => {
  set(state, cloneDeep(props.tournament))
}

const onError = (event: FormErrorEvent) => console.error(event.errors)

const onSubmit = async (event: FormSubmitEvent<TournamentType>) => {
  set(isUploading, true)

  // Only send fields that have changed to reduce payload size
  const fields = Object.keys(event.data) as Array<keyof TournamentType>

  const dirtyFields: Partial<TournamentType> = {}

  for (const field of fields) {
    if (!isEqual(event.data[field], props.tournament[field as keyof TournamentType])) {
      dirtyFields[field] = (event.data[field] as any) ?? null
    }
  }

  if (Object.keys(dirtyFields).length) {
    const supabase = useSupabaseClient()

    const { error } = await supabase.from("tournaments").update(dirtyFields).eq("id", Number(tournamentStore.id))

    if (error) {
      console.error("Error updating tournament:", error)
      set(isUploading, false)
      return
    }

    toast.add({
      title: `${event.data.name} successfully updated!`,
      description: JSON.stringify(event.data),
      icon: icons.success,
      color: "success"
    })

    emit("refresh")
  } else {
    toast.add({
      title: "No changes to save",
      description: tournamentStore.name,
      icon: icons.caution,
      color: "warning"
    })
  }

  set(isUploading, false)
}

const formFields: FormFieldInterface<TournamentType>[] = [
  { label: "Tours", key: "tours", type: "checkbox", items: TOUR_OPTIONS, required: true, icon: ICONS.tour },
  { label: "Name", key: "name", type: "text", required: true },
  { label: "Established", key: "established", type: "text", subType: "number", description: "Year the tournament was established" },
  { label: "Abolished", key: "abolished", type: "text", subType: "number", description: "Year the tournament was abolished" },
  { label: "Website", key: "website", type: "textarea", class: "col-span-4" }
]
</script>

<template>
  <div>
    <div class="flex justify-end gap-2">
      <u-button
        form="tournament-form"
        type="submit"
        :icon="isUploading ? ICONS.uploading : ICONS.save"
        color="warning"
      />

      <u-button
        :icon="icons.reload"
        color="warning"
        @click="handleReset"
      />
    </div>

    <u-form
      id="tournament-form"
      :schema="TournamentSchema"
      :state
      @submit="onSubmit"
      @error="onError"
    >
      <div class="grid grid-cols-4 items-center gap-3">
        <form-field
          v-for="field in formFields"
          :key="field.label"
          :field
          v-model="state"
        />
      </div>
    </u-form>
  </div>
</template>
