<script setup lang="ts">
defineProps<{ scores: Array<ConsolidatedScore>; format: number }>()
</script>

<template>
  <div class="flex justify-center items-center gap-1">
    <template
      v-for="set_no in Array.from({ length: format }, (_, i) => 1 + i)"
      :key="set_no"
    >
      <set-score
        v-if="scores.find(s => s.set_no === set_no)"
        :score="scores.find(s => s.set_no === set_no)!"
      />
    </template>
  </div>
</template>
