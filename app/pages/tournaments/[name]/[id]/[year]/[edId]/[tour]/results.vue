<script setup lang="ts">
import { MatchesUpdate, PlayersLink, UBadge, UButton, ULink } from "#components"
import { CalendarDate } from "@internationalized/date"
import type { TableColumn, TableRow } from "@nuxt/ui"
import { createColumnHelper } from "@tanstack/vue-table"
definePageMeta({ name: "results" })

const breakpoints = useBreakpoints(breakpointsTailwind, { ssrWidth: useSSRWidth() })
const mdAndDown = breakpoints.smallerOrEqual("md")
const {
  ui: { icons }
} = useAppConfig()
const {
  params: { id, name, year, edId, tour }
} = useRoute("results")
const toast = useToast()
const { devMode } = useRuntimeConfig().public

const viewMode = ref(true)
const updating = ref(false)

const updateTiebreaks = async () => {
  set(updating, true)
  try {
    const response = await $fetch("/api/matches/tiebreaks", {
      query: { id: edId }
    })
    if ((response as any).ok) {
      toast.add({
        title: "Tiebreaks updated successfully",
        icon: icons.check,
        color: "success"
      })
      refresh()
    } else {
      toast.add({
        title: "Error updating tiebreaks",
        description: (response as any).message,
        icon: icons.error,
        color: "error"
      })
    }
  } catch (e) {
    toast.add({
      title: "Error updating tiebreaks",
      description: (e as Error).message,
      icon: icons.error,
      color: "error"
    })
  } finally {
    set(updating, false)
  }
}

// Filters
const matchType = ref<MatchTypeEnumType>()
const drawType = ref<DrawEnumType>()
const round = ref<string>()
const date = ref<CalendarDate>()
const players = ref([])

const resetFilters = () => {
  matchType.value = undefined
  drawType.value = undefined
  round.value = undefined
  date.value = undefined
  players.value = []
}

// API calls
const { data: rounds } = await useFetch("/api/events/rounds", {
  query: { edId, tour },
  default: () => ROUND_OPTIONS
})

const { data: dates } = await useFetch("/api/events/dates", {
  query: { edId, tour }
})

const apiId = computed(() => {
  return `${edId}-${tour}`
})

const { data, status, refresh } = await useFetch("/api/events/results", {
  method: "POST",
  body: {
    id: apiId,
    matchType,
    drawType,
    round,
    date,
    players
  },
  default: () => []
})

const [defineEmptyTemplate, reuseEmptyTemplate] = createReusableTemplate()

const matches = computed(() => {
  const consolidatedData = []

  for (const round of rounds.value) {
    const roundMatches = data.value.filter(m => m.round === round)
    consolidatedData.push({ title: round, matches: roundMatches })
  }
  return consolidatedData
})

const table = useTemplateRef<any>("table")
const columnHelper = createColumnHelper<MatchType>()

const columns = computed<TableColumn<MatchType>[]>(() => [
  {
    accessorKey: "type",
    header: "S/D",
    cell: ({ row }) => h(UBadge, { label: row.original.type, color: row.original.type })
  },
  { accessorKey: "round", header: "Round" },
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => {
      if (row.original.date) {
        return useDateFormat(row.original.date, "dddd DD MMMM YYYY").value
      }
    }
  },
  { accessorKey: "duration", header: "Duration" },
  { accessorKey: "court", header: "Court" },
  { accessorKey: "umpire.id", header: "Umpire" },
  columnHelper.group({
    header: "Winner",
    columns: [
      {
        accessorKey: "winner.team",
        header: "",
        cell: ({ row }) => {
          return row.original.winner?.team.map(p =>
            h(PlayersLink, {
              key: p.id,
              player: p,
              class: "mx-auto"
            })
          )
        }
      },
      {
        id: "winner_status",
        header: "",
        cell: ({ row }) => {
          if (row.original.winner) {
            const { seed, q_seed, status, q_status } = row.original.winner

            if (row.original.draw === "Main" && (seed || status)) {
              return `${seed ?? ""}${seed && status ? " " : ""}${status ?? ""}`
            }

            if (row.original.draw === "Qualifying" && (q_seed || q_status)) {
              return `${q_seed ?? ""}${q_seed && q_status ? " " : ""}${q_status ?? ""}`
            }
          }
        }
      }
    ]
  }),
  columnHelper.group({
    header: "Loser",
    columns: [
      {
        accessorKey: "loser.team",
        header: "",
        cell: ({ row }) => {
          return row.original.loser?.team.map(p =>
            h(PlayersLink, {
              key: p.id,
              player: p,
              class: "mx-auto"
            })
          )
        }
      },
      {
        id: "loser_status",
        header: "",
        cell: ({ row }) => {
          if (row.original.loser) {
            const { seed, q_seed, status, q_status } = row.original.loser

            if (row.original.draw === "Main" && (seed || status)) {
              return `${seed ?? ""}${seed && status ? " " : ""}${status ?? ""}`
            }

            if (row.original.draw === "Qualifying" && (q_seed || q_status)) {
              return `${q_seed ?? ""}${q_seed && q_status ? " " : ""}${q_status ?? ""}`
            }
          }
        }
      }
    ]
  }),
  { id: "score", header: "Score" },
  {
    id: "head to head",
    header: "",
    cell: ({ row }) =>
      h(UButton, {
        label: "H2H",
        icon: ICONS.h2h,
        to: {
          name: "head-to-head",
          params: {
            p1Name: row.original.winner!.team.map(p => kebabCase(`${p.first_name}-${p.last_name}`)).join("+"),
            p2Name: row.original.loser!.team.map(p => kebabCase(`${p.first_name}-${p.last_name}`)).join("+"),
            p1Id: row.original.winner!.team.map(p => p.id).join("+"),
            p2Id: row.original.loser!.team.map(p => p.id).join("+")
          }
        }
      })
  }
])

const columnPinning = ref({
  left: ["round"],
  right: []
})

const handleSelect = async (e: Event, row: TableRow<MatchType>) => {
  await navigateTo({
    name: "match",
    params: {
      id,
      name,
      year,
      edId,
      tour,
      mid: constructMid(row.original.draw!, row.original.type!, row.original.match_no)
    }
  })
}
</script>

<template>
  <events-wrapper>
    <template #page-left>
      <dev-only>
        <u-button
          @click="updateTiebreaks"
          :icon="updating ? ICONS.uploading : icons.upload"
          label="Update tiebreaks"
          block
        />

        <matches-update />
      </dev-only>

      <u-button
        label="Reset Filters"
        :icon="ICONS.noFilter"
        @click="resetFilters"
        block
      />

      <table-visibility
        v-if="!viewMode && table"
        :table
      />

      <u-radio-group
        v-model="matchType"
        legend="S/D"
        :items="['Singles', 'Doubles']"
        :ui="{ item: 'ml-3' }"
      />

      <u-radio-group
        v-model="drawType"
        legend="Draw"
        :items="['Main', 'Qualifying']"
        :ui="{ item: 'ml-3' }"
      />

      <form-input-menu
        placeholder="Filter by Round"
        v-model="round"
        :items="rounds"
      />

      <form-date-picker
        v-model="date"
        :min="dates?.start_date"
        :max="dates?.end_date"
      />
    </template>

    <template #page-right>
      <u-page-aside>
        <form-command-palette-search
          type="PlayerEntry"
          v-model="players"
          :icon="ICONS.player"
          :id="`${edId}-${tour}`"
          placeholder="Players"
          multiple
        />
      </u-page-aside>
    </template>

    <template #header-links>
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
            <u-button
              @click="updateTiebreaks"
              :icon="updating ? ICONS.uploading : icons.upload"
              label="Update tiebreaks"
              block
            />

            <matches-update />
          </dev-only>

          <u-button
            label="Reset Filters"
            :icon="ICONS.noFilter"
            @click="resetFilters"
            block
          />

          <table-visibility
            v-if="!viewMode && table"
            :table
          />

          <form-search
            type="PlayerEntry"
            v-model="players"
            :icon="ICONS.player"
            :id="`${edId}-${tour}`"
            placeholder="Players"
            multiple
          />

          <u-radio-group
            v-model="matchType"
            legend="S/D"
            :items="['Singles', 'Doubles']"
            :ui="{ item: 'ml-3' }"
          />

          <u-radio-group
            v-model="drawType"
            legend="Draw"
            :items="['Main', 'Qualifying']"
            :ui="{ item: 'ml-3' }"
          />

          <form-input-menu
            placeholder="Filter by Round"
            v-model="round"
            :items="rounds"
          />

          <form-date-picker
            v-model="date"
            :min="dates?.start_date"
            :max="dates?.end_date"
          />
        </template>
      </u-slideover>
    </template>

    <define-empty-template>
      <empty
        message="No matches found"
        class="mx-2"
      />
    </define-empty-template>

    <template v-if="viewMode">
      <u-stepper
        v-if="matches.length"
        :items="matches"
        :linear="false"
      >
        <template #indicator="{ item }">
          {{ roundEnum[item.title as keyof typeof roundEnum] }}
        </template>

        <template #content="{ item }">
          <u-page-columns class="lg:columns-2">
            <u-card
              v-for="match in item.matches"
              :key="match.id"
              :ui="{ root: devMode && !match.stats ? 'ring-warning' : 'ring-primary', header: 'text-sm', footer: 'flex justify-center' }"
            >
              <template #header>
                <div class="flex justify-between">
                  <div>Date: {{ match.date ? useDateFormat(match.date, "dddd DD MMMM YYYY") : "—" }}</div>
                  <div>Duration: {{ match.duration ?? "—" }}</div>
                </div>
                <div class="flex justify-between">
                  <div>Court: {{ match.court ?? "—" }}</div>
                  <div>Umpire: {{ match.umpire?.id ?? "—" }}</div>
                </div>
              </template>

              <div class="grid grid-rows-2 grid-flow-col gap-3 items-center">
                <!--Players-->
                <div>
                  <players-link
                    v-if="match.winner"
                    v-for="player in match.winner.team"
                    :key="player.id"
                    :player
                  />
                </div>
                <div>
                  <players-link
                    v-if="match.loser"
                    v-for="player in match.loser.team"
                    :key="player.id"
                    :player
                  />
                </div>

                <!--Status-->
                <div class="text-sm text-muted">
                  <span v-if="match.draw === 'Main' && (match.winner?.seed || match.winner?.status)">
                    ({{ match.winner?.seed ?? "" }}{{ match.winner?.seed && match.winner?.status ? " " : "" }}{{ match.winner?.status ?? "" }})
                  </span>
                  <span v-else-if="match.draw === 'Qualifying' && (match.winner?.q_seed || match.winner?.q_status)">
                    ({{ match.winner?.q_seed ?? "" }}{{ match.winner?.q_seed && match.winner?.q_status ? " " : ""
                    }}{{ match.winner?.q_status ?? "" }})
                  </span>
                </div>

                <div class="text-sm text-muted">
                  <span v-if="match.draw === 'Main' && (match.loser?.seed || match.loser?.status)">
                    ({{ match.loser?.seed ?? "" }}{{ match.loser?.seed && match.loser?.status ? " " : "" }}{{ match.loser?.status ?? "" }})
                  </span>
                  <span v-else-if="match.draw === 'Qualifying' && (match.loser?.q_seed || match.loser?.q_status)">
                    ({{ match.loser?.q_seed ?? "" }}{{ match.loser?.q_seed && match.loser?.q_status ? " " : "" }}{{ match.loser?.q_status ?? "" }})
                  </span>
                </div>

                <!--Winner / Incomplete-->
                <div>
                  <u-icon
                    :name="icons.success"
                    class="text-success"
                  />
                </div>
                <div>
                  <u-badge
                    v-if="match.incomplete"
                    :label="`${match.incomplete}.`"
                    color="error"
                  />
                </div>

                <!--Score-->
                <div
                  class="grid text-center"
                  :class="`grid-cols-${match.noOfSets}`"
                >
                  <div
                    v-for="(set, index) in match.sets?.[0]"
                    :key="`winner-${index}`"
                  >
                    {{ set[0] }}<sup v-if="isDefined(set[1])">{{ set[1] }}</sup>
                  </div>
                </div>

                <div
                  class="grid text-center"
                  :class="`grid-cols-${match.noOfSets}`"
                >
                  <div
                    v-for="(set, index) in match.sets?.[1]"
                    :key="`loser-${index}`"
                  >
                    {{ set[0] }}<sup v-if="isDefined(set[1])">{{ set[1] }}</sup>
                  </div>
                </div>
              </div>

              <template #footer>
                <u-field-group>
                  <u-button
                    label="Stats"
                    :icon="ICONS.stats"
                    :disabled="!match.stats && !devMode"
                    :to="{ name: 'match', params: { name, id, year, edId, tour, mid: constructMid(match.draw!, match.type!, match.match_no) } }"
                  />

                  <u-button
                    label="H2H"
                    :icon="ICONS.h2h"
                    :to="{ name: 'head-to-head', params: { p1Name: match.winner!.team.map(p => kebabCase(`${p.first_name}-${p.last_name}`)).join('+'), p2Name: match.loser!.team.map(p => kebabCase(`${p.first_name}-${p.last_name}`)).join('+'), p1Id: match.winner!.team.map(p => p.id).join('+'), p2Id: match.loser!.team.map(p => p.id).join('+') } }"
                  />
                </u-field-group>
              </template>
            </u-card>
          </u-page-columns>
        </template>
      </u-stepper>

      <reuse-empty-template v-else />
    </template>

    <!--Table view-->
    <u-table
      v-else
      ref="table"
      :data="data"
      :columns
      :loading="status === 'pending'"
      sticky
      v-model:column-pinning="columnPinning"
      render-fallback-value="—"
      @select="handleSelect"
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

      <template #score-cell="{ row }">
        <div class="flex justify-center items-center">
          <div
            v-if="row.original.sets?.[0]?.length"
            class="flex items-center gap-1 mr-2"
          >
            <span
              v-for="(set, index) in row.original.sets[0]"
              :key="index"
            >
              {{ set[0] }}{{ row.original.sets[1]![index]![0]
              }}<sup v-if="isDefined(set[1]) && isDefined(row.original.sets[1]![index]![1])">{{
                set[1] < row.original.sets[1]![index]![1] ? set[1] : row.original.sets[1]![index]![1]
              }}</sup>
            </span>
          </div>
          <u-badge
            v-if="row.original.incomplete"
            :label="`${row.original.incomplete}.`"
            color="error"
          />
        </div>
      </template>
    </u-table>
  </events-wrapper>
</template>
