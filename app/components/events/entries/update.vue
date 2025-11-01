<script setup lang="ts">
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"

const { entry, player, refresh, type } = defineProps<{
  entry?: EntryInterface | null
  player?: Partial<PersonInterface>
  type?: MatchType
  refresh?: () => void
  iconOnly?: boolean
  block?: boolean
}>()

const {
  params: { edId, tour }
} = useRoute("event")
const toast = useToast()
const {
  ui: { icons }
} = useAppConfig()
const refreshCounter = defineModel<number>()

const open = ref(false)
const uploading = ref(false)

defineShortcuts({
  meta_shift_n: () => (entry ? undefined : set(open, !get(open)))
})

const state = reactive<Partial<EntryInput>>({
  ...entry,
  event: `${edId}-${tour}`,
  type,
  id: player?.id,
  status: entry?.status ? { value: entry.status, label: StatusEnum[entry.status] } : undefined,
  q_status: entry?.q_status ? { value: entry.q_status, label: StatusEnum[entry.q_status] } : undefined
})

const formFields = computed<FormFieldInterface<EntrySchema>[]>(
  () =>
    [
      { label: "Type", key: "type", type: "radio", items: ["Singles", "Doubles"], class: "col-span-2" },
      !entry && {
        label: "Player 1",
        key: "player1",
        type: "search",
        subType: "players",
        class: state.type === "Doubles" ? "col-span-1" : "col-span-2"
      },
      !entry && state.type === "Doubles" && { label: "Player 2", key: "player2", type: "search", subType: "players" },
      { label: "Seed (Main Draw)", key: "seed", type: "number" },
      { label: "Seed (Qualifying)", key: "q_seed", type: "number" },
      { label: "Status (Main Draw)", key: "status", type: "inputMenu", items: Object.entries(StatusEnum).map(([k, v]) => ({ value: k, label: v })) },
      {
        label: "Status (Qualifying)",
        key: "q_status",
        type: "inputMenu",
        items: Object.entries(StatusEnum).map(([k, v]) => ({ value: k, label: v }))
      },
      { label: "Rank", key: "rank", type: "number" },
      !entry && state.type === "Doubles" && { label: "Rank", key: "rank2", type: "number" },
      { label: "Points", key: "points", type: "number" },
      { label: "Prize Money", key: "pm", type: "number" }
    ].filter(Boolean) as FormFieldInterface<EntrySchema>[]
)

const handleReset = () => {
  state.seed = entry?.seed
  state.q_seed = entry?.q_seed
  state.status = entry?.status ? { value: entry.status, label: StatusEnum[entry.status] } : undefined
  state.q_status = entry?.q_status ? { value: entry.q_status, label: StatusEnum[entry.q_status] } : undefined
  state.rank = entry?.rank
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
      if (refreshCounter.value !== undefined) {
        refreshCounter.value++
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
    <u-button
      :icon="entry ? ICONS.edit : icons.plus"
      :block
    >
      <template
        #default
        v-if="!iconOnly"
      >
        <slot />
        <template v-if="!$slots['default']"> Create Entry </template>
      </template>
    </u-button>

    <template #body>
      <u-form
        id="entry-form"
        :schema="entrySchema"
        :state
        @submit="onSubmit"
        @error="onError"
      >
        <div class="grid grid-cols-2 gap-5 items-center">
          <template
            v-for="field in formFields"
            :key="field.label"
          >
            <u-radio-group
              v-if="field.type === 'radio'"
              v-model="(state[field.key] as string)"
              :items="field.items"
              :legend="field.label"
              orientation="horizontal"
              :class="field.class"
            />

            <form-input-number
              v-else-if="field.type === 'number'"
              v-model="(state[field.key] as number)"
              :placeholder="field.label"
            />

            <form-select-menu
              v-else-if="field.type === 'inputMenu'"
              v-model="(state[field.key] as any)"
              :items="(field.items as any[])"
              :placeholder="field.label"
              :multiple="field.multiple"
              block
            />

            <form-select-search
              v-else-if="field.type === 'search'"
              v-model="(state[field.key] as any)"
              :type="field.subType!"
              :placeholder="field.label"
              block
              :class="field.class"
            />
          </template>
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
