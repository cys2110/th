<script setup lang="ts">
import { ICONS } from "#imports"
import type { TableColumn, TableRow } from "@nuxt/ui"
import { getFacetedRowModel, getFacetedUniqueValues } from "@tanstack/vue-table"

const props = defineProps<{
  events: Array<EditionWinnerType>
  pending: boolean
}>()

const emits = defineEmits<{ refresh: [] }>()

const route = useRoute("tournament")
const router = useRouter()
const { ui } = useAppConfig()

const { isAdmin } = useAuthState()
const tournamentStore = useTournamentStore()

const getEditionNumber = (event: EditionWinnerType) => {
  const tournamentAndYear = `${route.params.id}${event.year}`
  const edId = event.edition_id.toString()

  const slug = edId.replace(tournamentAndYear, "")

  if (slug) {
    return slug
  }
}

const columns: Array<TableColumn<EditionWinnerType>> = [
  { accessorKey: "year" },
  { accessorKey: "tour" },
  { accessorKey: "match_type" },
  { id: "team" },
  { accessorKey: "country.name" },
  { accessorKey: "team_name" }
]

const columnVisibility = computed(() => ({
  country_name: props.events.length > 0 && isCountryWinner(props.events[0]!),
  team_name: props.events.length > 0 && isLaverWinner(props.events[0]!),
  team: !props.events.length || isEliminationWinner(props.events[0]!),
  match_type: !props.events.length || isEliminationWinner(props.events[0]!),
  tour: (!props.events.length || isEliminationWinner(props.events[0]!)) && tournamentStore.tours.length > 1
}))

const handleSelectRow = (_e: Event, row: TableRow<EditionWinnerType>) => {
  router.push({
    name: "edition",
    params: {
      ...route.params,
      year: row.original.year,
      edition_id: row.original.edition_id
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
    :data="events"
    :columns
    :loading="pending"
    sticky
    @select="handleSelectRow"
    v-model:column-visibility="columnVisibility"
    :faceted-options="{
      getFacetedRowModel: getFacetedRowModel(),
      getFacetedUniqueValues: getFacetedUniqueValues()
    }"
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
        @refresh="$emit('refresh')"
        class="mx-2"
      />
    </template>

    <template #year-header="{ column }">
      <table-header
        :column
        sort
        label="Year"
        :icon="ICONS.years"
      />
    </template>

    <template #year-cell="{ row }">
      <span>{{ row.original.year }}</span>
      <span v-if="getEditionNumber(row.original)"> [{{ getEditionNumber(row.original) }}]</span>
    </template>
  </u-table>
</template>
