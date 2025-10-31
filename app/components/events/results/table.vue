<script setup lang="ts">
defineProps<{
  matches: MatchInterface[]
  status: APIStatusType
}>()
</script>

<template>
  <events-wrapper-table>
    <template #toolbar>
      <dev-only>
        <matches-update />
      </dev-only>
    </template>
  </events-wrapper-table>
</template>
