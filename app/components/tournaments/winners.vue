<script setup lang="ts">
import { CountriesLink, DevOnly, PlayersLink, UBadge, UFieldGroup, VenuesUpdate } from "#components"
import type { TableColumn, TableRow } from "@nuxt/ui"

defineProps<{
  tournament: TournamentType
  refresh: () => void
  tabItems: { label: string; value: string }[]
}>()

const {
  params: { id, name }
} = useRoute("tournament")

const breakpoints = useBreakpoints(breakpointsTailwind, { ssrWidth: useSSRWidth() })
const mdAndDown = breakpoints.smallerOrEqual("md")
const {
  ui: { icons, colors }
} = useAppConfig()

const selectedTab = defineModel<"Winners" | "Numbers">()
const viewMode = ref(true)

// Pagination
const page = ref(1)
const itemsPerPage = ref(40)
const skip = computed(() => (page.value - 1) * itemsPerPage.value)

// Filters
const years = ref([])
const tours = ref([])
const players = ref([])
const resetFilters = () => {
  ;[years, tours, players].forEach(filter => (filter.value = []))
}

// Reset page on filters change
watchDeep([years, tours, players, itemsPerPage], () => {
  set(page, 1)
})

// API call
const { data, status } = await useFetch("/api/editions", {
  method: "POST",
  body: {
    id,
    skip,
    offset: itemsPerPage,
    years,
    tours,
    players
  },
  default: () => ({ count: 0, editions: [] as EditionType[] })
})

const [defineEmptyTemplate, reuseEmptyTemplate] = createReusableTemplate()

// Table columns
const table = useTemplateRef<any>("table")
const columns: TableColumn<EditionType>[] = [
  { accessorKey: "year", header: "Year" },
  {
    accessorKey: "tours",
    header: "Tours",
    cell: ({ row }) => {
      const tours = row.original.tours

      return h(
        "div",
        { class: "flex justify-center items-center gap-1" },
        tours?.map(tour =>
          h(UBadge, {
            key: tour,
            label: tour,
            color: tour as keyof typeof colors
          })
        )
      )
    }
  },
  { accessorKey: "sponsor_name", header: "Sponsor Name", cell: cell => cell.renderValue() },
  { accessorKey: "category", header: "Category", cell: cell => cell.renderValue() },
  {
    id: "dates",
    header: "Dates",
    cell: ({ row }) => {
      const { start_date, end_date } = row.original
      if (start_date && end_date) {
        if (mdAndDown) {
          return shortDateFormat.formatRange(new Date(start_date), new Date(end_date))
        } else {
          return dateTimeFormat.formatRange(new Date(start_date), new Date(end_date))
        }
      } else {
        return "—"
      }
    }
  },
  { id: "Surface", accessorKey: "surface.id", header: "Surface", cell: cell => cell.renderValue() },
  {
    accessorKey: "venues",
    header: "Venues",
    cell: ({ row }) => {
      const venues = row.original.venues
      if (venues?.length) {
        return venues.map(venue =>
          h(
            "div",
            {
              key: venue.id,
              class: "flex items-center gap-1"
            },
            h(
              DevOnly,
              {},
              {
                default: () => h(VenuesUpdate, { venue }),
                fallback: () => [
                  venue.name ? `${venue.name}, ${venue.city}` : venue.city,
                  h(CountriesLink, {
                    country: venue.country!,
                    iconOnly: true
                  })
                ]
              }
            )
          )
        )
      } else {
        return "—"
      }
    }
  },
  {
    id: "Total financial commitment",
    accessorFn: row => (row.tfc && row.currency ? row.tfc.toLocaleString("en-GB", { style: "currency", currency: row.currency }) : "—"),
    header: "TFC"
  },
  {
    accessorKey: "winners",
    header: "Winners",
    cell: ({ row }) => {
      const winners = row.original.winners

      if (winners?.length) {
        return winners.map(winner =>
          h(
            "div",
            {
              key: `${winner.tour}-${winner.type}`,
              class: "flex flex-col my-1.5"
            },
            () => [
              h(UFieldGroup, {}, [
                h(UBadge, {
                  label: winner.tour,
                  color: winner.tour as keyof typeof colors,
                  class: "w-full justify-center"
                }),
                h(UBadge, { label: winner.type, color: winner.type, class: "w-full justify-center" })
              ]),
              h(
                "div",
                { class: "flex flex-col ml-5" },
                winner.team.map(player => h(PlayersLink, { key: player.id, player }))
              )
            ]
          )
        )
      } else {
        return "—"
      }
    }
  }
]

const columnPinning = ref({
  left: ["year"],
  right: []
})

const handleSelect = async (e: Event, row: TableRow<EditionType>) => {
  await navigateTo({ name: "edition", params: { id, name, year: row.original.year as number, edId: row.original.id } })
}
</script>

<template>
  <u-container class="min-h-screen flex flex-col">
    <u-page>
      <template #left>
        <u-page-aside>
          <u-tabs
            v-if="!COUNTRY_DRAWS.includes(id)"
            v-model="selectedTab"
            :items="tabItems"
            variant="link"
            orientation="vertical"
          />

          <dev-only>
            <tournaments-update
              :tournament
              :refresh
            />

            <editions-update
              :tournament
              :refresh
            />
          </dev-only>

          <u-badge
            color="success"
            :label="`Updated: ${useDateFormat(tournament?.updated_at, 'DD MMMM YYYY').value}`"
            class="w-full justify-center"
          />

          <u-button
            label="Reset Filters"
            :icon="ICONS.noFilter"
            @click="resetFilters"
            block
          />

          <table-visibility
            v-if="!viewMode && table"
            :table
          />

          <u-checkbox-group
            v-if="tournament.tours && tournament.tours.length > 1"
            legend="Tours"
            v-model="tours"
            :items="tournament.tours || TOUR_OPTIONS"
            :ui="{ item: 'ml-3' }"
          />

          <form-input-menu
            v-model="years"
            placeholder="Years"
            :items="ALL_YEARS"
            :icon="ICONS.event"
            multiple
          />
        </u-page-aside>
      </template>

      <template #right>
        <u-page-aside>
          <form-command-palette-search
            type="Winner"
            v-model="players"
            :icon="ICONS.tournament"
            :id
          />
        </u-page-aside>
      </template>

      <u-page-header title="Winners">
        <template #headline>
          <breadcrumbs />
        </template>

        <template #description>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <u-badge
                v-for="tour in tournament.tours"
                :key="tour"
                :label="tour"
                :color="(tour as keyof typeof colors)"
              />
            </div>
            <div>
              <span v-if="tournament.established">{{ tournament.established }}</span>
              <span v-if="tournament.established && !tournament.abolished"> - present</span>
              <span v-else-if="tournament.abolished && tournament.established !== tournament.abolished"> - {{ tournament.abolished }}</span>
            </div>
          </div>
        </template>

        <template #links>
          <u-tooltip :text="viewMode ? 'Cards' : 'Table'">
            <div>
              <u-switch
                v-model="viewMode"
                :checked-icon="ICONS.cards"
                :unchecked-icon="ICONS.table"
              />
            </div>
          </u-tooltip>

          <u-button
            v-if="tournament?.website"
            :to="tournament.website"
            target="_blank"
            :icon="icons.external"
          />

          <!--Filters for smaller screens-->
          <u-slideover
            v-if="mdAndDown"
            title="Filters"
            class="ml-auto"
          >
            <u-button :icon="ICONS.filter" />

            <template #body>
              <u-tabs
                v-if="!COUNTRY_DRAWS.includes(id)"
                v-model="selectedTab"
                :items="tabItems"
                variant="link"
                orientation="vertical"
              />

              <dev-only>
                <tournaments-update
                  :tournament
                  :refresh
                />

                <editions-update
                  :tournament
                  :refresh
                />
              </dev-only>

              <u-badge
                color="success"
                :label="`Updated: ${useDateFormat(tournament?.updated_at, 'DD MMMM YYYY').value}`"
                class="w-full justify-center"
              />

              <u-button
                label="Reset Filters"
                :icon="ICONS.noFilter"
                @click="resetFilters"
                block
              />

              <table-visibility
                v-if="!viewMode && table"
                :table
              />

              <form-search
                type="Winner"
                v-model="players"
                :icon="ICONS.tournament"
                multiple
                :id
              />

              <u-checkbox-group
                v-if="tournament.tours && tournament.tours.length > 1"
                legend="Tours"
                v-model="tours"
                :items="tournament.tours || TOUR_OPTIONS"
                :ui="{ item: 'ml-3' }"
              />

              <form-input-menu
                v-model="years"
                placeholder="Years"
                :items="ALL_YEARS"
                :icon="ICONS.event"
                multiple
              />
            </template>
          </u-slideover>
        </template>
      </u-page-header>

      <u-page-body class="h-full flex flex-col">
        <!--Empty template-->
        <define-empty-template>
          <empty
            message="No editions found"
            :icon="ICONS.noEdition"
            class="mx-2"
          >
            <dev-only>
              <editions-update
                :tournament
                :refresh
              />
            </dev-only>
          </empty>
        </define-empty-template>

        <div class="flex-1">
          <!--Card view-->
          <template v-if="viewMode">
            <u-page-columns v-if="data.editions.length || status === 'pending'">
              <u-page-card
                v-if="data.count"
                v-for="edition in data.editions"
                :key="edition.id.toString()"
                :title="edition.year?.toString()"
                highlight
                :to="{ name: 'edition', params: { id, name, year: edition.year!, edId: edition.id } }"
                :ui="{ body: 'w-full', leading: 'flex items-center gap-1' }"
              >
                <template #leading>
                  <u-badge
                    v-for="tour in edition.tours"
                    :key="tour"
                    :color="(tour as keyof typeof colors)"
                    :label="tour"
                  />
                </template>

                <template #description>
                  <div class="flex flex-col gap-1.5 *:*:first:font-semibold *:*:not-first:ml-3 *:*:not-first:text-default text-sm">
                    <div v-if="edition.sponsor_name">
                      <div>Sponsor Name</div>
                      <div>{{ edition.sponsor_name }}</div>
                    </div>

                    <div>
                      <div>Dates</div>
                      <div>{{
                        edition.start_date && edition.end_date
                          ? mdAndDown
                            ? shortDateFormat.formatRange(new Date(edition.start_date), new Date(edition.end_date))
                            : dateTimeFormat.formatRange(new Date(edition.start_date), new Date(edition.end_date))
                          : "Various"
                      }}</div>
                    </div>

                    <div v-if="edition.category">
                      <div>Category</div>
                      <div>{{ edition.category }}</div>
                    </div>

                    <div>
                      <div>Surface</div>
                      <div>{{ edition.surface?.id ?? "Various" }}</div>
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
                            :country="venue.country!"
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

                    <div v-if="edition.winners?.length">
                      <div>Winners</div>
                      <div
                        v-for="winner in edition.winners"
                        :key="`${winner.tour}-${winner.type}`"
                        class="flex flex-col gap-1 my-2"
                      >
                        <u-field-group>
                          <u-badge
                            :label="winner.tour"
                            :color="(winner.tour as keyof typeof colors)"
                            class="w-full justify-center"
                          />
                          <u-badge
                            :label="winner.type"
                            :color="winner.type"
                            class="w-full justify-center"
                          />
                        </u-field-group>
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
                </template>
              </u-page-card>

              <!--TODO: Update loading card-->
              <loading-base
                v-else
                v-for="_ in 6"
                :key="_"
              />
            </u-page-columns>
            <reuse-empty-template v-else />
          </template>

          <!--Table view-->
          <u-table
            v-else
            ref="table"
            :data="data.editions"
            :columns
            :loading="status === 'pending'"
            sticky
            v-model:column-pinning="columnPinning"
            @select="handleSelect"
            render-fallback-value="—"
            :ui="{ tbody: '[&>tr]:cursor-pointer' }"
          >
            <template #loading>
              <u-icon
                :name="icons.loading"
                class="size-8"
              />
            </template>
            <template #empty>
              <reuse-empty-template />
            </template>
          </u-table>
        </div>

        <div class="sticky w-full z-50 bg-default bottom-0 mt-auto pt-3 pb-6">
          <div class="grid grid-cols-1 lg:grid-cols-3 justify-items-center">
            <div
              v-if="!mdAndDown"
              class="font-semibold text-muted"
            >
              {{ data.count }} tournament{{ data.count === 1 ? "" : "s" }}
            </div>

            <u-pagination
              v-model:page="page"
              :total="data.count"
              :sibling-count="mdAndDown ? 1 : 2"
              :items-per-page
              active-variant="subtle"
            />

            <u-form-field
              v-if="!mdAndDown"
              label="Items per page"
              class="w-4/5 ml-auto"
            >
              <u-slider
                v-model="itemsPerPage"
                :min="10"
                :max="100"
                :step="5"
                tooltip
              />
            </u-form-field>
          </div>
        </div>
      </u-page-body>
    </u-page>
  </u-container>
</template>
