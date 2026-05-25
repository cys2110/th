<script setup lang="ts">
defineProps<{ score: ConsolidatedScore }>()
</script>

<template>
  <div>
    <span>{{ score.t1_set }}</span>
    <span>{{ score.t2_set }}</span>
    <sup v-if="isDefined(score.t1_tb) || isDefined(score.t2_tb)">
      {{ Math.min(score.t1_tb || 9999, score.t2_tb || 9999) }}
    </sup>
  </div>
</template>
