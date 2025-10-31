<script setup lang="ts">
const { status, count, players } = defineProps<{
  players: PlayerInterface[]
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
const breakpoints = useBreakpoints(breakpointsTailwind, { ssrWidth: useSSRWidth() })
const mdAndDown = breakpoints.smallerOrEqual("md")

const grid = useTemplateRef<HTMLDivElement>("grid")
const currentYear = new Date().getFullYear()
const initialised = ref(false)

onMounted(() => {
  if (!grid.value) return
  useInfiniteScroll(
    grid.value,
    () => {
      // Ensure reset filters doesn't immediately trigger load more
      if (!get(initialised)) {
        set(initialised, true)
        return
      }
      set(skip, get(skip)! + 40)
    },
    {
      distance: 10,
      canLoadMore: () => {
        return get(status) !== "pending" && count > players.length
      }
    }
  )
})
</script>

<template>
  <u-container>
    <u-page>
      <template #left>
        <u-page-aside>
          <dev-only>
            <players-create :refresh />
          </dev-only>

          <u-button
            label="Reset Filters"
            :icon="ICONS.noFilter"
            @click="resetFilters"
            block
            size="xs"
            class="my-2"
          />

          <template v-if="filters">
            <u-checkbox-group
              legend="Tour"
              v-model="filters.tours"
              :items="['ATP', 'WTA']"
              :ui="{ item: 'ml-3' }"
            />

            <u-radio-group
              legend="Status"
              v-model="filters.status"
              :items="['Active', 'Inactive']"
              :ui="{ item: 'ml-3' }"
            />

            <form-select-search
              v-if="filters"
              v-model="filters.countries"
              placeholder="Select country"
              type="countries"
              :icon="ICONS.countries"
              block
            />

            <form-input
              v-if="filters"
              v-model="filters.min_year"
              type="number"
              placeholder="Year of First Tournament"
              block
            />

            <form-input
              v-if="filters"
              v-model="filters.max_year"
              type="number"
              placeholder="Year of Last Tournament"
              block
            />

            <form-select-search
              v-if="filters"
              v-model="filters.coaches"
              placeholder="Select coaches"
              type="coaches"
              :icon="ICONS.coach"
              block
            />
          </template>
        </u-page-aside>
      </template>

      <template #right>
        <u-page-aside>
          <form-command-palette-search
            v-if="filters"
            type="Players"
            v-model:model-value="filters.players"
          />
        </u-page-aside>
      </template>

      <u-page-header title="Players">
        <template
          #links
          v-if="mdAndDown"
        >
          <u-slideover
            title="Filters"
            class="ml-auto"
          >
            <u-button :icon="ICONS.filter" />

            <template #body>
              <div class="font-semibold">{{ count }} player{{ count === 1 ? "" : "s" }}</div>

              <dev-only>
                <players-create :refresh />
              </dev-only>

              <u-button
                label="Reset Filters"
                :icon="ICONS.noFilter"
                @click="resetFilters"
                block
                size="xs"
              />

              <div
                v-if="filters"
                class="flex flex-col gap-5"
              >
                <u-checkbox-group
                  legend="Tour"
                  v-model="filters.tours"
                  :items="['ATP', 'WTA']"
                  :ui="{ item: 'ml-3' }"
                />

                <u-radio-group
                  legend="Status"
                  v-model="filters.status"
                  :items="['Active', 'Inactive']"
                  :ui="{ item: 'ml-3' }"
                />

                <form-select-search
                  v-if="filters"
                  v-model="filters.players"
                  placeholder="Select players"
                  type="players"
                  :icon="ICONS.player"
                  block
                />

                <form-select-search
                  v-if="filters"
                  v-model="filters.countries"
                  placeholder="Select country"
                  type="countries"
                  :icon="ICONS.countries"
                  block
                />

                <form-input
                  v-if="filters"
                  v-model="filters.min_year"
                  type="number"
                  placeholder="Year of First Tournament"
                  block
                />

                <form-input
                  v-if="filters"
                  v-model="filters.max_year"
                  type="number"
                  placeholder="Year of Last Tournament"
                  block
                />

                <form-select-search
                  v-if="filters"
                  v-model="filters.coaches"
                  placeholder="Select coaches"
                  type="coaches"
                  :icon="ICONS.coach"
                  block
                />
              </div>
            </template>
          </u-slideover>
        </template>
      </u-page-header>

      <u-page-body>
        <u-page-grid
          v-if="(players.length && status === 'success') || status === 'pending'"
          ref="grid"
        >
          <u-page-card
            v-if="players.length"
            v-for="player in players"
            :key="player.id"
            highlight
            :highlight-color="player.tour"
            :to="!player.first_name ? { name: 'player', params: { id: player.id, name: '—' } } : undefined"
            :ui="{ root: 'h-full', body: 'w-full', leading: 'flex justify-between items-center w-full', footer: 'text-sm w-full' }"
          >
            <template #leading>
              <div v-if="player.country">
                <countries-link
                  :country="player.country"
                  icon-only
                />
              </div>

              <div class="flex items-center gap-2">
                <u-badge
                  :color="player.tour"
                  :label="player.tour"
                />

                <u-badge
                  :color="player.max_year === currentYear ? 'Active' : 'Inactive'"
                  :label="player.max_year === currentYear ? 'Active' : 'Inactive'"
                />
              </div>
            </template>

            <template #title>
              <u-link
                :to="{
                  name: 'player',
                  params: { id: player.id, name: player.first_name ? kebabCase(`${player.first_name} ${player.last_name}`) : '—' }
                }"
                class="hover-link default-link"
              >
                {{ player.first_name }} {{ player.last_name }}
              </u-link>
            </template>

            <template
              #description
              v-if="player.coaches"
            >
              <div class="font-semibold mb-1">Coaches:</div>
              <div
                v-for="coach in player.coaches"
                :key="coach.id"
                class="text-sm ml-3 flex flex-wrap items-center gap-2"
              >
                <dev-only>
                  <person-update
                    :person="coach"
                    type="Coach"
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

          <cards-loading-player
            v-if="status === 'pending'"
            v-for="_ in 6"
            :key="_"
          />
        </u-page-grid>

        <u-empty
          v-else
          title="No players found"
          :icon="ICONS.player"
          description="If you think this is an error, refresh the page. Otherwise, please be patient as we continue to add more data."
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
      </u-page-body>
    </u-page>
  </u-container>
</template>
