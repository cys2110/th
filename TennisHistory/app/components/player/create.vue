<script setup lang="ts">
import type { FormErrorEvent, FormSubmitEvent } from "@nuxt/ui"

const {
  ui: { icons }
} = useAppConfig()

const router = useRouter()
const toast = useToast()
const supabase = useSupabaseClient()

const isOpen = ref(false)
const isUploading = ref(false)
const isScraping = ref(false)
const errors = ref()

const state = ref<Partial<PlayerCreateType>>({})

const handleReset = () => {
  set(state, {})
  errors.value = undefined
}

const onError = (event: FormErrorEvent) => (errors.value = event.errors)

const onSubmit = async (event: FormSubmitEvent<PlayerCreateType>) => {
  set(isUploading, true)

  const { error } = await supabase.from("players").insert(event.data)

  if (error) {
    errors.value = error
    set(isUploading, false)
    return
  }

  set(isScraping, true)

  await $fetch(`${FLASK_ROUTE}/${event.data.tour.toLowerCase()}/player/${event.data.id}`, {
    method: "GET",
    timeout: 120_000
  })
    .then((response: any) => {
      toast.add({
        title: `${event.data.id} scraped`,
        description: response.player as any,
        icon: icons.success,
        color: "success"
      })

      router.push({
        name: "player",
        params: {
          id: event.data.id,
          name: "—"
        }
      })
    })
    .catch(e => {
      console.error(e)
      toast.add({
        title: `Error scraping ${event.data.id}`,
        icon: icons.error,
        color: "error"
      })
    })
    .finally(() => {
      set(isUploading, false)
      set(isScraping, false)
      set(isOpen, false)
    })
}

const formFields: FormFieldInterface<PlayerCreateType>[] = [
  {
    label: "ID",
    key: "id",
    type: "text",
    required: true
  },
  {
    label: "Tour",
    key: "tour",
    type: "radio",
    required: true,
    items: ["ATP", "WTA"]
  }
]
</script>

<template>
  <u-modal
    :title="`Create ${state.id || 'Player'}`"
    v-model:open="isOpen"
  >
    <u-button
      color="warning"
      :icon="icons.plus"
    />

    <template #body>
      <u-form
        id="player-form"
        :schema="PlayerCreateSchema"
        :state
        @submit="onSubmit"
        @error="onError"
      >
        <div class="grid grid-cols-2 items-center gap-3">
          <form-field
            v-for="field in formFields"
            :key="field.label"
            :field
            v-model="state"
          />
        </div>
      </u-form>

      <u-alert
        v-if="errors"
        color="error"
        :title="`Error saving ${state.id}`"
        class="mt-5"
      >
        <template #description>
          {{ errors }}
        </template>
      </u-alert>
    </template>

    <template #footer="{ close }">
      <form-footer
        form="player-form"
        :is-uploading
        @reset="handleReset"
        @close="close"
      />
    </template>
  </u-modal>
</template>
