<script setup lang="ts">
import {
  ColouredBadge,
  CountryLink,
  MatchScoreItem,
  PlayerLink,
  TableCellGroup,
  TableHeaderFilter,
  TableHeaderGroup,
  TableHeaderName,
  TableHeaderSort,
  UButton,
  UIcon,
  ULink
} from "#components"
import type { TableColumn, TableRow } from "@nuxt/ui"
import {
  type Column,
  getFacetedRowModel,
  getFacetedMinMaxValues,
  getFacetedUniqueValues,
  getGroupedRowModel,
  type GroupingOptions
} from "@tanstack/vue-table"

definePageMeta({ name: "activity" })
const {
  params: { id, name }
} = useRoute("activity")
const {
  ui: { icons }
} = useAppConfig()
const playerName = useState<string>("player-name")
const playerYears = useState<number[]>("player-years")
const year = useRouteQuery<number>("year", playerYears.value?.length ? playerYears.value[playerYears.value.length - 1] : new Date().getFullYear())

// API call
const { data: yearActivity, status } = await useFetch<ActivityType>(() => `/api/players/activity`, {
  key: `player-activity-${year}`,
  query: { id, year },
  default: () => ({ stats: [], activity: [] }),
  server: false
})

const columns: TableColumn<ActivityInterface>[] = [
  {
    id: "tournament",
    accessorKey: "tournament.name",
    filterFn: (row, columnId, filterValue) => filterIncludesString(row, columnId, filterValue),
    header: ({ column }) => h(TableHeaderGroup, { column: column as Column<unknown>, label: "Tournament" }),
    cell: ({ row }) =>
      h(TableCellGroup, { row: row as TableRow<unknown>, grouping: get(grouping), groupingColumnId: "tournament" }, () =>
        h(
          ULink,
          {
            to: { name: "tournament", params: { id: row.original.tournament.id, name: kebabCase(row.original.tournament.name) } },
            class: "hover-link default-link w-fit mx-auto"
          },
          () => row.getValue("tournament")
        )
      )
  },
  {
    accessorKey: "level",
    filterFn: (row, columnId, filterValue) => filterIncludesString(row, columnId, filterValue),
    header: ({ column }) => h(TableHeaderGroup, { column: column as Column<unknown>, label: "Level" }),
    cell: ({ row }) =>
      h(TableCellGroup, { row: row as TableRow<unknown>, grouping: get(grouping), groupingColumnId: "level" }, () =>
        h(ColouredBadge, { class: "mx-auto", label: row.getValue("level") as string })
      )
  },
  {
    accessorKey: "category",
    filterFn: (row, columnId, filterValue) => filterIncludesString(row, columnId, filterValue),
    sortUndefined: "last",
    header: ({ column }) => h(TableHeaderGroup, { column: column as Column<unknown>, label: "Category" }),
    cell: ({ row }) =>
      h(TableCellGroup, { row: row as TableRow<unknown>, grouping: get(grouping), groupingColumnId: "category" }, () => row.original.category)
  },
  {
    id: "dates",
    accessorFn: row => getDate(row.start_date),
    header: ({ column }) => h(TableHeaderSort, { column: column as Column<unknown>, label: "Dates", type: "number" }),
    cell: ({ row }) => {
      if (!row.getIsGrouped() || grouping.value.length === 0) {
        return dateTimeFormat.formatRange(getDate(row.original.start_date), getDate(row.original.end_date))
      }
    }
  },
  {
    id: "surface",
    accessorKey: "surface.id",
    filterFn: (row, columnId, filterValue) => filterIncludesString(row, columnId, filterValue),
    sortUndefined: "last",
    header: ({ column }) => h(TableHeaderGroup, { column: column as Column<unknown>, label: "Surface" }),
    cell: ({ row }) =>
      h(TableCellGroup, { row: row as TableRow<unknown>, grouping: get(grouping), groupingColumnId: "surface" }, () => row.original.surface.id)
  },
  {
    id: "country",
    accessorFn: row => row.venues[0]?.country.name,
    filterFn: (row, columnId, filterValue) => filterIncludesString(row, columnId, filterValue),
    header: ({ column }) => h(TableHeaderGroup, { column: column as Column<unknown>, label: "Country" }),
    cell: ({ row }) =>
      h(TableCellGroup, { row: row as TableRow<unknown>, grouping: get(grouping), groupingColumnId: "country" }, () =>
        row.original.venues[0] ? h(CountryLink, { country: row.original.venues[0].country, iconOnly: true, class: "mx-auto" }) : undefined
      )
  },
  {
    accessorKey: "type",
    filterFn: (row, columnId, filterValue) => filterIncludesString(row, columnId, filterValue),
    header: ({ column }) => h(TableHeaderGroup, { column: column as Column<unknown>, label: "S/D" }),
    cell: ({ row }) =>
      h(TableCellGroup, { row: row as TableRow<unknown>, grouping: get(grouping), groupingColumnId: "type" }, () =>
        h(ColouredBadge, { class: "mx-auto", label: row.getValue("type") as string })
      )
  },
  {
    id: "draw",
    accessorKey: "match.draw",
    filterFn: (row, columnId, filterValue) => filterIncludesString(row, columnId, filterValue),
    header: ({ column }) => h(TableHeaderGroup, { column: column as Column<unknown>, label: "Draw" }),
    cell: ({ row }) =>
      h(TableCellGroup, { row: row as TableRow<unknown>, grouping: get(grouping), groupingColumnId: "draw" }, () =>
        h(ColouredBadge, { class: "mx-auto", label: row.getValue("draw") as string })
      )
  },
  {
    id: "round",
    accessorKey: "match.round",
    filterFn: (row, columnId, filterValue) => filterIncludesString(row, columnId, filterValue),
    header: ({ column }) => h(TableHeaderGroup, { column: column as Column<unknown>, label: "Round" }),
    cell: ({ row }) =>
      h(TableCellGroup, { row: row as TableRow<unknown>, grouping: get(grouping), groupingColumnId: "round" }, () => row.original.match.round)
  },
  {
    accessorKey: "player.rank",
    header: "Player Rank",
    aggregationFn: "min"
  },
  {
    id: "player_seed",
    accessorFn: row => (row.match.draw === "Main" ? row.player.seed : row.player.q_seed),
    header: "Player Seed",
    cell: ({ row, cell }) => {
      if (!row.getIsGrouped() || grouping.value.length === 0) {
        return cell.getValue()
      }
    }
  },
  {
    id: "player_status",
    accessorFn: row => (row.match.draw === "Main" ? row.player.status : row.player.q_status),
    header: "Player Status"
  },
  {
    accessorKey: "player.points",
    header: "Points",
    aggregationFn: "max"
  },
  {
    accessorKey: "player.pm",
    header: "Prize Money",
    cell: ({ row, cell }) => {
      if (!row.getIsGrouped() || grouping.value.length === 0) {
        return row.original.player.pm
          ? row.original.player.pm.toLocaleString("en-GB", { style: "currency", currency: row.original.currency })
          : undefined
      } else {
        return cell.getValue()
          ? (cell.getValue() as number).toLocaleString("en-GB", { style: "currency", currency: row.original.currency })
          : undefined
      }
    }
  },
  {
    id: "partner",
    accessorFn: row => (row.partner ? `${row.partner.last_name}, ${row.partner.first_name}` : undefined),
    sortUndefined: "last",
    filterFn: (row, columnId, filterValue) => filterIncludesString(row, columnId, filterValue),
    header: ({ column }) => h(TableHeaderFilter, { column: column as Column<unknown>, label: "Partner", type: "alpha" }),
    cell: ({ row }) => {
      if ((!row.getIsGrouped() || grouping.value.length === 0) && row.original.partner) {
        return h(
          "div",
          {
            class: "flex items-center gap-1"
          },
          [
            h(PlayerLink, {
              player: row.original.partner
            }),
            h("span", {}, `[${row.original.partner.rank}]`)
          ]
        )
      }
    }
  },
  {
    id: "opponents",
    accessorFn: row => row.match.opponents.map(opponent => `${opponent.last_name}, ${opponent.first_name}`),
    filterFn: (row, columnId, filterValue) => filterIncludesName(row, columnId, filterValue),
    header: ({ column }) => h(TableHeaderName, { column: column as Column<unknown>, label: "Opponents" }),
    cell: ({ row }) => {
      if (!row.getIsGrouped() || grouping.value.length === 0) {
        return h(
          "div",
          {
            class: "flex flex-col items-center"
          },
          row.original.match.opponents.map(opponent =>
            h(PlayerLink, {
              player: opponent
            })
          )
        )
      }
    }
  },
  {
    id: "op_rank",
    accessorFn: row => row.match.opponents.map(opponent => opponent.rank),
    header: "Opponent Rank",
    cell: ({ row }) => {
      if (!row.getIsGrouped() || grouping.value.length === 0) {
        return h(
          "div",
          {
            class: "flex flex-col items-center"
          },
          row.original.match.opponents.map(opponent => h("span", {}, opponent.rank))
        )
      }
    }
  },
  {
    id: "winner",
    accessorKey: "match.winner_id",
    header: "",
    cell: ({ row }) => {
      if (!row.getIsGrouped() || grouping.value.length === 0) {
        if (
          row.original.match.opponents.map(opponent => opponent.id).includes(row.original.match.winner_id) ||
          row.original.match.incomplete === "B"
        ) {
          return h(UIcon, {
            name: icons.success,
            class: "text-success size-4"
          })
        } else {
          return h(UIcon, {
            name: icons.error,
            class: "text-error size-4"
          })
        }
      }
    }
  },
  {
    id: "score",
    header: "Score",
    cell: ({ row }) => {
      if (!row.getIsGrouped() || grouping.value.length === 0) {
        if (row.original.match.incomplete === "B") {
          return "BYE"
        } else {
          return h(MatchScoreItem, {
            draw: row.original.match.draw,
            tour: row.original.match.tour,
            type: row.original.type,
            match_no: row.original.match.match_no,
            sets: row.original.match.sets,
            tournament: row.original.tournament,
            year: year.value,
            incomplete: row.original.match.incomplete,
            stats: row.original.match.stats,
            centred: true,
            id: row.original.id
          })
        }
      }
    }
  },
  {
    id: "h2h",
    header: "",
    cell: ({ row }) => {
      if ((!row.getIsGrouped() || grouping.value.length === 0) && row.original.match.incomplete !== "B") {
        return h(UButton, {
          icon: ICONS.h2h,
          size: "xs",
          to: {
            name: "head-to-head",
            params: {
              p1Id: row.original.partner ? `${id}+${row.original.partner.id}` : id,
              p2Id: row.original.match.opponents.map(opponent => opponent.id).join("+"),
              p1Name: row.original.partner ? `${name}+${kebabCase(`${row.original.partner.first_name} ${row.original.partner.last_name}`)}` : name,
              p2Name: row.original.match.opponents.map(opponent => kebabCase(`${opponent.first_name} ${opponent.last_name}`)).join("+")
            }
          },
          label: "H2H"
        })
      }
    }
  }
]

const sorting = ref([{ id: "dates", desc: true }])
const grouping = ref<string[]>([])
const grouping_options = ref<GroupingOptions>({
  getGroupedRowModel: getGroupedRowModel()
})

const table = useTemplateRef("table")
</script>

<template>
  <player-wrapper>
    <template #toolbar>
      <filter-select-years
        v-if="playerYears.length"
        :items="playerYears"
        v-model="year"
      />

      <u-button
        label="Reset Sorting"
        :icon="ICONS.sortAlpha"
        @click="table?.tableApi.resetSorting()"
        size="sm"
      />
      <u-button
        label="Reset Grouping"
        :icon="ICONS.ungroup"
        @click="table?.tableApi.resetGrouping()"
        size="sm"
      />
      <u-button
        label="Reset Filters"
        :icon="ICONS.noFilter"
        @click="table?.tableApi.resetColumnFilters()"
        size="sm"
      />
      <table-visibility
        v-if="table"
        :table="table!"
      />
    </template>

    <div
      v-if="yearActivity.stats.length"
      class="flex items-center justify-around w-full"
    >
      <u-card
        v-if="yearActivity.stats.length"
        v-for="stat in yearActivity.stats"
        :key="stat.category"
        class="ring-primary"
        :ui="{ root: 'min-w-1/8', header: 'font-semibold text-muted p-1', body: 'text-center', footer: 'text-sm text-muted p-1' }"
      >
        <template #header>
          {{ stat.category }}
        </template>

        <div class="text-sm text-accented">
          {{ stat.value }}
        </div>

        <template #footer>
          {{ stat.type }}
        </template>
      </u-card>
    </div>

    <client-only>
      <u-table
        ref="table"
        :data="yearActivity.activity"
        :columns
        :loading="['idle', 'pending'].includes(status)"
        sticky
        :faceted-options="{
          getFacetedRowModel: getFacetedRowModel(),
          getFacetedMinMaxValues: getFacetedMinMaxValues(),
          getFacetedUniqueValues: getFacetedUniqueValues()
        }"
        :grouping="grouping"
        v-on:update:grouping="grouping = $event"
        :grouping-options="grouping_options"
        v-model:sorting="sorting"
        :ui="{ td: 'empty:p-0' }"
      >
        <template #loading>
          <table-loading-icon />
        </template>
        <template #empty>
          <table-empty-message
            :icon="ICONS.noCalendar"
            :message="`${playerName} had no activity in ${year}`"
          />
        </template>
      </u-table>
    </client-only>
  </player-wrapper>
</template>
