<script setup lang="ts">
import type { AsyncDataRequestStatus } from "#app"
import type { TableColumn } from "@nuxt/ui"

const props = defineProps<{
  match: MatchStatsType | undefined
  status: AsyncDataRequestStatus
}>()

const {
  params: { year }
} = useRoute("match")

const tour = useRouteQuery("tour")
const matchNo = useRouteQuery("match_no")
const matchStore = useMatchStore()

const isBold = (row: MatchStatsType["stats"][number], player: string) => {
  const lowStats = ["Double faults", "Unforced errors"]
  switch (player) {
    case "p1":
      if (lowStats.includes(row.label)) {
        return row.t1_pc < row.t2_pc
      } else if (
        (row.label === "Break points saved" && row.t1.endsWith("/0") && !row.t2.endsWith("/0")) ||
        (row.label === "Break points converted" && !row.t1.endsWith("/0") && row.t2.endsWith("/0"))
      ) {
        return true
      } else if (
        (row.label === "Break points saved" && !row.t1.endsWith("/0") && row.t2.endsWith("/0")) ||
        (row.label === "Break points converted" && row.t1.endsWith("/0") && !row.t2.endsWith("/0"))
      ) {
        return false
      } else {
        return row.t1_pc > row.t2_pc
      }
    default:
      if (lowStats.includes(row.label)) {
        return row.t2_pc < row.t1_pc
      } else if (
        (row.label === "Break points saved" && !row.t1.endsWith("/0") && row.t2.endsWith("/0")) ||
        (row.label === "Break points converted" && row.t1.endsWith("/0") && !row.t2.endsWith("/0"))
      ) {
        return true
      } else if (
        (row.label === "Break points saved" && row.t1.endsWith("/0") && !row.t2.endsWith("/0")) ||
        (row.label === "Break points converted" && !row.t1.endsWith("/0") && row.t2.endsWith("/0"))
      ) {
        return false
      } else {
        return row.t2_pc > row.t1_pc
      }
  }
}

const columns: TableColumn<MatchStatsType["stats"][number]>[] = [
  {
    accessorKey: "t1_pc",
    meta: { class: { td: "w-2/5" } }
  },
  {
    accessorKey: "label",
    header: "",
    meta: { class: { td: "w-1/5" } }
  },
  {
    accessorKey: "t2_pc",
    meta: { class: { td: "w-2/5 text-right" } }
  }
]
</script>

<template>
  <u-table
    :data="match?.stats || []"
    :columns
    sticky
    :loading="status === 'pending'"
    :empty="`No match stats available for ${matchStore.name} ${year} ${tour} ${matchNo}`"
  >
    <template #loading>
      <loading-icon />
    </template>

    <template #empty>
      <empty message="No match stats found" />
    </template>

    <template #label-cell="{ row }">
      <match-chart
        v-if="match && row.original.category !== 'Service Speed'"
        :category="row.original.category"
        :label="row.original.label"
        :stats="match.stats.filter(s => s.category === row.original.category)"
        :status
      />
      <match-service-speed
        v-else-if="match"
        :category="row.original.category"
        :label="row.original.label"
        :stats="match.stats.filter(s => s.category === row.original.category)"
        :status
      />
    </template>

    <template #t1_pc-header>
      <div class="flex items-center gap-2 justify-center">
        <template
          v-for="(player, index) in match?.t1?.team ?? []"
          :key="player.id"
        >
          <u-separator
            v-if="index > 0"
            orientation="vertical"
            class="h-4"
          />
          <player-link :player />
        </template>
      </div>
    </template>

    <template #t1_pc-cell="{ row }">
      <u-progress
        v-model="row.original.t1_pc"
        :max="100"
        inverted
        :ui="{
          base: 'bg-violet-300 dark:bg-violet-800',
          indicator: 'bg-violet-600 dark:bg-violet-500'
        }"
      >
        <template #status="{ percent }">
          <span :class="isBold(row.original, 'p1') ? 'font-semibold' : ''">
            {{
              ["Aces", "Double faults", "Service games", "Return games", "Winners", "Unforced errors"].includes(row.original.label)
                ? row.original.t1
                : row.original.label.includes("speed")
                ? `${row.original.t1} km/h (${convertKmhToMph(Number(row.original.t1))} mph)`
                : `${row.original.t1} (${percent}%)`
            }}
          </span>
        </template>
      </u-progress>
    </template>

    <template #t2_pc-header>
      <div class="flex items-center gap-2 justify-center">
        <template
          v-for="(player, index) in match?.t2?.team ?? []"
          :key="player.id"
        >
          <u-separator
            v-if="index > 0"
            orientation="vertical"
            class="h-4"
          />
          <player-link :player />
        </template>
      </div>
    </template>

    <template #t2_pc-cell="{ row }">
      <u-progress
        v-model="row.original.t2_pc"
        :max="100"
        :ui="{
          base: 'bg-emerald-300 dark:bg-emerald-800',
          indicator: 'bg-emerald-600 dark:bg-emerald-500'
        }"
      >
        <template #status="{ percent }">
          <span :class="isBold(row.original, 'p2') ? 'font-semibold' : ''">
            {{
              ["Aces", "Double faults", "Service games", "Return games", "Winners", "Unforced errors"].includes(row.original.label)
                ? row.original.t2
                : row.original.label.includes("speed")
                ? `${row.original.t2} km/h (${convertKmhToMph(Number(row.original.t2))} mph)`
                : `${row.original.t2} (${percent}%)`
            }}
          </span>
        </template>
      </u-progress>
    </template>
  </u-table>
</template>
