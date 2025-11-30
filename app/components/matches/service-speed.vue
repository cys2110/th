<script setup lang="ts">
defineProps<{
  stats: MatchStatsType["stats"]
  label?: string
  category: string
  tournament: string
}>()
const { params } = useRoute()
const { year } = params as { year?: string }
</script>

<template>
  <u-modal
    :title="`${tournament} ${year}`"
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
        <matches-speed-gauge
          v-for="stat in stats"
          :key="stat.label"
          :stat
        />
      </div>
    </template>
  </u-modal>
</template>
