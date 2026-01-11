<script setup lang="ts">
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"
import type { FetchError } from "ofetch"

const props = withDefaults(
  defineProps<{
    entry?: PlayerEntryType["singles"] | null
    player?: PersonType & { tour: keyof typeof tourEnum }
    type?: MatchTypeEnumType
    refresh?: () => void
    iconOnly?: boolean
    block?: boolean
  }>(),
  {
    iconOnly: false,
    block: false
  }
)

const {
  params: { id, edId }
} = useRoute("edition")
const toast = useToast()
const {
  ui: { icons }
} = useAppConfig()
const tournamentStore = useTournamentStore()

const open = ref(false)
const uploading = ref(false)
const refreshCounter = defineModel<number>()

const initialState = {
  ...props.entry,
  tournament: id,
  tour: props.player?.tour
    ? (tourEnum[props.player.tour as keyof typeof tourEnum] as TourInputEnumType)
    : (tourEnum[tournamentStore.tours[0] as keyof typeof tourEnum] as TourInputEnumType),
  edition: Number(edId),
  type: props.type,
  id: props.player?.id,
  status: props.entry?.status ? { value: props.entry.status, label: statusEnum[props.entry.status as keyof typeof statusEnum] } : undefined,
  q_status: props.entry?.q_status ? { value: props.entry.q_status, label: statusEnum[props.entry.q_status as keyof typeof statusEnum] } : undefined,
  rank2: undefined,
  player1: undefined,
  player2: undefined
}

const state = ref<Partial<EntryFormSchema>>(cloneDeep(initialState))

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

  for (const field of fields) {
    if (field === "id" || field === "edition" || field === "tournament") {
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
      const response = await $fetch(`/api/edition/entries/${props.entry ? "update" : "create"}`, {
        method: "POST",
        body: dirtyFields
      })

      if (response?.success) {
        toast.add({
          title: `Entry ${props.entry ? "updated" : "created"}`,
          icon: icons.success,
          color: "success"
        })

        if (refreshCounter.value !== undefined) {
          refreshCounter.value++
        } else if (props.refresh) {
          props.refresh()
        }

        await nextTick(() => {
          handleReset() // Reset form
          set(open, false) // Close modal
        })
      } else {
        toast.add({
          title: `Error ${props.entry ? "updating" : "creating"} entry`,
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
        title: `Error ${props.entry ? "updating" : "creating"} entry`,
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

const formFields = computed<FormFieldInterface<EntryFormSchema>[]>(() => {
  const tourOptions = tournamentStore.tours.map(tour => ({
    label: tour,
    value: tourEnum[tour as keyof typeof tourEnum] as TourInputEnumType
  }))

  const fields: FormFieldInterface<EntryFormSchema>[] = []

  if (!COUNTRY_DRAWS.includes(id)) {
    if (tournamentStore.tours.length > 1) {
      fields.push({ label: "Tour", key: "tour", type: "radio", items: tourOptions, required: true })
    }
  }

  fields.push({ label: "Type", key: "type", type: "radio", items: ["Singles", "Doubles"], required: true })

  if (!props.entry) {
    fields.push({
      label: state.value.type === "Doubles" && !COUNTRY_DRAWS.includes(id) ? "Player 1" : "Player",
      type: "fieldGroup",
      required: true,
      class: state.value.type === "Doubles" && !COUNTRY_DRAWS.includes(id) ? "col-span-1" : "col-span-2",
      children: [
        { label: "Name", key: "player1", type: "search", subType: "Player", icon: ICONS.player, placeholder: "player" },
        { label: "Rank", key: "rank", type: "number" }
      ]
    })

    if (state.value.type === "Doubles" && !COUNTRY_DRAWS.includes(id)) {
      fields.push({
        label: "Player 2",
        type: "fieldGroup",
        required: true,
        children: [
          { label: "Name", key: "player2", type: "search", subType: "Player", icon: ICONS.player, placeholder: "player" },
          { label: "Rank", key: "rank2", type: "number" }
        ]
      })
    }
  } else {
    fields.push({
      label: "Rank",
      key: "rank",
      type: "number",
      required: true,
      class: "col-span-2"
    })
  }

  if (!COUNTRY_DRAWS.includes(id)) {
    fields.push(
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
      }
    )
  }

  fields.push({ label: "Points", key: "points", type: "number" }, { label: "Prize Money", key: "pm", type: "number" })

  return fields
})
</script>

<template>
  <u-modal
    :title="player ? `${player.first_name} ${player.last_name}` : 'Create Entry'"
    v-model:open="open"
  >
    <u-button
      :icon="entry ? ICONS.edit : icons.plus"
      :block="!iconOnly"
      color="Doubles"
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
