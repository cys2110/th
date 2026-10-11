<script setup lang="ts">
import { ICONS } from "#imports"

const props = defineProps<{
  tour: TourEnum
}>()
const emits = defineEmits<{
  refresh: []
}>()

const route = useRoute("edition")
const { ui } = useAppConfig()
const toast = useToast()

const tournamentStore = useTournamentStore()

const isScraping = ref(false)

const tournamentId = ref()

const handleScrape = async (close: () => void) => {
  isScraping.value = true

  await $fetch("/api/scrape-activity", {
    query: {
      db_id: tournamentStore.ids[props.tour === "ATP" ? "mens" : "womens"],
      year: route.params.year,
      tour: props.tour,
      edition_no: route.params.edition_no,
      tournament_id: tournamentId.value
    }
  })
    .then(response => {
      if (!response.success) {
        console.error("Error scraping activity:", response)
        toast.add({
          title: "Error scraping activity",
          description:
            "errors" in response ? `${response.errors.length} player entries could not be updated`
            : "error" in response ? response.error
            : undefined,
          icon: ui.icons.error,
          color: "error"
        })
        return
      }

      toast.add({
        title: "Activity scraped",
        icon: ui.icons.success,
        color: "success"
      })

      close()
    })
    .finally(() => {
      emits("refresh")
      isScraping.value = false
    })
}
</script>

<template>
  <u-modal :title="`Scrape ${tour} Activity`">
    <u-button
      :label="tour"
      :icon="ICONS.download"
    />

    <template #body>
      <u-form-field label="Tournament ID">
        <form-input
          v-model="tournamentId"
          placeholder="Tournament ID"
        />
      </u-form-field>
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
