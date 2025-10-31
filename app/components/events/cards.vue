<script setup lang="ts">
const {
  params: { id }
} = useRoute("event")
</script>

<template>
  <events-wrapper-cards>
    <events-country v-if="COUNTRY_DRAWS.includes(id)" />

    <events-overview v-else />
  </events-wrapper-cards>
</template>
