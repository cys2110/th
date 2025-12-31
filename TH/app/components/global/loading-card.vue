<script setup lang="ts">
/** @description Loading card component to indicate loading state with skeletons */
</script>

<template>
  <u-page-card
    highlight
    :ui="{ body: 'w-full' }"
  >
    <template #leading>
      <u-skeleton class="h-5 w-10" />
    </template>

    <template #title>
      <u-skeleton class="h-5 w-full" />
    </template>

    <template #description>
      <u-skeleton class="h-5 w-1/2" />
    </template>
  </u-page-card>
</template>
