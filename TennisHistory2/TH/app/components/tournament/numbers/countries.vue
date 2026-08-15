<script setup lang="ts">
import { UBadge } from "#components"
import { ICONS } from "#imports"
import type { TableColumn } from "@nuxt/ui"
import { createColumnHelper } from "@tanstack/vue-table"

interface CountryWinnerInterface {
  year: number
  singles_total: number
  singles_distinct: number
  doubles_distinct: number
  doubles_total: number
  all_total: number
  all_distinct: number
}

const route = useRoute("tournament")
const supabase = useSupabaseClient()

const tournamentStore = useTournamentStore()

const selectedCountry = ref<CountryInterface | undefined>()

const { data, pending, refresh } = useAsyncData(
  () => `country-winners-${route.params.id}`,
  async () => {
    const { data, error } = await supabase
      .from("tournament_finalists")
      .select("player_id, year, match_type, tour, country_id, countries(*)")
      .eq("tournament_id", Number(route.params.id))
      .eq("winner", true)

    if (error || !data) {
      console.error("Error fetching tournament country winners", error)
      return []
    }

    return data
  },
  { default: () => [] }
)

const countries = computed(() => data.value.map(item => item.countries).sort((a, b) => a!.name.localeCompare(b!.name)))

const countryData = computed<Array<CountryWinnerInterface>>(() => {
  const countryId = selectedCountry.value?.id

  if (!countryId) return []

  const years = useArrayUnique(data.value.map(item => item.year))
    .value.filter((year): year is number => year != null)
    .sort((a, b) => a - b)

  const singlesCountry = new Set<string>()
  const singlesAll = new Set<string>()
  const doublesCountry = new Set<string>()
  const doublesAll = new Set<string>()
  const allCountry = new Set<string>()
  const allAll = new Set<string>()

  return years.map(year => {
    const yearRows = data.value.filter(item => item.year === year)

    for (const row of yearRows) {
      if (row.player_id) {
        if (row.country_id === countryId) {
          allAll.add(row.player_id)
          allCountry.add(row.player_id)

          if (row.match_type === "Singles") {
            singlesAll.add(row.player_id)
            singlesCountry.add(row.player_id)
          }

          if (row.match_type === "Doubles") {
            doublesAll.add(row.player_id)
            doublesCountry.add(row.player_id)
          }
        }
      }
    }

    return {
      year,
      singles_total: singlesCountry.size,
      singles_distinct: singlesAll.size,
      doubles_total: doublesCountry.size,
      doubles_distinct: doublesAll.size,
      all_total: allCountry.size,
      all_distinct: allAll.size
    }
  })
})

const columnHelper = createColumnHelper<CountryWinnerInterface>()
const columns: Array<TableColumn<CountryWinnerInterface>> = [
  { accessorKey: "year", header: "Year" },
  columnHelper.group({
    id: "singles",
    header: () => h(UBadge, { label: "Singles", color: "Singles", class: "w-full" }),
    columns: [
      { accessorKey: "singles_distinct", header: "Distinct Winners" },
      { accessorKey: "singles_total", header: "Total Winners" }
    ]
  }),
  columnHelper.group({
    id: "doubles",
    header: () => h(UBadge, { label: "Doubles", color: "Doubles", class: "w-full" }),
    columns: [
      { accessorKey: "doubles_distinct", header: "Distinct Winners" },
      { accessorKey: "doubles_total", header: "Total Winners" }
    ]
  }),
  columnHelper.group({
    id: "all",
    header: () => h(UBadge, { label: "All", class: "w-full" }),
    columns: [
      { accessorKey: "all_distinct", header: "Distinct Winners" },
      { accessorKey: "all_total", header: "Total Winners" }
    ]
  })
]

watch(
  data,
  () => {
    set(selectedCountry, data.value[0]?.countries || "")
  },
  { immediate: true }
)
</script>

<template>
  <div>
    <div class="w-fit ml-auto mr-4 mt-4">
      <u-select-menu
        v-model="selectedCountry"
        :items="countries"
        label-key="name"
        placeholder="Country"
        :icon="ICONS.globe"
        highlight
      >
        <template #leading="{ modelValue }">
          <u-icon :name="modelValue?.icon || ICONS.globe" />
        </template>
      </u-select-menu>
    </div>

    <u-table
      :data="countryData"
      :columns
      :loading="pending"
      sticky
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
    </u-table>
  </div>
</template>
