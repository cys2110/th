<script setup lang="ts">
import { ICONS } from "#imports"

const props = defineProps<{
  tour: TourEnum
}>()

const route = useRoute("edition")
const { ui } = useAppConfig()
const toast = useToast()

const tournamentStore = useTournamentStore()

const isScraping = ref(false)

const format = ref(3)
const superTiebreak = ref(false)
const tournamentId = ref()

const handleScrape = async (close: () => void) => {
  const result = await $fetch("/api/scrape-draw", {
    query: {
      db_id: tournamentStore.ids[props.tour === "ATP" ? "mens" : "womens"],
      year: route.params.year,
      tour: props.tour,
      super_tiebreak: superTiebreak.value,
      format: format.value,
      edition_no: route.params.edition_no,
      tournament_id: tournamentId.value
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
  <u-modal :title="`Scrape ${tour} Draw`">
    <u-button
      :icon="ICONS.draw"
      :ui="{ leadingIcon: 'rotate-270' }"
    />

    <template #body>
      <div class="grid grid-cols-3 gap-3 items-center">
        <u-radio-group
          orientation="horizontal"
          :items="[3, 5]"
          v-model="format"
          legend="Format"
        />

        <u-form-field label="Tournament ID">
          <form-input
            v-model="tournamentId"
            placeholder="Tournament ID"
          />
        </u-form-field>

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
