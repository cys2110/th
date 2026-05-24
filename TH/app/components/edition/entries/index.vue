<script setup lang="ts">
const {
  params: { id }
} = useRoute("edition")

const viewType = ref("Players")
</script>

<template>
  <div class="flex justify-end mb-4">
    <u-radio-group
      v-model="viewType"
      :items="['Players', 'Teams']"
      orientation="horizontal"
    />
  </div>

  <edition-entries-players v-if="viewType === 'Players'" />

  <edition-entries-country-teams v-else-if="COUNTRY_DRAWS.includes(id)" />

  <edition-entries-teams v-else />
</template>
