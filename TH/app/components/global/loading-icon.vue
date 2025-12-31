<script setup lang="ts">
/** @description Default loading icon */

const {
  ui: { icons }
} = useAppConfig()
</script>

<template>
  <u-icon
    :name="icons.loading"
    class="size-8"
  />
</template>
