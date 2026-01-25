<script setup lang="ts">
definePageMeta({ name: "edition" })

const {
  params: { id, edId }
} = useRoute("edition")
const {
  ui: { icons }
} = useAppConfig()
</script>

<template>
  <div> Page: tournaments/[name]/[id]/[year]/[edId]/index </div>
</template>
