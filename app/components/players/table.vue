<script setup lang="ts">
import type { TableColumn, TableRow } from "@nuxt/ui"

const { status, count, players } = defineProps<{
  players: PlayerInterface[]
  resetFilters: () => void
  count: number
  status: APIStatusType
  refresh: () => void
}>()

const {
  ui: { icons, colors }
} = useAppConfig()

const skip = defineModel<number>("skip")
const filters = defineModel<Partial<FiltersInterface>>("filters")
const currentYear = new Date().getFullYear()
const initialised = ref(false)
const table = useTemplateRef<any>("table")

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
        return status !== "pending" && count > players.length
      }
    }
  )
})

const columns: TableColumn<PlayerInterface>[] = [
  { accessorKey: "tour" },
  { id: "status", accessorFn: row => (row.max_year === currentYear ? "Active" : "Inactive") },
  { accessorKey: "country" },
  { id: "name", accessorFn: row => (row.first_name ? `${row.first_name} ${row.last_name}` : "-"), footer: () => `${count} players` },
  { accessorKey: "min_year" },
  { accessorKey: "max_year" },
  { accessorKey: "coaches" }
]

const handleSelect = async (e: Event, row: TableRow<PlayerInterface>) => {
  await navigateTo({
    name: "player",
    params: { id: row.original.id, name: row.original.first_name ? kebabCase(`${row.original.first_name} ${row.original.last_name}`) : "-" }
  })
}
</script>

<template>
  <table-wrapper>
    <template #toolbar>
      <dev-only>
        <players-create />
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
      :data="players"
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
          title="No players found"
          :icon="ICONS.player"
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
              <players-create :refresh />
            </dev-only>
          </template>
        </u-empty>
      </template>

      <template #tour-header>
        <form-select-menu
          v-if="filters"
          v-model="filters.tours"
          :items="[TourEnum['ATP'], TourEnum['WTA']]"
          placeholder="Tour"
          :icon="ICONS.tour"
        />
      </template>
      <template #tour-cell="{ row }">
        <u-badge
          :label="TourEnum[row.original.tour]"
          :color="row.original.tour"
        />
      </template>

      <template #status-header>
        <form-select-menu
          v-if="filters"
          v-model="filters.status"
          :items="['Active', 'Inactive']"
          placeholder="Status"
          :icon="ICONS.tennis"
        />
      </template>
      <template #status-cell="{ cell }">
        <u-badge
          :label="(cell.getValue() as string)"
          :color="(cell.getValue() as keyof typeof colors )"
        />
      </template>

      <template #country-header>
        <form-select-search
          v-if="filters"
          v-model="filters.countries"
          placeholder="Country"
          type="countries"
          :icon="ICONS.countries"
        />
      </template>
      <template #country-cell="{ row }">
        <countries-link
          v-if="row.original.country"
          :country="row.original.country"
          icon-only
        />
        <template v-else>—</template>
      </template>

      <template #name-header>
        <form-select-search
          v-if="filters"
          v-model="filters.players"
          placeholder="Player"
          type="players"
          :icon="ICONS.player"
        />
      </template>
      <template #name-cell="{ cell }">
        {{ cell.renderValue() }}
      </template>

      <template #min_year-header>
        <form-input
          v-if="filters"
          v-model="filters.min_year"
          type="number"
          placeholder="Year of First Tournament"
        />
      </template>
      <template #min_year-cell="{ cell }">
        {{ cell.renderValue() }}
      </template>

      <template #max_year-header>
        <form-input
          v-if="filters"
          v-model="filters.max_year"
          type="number"
          placeholder="Year of Last Tournament"
        />
      </template>
      <template #max_year-cell="{ cell }">
        {{ cell.renderValue() }}
      </template>

      <template #coaches-header>
        <form-select-search
          v-if="filters"
          v-model="filters.coaches"
          placeholder="Coach"
          type="coaches"
          :icon="ICONS.coach"
        />
      </template>
      <template #coaches-cell="{ row }">
        <div
          v-for="coach in row.original.coaches"
          :key="coach.id"
        >
          <div class="flex flex-col justify-center">
            <dev-only>
              <person-update
                type="Coach"
                :person="coach"
              />
              <template #fallback>
                <u-link
                  v-if="coach.labels.includes('Player')"
                  class="hover-link default-link w-fit mx-auto"
                >
                  {{ coach.first_name }} {{ coach.last_name }}
                </u-link>
                <span v-else>{{ coach.first_name }} {{ coach.last_name }}</span>
              </template>
            </dev-only>
            <span v-if="coach.years"> ({{ coach.years }}) </span>
          </div>
        </div>
      </template>
    </u-table>
  </table-wrapper>
</template>
