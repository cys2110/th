<script setup lang="ts">
import { UBadge } from "#components"
import { ICONS } from "#imports"
import type { TableColumn } from "@nuxt/ui"
import { createColumnHelper } from "@tanstack/vue-table"

interface FinalistsInterface {
  id: string
  first_name: string
  last_name: string
  full_name: string
  country: CountryInterface
  tour: TourType
  singles: {
    titles: number
    finals: number
  }
  doubles: {
    titles: number
    finals: number
  }
}

const route = useRoute("tournament")
const supabase = useSupabaseClient()

const tournamentStore = useTournamentStore()

const {
  data: finalists,
  pending,
  refresh
} = await useAsyncData<Array<FinalistsInterface>>(
  () => `finalists-${route.params.id}`,
  async () => {
    const { data, error } = await supabase
      .from("tournament_finalists")
      .select("player_id, winner, match_type, players(first_name, last_name, full_name, tour), countries(*)")
      .eq("tournament_id", Number(route.params.id))

    if (error || !data) {
      console.error("Error fetching tournament finalists", error)
      return []
    }

    const uniquePlayers = useArrayUnique(data.map(item => item.player_id)).value

    return uniquePlayers
      .map(playerId => {
        const playerRecords = data.filter(item => item.player_id === playerId)
        let singlesTitles = 0
        let singlesFinals = 0
        let doublesTitles = 0
        let doublesFinals = 0

        playerRecords.forEach(item => {
          if (item.match_type === "Singles") {
            if (item.winner) {
              singlesTitles++
            } else {
              singlesFinals++
            }
          } else {
            if (item.winner) {
              doublesTitles++
            } else {
              doublesFinals++
            }
          }
        })

        return {
          id: playerId,
          first_name: playerRecords[0]!.players!.first_name,
          last_name: playerRecords[0]!.players!.last_name,
          full_name: playerRecords[0]!.players!.full_name,
          country: playerRecords[0]!.countries,
          tour: playerRecords[0]!.players!.tour,
          singles: {
            titles: singlesTitles,
            finals: singlesFinals
          },
          doubles: {
            titles: doublesTitles,
            finals: doublesFinals
          }
        } as FinalistsInterface
      })
      .sort((a, b) => {
        if (a.singles.titles === b.singles.titles) {
          if (a.doubles.titles === b.doubles.titles) {
            if (a.singles.finals === b.singles.finals) {
              return b.doubles.finals - a.doubles.finals
            }
            return b.singles.finals - a.singles.finals
          }
          return b.doubles.titles - a.doubles.titles
        }

        return b.singles.titles - a.singles.titles
      })
  },
  { default: () => [] }
)

const columnHelper = createColumnHelper<FinalistsInterface>()
const columns: Array<TableColumn<FinalistsInterface>> = [
  { accessorKey: "tour" },
  { id: "player", accessorFn: row => `${row.last_name}, ${row.first_name}` },
  columnHelper.group({
    id: "singles",
    header: () => h(UBadge, { label: "Singles", color: "Singles", class: "w-full" }),
    columns: [
      { accessorKey: "singles.titles" },
      { accessorKey: "singles.finals" },
      { id: "singles_percentage", accessorFn: row => calculatePercentage(row.singles.titles, row.singles.titles + row.singles.finals) }
    ]
  }),
  columnHelper.group({
    id: "doubles",
    header: () => h(UBadge, { label: "Doubles", color: "Doubles", class: "w-full" }),
    columns: [
      { accessorKey: "doubles.titles" },
      { accessorKey: "doubles.finals" },
      { id: "doubles_percentage", accessorFn: row => calculatePercentage(row.doubles.titles, row.doubles.titles + row.doubles.finals) }
    ]
  })
]

const columnVisibility = computed(() => ({
  tour: tournamentStore.tours.length > 1
}))
</script>

<template>
  <u-table
    :data="finalists"
    :columns
    :loading="pending"
    sticky
    v-model:column-visibility="columnVisibility"
    :ui="{ root: 'max-h-[60vh] mt-4', tbody: '[&>tr]:even:bg-elevated/25', th: 'py-1' }"
  >
    <template #loading>
      <loading-icon />
    </template>

    <template #empty>
      <empty
        :icon="ICONS.peopleOff"
        :title="`No player has reach the finals of ${tournamentStore.name}`"
        @refresh="refresh()"
      />
    </template>

    <template #tour-header="{ column }">
      <table-header
        filter
        :column
        label="Tour"
        :icon="ICONS.tour"
      />
    </template>

    <template #tour-cell="{ row }">
      <u-badge
        :label="row.original.tour"
        :color="row.original.tour"
      />
    </template>

    <template #player-header="{ column }">
      <table-header
        sort
        :column
        label="Player"
        :icon="false"
      />
    </template>

    <template #player-cell="{ row }">
      <player-link :players="[{ id: row.original.id, full_name: row.original.full_name, country: row.original.country }]" />
    </template>

    <template #singles_titles-header="{ column }">
      <table-header
        sort
        :column
        label="Titles"
        :icon="false"
      />
    </template>

    <template #singles_finals-header="{ column }">
      <table-header
        sort
        :column
        label="Finals"
        :icon="false"
      />
    </template>

    <template #singles_percentage-header="{ column }">
      <table-header
        sort
        :column
        label="Win %"
        :icon="false"
      />
    </template>

    <template #singles_percentage-cell="{ cell }"> {{ cell.getValue() }}% </template>

    <template #doubles_titles-header="{ column }">
      <table-header
        sort
        :column
        label="Titles"
        :icon="false"
      />
    </template>

    <template #doubles_finals-header="{ column }">
      <table-header
        sort
        :column
        label="Finals"
        :icon="false"
      />
    </template>

    <template #doubles_percentage-header="{ column }">
      <table-header
        sort
        :column
        label="Win %"
        :icon="false"
      />
    </template>

    <template #doubles_percentage-cell="{ cell }"> {{ cell.getValue() }}% </template>
  </u-table>
</template>
