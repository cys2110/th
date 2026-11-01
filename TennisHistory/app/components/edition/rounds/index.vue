<script setup lang="ts">
import { CURRENCY_MAPPING, formatCurrency, getColumnFilter, ICONS, setColumnFilter } from "#imports"
import type { TableColumn } from "@nuxt/ui"
import { isDefined, set, useArrayUnique } from "@vueuse/core"
import type { ColumnFiltersState } from "@tanstack/vue-table"

type Round = RoundType & { currency: string | null }
interface UpdatedRounds {
  [key: string]: {
    pm: number | null
    points: number | null
  }
}

interface BaseChartData {
  round: string
  number: number
}

type ChartData = BaseChartData & {
  [key: string]: string | number
}

type CurrencyCode = keyof typeof CURRENCY_MAPPING

const route = useRoute("edition")
const toast = useToast()
const supabase = useSupabaseClient()
const { ui } = useAppConfig()

const { isAdmin } = useAuthState()
const tournamentStore = useTournamentStore()

const editionId = computed(() => tournamentStore.ids.edition)

const updatedRounds = ref<UpdatedRounds>({})
const isSaving = ref(false)

const {
  data: edition,
  pending,
  refresh
} = useAsyncData(
  () => `rounds-${editionId.value}`,
  async () => {
    if (editionId.value) {
      const { data, error } = await supabase
        .schema("tennis")
        .from("events")
        .select("id, tour, currency, edition:editions(currency), rounds(*)")
        .eq("edition_id", editionId.value)
        .order("tour", { ascending: true })
        .order("match_type", { referencedTable: "rounds", ascending: true })
        .order("number", { referencedTable: "rounds", ascending: true })

      if (error || !data) {
        console.error("Error fetching rounds", error)
        return {
          events: [],
          rounds: []
        }
      }

      const rounds: Round[] = data.flatMap(event => {
        const currency = event.edition?.currency || event.currency

        return event.rounds.map(r => ({
          ...r,
          currency
        }))
      })

      return {
        events: data.map(event => {
          const currency = event.edition?.currency || event.currency

          return {
            event_id: event.id,
            tour: event.tour as TourEnum,
            currency
          }
        }),
        rounds
      }
    }

    return {
      events: [],
      rounds: []
    }
  },
  { default: () => ({ events: [], rounds: [] }) }
)

const multipleTours = computed(() => edition.value.events.length > 1)
const multipleCurrencies = computed(() => new Set(edition.value.events.map(event => event.currency).filter(isDefined)).size > 1)

const columns: Array<TableColumn<RoundType & { currency: string | null }>> = [
  { id: "checkbox" },
  { accessorKey: "tour", header: "Tour" },
  { accessorKey: "match_type", header: "S/D" },
  { accessorKey: "number", header: "Round" },
  { accessorKey: "pm", header: "Prize Money" },
  { accessorKey: "points", header: "Points" }
]

const columnFilters = ref<ColumnFiltersState>([])

const columnVisibility = computed(() => ({
  checkbox: isAdmin.value,
  tour: edition.value.events.length > 1
}))

const handleSave = async () => {
  set(isSaving, true)

  const errors: UpdatedRounds = {}

  for (const [roundId, value] of Object.entries(updatedRounds.value)) {
    const { error } = await supabase.schema("tennis").from("rounds").update(value).eq("id", roundId)

    if (error) {
      console.error("Error updating round", roundId, error)
      errors[roundId] = value
    }
  }

  const hasErrors = Object.keys(errors).length > 0

  toast.add({
    title: hasErrors ? "Error updating rounds" : "Rounds successfully updated",
    icon: ui.icons[hasErrors ? "error" : "success"],
    color: hasErrors ? "error" : "success"
  })

  set(updatedRounds, hasErrors ? errors : {})
  set(isSaving, false)
  refresh()
}

const chartData = computed<ChartData[]>(() => {
  const allRounds = edition.value.rounds as Round[]
  const uniqueRounds = useArrayUnique(allRounds.map(r => r.number)).value.sort((a, b) => a - b)

  return uniqueRounds.map(rn => {
    const matchingRounds = allRounds.filter(r => r.number === rn)

    const round: ChartData = {
      round: matchingRounds[0]!.round,
      number: rn
    }

    matchingRounds.forEach(r => {
      if (r.tour && isDefined(r.pm)) {
        round[`${r.tour} - ${r.match_type}`] = r.pm
      }
    })

    return round
  })
})

const chartCategories = computed(() => {
  const categories: ChartCategory[] = []

  const firstItem = chartData.value[0]

  if (firstItem) {
    const itemCategories = Object.keys(firstItem).filter(k => k !== "round" && k !== "number")

    itemCategories.forEach(c => {
      const [tour, match_type] = c.split(" - ")

      categories.push({
        label: `${multipleTours.value ? c : match_type}${multipleCurrencies.value ? ` (${getCurrency(tour as TourEnum)})` : ""}`,
        key: c,
        color: CHART_COLOURS[c as keyof typeof CHART_COLOURS]
      })
    })
  }

  return categories
})

const getCurrency = (tour: TourEnum) => {
  const currency = edition.value.events.find(ev => ev.tour === tour)?.currency

  if (currency) {
    return CURRENCY_MAPPING[currency as keyof typeof CURRENCY_MAPPING]
  }
}

const formatChartValue = (value: number) => {
  if (multipleCurrencies.value) return value.toLocaleString()

  const currency = (edition.value.events[0]?.currency || "USD") as CurrencyCode
  return `${CURRENCY_MAPPING[currency]}${value.toLocaleString()}`
}
</script>

<template>
  <u-container class="max-w-6xl my-6 space-y-6">
    <u-chart
      v-if="edition.rounds.length"
      type="area"
      :data="chartData"
      index="round"
      :categories="chartCategories"
      curve="monotone"
      :format="formatChartValue"
      :height="400"
    />

    <div class="flex justify-end gap-3">
      <u-select-menu
        v-if="edition.events.length > 1"
        :items="edition.events"
        label-key="tour"
        value-key="tour"
        placeholder="Tour"
        clear
        :model-value="<TourEnum>getColumnFilter('tour', columnFilters)"
        @update:model-value="columnFilters = setColumnFilter('tour', $event, columnFilters)"
      />

      <u-select-menu
        :items="['Singles', 'Doubles']"
        placeholder="S/D"
        clear
        :model-value="<MatchTypeEnum>getColumnFilter('match_type', columnFilters)"
        @update:model-value="columnFilters = setColumnFilter('match_type', $event, columnFilters)"
      />

      <u-select-menu
        :items="['Main', 'Qualifying']"
        placeholder="Draw"
        clear
        :model-value="<DrawEnum>getColumnFilter('draw', columnFilters)"
        @update:model-value="columnFilters = setColumnFilter('draw', $event, columnFilters)"
      />

      <u-field-group v-if="isAdmin">
        <lazy-edition-rounds-create
          v-if="edition.events.length"
          hydrate-on-idle
          @refresh="refresh"
          :options="edition.events"
        />

        <u-button
          :icon="ui.icons.reload"
          @click="refresh()"
        />

        <u-button
          :icon="ICONS.save"
          :loading="isSaving"
          :loading-icon="ICONS.uploading"
          @click="handleSave"
        />
      </u-field-group>
    </div>

    <u-table
      :data="edition.rounds"
      :columns
      :loading="pending"
      v-model:column-visibility="columnVisibility"
      v-model:column-filters="columnFilters"
      sticky
      render-fallback-value="—"
      :meta="{
        class: {
          tr: row => (row.original.draw === 'Qualifying' ? 'bg-elevated/50' : '')
        }
      }"
    >
      <template #loading>
        <loading-icon />
      </template>

      <template #empty>
        <empty
          :icon="ICONS.moneyOff"
          :title="`No round information available for ${tournamentStore.name} ${route.params.year}`"
          @refresh="refresh"
          class="mx-2"
        />
      </template>

      <template #checkbox-header="{ table }">
        <u-checkbox
          :model-value="
            Object.keys(updatedRounds).length === table.getFilteredRowModel().rows.length ? true
            : Object.keys(updatedRounds).length ? 'indeterminate'
            : false
          "
          @update:model-value="
            () => {
              if (Object.keys(updatedRounds).length) {
                updatedRounds = {}
              } else {
                table.getFilteredRowModel().rows.map(
                  row =>
                    (updatedRounds[row.original.id!] = {
                      pm: row.original.pm,
                      points: row.original.points
                    })
                )
              }
            }
          "
          :icon="ICONS.ranking"
        />
      </template>

      <template #checkbox-cell="{ row }">
        <u-checkbox
          :model-value="row.original.id in updatedRounds"
          @update:model-value="
            () => {
              if (row.original.id in updatedRounds) {
                delete updatedRounds[row.original.id!]
              } else {
                updatedRounds[row.original.id] = {
                  pm: row.original.pm,
                  points: row.original.points
                }
              }
            }
          "
          :icon="ICONS.ranking"
        />
      </template>

      <template #tour-cell="{ row }">
        <u-badge
          v-if="row.original.tour"
          :label="row.original.tour"
          :color="row.original.tour"
        />
      </template>

      <template #match_type-cell="{ row }">
        <u-badge
          v-if="row.original.match_type"
          :label="row.original.match_type"
          :color="row.original.match_type"
        />
      </template>

      <template #number-cell="{ row }">
        {{ row.original.round }}
      </template>

      <template #pm-cell="{ row }">
        <form-input-number
          v-if="row.original.id in updatedRounds"
          v-model="updatedRounds[row.original.id]!.pm"
          placeholder="PM"
          :currency="row.original.currency || 'USD'"
          class="max-w-25"
        />

        <div v-else>
          {{ isDefined(row.original.pm) ? formatCurrency(row.original.pm, row.original.currency) : "—" }}
        </div>
      </template>

      <template #points-cell="{ row }">
        <form-input-number
          v-if="row.original.id in updatedRounds"
          v-model="updatedRounds[row.original.id]!.points"
          placeholder="Points"
          class="max-w-25"
        />

        <div v-else>
          {{ isDefined(row.original.points) ? row.original.points.toLocaleString() : "—" }}
        </div>
      </template>
    </u-table>
  </u-container>
</template>
