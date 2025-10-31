<script setup lang="ts">
import type { TableColumn, TableRow } from "@nuxt/ui"

const { status, count, tournaments } = defineProps<{
  tournaments: TournamentInterface[]
  resetFilters: () => void
  count: number
  status: APIStatusType
  refresh: () => void
}>()
const skip = defineModel<number>("skip")
const filters = defineModel<Partial<FiltersInterface>>("filters")
const {
  ui: { icons }
} = useAppConfig()
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
        return status !== "pending" && count > tournaments.length
      }
    }
  )
})

const columns: TableColumn<TournamentInterface>[] = [
  { accessorKey: "tours" },
  { accessorKey: "name" },
  { accessorKey: "established", meta: { class: { th: "py-2" } } },
  { accessorKey: "abolished" }
]

const handleSelect = async (e: Event, row: TableRow<TournamentInterface>) => {
  await navigateTo({ name: "tournament", params: { id: row.original.id, name: kebabCase(row.original.name ?? "-") } })
}
</script>

<template>
  <table-wrapper>
    <template #toolbar>
      <dev-only>
        <tournaments-update />
      </dev-only>
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
      :data="tournaments"
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
          title="No tournaments found"
          :icon="ICONS.noTournament"
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
              <tournaments-update :refresh />
            </dev-only>
          </template>
        </u-empty>
      </template>

      <template #tours-header>
        <form-select
          v-if="filters"
          v-model="filters.tours"
          placeholder="Tours"
          :items="TOUR_OPTIONS"
          :icon="ICONS.tour"
          multiple
        />
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

      <template #name-header>
        <form-select-search
          v-if="filters"
          v-model="filters.tournaments"
          placeholder="Tournament"
          type="tournaments"
          :icon="ICONS.tournament"
        />
      </template>
      <template #name-cell="{ cell }">
        {{ cell.renderValue() }}
      </template>

      <template #established-header>
        <form-input
          v-if="filters"
          v-model="filters.established"
          type="number"
          placeholder="Year Established"
        />
      </template>
      <template #established-cell="{ cell }">
        {{ cell.renderValue() }}
      </template>

      <template #abolished-header>
        <form-input
          v-if="filters"
          v-model="filters.abolished"
          type="number"
          placeholder="Year Abolished"
        />
      </template>
      <template #abolished-cell="{ cell }">
        {{ cell.renderValue() }}
      </template>
    </u-table>

    <template #footer> {{ count }} tournament{{ count === 1 ? "" : "s" }} </template>
  </table-wrapper>
</template>
