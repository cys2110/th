<script setup lang="ts">
const { status, count, tournaments } = defineProps<{
  tournaments: TournamentInterface[]
  resetFilters: () => void
  count: number
  status: APIStatusType
  refresh: () => void
}>()
const skip = defineModel<number>("skip")
const filters = defineModel<Partial<FiltersInterface>>("filters")

const {
  ui: { icons }
} = useAppConfig()
const breakpoints = useBreakpoints(breakpointsTailwind, { ssrWidth: useSSRWidth() })
const mdAndDown = breakpoints.smallerOrEqual("md")
const grid = useTemplateRef<HTMLDivElement>("grid")
const initialised = ref(false)

onMounted(() => {
  if (!grid.value) return
  useInfiniteScroll(
    grid.value,
    () => {
      // Ensure reset filters doesn't immediately trigger load more
      if (!get(initialised)) {
        set(initialised, true)
        return
      }
      set(skip, get(skip)! + 40)
    },
    {
      distance: 10,
      canLoadMore: () => {
        return get(status) !== "pending" && count > tournaments.length
      }
    }
  )
})
</script>

<template>
  <u-container>
    <u-page>
      <template #left>
        <u-page-aside>
          <dev-only>
            <tournaments-update />
          </dev-only>

          <u-button
            label="Reset Filters"
            :icon="ICONS.noFilter"
            @click="resetFilters"
            block
          />

          <template v-if="filters">
            <u-checkbox-group
              legend="Tours"
              v-model="filters.tours"
              :items="TOUR_OPTIONS"
              :ui="{ item: 'ml-3' }"
            />
            <form-input
              v-model="filters.established"
              type="number"
              placeholder="Year Established"
              block
            />
            <form-input
              v-model="filters.abolished"
              type="number"
              placeholder="Year Abolished"
              block
            />
          </template>
        </u-page-aside>
      </template>

      <template #right>
        <u-page-aside>
          <div class="font-semibold text-muted">{{ count }} tournament{{ count === 1 ? "" : "s" }}</div>

          <form-command-palette-search
            v-if="filters"
            type="Tournaments"
            v-model="filters.tournaments"
          />
        </u-page-aside>
      </template>

      <u-page-header title="Tournaments">
        <template
          #links
          v-if="mdAndDown"
        >
          <u-slideover
            title="Filters"
            class="ml-auto"
          >
            <u-button :icon="ICONS.filter" />

            <template #body>
              <dev-only>
                <tournaments-update />
              </dev-only>

              <u-button
                label="Reset Filters"
                :icon="ICONS.noFilter"
                @click="resetFilters"
                block
              />

              <template v-if="filters">
                <form-select-search
                  placeholder="Tournaments"
                  type="tournaments"
                  v-model="filters.tournaments"
                  block
                />

                <u-checkbox-group
                  legend="Tours"
                  v-model="filters.tours"
                  :items="TOUR_OPTIONS"
                  :ui="{ item: 'ml-3' }"
                />
                <form-input
                  v-model="filters.established"
                  type="number"
                  placeholder="Year Established"
                  block
                />
                <form-input
                  v-model="filters.abolished"
                  type="number"
                  placeholder="Year Abolished"
                  block
                />
              </template>
            </template>
          </u-slideover>
        </template>
      </u-page-header>

      <u-page-body>
        <u-page-grid
          v-if="(tournaments.length && status === 'success') || status === 'pending'"
          ref="grid"
        >
          <u-page-card
            v-if="tournaments.length"
            v-for="tournament in tournaments"
            :key="tournament.id.toString()"
            :title="tournament.name"
            :to="{ name: 'tournament', params: { id: tournament.id, name: kebabCase(tournament.name) } }"
            highlight
            :highlight-color="tournament.tours.length > 1 ? 'primary' : tournament.tours[0]"
            :ui="{ root: 'h-full', body: 'w-full', leading: 'flex items-center gap-1' }"
          >
            <template #leading>
              <u-badge
                v-for="tour in tournament.tours"
                :key="tour"
                :color="tour"
                :label="TourEnum[tour]"
              />
            </template>

            <template #description>
              <span v-if="tournament.established">{{ tournament.established }}</span>
              <span v-if="tournament.established && !tournament.abolished"> - present</span>
              <span v-else-if="tournament.abolished && tournament.established !== tournament.abolished"> - {{ tournament.abolished }}</span>
            </template>
          </u-page-card>

          <cards-loading-base
            v-if="status === 'pending'"
            v-for="_ in 6"
            :key="_"
          />
        </u-page-grid>

        <u-empty
          v-else
          title="No tournaments found"
          :icon="ICONS.noTournament"
          description="If you think this is an error, refresh the page. Otherwise, please be patient as we continue to add more data."
        >
          <template #actions>
            <u-button
              label="Refresh"
              :icon="icons.reload"
              @click="reloadNuxtApp()"
            />
            <dev-only>
              <tournaments-update :refresh />
            </dev-only>
          </template>
        </u-empty>
      </u-page-body>
    </u-page>
  </u-container>
</template>
