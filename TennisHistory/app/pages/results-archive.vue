<script setup lang="ts">
import { CountryLink, TableClientFilterHeader, TableClientSortHeader, TableRowToggle, UBadge, ULink } from "#components"
import type { TableColumn, TableRow } from "@nuxt/ui"
import { getFacetedRowModel, getFacetedUniqueValues, type Column, type Row } from "@tanstack/vue-table"

useHead({ title: "Results Archive" })

const router = useRouter()

const {
  ui: { colors }
} = useAppConfig()

const supabase = useSupabaseClient()

const selectedYear = ref(new Date().getFullYear())

const { data: editions, pending } = await useAsyncData<Array<ArchiveEditionType>>(
  "results-archive",
  async () => {
    const query = supabase
      .from("editions")
      .select(
        `
        category,
        end_date,
        id,
        start_date,
        sponsor_name,
        tournament:tournaments(id, name),
        tours,
        year,
        events(
          category,
          end_date,
          level,
          sponsor_name,
          start_date,
          tour,
          event_surface_mapping(surfaces(*)),
          event_venue_mapping(venues(*, countries(*)))
        )
      `
      )
      .eq("year", selectedYear.value)

    const { data, error } = await query

    if (error || !data) {
      console.error("Error fetching editions:", error)
      return []
    }

    return data
      .map(
        edition =>
          ({
            ...edition,
            events: edition.events.map(event => ({
              category: event.category,
              end_date: event.end_date,
              level: event.level,
              sponsor_name: event.sponsor_name,
              start_date: event.start_date,
              tour: event.tour,
              surfaces: event.event_surface_mapping.map(s => s.surfaces),
              venues: event.event_venue_mapping.map(v => ({
                id: v.venues?.id,
                name: v.venues?.name,
                city: v.venues?.city,
                country: v.venues?.countries
              }))
            }))
          }) as ArchiveEditionType
      )
      .sort((a, b) => {
        const dateAString = a.start_date ?? a.events.map(e => e.start_date).sort()[0]
        const dateBString = b.start_date ?? b.events.map(e => e.start_date).sort()[0]
        return dateBString!.localeCompare(dateAString!)
      })
  },
  { default: () => [] }
)

const columns: Array<TableColumn<ArchiveEditionType>> = [
  {
    id: "tournament",
    accessorKey: "tournament.name",
    header: ({ column }) =>
      h("div", { class: "flex items-center gap-0.5 justify-center" }, [
        h(TableClientFilterHeader, {
          column: column as Column<unknown>,
          label: "Tournament",
          icon: ICONS.trophy
        }),
        h(TableClientSortHeader, {
          column: column as Column<unknown>
        })
      ]),
    cell: ({ row }) =>
      h(
        TableRowToggle,
        {
          row: row as Row<unknown>
        },
        () => [
          h("div", { class: "text-left" }, [
            h(
              ULink,
              {
                class: "hover-link default-link font-medium",
                to: {
                  name: "tournament",
                  params: {
                    id: row.original.tournament.id,
                    name: kebabCase(row.original.tournament.name)
                  }
                }
              },
              () => row.original.tournament.name
            ),
            ...(row.original.sponsor_name ? [h("div", { class: "text-xs" }, row.original.sponsor_name)] : [])
          ])
        ]
      )
  },
  {
    accessorKey: "tours",
    filterFn: arrayFilter,
    header: ({ column }) => h(TableClientFilterHeader, { column: column as Column<unknown>, label: "Tours", icon: ICONS.tour }),
    cell: ({ row }) =>
      h(
        "div",
        { class: "space-x-1" },
        row.original.tours.map(t =>
          h(UBadge, {
            key: t,
            label: t,
            color: t
          })
        )
      )
  },
  {
    accessorKey: "category",
    header: ({ column }) =>
      h(TableClientFilterHeader, {
        column: column as Column<unknown>,
        label: "Category",
        icon: ICONS.category
      })
  },
  {
    id: "dates",
    accessorFn: row => {
      if (row.start_date) return row.start_date
      return row.events.map(e => e.start_date).sort()[0]
    },
    header: ({ column }) =>
      h(TableClientSortHeader, {
        column: column as Column<unknown>,
        label: "Dates",
        icon: ICONS.calendar
      }),
    cell: ({ row }) => {
      if (row.original.start_date && row.original.end_date) {
        return dateFormat.formatRange(new Date(row.original.start_date), new Date(row.original.end_date))
      }
    }
  },
  {
    id: "surface",
    accessorFn: row => useArrayUnique(row.events.flatMap(e => e.surfaces.map(s => `${s.environment} ${s.surface}`))).value,
    filterFn: arrayFilter,
    header: ({ column }) => h(TableClientFilterHeader, { column: column as Column<unknown>, label: "Surface", icon: ICONS.court }),
    cell: ({ cell }) => {
      if (cell.getValue<string[]>().length === 1) {
        return cell.getValue()
      }
    }
  },
  {
    id: "city",
    accessorFn: row => useArrayUnique(row.events.flatMap(e => e.venues.map(v => v.city))).value,
    filterFn: arrayFilter,
    header: ({ column }) => h(TableClientFilterHeader, { column: column as Column<unknown>, label: "City", icon: ICONS.location }),
    cell: ({ cell, row }) => {
      if (cell.getValue<string[]>().length === 1) {
        return cell.getValue()
      }
    }
  },
  {
    id: "country",
    accessorFn: row => useArrayUnique(row.events.flatMap(e => e.venues.map(v => v.country.name))).value,
    filterFn: arrayFilter,
    header: ({ column }) => h(TableClientFilterHeader, { column: column as Column<unknown>, label: "Country", icon: ICONS.globe }),
    cell: ({ cell, row }) => {
      if (cell.getValue<string[]>().length === 1) {
        const country = row.original.events[0]!.venues[0]!.country

        return h(CountryLink, { country, iconOnly: true, class: "mx-auto" })
      }
    }
  }
]

const handleSelectRow = (_e: Event, row: TableRow<ArchiveEditionType>) => {
  const { tournament, id, year } = row.original

  router.push({
    name: "edition",
    params: {
      id: tournament?.id || 0,
      name: kebabCase(tournament?.name),
      year,
      edId: id
    }
  })
}
</script>

<template>
  <u-container class="max-w-7xl">
    <u-page>
      <u-page-header
        title="Results Archive"
        :ui="{ root: 'pb-4' }"
      >
        <div class="flex justify-end">
          <u-select-menu
            v-model="selectedYear"
            :items="OPEN_ERA_YEARS"
            highlight
            class="w-fit"
          />
        </div>
      </u-page-header>

      <u-page-body>
        <u-table
          ref="table"
          :data="editions"
          :columns
          @select="handleSelectRow"
          sticky
          :loading="pending"
          render-fallback-value="—"
          :faceted-options="{
            getFacetedRowModel: getFacetedRowModel(),
            getFacetedUniqueValues: getFacetedUniqueValues()
          }"
          :meta="{
            class: {
              tr: row => (row.getCanExpand() ? '' : 'bg-muted/30')
            }
          }"
          :ui="{ td: 'empty:p-0' }"
        >
          <template #loading>
            <loading-icon />
          </template>

          <template #empty>
            <empty
              message="No editions found"
              :icon="ICONS.calendarOff"
            />
          </template>

          <template #expanded="{ row }">
            <div class="flex flex-col divide-y divide-default">
              <div
                v-for="(event, index) in row.original.events"
                :key="index"
                class="grid grid-cols-7 gap-4 p-1"
              >
                <div>
                  <u-badge
                    :label="<string>event.level"
                    :color="<keyof typeof colors>event.level"
                  />
                </div>
                <div>
                  <u-badge
                    :label="<string>event.tour"
                    :color="<keyof typeof colors>event.tour"
                  />
                </div>
                <div>
                  {{ event.category }}
                </div>
                <div>
                  <span v-if="event.start_date && event.end_date">{{
                    dateFormat.formatRange(new Date(event.start_date), new Date(event.end_date))
                  }}</span>
                </div>

                <div>
                  <div
                    v-if="row.getValue<string[]>('surface').length !== 1"
                    v-for="s in event.surfaces"
                    :key="s.id"
                  >
                    {{ s.environment }} {{ s.surface }}
                  </div>
                </div>

                <div>
                  <div
                    v-if="row.getValue<string[]>('city').length !== 1"
                    v-for="location in useArrayUnique(event.venues.map(v => ({ city: v.city, country: v.country }))).value"
                    :key="location.city"
                    class="flex items-center gap-2"
                  >
                    <span>{{ location.city }}</span>
                    <country-link
                      :country="location.country!"
                      icon-only
                    />
                  </div>
                </div>
              </div>
            </div>
          </template>
        </u-table>
      </u-page-body>
    </u-page>
  </u-container>
</template>
