<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui"
defineProps<{ stats: PlayerStatsType[]; status: APIStatusType; years: string[] | undefined; tour: TourType; firstName: string; lastName: string }>()

const columns: TableColumn<{ category: string; value: number; suffix?: boolean }>[] = [
  { accessorKey: "category", header: "", meta: { class: { th: "w-1/2", td: "w-1/3" } } },
  { accessorKey: "value", header: "", meta: { class: { th: "w-2/3", td: "w-2/3" } } }
]
</script>

<template>
  <u-table
    :data="stats"
    :columns
    class="w-full md:w-3/4 lg:w-2/3 xl:w-1/2 mx-auto scrollbar-thin scrollbar-thumb-primary-600 scrollbar-track-transparent"
    :loading="['pending', 'idle'].includes(status)"
    :empty="`No stats available for ${firstName} ${lastName} ${years ? `in ${years.join(' | ')}` : ''}`"
  >
    <template #value-cell="{ row }">
      <template v-if="(row.original as PlayerStatsType).suffix === false">{{ (row.original as PlayerStatsType).value }}</template>
      <u-progress
        v-else
        v-model="(row.original as PlayerStatsType).value"
        :max="100"
        :ui="{
          base: tour === 'ATP' ? 'bg-atp-300 dark:bg-atp-950' : 'bg-wta-300 dark:bg-wta-950',
          indicator: tour === 'ATP' ? 'bg-atp-600' : 'bg-wta-600',
          status: '!w-full text-muted'
        }"
      >
        <template #status="{ percent }">{{ percent }}%</template>
      </u-progress>
    </template>
  </u-table>
</template>
