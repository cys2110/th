<script setup lang="ts">
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"
import { cloneDeep, isEqual } from "lodash"

const { seed, refresh } = defineProps<{
  seed?: SeedType
  refresh: () => void
  iconOnly?: boolean
  strikethrough?: boolean
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
  ...seed,
  edition: Number(edId),
  id: seed ? { value: seed.id, label: seed.team.map((p: any) => `${p.first_name} ${p.last_name}`).join(" / ") } : undefined,
  tour: seed?.tour ? (tourEnum[seed.tour as keyof typeof tourEnum] as TourEnumType) : undefined
}

const state = ref<Partial<SeedFormInput>>(cloneDeep(initialState))

const formFields = computed<FormFieldInterface<SeedFormSchema>[]>(() => [
  { label: "Tour", key: "tour", type: "radio", items: TOUR_OPTIONS, required: true },
  { label: "Type", key: "type", type: "radio", items: ["Singles", "Doubles"], required: true },
  { label: "Draw", key: "draw", type: "radio", items: ["Main", "Qualifying"], required: true },
  {
    label: state.value.type === "Doubles" ? "Team" : "Player",
    key: "id",
    type: "search",
    subType: "Entry",
    placeholder: state.value.type === "Doubles" ? "Team" : "Player",
    required: true,
    id: edId,
    tour: state.value.tour,
    matchType: state.value.type ?? "Singles",
    icon: state.value.type === "Doubles" ? ICONS.people : ICONS.person
  },
  { label: "Seed", key: "seed", type: "number", required: true },
  { label: "Rank", key: "rank", type: "number" }
])

const handleReset = () => set(state, cloneDeep(initialState))

const onError = (event: FormErrorEvent) => console.error(event.errors)

const onSubmit = async (event: FormSubmitEvent<SeedFormSchema>) => {
  set(uploading, true)

  // Get dirty fields from the form
  const fields = Object.keys(event.data) as (keyof SeedFormSchema)[]
  const dirtyFields: Partial<SeedFormSchema> = {}
  fields.forEach(field => {
    if (!isEqual(event.data[field], initialState[field as keyof typeof initialState])) {
      // @ts-expect-error
      dirtyFields[field] = event.data[field] ?? null
    }
  })

  if (Object.keys(dirtyFields).length) {
    if (seed) {
      dirtyFields["id"] = event.data.id // Always include the seed ID
      dirtyFields["draw"] = event.data.draw // Always include the draw
    }

    const response = await $fetch(`/api/editions/seeds/${seed ? "update" : "create"}`, {
      method: "POST",
      body: dirtyFields
    })

    if ((response as any).ok) {
      toast.add({
        title: `Seed ${seed ? "updated" : "created"}`,
        icon: icons.success,
        color: "success"
      })

      refresh() // Refresh seed details

      nextTick(() => {
        handleReset() // Reset form
        set(open, false) // Close modal
      })
    } else {
      toast.add({
        title: `Error ${seed ? "updating" : "creating"} seed`,
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
    :title="seed ? `${seed.draw} ${seed.type} ${seed.seed}` : 'Create Seed'"
    v-model:open="open"
  >
    <u-button
      :class="{ 'line-through': strikethrough }"
      :icon="seed ? ICONS.edit : icons.plus"
      block
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
          />
        </div>
      </u-form>
    </template>

    <template #footer="{ close }">
      <u-button
        form="seed-form"
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
