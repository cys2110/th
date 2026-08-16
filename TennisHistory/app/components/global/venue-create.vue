<script setup lang="ts">
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"
import { object, string, z } from "zod"
import { set } from "@vueuse/core"

const schema = object({
  name: string().optional(),
  city: string(),
  country: object({
    id: string(),
    name: string(),
    icon: string()
  })
})
type Schema = z.infer<typeof schema>

const emits = defineEmits<{ refresh: [] }>()

const { ui } = useAppConfig()

const toast = useToast()
const supabase = useSupabaseClient()

const isOpen = ref(false)
const isSaving = ref(false)

const state = ref<Partial<Schema>>({})

const venueName = computed(() => {
  if (state.value.city) {
    return state.value.name ? `${state.value.name}, ${state.value.city}` : state.value.city
  }
})

const handleReset = () => {
  set(state, {})
}

const onError = (event: FormErrorEvent) => {
  toast.add({
    title: "Validation error",
    icon: ui.icons.error,
    color: "error"
  })
  console.error("Validation error:", event)
}

const onSubmit = async (event: FormSubmitEvent<Schema>) => {
  set(isSaving, true)

  try {
    const { country, ...rest } = event.data

    const { error } = await supabase
      .schema("tennis")
      .from("venue")
      .insert({ ...rest, country_id: country.id })

    if (error) {
      console.error("Error creating venue:", error)
      throw Error
    }

    toast.add({
      title: `${venueName.value} successfully created!`,
      icon: ui.icons.success,
      color: "success"
    })

    emits("refresh")
    handleReset()
    set(isOpen, false)
  } catch (error) {
    toast.add({
      title: `Error creating ${venueName.value}`,
      icon: ui.icons.error,
      color: "error"
    })
  } finally {
    set(isSaving, false)
  }
}

const formFields = computed<FormFieldInterface<Schema>[]>(() => [
  { label: "Name", key: "name", type: "text", class: "col-span-2" },
  { label: "City", key: "city", type: "text", required: true },
  { label: "Country", key: "country", type: "slot", required: true }
])
</script>

<template>
  <u-modal
    :title="`Create ${venueName || 'Venue'}`"
    v-model:open="isOpen"
  >
    <u-button
      :icon="ui.icons.plus"
      label="Create Venue"
      block
      size="xs"
    />

    <template #body>
      <u-form
        id="venue-form"
        :schema
        :state
        @submit="onSubmit"
        @error="onError"
      >
        <div class="grid grid-cols-2 gap-3">
          <form-field
            v-for="field in formFields"
            :key="field.label"
            :field
            v-model="state"
          >
            <country-search v-model="<any>state.country" />
          </form-field>
        </div>
      </u-form>
    </template>

    <template #footer="{ close }">
      <form-footer
        form="venue-form"
        :loading="isSaving"
        @reset="handleReset"
        @close="close"
      />
    </template>
  </u-modal>
</template>
