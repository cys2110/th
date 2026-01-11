<script setup lang="ts">
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"
import type { FetchError } from "ofetch"

const props = withDefaults(
  defineProps<{
    iconOnly?: boolean
  }>(),
  {
    iconOnly: false
  }
)

const refreshCounter = defineModel<number>()

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
  edition: Number(edId)
}

const state = ref<Partial<CountryEntryFormSchema>>(cloneDeep(initialState))

const handleReset = () => set(state, cloneDeep(initialState))

const onError = (event: FormErrorEvent) => console.error(event.errors)

const onSubmit = async (event: FormSubmitEvent<CountryEntryFormSchema>) => {
  set(uploading, true)

  try {
    const response = await $fetch("/api/edition/entries/country-create", {
      method: "POST",
      body: event.data
    })

    if (response?.success) {
      toast.add({
        title: `${event.data.country.label} entry created successfully`,
        icon: icons.success,
        color: "success"
      })

      if (refreshCounter.value !== undefined) {
        refreshCounter.value++
      }

      await nextTick(() => {
        handleReset()
        set(open, false)
      })
    } else {
      toast.add({
        title: "Error creating country entry",
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
      title: "Error creating country entry",
      description: (e as Error).message,
      icon: icons.error,
      color: "error"
    })
  } finally {
    set(uploading, false)
  }
}

const formFields: FormFieldInterface<CountryEntryFormSchema>[] = [
  { label: "Country", key: "country", type: "search", subType: "Country", icon: ICONS.globe, required: true, placeholder: "countries" },
  { label: "Seed", key: "seed", type: "number" }
]
</script>

<template>
  <u-modal
    title="Create Country Entry"
    v-model:open="open"
  >
    <u-button
      :label="iconOnly ? undefined : 'Create country entry'"
      :icon="ICONS.globe"
      color="Doubles"
    />

    <template #body>
      <u-form
        id="entry-form"
        :schema="countryEntryFormSchema"
        :state
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
