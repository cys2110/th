<script setup lang="ts">
import type { AsyncDataRequestStatus } from "#app"
import type { ButtonProps, ContextMenuItem, TableRow } from "@nuxt/ui"
import { getFacetedMinMaxValues, getFacetedRowModel, getFacetedUniqueValues, getGroupedRowModel } from "@tanstack/vue-table"

const props = defineProps<{
  teams: {
    team1: H2HTeamType
    team2: H2HTeamType
  }
  matches: H2HMatchType[]
  status: AsyncDataRequestStatus
}>()

const toast = useToast()
const table = useTemplateRef("table")

const items = ref<ContextMenuItem[]>([])

const getRowItems = (row: TableRow<H2HMatchType>) => {
  return [
    {
      type: "label" as const,
      label: "Go to..."
    },
    ...(row.original.winning_team === "t1" ? props.teams.team1.players : props.teams.team2.players).map(p => ({
      label: `${p.first_name} ${p.last_name}`,
      icon: ICONS.player,
      to: { name: "player", params: { id: p.id, name: kebabCase(`${p.first_name} ${p.last_name}`) } }
    })),
    {
      label: row.original.tournament.name,
      icon: ICONS.trophy,
      to: {
        name: "tournament",
        params: {
          id: row.original.tournament.id,
          name: kebabCase(row.original.tournament.name)
        }
      }
    },
    {
      label: row.original.year.toString(),
      icon: ICONS.calendar,
      to: {
        name: "edition",
        params: {
          id: row.original.tournament.id,
          name: kebabCase(row.original.tournament.name),
          year: row.original.year,
          edId: row.original.id
        }
      }
    },
    {
      label: "Stats",
      icon: ICONS.stats,
      to: {
        name: "match",
        params: {
          id: row.original.tournament.id,
          name: kebabCase(row.original.tournament.name),
          year: row.original.year,
          edId: row.original.id
        },
        query: {
          tour: row.original.tour,
          draw: row.original.round.includes("Qualifying") || row.original.round === "Qualifier" ? "Qualifying" : "Main",
          type: props.teams.team1.players.length > 1 ? "Doubles" : "Singles",
          match_no: row.original.match_no
        }
      }
    }
  ] as ContextMenuItem[]
}

const onContextmenu = (e: Event, row: TableRow<H2HMatchType>) => {
  items.value = getRowItems(row)
}

const handleSelect = async (e: Event, row: TableRow<H2HMatchType>) => {
  toast.clear()

  if (row.getIsGrouped()) {
    row.toggleExpanded()
  } else if (row.original.stats) {
    const draw = row.original.round.includes("Qualifying") || row.original.round === "Qualifier" ? "Qualifying" : "Main"
    const type = props.teams.team1.players.length > 1 ? "Doubles" : "Singles"

    toast.add({
      title: "Go to",
      duration: Infinity,
      progress: false,
      ui: { actions: "flex-wrap" },
      actions: [
        ...(row.original.winning_team === "t1" ? props.teams.team1.players : props.teams.team2.players).map(
          p =>
            ({
              label: `${p.first_name} ${p.last_name}`,
              icon: ICONS.player,
              to: { name: "player", params: { id: p.id, name: kebabCase(`${p.first_name} ${p.last_name}`) } }
            } as ButtonProps)
        ),
        {
          label: row.original.tournament.name,
          icon: ICONS.trophy,
          to: {
            name: "tournament",
            params: {
              id: row.original.tournament.id,
              name: kebabCase(row.original.tournament.name)
            }
          }
        },
        {
          label: row.original.year.toString(),
          icon: ICONS.calendar,
          to: {
            name: "edition",
            params: {
              id: row.original.tournament.id,
              name: kebabCase(row.original.tournament.name),
              year: row.original.year,
              edId: row.original.id
            }
          }
        },
        {
          label: "Stats",
          icon: ICONS.stats,
          to: {
            name: "match",
            params: {
              id: row.original.tournament.id,
              name: kebabCase(row.original.tournament.name),
              year: row.original.year,
              edId: row.original.id
            },
            query: {
              tour: row.original.tour,
              draw,
              type,
              match_no: row.original.match_no
            }
          }
        }
      ]
    })
  } else {
    toast.add({
      title: "No statistics available for this match",
      color: "error"
    })
  }
}

onUnmounted(() => {
  toast.clear()
})
onBeforeRouteLeave(() => {
  toast.clear()
})
</script>

<template>
  <dashboard-subpanel
    title="Matches"
    :icon="ICONS.scores"
  >
    <template #right>
      <div class="flex items-center gap-2">
        <u-button
          :icon="ICONS.filterOff"
          label="Clear Filters"
          @click="() => table?.tableApi.resetColumnFilters()"
        />

        <u-button
          :icon="ICONS.sort"
          label="Clear Sorting"
          @click="() => table?.tableApi.resetSorting()"
        />

        <u-button
          :icon="ICONS.groupOff"
          label="Clear Grouping"
          @click="() => table?.tableApi.resetGrouping()"
        />
      </div>
    </template>

    <u-context-menu :items>
      <u-table
        ref="table"
        :data="matches"
        :columns="h2hMatchesColumns(teams)"
        :loading="status === 'pending'"
        sticky
        @select="handleSelect"
        @contextmenu="onContextmenu"
        :faceted-options="{
          getFacetedRowModel: getFacetedRowModel(),
          getFacetedMinMaxValues: getFacetedMinMaxValues(),
          getFacetedUniqueValues: getFacetedUniqueValues()
        }"
        :grouping-options="{
          getGroupedRowModel: getGroupedRowModel()
        }"
        :meta="{
          class: {
            tr: (row: TableRow<H2HMatchType>) => (!row.getIsGrouped() ? row.original.winning_team === 't1' ? 'bg-violet-700/30 ' : 'bg-emerald-700/30 ' : '') + (!row.original.stats ? 'cursor-default' : '')
          }
        }"
        :ui="{ td: 'empty:p-0' }"
      >
        <template #loading>
          <loading-icon />
        </template>
        <template #empty>
          <empty
            :message="`No matches played between ${teams.team1.players
              .map(p => `${p.first_name} ${p.last_name}`)
              .join(' / ')} and ${teams.team2.players.map(p => `${p.first_name} ${p.last_name}`).join(' / ')}`"
            :icon="ICONS.h2hOff"
          />
        </template>
      </u-table>
    </u-context-menu>
  </dashboard-subpanel>
</template>
