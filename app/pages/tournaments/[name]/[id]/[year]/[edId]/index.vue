<script setup lang="ts">
import { CountriesLink, DevOnly, PlayersLink, UBadge, VenuesUpdate } from "#components"
import type { TableColumn, TableRow } from "@nuxt/ui"
import { parseDate } from "@internationalized/date"

definePageMeta({ name: "edition" })

const {
  params: { id, name, year, edId }
} = useRoute("edition")
const {
  ui: { colors, icons }
} = useAppConfig()
const breakpoints = useBreakpoints(breakpointsTailwind, { ssrWidth: useSSRWidth() })
const mdAndDown = breakpoints.smallerOrEqual("md")
const viewMode = ref(true)

const { data: edition, refresh } = await useFetch("/api/editions", {
  query: { edId }
})

useHead({ title: () => `${edition.value?.tournament?.name ?? capitalCase(name)} ${year}` })

const { data: events, status } = await useFetch("/api/events", {
  query: { edId },
  default: () => []
})

const [defineEmptyTemplate, reuseEmptyTemplate] = createReusableTemplate()

const table = useTemplateRef<any>("table")
const columns: TableColumn<EventType>[] = [
  {
    accessorKey: "tour",
    header: "Tour",
    cell: ({ row }) =>
      h(UBadge, {
        label: row.original.tour,
        color: row.original.tour as keyof typeof colors
      })
  },
  {
    accessorKey: "level",
    header: "Level",
    cell: ({ row }) => h(UBadge, { label: row.original.level, color: row.original.level })
  },
  { accessorKey: "sponsor_name", header: "Sponsor Name", cell: cell => cell.renderValue() },
  { accessorKey: "category", header: "Category", cell: cell => cell.renderValue() },
  {
    id: "dates",
    header: "Dates",
    accessorFn: row => (row.start_date && row.end_date ? dateTimeFormat.formatRange(new Date(row.start_date), new Date(row.end_date)) : "—")
  },
  { id: "surface", accessorKey: "surface.id", header: "Surface", cell: cell => cell.renderValue() },
  {
    id: "Prize Money",
    accessorFn: row => (row.pm && row.currency ? row.pm.toLocaleString("en-GB", { style: "currency", currency: row.currency }) : "—"),
    header: "Prize Money"
  },
  {
    id: "Total Financial Commitment",
    accessorFn: row => (row.tfc && row.currency ? row.tfc.toLocaleString("en-GB", { style: "currency", currency: row.currency }) : "—"),
    header: "TFC"
  },
  {
    accessorKey: "venues",
    header: "Venues",
    cell: ({ row }) => {
      const venues = row.original.venues

      if (venues?.length) {
        return venues.map(venue =>
          h(
            DevOnly,
            { key: venue.id },
            {
              default: () => h(VenuesUpdate, { venue }),
              fallback: () =>
                h("div", { class: "flex items-center gap-1" }, [
                  h("span", venue.name ? `${venue.name}, ${venue.city}` : venue.city),
                  h(CountriesLink, { country: venue.country!, "icon-only": true })
                ])
            }
          )
        )
      } else {
        return "—"
      }
    }
  },
  {
    accessorKey: "winners",
    header: "Winners",
    cell: ({ row }) => {
      const winners = row.original.winners

      if (winners?.length) {
        return winners.map(winner =>
          h("div", { key: winner.type, class: "flex flex-col my-2" }, [
            h(UBadge, {
              label: winner.type,
              color: winner.type,
              class: "w-full justify-center"
            }),
            h(
              "div",
              { class: "flex flex-col ml-5" },
              winner.team.map(player => h(PlayersLink, { key: player.id, player }))
            )
          ])
        )
      } else {
        return "—"
      }
    }
  }
]

const handleSelect = async (e: Event, row: TableRow<EventType>) => {
  await navigateTo({
    name: "event",
    params: { id, name, edId, year, tour: row.original.tour as string }
  })
}
</script>

<template>
  <u-container class="min-h-screen">
    <u-page>
      <template #left>
        <u-page-aside>
          <u-badge
            color="success"
            :label="`Updated: ${useDateFormat(edition?.updated_at, 'DD MMMM YYYY').value}`"
            class="w-full justify-center"
          />

          <dev-only>
            <editions-update
              :edition
              :refresh
            />
            <events-update
              v-if="edition"
              :edition
            />
          </dev-only>

          <table-visibility
            v-if="!viewMode && table"
            :table
          />
        </u-page-aside>
      </template>

      <u-page-header :title="year">
        <template #headline>
          <breadcrumbs />
        </template>

        <template #description>
          <div class="flex items-center gap-2">
            <u-badge
              v-for="tour in edition?.tours"
              :key="tour"
              :label="tour"
              :color="(tour as keyof typeof colors)"
            />
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
            v-if="edition?.wiki_link"
            :href="edition.wiki_link"
            :icon="ICONS.wikipedia"
            target="_blank"
          />

          <dev-only v-if="mdAndDown">
            <u-slideover
              title="Filters"
              class="ml-auto"
            >
              <u-button :icon="ICONS.filter" />
              <template #body>
                <editions-update
                  :edition
                  :refresh
                />
                <events-update
                  v-if="edition"
                  :edition
                />
              </template>
            </u-slideover>
          </dev-only>
        </template>
      </u-page-header>

      <u-page-body class="h-full flex flex-col">
        <details-grid>
          <div v-if="edition?.start_date && edition?.end_date">
            <u-calendar
              range
              :default-value="{ start: parseDate(edition.start_date), end: parseDate(edition.end_date) }"
              readonly
              :month-controls="false"
              :year-controls="false"
              :week-starts-on="1"
              weekday-format="long"
            />
          </div>

          <div v-if="edition?.sponsor_name">
            <div>Sponsor Name</div>
            <div>{{ edition.sponsor_name }}</div>
          </div>

          <div v-if="edition?.category">
            <div>Category</div>
            <div>{{ edition.category }}</div>
          </div>

          <div v-if="edition?.surface">
            <div>Surface</div>
            <div>{{ edition.surface.id }}</div>
          </div>

          <div v-if="edition?.venues?.length">
            <div>Venues</div>
            <dev-only>
              <venues-update
                v-for="venue in edition.venues"
                :key="venue.id"
                :venue
              />

              <template #fallback>
                <div
                  v-for="venue in edition.venues"
                  :key="venue.id"
                  class="flex items-center w-fit gap-1"
                >
                  <span>{{ venue.name ? `${venue.name}, ${venue.city}` : venue.city }}</span>
                  <countries-link
                    :country="venue.country!"
                    icon-only
                  />
                </div>
              </template>
            </dev-only>
          </div>

          <div v-if="edition?.currency && edition?.tfc">
            <div>Total Financial Commitment</div>
            <div>{{ edition.tfc.toLocaleString("en-GB", { style: "currency", currency: edition.currency }) }}</div>
          </div>
        </details-grid>

        <define-empty-template>
          <empty
            message="No events found"
            :icon="ICONS.noEvent"
            class="mx-2"
          >
            <dev-only>
              <events-update
                v-if="edition"
                :edition
              />
            </dev-only>
          </empty>
        </define-empty-template>

        <div class="flex-1">
          <template v-if="viewMode">
            <div
              v-if="events.length || status === 'pending'"
              class="flex gap-5"
            >
              <u-page-card
                v-if="events.length"
                v-for="event in events"
                :key="event.id"
                highlight
                :highlight-color="(event.tour as keyof typeof colors)"
                :to="{ name: 'event', params: { id, name, year, edId, tour: event.tour } }"
                :ui="{
                  root: 'min-w-1/2 max-w-fit',
                  body: 'w-full',
                  title: 'flex justify-between items-center'
                }"
              >
                <template #title>
                  <u-badge
                    :label="event.tour"
                    :color="(event.tour as keyof typeof colors)"
                  />
                  <u-badge
                    :label="event.level"
                    :color="event.level"
                  />
                </template>

                <template #description>
                  <div
                    class="flex flex-wrap items-center justify-evenly *:*:first:font-semibold *:*:text-center *:*:not-first:text-default text-sm my-2"
                  >
                    <div v-if="event.sponsor_name">
                      <div>Sponsor Name</div>
                      <div>{{ event.sponsor_name }}</div>
                    </div>

                    <div v-if="event.start_date && event.end_date">
                      <div>Dates</div>
                      <div>{{ dateTimeFormat.formatRange(new Date(event.start_date), new Date(event.end_date)) }}</div>
                    </div>

                    <div v-if="event.category">
                      <div>Category</div>
                      <div>{{ event.category }}</div>
                    </div>

                    <div v-if="event.surface">
                      <div>Surface</div>
                      <div>{{ event.surface.id }}</div>
                    </div>

                    <div v-if="event.venues?.length">
                      <div>Venues</div>
                      <div
                        v-for="venue in event.venues"
                        :key="venue.id"
                        class="flex items-center gap-1 w-fit"
                      >
                        <span>{{ venue.name ? `${venue.name}, ${venue.city}` : venue.city }}</span>
                        <countries-link
                          :country="venue.country!"
                          icon-only
                        />
                      </div>
                    </div>

                    <div v-if="event.pm && event.currency">
                      <div>Prize Money</div>
                      <div>{{ event.pm.toLocaleString("en-GB", { style: "currency", currency: event.currency }) }}</div>
                    </div>

                    <div v-if="event.currency && event.tfc">
                      <div>Total Financial Commitment</div>
                      <div>{{ event.tfc.toLocaleString("en-GB", { style: "currency", currency: event.currency }) }}</div>
                    </div>
                  </div>

                  <div
                    v-if="event.winners?.length && event.winners[0]?.team[0]?.country"
                    class="flex justify-evenly gap-5"
                  >
                    <div
                      v-for="winner in event.winners"
                      :key="winner.type"
                      class="flex flex-col items-center my-2 w-full"
                    >
                      <u-badge
                        :label="winner.type"
                        :color="winner.type"
                        class="w-full justify-center mb-1"
                      />
                      <div class="flex flex-col ml-5">
                        <players-link
                          v-for="player in winner.team"
                          :key="player.id"
                          :player
                          class="text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </template>
              </u-page-card>

              <loading-base
                v-else
                v-for="_ in 2"
                :key="_"
              />
            </div>

            <reuse-empty-template v-else />
          </template>

          <u-table
            v-else
            ref="table"
            :data="events"
            :columns
            :loading="status === 'pending'"
            sticky
            render-fallback-value="—"
            @select="handleSelect"
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
          <div
            v-if="!mdAndDown"
            class="font-semibold text-muted text-center w-full"
          >
            {{ events.length }} event{{ events.length === 1 ? "" : "s" }}
          </div>
        </div>
      </u-page-body>
    </u-page>
  </u-container>
</template>
