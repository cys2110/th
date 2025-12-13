<script setup lang="ts">
const viewMode = defineModel<boolean>()
</script>

<template>
  <u-tooltip :text="viewMode ? 'Cards' : 'Table'">
    <div>
      <u-switch
        v-model="viewMode"
        :checked-icon="ICONS.cards"
        :unchecked-icon="ICONS.table"
      />
    </div>
  </u-tooltip>
</template>
