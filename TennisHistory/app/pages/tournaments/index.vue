<script setup lang="ts">
import type { TableRow } from "@nuxt/ui"

useHead({ title: "Tournaments" })
const router = useRouter()

const viewMode = ref(true)
const page = useRouteQuery("page", 1, { transform: Number })
const itemsPerPage = ref(30)
const skip = computed(() => (page.value - 1) * itemsPerPage.value)

const [defineEmptyTemplate, reuseEmptyTemplate] = createReusableTemplate()

const tours = ref([])
const tournaments = ref([])
const established = ref<number | undefined>()
const abolished = ref<number | undefined>()
const resetFilters = () => {
  const arrayFilters = [tours, tournaments]
  const undefinedFilters = [established, abolished]
  arrayFilters.forEach(filter => set(filter, []))
  undefinedFilters.forEach(filter => set(filter, undefined))
}

const sortField = ref<SortFieldType[]>([])
const sortFields = [
  { label: "Name", value: "name" },
  { label: "Established", value: "established" },
  { label: "Abolished", value: "abolished" }
]
const resetSorting = () => set(sortField, [])

// Reset page on filter/sort change
watchDeep(
  [tours, tournaments, established, abolished, itemsPerPage, sortField],
  () => {
    set(page, 1)
  },
  { immediate: true }
)

// API call
const { data, status } = await useFetch("/api/tournaments", {
  method: "POST",
  body: {
    skip,
    offset: itemsPerPage,
    sortField,
    tournaments,
    tours,
    established,
    abolished
  },
  default: () => ({ count: 0, tournaments: [] })
})

const table = useTemplateRef<any>("table")
const handleSelect = (e: Event, row: TableRow<TournamentType>) => {
  router.push({
    name: "tournament",
    params: {
      id: row.original.id,
      name: kebabCase(row.original.name)
    }
  })
}
</script>

<template>
  <u-container class="min-h-screen flex flex-col">
    <u-page class="flex-1">
      <template #left>
        <u-page-aside>
          <dev-only>
            <tournaments-update />
            <u-separator />
          </dev-only>

          <filters
            :filters="['tours', 'established', 'abolished']"
            :reset-filters
            :reset-sorting
            :table
            v-model:tours="tours"
            v-model:established="established"
            v-model:abolished="abolished"
            v-model:sorting="sortField"
            :sort-fields="sortFields"
          />
        </u-page-aside>
      </template>

      <template #right>
        <u-page-aside>
          <form-command-palette-search
            type="Tournament"
            v-model="tournaments"
            :icon="ICONS.tournament"
          />
        </u-page-aside>
      </template>

      <u-page-header title="Tournaments">
        <template #links>
          <view-switcher v-model="viewMode" />

          <!--Filters for smaller screens-->
          <u-slideover
            title="Filters"
            class="ml-auto lg:hidden"
          >
            <u-button :icon="ICONS.filter" />

            <template #body>
              <filters
                :filters="['tours', 'established', 'abolished', 'tournaments']"
                :reset-filters
                :reset-sorting
                :table
                v-model:tournaments="tournaments"
                v-model:tours="tours"
                v-model:established="established"
                v-model:abolished="abolished"
                v-model:sorting="sortField"
                :sort-fields="sortFields"
              />
            </template>
          </u-slideover>
        </template>
      </u-page-header>

      <u-page-body>
        <!--Empty template-->
        <define-empty-template>
          <empty
            message="No tournaments found"
            :icon="ICONS.tournament"
            class="mx-2"
          >
            <dev-only>
              <tournaments-update />
            </dev-only>
          </empty>
        </define-empty-template>

        <template v-if="viewMode">
          <u-page-grid v-if="data.count || status === 'pending'">
            <tournaments-card
              v-if="data.count"
              v-for="tournament in data.tournaments"
              :key="tournament.id.toString()"
              :tournament
            />

            <loading-tournament
              v-else
              v-for="_ in 6"
              :key="_"
            />
          </u-page-grid>

          <reuse-empty-template v-else />
        </template>

        <u-table
          v-else
          ref="table"
          :data="data.tournaments"
          :columns="tournamentColumns"
          :loading="status === 'pending'"
          sticky
          @select="handleSelect"
          render-fallback-value="—"
          :ui="{
            root: 'max-h-150',
            tbody: '[&>tr]:cursor-pointer'
          }"
        >
          <template #loading>
            <loading-icon />
          </template>
          <template #empty>
            <reuse-empty-template />
          </template>
        </u-table>
      </u-page-body>
    </u-page>

    <counts
      :total="data.count"
      type="tournament"
      v-model:page="page"
      v-model:items-per-page="itemsPerPage"
    />
  </u-container>
</template>
