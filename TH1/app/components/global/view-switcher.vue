<script setup lang="ts">
const viewModeStore = useViewModeStore()
</script>

<template>
  <u-tooltip :text="viewModeStore.isCardView ? 'Card' : 'Table'">
    <!--Need the div to make the tooltip work-->
    <div>
      <u-switch
        v-model="viewModeStore.isCardView"
        :checked-icon="ICONS.cards"
        :unchecked-icon="ICONS.table"
      />
    </div>
  </u-tooltip>
</template>
