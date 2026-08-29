<script setup lang="ts">
import { UBadge } from "#components"
import { ICONS } from "#imports"
import type { TableColumn } from "@nuxt/ui"
import { createColumnHelper } from "@tanstack/vue-table"
import { Temporal } from "@js-temporal/polyfill"

type WinnerType = Pick<PlayerInterface, "id" | "first_name" | "last_name" | "country" | "full_name" | "tour" | "dob"> & {
  year: number
  edition_id: number
  match_type: MatchEnumType
  games_won: number
  games_lost: number
  sets_won: number
  sets_lost: number
  end_date: string
}

const route = useRoute("tournament")
const supabase = useSupabaseClient()

const tournamentStore = useTournamentStore()

const {
  data: winners,
  pending,
  refresh
} = await useAsyncData<Array<WinnerType>>(
  () => `winner-stats-${route.params.id}`,
  async () => {
    const { data, error } = await supabase
      .from("tournament_finalists")
      .select(
        "player_id, edition_id, year, match_type, games_won, games_lost, sets_won, sets_lost, players(first_name, last_name, full_name, tour, dob), countries(*), editions(end_date, events(end_date, tour))"
      )
      .eq("tournament_id", Number(route.params.id))
      .eq("winner", true)
      .order("year", { ascending: true })
      .order("match_type", { ascending: true })
      .order("player_id", { ascending: true })

    if (error || !data) {
      console.error("Error fetching tournament winners", error)
      return []
    }

    return data.map(item => {
      const { player_id, players, countries, editions, ...rest } = item

      return {
        ...players,
        ...rest,
        id: player_id,
        country: countries,
        end_date: editions?.end_date || editions?.events?.find(e => e.tour === players?.tour)!.end_date
      } as WinnerType
    })
  },
  { default: () => [] }
)

const columnHelper = createColumnHelper<WinnerType>()
const columns: Array<TableColumn<WinnerType>> = [
  { accessorKey: "tour" },
  { id: "player", accessorFn: row => `${row.last_name}, ${row.first_name}` },
  { accessorKey: "year" },
  {
    id: "age",
    accessorFn: row => {
      if (row.dob) {
        const dob = new Date(`${row.dob}T00:00:00Z`)
        const tournamentDate = new Date(`${row.end_date}T00:00:00Z`)

        return tournamentDate.getTime() - dob.getTime()
      }

      return undefined
    },
    cell: ({ row }) => {
      if (row.original.dob) {
        const dob = Temporal.PlainDate.from(row.original.dob)
        const endDate = Temporal.PlainDate.from(row.original.end_date)
        const age = dob.until(endDate, { largestUnit: "years" })

        return `${age.years}y, ${age.months}m, ${age.days}d`
      }

      return "—"
    }
  },
  { accessorKey: "match_type" },
  columnHelper.group({
    id: "sets",
    header: () => h(UBadge, { label: "Sets", class: "w-full" }),
    columns: [
      { accessorKey: "sets_won" },
      { accessorKey: "sets_lost" },
      { id: "sets_percentage", accessorFn: row => calculatePercentage(row.sets_won, row.sets_won + row.sets_lost) }
    ]
  }),
  columnHelper.group({
    id: "games",
    header: () => h(UBadge, { label: "Games", class: "w-full" }),
    columns: [
      { accessorKey: "games_won" },
      { accessorKey: "games_lost" },
      { id: "games_percentage", accessorFn: row => calculatePercentage(row.games_won, row.games_won + row.games_lost) }
    ]
  })
]

const columnVisibility = computed(() => ({
  tour: tournamentStore.tours.length > 1
}))
</script>

<template>
  <u-table
    :data="winners"
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
        :icon="ICONS.trophyOff"
        :title="`No player has won of ${tournamentStore.name}`"
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

    <template #year-header="{ column }">
      <table-header
        sort
        :column
        label="Year"
        :icon="false"
      />
    </template>

    <template #year-cell="{ row }">
      <u-link
        :to="{ name: 'edition', params: { ...route.params, year: row.original.year, edition_id: row.original.edition_id } }"
        class="hover-link primary-link"
      >
        {{ row.original.year }}
      </u-link>
    </template>

    <template #age-header="{ column }">
      <table-header
        sort
        :column
        label="Age"
        :icon="false"
      />
    </template>

    <template #match_type-header="{ column }">
      <table-header
        filter
        :column
        label="S/D"
        :icon="ICONS.people"
      />
    </template>

    <template #match_type-cell="{ row }">
      <u-badge
        :label="row.original.match_type"
        :color="row.original.match_type"
      />
    </template>

    <template #sets_won-header="{ column }">
      <table-header
        sort
        :column
        label="Won"
        :icon="false"
      />
    </template>

    <template #sets_lost-header="{ column }">
      <table-header
        sort
        :column
        label="Lost"
        :icon="false"
      />
    </template>

    <template #sets_percentage-header="{ column }">
      <table-header
        sort
        :column
        label="Win %"
        :icon="false"
      />
    </template>

    <template #sets_percentage-cell="{ cell }"> {{ cell.getValue() }}% </template>

    <template #games_won-header="{ column }">
      <table-header
        sort
        :column
        label="Won"
        :icon="false"
      />
    </template>

    <template #games_lost-header="{ column }">
      <table-header
        sort
        :column
        label="Lost"
        :icon="false"
      />
    </template>

    <template #games_percentage-header="{ column }">
      <table-header
        sort
        :column
        label="Win %"
        :icon="false"
      />
    </template>

    <template #games_percentage-cell="{ cell }"> {{ cell.getValue() }}% </template>
  </u-table>
</template>
