<script setup lang="ts">
const {
  ui: { icons }
} = useAppConfig()

const {
  params: { edId, year }
} = useRoute("edition")

const toast = useToast()

const isOpen = ref(false)
const isUploading = ref(false)

const tournamentId = ref()

const handleSubmit = async () => {
  set(isUploading, true)

  await $fetch(`${FLASK_ROUTE}/wta/draws`, {
    method: "POST",
    timeout: 120_000,
    "Content-Type": "application/json",
    body: JSON.stringify({
      tournament_id: tournamentId.value,
      event_id: `${edId}-WTA`,
      year
    })
  })
    .then((response: any) => {
      if (response.success) {
        toast.add({
          title: "Draws scraped",
          icon: icons.success,
          color: "success"
        })
      }

      set(isOpen, false)
    })
    .catch(e => {
      console.error(e)
      toast.add({
        title: "Error scraping draws",
        icon: icons.error,
        color: "error"
      })
    })
    .finally(() => {
      set(isUploading, false)
    })
}
</script>

<template>
  <u-modal
    title="Scrape Draw"
    v-model:open="isOpen"
  >
    <u-button
      :icon="ICONS.draw"
      :ui="{ leadingIcon: 'rotate-270' }"
    />

    <template #body>
      <u-form-field
        label="ID"
        orientation="horizontal"
        :ui="{ container: 'flex-1' }"
      >
        <form-input
          placeholder="Enter tournament ID"
          :icon="ICONS.id"
          v-model="tournamentId"
        />
      </u-form-field>
    </template>

    <template #footer="{ close }">
      <u-button
        label="Scrape"
        color="success"
        block
        :icon="ICONS.download"
        :loading="isUploading"
        :loading-icon="ICONS.downloading"
        @click="handleSubmit"
      />
      <u-button
        label="Reset"
        color="warning"
        block
        :icon="icons.reload"
        @click="() => (tournamentId = undefined)"
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
