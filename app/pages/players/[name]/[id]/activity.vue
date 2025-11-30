<script setup lang="ts">
import { PlayersLink, UButton, UIcon, ULink } from "#components"
import { CalendarDate } from "@internationalized/date"
import type { TableColumn, TableRow } from "@nuxt/ui"

definePageMeta({ name: "activity" })
const {
  params: { id, name }
} = useRoute("activity")
const {
  ui: { icons }
} = useAppConfig()
const [defineEmptyTemplate, reuseEmptyTemplate] = createReusableTemplate()
const breakpoints = useBreakpoints(breakpointsTailwind, { ssrWidth: useSSRWidth() })
const mdAndDown = breakpoints.smallerOrEqual("md")
const viewMode = ref(true)

const { data: playerOverview } = await useFetch("/api/players/overview", {
  query: { id }
})

const year = useRouteQuery("year", playerOverview.value?.years?.slice(-1)[0] || new Date().getFullYear(), { transform: Number })
const tournaments = ref([])
const categories = ref([])
const levels = ref([])
const matchType = ref("Singles")
const dateRange = ref<{ start: CalendarDate | undefined; end: CalendarDate | undefined }>({
  start: undefined,
  end: undefined
})
const surfaces = ref([])

const resetFilters = () => {
  tournaments.value = []
  categories.value = []
  levels.value = []
  matchType.value = "Singles"
  dateRange.value = { start: undefined, end: undefined }
  surfaces.value = []
  year.value = playerOverview.value?.years?.slice(-1)[0] || new Date().getFullYear()
}

const { data, status } = await useFetch("/api/players/activity", {
  method: "POST",
  body: {
    id,
    year,
    tournaments,
    categories,
    levels,
    matchType,
    dateRange,
    surfaces
  },
  default: () => ({
    stats: { singles_wins: 0, singles_losses: 0, doubles_wins: 0, doubles_losses: 0, singles_titles: 0, doubles_titles: 0 },
    events: []
  })
})

const consolidatedEvents = computed(() => {
  const uniqueEvents = useArrayUnique(data.value.events.map(e => e.id)).value

  return uniqueEvents.map(eventId => {
    const matchingEvents = data.value.events.filter(e => e.id === eventId)

    return {
      ...matchingEvents[0],
      match: matchingEvents.flatMap(e => e.match)
    } as ConsolidatedActivityType
  })
})

const columns = computed<TableColumn<ActivityType>[]>(
  () =>
    [
      {
        accessorKey: "year",
        header: "Year",
        cell: ({ row }: { row: { original: ActivityType } }) =>
          h(
            ULink,
            {
              class: "hover-link default-link",
              to: {
                name: "event",
                params: {
                  id: row.original.tournament.id,
                  name: kebabCase(row.original.tournament.name),
                  year: row.original.year,
                  edId: row.original.id,
                  tour: row.original.tour
                }
              }
            },
            () => row.original.year
          ),
        meta: { class: { tr: "bg-elevated" } }
      },
      { accessorKey: "level", header: "Level" },
      {
        accessorKey: "tournament.name",
        header: "Tournament",
        cell: ({ row }: { row: { original: ActivityType } }) =>
          h(
            ULink,
            {
              class: "hover-link default-link",
              to: { name: "tournament", params: { id: row.original.tournament.id, name: kebabCase(row.original.tournament.name) } }
            },
            () => row.original.tournament.name
          )
      },
      { accessorKey: "category", header: "Category" },
      { accessorKey: "match.round", header: "Round" },
      matchType.value === "Doubles" && {
        accessorKey: "partner",
        header: "Partner",
        cell: ({ row }: { row: { original: ActivityType } }) => {
          if (row.original.partner) {
            return h(PlayersLink, { player: row.original.partner })
          }
        }
      },
      {
        id: "opponent",
        header: "Opponent",
        cell: ({ row }: { row: { original: ActivityType } }) => {
          if (row.original.match.opponent?.team.length) {
            return h(
              "div",
              { class: "flex flex-col" },
              row.original.match.opponent.team.map(p => h(PlayersLink, { player: p }))
            )
          }
        }
      },
      {
        id: "rank",
        header: "Rank",
        cell: ({ row }: { row: { original: ActivityType } }) => {
          if (row.original.match.opponent?.team.length) {
            return h(
              "div",
              { class: "flex flex-col" },
              row.original.match.opponent.team.map(p => p.rank?.toLocaleString() ?? "—")
            )
          }
        }
      },
      {
        accessorKey: "match.winning_team",
        header: "",
        cell: ({ row }: { row: { original: ActivityType } }) =>
          h(UIcon, {
            name: row.original.match.winning_team === "t1" ? icons.success : icons.error,
            class: (row.original.match.winning_team === "t1" ? "text-success" : "text-error") + " text-lg"
          })
      },
      { id: "score" },
      {
        id: "h2h",
        cell: ({ row }: { row: { original: ActivityType } }) => {
          if (row.original.match.opponent?.team.length) {
            const p1Name = row.original.partner
              ? `${name}+${kebabCase(`${row.original.partner.first_name} ${row.original.partner.last_name}`)}`
              : name
            const p1Id = row.original.partner ? `${id}+${row.original.partner.id}` : id

            return h(UButton, {
              to: {
                name: "head-to-head",
                params: {
                  p1Name,
                  p1Id,
                  p2Name: row.original.match.opponent.team.map(p => kebabCase(`${p.first_name} ${p.last_name}`)).join("+"),
                  p2Id: row.original.match.opponent.team.map(p => p.id).join("+")
                }
              },
              label: "H2H",
              icon: ICONS.h2h
            })
          }
        }
      }
    ].filter(Boolean) as TableColumn<ActivityType>[]
)
</script>

<template>
  <players-wrapper>
    <template #page-left>
      <u-button
        label="Reset Filters"
        :icon="ICONS.noFilter"
        @click="resetFilters"
        block
      />

      <form-search
        type="Tournament"
        v-model="tournaments"
        :icon="ICONS.tournament"
        multiple
      />

      <form-input-menu
        v-model="year"
        placeholder="Filter by year"
        :items="playerOverview?.years || []"
        :icon="ICONS.event"
      />

      <u-radio-group
        legend="S/D"
        v-model="matchType"
        :items="['Singles', 'Doubles']"
        :ui="{ item: 'ml-3' }"
      />

      <u-checkbox-group
        legend="Level"
        v-model="levels"
        :items="LEVEL_OPTIONS"
        :ui="{ item: 'ml-3' }"
      />

      <form-input-tags
        v-model="categories"
        placeholder="Filter by categories"
        :icon="ICONS.categories"
      />

      <!--@vue-expect-error-->
      <form-dates-picker
        v-model="dateRange"
        placeholder="Filter by date range"
      />

      <u-checkbox-group
        legend="Surfaces"
        v-model="surfaces"
        :items="SURFACE_OPTIONS"
        :ui="{ item: 'ml-3' }"
      />
    </template>

    <template #header-links>
      <u-tooltip :text="viewMode ? 'Cards' : 'Table'">
        <div>
          <u-switch
            v-model="viewMode"
            :checked-icon="ICONS.cards"
            :unchecked-icon="ICONS.table"
          />
        </div>
      </u-tooltip>

      <!--Filters for smaller screens-->
      <u-slideover
        v-if="mdAndDown"
        title="Filters"
        class="ml-auto"
      >
        <u-button :icon="ICONS.filter" />

        <template #body>
          <u-button
            label="Reset Filters"
            :icon="ICONS.noFilter"
            @click="resetFilters"
            block
          />

          <form-search
            type="Tournament"
            v-model="tournaments"
            :icon="ICONS.tournament"
            multiple
          />

          <form-input-menu
            v-model="year"
            placeholder="Filter by year"
            :items="playerOverview?.years || []"
            :icon="ICONS.event"
          />

          <u-radio-group
            legend="S/D"
            v-model="matchType"
            :items="['Singles', 'Doubles']"
            :ui="{ item: 'ml-3' }"
          />

          <u-checkbox-group
            legend="Level"
            v-model="levels"
            :items="LEVEL_OPTIONS"
            :ui="{ item: 'ml-3' }"
          />

          <form-input-tags
            v-model="categories"
            placeholder="Filter by categories"
            :icon="ICONS.categories"
          />

          <!--@vue-expect-error-->
          <form-dates-picker
            v-model="dateRange"
            placeholder="Filter by date range"
          />

          <u-checkbox-group
            legend="Surfaces"
            v-model="surfaces"
            :items="SURFACE_OPTIONS"
            :ui="{ item: 'ml-3' }"
          />
        </template>
      </u-slideover>
    </template>

    <template #default="{ firstName, lastName }">
      <define-empty-template>
        <empty :message="`${firstName} ${lastName} played no ${matchType} matches in this year`" />
      </define-empty-template>

      <u-container class="my-5 flex items-center justify-stretch gap-5">
        <u-container class="ring-2 ring-Singles p-5 rounded-lg text-center">
          <div class="font-semibold text-muted">Singles</div>
          <div class="text-sm">
            <div> {{ data.stats.singles_wins }}-{{ data.stats.singles_losses }} </div>
            <div> Titles: {{ data.stats.singles_titles }} </div>
          </div>
        </u-container>

        <u-container class="ring-2 ring-Doubles p-5 rounded-lg text-center">
          <div class="font-semibold text-muted">Doubles</div>
          <div class="text-sm">
            <div> {{ data.stats.doubles_wins }}-{{ data.stats.doubles_losses }} </div>
            <div> Titles: {{ data.stats.doubles_titles }} </div>
          </div>
        </u-container>
      </u-container>

      <template v-if="viewMode">
        <u-page-list
          v-if="data.events.length || status === 'pending'"
          class="*:my-3"
        >
          <players-activity-card
            v-if="data.events.length"
            v-for="event in consolidatedEvents"
            :key="event.id"
            :event
          />

          <loading-base
            v-else
            v-for="_ in 6"
            :key="_"
          />
        </u-page-list>

        <reuse-empty-template v-else />
      </template>

      <u-table
        v-else
        :data="data.events"
        :columns
        :loading="status === 'pending'"
        sticky
        class="max-h-150"
        :meta="{
          class: {
            tr: (row: TableRow<ActivityType>) => row.original.match.draw === 'Main' ? '' : 'bg-elevated'
          }
        }"
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

        <template #score-cell="{ row }">
          <u-button
            color="neutral"
            variant="link"
            :disabled="!row.original.match.stats"
            size="md"
            class="disabled:cursor-default"
            :to="{
            name: 'match',
            params: {
              id: row.original.tournament.id,
              name: kebabCase(row.original.tournament.name),
              year: row.original.year,
              edId: row.original.id,
              tour: row.original.tour,
              mid: constructMid(row.original.match.draw!, row.original.type, row.original.match.match_no)
            }
          }"
          >
            <div
              class="flex justify-center items-center"
              :class="row.original.match.stats ? 'hover-link default-link' : ''"
            >
              <div
                v-if="row.original.match.sets?.[0]?.length"
                class="flex items-center gap-1 mr-2"
              >
                <span
                  v-for="(set, index) in row.original.match.sets[0]"
                  :key="index"
                >
                  {{ set[0] }}{{ row.original.match.sets[1]![index]![0]
                  }}<sup v-if="isDefined(set[1]) && isDefined(row.original.match.sets[1]![index]![1])">{{
                    set[1] < row.original.match.sets[1]![index]![1] ? set[1] : row.original.match.sets[1]![index]![1]
                  }}</sup>
                </span>
              </div>
              <u-badge
                v-if="row.original.match.incomplete"
                :label="`${row.original.match.incomplete}.`"
                color="error"
              />
            </div>
          </u-button>
        </template>
      </u-table>
    </template>
  </players-wrapper>
</template>
