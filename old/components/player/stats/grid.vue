<script setup lang="ts">
defineProps<{ stats: PlayerStatsType[]; status: APIStatusType; years: string[] | undefined; tour: TourType; firstName: string; lastName: string }>()
const { icons } = useAppConfig()
</script>

<template>
  <u-page-grid v-if="stats.length || status === 'pending'">
    <u-card
      v-if="stats.length"
      v-for="stat in stats"
      :key="stat.category"
      :class="`ring-${tour.toLowerCase()}`"
    >
      <template #header>
        {{ stat.category }}
      </template>

      <u-progress
        v-if="stat.suffix !== false"
        v-model="stat.value"
        :max="100"
        status
        :ui="{
          base: tour === 'ATP' ? 'bg-atp-300 dark:bg-atp-800' : 'bg-wta-300 dark:bg-wta-800',
          indicator: tour === 'ATP' ? 'bg-atp-600 dark:bg-atp-500' : 'bg-wta-600 dark:bg-wta-500'
        }"
      />

      <span v-else>{{ stat.value }}</span>
    </u-card>
    <loading-base
      v-else
      v-for="_ in 5"
      :key="_"
    />
  </u-page-grid>
  <error-message
    v-else
    :icon="icons.noChart"
    :message="`No stats available for ${firstName} ${lastName}`"
  />
</template>
