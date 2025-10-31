<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui"
const { match } = defineProps<{
  match: (MatchInterface & { tournament: string }) | undefined
  status: APIStatusType
}>()

const {
  params: { year, mid }
} = useRoute("match")

const isBold = (row: MatchInterface["match_stats"][number], player: string) => {
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

const columns: TableColumn<MatchInterface["match_stats"][number]>[] = [
  {
    accessorKey: "p1_pc",
    meta: { class: { td: "w-2/5" } }
  },
  {
    accessorKey: "label",
    header: "",
    meta: { class: { td: "w-1/5" } }
  },
  {
    accessorKey: "p2_pc",
    meta: { class: { td: "w-2/5" } }
  }
]
</script>

<template>
  <u-table
    :data="match?.match_stats || []"
    :columns
    sticky
    :loading="status === 'pending'"
    :empty="`No match stats available for ${match?.tournament} ${year} ${mid}`"
  >
    <template #loading>
      <table-loading />
    </template>

    <template #empty>
      <u-empty
        title="No match stats available"
        :icon="ICONS.noChart"
        class="mx-2"
      />
    </template>

    <template #label-cell="{ row }">
      <matches-chart
        v-if="match && row.original.category !== 'Service Speed'"
        :category="row.original.category"
        :label="row.original.label"
        :t1="match.t1"
        :t2="match.t2"
        :stats="match.match_stats.filter(s => s.category === row.original.category)"
        :tournament="match?.tournament"
      />
      <matches-service-speed
        v-else-if="match"
        :category="row.original.category"
        :label="row.original.label"
        :p1="match.t1"
        :p2="match.t2"
        :stats="match.match_stats.filter(s => s.category === row.original.category)"
        :tournament="match?.tournament"
      />
    </template>

    <template #p1_pc-header>
      <div class="flex items-center gap-2 justify-center">
        <template
          v-for="(player, index) in match?.t1.players ?? []"
          :key="player.id"
        >
          <u-separator
            v-if="index > 0"
            orientation="vertical"
            class="h-4"
          />
          <players-link :player />
        </template>
      </div>
    </template>

    <template #p1_pc-cell="{ row }">
      <u-progress
        v-model="row.original.t1_pc"
        :max="100"
        inverted
        :ui="{
          base: 'bg-Singles-300 dark:bg-Singles-800',
          indicator: 'bg-Singles-600 dark:bg-Singles-500'
        }"
      >
        <template #status="{ percent }">
          <span :class="isBold(row.original, 'p1') ? 'font-semibold' : ''">
            {{
              ["Aces", "Double faults", "Service games", "Return games", "Winners", "Unforced errors"].includes(row.original.label)
                ? row.original.t1
                : row.original.label.includes("speed")
                ? `${row.original.t1}km/h (${Math.round(kmhToMph(row.original.t1))}mph)`
                : `${row.original.t1} (${percent}%)`
            }}
          </span>
        </template>
      </u-progress>
    </template>

    <template #p2_pc-header>
      <div class="flex items-center gap-2 justify-center">
        <template
          v-for="(player, index) in match?.t2.players ?? []"
          :key="player.id"
        >
          <u-separator
            v-if="index > 0"
            orientation="vertical"
            class="h-4"
          />
          <players-link :player />
        </template>
      </div>
    </template>

    <template #p2_pc-cell="{ row }">
      <u-progress
        v-model="row.original.t2_pc"
        :max="100"
        :ui="{
          base: 'bg-WTA-300 dark:bg-WTA-800',
          indicator: 'bg-WTA-600 dark:bg-WTA-500'
        }"
      >
        <template #status="{ percent }">
          <span :class="isBold(row.original, 'p2') ? 'font-semibold' : ''">
            {{
              ["Aces", "Double faults", "Service games", "Return games", "Winners", "Unforced errors"].includes(row.original.label)
                ? row.original.t2
                : row.original.label.includes("speed")
                ? `${row.original.t2}km/h (${Math.round(kmhToMph(row.original.t2))}mph)`
                : `${row.original.t2} (${percent}%)`
            }}
          </span>
        </template>
      </u-progress>
    </template>
  </u-table>
</template>
