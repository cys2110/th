<script setup lang="ts">
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"

const { entry, relationship, refresh } = defineProps<{
  entry?: EntryInterface
  relationship?: string
  refresh: () => void
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
  meta_shift_i: () => (entry ? undefined : set(open, !get(open)))
})

const state = reactive<Partial<EntryInfoInput>>({
  event: `${edId}-${tour}`,
  relationship,
  draw: entry?.draw,
  type: entry?.type,
  rank: entry?.rank,
  reason: entry?.reason,
  teammate: entry?.teammate,
  entry: entry ? { value: entry.id, label: entry.team.map((p: any) => `${p.first_name} ${p.last_name}`).join(" / ") } : undefined
})

const formFields: FormFieldInterface<EntryInfoSchema>[] = [
  {
    label: "Info Type",
    key: "relationship",
    type: "select",
    items: ["Alternate", "Default", "Last Direct Acceptance", "Qualifier", "Retirement", "Walkover", "Wild Card", "Withdrawal"],
    required: true,
    class: "col-span-2"
  },
  { label: "Draw", key: "draw", type: "radio", items: ["Main", "Qualifying"], required: true },
  { label: "Type", key: "type", type: "radio", items: ["Singles", "Doubles"], required: true }
]

const handleReset = () => {
  state.relationship = relationship
  state.draw = entry?.draw
  state.type = entry?.type
  state.rank = entry?.rank
  state.reason = entry?.reason
  state.teammate = entry?.teammate
  state.entry = entry ? { value: entry.id, label: entry.team.map((p: any) => `${p.first_name} ${p.last_name}`).join(" / ") } : undefined
  state.players = undefined
}

const onError = (event: FormErrorEvent) => {
  toast.add({
    title: "Please ensure fields are filled out correctly",
    description: event.errors.map(e => e.message).join(", "),
    icon: icons.error,
    color: "error"
  })
}

const onSubmit = async (event: FormSubmitEvent<EntryInfoSchema>) => {
  set(uploading, true)
  try {
    const response = await $fetch(`/api/events/entry-info/${entry ? "update" : "create"}`, {
      query: event.data
    })

    if ((response as any).ok) {
      toast.add({
        title: `${event.data.relationship} ${entry ? "updated" : "created"}`,
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
        title: `Error ${entry ? "updating" : "creating"} ${event.data.relationship.toLowerCase()}`,
        description: (response as any).message,
        icon: icons.error,
        color: "error"
      })
    }
  } catch (e) {
    toast.add({
      title: `Error ${entry ? "updating" : "creating"} ${event.data.relationship.toLowerCase()}`,
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
    :title="entry ? `Edit ${relationship}` : `Create ${state.relationship || 'Entry Info'}`"
    v-model:open="open"
  >
    <u-button
      :icon="entry ? ICONS.edit : icons.plus"
      block
    />

    <template #body>
      <u-form
        id="entry-info-form"
        :schema="entryInfoSchema"
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

          <div class="col-span-2">
            <form-select-search
              v-if="state.type && state.relationship && state.relationship !== 'Withdrawal'"
              v-model="state.entry"
              type="events/entries"
              :placeholder="state.type === 'Doubles' ? 'Select Team' : 'Select Player'"
              :id="edId"
              :tour="(tour as keyof typeof TourEnum)"
              :match-type="state.type"
              block
            />
            <form-field
              v-else-if="state.type"
              v-model="state.players"
              :field="{ label: state.type === 'Doubles' ? 'Players' : 'Player', key: 'players', type: 'search', subType: 'players', multiple: true }"
            />
          </div>

          <form-field
            v-if="state.relationship === 'Last Direct Acceptance'"
            v-model="state.rank"
            :field="{ label: 'Rank', key: 'rank', type: 'number' }"
          />

          <template v-if="state.relationship && ['Default', 'Retirement', 'Walkover', 'Withdrawal'].includes(state.relationship)">
            <form-field
              v-model="state.reason"
              :field="{ label: 'Reason', key: 'reason', type: 'text' }"
            />

            <form-field
              v-if="state.type === 'Doubles'"
              v-model="state.teammate"
              :field="{ label: 'Teammate', key: 'teammate', type: 'text' }"
            />
          </template>
        </div>
      </u-form>
    </template>

    <template #footer="{ close }">
      <u-button
        form="entry-info-form"
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
