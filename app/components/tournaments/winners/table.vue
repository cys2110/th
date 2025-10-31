<script setup lang="ts">
import type { TableColumn, TableRow } from "@nuxt/ui"

const { count, status, editions } = defineProps<{
  tournament: TournamentInterface
  editions: EditionInterface[]
  status: APIStatusType
  count: number
  resetFilters: () => void
  refresh: () => void
}>()
const selectedTab = defineModel<string>()
const skip = defineModel<number>("skip")
const filters = defineModel<Partial<FiltersInterface>>("filters")

const {
  params: { id, name }
} = useRoute("tournament")
const {
  ui: { icons }
} = useAppConfig()
const breakpoints = useBreakpoints(breakpointsTailwind, { ssrWidth: useSSRWidth() })
const mdAndDown = breakpoints.smallerOrEqual("md")

const tours = useState<(keyof typeof TourEnum)[]>("tours")
const table = useTemplateRef<any>("table")
const initialised = ref(false)

onMounted(() => {
  useInfiniteScroll(
    table.value?.$el,
    () => {
      if (!get(initialised)) {
        set(initialised, true)
        return
      }
      set(skip, get(skip)! + 40)
    },
    {
      distance: 50,
      canLoadMore: () => {
        return status !== "pending" && count > editions.length
      }
    }
  )
})

const columns: TableColumn<EditionInterface>[] = [
  { accessorKey: "year" },
  { accessorKey: "tours" },
  { accessorKey: "sponsor_name", header: "Sponsor Name" },
  { accessorKey: "category", header: "Category" },
  { id: "dates", header: "Dates" },
  { id: "Surface", accessorKey: "surface.id", header: "Surface" },
  { accessorKey: "venues", header: "Venues" },
  {
    id: "Total financial commitment",
    accessorFn: row => (row.tfc && row.currency ? row.tfc.toLocaleString("en-GB", { style: "currency", currency: row.currency }) : "—"),
    header: "TFC"
  },
  { accessorKey: "winners" }
]

const handleSelect = async (e: Event, row: TableRow<EditionInterface>) => {
  await navigateTo({ name: "edition", params: { id, name, year: row.original.year, edId: row.original.id } })
}
</script>

<template>
  <table-wrapper>
    <template
      #trailing
      v-if="!mdAndDown"
    >
      <div class="text-muted font-semibold w-full text-center">
        <span v-if="tournament?.established">{{ tournament.established }}</span>
        <span v-if="tournament?.established && !tournament.abolished"> - present</span>
        <span v-else-if="tournament?.abolished && tournament.established !== tournament.abolished"> - {{ tournament.abolished }}</span>
      </div>
    </template>
    <template
      #navbar-right
      v-if="tournament.website"
    >
      <u-button
        :to="tournament.website"
        target="_blank"
        :icon="icons.external"
        size="xs"
      />
    </template>

    <template #toolbar>
      <dev-only>
        <div class="w-full flex justify-center items-center gap-1">
          <tournaments-update :tournament />
          <editions-update :refresh />
        </div>
      </dev-only>
      <div class="w-full flex items-center gap-1">
        <u-badge
          v-for="tour in tournament.tours"
          :key="tour"
          :label="TourEnum[tour]"
          :color="tour"
          class="w-full justify-center"
        />
      </div>
      <u-badge
        v-if="!mdAndDown"
        color="success"
        :label="`Updated: ${useDateFormat(tournament.updated_at, 'DD MMMM YYYY').value}`"
        class="w-full justify-center"
      />
      <div class="w-full flex justify-center items-center">
        <u-tabs
          v-if="!COUNTRY_DRAWS.includes(id as string)"
          v-model="selectedTab"
          :items="[
            { label: 'Winners', value: 'winners' },
            { label: 'Numbers', value: 'numbers' }
          ]"
          size="xs"
          variant="link"
        />
      </div>

      <u-button
        label="Reset Filters"
        :icon="ICONS.noFilter"
        @click="resetFilters"
        block
      />

      <table-visibility
        v-if="table"
        :table="table!"
      />
    </template>

    <u-table
      ref="table"
      :data="editions"
      :columns
      :loading="status === 'pending'"
      sticky
      render-fallback-value="—"
      @select="handleSelect"
      :ui="{ tbody: '[&>tr]:cursor-pointer' }"
    >
      <template #loading>
        <table-loading />
      </template>

      <template #empty>
        <u-empty
          title="No editions found"
          :icon="ICONS.noEdition"
          description="If you think this is an error, refresh the page. Otherwise, please be patient as we continue to add more data."
          class="mx-2"
        >
          <template #actions>
            <u-button
              label="Refresh"
              :icon="icons.reload"
              @click="reloadNuxtApp()"
            />
            <dev-only>
              <editions-update :refresh />
            </dev-only>
          </template>
        </u-empty>
      </template>

      <template #year-header>
        <form-select-menu
          v-if="filters"
          v-model="filters.years"
          placeholder="Years"
          :items="ALL_YEARS"
          :icon="ICONS.event"
          multiple
        />
      </template>

      <template #tours-header>
        <form-select
          v-if="filters && tours.length > 1"
          v-model="filters.tours"
          placeholder="Tours"
          :items="tours.map(tour => ({ label: TourEnum[tour], value: tour }))"
          :icon="ICONS.tour"
          multiple
        />
        <template v-else>Tours</template>
      </template>
      <template #tours-cell="{ row }">
        <div class="flex justify-center items-center gap-1">
          <u-badge
            v-for="tour in row.original.tours"
            :key="tour"
            :label="TourEnum[tour]"
            :color="tour"
          />
        </div>
      </template>

      <template #sponsor_name-cell="{ cell }">
        {{ cell.renderValue() }}
      </template>

      <template #category-cell="{ cell }">
        {{ cell.renderValue() }}
      </template>

      <template #dates-cell="{ row }">
        <template v-if="row.original.start_date && row.original.end_date">
          {{ dateTimeFormat.formatRange(new Date(row.original.start_date), new Date(row.original.end_date)) }}
        </template>
        <template v-else>—</template>
      </template>

      <template #venues-cell="{ row }">
        <div v-if="row.original.venues?.length">
          <div
            v-for="venue in row.original.venues"
            :key="venue.id"
            class="flex items-center gap-1"
          >
            <dev-only>
              <venues-update :venue />
              <template #fallback>
                <span>{{ venue.name ? `${venue.name}, ${venue.city}` : venue.city }}</span>
                <countries-link
                  :country="venue.country"
                  icon-only
                />
              </template>
            </dev-only>
          </div>
        </div>
        <template v-else>—</template>
      </template>

      <template #winners-header>
        <form-select-search
          v-if="filters"
          v-model="filters.winners"
          placeholder="Winners"
          type="winners"
          multiple
          :id
        />
      </template>

      <template #winners-cell="{ row }">
        <div
          v-if="row.original.winners?.length"
          v-for="winner in row.original.winners"
          :key="`${winner.tour}-${winner.type}`"
          class="flex items-center gap-2"
        >
          <u-badge
            :label="TourEnum[winner.tour]"
            :color="winner.tour"
          />
          <u-badge
            :label="winner.type"
            :color="winner.type"
          />
          <div class="flex flex-col">
            <players-link
              v-for="player in winner.team"
              :key="player.id"
              :player
            />
          </div>
        </div>
        <template v-else>—</template>
      </template>
    </u-table>

    <template #footer> {{ count }} edition{{ count === 1 ? "" : "s" }} </template>
  </table-wrapper>
</template>
