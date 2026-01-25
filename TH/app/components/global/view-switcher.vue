<script setup lang="ts">
const viewModeStore = useViewModeStore()
</script>

<template>
  <u-tooltip :text="viewModeStore.isCardView ? 'Card' : 'Table'">
    <!--Need the div to make the tooltip work-->
    <div>
      <u-switch
        :checked-icon="ICONS.cards"
        :unchecked-icon="ICONS.table"
        v-model="viewModeStore.isCardView"
      />
    </div>
  </u-tooltip>
</template>
