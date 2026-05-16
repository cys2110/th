<script setup lang="ts">
import type { TableColumn, TableRow } from "@nuxt/ui"
import { getFacetedRowModel, getFacetedUniqueValues, getGroupedRowModel, type Row } from "@tanstack/vue-table"
import { CountryLink, LazyEditionCreate, PlayersLink, TableRowToggle, UBadge, UButton, UFieldGroup, UIcon } from "#components"

type Winner = LaverWinnerInterface | CountryWinnerInterface | EditionWinnerInterface

const props = defineProps<{
  events: Array<Winner>
  pending: boolean
}>()

const emits = defineEmits<{ refresh: [] }>()

const router = useRouter()
const { dev } = useRuntimeConfig().public

const {
  params: { id, name }
} = useRoute("tournament")

const {
  ui: { icons }
} = useAppConfig()

const tournamentStore = useTournamentStore()

const isLaverWinner = (item: Winner): item is LaverWinnerInterface => {
  return "team_name" in item
}

const isCountryWinner = (item: Winner): item is CountryWinnerInterface => {
  return "country" in item
}

const isDefaultWinner = (item: Winner): item is EditionWinnerInterface => {
  return "tour" in item
}

const uniqueYears = computed(() => useArrayUnique(props.events.map(ed => ed.year)).value.sort())

const getEditionNumber = (event: Winner) => {
  const year = event.year.toString()
  const edId = event.id.toString()

  const parts = edId.split(year)

  if (parts.length > 1) {
    return parts[1]
  }
}

const columns: Array<TableColumn<Winner>> = [
  {
    accessorKey: "id",
    filterFn: (row, columnId, filterValue) => {
      if (!filterValue?.length) return true
      if (filterValue.includes(row.original.year)) return true

      return false
    },
    cell: ({ row, table }) => {
      const editionNumber = getEditionNumber(row.original)

      if (row.getIsGrouped()) {
        return h(TableRowToggle, { row: row as Row<unknown> }, () =>
          h("div", {}, [h("span", {}, row.original.year), editionNumber && h("span", {}, ` [${editionNumber}]`)])
        )
      } else if (!table.getState().grouping.includes("id")) {
        return h("div", {}, [h("span", {}, row.original.year), editionNumber && h("span", {}, ` [${editionNumber}]`)])
      }
    },
    footer: ({ table }) => {
      const rowCount = table.getGroupedRowModel().rows.length

      return `${rowCount} edition${rowCount === 1 ? "" : "s"}`
    }
  },
  {
    accessorKey: "tour",
    cell: ({ row, table }) => {
      if (!row.getIsGrouped() || !table.getState().grouping.length) {
        if (isDefaultWinner(row.original)) {
          return h(UBadge, {
            label: row.original.tour,
            color: row.original.tour
          })
        }
      }
    }
  },
  {
    accessorKey: "match_type",
    cell: ({ row, table }) => {
      if (!row.getIsGrouped() || !table.getState().grouping.length) {
        if (isDefaultWinner(row.original)) {
          return h(UBadge, {
            label: row.original.match_type,
            color: row.original.match_type
          })
        }
      }
    }
  },
  {
    id: "team",
    accessorFn: row => isDefaultWinner(row) && row.team.map(player => `${player.last_name}, ${player.first_name}`),
    filterFn: arrayFilter,
    cell: ({ row, table }) => {
      if (!row.getIsGrouped() || !table.getState().grouping.length) {
        if (isDefaultWinner(row.original)) {
          return h(PlayersLink, {
            players: row.original.team
          })
        }
      }
    },
    ...(dev && {
      footer: () =>
        h(UFieldGroup, { class: "w-fit" }, () => [
          h(UButton, { icon: icons.reload, onClick: () => emits("refresh") }),
          h(LazyEditionCreate, { hydrateOnIdle: true })
        ])
    })
  },
  {
    accessorKey: "country.name",
    cell: ({ row }) => {
      if (isCountryWinner(row.original)) {
        return h(CountryLink, {
          country: row.original.country,
          class: "mx-auto"
        })
      }
    },
    ...(dev && {
      footer: () =>
        h(UFieldGroup, { class: "w-fit" }, () => [
          h(UButton, { icon: icons.reload, onClick: () => emits("refresh") }),
          h(LazyEditionCreate, { hydrateOnIdle: true })
        ])
    })
  },
  {
    accessorKey: "laverWinner.team_name",
    cell: ({ cell, row }) => {
      if (isLaverWinner(row.original)) {
        const team = cell.getValue<string>()

        return h(UIcon, {
          name: team === "Europe" ? ICONS.europe : ICONS.world
        })
      }
    },
    ...(dev && {
      footer: () =>
        h(UFieldGroup, { class: "w-fit" }, () => [
          h(UButton, { icon: icons.reload, onClick: () => emits("refresh") }),
          h(LazyEditionCreate, { hydrateOnIdle: true })
        ])
    })
  }
]

const grouping = computed(() => {
  if (props.events[0] && isDefaultWinner(props.events[0])) {
    return ["id"]
  }
  return []
})

const columnVisibility = computed(() => ({
  country_name: props.events.length > 0 && isCountryWinner(props.events[0]!),
  laverWinner_team_name: props.events.length > 0 && isLaverWinner(props.events[0]!),
  team: !props.events.length || isDefaultWinner(props.events[0]!),
  match_type: !props.events.length || isDefaultWinner(props.events[0]!),
  tour: !props.events.length || isDefaultWinner(props.events[0]!)
}))

const handleSelectRow = (_e: Event, row: TableRow<Winner>) => {
  if (row.getIsGrouped()) {
    row.toggleExpanded()
  } else {
    router.push({
      name: "edition",
      params: {
        id,
        name,
        year: row.original.year,
        edId: row.original.id
      }
    })
  }
}

const tableClass = computed(() => {
  let className = "mx-auto"

  if (!props.events.length || isDefaultWinner(props.events[0]!)) {
    className += " max-w-3/4"
  } else {
    className += " max-w-1/2"
  }

  return className
})
</script>

<template>
  <u-table
    ref="table"
    :data="events"
    :columns
    sticky
    :loading="pending"
    :grouping-options="{
      getGroupedRowModel: getGroupedRowModel()
    }"
    :faceted-options="{
      getFacetedRowModel: getFacetedRowModel(),
      getFacetedUniqueValues: getFacetedUniqueValues()
    }"
    @select="handleSelectRow"
    render-fallback-value="—"
    v-model:column-visibility="columnVisibility"
    :grouping
    :meta="{
      class: {
        tr: row => (row.getIsGrouped() ? '' : 'even:bg-elevated/25')
      }
    }"
    :ui="{
      root: tableClass,
      tbody: '[&>tr]:data-[selectable=true]:cursor-pointer [&>tr]:data-[selectable=true]:hover:bg-elevated/50',
      td: 'empty:p-0'
    }"
  >
    <template #loading>
      <u-icon
        :name="icons.loading"
        class="size-8"
      />
    </template>

    <template #empty>
      <u-empty
        :icon="ICONS.calendarOff"
        :title="`No player has won ${tournamentStore.name}`"
        description="If you think this is an error, refresh the page. Otherwise, please be patient as we continue to add more data."
        class="mx-2"
      >
        <template #actions>
          <u-button
            label="Refresh"
            :icon="icons.reload"
            @click="$emit('refresh')"
          />
        </template>
      </u-empty>
    </template>

    <template #id-header="{ column }">
      <div class="flex justify-center items-center gap-0.5">
        <table-group-header :column />
        <u-select-menu
          placeholder="Year"
          variant="none"
          clear
          :items="uniqueYears"
          :icon="ICONS.calendar"
          multiple
          :model-value="<number[]>column.getFilterValue()"
          @update:model-value="column.setFilterValue($event)"
        />
        <table-sort-header :column />
      </div>
    </template>

    <template #tour-header="{ column }">
      <table-filter-header
        :column
        label="Tour"
        :icon="ICONS.tour"
      />
    </template>

    <template #match_type-header="{ column }">
      <table-filter-header
        :column
        label="S/D"
        :icon="ICONS.people"
      />
    </template>

    <template #team-header="{ column }">
      <div class="flex justify-center items-center gap-0.5">
        <table-filter-header
          :column
          label="Winner(s)"
          type="name"
          :icon="ICONS.trophy"
          multiple
        />
        <table-sort-header :column />
      </div>
    </template>

    <template #country_name-header="{ column }">
      <div class="flex justify-center items-center gap-0.5">
        <table-filter-header
          :column
          label="Winner"
          :icon="ICONS.trophy"
          multiple
        />
        <table-sort-header :column />
      </div>
    </template>

    <template #laverWinner_team-header="{ column }">
      <div class="flex justify-center items-center gap-0.5">
        <table-filter-header
          :column
          label="Winner"
          :icon="ICONS.trophy"
          multiple
        />
        <table-sort-header :column />
      </div>
    </template>
  </u-table>
</template>
