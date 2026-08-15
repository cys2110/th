<script setup lang="ts">
import type { TableColumn, TableRow } from "@nuxt/ui"
import { getFacetedRowModel, getFacetedUniqueValues } from "@tanstack/vue-table"
import { CountryLink, LazyEditionCreate, PlayerLink, UBadge, UButton, UFieldGroup, UIcon } from "#components"

type Winner = LaverWinnerInterface | CountryWinnerInterface | EditionWinnerInterface

const props = defineProps<{
  events: Array<Winner>
  pending: boolean
}>()

const emits = defineEmits<{ refresh: [] }>()

const route = useRoute("tournament")

const {
  ui: { icons }
} = useAppConfig()

const router = useRouter()

const { isAdmin } = useAuthState()
const tournamentStore = useTournamentStore()

const currentYear = new Date().getFullYear()

const isLaverWinner = (item: Winner): item is LaverWinnerInterface => "team_name" in item

const isCountryWinner = (item: Winner): item is CountryWinnerInterface => "country" in item

const isEliminationWinner = (item: Winner): item is EditionWinnerInterface => "tour" in item

const uniqueYears = computed(() => useArrayUnique(props.events.map(ed => ed.year)).value.sort())

const getEditionNumber = (event: Winner) => {
  const tournamentAndYear = `${route.params.id}${event.year}`
  const edId = event.id.toString()

  const slug = edId.replace(tournamentAndYear, "")

  if (slug) {
    return slug
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
    footer: () => {
      if (isAdmin.value) {
        return h(UFieldGroup, { class: "w-fit" }, () => [
          h(UButton, { icon: icons.reload, onClick: () => emits("refresh") }),
          h(LazyEditionCreate, { hydrateOnIdle: true })
        ])
      }
    }
  },
  {
    accessorKey: "tour",
    cell: ({ row }) => {
      if (isEliminationWinner(row.original)) {
        return h(UBadge, {
          label: row.original.tour,
          color: row.original.tour
        })
      }
    }
  },
  {
    accessorKey: "match_type",
    cell: ({ row }) => {
      if (isEliminationWinner(row.original)) {
        return h(UBadge, {
          label: row.original.match_type,
          color: row.original.match_type
        })
      }
    }
  },
  {
    id: "team",
    accessorFn: row => isEliminationWinner(row) && row.team.map(player => `${player.last_name}, ${player.first_name}`),
    filterFn: arrayFilter,
    footer: ({ table }) => {
      const rowCount = table.getFilteredRowModel().rows.length

      return `${rowCount.toLocaleString()} edition${rowCount === 1 ? "" : "s"}`
    }
  },
  {
    accessorKey: "country.name",
    footer: ({ table }) => {
      const rowCount = table.getFilteredRowModel().rows.length

      return `${rowCount.toLocaleString()} edition${rowCount === 1 ? "" : "s"}`
    }
  },
  {
    accessorKey: "team_name",
    footer: ({ table }) => {
      const rowCount = table.getFilteredRowModel().rows.length

      return `${rowCount.toLocaleString()} edition${rowCount === 1 ? "" : "s"}`
    }
  }
]

const columnVisibility = computed(() => ({
  country_name: props.events.length > 0 && isCountryWinner(props.events[0]!),
  team_name: props.events.length > 0 && isLaverWinner(props.events[0]!),
  team: !props.events.length || isEliminationWinner(props.events[0]!),
  match_type: !props.events.length || isEliminationWinner(props.events[0]!),
  tour: (!props.events.length || isEliminationWinner(props.events[0]!)) && tournamentStore.tours.length > 1
}))

const handleSelectRow = (_e: Event, row: TableRow<Winner>) => {
  router.push({
    name: "edition",
    params: {
      ...route.params,
      year: row.original.year,
      edId: row.original.id
    }
  })
}

const tableClass = computed(() => {
  let className = "mx-auto"

  if (!props.events.length || isEliminationWinner(props.events[0]!)) {
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
    :faceted-options="{
      getFacetedRowModel: getFacetedRowModel(),
      getFacetedUniqueValues: getFacetedUniqueValues()
    }"
    @select="handleSelectRow"
    render-fallback-value="—"
    v-model:column-visibility="columnVisibility"
    :ui="{
      root: tableClass,
      tbody: '[&>tr]:data-[selectable=true]:cursor-pointer [&>tr]:data-[selectable=true]:hover:bg-elevated/50 [&>tr]:even:bg-elevated/25'
    }"
  >
    <template #loading>
      <loading-icon />
    </template>

    <template #empty>
      <empty
        :icon="ICONS.calendarOff"
        :title="`No player has won ${tournamentStore.name}`"
        class="mx-2"
      />
    </template>

    <template #id-header="{ column }">
      <div class="flex justify-center items-center gap-0.5">
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

    <template #id-cell="{ row }">
      <span>{{ row.original.year }}</span>
      <span v-if="getEditionNumber(row.original)"> [{{ getEditionNumber(row.original) }}]</span>
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

    <template #team-cell="{ row }">
      <div v-if="isEliminationWinner(row.original)">
        <player-link
          v-if="row.original.team?.length"
          :players="row.original.team"
        />

        <div
          v-else
          class="font-semibold w-fit mx-auto"
          >{{ row.original.year === currentYear ? "Edition in progress" : "No winner" }}</div
        >
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

    <template #country_name-cell="{ row }">
      <div
        v-if="isCountryWinner(row.original)"
        class="flex justify-center font-semibold"
      >
        <country-link
          v-if="row.original.country"
          :country="row.original.country"
        />

        <div v-else>{{ row.original.year === currentYear ? "Edition in progress" : "No winner" }}</div>
      </div>
    </template>

    <template #team_name-header="{ column }">
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

    <template #team_name-cell="{ row }">
      <div
        v-if="isLaverWinner(row.original)"
        class="flex justify-center items-center gap-2 font-semibold"
      >
        <u-icon
          v-if="row.original.team_name"
          :name="row.original.team_name === 'Europe' ? ICONS.europe : ICONS.globe"
        />

        <span>{{ row.original.team_name || (row.original.year === currentYear ? "Edition in progress" : "No winner") }}</span>
      </div>
    </template>
  </u-table>
</template>
