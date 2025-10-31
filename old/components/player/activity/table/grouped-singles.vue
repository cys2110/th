<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui"
import { getGroupedRowModel, type GroupingOptions } from "@tanstack/vue-table"

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
  { id: "expand" },
  { id: "tournament", accessorKey: "tournament.name", header: "Tournament" },
  { id: "category", header: "Category" },
  { id: "dates", header: "Dates" },
  { id: "surface", header: "Surface" },
  { id: "country", header: "Country" },
  { accessorKey: "round", header: "Round" },
  { id: "opponent", header: "Opponent" },
  { id: "rank", header: "Rank" },
  { accessorKey: "winner_id", header: "" },
  { id: "score", header: "Score" },
  { id: "h2h", header: "" }
]

const grouping_options = ref<GroupingOptions>({
  groupedColumnMode: false,
  getGroupedRowModel: getGroupedRowModel()
})
</script>

<template>
  <u-table
    :data="events"
    :columns
    :loading="status === 'pending'"
    :grouping="['tournament']"
    :grouping-options="grouping_options"
    sticky
    :empty="`${firstName || ''} ${lastName || ''} has no singles activity for ${year}`"
    :ui="{
      root: 'scrollbar-thin scrollbar-thumb-primary-600 scrollbar-track-transparent',
      td: 'empty:p-0' // helps with the colspaned row added for expand slot
    }"
  >
    <template #expand-cell="{ row }">
      <u-button
        v-if="row.getIsGrouped()"
        variant="link"
        color="neutral"
        class="mr-2"
        size="xs"
        :icon="icons.chevronDoubleRight"
        :ui="{ leadingIcon: row.getIsExpanded() ? 'rotate-90 transition-transform duration-200' : 'transition-transform duration-200' }"
        @click="row.toggleExpanded()"
      />
    </template>

    <template #tournament-cell="{ row }">
      <u-link
        v-if="row.getIsGrouped()"
        :to="{ name: 'tournament', params: { id: row.original.tournament.id, name: kebabCase(row.original.tournament.name) } }"
        class="hover-link"
      >
        {{ row.original.tournament.name }}
      </u-link>
      <template v-else>{{ "" }}</template>
    </template>

    <template #category-cell="{ row }">
      <template v-if="row.getIsGrouped()">
        <u-link
          v-if="
            row.original.category ||
            (tour === 'ATP' && (row.original.atp_category || row.original.men_category)) ||
            (tour === 'WTA' && (row.original.wta_category || row.original.women_category))
          "
          :to="{
            name: 'category',
            params: {
              id: kebabCase(
                row.original.category ??
                  (tour === 'ATP' ?
                    (row.original.atp_category ?? row.original.men_category)
                  : (row.original.wta_category ?? row.original.women_category))!
              )
            }
          }"
          class="hover-link"
        >
          {{
            row.original.category ??
            (tour === "ATP" ? (row.original.atp_category ?? row.original.men_category) : (row.original.wta_category ?? row.original.women_category))
          }}
        </u-link>
      </template>
    </template>

    <template #dates-cell="{ row }">
      <span v-if="row.getIsGrouped()">
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
      </span>
    </template>

    <template #surface-cell="{ row }">
      <u-link
        v-if="row.original.surface && row.getIsGrouped()"
        :to="{ name: 'surface', params: { id: kebabCase(row.original.surface.id) } }"
        class="hover-link"
      >
        {{ row.original.surface.id }}
      </u-link>
    </template>

    <template #country-cell="{ row }">
      <div
        class="w-fit mx-auto"
        v-if="row.getIsGrouped()"
      >
        <country-link
          v-if="row.original.venues[0]?.country"
          :country="row.original.venues[0].country"
        />
      </div>
    </template>
    <template #opponent-cell="{ row }">
      <template v-if="!row.getIsGrouped()">
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
    </template>

    <template #winner_id-cell="{ row }">
      <u-icon
        v-if="!row.getIsGrouped()"
        :name="row.original.winner_id === playerId ? icons.success : icons.error"
        :class="`text-xl ${row.original.winner_id === playerId ? 'text-success-600' : 'text-error-600'}`"
      />
    </template>

    <template #score-cell="{ row }">
      <template v-if="!row.getIsGrouped()">
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
    </template>

    <template #h2h-cell="{ row }">
      <template v-if="!row.getIsGrouped()">
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
    </template>
  </u-table>
</template>
