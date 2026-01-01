<script setup lang="ts">
/** Reusable component to display a grid of details */
</script>

<template>
  <div
    class="columns-1 md:columns-2 lg:columns-3 gap-3 text-sm space-y-3 *:border *:border-primary *:rounded-md *:p-3 *:break-inside-avoid-column *:will-change-transform *:*:first:font-semibold *:*:first:text-muted *:*:not-first:ml-3"
  >
    <slot />
  </div>
</template>
