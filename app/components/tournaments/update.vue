<script setup lang="ts">
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"

const { tournament, refresh } = defineProps<{
  tournament?: TournamentInterface
  refresh?: () => void
  iconOnly?: boolean
}>()

const toast = useToast()
const {
  ui: { icons }
} = useAppConfig()

defineShortcuts({
  meta_enter: () => (tournament ? undefined : set(open, !get(open))),
  meta_shift_t: () => (tournament ? set(open, !get(open)) : undefined)
})

const open = ref(false)
const uploading = ref(false)
const state = reactive<Partial<TournamentSchema>>({ ...tournament })

const formFields: FormFieldInterface<TournamentSchema>[] = [
  {
    label: "Name",
    key: "name",
    type: "text",
    required: true,
    class: "col-span-2"
  },
  { label: "ID", key: "id", type: "text", subType: "number", required: true },
  {
    label: "Tours",
    key: "tours",
    type: "checkbox",
    items: TOUR_OPTIONS,
    required: true
  },
  {
    label: "Year Established",
    key: "established",
    type: "text",
    subType: "number"
  },
  {
    label: "Year Abolished",
    key: "abolished",
    type: "text",
    subType: "number"
  },
  { label: "Website", key: "website", type: "textarea", class: "col-span-2" }
]

const handleReset = () => {
  state.id = tournament?.id
  state.name = tournament?.name
  state.established = tournament?.established
  state.abolished = tournament?.abolished
  state.website = tournament?.website
  state.tours = tournament?.tours ?? []
}

const onError = (event: FormErrorEvent) => {
  console.error(event.errors)
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
        await navigateTo({
          name: "tournament",
          params: { id: event.data.id, name: kebabCase(event.data.name) }
        })
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
      :label="iconOnly ? undefined : tournament ? `Edit ${tournament.name ?? tournament.id}` : 'Create Tournament'"
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
          <template
            v-for="field in formFields"
            :key="field.label"
          >
            <form-input
              v-if="field.type === 'text'"
              v-model="state[field.key]"
              :placeholder="field.label"
              :type="field.subType"
              :class="field.class"
            />

            <u-checkbox-group
              v-else-if="field.type === 'checkbox'"
              v-model="(state[ field.key ] as string[])"
              :legend="field.label"
              :items="field.items"
              orientation="horizontal"
            />

            <form-textarea
              v-else-if="field.type === 'textarea'"
              v-model="state[field.key]"
              :placeholder="field.label"
              :class="field.class"
            />
          </template>
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
