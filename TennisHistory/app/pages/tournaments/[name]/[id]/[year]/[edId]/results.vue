<script setup lang="ts">
definePageMeta({ name: "results" })

const {
  params: { id, edId }
} = useRoute("results")
const {
  ui: { icons }
} = useAppConfig()
const toast = useToast()
const viewMode = useViewModeStore()
const tournamentStore = useTournamentStore()

const updating = ref(false)

const players = ref<string[]>([])
const tour = ref<keyof typeof tourEnum>()
const draw = ref<DrawEnumType>()
const matchType = ref<MatchTypeEnumType>()

const resetFilters = () => {
  players.value = []
  tour.value = undefined
  draw.value = undefined
}

const {
  data: matches,
  status,
  refresh
} = await useFetch("/api/edition/results", {
  query: { edId },
  default: () => [],
  onResponseError: ({ error }) => console.error("Error fetching edition results:", error)
})

const playerOptions = computed(() => {
  const uniqueWinners = matches.value.map(m => m.winner.team).flat()

  const uniqueLosers = matches.value.map(m => m.loser.team).flat()

  const uniquePlayers = [...uniqueWinners, ...uniqueLosers].sort((a, b) => {
    if (a.last_name === b.last_name) {
      return a.first_name!.localeCompare(b.first_name!)
    }
    return a.last_name!.localeCompare(b.last_name!)
  })

  return useArrayUnique(
    uniquePlayers.map(p => ({
      label: `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim(),
      value: p.id
    })),
    (a, b) => a.value === b.value
  ).value
})

const updateTiebreaks = async () => {
  set(updating, true)
  try {
    const response = await $fetch("/api/matches/tiebreaks", {
      query: { id: edId }
    })
    if (response.success) {
      toast.add({
        title: "Tiebreaks updated successfully",
        icon: icons.check,
        color: "success"
      })
      refresh()
    } else {
      toast.add({
        title: "Error updating tiebreaks",
        description: (response as any).message,
        icon: icons.error,
        color: "error"
      })
    }
  } catch (e) {
    toast.add({
      title: "Error updating tiebreaks",
      description: (e as Error).message,
      icon: icons.error,
      color: "error"
    })
  } finally {
    set(updating, false)
  }
}

const tableRef = useTemplateRef("tableRef")
</script>

<template>
  <u-container>
    <u-page>
      <template #left>
        <u-page-aside>
          <dev-only>
            <u-button
              @click="updateTiebreaks"
              :icon="updating ? ICONS.uploading : icons.upload"
              label="Update tiebreaks"
              block
              color="Doubles"
            />

            <match-country-update
              v-if="COUNTRY_DRAWS.includes(id)"
              :refresh
            />
            <match-update
              v-else
              :refresh
            />

            <u-separator />
          </dev-only>

          <template v-if="tableRef?.table">
            <table-client-clear-filters :table="tableRef.table" />

            <table-client-clear-sorting :table="tableRef.table" />

            <table-client-clear-grouping :table="tableRef.table" />

            <table-client-visibility :table="tableRef.table" />
          </template>

          <template v-else>
            <u-button
              @click="resetFilters"
              :icon="ICONS.filterOff"
              label="Reset filters"
              block
            />

            <u-form-field label="Filter by">
              <div class="*:my-2">
                <u-input-menu
                  v-model="players"
                  value-key="value"
                  label-key="label"
                  placeholder="Select players"
                  multiple
                  :icon="ICONS.player"
                  :items="playerOptions"
                />

                <u-radio-group
                  v-if="tournamentStore.tours.length > 1"
                  legend="Tour"
                  v-model="tour"
                  :items="tournamentStore.tours"
                />

                <filters-draw-type
                  v-if="matches.some(match => match.draw === 'Qualifying')"
                  v-model="draw"
                />

                <filters-match-type
                  v-if="matches.some(match => match.type === 'Singles') && matches.some(match => match.type === 'Doubles')"
                  v-model="matchType"
                />
              </div>
            </u-form-field>
          </template>
        </u-page-aside>
      </template>

      <edition-wrapper>
        <template #header-links>
          <view-switcher />
        </template>
      </edition-wrapper>

      <u-page-body>
        <edition-results-stepper
          v-if="viewMode.isCardView"
          :matches
          :status
          :refresh
          :players
          :tour
          :draw
          :type="matchType"
        />

        <edition-results-table
          v-else
          ref="tableRef"
          :matches
          :status
          :refresh
        />
      </u-page-body>
    </u-page>
  </u-container>
</template>
