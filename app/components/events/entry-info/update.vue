<script setup lang="ts">
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"

const { entry, relationship, refresh } = defineProps<{
  entry?: EntryInterface
  relationship?: string
  refresh: () => void
  iconOnly?: boolean
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
  draw: entry?.draw ?? "Main",
  type: entry?.type ?? "Singles",
  rank: entry?.rank,
  reason: entry?.reason,
  teammate: entry?.teammate,
  entry: entry ? { value: entry.id, label: entry.team.map((p: any) => `${p.first_name} ${p.last_name}`).join(" / ") } : undefined
})

const formFields: FormFieldInterface<EntryInfoSchema>[] = [
  {
    label: "Info Type",
    key: "relationship",
    type: "inputMenu",
    items: ["Alternate", "Default", "Last Direct Acceptance", "Qualifier", "Retirement", "Walkover", "Wild Card", "Withdrawal"],
    class: "col-span-2"
  },
  { label: "Type", key: "type", type: "radio", items: ["Singles", "Doubles"] },
  { label: "Draw", key: "draw", type: "radio", items: ["Main", "Qualifying"] }
]

const handleReset = () => {
  state.relationship = relationship
  state.draw = entry?.draw ?? "Main"
  state.type = entry?.type ?? "Singles"
  state.rank = entry?.rank
  state.reason = entry?.reason
  state.teammate = entry?.teammate
  state.entry = entry ? { value: entry.id, label: entry.team.map((p: any) => `${p.first_name} ${p.last_name}`).join(" / ") } : undefined
  state.players = undefined
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
    <u-button :icon="entry ? ICONS.edit : icons.plus">
      <template
        #default
        v-if="!iconOnly"
      >
        <slot />
        <template v-if="!$slots['default']"> Create Entry Info </template>
      </template>
    </u-button>

    <template #body>
      <u-form
        id="entry-info-form"
        :schema="entryInfoSchema"
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
              :class="field.class"
            />
          </template>

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
            <form-select-search
              v-else-if="state.type"
              v-model="state.players"
              type="players"
              multiple
              :placeholder="state.type === 'Doubles' ? 'Players' : 'Player'"
              block
            />
          </div>

          <form-input-number
            v-if="state.relationship === 'Last Direct Acceptance'"
            v-model="state.rank"
            :placeholder="'Rank'"
          />

          <template v-if="state.relationship && ['Default', 'Retirement', 'Walkover', 'Withdrawal'].includes(state.relationship)">
            <form-input
              v-model="state.reason"
              placeholder="Reason"
            />

            <form-input
              v-if="state.type === 'Doubles'"
              v-model="state.teammate"
              placeholder="Teammate"
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
