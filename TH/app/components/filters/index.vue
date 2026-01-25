<script setup lang="ts">
defineProps<{
  showResetFilters: boolean
}>()

defineEmits(["reset-filters"])
</script>

<template>
  <u-form-field label="Filter by">
    <div class="*:my-2">
      <slot />
    </div>

    <u-button
      v-if="showResetFilters"
      label="Reset Filters"
      block
      :icon="ICONS.filterOff"
      @click="$emit('reset-filters')"
    />
  </u-form-field>
</template>
