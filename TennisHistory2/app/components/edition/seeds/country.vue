<script setup lang="ts">
import type { TableColumn, TableRow } from "@nuxt/ui"

const {
  params: { edId, year }
} = useRoute("edition")

const {
  ui: { icons }
} = useAppConfig()

const router = useRouter()
const supabase = useSupabaseClient()

const tournamentStore = useTournamentStore()

const {
  data: seeds,
  pending,
  refresh
} = await useAsyncData(
  "country-seeds",
  async () => {
    const { data, error } = await supabase
      .from("seeds")
      .select("seed, ...entries(countries(*))")
      .eq("event_id", `${edId}-Country`)
      .order("seed", { ascending: true })

    if (error || !data) {
      console.error("Error fetching seeds:", error)
      return []
    }

    return data as Array<CountrySeedInterface>
  },
  { default: () => [] }
)

const columns: TableColumn<CountrySeedInterface>[] = [
  { accessorKey: "seed", header: "Seed" },
  { id: "country", header: "Country" }
]

const handleSelectRow = (_e: Event, row: TableRow<CountrySeedInterface>) => {
  router.push({
    name: "country",
    params: {
      id: row.original.countries.id,
      name: kebabCase(row.original.countries.name)
    }
  })
}
</script>

<template>
  <u-table
    :data="seeds"
    :columns
    :loading="pending"
    sticky
    @select="handleSelectRow"
    :ui="{
      root: '2xl:max-w-2/3 mx-auto max-h-[calc(100vh-25rem)]',
      tbody: '[&>tr]:data-[selectable=true]:cursor-pointer [&>tr]:data-[selectable=true]:hover:bg-elevated/50 [&>tr]:even:bg-elevated/25'
    }"
  >
    <template #loading>
      <u-icon
        :name="icons.loading"
        class="size-8"
      />
    </template>

    <template #empty>
      <u-empty
        :icon="ICONS.trophyOff"
        :title="`There were no seeds in ${tournamentStore.name} ${year}`"
        description="If you think this is an error, refresh the page. Otherwise, please be patient as we continue to add more data."
        class="mx-2"
      >
        <template #actions>
          <u-button
            label="Refresh"
            :icon="icons.reload"
            @click="refresh()"
          />
        </template>
      </u-empty>
    </template>

    <template #country-cell="{ row }">
      <country-link
        :country="row.original.countries"
        class="mx-auto"
      />
    </template>
  </u-table>
</template>
