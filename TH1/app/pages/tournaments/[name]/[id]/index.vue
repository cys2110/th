<script setup lang="ts">
definePageMeta({ name: "tournament" })

const {
  params: { id, name }
} = useRoute("tournament")
const {
  ui: { colors, icons }
} = useAppConfig()
const breakpoints = useBreakpoints(breakpointsTailwind, { ssrWidth: useSSRWidth() })
const lgAndDown = breakpoints.smallerOrEqual("lg")

const tournamentStore = useTournamentStore()
useHead({ title: () => tournamentStore.name })

watchOnce(
  () => name,
  newName => {
    if (!tournamentStore.name) tournamentStore.name = startCase(newName)
    tournamentStore.id = id
  },
  { immediate: true }
)

const selectedTab = ref<"Winners" | "Numbers">("Winners")

const tabItems = computed(() => [
  {
    label: "Winners",
    value: "Winners",
    slot: "winners",
    icon: ICONS.trophy
  },
  {
    label: "By the Numbers",
    value: "Numbers",
    slot: "numbers",
    icon: ICONS.stats,
    disabled: COUNTRY_DRAWS.includes(id)
  }
])

const winnersRef = useTemplateRef("winnersRef")

const {
  data: tournament,
  refresh,
  error
} = await useFetch("/api/tournament", {
  query: { id }
})

watch(
  error,
  () => {
    if (error.value) {
      if (error.value.statusMessage === "Validation errors") {
        console.error(error.value.statusMessage, error.value.data?.data.validationErrors)
      } else {
        console.error(error.value)
      }
    }
  },
  { immediate: true }
)

watch(
  tournament,
  () => {
    if (tournament.value) {
      tournamentStore.name = tournament.value.name
      tournamentStore.tours = tournament.value.tours
    }
  },
  { immediate: true }
)

const selectedStat = ref("pm")

const options = [
  { label: "Historical Prize Money", value: "pm" },
  { label: "Finalists", value: "finalists" },
  { label: "Winners by Country", value: "country" },
  { label: "Winners By Age", value: "age" },
  { label: "Winners By Games and Sets Lost", value: "games-sets-lost" },
  {
    label: "Seeds",
    value: "seeds",
    description: "Years when the top seeds reached the later rounds"
  },
  {
    label: "Qualifiers / Lucky Losers / Alternates / Wild Cards",
    value: "statuses",
    description: "Who have won the tournament"
  },
  {
    label: "Lowest Ranked Player",
    value: "lowest-ranked",
    description: "To reach the later rounds"
  }
]
</script>

<template>
  <u-container>
    <u-page>
      <template #left>
        <u-page-aside>
          <u-badge
            v-if="tournament?.updated_at"
            color="success"
            :label="`Updated: ${(lgAndDown ? shortDateFormat : dateTimeFormat).format(new Date(tournament?.updated_at))}`"
            class="w-full"
          />

          <dev-only v-if="tournament">
            <tournaments-update
              :tournament
              :refresh
            />

            <edition-update />
          </dev-only>

          <!-- <u-separator v-if="selectedTab === 'Numbers' || winnersRef?.tableRef?.table" /> -->
        </u-page-aside>
      </template>

      <u-page-header
        headline="Tournaments"
        :title="tournamentStore.name"
        :ui="{ description: 'flex items-center gap-2' }"
      >
        <template #description>
          <u-badge
            v-for="tour in tournament?.tours"
            :key="tour"
            :label="tour"
            :color="<keyof typeof colors>tour"
          />
          <div>
            <span v-if="tournament?.established">{{ tournament.established }}</span>
            <span v-if="tournament?.established && !tournament.abolished"> - present</span>
            <span v-else-if="tournament?.abolished && tournament.established !== tournament.abolished"> - {{ tournament.abolished }}</span>
          </div>
        </template>

        <template #links>
          <u-button
            v-if="tournament?.website"
            :to="tournament.website"
            target="_blank"
            :icon="icons.external"
          />

          <view-switcher v-if="selectedTab === 'Winners'" />
        </template>
      </u-page-header>

      <u-page-body>
        <u-tabs
          v-if="tournament"
          v-model="selectedTab"
          :items="tabItems"
          size="xs"
        >
          <template #winners>
            <tournament-winners ref="winnersRef" />
          </template>

          <template #numbers>
            <tournament-numbers :selection="selectedStat" />
          </template>
        </u-tabs>

        <empty
          v-else
          :message="`No details available for ${tournamentStore.name}`"
          :icon="ICONS.trophyOff"
        >
          <dev-only>
            <tournaments-update />
          </dev-only>
        </empty>
      </u-page-body>
    </u-page>
  </u-container>
</template>
