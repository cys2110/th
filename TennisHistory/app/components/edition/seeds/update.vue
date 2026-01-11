<script setup lang="ts">
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"
import type { FetchError } from "ofetch"

const props = withDefaults(
  defineProps<{
    seed?: SeedType
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
  ...props.seed,
  edition: Number(edId),
  id: props.seed ? { value: props.seed.id, label: props.seed.team.map((p: any) => `${p.first_name} ${p.last_name}`).join(" / ") } : undefined,
  tour: props.seed?.tour
    ? (tourEnum[props.seed.tour as keyof typeof tourEnum] as TourInputEnumType)
    : (tourEnum[tournamentStore.tours[0] as keyof typeof tourEnum] as TourInputEnumType)
}

const state = ref<Partial<SeedFormSchema>>(cloneDeep(initialState))

const handleReset = () => set(state, cloneDeep(initialState))

const onError = (event: FormErrorEvent) => console.error(event.errors)

const onSubmit = async (event: FormSubmitEvent<SeedFormSchema>) => {
  set(uploading, true)

  // Get dirty fields from the form
  const fields = Object.keys(event.data) as (keyof SeedFormSchema)[]
  const dirtyFields: Partial<SeedFormSchema> = {}

  for (const field of fields) {
    if (field === "id" || field === "edition") {
      // @ts-expect-error
      dirtyFields[field] = event.data[field]
    } else if (!isEqual(event.data[field], initialState[field as keyof typeof initialState])) {
      // @ts-expect-error
      dirtyFields[field] = event.data[field] ?? null
    }
  }

  if (Object.keys(dirtyFields).length) {
    try {
      const response = await $fetch(`/api/edition/seeds/${props.seed ? "update" : "create"}`, {
        method: "POST",
        body: dirtyFields
      })

      if ((response as any).ok) {
        toast.add({
          title: `Seed ${props.seed ? "updated" : "created"}`,
          icon: icons.success,
          color: "success"
        })

        props.refresh() // Refresh seed details

        nextTick(() => {
          handleReset() // Reset form
          set(open, false) // Close modal
        })
      } else {
        toast.add({
          title: `Error ${props.seed ? "updating" : "creating"} seed`,
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
        title: `Error ${props.seed ? "updating" : "creating"} seed`,
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

const formFields = computed<FormFieldInterface<SeedFormSchema>[]>(() => {
  const tourOptions = tournamentStore.tours.map(tour => ({
    label: tour,
    value: tourEnum[tour] as TourInputEnumType
  }))

  return [
    ...(tournamentStore.tours.length > 1
      ? [
          {
            label: "Tour",
            key: "tour" as const,
            type: "radio",
            items: tourOptions,
            required: true
          }
        ]
      : []),
    {
      label: "Type",
      key: "type" as const,
      type: "radio",
      items: ["Singles", "Doubles"],
      required: true
    },
    {
      label: "Draw",
      key: "draw" as const,
      type: "radio",
      items: ["Main", "Qualifying"],
      required: true
    },
    {
      label: state.value.type === "Doubles" ? "Team" : "Player",
      key: "id" as const,
      type: "slot"
    },
    {
      label: "Seed",
      key: "seed" as const,
      type: "number",
      required: true
    },
    {
      label: "Rank",
      key: "rank" as const,
      type: "number"
    }
  ]
})
</script>

<template>
  <u-modal
    :title="seed ? `${seed.draw} ${seed.type} ${seed.seed}` : 'Create Seed'"
    v-model:open="open"
  >
    <u-button
      :icon="seed ? ICONS.edit : icons.plus"
      block
      color="Doubles"
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
        id="seed-form"
        :schema="seedFormSchema"
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
        form="seed-form"
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
