<script setup lang="ts">
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"
import type { FetchError } from "ofetch"

const props = withDefaults(
  defineProps<{
    entry?: EntryInfoType
    relationship?: string
    refresh: () => void
    iconOnly?: boolean
  }>(),
  {
    iconOnly: false
  }
)

const {
  params: { edId }
} = useRoute("edition")
const toast = useToast()
const {
  ui: { icons }
} = useAppConfig()
const tournamentStore = useTournamentStore()

const open = ref(false)
const uploading = ref(false)

const { data: teams, status } = await useFetch("/api/edition/entries/team-list", {
  query: { edId },
  default: () => [],
  onResponseError: ({ error }) => console.error("Error fetching teams:", error)
})

const initialState = {
  ...props.entry,
  edition: Number(edId),
  relationship: props.relationship,
  draw: props.entry?.draw,
  players: undefined,
  id: props.entry ? { value: props.entry.id, label: props.entry.team.map((p: any) => `${p.first_name} ${p.last_name}`).join(" / ") } : undefined,
  tour: props.entry?.tour
    ? (tourEnum[props.entry.tour as keyof typeof tourEnum] as TourInputEnumType)
    : (tourEnum[tournamentStore.tours[0] as keyof typeof tourEnum] as TourInputEnumType)
}

const state = ref<Partial<EntryInfoFormSchema>>(cloneDeep(initialState))

const handleReset = () => set(state, cloneDeep(initialState))

const onError = (event: FormErrorEvent) => console.error(event.errors)

const onSubmit = async (event: FormSubmitEvent<EntryInfoFormSchema>) => {
  set(uploading, true)

  // Get dirty fields from the form
  const fields = Object.keys(event.data) as (keyof EntryInfoFormSchema)[]
  const dirtyFields: Partial<EntryInfoFormSchema> = {}

  for (const field of fields) {
    if (field === "id" || field === "draw" || field === "relationship") {
      // @ts-expect-error
      dirtyFields[field] = event.data[field]
    }

    if (!isEqual(event.data[field], initialState[field as keyof typeof initialState])) {
      // @ts-expect-error
      dirtyFields[field] = event.data[field] ?? null
    }
  }

  if (Object.keys(dirtyFields).length) {
    try {
      const response = await $fetch(`/api/edition/entry-info/${props.entry ? "update" : "create"}`, {
        method: "POST",
        body: dirtyFields
      })

      if (response.success) {
        toast.add({
          title: `${event.data.relationship} ${props.entry ? "updated" : "created"}`,
          icon: icons.success,
          color: "success"
        })

        props.refresh() // Refresh entry info details

        nextTick(() => {
          handleReset() // Reset form
          set(open, false) // Close modal
        })
      } else {
        toast.add({
          title: `Error ${props.entry ? "updating" : "creating"} ${event.data.relationship.toLowerCase()}`,
          icon: icons.error,
          color: "error"
        })
      }
    } catch (e) {
      if (typeof e === "object" && e && "statusMessage" in e) {
        const err = e as FetchError<ValidationError>

        if (err.statusMessage === "Invalid request body") {
          console.error(
            "Validation errors: ",
            err.data?.validationErrors.map(e => `${e.path.join(".")}: ${e.message}`)
          )
        }
      } else {
        console.error(e)
      }

      toast.add({
        title: `Error ${props.entry ? "updating" : "creating"} ${event.data.relationship.toLowerCase()}`,
        description: (e as Error).message,
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

const formFields = computed<FormFieldInterface<EntryInfoFormSchema>[]>(() => {
  const tourOptions = tournamentStore.tours.map(tour => ({
    label: tour,
    value: tourEnum[tour] as TourInputEnumType
  }))

  const fields: FormFieldInterface<EntryInfoFormSchema>[] = [
    {
      label: "Info Type",
      key: "relationship",
      type: "inputMenu",
      items: ["Alternate", "Default", "Last Direct Acceptance", "Lucky Loser", "Qualifier", "Retirement", "Walkover", "Wild Card", "Withdrawal"],
      required: true
    },
    { label: "Tour", key: "tour", type: "radio", items: tourOptions, required: true },
    { label: "Type", key: "type", type: "radio", items: ["Singles", "Doubles"], required: true },
    { label: "Draw", key: "draw", type: "radio", items: ["Main", "Qualifying"], required: true }
  ]

  if (state.value.relationship === "Withdrawal") {
    fields.push({
      label: state.value.type === "Doubles" ? "Players" : "Player",
      key: "players",
      type: "search",
      subType: "Player",
      required: true,
      class: "col-span-2",
      icon: ICONS.player,
      multiple: true
    })
  } else {
    fields.push({
      label: state.value.type === "Doubles" ? "Team" : "Player",
      key: "id",
      type: "slot",
      class: "col-span-2"
    })
  }

  if (state.value.relationship === "Last Direct Acceptance") {
    fields.push({
      label: "Rank",
      key: "rank",
      type: "number",
      class: "col-span-2"
    })
  } else if (["Default", "Retirement", "Walkover", "Withdrawal"].includes(state.value.relationship || "")) {
    fields.push({
      label: "Reason",
      key: "reason",
      type: "text",
      class: state.value.type === "Doubles" ? "col-span-1" : "col-span-2"
    })

    if (state.value.type === "Doubles") {
      fields.push({
        label: "Teammate",
        key: "teammate",
        type: "text",
        class: "col-span-1"
      })
    }
  }

  return fields
})
</script>

<template>
  <u-modal
    :title="entry ? `Edit ${relationship}` : `Create ${state.relationship || 'Entry Info'}`"
    v-model:open="open"
  >
    <u-button
      :icon="entry ? ICONS.edit : icons.plus"
      block
      color="Doubles"
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
          >
            <u-input-menu
              v-model="state['id']"
              :items="teams"
              :loading="status === 'pending'"
              placeholder="Select team"
              :icon="ICONS.player"
            />
          </form-field>
        </div>
      </u-form>
    </template>

    <template #footer="{ close }">
      <u-button
        form="entry-info-form"
        type="submit"
        label="Save"
        :icon="uploading ? ICONS.uploading : icons.upload"
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
