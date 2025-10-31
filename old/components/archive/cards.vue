<script setup lang="ts">
import { EventCard, EventCardSmall } from "#components"

const { status, count, events } = defineProps<{
  events: EventInterface[]
  resetFilters: () => void
  count: number
  status: APIStatusType
}>()
const breakpoints = useBreakpoints(breakpointsTailwind, { ssrWidth: useSSRWidth() })
const mdAndDown = breakpoints.smallerOrEqual("md")
const smAndDown = breakpoints.smallerOrEqual("sm")

const skip = defineModel<number>("skip")
const filters = defineModel<EventFiltersType>("filters")

const grid = useTemplateRef<HTMLDivElement>("grid")

onMounted(() => {
  if (!grid.value) return
  useInfiniteScroll(
    grid.value,
    () => {
      set(skip, get(skip)! + 40)
    },
    {
      distance: 20,
      canLoadMore: () => {
        return get(status) !== "pending" && count > events.length
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
          <div class="font-semibold">{{ count }} event{{ count === 1 ? "" : "s" }}</div>

          <u-button
            label="Reset Filters"
            :icon="ICONS.noFilter"
            @click="resetFilters"
            block
            size="xs"
            class="my-5"
          />

          <dev-only>
            <div class="*:my-2">
              <event-create block />
              <person-create block />
              <venue-create block />
            </div>
          </dev-only>

          <div
            v-if="filters"
            class="flex flex-col gap-3 my-1"
          >
            <form-select-menu
              placeholder="Select year"
              v-model="filters.year"
              :items="ALL_YEARS"
              :icon="ICONS.event"
              block
            />

            <u-checkbox-group
              legend="Levels"
              v-model="filters.levels"
              :items="['Tour', 'Challenger', 'ITF']"
              :ui="{ item: 'ml-3' }"
            />

            <u-checkbox-group
              legend="Tours"
              v-model="filters.tours"
              :items="Object.entries(TourEnum).map(tour => ({ label: tour[1], value: tour[0] }))"
              :ui="{ item: 'ml-3' }"
            />

            <form-select-menu
              placeholder="Select categories"
              v-model="filters.categories"
              :items="useArrayUnique(ALL_CATEGORIES).value"
              block
              :icon="ICONS.categories"
            />

            <form-dates-picker
              v-model="filters.dateRange"
              placeholder="Select dates"
              block
            />

            <u-radio-group
              legend="Environment"
              v-model="filters.environment"
              :items="['Indoor', 'Outdoor']"
              :ui="{ item: 'ml-3' }"
              size="md"
            />

            <u-checkbox-group
              legend="Surface"
              v-model="filters.surfaces"
              :items="['Hard', 'Clay', 'Grass', 'Carpet']"
              :ui="{ item: 'ml-3' }"
            />

            <form-select-search
              v-model="filters.venues"
              placeholder="Select venues"
              type="venues"
              :icon="ICONS.venue"
              block
            />

            <form-select-search
              v-model="filters.countries"
              placeholder="Select countries"
              type="countries"
              :icon="ICONS.countries"
              block
            />

            <form-select-search
              v-model="filters.supervisors"
              placeholder="Select supervisors"
              type="supervisors"
              :icon="ICONS.supervisor"
              block
            />

            <form-select-search
              v-model="filters.umpires"
              placeholder="Select umpires"
              type="umpires"
              :icon="ICONS.umpire"
              block
            />
          </div>
        </u-page-aside>
      </template>

      <template #right>
        <u-page-aside>
          <form-command-palette-search
            v-if="filters"
            type="Tournaments"
            v-model:model-value="filters.tournaments"
          />
        </u-page-aside>
      </template>

      <u-page-header title="Results Archive">
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
              <div class="font-semibold">{{ count }} event{{ count === 1 ? "" : "s" }}</div>

              <u-button
                label="Reset Filters"
                :icon="ICONS.noFilter"
                @click="resetFilters"
                block
                size="xs"
                class="my-5"
              />

              <div
                v-if="filters"
                class="flex flex-col gap-5"
              >
                <!-- <u-checkbox-group
                  legend="Tours"
                  v-model="filters.tours"
                  :items="Object.entries(TourEnum).map(tour => ({ label: tour[1], value: tour[0] }))"
                  :ui="{ item: 'ml-3' }"
                />

                <u-form-field label="Established">
                  <form-input
                    v-if="filters"
                    v-model="filters.established"
                    type="number"
                    placeholder="Year established"
                    block
                  />
                </u-form-field>

                <u-form-field label="Abolished">
                  <form-input
                    v-if="filters"
                    v-model="filters.abolished"
                    type="number"
                    placeholder="Year abolished"
                    block
                  />
                </u-form-field>

                <form-select-search
                  v-if="filters"
                  v-model="filters.tournaments"
                  placeholder="Select tournaments"
                  type="tournaments"
                  :icon="ICONS.tournament"
                  block
                /> -->
              </div>
            </template>
          </u-slideover>
        </template>
      </u-page-header>

      <u-page-body>
        <u-page-list
          v-if="events.length || status === 'pending'"
          ref="grid"
          class="*:my-3"
        >
          <div
            v-if="events.length"
            v-for="event in events"
            :key="event.id"
            :id="event.id.toString()"
          >
            <component
              :is="smAndDown ? EventCardSmall : EventCard"
              :event
            />
          </div>

          <loading-event
            v-if="status === 'pending'"
            v-for="_ in 6"
            :key="_"
          />
        </u-page-list>

        <empty-cards
          v-else
          :icon="ICONS.noEvent"
          message="No events found"
        />
      </u-page-body>
    </u-page>
  </u-container>
</template>
