<script setup lang="ts">
/** @description Component to switch between card and table view modes. */

const viewMode = useViewModeStore()
</script>

<template>
  <u-tooltip :text="viewMode.isCardView ? 'Cards' : 'Table'">
    <!--Need the div to make the tooltip work-->
    <div>
      <u-switch
        v-model="viewMode.isCardView"
        :checked-icon="ICONS.cards"
        :unchecked-icon="ICONS.table"
      />
    </div>
  </u-tooltip>
</template>
