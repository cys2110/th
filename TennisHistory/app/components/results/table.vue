<script setup lang="ts">
import type { TableColumn, TableRow } from "@nuxt/ui"
import { getFacetedRowModel, getFacetedUniqueValues } from "@tanstack/vue-table"
import { parseDate } from "@internationalized/date"
import { LazyMatchCreate, UButton, UFieldGroup } from "#components"

const props = defineProps<{
  matches: Array<ResultsMatchInterface>
  pending: boolean
}>()

const emits = defineEmits<{ refresh: [] }>()

const {
  params: { id, name, edId, year }
} = useRoute("results")

const {
  ui: { icons }
} = useAppConfig()

const router = useRouter()
const toast = useToast()
const supabase = useSupabaseClient()
const { dev } = useRuntimeConfig().public

const tournamentStore = useTournamentStore()
const isSaving = ref(false)
const updatedMatches = ref<Record<string, any>>({})

const mapping = computed(() => {
  const roundMap = new Map()

  props.matches.forEach(match => roundMap.set(match.round.number, match.round.round))

  return Object.fromEntries(roundMap)
})

const columns: Array<TableColumn<ResultsMatchInterface>> = [
  { id: "checkbox" },
  { accessorKey: "tour" },
  { accessorKey: "match_type" },
  {
    accessorKey: "round.number",
    filterFn: numberFilter,
    ...(dev && {
      footer: () =>
        h(UFieldGroup, { class: "w-fit" }, () => [
          h(LazyMatchCreate, { hydrateOnIdle: true, onRefresh: () => emits("refresh") }),
          h(UButton, { icon: icons.reload, onClick: () => emits("refresh") }),
          h(UButton, {
            icon: isSaving.value ? ICONS.uploading : ICONS.save,
            onClick: handleSave,
            disabled: isSaving.value || !Object.keys(updatedMatches.value).length
          })
        ])
    })
  },
  { accessorKey: "date" },
  { accessorKey: "court", filterFn: "arrIncludesSome" },
  { id: "umpire", accessorFn: row => (row.umpire ? `${row.umpire.last_name}, ${row.umpire.first_name}` : undefined), filterFn: "arrIncludesSome" },
  {
    accessorKey: "duration",
    sortingFn: (rowA, rowB, columnId) => {
      const valueA = rowA.getValue(columnId)
      const valueB = rowB.getValue(columnId)

      if (!valueA || valueA === "00:00:00") return 1
      if (!valueB || valueB === "00:00:00") return -1

      return (valueA as string).localeCompare(valueB as string)
    }
  },
  { id: "winner", accessorFn: row => row.winner.team.map(p => `${p.last_name}, ${p.first_name}`), filterFn: arrayFilter },
  { id: "loser", accessorFn: row => row.loser.team.map(p => `${p.last_name}, ${p.first_name}`), filterFn: arrayFilter },
  { id: "score", header: "Score" },
  { id: "h2h" }
]

const columnVisibility = computed(() => ({
  tour: tournamentStore.tours.length > 1,
  checkbox: dev,
  date: props.matches.some(match => match.date) || !!Object.keys(updatedMatches.value).length,
  duration: props.matches.some(match => match.duration) || !!Object.keys(updatedMatches.value).length,
  court: props.matches.some(match => match.court) || !!Object.keys(updatedMatches.value).length,
  umpire: props.matches.some(match => match.umpire) || !!Object.keys(updatedMatches.value).length
}))

const handleSelectRow = (_e: Event, row: TableRow<ResultsMatchInterface>) => {
  if (Object.keys(updatedMatches.value).length) {
    return
  }

  if (dev || row.original.stats) {
    router.push({
      name: "match",
      params: {
        id,
        name,
        edId,
        year,
        tour: row.original.tour!,
        match_type: row.original.match_type,
        draw: row.original.draw,
        match_no: row.original.match_no
      }
    })
  }
}

const handleSave = async () => {
  set(isSaving, true)

  const errors: Record<string, any> = {}
  for (const [id, match] of Object.entries(updatedMatches.value)) {
    const { date, umpire, ...rest } = match
    const { error } = await supabase
      .from("matches")
      .update({ ...rest, date: date?.toString() || null, umpire_id: umpire?.id || null })
      .eq("id", id)

    if (error) errors[id] = error
  }

  if (Object.keys(errors).length) {
    console.error(errors)

    toast.add({
      title: "Error updating rounds",
      description: `${Object.keys(updatedMatches.value).length - errors.length} successfully updated. ${errors.length} failed.`,
      icon: icons.error,
      color: "error"
    })
  } else {
    toast.add({
      title: "Rounds successfully updated",
      icon: icons.success,
      color: "success"
    })
  }

  emits("refresh")
  set(updatedMatches, {})
  set(isSaving, false)
}
</script>

<template>
  <u-table
    :data="matches"
    :columns
    :loading="pending"
    sticky
    render-fallback-value="—"
    @select="handleSelectRow"
    :faceted-options="{
      getFacetedRowModel: getFacetedRowModel(),
      getFacetedUniqueValues: getFacetedUniqueValues()
    }"
    v-model:column-visibility="columnVisibility"
    :meta="{
      class: {
        tr: (row: TableRow<ResultsMatchInterface>) =>
          dev && !row.original.stats ? 'bg-warning/20 cursor-pointer'
          : row.original.stats ? 'cursor-pointer'
          : ''
      }
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
        :title="`No matches played in ${tournamentStore.name} ${year}`"
        description="If you think this is an error, refresh the page. Otherwise, please be patient as we continue to add more data."
        class="mx-2"
      >
        <template #actions>
          <u-button
            label="Refresh"
            :icon="icons.reload"
            @click="$emit('refresh')"
          />
        </template>
      </u-empty>
    </template>

    <template #checkbox-header="{ table }">
      <div class="w-fit mx-auto">
        <u-checkbox
          :model-value="
            Object.keys(updatedMatches).length === table.getFilteredRowModel().rows.length ? true
            : Object.keys(updatedMatches).length ? 'indeterminate'
            : false
          "
          @update:model-value="
            () => {
              if (Object.keys(updatedMatches).length) {
                updatedMatches = {}
              } else {
                table.getFilteredRowModel().rows.map(
                  match =>
                    (updatedMatches[match.original.id] = {
                      court: match.original.court,
                      date: match.original.date ? parseDate(match.original.date) : undefined,
                      duration: match.original.duration,
                      umpire:
                        match.original.umpire ?
                          {
                            id: match.original.umpire.id,
                            label: `${match.original.umpire.first_name} ${match.original.umpire.last_name}`
                          }
                        : undefined
                    })
                )
              }
            }
          "
          :icon="ICONS.racquet"
        />
      </div>
    </template>

    <template #checkbox-cell="{ row }">
      <div class="w-fit mx-auto">
        <u-checkbox
          :model-value="row.original.id in updatedMatches"
          @update:model-value="
            () => {
              if (row.original.id in updatedMatches) {
                delete updatedMatches[row.original.id]
              } else {
                updatedMatches[row.original.id] = {
                  court: row.original.court,
                  date: row.original.date ? parseDate(row.original.date) : undefined,
                  duration: row.original.duration,
                  umpire:
                    row.original.umpire ?
                      {
                        id: row.original.umpire.id,
                        label: `${row.original.umpire.first_name} ${row.original.umpire.last_name}`
                      }
                    : undefined
                }
              }
            }
          "
          :icon="ICONS.racquet"
        />
      </div>
    </template>

    <template #tour-header="{ column }">
      <table-filter-header
        :column
        label="Tour"
        :icon="ICONS.tour"
      />
    </template>

    <template #tour-cell="{ row }">
      <u-badge
        v-if="row.original.tour"
        :label="row.original.tour"
        :color="row.original.tour"
      />
    </template>

    <template #match_type-header="{ column }">
      <table-filter-header
        :column
        label="S/D"
        :icon="ICONS.people"
      />
    </template>

    <template #match_type-cell="{ row }">
      <u-badge
        :label="row.original.match_type"
        :color="row.original.match_type"
      />
    </template>

    <template #round_number-header="{ column }">
      <div class="flex justify-center items-center gap-0.5">
        <table-filter-header
          :column
          label="Round"
          :icon="ICONS.level"
          :mapping
          multiple
        />
        <table-sort-header :column />
      </div>
    </template>

    <template #round_number-cell="{ row }">{{ row.original.round.round }}</template>

    <template #date-header="{ column }">
      <table-sort-header
        :column
        label="Date"
        :icon="ICONS.calendar"
      />
    </template>

    <template #date-cell="{ row }">
      <form-date-picker
        v-if="row.original.id in updatedMatches"
        v-model="updatedMatches[row.original.id].date"
      />
      <div v-else>{{ row.original.date ? formatDate(row.original.date) : undefined }}</div>
    </template>

    <template #duration-header="{ column }">
      <table-sort-header
        :column
        label="Duration"
        :icon="ICONS.timer"
      />
    </template>

    <template #duration-cell="{ row }">
      <form-input
        v-if="row.original.id in updatedMatches"
        v-model="updatedMatches[row.original.id].duration"
        placeholder="HH:MM:SS"
      />
    </template>

    <template #court-header="{ column }">
      <table-filter-header
        :column
        label="Court"
        :icon="ICONS.court"
        multiple
      />
    </template>

    <template #court-cell="{ row }">
      <form-input
        v-if="row.original.id in updatedMatches"
        v-model="updatedMatches[row.original.id].court"
        placeholder="Court"
      />
      <div v-else>{{ row.original.court }}</div>
    </template>

    <template #umpire-header="{ column }">
      <table-filter-header
        :column
        label="Umpire"
        :icon="ICONS.umpire"
        type="name"
        multiple
      />
    </template>

    <template #umpire-cell="{ row }">
      <person-search
        v-if="row.original.id in updatedMatches"
        v-model="updatedMatches[row.original.id].umpire"
        placeholder="Select umpire"
      />
      <div v-else>{{ row.original.umpire ? `${row.original.umpire.first_name} ${row.original.umpire.last_name}` : "" }}</div>
    </template>

    <template #winner-header="{ column }">
      <div class="flex justify-center items-center gap-0.5">
        <table-filter-header
          :column
          label="Winner"
          :icon="ICONS.trophy"
          type="name"
          multiple
        />
        <table-sort-header :column />
      </div>
    </template>

    <template #winner-cell="{ row }">
      <div class="flex items-center gap-1">
        <players-link :players="row.original.winner.team" />

        <small v-if="row.original.winner.seed || row.original.winner.status">
          ({{
            row.original.winner.seed && row.original.winner.status ?
              `${row.original.winner.seed} ${row.original.winner.status}`
            : row.original.winner.seed || row.original.winner.status
          }})
        </small>

        <small>[{{ row.original.winner.team.reduce((acc, curr) => acc + (curr.rank || 0), 0) }}]</small>
      </div>
    </template>

    <template #loser-header="{ column }">
      <div class="flex justify-center items-center gap-0.5">
        <table-filter-header
          :column
          label="Loser"
          :icon="ICONS.player"
          type="name"
          multiple
        />
        <table-sort-header :column />
      </div>
    </template>

    <template #loser-cell="{ row }">
      <div class="flex items-center gap-1">
        <players-link :players="row.original.loser.team" />

        <small v-if="row.original.loser.seed || row.original.loser.status">
          ({{
            row.original.loser.seed && row.original.loser.status ?
              `${row.original.loser.seed} ${row.original.loser.status}`
            : row.original.loser.seed || row.original.loser.status
          }})
        </small>

        <small>[{{ row.original.loser.team.reduce((acc, curr) => acc + (curr.rank || 0), 0) }}]</small>
      </div>
    </template>

    <template #score-cell="{ row }">
      <div class="flex justify-center items-center gap-1">
        <template
          v-for="set_no in Array.from({ length: row.original.format }, (_, i) => 1 + i)"
          :key="set_no"
        >
          <div v-if="row.original.scores.some(s => s.set_no === set_no)">
            <span>{{ row.original.scores.find(s => s.set_no === set_no && s.entry_id === row.original.winner.id)?.set }}</span>
            <span>{{ row.original.scores.find(s => s.set_no === set_no && s.entry_id === row.original.loser.id)?.set }}</span>
            <sup v-if="row.original.scores.find(s => s.set_no === set_no && isDefined(s.tb))">{{
              Math.min(...row.original.scores.filter(s => s.set_no === set_no).map(s => s.tb || 0))
            }}</sup>
          </div>
        </template>

        <u-badge
          v-if="row.original.incomplete"
          :label="row.original.incomplete"
          color="error"
        />
      </div>
    </template>

    <template #h2h-cell="{ row }">
      <u-button
        label="H2H"
        :icon="ICONS.h2h"
        :to="{
          name: 'head-to-head',
          params: {
            t1_name: row.original.winner.team.map(player => kebabCase(`${player.first_name} ${player.last_name}`)).join('+'),
            t2_name: row.original.loser.team.map(player => kebabCase(`${player.first_name} ${player.last_name}`)).join('+'),
            t1_id: row.original.winner.team.map(player => player.id).join('+'),
            t2_id: row.original.loser.team.map(player => player.id).join('+')
          }
        }"
      />
    </template>
  </u-table>
</template>
