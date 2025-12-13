<script setup lang="ts">
definePageMeta({ name: "tournament" })

const {
  params: { id, name }
} = useRoute("tournament")
const {
  ui: { icons }
} = useAppConfig()

const selectedTab = ref<"Winners" | "Numbers">("Winners")
const tabItems = [
  { label: "Winners", value: "Winners" },
  { label: "Numbers", value: "Numbers" }
]

const { data: tournament, refresh } = await useFetch("/api/tournaments", {
  query: { id }
})

useHead({ title: () => tournament.value?.name ?? capitalCase(name) })
const tournamentName = useState("tournamentName", () => tournament.value?.name ?? capitalCase(name))

const viewMode = ref(true)
const page = useRouteQuery("page", 1, { transform: Number })
const itemsPerPage = ref(40)
const skip = computed(() => (page.value - 1) * itemsPerPage.value)
const winnersRef = useTemplateRef("winners")

const years = ref([])
const tours = ref([])
const players = ref([])
const resetFilters = () => {
  const filters = [years, tours, players]
  filters.forEach(filter => set(filter, []))
}

watchDeep([years, tours, players, itemsPerPage], () => {
  set(page, 1)
})

// API call
const {
  data,
  status,
  refresh: refreshWinners
} = await useFetch("/api/editions", {
  method: "POST",
  body: {
    id,
    skip,
    offset: itemsPerPage,
    years,
    tours,
    players
  },
  default: () => ({ count: 0, editions: [] }),
  immediate: false
})

watch(
  selectedTab,
  tab => {
    if (tab === "Winners") {
      refreshWinners()
    } else {
      resetFilters()
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
  <u-container class="min-h-screen flex flex-col">
    <u-page :ui="{ center: selectedTab === 'Winners' ? 'lg:col-span-6' : 'lg:col-span-8' }">
      <template #left>
        <u-page-aside>
          <u-badge
            color="success"
            :label="`Updated: ${useDateFormat(tournament?.updated_at, 'DD MMMM YYYY').value}`"
            class="w-full justify-center"
          />

          <dev-only v-if="tournament && selectedTab === 'Winners'">
            <tournaments-update
              :tournament
              :refresh
            />

            <editions-update :tournament />
          </dev-only>

          <u-separator />

          <u-radio-group
            v-if="selectedTab === 'Numbers'"
            v-model="selectedStat"
            :items="options"
            variant="card"
          />

          <filters
            v-else
            :filters="['tours', 'years']"
            v-model:tours="tours"
            v-model:years="years"
            :reset-filters
            :table="winnersRef?.table"
          />
        </u-page-aside>
      </template>

      <template
        #right
        v-if="selectedTab === 'Winners'"
      >
        <u-page-aside>
          <form-command-palette-search
            type="Winner"
            v-model="players"
            :icon="ICONS.tournament"
            :id
          />
        </u-page-aside>
      </template>

      <u-page-header
        :title="tournament ? (selectedTab === 'Winners' ? 'Winners' : 'By the Numbers') : capitalCase(name)"
        class="border-none pb-0"
        :class="{ 'border-none': !COUNTRY_DRAWS.includes(id) }"
      >
        <template #headline>
          <breadcrumbs />
        </template>

        <template #description>
          <div class="flex items-center justify-end gap-2">
            <u-badge
              v-for="tour in tournament?.tours"
              :key="tour"
              :label="tour"
              :color="tour"
            />
            <div>
              <span v-if="tournament?.established">{{ tournament.established }}</span>
              <span v-if="tournament?.established && !tournament.abolished"> - present</span>
              <span v-else-if="tournament?.abolished && tournament.established !== tournament.abolished"> - {{ tournament.abolished }}</span>
            </div>
          </div>

          <u-tabs
            v-if="!COUNTRY_DRAWS.includes(id)"
            v-model="selectedTab"
            :items="tabItems"
            variant="link"
          />
        </template>

        <template #links>
          <view-switcher
            v-if="selectedTab === 'Winners'"
            v-model="viewMode"
          />

          <u-button
            v-if="tournament?.website"
            :to="tournament.website"
            target="_blank"
            :icon="icons.external"
          />

          <u-slideover
            title="Filters"
            class="ml-auto lg:hidden"
          >
            <u-button :icon="ICONS.filter" />

            <template #body>
              <u-radio-group
                v-if="selectedTab === 'Numbers'"
                v-model="selectedStat"
                :items="options"
                variant="card"
              />

              <filters
                v-else
                :filters="['tours', 'years', 'winners']"
                v-model:tours="tours"
                v-model:years="years"
                :reset-filters
                :id
                :table="winnersRef?.table"
              />
            </template>
          </u-slideover>
        </template>
      </u-page-header>

      <u-page-body>
        <template v-if="tournament">
          <tournaments-winners
            v-if="selectedTab === 'Winners'"
            ref="winners"
            :tournament
            :editions="data.editions"
            :status
            v-model:view-mode="viewMode"
          />

          <tournaments-numbers
            v-else
            v-model="selectedStat"
          />
        </template>

        <empty
          v-else
          :message="`No details available for ${capitalCase(name)}`"
          :icon="ICONS.noTournament"
        />
      </u-page-body>
    </u-page>

    <counts
      v-if="selectedTab === 'Winners'"
      :total="data.count"
      :items-per-page="itemsPerPage"
      v-model:page="page"
      type="edition"
    />
  </u-container>
</template>
