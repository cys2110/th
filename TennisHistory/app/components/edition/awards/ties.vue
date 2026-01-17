<script setup lang="ts">
import type { TieFormSchema } from "#imports"
import { CalendarDate, parseDate } from "@internationalized/date"
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"

const {
  params: { edId }
} = useRoute("edition")
const {
  ui: { icons }
} = useAppConfig()

const uploading = ref(false)
const toast = useToast()
const open = ref(false)

const { data: rounds, status } = await useFetch<OptionType[]>("/api/edition/awards/country-rounds", {
  query: { edId },
  default: () => [],
  onResponseError: ({ error }) => console.error("Error fetching country rounds:", error)
})

const state = ref<Partial<TieFormSchema>>({
  event: `${edId}-Country`
})

const handleReset = () => {
  set(state, {
    event: `${edId}-Country`
  })
}

const onError = (event: FormErrorEvent) => console.error(event.errors)

const onSubmit = async (event: FormSubmitEvent<TieFormSchema>) => {
  set(uploading, true)

  try {
    const response = await $fetch("/api/edition/awards/create-tie", {
      method: "POST",
      body: event.data
    })

    if (response.success) {
      toast.add({
        title: "Tie successfully created",
        icon: icons.success,
        color: "success"
      })

      handleReset()
      set(open, false)
    } else {
      toast.add({
        title: "Error creating tie",
        icon: icons.error,
        color: "error"
      })
    }
  } catch (e) {
    console.error(e)

    toast.add({
      title: "Error creating tie",
      icon: icons.error,
      color: "error"
    })
  } finally {
    set(uploading, false)
  }
}

const formFields: FormFieldInterface<TieFormSchema>[] = [
  { label: "Round", type: "slot", key: "round", class: "col-span-2", required: true },
  { label: "Country 1", type: "search", key: "country1", placeholder: "countries", icon: ICONS.globe, subType: "Country", required: true },
  { label: "Country 2", type: "search", key: "country2", placeholder: "countries", icon: ICONS.globe, subType: "Country", required: true },
  { label: "Date", type: "date", key: "date" },
  { label: "Venue", type: "search", key: "venue", icon: ICONS.venue, subType: "Venue", required: false }
]
</script>

<template>
  <u-modal
    title="Create Tie"
    v-model:open="open"
  >
    <u-button
      :icon="icons.plus"
      label="Create Tie"
      color="Doubles"
      block
    />

    <template #body>
      <!--@vue-expect-error-->
      <u-form
        id="tie-form"
        :schema="tieFormSchema"
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
          >
            <u-input-menu
              v-model="state['round']"
              :items="rounds"
              value-key="value"
              label-key="label"
              :loading="status === 'pending'"
              :placeholder="'Select Round'"
            />
          </form-field>
        </div>
      </u-form>
    </template>

    <template #footer="{ close }">
      <u-button
        form="tie-form"
        label="Save"
        type="submit"
        :icon="uploading ? ICONS.uploading : icons.upload"
        block
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
