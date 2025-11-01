<script setup lang="ts">
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"

const { seed, refresh } = defineProps<{
  seed?: EntryInterface
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
  meta_shift_s: () => (seed ? undefined : set(open, !get(open)))
})

const state = reactive<Partial<SeedInput>>({
  ...seed,
  event: `${edId}-${tour}`,
  team: seed ? { value: seed.id, label: seed.team.map((p: any) => `${p.first_name} ${p.last_name}`).join(" / ") } : undefined
})

const formFields: FormFieldInterface<SeedSchema>[] = [
  { label: "Type", key: "type", type: "radio", items: ["Singles", "Doubles"] },
  { label: "Draw", key: "draw", type: "radio", items: ["Main", "Qualifying"] },
  { label: "Seed", key: "seed", type: "number" },
  { label: "Rank", key: "rank", type: "number" }
]

const handleReset = () => {
  state.draw = seed?.draw
  state.type = seed?.type
  state.seed = seed?.seed
  state.rank = seed?.rank
  state.team = seed ? { value: seed.id, label: seed.team.map((p: any) => `${p.first_name} ${p.last_name}`).join(" / ") } : undefined
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

const onSubmit = async (event: FormSubmitEvent<SeedSchema>) => {
  set(uploading, true)
  try {
    const response = await $fetch(`/api/events/seeds/${seed ? "update" : "create"}`, {
      query: event.data
    })

    if ((response as any).ok) {
      toast.add({
        title: `Seed ${seed ? "updated" : "created"}`,
        icon: icons.success,
        color: "success"
      })
      state.rank = seed?.rank
      state.team = seed ? { value: seed.id, label: seed.team.map((p: any) => `${p.first_name} ${p.last_name}`).join(" / ") } : undefined
      set(open, false)
      refresh()
    } else {
      toast.add({
        title: `Error ${seed ? "updating" : "creating"} seed`,
        description: (response as any).message,
        icon: icons.error,
        color: "error"
      })
    }
  } catch (e) {
    toast.add({
      title: `Error ${seed ? "updating" : "creating"} seed`,
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
    :title="seed ? `Edit ${seed.draw} ${seed.type} ${seed.seed}` : 'Create Seed'"
    v-model:open="open"
  >
    <u-button
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
        :schema="seedSchema"
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
          </template>

          <form-select-search
            v-if="state.type"
            class="col-span-2"
            v-model="state.team"
            type="events/entries"
            :placeholder="state.type === 'Doubles' ? 'Select Team' : 'Select Player'"
            :id="edId"
            :tour="(tour as keyof typeof TourEnum)"
            :match-type="state.type"
            block
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
