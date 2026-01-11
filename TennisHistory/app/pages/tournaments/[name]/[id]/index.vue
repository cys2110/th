<script setup lang="ts">
import type { FetchError } from "ofetch"

definePageMeta({ name: "tournament" })

const {
  params: { id, name }
} = useRoute("tournament")
const {
  ui: { colors, icons }
} = useAppConfig()

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

const { data: tournament, refresh } = await useFetch("/api/tournament", {
  query: { id },
  onResponseError: ({ error }) => {
    if (typeof error === "object" && "statusMessage" in error) {
      const err = error as FetchError<ValidationError>

      if (err.statusMessage === "Invalid request body") {
        console.error(
          "Validation errors: ",
          err.data?.validationErrors.map(e => `${e.path.join(".")}: ${e.message}`)
        )
      }
    } else {
      console.error(error)
    }
  }
})

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
            color="success"
            :label="`Updated: ${useDateFormat(tournament?.updated_at, 'DD MMMM YYYY').value}`"
            class="w-full justify-center"
          />

          <dev-only v-if="tournament">
            <tournaments-update
              :tournament
              :refresh
            />

            <editions-update />
          </dev-only>

          <u-separator v-if="selectedTab === 'Numbers' || winnersRef?.tableRef?.table" />

          <u-radio-group
            v-if="selectedTab === 'Numbers'"
            v-model="selectedStat"
            :items="options"
            variant="card"
          />

          <template v-else-if="winnersRef?.tableRef?.table">
            <table-client-clear-filters :table="winnersRef.tableRef.table" />

            <table-client-clear-sorting :table="winnersRef.tableRef.table" />

            <table-client-clear-grouping :table="winnersRef.tableRef.table" />
          </template>
        </u-page-aside>
      </template>

      <u-page-header
        headline="Tournaments"
        :title="tournamentStore.name"
        :ui="{ description: 'flex items-center gap-2' }"
      >
        <template #description>
          <div class="flex items-center justify-end gap-2">
            <u-badge
              v-for="tour in tournament?.tours"
              :key="tour"
              :label="tour"
              :color="(tour as keyof typeof colors)"
            />
            <div>
              <span v-if="tournament?.established">{{ tournament.established }}</span>
              <span v-if="tournament?.established && !tournament.abolished"> - present</span>
              <span v-else-if="tournament?.abolished && tournament.established !== tournament.abolished"> - {{ tournament.abolished }}</span>
            </div>
          </div>
        </template>

        <template #links>
          <u-button
            v-if="tournament?.website"
            :to="tournament.website"
            target="_blank"
            :icon="icons.external"
          />

          <u-slideover
            title="Filters"
            class="lg:hidden"
          >
            <u-button :icon="ICONS.filter" />

            <template #body>
              <u-radio-group
                v-if="selectedTab === 'Numbers'"
                v-model="selectedStat"
                :items="options"
                variant="card"
              />

              <template v-else-if="winnersRef?.tableRef?.table">
                <table-client-clear-filters :table="winnersRef.tableRef.table" />

                <table-client-clear-sorting :table="winnersRef.tableRef.table" />

                <table-client-clear-grouping :table="winnersRef.tableRef.table" />
              </template>
            </template>
          </u-slideover>

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
            <div class="max-h-150 scrollbar">
              <tournament-winners ref="winnersRef" />
            </div>
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
