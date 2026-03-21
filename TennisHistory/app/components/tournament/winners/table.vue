<script setup lang="ts">
import type { TableColumn, TableRow } from "@nuxt/ui"
import { getFacetedRowModel, getFacetedUniqueValues, getGroupedRowModel } from "@tanstack/vue-table"

const props = defineProps<{
  editions: Array<EditionWinnersInterface>
  pending: boolean
}>()

const router = useRouter()

const {
  ui: { colors }
} = useAppConfig()

const tournamentStore = useTournamentStore()

const columns: Array<TableColumn<EditionWinnersInterface>> = [
  { accessorKey: "year" },
  { accessorKey: "tour" },
  { accessorKey: "match_type" },
  { id: "team", accessorFn: row => row.team?.map(player => `${player.last_name}, ${player.first_name}`).join(" / ") },
  { accessorKey: "country.name" },
  { accessorKey: "laverWinner.team" }
]

const grouping = computed(() => {
  if (COUNTRY_DRAWS.includes(tournamentStore.id) || tournamentStore.id === "9210") {
    return []
  }
  return ["year"]
})

const columnVisibility = computed(() => {
  const visibility: Record<string, boolean> = {}

  if (!COUNTRY_DRAWS.includes(tournamentStore.id)) visibility["country_name"] = false
  if (tournamentStore.id !== "9210") visibility["laverWinner_team"] = false
  if (COUNTRY_DRAWS.includes(tournamentStore.id) || tournamentStore.id === "9210") {
    visibility["team"] = false
    visibility["match_type"] = false
    visibility["tour"] = false
  }

  return visibility
})

const handleSelectRow = (_e: Event, row: TableRow<EditionWinnersInterface>) => {
  if (row.getIsGrouped()) {
    row.toggleExpanded()
  } else {
    router.push({
      name: "edition",
      params: {
        id: tournamentStore.id,
        name: tournamentStore.name,
        year: row.original.year,
        edId: row.original.id
      }
    })
  }
}
</script>

<template>
  <u-table
    ref="table"
    :data="editions"
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
    :ui="{ td: 'empty:p-0' }"
  >
    <template #loading>
      <loading-icon />
    </template>

    <template #empty>
      <empty
        :message="`No editions have been played for ${tournamentStore.name}.`"
        :icon="ICONS.calendarOff"
      />
    </template>

    <template #year-header="{ column }">
      <div class="flex justify-center items-center gap-0.5">
        <table-client-group-header :column />
        <table-client-filter-header
          :column
          label="Year"
          :icon="ICONS.calendar"
        />
        <table-client-sort-header :column />
      </div>
    </template>

    <template #year-cell="{ row, table }">
      <table-row-toggle
        v-if="row.getIsGrouped() && row.groupingColumnId === 'year'"
        :row
      >
        {{ row.original.year }}
      </table-row-toggle>

      <template v-else-if="!row.getIsGrouped() && !table.getState().grouping.includes('year')">
        {{ row.original.year }}
      </template>

      <template v-else>{{ " " }}</template>
    </template>

    <template #tour-header="{ column }">
      <table-client-filter-header
        :column
        label="Tour"
        :icon="ICONS.tour"
      />
    </template>

    <template #tour-cell="{ row }">
      <u-badge
        v-if="!row.getIsGrouped()"
        :label="row.original.tour"
        :color="<keyof typeof colors>row.original.tour"
      />

      <template v-else>{{ " " }}</template>
    </template>

    <template #match_type-header="{ column }">
      <table-client-filter-header
        :column
        label="S/D"
        :icon="ICONS.people"
      />
    </template>

    <template #match_type-cell="{ row }">
      <u-badge
        v-if="!row.getIsGrouped()"
        :label="row.original.match_type"
        :color="<keyof typeof colors>row.original.match_type"
      />

      <template v-else>{{ " " }}</template>
    </template>

    <template #team-header="{ column }">
      <div class="flex justify-center items-center gap-0.5">
        <table-client-group-header :column />
        <table-client-name-filter-header
          :column
          label="Winner(s)"
          :icon="ICONS.trophy"
        />
        <table-client-sort-header :column />
      </div>
    </template>

    <template #team-cell="{ row, table }">
      <table-row-toggle
        v-if="row.getIsGrouped() && row.groupingColumnId === 'team'"
        :row
      >
        <player-link
          v-for="player in row.original.team"
          :key="player.id"
          :player
        />
      </table-row-toggle>

      <template v-else-if="!row.getIsGrouped() && !table.getState().grouping.includes('team')">
        <player-link
          v-for="player in row.original.team"
          :key="player.id"
          :player
        />
      </template>

      <template v-else>{{ " " }}</template>
    </template>

    <template #country_name-header="{ column }">
      <div class="flex justify-center items-center gap-0.5">
        <table-client-group-header :column />
        <table-client-filter-header
          :column
          label="Winner"
          :icon="ICONS.trophy"
        />
        <table-client-sort-header :column />
      </div>
    </template>

    <template #country_name-cell="{ row, table }">
      <table-row-toggle
        v-if="row.getIsGrouped() && row.groupingColumnId === 'countryWinner_name'"
        :row
      >
        <country-link
          v-if="row.original.country"
          :country="row.original.country"
        />
      </table-row-toggle>

      <country-link
        v-else-if="!row.getIsGrouped() && !table.getState().grouping.includes('countryWinner_name') && row.original.country"
        :country="row.original.country"
      />

      <template v-else>{{ " " }}</template>
    </template>

    <template #laverWinner_team-header="{ column }">
      <div class="flex justify-center items-center gap-0.5">
        <table-client-group-header :column />
        <table-client-filter-header
          :column
          label="Winner"
          :icon="ICONS.trophy"
        />
        <table-client-sort-header :column />
      </div>
    </template>

    <template #laverWinner_team-cell="{ row, table }">
      <table-row-toggle
        v-if="row.getIsGrouped() && row.groupingColumnId === 'laverWinner_team'"
        :row
      >
        <u-icon :name="row.original.laverWinner?.team_name === 'Europe' ? ICONS.europe : ICONS.globe" />
      </table-row-toggle>

      <u-icon
        v-else-if="!row.getIsGrouped() && !table.getState().grouping.includes('laverWinner_team')"
        :name="row.original.laverWinner?.team_name === 'Europe' ? ICONS.europe : ICONS.globe"
      />

      <template v-else>{{ " " }}</template>
    </template>
  </u-table>
</template>
