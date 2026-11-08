<script setup lang="ts">
import { getColumnFilter, ICONS, isDefined, prettifyJson, setColumnFilter } from "#imports"
import type { TableColumn } from "@nuxt/ui"
import type { ColumnFiltersState } from "@tanstack/vue-table"
import { parseDate } from "@internationalized/date"

interface Match {
  id: string
  match_no: number
  court: string | null
  date: string | null
  match_type: MatchTypeEnum
  draw: DrawEnum
  format: number
  incomplete: IncompleteEnum | null
  duration: string | null
  round: string
  team1?: string | null
  team2?: string | null
  winner: number | null
  umpire?: {
    id: string
    full_name: string
    icon: string
  }
  match_link: string | null
  stats: boolean
  team1_scores: Array<MatchScore>
  team2_scores: Array<MatchScore>
}

interface UpdatedMatch {
  [key: string]: {
    match: string
    date: any
    court: string | null
    duration: string | null
    umpire?: {
      id: string
      full_name: string
      icon: string
    }
  }
}

const selectedEvent = defineModel<EventSelection>({ default: () => ({}) })

const supabase = useSupabaseClient()
const toast = useToast()
const { ui } = useAppConfig()

const matches = ref<Array<Match>>([])
const loading = ref(false)
const updatedMatches = ref<UpdatedMatch>({})
const isSaving = ref(false)
const errors = ref<Array<{ id: string; match: string; details: any }>>([])

const rounds = computed(() => useArrayUnique(matches.value.map(m => m.round)).value)

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC"
})

const formatDate = (date: string) => dateFormat.format(new Date(date))

const fetchMatches = async () => {
  if (!selectedEvent.value.event?.id) return
  set(loading, true)

  const { data, error } = await supabase
    .schema("tennis")
    .from("matches")
    .select(
      `
      id,
      match_no,
      court,
      date,
      match_type,
      draw,
      format,
      incomplete,
      duration,
      round:rounds!inner(event_id, round),
      team1:entries!matches_team_1_id_fkey(
        id,
        team:player_entry_mapping(
          player_order,
          ...player(...people(full_name))
        )
      ),
      team2:entries!matches_team_2_id_fkey(
        id,
        team:player_entry_mapping(
          player_order,
          ...player(...people(full_name))
        )
      ),
      winner_id,
      umpire:people(id, full_name),
      match_link,
      match_stats(count),
      match_scores(*)
`
    )
    .eq("rounds.event_id", selectedEvent.value.event?.id)
    .order("match_type", { ascending: true })
    .order("draw", { ascending: true })
    .order("match_no", { ascending: true })

  if (error || !data) {
    console.error("Error fetching matches", error)
    toast.add({
      title: "Error fetching matches",
      description: JSON.stringify(error)
    })
  }

  const parsedData = data!.map(match => {
    const { round, team1, team2, winner_id, match_stats, match_scores, umpire, ...rest } = match

    return {
      ...rest,
      umpire:
        umpire ?
          {
            id: umpire.id,
            full_name: umpire.full_name as string,
            icon: ""
          }
        : undefined,
      stats: match_stats[0]?.count && match_stats[0].count > 0 ? true : false,
      round: round.round,
      winner:
        team1?.id === winner_id ? 1
        : team2?.id === winner_id ? 2
        : null,
      team1: team1?.team
        .sort((a, b) => a.player_order - b.player_order)
        .map(t => t.full_name)
        .join(" / "),
      team2: team2?.team
        .sort((a, b) => a.player_order - b.player_order)
        .map(t => t.full_name)
        .join(" / "),
      team1_scores: match_scores.filter(s => team1 && s.entry_id === team1.id).sort((a, b) => a.set_no! - b.set_no!),
      team2_scores: match_scores.filter(s => team2 && s.entry_id === team2.id).sort((a, b) => a.set_no! - b.set_no!)
    }
  })

  set(matches, parsedData)
  set(loading, false)
}

defineExpose({ fetchMatches })

watch(
  () => selectedEvent.value.event?.id,
  async () => {
    if (selectedEvent.value.event?.id) {
      await fetchMatches()
    }
  },
  { immediate: true }
)

const columns: Array<TableColumn<Match>> = [
  { id: "checkbox" },
  { accessorKey: "match_type", header: "S/D" },
  { accessorKey: "draw", header: "Draw" },
  { accessorKey: "round", header: "Round" },
  { accessorKey: "match_no", header: "#" },
  { accessorKey: "date", header: "Date" },
  { accessorKey: "court", header: "Court" },
  { accessorKey: "duration", header: "Duration" },
  { accessorKey: "umpire.full_name", header: "Umpire" },
  { accessorKey: "team1", header: "Team 1" },
  { accessorKey: "team2", header: "Team 2" },
  { id: "scores" },
  { accessorKey: "incomplete", header: "Incomplete" },
  { id: "scrape" }
]

const columnFilters = ref<ColumnFiltersState>([])

const handleSave = async () => {
  set(isSaving, true)

  const failedUpdates: UpdatedMatch = {}

  for (const [matchId, value] of Object.entries(updatedMatches.value)) {
    const { error } = await supabase
      .schema("tennis")
      .from("matches")
      .update({ date: value.date?.toString(), court: value.court, duration: value.duration, umpire_id: value.umpire?.id })
      .eq("id", matchId)

    if (error) {
      errors.value.push({
        id: matchId,
        match: value.match,
        details: error
      })
      failedUpdates[matchId] = value
    }
  }
  set(updatedMatches, failedUpdates)

  set(isSaving, false)
  await fetchMatches()
}

const handleScrapeMatch = async (match_link: string) => {
  const result = await $fetch("/api/scrape-match", {
    query: {
      href: match_link,
      tour: selectedEvent.value.event?.tour
    }
  })

  if (result.success) {
    toast.add({
      title: "Match scraped",
      icon: ui.icons.success,
      color: "success"
    })
    fetchMatches()
  } else {
    if ("href" in result && result.href) {
      await navigateTo(result.href, {
        open: { target: "_blank" }
      })
    }

    console.error("Error scraping match:", result)
    toast.add({
      title: "Error scraping match",
      icon: ui.icons.error,
      color: "error"
    })
  }
}
</script>

<template>
  <div class="space-y-6 max-w-sidetabs">
    <u-alert
      v-if="errors.length"
      v-for="(error, index) in errors"
      :key="index"
      color="error"
      variant="subtle"
      :title="error.match"
    >
      <template #description>
        {{ prettifyJson(error.details) }}
      </template>
    </u-alert>

    <u-card>
      <template #header>
        <div class="flex justify-between">
          <div class="space-x-3">
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

            <u-select-menu
              :items="rounds"
              placeholder="Round"
              clear
              :model-value="<string>getColumnFilter('round', columnFilters)"
              @update:model-value="columnFilters = setColumnFilter('round', $event, columnFilters)"
            />
          </div>

          <div class="space-x-3">
            <u-button
              :icon="ui.icons.reload"
              @click="fetchMatches()"
              label="Refresh"
            />

            <u-button
              :icon="ICONS.save"
              label="Save"
              :loading="isSaving"
              :loading-icon="ICONS.uploading"
              @click="handleSave"
            />
          </div>
        </div>
      </template>

      <u-table
        :data="matches"
        :columns
        :loading="loading"
        v-model:column-filters="columnFilters"
        sticky
        render-fallback-value="—"
      >
        <template #loading>
          <loading-icon />
        </template>

        <template #empty>
          <empty
            :title="`No match information available for ${selectedEvent.tournament?.name} ${selectedEvent.edition?.year} ${selectedEvent.event?.tour}`"
            @refresh="fetchMatches"
            class="mx-2"
          />
        </template>

        <template #checkbox-header="{ table }">
          <u-checkbox
            :model-value="
              matches.length && Object.keys(updatedMatches).length === table.getFilteredRowModel().rows.length ? true
              : Object.keys(updatedMatches).length ? 'indeterminate'
              : false
            "
            @update:model-value="
              () => {
                if (Object.keys(updatedMatches).length) {
                  updatedMatches = {}
                } else {
                  table.getFilteredRowModel().rows.map(
                    row =>
                      (updatedMatches[row.original.id] = {
                        match: `${row.original.match_type} ${row.original.draw} ${row.original.match_no}`,
                        date: row.original.date ? parseDate(row.original.date) : undefined,
                        court: row.original.court,
                        duration: row.original.duration,
                        umpire: row.original.umpire
                      })
                  )
                }
              }
            "
            :icon="ICONS.racquet"
          />
        </template>

        <template #checkbox-cell="{ row }">
          <u-checkbox
            :model-value="row.original.id in updatedMatches"
            @update:model-value="
              () => {
                if (row.original.id in updatedMatches) {
                  delete updatedMatches[row.original.id!]
                } else {
                  updatedMatches[row.original.id] = {
                    match: `${row.original.match_type} ${row.original.draw} ${row.original.match_no}`,
                    date: row.original.date ? parseDate(row.original.date) : undefined,
                    court: row.original.court,
                    duration: row.original.duration,
                    umpire: row.original.umpire
                  }
                }
              }
            "
            :icon="ICONS.racquet"
          />
        </template>

        <template #date-cell="{ row }">
          <form-input-number
            v-if="row.original.id in updatedMatches"
            v-model="updatedMatches[row.original.id]!.date"
            placeholder="Date"
          />

          <div v-else>
            {{ row.original.date ? formatDate(row.original.date) : "—" }}
          </div>
        </template>

        <template #court-cell="{ row }">
          <form-input
            v-if="row.original.id in updatedMatches"
            v-model="updatedMatches[row.original.id]!.court"
            placeholder="Court"
          />

          <div v-else>
            {{ row.original.court }}
          </div>
        </template>

        <template #duration-cell="{ row }">
          <form-input
            v-if="row.original.id in updatedMatches"
            v-model="updatedMatches[row.original.id]!.duration"
            placeholder="Duration"
          />

          <div v-else>
            {{ row.original.duration }}
          </div>
        </template>

        <template #umpire_full_name-cell="{ row }">
          <person-search
            v-if="row.original.id in updatedMatches"
            v-model="updatedMatches[row.original.id]!.umpire"
            placeholder="Umpire"
          />

          <div v-else>
            {{ row.original.umpire?.full_name }}
          </div>
        </template>

        <template #team1-cell="{ row }">
          <div class="flex items-center">
            {{ row.original.team1 }}
            <u-icon
              v-if="row.original.winner === 1"
              :name="ui.icons.check"
              class="text-success size-7"
            />
          </div>
        </template>

        <template #team2-cell="{ row }">
          <div class="flex items-center">
            {{ row.original.team2 }}
            <u-icon
              v-if="row.original.winner === 2"
              :name="ui.icons.check"
              class="text-success size-7"
            />
          </div>
        </template>

        <template #scores-cell="{ row }">
          <div class="flex gap-1.5">
            <div
              v-for="(score, index) in row.original.team1_scores"
              :key="index"
            >
              <div>
                {{ score.set }}<sup v-if="isDefined(score.tb)">{{ score.tb }}</sup>
              </div>

              <div>
                {{ row.original.team2_scores.find(s => s.set_no === score.set_no)?.set
                }}<sup v-if="isDefined(row.original.team2_scores.find(s => s.set_no === score.set_no)?.tb)">{{
                  row.original.team2_scores.find(s => s.set_no === score.set_no)?.tb
                }}</sup>
              </div>
            </div>
          </div>
        </template>

        <template #scrape-cell="{ row }">
          <u-button
            v-if="!row.original.stats && row.original.match_link"
            :icon="ICONS.download"
            @click="() => handleScrapeMatch(row.original.match_link!)"
          />
        </template>
      </u-table>
    </u-card>
  </div>
</template>
