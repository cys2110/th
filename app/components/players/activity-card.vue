<script setup lang="ts">
import { PlayersLink, UButton, UIcon } from "#components"
import type { TableColumn, TableRow } from "@nuxt/ui"

const { event } = defineProps<{ event: ConsolidatedActivityType }>()
const {
  params: { id, name }
} = useRoute("activity")
const {
  ui: { icons }
} = useAppConfig()

const columns: TableColumn<ActivityMatchType>[] = [
  { accessorKey: "round", header: "Round" },
  {
    id: "opponent",
    header: "Opponent",
    cell: ({ row }) => {
      if (row.original.opponent?.team.length) {
        return h(
          "div",
          { class: "flex flex-col" },
          row.original.opponent.team.map(p => h(PlayersLink, { player: p }))
        )
      }
    }
  },
  {
    id: "rank",
    header: "Rank",
    cell: ({ row }) => {
      if (row.original.opponent?.team.length) {
        return h(
          "div",
          { class: "flex flex-col" },
          row.original.opponent.team.map(p => p.rank?.toLocaleString() ?? "—")
        )
      }
    }
  },
  {
    accessorKey: "winning_team",
    header: "",
    cell: ({ row }) =>
      h(UIcon, {
        name: row.original.winning_team === "t1" ? icons.success : icons.error,
        class: (row.original.winning_team === "t1" ? "text-success" : "text-error") + " text-lg"
      })
  },
  { id: "score", header: "Score" },
  {
    id: "h2h",
    header: "",
    cell: ({ row }) => {
      if (row.original.opponent?.team.length) {
        const p1Name = event.partner ? `${name}+${kebabCase(`${event.partner.first_name} ${event.partner.last_name}`)}` : name
        const p1Id = event.partner ? `${id}+${event.partner.id}` : id

        return h(UButton, {
          to: {
            name: "head-to-head",
            params: {
              p1Name,
              p1Id,
              p2Name: row.original.opponent.team.map(p => kebabCase(`${p.first_name} ${p.last_name}`)).join("+"),
              p2Id: row.original.opponent.team.map(p => p.id).join("+")
            }
          },
          label: "H2H",
          icon: ICONS.h2h
        })
      }
    }
  }
]
</script>

<template>
  <u-page-card
    highlight
    orientation="horizontal"
    :ui="{ container: 'lg:grid-cols-5', wrapper: 'lg:col-span-2', title: 'text-lg', description: 'text-sm' }"
  >
    <template #leading>
      <u-badge
        :color="event.tour"
        :label="event.tour"
      />
      <u-badge
        :color="event.level"
        :label="event.level"
        class="ml-2"
      />
    </template>

    <template #title>
      <div>
        <u-link
          class="hover-link default-link"
          :to="{ name: 'tournament', params: { id: event.tournament.id, name: kebabCase(event.tournament.name) } }"
        >
          {{ event.tournament.name }}
        </u-link>
        <u-link
          class="hover-link default-link ml-1"
          :to="{
            name: 'event',
            params: { id: event.tournament.id, name: kebabCase(event.tournament.name), year: event.year, edId: event.id, tour: event.tour }
          }"
        >
          {{ event.year }}
        </u-link>
      </div>
      <div
        class="text-sm font-medium"
        v-if="event.sponsor_name"
      >
        {{ event.sponsor_name }}
      </div>
    </template>

    <template #description>
      <div class="flex flex-wrap space-x-5 space-y-2 *:*:first:font-semibold *:*:not-first:ml-3">
        <div>
          <div>Category</div>
          <div>{{ event.category }}</div>
        </div>
        <div>
          <div>Dates</div>
          <div>{{ dateTimeFormat.formatRange(new Date(event.start_date!), new Date(event.end_date!)) }}</div>
        </div>
        <div>
          <div>Surface</div>
          <div>{{ event.surface?.id }}</div>
        </div>
        <div>
          <div>Venues</div>
          <div
            v-for="venue in event.venues"
            :key="venue.id"
            class="flex items-center gap-2"
          >
            {{ venue.name ? `${venue.name}, ${venue.city}` : venue.city }}
            <countries-link
              :country="venue.country"
              icon-only
            />
          </div>
        </div>
        <div v-if="event.partner">
          <div>Partner</div>
          <players-link :player="event.partner" />
        </div>
      </div>

      <div class="flex flex-wrap gap-2 mt-2">
        <u-badge
          v-if="event.player.seed || event.player.q_seed"
          :color="event.player.seed ? 'Doubles' : 'Main'"
          :label="`Seed: ${event.player.seed ?? `Q-${event.player.q_seed}`}`"
        />

        <u-badge
          v-if="event.player.status"
          color="Singles"
          :label="`Status: ${statusEnum[event.player.status]}`"
        />

        <u-badge
          v-if="event.player.q_status"
          color="warning"
          :label="`Status: Q-${statusEnum[event.player.q_status]}`"
        />

        <u-badge
          v-if="isDefined(event.player.rank)"
          color="Active"
          :label="`Rank: ${event.player.rank.toLocaleString()}`"
        />

        <u-badge
          v-if="isDefined(event.player.points)"
          color="Inactive"
          :label="`Points: ${event.player.points.toLocaleString()}`"
        />

        <u-badge
          v-if="isDefined(event.player.pm) && event.currency"
          color="Qualifying"
          :label="`Prize Money:
        ${event.player.pm.toLocaleString('en-GB', { style: 'currency', currency: event.currency })}`"
        />
      </div>
    </template>

    <u-table
      :data="event.match"
      :columns
      class="lg:col-span-3"
      :meta="{
        class: {
          tr: (row: TableRow<ActivityMatchType>) => row.original.draw === 'Main' ? '' : 'bg-elevated'
        }
      }"
    >
      <template #score-cell="{ row }">
        <u-button
          color="neutral"
          variant="link"
          :disabled="!row.original.stats"
          size="md"
          class="disabled:cursor-default"
          :to="{
            name: 'match',
            params: {
              id: event.tournament.id,
              name: kebabCase(event.tournament.name),
              year: event.year,
              edId: event.id,
              tour: event.tour,
              mid: constructMid(row.original.draw!, event.type, row.original.match_no)
            }
          }"
        >
          <div
            class="flex justify-center items-center"
            :class="row.original.stats ? 'hover-link default-link' : ''"
          >
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
        </u-button>
      </template>
    </u-table>
  </u-page-card>
</template>
