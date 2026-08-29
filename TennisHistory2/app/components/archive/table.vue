<script setup lang="ts">
import { formatDate, ICONS, isEqual, kebabCase, useArrayUnique } from "#imports"
import type { TableColumn, TableRow } from "@nuxt/ui"
import { getFacetedRowModel, getFacetedUniqueValues } from "@tanstack/vue-table"

const props = defineProps<{
  editions: Array<ArchiveInterface>
  pending: boolean
}>()

const emits = defineEmits<{ refresh: [] }>()

const route = useRoute("results-archive")
const router = useRouter()

const columns: Array<TableColumn<ArchiveInterface>> = [
  {
    id: "dates",
    header: "Dates",
    footer: ({ table }) => {
      const rowCount = table.getFilteredRowModel().rows.length

      return `${rowCount.toLocaleString()} edition${rowCount === 1 ? "" : "s"}`
    }
  },
  { accessorKey: "tournament.name", header: "Tournament" },
  { id: "levels", header: "Levels" },
  { id: "tours", header: "Tours" },
  { accessorKey: "categories", accessorFn: row => (row.category ? [row.category] : row.events.map(e => e.category)), header: "Categories" },
  {
    id: "surfaces",
    accessorFn: row => useArrayUnique(row.events.flatMap(e => e.surfaces.map(s => `${s.environment} ${s.surface}`))).value,
    header: "Surfaces"
  },
  { id: "venues", accessorFn: row => useArrayUnique(row.events.flatMap(e => e.venues.map(v => v.country.id))).value, header: "Locations" }
]

const handleSelectRow = (_e: Event, row: TableRow<ArchiveInterface>) => {
  const { tournament, id, year } = row.original

  router.push({ name: "edition", params: { id: tournament.id, name: kebabCase(tournament.name), year, edition_id: id } })
}
</script>

<template>
  <u-table
    :data="editions"
    :columns
    :loading="pending"
    @select="handleSelectRow"
    sticky
    :faceted-options="{
      getFacetedRowModel: getFacetedRowModel(),
      getFacetedUniqueValues: getFacetedUniqueValues()
    }"
    :ui="{
      tr: 'data-[selectable=true]:cursor-pointer even:bg-elevated/25 data-[selectable=true]:hover:bg-elevated/50',
      th: 'text-toned'
    }"
  >
    <template #loading>
      <loading-icon />
    </template>

    <template #empty>
      <empty
        :icon="ICONS.calendarOff"
        :title="`There were no tournaments played in ${route.query.year}`"
        @refresh="$emit('refresh')"
        class="mx-2"
      />
    </template>

    <template #dates-cell="{ row }">
      <client-only>
        <div v-if="row.original.start_date && row.original.end_date">
          {{ formatDate(row.original.start_date, row.original.end_date) }}
        </div>
        <div v-else>
          <div
            v-for="event in row.original.events"
            :key="event.id"
            :class="`text-${event.tour}`"
          >
            {{ formatDate(event.start_date!, event.end_date) }}
          </div>
        </div>
      </client-only>
    </template>

    <template #tournament_name-cell="{ row }">
      <div>
        <u-link
          :to="{ name: 'tournament', params: { id: row.original.tournament.id, name: kebabCase(row.original.tournament.name) } }"
          class="hover-link primary-link font-medium"
        >
          {{ row.original.tournament.name }}
        </u-link>
        <div v-if="row.original.sponsor_name">{{ row.original.sponsor_name }}</div>
        <div
          v-else-if="row.original.events.some(e => e.sponsor_name)"
          v-for="event in row.original.events"
          :key="event.id"
          :class="`text-${event.tour}`"
        >
          {{ event.sponsor_name }}
        </div>
      </div>
    </template>

    <template #levels-cell="{ row }">
      <div class="flex flex-col gap-1">
        <u-badge
          v-for="(level, index) in row.original.events.map(e => e.level)"
          :key="index"
          :label="level!"
          :color="level!"
        />
      </div>
    </template>

    <template #tours-cell="{ row }">
      <div class="flex flex-col gap-1">
        <u-badge
          v-for="(tour, index) in row.original.events.every(e => e.tour) ? row.original.events.map(e => e.tour) : row.original.tours"
          :key="index"
          :label="tour!"
          :color="tour!"
        />
      </div>
    </template>

    <template #categories-cell="{ cell, row }">
      <div v-if="row.original.category">{{ row.original.category }}</div>

      <div v-else>
        <div
          v-for="event in row.original.events"
          :key="event.id"
          :class="cell.getValue<Array<string>>().length > 1 ? `text-${event.tour}` : ''"
        >
          {{ event.category }}
        </div>
      </div>
    </template>

    <template #surfaces-cell="{ cell, row }">
      <div
        v-if="
          row.original.events.length === 1 ||
          (row.original.events[0]?.surfaces &&
            row.original.events[1]?.surfaces &&
            isEqual(row.original.events[0]!.surfaces, row.original.events[1]!.surfaces))
        "
        v-for="surface in cell.getValue<Array<string>>()"
        :key="surface"
      >
        {{ surface }}
      </div>

      <div
        v-else
        v-for="event in row.original.events"
        :key="event.id"
        :class="`text-${event.tour}`"
      >
        <div
          v-for="surface in event.surfaces"
          :key="surface.id"
        >
          {{ surface.environment }} {{ surface.surface }}
        </div>
      </div>
    </template>

    <template #venues-cell="{ row }">
      <div
        v-if="
          row.original.events.length === 1 ||
          (row.original.events[0]?.venues &&
            row.original.events[1]?.venues &&
            isEqual(row.original.events[0]!.venues, row.original.events[1]!.venues))
        "
        v-for="venue in useArrayUnique(row.original.events[0]!.venues, (a, b) => a.city === b.city).value"
        :key="venue.city"
        class="flex justify-center items-center gap-1"
      >
        {{ venue.city }}
        <country-link
          :country="venue.country"
          icon-only
        />
      </div>

      <div
        v-else
        v-for="event in row.original.events"
        :key="event.id"
        :class="`text-${event.tour}`"
      >
        <div
          v-for="venue in useArrayUnique(event.venues, (a, b) => a.city === b.city).value"
          :key="venue.city"
          class="flex justify-center items-center gap-1"
        >
          {{ venue.city }}
          <country-link
            :country="venue.country"
            icon-only
          />
        </div>
      </div>
    </template>
  </u-table>
</template>
