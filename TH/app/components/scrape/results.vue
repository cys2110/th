<script setup lang="ts">
const {
  params: { id, name, year, edId }
} = useRoute("edition")

const {
  ui: { icons }
} = useAppConfig()

const toast = useToast()

const isOpen = ref(false)
const isScraping = ref(false)
const tournamentId = ref(Number(id))
const matchType = ref<MatchEnumType>("Singles")

const handleSubmit = async () => {
  set(isScraping, true)

  await $fetch(`${FLASK_ROUTE}/atp/results`, {
    method: "POST",
    timeout: 120_000,
    "Content-Type": "application/json",
    body: JSON.stringify({
      tournament_id: tournamentId.value,
      event_id:
        id === "9210" ? `${edId}-LC`
        : COUNTRY_DRAWS.includes(id) ? `${edId}-Country`
        : `${edId}-ATP`,
      year,
      match_type: matchType.value
    })
  })
    .then((response: any) => {
      if (response.success) {
        toast.add({
          title: "Results scraped",
          icon: icons.success,
          color: "success"
        })

        const blob = new Blob([JSON.stringify(response, null, 2)], {
          type: "application/json"
        })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `${name}_year_${year}_${matchType.value}.json`
        a.click()
        URL.revokeObjectURL(url)

        set(isOpen, false)
      } else {
        toast.add({
          title: "Error scraping results",
          icon: icons.error,
          color: "error"
        })
      }
    })
    .catch(e => {
      console.error(e)
    })
    .finally(() => {
      set(isScraping, false)
    })
}
</script>

<template>
  <u-modal
    title="Scrape Results"
    v-model:open="isOpen"
  >
    <u-button :icon="ICONS.cards" />

    <template #body>
      <div class="grid grid-cols-2 gap-3">
        <form-input
          v-model="tournamentId"
          type="number"
          placeholder="Tournament ID"
        />

        <u-radio-group
          v-model="matchType"
          :items="[...MATCH_TYPES]"
          orientation="horizontal"
          variant="card"
        />
      </div>
    </template>

    <template #footer="{ close }">
      <u-button
        label="Scrape"
        color="success"
        block
        :icon="ICONS.download"
        :loading="isScraping"
        :loading-icon="ICONS.downloading"
        @click="handleSubmit"
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
