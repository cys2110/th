<script setup lang="ts">
import { TableClientGroupHeader, TableClientSortHeader, USelectMenu } from "#components"
import type { TableColumn } from "@nuxt/ui"
import { getFacetedRowModel, getFacetedUniqueValues, getGroupedRowModel, type Column } from "@tanstack/vue-table"

const {
  params: { edId, year }
} = useRoute("edition")

const {
  ui: { colors }
} = useAppConfig()

const supabase = useSupabaseClient()

const tournamentStore = useTournamentStore()

const {
  data: awards,
  pending,
  refresh
} = await useAsyncData(
  "awards",
  async () => {
    const { data, error } = await supabase
      .from("rounds")
      .select(
        `*,
        ...events!inner(
          currency
        )
      `
      )
      .eq("events.edition_id", Number(edId))
      .order("tour", { ascending: true })
      .order("number", { ascending: true })
      .order("match_type", { ascending: false })

    if (error || !data) {
      console.error("Error fetching awards:", error)
      return []
    }

    return data
  },
  { default: () => [] }
)

const columns: Array<TableColumn<AwardInterface>> = [
  { accessorKey: "tour" },
  { accessorKey: "match_type" },
  {
    accessorKey: "number",
    header: ({ column }) => {
      const sortedUniqueValues = useArrayUnique(Array.from(column.getFacetedUniqueValues().keys()))
        .value.sort()
        .map(value => ({
          value: value,
          label: awards.value.find(award => award.number === value)?.round
        }))

      return h("div", { class: "flex justify-center items-center gap-0.5" }, [
        h(TableClientGroupHeader, { column: column as Column<unknown> }),
        // @ts-expect-error
        h(USelectMenu, {
          placeholder: "Round",
          variant: "none",
          clear: true,
          items: sortedUniqueValues,
          modelValue: column.getFilterValue(),
          "onUpdate:modelValue": (value: string) => column.setFilterValue(value),
          class: "w-fit",
          multiple: true,
          valueKey: "value",
          labelKey: "label"
        }),
        h(TableClientSortHeader, { column: column as Column<unknown> })
      ])
    }
  },
  { accessorKey: "pm", header: "Prize Money" },
  { accessorKey: "points", header: "Points" }
]
</script>

<template>
  <dashboard-subpanel
    title="Awards"
    :icon="ICONS.money"
  >
    <template #right>
      <dev-only>
        <edition-awards-create @refresh="refresh" />
      </dev-only>

      <edition-awards-chart
        v-if="awards.length"
        :awards
        :pending
      />
    </template>

    <u-table
      :data="awards"
      :columns
      :loading="pending"
      sticky
      render-fallback-value="—"
      :faceted-options="{
        getFacetedRowModel: getFacetedRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues()
      }"
      :grouping-options="{
        getGroupedRowModel: getGroupedRowModel()
      }"
      :meta="{
        class: {
          tr: row => (row.original.draw === 'Qualifying' ? 'bg-muted/50' : '')
        }
      }"
      :ui="{ td: 'empty:p-0' }"
    >
      <template #loading>
        <loading-icon />
      </template>

      <template #empty>
        <empty
          :message="`No rounds found for ${tournamentStore.name} ${year}`"
          :icon="ICONS.moneyOff"
        />
      </template>

      <template #tour-header="{ column }">
        <div class="flex justify-center items-center gap-0.5">
          <table-client-group-header :column />
          <table-client-filter-header
            :column
            label="Tour"
            :icon="ICONS.tour"
          />
          <table-client-sort-header :column />
        </div>
      </template>

      <template #tour-cell="{ row, table }">
        <table-row-toggle
          v-if="row.getIsGrouped() && row.groupingColumnId === 'tour'"
          :row
        >
          <u-badge
            :label="<string>row.original.tour"
            :color="<keyof typeof colors>row.original.tour"
          />
        </table-row-toggle>

        <u-badge
          v-else-if="!row.getIsGrouped() && !table.getState().grouping.includes('tour')"
          :label="<string>row.original.tour"
          :color="<keyof typeof colors>row.original.tour"
        />

        <template v-else>{{ " " }}</template>
      </template>

      <template #match_type-header="{ column }">
        <div class="flex justify-center items-center gap-0.5">
          <table-client-group-header :column />
          <table-client-filter-header
            :column
            label="S/D"
            :icon="ICONS.people"
          />
          <table-client-sort-header :column />
        </div>
      </template>

      <template #match_type-cell="{ row, table }">
        <table-row-toggle
          v-if="row.getIsGrouped() && row.groupingColumnId === 'match_type'"
          :row
        >
          <u-badge
            :label="<string>row.original.match_type"
            :color="<keyof typeof colors>row.original.match_type"
          />
        </table-row-toggle>

        <u-badge
          v-else-if="!row.getIsGrouped() && !table.getState().grouping.includes('match_type')"
          :label="<string>row.original.match_type"
          :color="<keyof typeof colors>row.original.match_type"
        />

        <template v-else>{{ " " }}</template>
      </template>

      <template #number-cell="{ row, table }">
        <table-row-toggle
          v-if="row.getIsGrouped() && row.groupingColumnId === 'number'"
          :row
        >
          {{ row.original.round }}
        </table-row-toggle>

        <template v-else-if="!row.getIsGrouped() && !table.getState().grouping.includes('number')">{{ row.original.round }}</template>

        <template v-else>{{ " " }}</template>
      </template>

      <template #pm-cell="{ row }">
        <template v-if="row.getIsGrouped()">{{ " " }}</template>
        <template v-else-if="isDefined(row.original.pm)">{{
          row.original.pm.toLocaleString("en-GB", { style: "currency", currency: row.original.currency || "USD" })
        }}</template>
        <template v-else>—</template>
      </template>

      <template #points-cell="{ row }">
        <template v-if="row.getIsGrouped()">{{ " " }}</template>
        <template v-else-if="isDefined(row.original.points)">{{ row.original.points.toLocaleString("en-GB") }}</template>
        <template v-else>—</template>
      </template>
    </u-table>
  </dashboard-subpanel>
</template>
