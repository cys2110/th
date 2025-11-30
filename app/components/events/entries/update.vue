<script setup lang="ts">
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"
import { cloneDeep, isEqual } from "lodash"

const { entry, player, refresh, type } = defineProps<{
  entry?: EntryType | null
  player?: PersonType
  type?: MatchTypeEnumType
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

const open = ref(false)
const uploading = ref(false)
const refreshCounter = defineModel<number>()

const initialState = {
  ...entry,
  event: `${edId}-${tour}`,
  type,
  id: player?.id,
  status: entry?.status ? { value: entry.status, label: statusEnum[entry.status as keyof typeof statusEnum] } : undefined,
  q_status: entry?.q_status ? { value: entry.q_status, label: statusEnum[entry.q_status as keyof typeof statusEnum] } : undefined,
  rank2: undefined,
  player1: undefined,
  player2: undefined
}

const state = ref<Partial<EntryFormInput>>(cloneDeep(initialState))

const formFields = computed<FormFieldInterface<EntryFormSchema>[]>(
  () =>
    [
      { label: "Type", key: "type", type: "radio", items: ["Singles", "Doubles"], required: true, class: entry ? "col-span-1" : "col-span-2" },
      !entry
        ? {
            label: "Player 1",
            type: "fieldGroup",
            required: true,
            class: state.value.type === "Doubles" ? "col-span-1" : "col-span-2",
            children: [
              { label: "Player", key: "player1", type: "search", subType: "Player", icon: ICONS.player },
              { label: "Rank", key: "rank", type: "number" }
            ]
          }
        : {
            label: "Rank",
            key: "rank",
            type: "number",
            required: true
          },
      !entry &&
        state.value.type === "Doubles" && {
          label: "Player 2",
          type: "fieldGroup",
          required: true,
          children: [
            { label: "Player", key: "player2", type: "search", subType: "Player", icon: ICONS.player },
            { label: "Rank", key: "rank2", type: "number" }
          ]
        },
      {
        label: "Seed",
        type: "fieldGroup",
        children: [
          { label: "Main Draw", key: "seed", type: "number" },
          { label: "Qualifying", key: "q_seed", type: "number" }
        ]
      },
      {
        label: "Status",
        type: "fieldGroup",
        children: [
          { label: "Main Draw", key: "status", type: "inputMenu", items: Object.entries(statusEnum).map(([k, v]) => ({ value: k, label: v })) },
          { label: "Qualifying", key: "q_status", type: "inputMenu", items: Object.entries(statusEnum).map(([k, v]) => ({ value: k, label: v })) }
        ]
      },
      { label: "Points", key: "points", type: "number" },
      { label: "Prize Money", key: "pm", type: "number" }
    ].filter(Boolean) as FormFieldInterface<EntryFormSchema>[]
)

const handleReset = () => {
  const type = state.value.type
  state.value = cloneDeep(initialState)
  state.value.type = type
}

const onError = (event: FormErrorEvent) => console.error(event.errors)

const onSubmit = async (event: FormSubmitEvent<EntryFormSchema>) => {
  set(uploading, true)

  // Get dirty fields from the form
  const fields = Object.keys(event.data) as (keyof EntryFormSchema)[]
  const dirtyFields: Partial<EntryFormSchema> = {}
  fields.forEach(field => {
    if (!isEqual(event.data[field], initialState[field])) {
      // @ts-expect-error
      dirtyFields[field] = event.data[field] ?? null
    }
  })

  if (Object.keys(dirtyFields).length) {
    dirtyFields["id"] = event.data.id // Always include the seed ID
    dirtyFields["type"] = event.data.type // Always include the type
    dirtyFields["event"] = event.data.event // Always include the event

    const response = await $fetch(`/api/events/entries/${entry ? "update" : "create"}`, {
      method: "POST",
      body: dirtyFields
    })

    if ((response as any).ok) {
      toast.add({
        title: `Entry ${entry ? "updated" : "created"}`,
        icon: icons.success,
        color: "success"
      })

      if (refreshCounter.value !== undefined) {
        refreshCounter.value++
      } else if (refresh) {
        refresh()
      }

      handleReset() // Reset form
      set(open, false) // Close modal
    } else {
      toast.add({
        title: `Error ${entry ? "updating" : "creating"} entry`,
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
    :title="player ? `${player.first_name} ${player.last_name}` : 'Create Entry'"
    v-model:open="open"
  >
    <u-button
      :icon="entry ? ICONS.edit : icons.plus"
      :block="!iconOnly"
    >
      <template
        #default
        v-if="!iconOnly"
      >
        <slot />
        <template v-if="!$slots['default']"> Create Seed </template>
      </template>
    </u-button>

    <template #body>
      <u-form
        id="entry-form"
        :schema="entryFormSchema"
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
