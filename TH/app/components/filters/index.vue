<script setup lang="ts">
defineProps<{
  showResetFilters: boolean
}>()

defineEmits(["reset-filters"])

const viewModeStore = useViewModeStore()
</script>

<template>
  <u-form-field
    v-if="viewModeStore.isCardView"
    label="Filter by"
  >
    <div class="*:my-2">
      <slot />
    </div>
  </u-form-field>

  <u-button
    v-if="showResetFilters"
    label="Reset Filters"
    block
    :icon="ICONS.filterOff"
    @click="$emit('reset-filters')"
  />
</template>
