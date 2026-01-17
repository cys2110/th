<script setup lang="ts">
import type { AsyncDataRequestStatus } from "#app"

defineProps<{
  stats: MatchStatsType["stats"]
  label?: string
  category: string
  status: AsyncDataRequestStatus
}>()
const {
  params: { year }
} = useRoute("match")
const matchStore = useMatchStore()
</script>

<template>
  <u-modal
    :title="`${matchStore.name} ${year}`"
    description="Service Speed"
    fullscreen
  >
    <u-button
      :label="label ?? 'Chart'"
      :icon="ICONS.gauge"
      block
      color="Active"
    />

    <template #body>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
        <match-speed-gauge
          v-for="stat in stats"
          :key="stat.label"
          :stat
          :status
        />
      </div>
    </template>
  </u-modal>
</template>
