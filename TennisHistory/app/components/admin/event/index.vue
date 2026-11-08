<script setup lang="ts">
import { ICONS } from "#imports"
import type { TabsItem } from "@nuxt/ui"
import type { QueryData } from "@supabase/supabase-js"

const { ui } = useAppConfig()
const supabase = useSupabaseClient()
const toast = useToast()

const isScraping = ref(false)

const selectedEvent = ref<EventSelection>({})

const items: Array<TabsItem> = [
  { label: "Details", icon: ICONS.overview, value: "details", slot: "details" as const },
  { label: "Rounds", icon: ICONS.money, value: "rounds", slot: "rounds" as const },
  { label: "Seeds", icon: ICONS.ranking, value: "seeds", slot: "seeds" as const },
  { label: "Entry Info", icon: ui.icons.info, value: "info", slot: "info" as const },
  { label: "Entries", icon: ICONS.player, value: "entries", slot: "entries" as const },
  { label: "Matches", icon: ICONS.racquet, value: "matches", slot: "matches" as const }
]

const { tournaments, pending, searchTerm } = useTournamentSearch()

const editionQuery = () => supabase.schema("tennis").from("editions").select("id, year, edition_no, tours, currency, events(id, tour, currency)")
type EditionOption = QueryData<ReturnType<typeof editionQuery>>[number] & { label: string }

const editionOptions = ref<EditionOption[]>([])
const editionsPending = ref(false)
const eventOptions = computed(() => editionOptions.value.find(edition => edition.id === selectedEvent.value.edition?.id)?.events ?? [])

watch(
  () => selectedEvent.value.tournament?.id,
  async (tournamentId, _, onCleanup) => {
    let stale = false
    onCleanup(() => {
      stale = true
    })

    editionOptions.value = []
    editionsPending.value = false
    if (!tournamentId) return

    editionsPending.value = true
    try {
      const { data, error } = await editionQuery().eq("tournament_id", tournamentId).order("year", { ascending: false })

      if (stale) return
      if (error) {
        toast.add({
          title: "Error fetching editions",
          description: JSON.stringify(error)
        })
        return
      }

      editionOptions.value = (data ?? []).map(edition => ({
        ...edition,
        label: `${edition.year}${edition.edition_no ? ` [${edition.edition_no}]` : ""}`
      }))
    } catch (error) {
      if (!stale)
        toast.add({
          title: "Error fetching editions",
          description: JSON.stringify(error)
        })
    } finally {
      if (!stale) editionsPending.value = false
    }
  },
  { immediate: true }
)

const handleScrape = async (close: () => void) => {
  const result = await $fetch("/api/scrape-draw", {
    query: {
      db_id: selectedEvent.value.tournament?.id,
      year: selectedEvent.value.edition?.year,
      tour: selectedEvent.value.event?.tour,
      super_tiebreak: false,
      format: 3,
      edition_no: selectedEvent.value.edition?.edition_no,
      tournament_id: selectedEvent.value.event?.tour === "ATP" ? selectedEvent.value.tournament?.mens_id : selectedEvent.value.tournament?.womens_id
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
  <div class="flex flex-col gap-6">
    <div class="flex gap-6">
      <u-input-menu
        :model-value="selectedEvent.tournament"
        @update:model-value="selectedEvent = { tournament: $event }"
        :items="tournaments"
        v-model:search-term="searchTerm"
        :loading="pending"
        filter-ignore
        :icon="ICONS.trophy"
        placeholder="Tournament"
        label-key="name"
        class="w-full"
      />

      <u-input-menu
        :model-value="editionOptions.find(edition => edition.id === selectedEvent.edition?.id)"
        @update:model-value="selectedEvent = { tournament: selectedEvent.tournament, edition: $event }"
        label-key="label"
        :items="editionOptions"
        :loading="editionsPending"
        placeholder="Edition"
        :disabled="!editionOptions.length"
        class="w-full"
      />

      <u-input-menu
        :model-value="eventOptions.find(event => event.id === selectedEvent.event?.id)"
        @update:model-value="selectedEvent = { ...selectedEvent, event: $event }"
        :items="eventOptions"
        label-key="tour"
        placeholder="Event"
        :loading="editionsPending"
        :disabled="!eventOptions.length"
        class="w-full"
      />

      <template v-if="selectedEvent.event?.tour">
        <form-input
          v-if="selectedEvent.event.tour === 'ATP'"
          v-model="selectedEvent.tournament!.mens_id"
          placeholder="ATP ID"
          type="number"
        />

        <form-input
          v-else-if="selectedEvent.event.tour === 'WTA'"
          v-model="selectedEvent.tournament!.womens_id"
          placeholder="WTA ID"
          type="number"
        />

        <u-button
          :icon="ICONS.draw"
          @click="handleScrape()"
          :loading="isScraping"
          :ui="{ leadingIcon: 'rotate-270' }"
        />
      </template>
    </div>

    <u-tabs
      :items
      size="xs"
      default-value="details"
    >
      <template #details>
        <admin-event-create v-model="selectedEvent" />
      </template>

      <template #rounds>
        <admin-event-rounds v-model="selectedEvent" />
      </template>

      <template #seeds>
        <admin-event-seeds v-model="selectedEvent" />
      </template>

      <template #info>
        <admin-event-info v-model="selectedEvent" />
      </template>

      <template #entries>
        <admin-event-entries v-model="selectedEvent" />
      </template>

      <template #matches>
        <admin-event-matches v-model="selectedEvent" />
      </template>
    </u-tabs>
  </div>
</template>
