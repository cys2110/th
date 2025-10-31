<script setup lang="ts">
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"

const { entry, player, refresh, type } = defineProps<{
  entry?: EntryInterface | null
  player?: Partial<PersonInterface>
  type?: MatchType
  refresh?: () => void
}>()

const {
  params: { edId, tour }
} = useRoute("event")
const toast = useToast()
const {
  ui: { icons }
} = useAppConfig()

const open = ref(false)
const uploading = ref(false)

defineShortcuts({
  meta_shift_n: () => (entry ? undefined : set(open, !get(open)))
})

const state = reactive<Partial<EntryInput>>({
  event: `${edId}-${tour}`,
  id: entry?.id,
  type,
  seed: entry?.seed,
  q_seed: entry?.q_seed,
  status: entry?.status,
  q_status: entry?.q_status,
  rank: entry?.rank
})

const formFields = computed<FormFieldInterface<EntrySchema>[]>(
  () =>
    [
      { label: "Type", key: "type", type: "radio", items: ["Singles", "Doubles"], required: true, class: "col-span-2" },
      { label: "Seed (Main Draw)", key: "seed", type: "number" },
      { label: "Status (Main Draw)", key: "status", type: "select", items: Object.entries(StatusEnum).map(([k, v]) => ({ value: k, label: v })) },
      { label: "Seed (Qualifying)", key: "q_seed", type: "number" },
      { label: "Status (Qualifying)", key: "q_status", type: "select", items: Object.entries(StatusEnum).map(([k, v]) => ({ value: k, label: v })) },
      !entry && { label: "Player 1", key: "player1", type: "search", subType: "players" },
      { label: "Rank", key: "rank", type: "number" },
      !entry && state.type === "Doubles" && { label: "Player 2", key: "player2", type: "search", subType: "players" },
      !entry && state.type === "Doubles" && { label: "Rank", key: "rank2", type: "number" }
    ].filter(Boolean) as FormFieldInterface<EntrySchema>[]
)

const handleReset = () => {
  state.type = entry?.type
  ;(state.seed = entry?.seed), (state.q_seed = entry?.q_seed)
  state.status = entry?.status
  state.q_status = entry?.q_status
  state.rank = entry?.rank
}

const onError = (event: FormErrorEvent) => {
  toast.add({
    title: "Please ensure fields are filled out correctly",
    description: event.errors.map(e => e.message).join(", "),
    icon: icons.error,
    color: "error"
  })
}

const onSubmit = async (event: FormSubmitEvent<EntrySchema>) => {
  set(uploading, true)
  try {
    const response = await $fetch(`/api/events/entries/${entry ? "update" : "create"}`, {
      query: event.data
    })

    if ((response as any).ok) {
      toast.add({
        title: `Entry ${entry ? "updated" : "created"}`,
        icon: icons.success,
        color: "success"
      })
      handleReset()
      set(open, false)
      if (refresh) {
        refresh()
      }
    } else {
      toast.add({
        title: `Error ${entry ? "updating" : "creating"} entry`,
        description: (response as any).message,
        icon: icons.error,
        color: "error"
      })
    }
  } catch (e) {
    toast.add({
      title: `Error ${entry ? "updating" : "creating"} entry`,
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
    :title="player ? `${player.first_name} ${player.last_name}` : 'Create Entry'"
    v-model:open="open"
  >
    <u-button :icon="entry ? ICONS.edit : icons.plus" />

    <template #body>
      <u-form
        id="entry-form"
        :schema="entrySchema"
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
        form="entry-form"
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
