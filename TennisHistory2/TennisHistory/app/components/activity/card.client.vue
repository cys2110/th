<script setup lang="ts">
import { PlayerLink, ShortScore, UBadge, UButton } from "#components"
import type { TableColumn } from "@nuxt/ui"

const props = defineProps<{ event: ActivityInterface }>()

const {
  params: { id, name }
} = useRoute("activity")

const {
  ui: { icons }
} = useAppConfig()

const breakpoints = useBreakpoints(breakpointsTailwind, { ssrWidth: useSSRWidth() })
const lgAndDown = breakpoints.smallerOrEqual("lg")

const columns: Array<TableColumn<ActivityMatchInterface>> = [
  { accessorKey: "round", header: "Round" },
  { accessorKey: "win", header: "" },
  {
    accessorKey: "opponents",
    meta: { class: { td: "text-left" } },
    header: "Opponent",
    cell: ({ row }) => {
      if (row.original.incomplete === "B") {
        return "BYE"
      } else if (row.original.opponents?.every(player => player.id)) {
        return h(PlayerLink, {
          players: row.original.opponents
        })
      } else {
        return "Alternate"
      }
    }
  },
  {
    id: "rank",
    header: "Rank",
    cell: ({ row }) => {
      if (row.original.opponents?.every(player => player.id)) {
        const rank = row.original.opponents.reduce((acc, curr) => acc + (curr.rank || 0), 0)

        return rank.toLocaleString()
      } else {
        return "—"
      }
    }
  },
  {
    id: "score",
    header: "Score",
    cell: ({ row }) => {
      if (row.original.scores.length) {
        return h("div", { class: "flex justify-center items-center gap-1" }, [
          h(ShortScore, {
            scores: row.original.scores,
            format: row.original.format
          }),
          ...(row.original.incomplete && row.original.incomplete !== "B" ?
            [
              h(UBadge, {
                label: row.original.incomplete,
                color: "error"
              })
            ]
          : [])
        ])
      } else {
        return "—"
      }
    }
  },
  {
    id: "h2h",
    header: "",
    cell: ({ row }) => {
      if (row.original.opponents && row.original.opponents.every(player => player.id)) {
        const t1Ids = [id]
        const t1Names = [name]

        if (props.event.partner_id) {
          t1Ids.push(props.event.partner_id)
          t1Names.push(kebabCase(`${props.event.partner_first_name} ${props.event.partner_last_name}`))
        }

        return h(UButton, {
          icon: ICONS.h2h,
          label: "H2H",
          to: {
            name: "head-to-head",
            params: {
              t1_name: t1Names.join("+"),
              t2_name: row.original.opponents.map(player => kebabCase(`${player.first_name} ${player.last_name}`)).join("+"),
              t1_id: t1Ids.join("+"),
              t2_id: row.original.opponents.map(player => player.id).join("+")
            }
          }
        })
      }
    }
  }
]
</script>

<template>
  <u-page-card :ui="{ body: 'w-full', footer: 'text-xs w-full' }">
    <template #title>
      <div class="flex justify-between items-start">
        <div>
          <div>
            <u-link
              :to="{ name: 'tournament', params: { id: event.tournament_id, name: kebabCase(event.tournament_name) } }"
              class="hover-link primary-link"
            >
              {{ event.tournament_name }}
            </u-link>
          </div>
          <div class="text-sm text-muted flex gap-1">
            <span v-if="event.category">{{ event.category }} |</span>
            <span>{{ dateFormat.formatRange(new Date(event.start_date), new Date(event.end_date)) }}</span>
          </div>
        </div>

        <div class="flex flex-col items-end gap-0.5">
          <u-button
            label="Details"
            :to="{
              name: 'edition',
              params: { id: event.tournament_id, name: kebabCase(event.tournament_name), year: event.year, edId: event.edition_id }
            }"
          />
          <div>
            <span class="flex gap-1 text-sm text-muted">
              <span v-if="event.surface">{{ event.surface }} |</span>
              {{ useArrayUnique(event.venues.map(v => v.city)).value.join(", ") }}
              <country-link
                :country="event.venues[0]!.country"
                icon-only
              />
            </span>
          </div>
        </div>
      </div>
    </template>

    <template #description>
      <u-table
        :data="event.matches"
        :columns
        :meta="{
          class: {
            tr: row => (row.original.draw === 'Main' ? '' : 'bg-elevated')
          }
        }"
      >
        <template #round-cell="{ row }">
          <div>{{ lgAndDown ? ROUND_ABBREVIATION_MAPPING[row.original.round] : row.original.round }}</div>
          <div v-if="row.original.group_name || row.original.tie">{{ row.original.group_name || row.original.tie }}</div>
        </template>

        <template #win-cell="{ row }">
          <u-icon
            :name="row.original.win ? icons.success : icons.error"
            class="size-5"
            :class="row.original.win ? 'text-success' : 'text-error'"
          />
        </template>
      </u-table>
    </template>

    <template #footer>
      <div class="flex justify-between items-center">
        <div class="flex gap-2 *:*:first:text-muted *:*:last:font-semibold">
          <div v-if="event.seed || event.q_seed">
            <span>Seed: </span>
            <span>{{ event.q_seed ? "Q-" : "" }}{{ event.seed || event.q_seed }}</span>
          </div>
          <div v-if="event.status || event.q_status">
            <span>Status: </span>
            <span>{{ event.status }}{{ event.status && event.q_status ? "/" : "" }}{{ event.q_status ? `Q-${event.q_status}` : "" }}</span>
          </div>
          <div v-if="isDefined(event.rank)">
            <span>Rank: </span>
            <span>{{ event.rank.toLocaleString() }}</span>
          </div>
          <div v-if="isDefined(event.points)">
            <span>Points: </span>
            <span>{{ event.points.toLocaleString() }}</span>
          </div>
          <div v-if="isDefined(event.pm) && event.currency">
            <span>Prize Money: </span>
            <span>{{ event.pm.toLocaleString("en-GB", { style: "currency", currency: event.currency }) }}</span>
          </div>
        </div>

        <div
          v-if="event.partner_id"
          class="flex gap-1 items-center"
        >
          <span class="text-muted">Partner: </span>
          <player-link
            :players="[
              {
                id: event.partner_id,
                first_name: event.partner_first_name,
                last_name: event.partner_last_name,
                full_name: `${event.partner_first_name} ${event.partner_last_name}`,
                country: event.partner_country
              }
            ]"
          />
          <span v-if="isDefined(event.partner_rank)"> ({{ event.partner_rank }})</span>
        </div>
      </div>
    </template>
  </u-page-card>
</template>
