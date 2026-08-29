<script setup lang="ts">
import { ICONS } from "#imports"

const route = useRoute("edition")
const { ui } = useAppConfig()
const toast = useToast()

const tournamentStore = useTournamentStore()

const isScraping = ref(false)

const format = ref(3)
const superTiebreak = ref(false)

const handleScrape = async (close: () => void) => {
  const result = await $fetch("/api/scrape-draw", {
    query: {
      tournament_id: tournamentStore.ids.mens,
      year: route.params.year,
      tour: "ATP",
      super_tiebreak: superTiebreak.value,
      format: format.value
    }
  })

  if (result.success) {
    toast.add({
      title: "Draws scraped",
      icon: ui.icons.success,
      color: "success"
    })

    close()
  } else {
    console.error("Error scraping draws:", result)
  }
}
</script>

<template>
  <u-modal title="Scrape ATP Draw">
    <u-button
      :icon="ICONS.draw"
      :ui="{ leadingIcon: 'rotate-270' }"
    />

    <template #body>
      <div class="grid grid-cols-2 items-center">
        <u-radio-group
          orientation="horizontal"
          :items="[3, 5]"
          v-model="format"
          legend="Format"
        />

        <u-checkbox
          v-model="superTiebreak"
          label="Super Tiebreak"
        />
      </div>
    </template>

    <template #footer="{ close }">
      <u-button
        label="Scrape"
        :icon="ICONS.download"
        :loading-icon="ICONS.downloading"
        :loading="isScraping"
        @click="handleScrape(close)"
        block
      />
    </template>
  </u-modal>
</template>
