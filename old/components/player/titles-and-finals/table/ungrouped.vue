<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui"

const { events, status, selection, tour, firstName, lastName } = defineProps<{
  events: TitlesAndFinalsInterface[]
  status: APIStatusType
  tour: TourType
  firstName: string
  lastName: string
  selection: ("Titles" | "Finals")[]
}>()
const {
  ui: { icons }
} = useAppConfig()

const columns: TableColumn<TitlesAndFinalsInterface>[] = [
  { accessorKey: "titles" },
  { accessorKey: "type" },
  { accessorKey: "level" },
  { accessorKey: "year" },
  { id: "tournament", accessorKey: "tournament.name" },
  {
    id: "date",
    accessorFn: row => {
      const { end_date, atp_end_date, wta_end_date, men_end_date, women_end_date } = row
      if (end_date) return `${end_date.year}-${end_date.month}-${end_date.day}`
      if (tour === "ATP") {
        if (atp_end_date) return `${atp_end_date.year}-${atp_end_date.month}-${atp_end_date.day}`
        if (men_end_date) return `${men_end_date.year}-${men_end_date.month}-${men_end_date.day}`
        return undefined
      }
      if (tour === "WTA") {
        if (wta_end_date) return `${wta_end_date.year}-${wta_end_date.month}-${wta_end_date.day}`
        if (women_end_date) return `${women_end_date.year}-${women_end_date.month}-${women_end_date.day}`
        return undefined
      }
    },
    sortUndefined: "last"
  },
  {
    id: "category",
    accessorFn: row => row.category ?? (tour === "ATP" ? (row.atp_category ?? row.men_category) : (row.wta_category ?? row.women_category))
  },
  { accessorKey: "surface" }
]
</script>

<template>
  <u-table
    :data="events"
    :columns
    sticky
    :loading="status === 'pending'"
    :empty="`No ${selection.length === 2 ? 'titles or finals' : selection[0]?.toLowerCase()} found for ${firstName} ${lastName}`"
    :ui="{
      root: 'scrollbar-thin scrollbar-thumb-primary-600 scrollbar-track-transparent'
    }"
  >
    <template #titles-header="{ column }">
      <sort-table-header
        :column
        label="Titles/Finals"
        type="alpha"
      />
    </template>

    <template #type-header="{ column }">
      <sort-table-header
        :column
        label="Singles/Doubles"
        type="alpha"
      />
    </template>

    <template #type-cell="{ row }">
      <u-badge
        class="font-semibold"
        :label="row.original.type"
        :color="row.original.type === 'Singles' ? 'singles' : 'doubles'"
      />
    </template>

    <template #level-header="{ column }">
      <sort-table-header
        :column
        label="Level"
        type="alpha"
      />
    </template>

    <template #level-cell="{ row }">
      <u-badge
        class="font-semibold"
        :label="row.original.level"
        :color="
          row.original.level === 'Tour' ? 'tour'
          : row.original.level === 'Challenger' ? 'challenger'
          : 'qualifying'
        "
      />
    </template>

    <template #year-header="{ column }">
      <sort-table-header
        :column
        label="Year"
        type="number"
      />
    </template>

    <template #tournament-header="{ column }">
      <sort-table-header
        :column
        label="Tournament"
        type="alpha"
      />
    </template>

    <template #tournament-cell="{ row }">
      <u-link
        :to="{ name: 'tournament', params: { id: row.original.tournament.id, name: kebabCase(row.original.tournament.name) } }"
        class="hover-link"
      >
        {{ row.original.tournament.name }}
      </u-link>
    </template>

    <template #date-header="{ column }">
      <sort-table-header
        :column
        label="Date"
        type="number"
      />
    </template>

    <template #date-cell="{ row }">
      <u-link
        v-if="isDefined(row.getValue('date'))"
        :to="{
          name: 'event',
          params: { id: row.original.tournament.id, name: kebabCase(row.original.tournament.name), year: row.original.year, eid: row.original.id }
        }"
        class="hover-link"
      >
        <nuxt-time
          :datetime="row.getValue('date')"
          year="numeric"
          month="long"
          day="numeric"
        />
      </u-link>
    </template>

    <template #category-header="{ column }">
      <sort-table-header
        :column
        label="Category"
        type="alpha"
      />
    </template>

    <template #category-cell="{ row }">
      <u-link
        v-if="isDefined(row.original.category)"
        :to="{ name: 'category', params: { id: kebabCase(row.getValue('category')) } }"
        class="hover-link"
      >
        {{ row.getValue("category") }}
      </u-link>
    </template>

    <template #surface-header="{ column }">
      <sort-table-header
        :column
        label="Surface"
        type="alpha"
      />
    </template>

    <template #surface-cell="{ row }">
      <u-link
        :to="{ name: 'surface', params: { id: kebabCase(row.original.surface) } }"
        class="hover-link"
      >
        {{ row.original.surface }}
      </u-link>
    </template>
  </u-table>
</template>
