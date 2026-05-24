<script setup lang="ts">
const {
  ui: { icons }
} = useAppConfig()

const router = useRouter()
const toast = useToast()
const supabase = useSupabaseClient()

const isOpen = ref(false)
const isUploading = ref(false)
const errors = ref()

const playerId = ref()

defineShortcuts({
  ctrl_p: () => set(isOpen, !isOpen.value),
  ctrl_r: () => set(playerId, undefined),
  ctrl_enter: () => handleSubmit()
})

const handleSubmit = async () => {
  set(isUploading, true)
  set(errors, undefined)

  const tour = isNaN(Number(playerId.value)) ? "ATP" : "WTA"

  const { error } = await supabase.from("players").insert({ id: playerId.value, tour })

  if (error) {
    set(errors, error.details)
    set(isUploading, false)
    return
  }

  await $fetch(`${FLASK_ROUTE}/${tour.toLowerCase()}/player/${playerId.value}`, {
    method: "GET",
    timeout: 120_000
  })
    .then((response: any) => {
      toast.add({
        title: `${playerId.value} scraped`,
        icon: icons.success,
        color: "success"
      })
    })
    .catch(e => {
      console.error(e)
      toast.add({
        title: `Error scraping ${playerId.value}`,
        icon: icons.error,
        color: "error"
      })
    })
    .finally(() => {
      set(isUploading, false)
      set(isOpen, false)

      router.push({
        name: "player",
        params: {
          id: playerId.value,
          name: "—"
        }
      })
    })
}
</script>

<template>
  <u-modal
    :title="`Create ${playerId || 'Player'}`"
    v-model:open="isOpen"
  >
    <u-button :trailing-icon="icons.plus" />

    <template #body>
      <u-form-field
        label="Player ID"
        orientation="horizontal"
        :ui="{ container: 'flex-1' }"
      >
        <form-input
          placeholder="Enter Player ID"
          :icon="ICONS.id"
          v-model="playerId"
        />
      </u-form-field>

      <u-alert
        v-if="errors"
        color="error"
        :title="`Error creating ${playerId}`"
        class="mt-5"
        :description="errors"
      />
    </template>

    <template #footer="{ close }">
      <u-button
        label="Submit"
        color="success"
        block
        :icon="icons.upload"
        :loading="isUploading"
        :loading-icon="ICONS.uploading"
        @click="handleSubmit"
      />
      <u-button
        label="Reset"
        color="warning"
        block
        :icon="icons.reload"
        @click="() => (playerId = undefined)"
      />
      <u-button
        label="Cancel"
        color="error"
        block
        :icon="icons.close"
        @click="close"
      />
    </template>
  </u-modal>
</template>
