<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui"

const { tour } = defineProps<{
  events: (EventInterface & MatchInterface)[]
  status: APIStatusType
  tour: TourType
  year: string
  firstName?: string
  lastName?: string
}>()
const {
  ui: { icons }
} = useAppConfig()
const { params } = useRoute()
const { id: playerId, name: playerName } = params as { id: string; name: string }

const dateTimeFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "numeric",
  year: "numeric"
})

const columns: TableColumn<EventInterface & MatchInterface>[] = [
  {
    id: "tournament",
    accessorKey: "tournament.name"
  },
  {
    id: "category",
    accessorFn: row => row.category ?? (tour === "ATP" ? (row.atp_category ?? row.men_category) : (row.wta_category ?? row.women_category)),
    sortUndefined: "last"
  },
  {
    id: "dates",
    accessorFn: row => {
      if (row.start_date) {
        return `${row.start_date.year}-${row.start_date.month}-${row.start_date.day}`
      } else if (tour === "ATP") {
        if (row.atp_start_date) {
          return `${row.atp_start_date.year}-${row.atp_start_date.month}-${row.atp_start_date.day}`
        } else {
          return `${row.men_start_date?.year}-${row.men_start_date?.month}-${row.men_start_date?.day}`
        }
      } else {
        if (row.wta_start_date) {
          return `${row.wta_start_date.year}-${row.wta_start_date.month}-${row.wta_start_date.day}`
        } else {
          return `${row.women_start_date?.year}-${row.women_start_date?.month}-${row.women_start_date?.day}`
        }
      }
    }
  },
  { id: "surface", accessorKey: "surface.surface" },
  { id: "country", accessorFn: row => row.venues[0]?.country.name, sortUndefined: "last" },
  { accessorKey: "round" },
  { id: "opponent", accessorFn: row => row.opponent?.last_name, sortUndefined: "last" },
  { id: "rank", accessorFn: row => row.opponent?.rank, sortUndefined: "last" },
  { accessorKey: "winner_id", header: "" },
  { id: "score", header: "Score" },
  { id: "h2h", header: "" }
]
</script>

<template>
  <u-table
    :data="events"
    :columns
    :loading="status === 'pending'"
    sticky
    :empty="`${firstName || ''} ${lastName || ''} has no singles activity for ${year}`"
    class="scrollbar-thin scrollbar-thumb-primary-600 scrollbar-track-transparent"
  >
    <template #tournament-header="{ column }">
      <sort-table-header
        :column
        label="Tournament"
        type="alpha"
      />
    </template>

    <template #tournament-cell="{ row }">
      <u-link
        :to="{ name: 'tournament', params: { id: row.original.tournament.id, name: kebabCase(row.original.tournament.name) } }"
        class="hover-link"
      >
        {{ row.original.tournament.name }}
      </u-link>
    </template>

    <template #category-header="{ column }">
      <sort-table-header
        :column
        label="Category"
        type="alpha"
      />
    </template>

    <template #category-cell="{ row }">
      <u-link
        v-if="row.getValue('category')"
        :to="{ name: 'category', params: { id: kebabCase(row.getValue('category')) } }"
        class="hover-link"
      >
        {{ row.getValue("category") }}
      </u-link>
    </template>

    <template #dates-header="{ column }">
      <sort-table-header
        :column
        label="Dates"
        type="number"
      />
    </template>

    <template #dates-cell="{ row }">
      {{
        row.original.start_date && row.original.end_date ?
          dateTimeFormat.formatRange(getDate(row.original.start_date), getDate(row.original.end_date))
        : row.original.atp_start_date && row.original.atp_end_date ?
          dateTimeFormat.formatRange(getDate(row.original.atp_start_date), getDate(row.original.atp_end_date))
        : row.original.wta_start_date && row.original.wta_end_date ?
          dateTimeFormat.formatRange(getDate(row.original.wta_start_date), getDate(row.original.wta_end_date))
        : row.original.men_start_date && row.original.men_end_date ?
          dateTimeFormat.formatRange(getDate(row.original.men_start_date), getDate(row.original.men_end_date))
        : row.original.women_start_date && row.original.women_end_date ?
          dateTimeFormat.formatRange(getDate(row.original.women_start_date), getDate(row.original.women_end_date))
        : ""
      }}
    </template>

    <template #surface-header="{ column }">
      <sort-table-header
        :column
        label="Surface"
        type="alpha"
      />
    </template>

    <template #surface-cell="{ row }">
      <u-link
        v-if="row.original.surface"
        :to="{ name: 'surface', params: { id: kebabCase(row.original.surface.id) } }"
        class="hover-link"
      >
        {{ row.original.surface.id }}
      </u-link>
    </template>

    <template #country-header="{ column }">
      <sort-table-header
        :column
        label="Country"
        type="alpha"
      />
    </template>

    <template #country-cell="{ row }">
      <div class="w-fit mx-auto">
        <country-link
          v-if="row.original.venues[0]?.country"
          :country="row.original.venues[0].country"
        />
      </div>
    </template>

    <template #opponent-header="{ column }">
      <sort-table-header
        :column
        label="Opponent"
        type="alpha"
      />
    </template>

    <template #opponent-cell="{ row }">
      <div
        v-if="row.original.opponent"
        class="flex items-center gap-2"
      >
        <player-link :player="row.original.opponent" />
        <span
          v-if="
            (!row.original.round.includes('Qualifying') && (row.original.opponent?.seed || row.original.opponent?.status)) ||
            (row.original.round.includes('Qualifying') && (row.original.opponent?.q_seed || row.original.opponent?.q_status))
          "
          class="text-xs"
        >
          ({{
            row.original.round.includes("Qualifying") ?
              `${row.original.opponent.q_seed ?? ""}${row.original.opponent.q_status && row.original.opponent.q_seed ? " " : ""}${row.original.opponent.q_status ?? ""}`
            : `${row.original.opponent.seed ?? ""}${row.original.opponent.status && row.original.opponent.seed ? " " : ""}${row.original.opponent.status ?? ""}`
          }})
        </span>
      </div>
      <template v-else>BYE</template>
    </template>

    <template #round-header="{ column }">
      <sort-table-header
        :column
        label="Round"
        type="alpha"
      />
    </template>

    <template #rank-header="{ column }">
      <sort-table-header
        :column
        label="Rank"
        type="number"
      />
    </template>

    <template #winner_id-cell="{ row }">
      <u-icon
        :name="row.original.winner_id === playerId ? icons.success : icons.error"
        :class="`text-xl ${row.original.winner_id === playerId ? 'text-success-600' : 'text-error-600'}`"
      />
    </template>

    <template #score-cell="{ row }">
      <template v-if="row.original.incomplete === 'B'">—</template>
      <match-score-item
        v-else
        :labels="row.original.labels"
        :sets="row.original.sets"
        :tournament="row.original.tournament"
        :id="row.original.id"
        :year
        :match_no="row.original.match_no"
        :incomplete="row.original.incomplete"
        :centred="true"
        :stats="row.original.stats"
      />
    </template>

    <template #h2h-cell="{ row }">
      <u-button
        v-if="row.original.opponent"
        size="sm"
        variant="subtle"
        :to="{
          name: 'h2h-players',
          params: {
            p1Name: playerName,
            p2Name: kebabCase(row.original.opponent.first_name || ' ' || row.original.opponent.last_name),
            p1Id: playerId,
            p2Id: row.original.opponent.id
          }
        }"
      >
        H2H
      </u-button>
    </template>
  </u-table>
</template>
