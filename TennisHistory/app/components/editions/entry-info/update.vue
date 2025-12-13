<script setup lang="ts">
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"
import { cloneDeep, isEqual } from "lodash"

const { entry, relationship, refresh } = defineProps<{
  entry?: EntryInfoType
  relationship?: string
  refresh: () => void
  iconOnly?: boolean
}>()

const {
  params: { edId }
} = useRoute("edition")
const toast = useToast()
const {
  ui: { icons }
} = useAppConfig()

const open = ref(false)
const uploading = ref(false)

const initialState = {
  ...entry,
  edition: Number(edId),
  relationship,
  draw: entry?.draw,
  players: undefined,
  id: entry ? { value: entry.id, label: entry.team.map((p: any) => `${p.first_name} ${p.last_name}`).join(" / ") } : undefined,
  tour: entry?.tour ? (tourEnum[entry.tour as keyof typeof tourEnum] as TourEnumType) : undefined
}

const state = ref<Partial<EntryInfoFormInput>>(cloneDeep(initialState))

const formFields = computed<FormFieldInterface<EntryInfoFormSchema>[]>(
  () =>
    [
      {
        label: "Info Type",
        key: "relationship",
        type: "inputMenu",
        items: ["Alternate", "Default", "Last Direct Acceptance", "Lucky Loser", "Qualifier", "Retirement", "Walkover", "Wild Card", "Withdrawal"],
        required: true
      },
      { label: "Tour", key: "tour", type: "radio", items: TOUR_OPTIONS, required: true },
      { label: "Type", key: "type", type: "radio", items: ["Singles", "Doubles"], required: true },
      { label: "Draw", key: "draw", type: "radio", items: ["Main", "Qualifying"], required: true },
      state.value.relationship &&
        (state.value.relationship === "Withdrawal"
          ? {
              label: state.value.type === "Doubles" ? "Players" : "Player",
              key: "players",
              type: "search",
              subType: "Player",
              required: true,
              class: "col-span-2",
              icon: ICONS.player,
              multiple: true
            }
          : {
              label: state.value.type === "Doubles" ? "Team" : "Player",
              key: "id",
              type: "search",
              subType: "Entry",
              placeholder: "Entry",
              required: true,
              class: "col-span-2",
              id: edId,
              tour: state.value.tour,
              matchType: state.value.type,
              icon: state.value.type === "Doubles" ? ICONS.people : ICONS.person
            }),
      state.value.relationship &&
        state.value.relationship === "Last Direct Acceptance" && { label: "Rank", key: "rank", type: "number", class: "col-span-2" },
      state.value.relationship &&
        ["Default", "Retirement", "Walkover", "Withdrawal"].includes(state.value.relationship) && {
          label: "Reason",
          key: "reason",
          type: "text",
          class: state.value.type === "Doubles" ? "col-span-1" : "col-span-2"
        },
      state.value.relationship &&
        ["Default", "Retirement", "Walkover", "Withdrawal"].includes(state.value.relationship) &&
        state.value.type === "Doubles" && { label: "Teammate", key: "teammate", type: "text" }
    ].filter(Boolean) as FormFieldInterface<EntryInfoFormSchema>[]
)

const handleReset = () => set(state, cloneDeep(initialState))

const onError = (event: FormErrorEvent) => console.error(event.errors)

const onSubmit = async (event: FormSubmitEvent<EntryInfoFormSchema>) => {
  set(uploading, true)

  // Get dirty fields from the form
  const fields = Object.keys(event.data) as (keyof EntryInfoFormSchema)[]
  const dirtyFields: Partial<EntryInfoFormSchema> = {}
  fields.forEach(field => {
    if (!isEqual(event.data[field], initialState[field as keyof typeof initialState])) {
      // @ts-expect-error
      dirtyFields[field] = event.data[field] ?? null
    }
  })

  if (Object.keys(dirtyFields).length) {
    dirtyFields["id"] = event.data.id // Always include the seed ID
    dirtyFields["draw"] = event.data.draw // Always include the draw
    dirtyFields["relationship"] = event.data.relationship // Always include the relationship

    const response = await $fetch(`/api/editions/entry-info/${entry ? "update" : "create"}`, {
      method: "POST",
      body: dirtyFields
    })

    if ((response as any).ok) {
      toast.add({
        title: `${event.data.relationship} ${entry ? "updated" : "created"}`,
        icon: icons.success,
        color: "success"
      })

      refresh() // Refresh entry info details

      nextTick(() => {
        handleReset() // Reset form
        set(open, false) // Close modal
      })
    } else {
      toast.add({
        title: `Error ${entry ? "updating" : "creating"} ${event.data.relationship.toLowerCase()}`,
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
    :title="entry ? `Edit ${relationship}` : `Create ${state.relationship || 'Entry Info'}`"
    v-model:open="open"
  >
    <u-button
      :icon="entry ? ICONS.edit : icons.plus"
      block
    >
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
        :schema="entryInfoFormSchema"
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
