<script setup lang="ts">
import type { BreadcrumbItem } from "@nuxt/ui"

const { count, status, editions } = defineProps<{
  tournament: TournamentInterface
  editions: EditionInterface[]
  status: APIStatusType
  count: number
  resetFilters: () => void
  refresh: () => void
}>()
const selectedTab = defineModel<string>()
const skip = defineModel<number>("skip")
const filters = defineModel<Partial<FiltersInterface>>("filters")

const {
  params: { id, name }
} = useRoute("tournament")
const {
  ui: { icons }
} = useAppConfig()
const breakpoints = useBreakpoints(breakpointsTailwind, { ssrWidth: useSSRWidth() })
const mdAndDown = breakpoints.smallerOrEqual("md")

const tours = useState<(keyof typeof TourEnum)[]>("tours")
const grid = useTemplateRef<HTMLDivElement>("grid")
const initialised = ref(false)

onMounted(() => {
  if (!grid.value) return
  useInfiniteScroll(
    grid.value,
    () => {
      if (!get(initialised)) {
        set(initialised, true)
        return
      }
      set(skip, get(skip)! + 40)
    },
    {
      distance: 10,
      canLoadMore: () => {
        return get(status) !== "pending" && count > editions.length
      }
    }
  )
})

const breadcrumbs: BreadcrumbItem[] = [
  { icon: ICONS.home, to: { name: "home" } },
  { label: "Tournaments", icon: ICONS.tournament, to: { name: "tournaments" } }
]
</script>

<template>
  <u-container>
    <u-page>
      <template #left>
        <u-page-aside>
          <u-tabs
            v-if="!COUNTRY_DRAWS.includes(id as string)"
            v-model="selectedTab"
            :items="[
              { label: 'Winners', value: 'Winners' },
              { label: 'Numbers', value: 'Numbers' }
            ]"
            variant="link"
            orientation="vertical"
          />
          <dev-only>
            <tournaments-update
              :tournament
              :refresh
            />
            <editions-update />
          </dev-only>
          <u-badge
            color="success"
            :label="`Updated: ${useDateFormat(tournament.updated_at, 'DD MMMM YYYY').value}`"
            class="w-full justify-center"
          />
          <u-button
            label="Reset Filters"
            :icon="ICONS.noFilter"
            @click="resetFilters"
            block
          />

          <template v-if="filters">
            <u-checkbox-group
              v-if="tours.length > 1"
              legend="Tours"
              v-model="filters.tours"
              :items="TOUR_OPTIONS"
              :ui="{ item: 'ml-3' }"
            />

            <form-select-menu
              v-model="filters.years"
              placeholder="Years"
              :items="ALL_YEARS"
              :icon="ICONS.event"
              multiple
              block
            />
          </template>
        </u-page-aside>
      </template>

      <template #right>
        <u-page-aside>
          <div class="font-semibold text-muted">{{ count }} edition{{ count === 1 ? "" : "s" }}</div>

          <form-command-palette-search
            v-if="filters"
            type="Winners"
            v-model="filters.winners"
            :id
          />
        </u-page-aside>
      </template>

      <u-page-header :title="tournament.name">
        <template #headline>
          <u-breadcrumb :items="breadcrumbs" />
        </template>

        <template #description>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <u-badge
                v-for="tour in tournament.tours"
                :key="tour"
                :label="TourEnum[tour]"
                :color="tour"
              />
            </div>
            <div>
              <span v-if="tournament?.established">{{ tournament.established }}</span>
              <span v-if="tournament?.established && !tournament.abolished"> - present</span>
              <span v-else-if="tournament?.abolished && tournament.established !== tournament.abolished"> - {{ tournament.abolished }}</span>
            </div>
          </div>
        </template>

        <template #links>
          <div class="flex items-center gap-2">
            <u-button
              v-if="tournament.website"
              :to="tournament.website"
              target="_blank"
              :icon="icons.external"
            />
            <u-slideover
              v-if="mdAndDown"
              title="Filters"
              class="ml-auto"
            >
              <u-button :icon="ICONS.filter" />
              <template #body>
                <dev-only>
                  <tournaments-update :tournament />
                  <editions-update />
                </dev-only>
                <u-badge
                  color="success"
                  :label="`Updated: ${useDateFormat(tournament.updated_at, 'DD MMMM YYYY').value}`"
                  class="w-full"
                  size="lg"
                />
                <u-tabs
                  v-if="!COUNTRY_DRAWS.includes(id as string)"
                  v-model="selectedTab"
                  :items="[
                    { label: 'Winners', value: 'winners' },
                    { label: 'Numbers', value: 'numbers' }
                  ]"
                  variant="link"
                  orientation="vertical"
                />
                <u-button
                  label="Reset Filters"
                  :icon="ICONS.noFilter"
                  @click="resetFilters"
                  block
                />
                <template v-if="filters">
                  <u-checkbox-group
                    v-if="tours.length > 1"
                    legend="Tours"
                    v-model="filters.tours"
                    :items="TOUR_OPTIONS"
                    :ui="{ item: 'ml-3' }"
                  />
                  <form-select-menu
                    v-model="filters.years"
                    placeholder="Years"
                    :items="ALL_YEARS"
                    :icon="ICONS.event"
                    multiple
                    block
                  />
                  <form-select-search
                    v-if="filters"
                    v-model="filters.winners"
                    placeholder="Winners"
                    type="winners"
                    multiple
                    block
                    :id
                  />
                </template>
              </template>
            </u-slideover>
          </div>
        </template>
      </u-page-header>

      <u-page-body>
        <u-page-grid
          v-if="editions.length || status === 'pending'"
          ref="grid"
        >
          <u-page-card
            v-if="editions.length"
            v-for="edition in editions"
            :key="edition.id.toString()"
            :title="edition.year.toString()"
            :to="{ name: 'edition', params: { id, name, year: edition.year, edId: edition.id } }"
            highlight
            :highlight-color="edition.tours.length > 1 ? 'primary' : edition.tours[0]"
            :ui="{ root: 'h-full', body: 'w-full', leading: 'flex items-center gap-1' }"
          >
            <template #leading>
              <u-badge
                v-for="tour in edition.tours"
                :key="tour"
                :color="tour"
                :label="TourEnum[tour]"
              />
            </template>

            <template #description>
              <div class="flex flex-col gap-1.5 *:*:last:font-semibold *:*:last:ml-3 text-sm">
                <div v-if="edition.sponsor_name">
                  <div>Sponsor Name</div>
                  <div>{{ edition.sponsor_name }}</div>
                </div>

                <div>
                  <div>Dates</div>
                  <div>{{
                    edition.start_date && edition.end_date
                      ? dateTimeFormat.formatRange(new Date(edition.start_date), new Date(edition.end_date))
                      : "Various"
                  }}</div>
                </div>

                <div v-if="edition.category">
                  <div>Category</div>
                  <div>{{ edition.category }}</div>
                </div>

                <div v-if="edition.surface">
                  <div>Surface</div>
                  <div>{{ edition.surface.id }}</div>
                </div>

                <div>
                  <div>Venues</div>
                  <div v-if="edition.venues?.length">
                    <div
                      v-for="venue in edition.venues"
                      :key="venue.id"
                      class="flex flex-wrap items-center gap-1 w-fit"
                    >
                      <span>{{ venue.name ? `${venue.name}, ${venue.city}` : venue.city }}</span>
                      <countries-link
                        :country="venue.country"
                        icon-only
                        class="mx-0"
                      />
                    </div>
                  </div>
                  <div v-else>Various</div>
                </div>

                <div v-if="edition.currency && edition.tfc">
                  <div>Total Financial Commitment</div>
                  <div>{{ edition.tfc.toLocaleString("en-GB", { style: "currency", currency: edition.currency }) }}</div>
                </div>

                <div v-if="edition.winners.length">
                  <div>Winners</div>
                  <div>
                    <div
                      v-for="winner in edition.winners"
                      :key="`${winner.tour}-${winner.type}`"
                      class="flex flex-col gap-1 my-2"
                    >
                      <div class="flex gap-2">
                        <u-badge
                          :label="TourEnum[winner.tour]"
                          :color="winner.tour"
                          class="w-full justify-center"
                        />
                        <u-badge
                          :label="winner.type"
                          :color="winner.type"
                          class="w-full justify-center"
                        />
                      </div>
                      <div class="flex flex-col ml-3">
                        <players-link
                          v-for="player in winner.team"
                          :key="player.id"
                          :player
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </u-page-card>

          <cards-loading-event
            v-if="status === 'pending'"
            v-for="_ in 6"
            :key="_"
          />
        </u-page-grid>

        <u-empty
          v-else
          title="No editions found"
          :icon="ICONS.noEdition"
          description="If you think this is an error, refresh the page. Otherwise, please be patient as we continue to add more data."
        >
          <template #actions>
            <u-button
              label="Refresh"
              :icon="icons.reload"
              @click="reloadNuxtApp()"
            />
            <dev-only>
              <editions-update :refresh />
            </dev-only>
          </template>
        </u-empty>
      </u-page-body>
    </u-page>
  </u-container>
</template>
