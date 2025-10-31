<script setup lang="ts">
import type { BreadcrumbItem } from "@nuxt/ui"

const { edition } = defineProps<{
  edition: EditionInterface
  events: EventInterface[]
  status: APIStatusType
  refresh?: () => void
}>()

const {
  params: { id, name, year, edId }
} = useRoute("edition")
const {
  ui: { icons }
} = useAppConfig()
const breakpoints = useBreakpoints(breakpointsTailwind, { ssrWidth: useSSRWidth() })
const mdAndDown = breakpoints.smallerOrEqual("md")

const breadcrumbs: BreadcrumbItem[] = [
  { icon: ICONS.home, to: { name: "home" } },
  { label: "Tournaments", to: { name: "tournaments" }, icon: ICONS.tournament },
  { label: edition.tournament.name, to: { name: "tournament", params: { id, name } } }
]
</script>

<template>
  <u-container>
    <u-page>
      <template #left>
        <u-page-aside>
          <dev-only>
            <editions-update
              :edition
              :refresh
            />
            <events-update />
          </dev-only>
          <u-badge
            color="success"
            :label="`Updated: ${useDateFormat(edition.updated_at, 'DD MMMM YYYY').value}`"
            class="w-full justify-center"
          />
        </u-page-aside>
      </template>

      <template #right>
        <u-page-aside>
          <div class="font-semibold text-muted">{{ events.length }} event{{ events.length === 1 ? "" : "s" }}</div>
        </u-page-aside>
      </template>

      <u-page-header :title="year">
        <template #headline>
          <u-breadcrumb :items="breadcrumbs" />
        </template>

        <template #description>
          <div class="flex items-center gap-2">
            <u-badge
              v-for="tour in edition.tours"
              :key="tour"
              :label="TourEnum[tour]"
              :color="tour"
            />
          </div>
        </template>

        <template
          #links
          v-if="edition.wiki_link"
        >
          <div class="flex items-center gap-2">
            <u-button
              v-if="edition.wiki_link"
              :href="edition.wiki_link"
              :icon="ICONS.wikipedia"
              target="_blank"
            />
            <dev-only>
              <u-slideover
                v-if="mdAndDown"
                title="Filters"
                class="ml-auto"
              >
                <u-button :icon="ICONS.filter" />
                <template #body>
                  <editions-update
                    :edition
                    :refresh
                  />
                  <events-update />
                </template>
              </u-slideover>
            </dev-only>
          </div>
        </template>
      </u-page-header>

      <u-page-body>
        <editions-overview :edition />

        <u-page-grid v-if="events.length || status === 'pending'">
          <u-page-card
            v-if="events.length"
            v-for="event in events"
            :key="event.id"
            highlight
            :highlight-color="event.tour"
            :to="{ name: 'event', params: { id, name, year, edId, tour: event.tour } }"
            :ui="{ root: 'h-full', body: 'w-full' }"
          >
            <template #title>
              <div class="flex items-center gap-2">
                <u-badge
                  :label="TourEnum[event.tour]"
                  :color="event.tour"
                />
                <u-badge
                  :label="event.level"
                  :color="event.level"
                />
              </div>
            </template>

            <template #description>
              <div class="flex flex-col gap-1.5 *:*:last:font-semibold *:*:last:ml-3 text-sm my-2">
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
                      :country="venue.country"
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

                <div v-if="event.winners.length && event.winners[0]?.team[0]?.country">
                  <div>Winners</div>
                  <div>
                    <div
                      v-for="winner in event.winners"
                      :key="winner.type"
                      class="flex flex-col my-2"
                    >
                      <u-badge
                        :label="winner.type"
                        :color="winner.type"
                        class="w-full justify-center"
                      />
                      <div class="flex flex-col ml-5">
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
          title="No events found"
          :icon="ICONS.noEvent"
          description="If you think this is an error, refresh the page. Otherwise, please be patient as we continue to add more data."
        >
          <template #actions>
            <u-button
              label="Refresh"
              :icon="icons.reload"
              @click="reloadNuxtApp()"
            />
            <dev-only>
              <events-update />
            </dev-only>
          </template>
        </u-empty>
      </u-page-body>
    </u-page>
  </u-container>
</template>
