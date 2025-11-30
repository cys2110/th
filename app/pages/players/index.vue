<script setup lang="ts">
import { CountriesLink, UBadge } from "#components"
import type { TableColumn, TableRow } from "@nuxt/ui"

useHead({ title: "Players" })

const breakpoints = useBreakpoints(breakpointsTailwind, { ssrWidth: useSSRWidth() })
const mdAndDown = breakpoints.smallerOrEqual("md")
const {
  ui: { icons, colors }
} = useAppConfig()

// Pagination / view
const viewMode = ref(true)
const page = ref(1)
const itemsPerPage = ref(40)
const skip = computed(() => (page.value - 1) * itemsPerPage.value)
const currentYear = new Date().getFullYear()

// Filters
const players = ref([])
const countries = ref([])
const tours = ref([])
const coaches = ref([])
const min_year = ref<number>()
const max_year = ref<number>()
const status = ref<string>()

const resetFilters = () => {
  ;[tours, players, countries, coaches].forEach(filter => (filter.value = []))
  set(max_year, undefined)
  set(min_year, undefined)
  set(status, undefined)
}

// Sorting
const sortField = ref<SortFieldType>([{ field: "name", direction: "ASC" }])
const sortFields = [
  { label: "Name", value: "name" },
  { label: "Country", value: "country" },
  { label: "Year of First Tournament", value: "min_year" },
  { label: "Year of Last Tournament", value: "max_year" }
]
const resetSorting = () => {
  sortField.value = [{ field: "name", direction: "ASC" }]
}

watch([tours, players, countries, coaches, min_year, max_year, status, itemsPerPage, sortField], () => {
  set(page, 1)
})

// API call
const { data, status: apiStatus } = await useFetch("/api/players", {
  method: "POST",
  body: {
    skip,
    offset: itemsPerPage,
    sortField,
    players,
    tours,
    countries,
    coaches,
    min_year,
    max_year,
    status
  },
  default: () => ({ count: 0, players: [] })
})

const [defineEmptyTemplate, reuseEmptyTemplate] = createReusableTemplate()

// Table columns setup
const table = useTemplateRef<any>("table")
const columns: TableColumn<PlayerType>[] = [
  {
    accessorKey: "tour",
    header: "Tour",
    cell: cell => {
      const tour = cell.getValue<keyof typeof TourEnum>()
      return h(UBadge, { label: tour, color: tour as keyof typeof colors })
    }
  },
  {
    id: "status",
    accessorFn: row => (row.max_year === currentYear ? "Active" : "Inactive"),
    header: "Status",
    cell: cell => {
      const status = cell.getValue<keyof typeof colors>()
      return h(UBadge, { label: status, color: status })
    }
  },
  {
    accessorKey: "country",
    header: "Country",
    cell: cell => {
      const country = cell.getValue<CountryType>()
      if (country) {
        return h(CountriesLink, { country, iconOnly: true })
      } else {
        return cell.renderValue()
      }
    }
  },
  { id: "name", accessorFn: row => (row.first_name ? `${row.first_name} ${row.last_name}` : "-"), header: "Player" },
  { accessorKey: "min_year", header: "Year of First Tournament", cell: cell => cell.renderValue() },
  { accessorKey: "max_year", header: "Year of Last Tournament", cell: cell => cell.renderValue() },
  { accessorKey: "coaches", header: "Coaches" }
]

const handleSelect = async (e: Event, row: TableRow<PlayerType>) => {
  await navigateTo({
    name: "player",
    params: { id: row.original.id, name: row.original.first_name ? kebabCase(`${row.original.first_name} ${row.original.last_name}`) : "-" }
  })
}
</script>

<template>
  <u-container class="min-h-screen">
    <u-page>
      <template #left>
        <u-page-aside>
          <dev-only>
            <players-create />
          </dev-only>

          <u-button
            label="Reset Filters"
            :icon="ICONS.noFilter"
            @click="resetFilters"
            block
          />

          <u-button
            label="Reset Sorting"
            :icon="ICONS.sortAlpha"
            @click="resetSorting"
            block
          />

          <table-visibility
            v-if="!viewMode && table"
            :table
          />

          <u-checkbox-group
            legend="Tour"
            v-model="tours"
            :items="['ATP', 'WTA']"
            :ui="{ item: 'ml-3' }"
          />

          <u-radio-group
            legend="Status"
            v-model="status"
            :items="['Active', 'Inactive']"
            :ui="{ item: 'ml-3' }"
          />

          <form-search
            v-model="countries"
            placeholder="Select countries"
            type="Country"
            :icon="ICONS.countries"
            multiple
          />

          <form-input-label
            v-model="min_year"
            type="number"
            placeholder="First Tournament After"
          />

          <form-input-label
            v-model="max_year"
            type="number"
            placeholder="Last Tournament Before"
          />

          <form-search
            v-model="coaches"
            placeholder="Select coaches"
            type="Coach"
            :icon="ICONS.coach"
            multiple
          />

          <u-form-field label="Sort by">
            <u-field-group
              v-if="sortField.length"
              v-for="(field, index) in sortField"
              :key="field.field"
              class="w-full mb-2"
            >
              <u-select
                v-model="sortField[index]!.field"
                :items="sortFields"
                disabled
              />
              <u-select
                v-model="sortField[index]!.direction"
                :items="SORT_DIRECTIONS"
              />
              <u-button
                :icon="icons.close"
                color="error"
                @click="sortField.splice(index, 1)"
              />
            </u-field-group>
            <form-sort-field
              :sort-fields="sortFields"
              v-model="sortField"
            />
          </u-form-field>
        </u-page-aside>
      </template>

      <template #right>
        <u-page-aside>
          <form-command-palette-search
            type="Player"
            v-model="players"
            :icon="ICONS.player"
            multiple
          />
        </u-page-aside>
      </template>

      <u-page-header title="Players">
        <template #links>
          <u-tooltip :text="viewMode ? 'Cards' : 'Table'">
            <div>
              <u-switch
                v-model="viewMode"
                :checked-icon="ICONS.cards"
                :unchecked-icon="ICONS.table"
              />
            </div>
          </u-tooltip>

          <!--Filters for smaller screens-->
          <u-slideover
            v-if="mdAndDown"
            title="Filters"
            class="ml-auto"
          >
            <u-button :icon="ICONS.filter" />

            <template #body>
              <dev-only>
                <players-create />
              </dev-only>

              <u-button
                label="Reset Filters"
                :icon="ICONS.noFilter"
                @click="resetFilters"
                block
              />

              <u-button
                label="Reset Sorting"
                :icon="ICONS.sortAlpha"
                @click="resetSorting"
                block
              />

              <table-visibility
                v-if="!viewMode && table"
                :table
              />

              <form-search
                v-model="players"
                placeholder="Select players"
                type="Player"
                :icon="ICONS.player"
                multiple
              />

              <u-checkbox-group
                legend="Tour"
                v-model="tours"
                :items="['ATP', 'WTA']"
                :ui="{ item: 'ml-3' }"
              />

              <u-radio-group
                legend="Status"
                v-model="status"
                :items="['Active', 'Inactive']"
                :ui="{ item: 'ml-3' }"
              />

              <form-search
                v-model="countries"
                placeholder="Select countries"
                type="Country"
                :icon="ICONS.countries"
                multiple
              />

              <form-input-label
                v-model="min_year"
                type="number"
                placeholder="First Tournament After"
              />

              <form-input-label
                v-model="max_year"
                type="number"
                placeholder="Last Tournament Before"
              />

              <form-search
                v-model="coaches"
                placeholder="Select coaches"
                type="Coach"
                :icon="ICONS.coach"
                multiple
              />

              <u-form-field label="Sort by">
                <u-field-group
                  v-if="sortField.length"
                  v-for="(field, index) in sortField"
                  :key="field.field"
                  class="w-full mb-2"
                >
                  <u-select
                    v-model="sortField[index]!.field"
                    :items="sortFields"
                    disabled
                  />
                  <u-select
                    v-model="sortField[index]!.direction"
                    :items="SORT_DIRECTIONS"
                  />
                  <u-button
                    :icon="icons.close"
                    color="error"
                    @click="sortField.splice(index, 1)"
                  />
                </u-field-group>
                <form-sort-field
                  :sort-fields="sortFields"
                  v-model="sortField"
                />
              </u-form-field>
            </template>
          </u-slideover>
        </template>
      </u-page-header>

      <u-page-body class="h-full flex flex-col">
        <!--Empty template-->
        <define-empty-template>
          <empty
            message="No players found"
            :icon="ICONS.noPeople"
            class="mx-2"
          >
            <dev-only>
              <players-create />
            </dev-only>
          </empty>
        </define-empty-template>

        <div class="flex-1">
          <!--Card view-->
          <template v-if="viewMode">
            <u-page-columns v-if="data.count || apiStatus === 'pending'">
              <u-page-card
                v-if="data.count"
                v-for="player in data.players"
                :key="player.id"
                highlight
                :highlight-color="(player.tour as keyof typeof colors)"
                :title="`${player.first_name} ${player.last_name}`"
                :to="{
                  name: 'player',
                  params: { id: player.id, name: player.first_name ? kebabCase(`${player.first_name} ${player.last_name}`) : '—' }
                }"
                :ui="{ body: 'w-full', leading: 'flex justify-between items-center w-full', footer: 'text-sm w-full' }"
              >
                <template #leading>
                  <div>
                    <countries-link
                      v-if="player.country"
                      :country="player.country"
                      icon-only
                    />
                  </div>

                  <div class="flex items-center gap-2">
                    <u-badge
                      :color="(player.tour as keyof typeof colors)"
                      :label="player.tour"
                    />

                    <u-badge
                      :color="player.max_year === currentYear ? 'Active' : 'Inactive'"
                      :label="player.max_year === currentYear ? 'Active' : 'Inactive'"
                    />
                  </div>
                </template>

                <template
                  #description
                  v-if="player.coaches"
                >
                  <div class="mb-1 text-sm">Coaches:</div>
                  <div
                    v-for="coach in player.coaches"
                    :key="coach.id"
                    class="text-sm ml-3 flex items-center gap-2"
                  >
                    <dev-only>
                      <person-update
                        :person="coach"
                        type="Coach"
                      />

                      <template #fallback>
                        <u-link
                          v-if="coach.labels!.includes('Player')"
                          :to="{ name: 'player', params: { id: coach.id, name: kebabCase(`${coach.first_name} ${coach.last_name}`) } }"
                          class="hover-link default-link w-fit mx-auto"
                        >
                          {{ coach.first_name }} {{ coach.last_name }}
                        </u-link>
                        <span v-else>{{ coach.first_name }} {{ coach.last_name }}</span>
                      </template>
                    </dev-only>
                    <span
                      v-if="coach.years"
                      class="shrink-0"
                    >
                      ({{ coach.years }})
                    </span>
                  </div>
                </template>

                <template #footer>
                  Active:
                  {{
                    player.min_year && player.min_year === player.max_year
                      ? player.min_year
                      : player.min_year && player.max_year === currentYear
                      ? `${player.min_year} - present`
                      : player.min_year
                      ? `${player.min_year} - ${player.max_year}`
                      : "—"
                  }}
                </template>
              </u-page-card>

              <loading-base v-else />
            </u-page-columns>
            <reuse-empty-template v-else />
          </template>

          <!--Table view-->
          <u-table
            v-else
            ref="table"
            :data="data.players"
            :columns
            :loading="apiStatus === 'pending'"
            sticky
            @select="handleSelect"
            render-fallback-value="—"
            :ui="{ tbody: '[&>tr]:cursor-pointer', root: 'max-h-150' }"
          >
            <template #loading>
              <u-icon
                :name="icons.loading"
                class="size-8"
              />
            </template>
            <template #empty>
              <reuse-empty-template />
            </template>

            <template #coaches-cell="{ row }">
              <div
                v-if="row.original.coaches?.length"
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
                        v-if="coach.labels!.includes('Player')"
                        :to="{ name: 'player', params: { id: coach.id, name: kebabCase(`${coach.first_name} ${coach.last_name}`) } }"
                        class="hover-link default-link w-fit mx-auto"
                      >
                        {{ coach.first_name }} {{ coach.last_name }}
                      </u-link>
                      <span v-else>{{ coach.first_name }} {{ coach.last_name }}</span>
                    </template>
                  </dev-only>
                  <span v-if="coach.years">({{ coach.years }})</span>
                </div>
              </div>
              <template v-else>—</template>
            </template>
          </u-table>
        </div>

        <div class="sticky w-full z-50 bg-default bottom-0 mt-auto pt-3 pb-6">
          <div class="grid grid-cols-1 lg:grid-cols-3 justify-items-center">
            <div
              v-if="!mdAndDown"
              class="font-semibold text-muted"
            >
              {{ data.count }} player{{ data.count === 1 ? "" : "s" }}
            </div>

            <u-pagination
              v-model:page="page"
              :total="data.count"
              :sibling-count="mdAndDown ? 1 : 2"
              :items-per-page
              active-variant="subtle"
            />

            <u-form-field
              v-if="!mdAndDown"
              label="Items per page"
              class="w-4/5 ml-auto"
            >
              <u-slider
                v-model="itemsPerPage"
                :min="10"
                :max="100"
                :step="5"
                tooltip
              />
            </u-form-field>
          </div>
        </div>
      </u-page-body>
    </u-page>
  </u-container>
</template>
