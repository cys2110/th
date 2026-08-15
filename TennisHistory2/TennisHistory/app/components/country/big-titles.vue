<script setup lang="ts">
import { TableRowToggle, UBadge, ULink } from "#components"
import type { TableColumn, TableRow } from "@nuxt/ui"
import { getGroupedRowModel } from "@tanstack/vue-table"

interface BigTitleInterface {
  id: string
  first_name: string
  last_name: string
  tour: TourType
  edition_id: number
  match_type: MatchEnumType
  category: string
  edition: {
    year: number
    tournament: {
      id: number
      name: string
    }
  }
}

const props = defineProps<{ country: CountryInterface }>()

const {
  ui: { colors }
} = useAppConfig()

const supabase = useSupabaseClient()
const router = useRouter()

const {
  data: bigTitles,
  pending,
  refresh
} = await useAsyncData<Array<BigTitleInterface>>(
  () => `${props.country.id}-big-titles`,
  async () => {
    const { data, error } = await supabase
      .from("country_big_titles")
      .select(
        `
        *,
        editions(year, tournaments(id, name))
      `
      )
      .eq("country_id", props.country.id)
      .order("last_name", { ascending: true })
      .order("first_name", { ascending: true })
      .order("id", { ascending: true })
      .order("start_date", { ascending: false })

    if (error || !data) {
      console.error("Error fetching country big titles:", error)
      return []
    }

    return data.map(title => {
      const { editions, ...rest } = title

      return {
        ...rest,
        edition: {
          year: editions!.year,
          tournament: editions!.tournaments
        }
      } as BigTitleInterface
    })
  },
  { default: () => [] }
)

const columns: Array<TableColumn<BigTitleInterface>> = [
  {
    id: "player",
    accessorFn: row => `${row.last_name}, ${row.first_name}`
  },
  { accessorKey: "edition.tournament.name", header: "Tournament" },
  {
    accessorKey: "edition.year",
    header: "Year",
    cell: ({ row }) => {
      if (!row.getIsGrouped()) return row.original.edition.year
    }
  },
  {
    accessorKey: "category",
    header: "Category",
    cell: ({ row }) => {
      if (!row.getIsGrouped()) {
        const category = ["Grand Slam", "Finals", "Olympics"].includes(row.original.category) ? row.original.category : "Masters"

        const colourMapping = {
          "Grand Slam": "success",
          Finals: "info",
          Olympics: "Singles",
          Masters: "ITF"
        }

        return h(UBadge, {
          label: category,
          color: colourMapping[category as keyof typeof colourMapping] as keyof typeof colors
        })
      }
    }
  },
  {
    accessorKey: "match_type",
    header: "S/D",
    cell: ({ row }) => {
      if (!row.getIsGrouped()) {
        return h(UBadge, { label: row.original.match_type, color: row.original.match_type })
      }
    }
  }
]

const grouping = ref(["player"])

const handleSelectRow = (_e: Event, row: TableRow<BigTitleInterface>) => {
  if (row.getIsGrouped()) {
    row.toggleExpanded()
  } else {
    const { edition_id, edition } = row.original

    router.push({
      name: "edition",
      params: { id: edition.tournament.id, name: kebabCase(edition.tournament.name), year: edition.year, edId: edition_id }
    })
  }
}
</script>

<template>
  <dashboard-subpanel
    :title="`Players who have won big titles`"
    :icon="ICONS.trophy"
  >
    <u-table
      :data="bigTitles"
      :columns
      :loading="pending"
      sticky
      @select="handleSelectRow"
      v-model:grouping="grouping"
      :grouping-options="{
        getGroupedRowModel: getGroupedRowModel(),
        groupedColumnMode: 'remove'
      }"
      :meta="{
        class: {
          tr: row => {
            if (row.getIsGrouped()) {
              if (row.original.tour === 'ATP') {
                return 'bg-ATP/10'
              } else {
                return 'bg-WTA/10'
              }
            } else {
              return ''
            }
          }
        }
      }"
      :ui="{
        tbody: '[&>tr]:data-[selectable=true]:cursor-pointer [&>tr]:data-[selectable=true]:hover:bg-elevated/50',
        td: 'empty:p-0'
      }"
    >
      <template #loading>
        <loading-icon />
      </template>

      <template #empty>
        <empty
          :title="`No players have won big titles representing ${country.name}`"
          :icon="ICONS.trophyOff"
          class="mx-2"
          @refresh="refresh"
        />
      </template>

      <template #edition_tournament_name-cell="{ row }">
        <table-row-toggle
          v-if="row.getIsGrouped()"
          :row
        >
          <u-link
            :to="{ name: 'player', params: { id: row.original.id, name: kebabCase(`${row.original.first_name} ${row.original.last_name}`) } }"
            class="hover-link primary-link"
          >
            {{ row.original.first_name }} {{ row.original.last_name }}
          </u-link>
        </table-row-toggle>

        <u-link
          v-else
          :to="{ name: 'tournament', params: { id: row.original.edition.tournament.id, name: kebabCase(row.original.edition.tournament.name) } }"
          class="hover-link primary-link"
        >
          {{ row.original.edition.tournament.name }}
        </u-link>
      </template>
    </u-table>
  </dashboard-subpanel>
</template>
