<script setup lang="ts">
defineProps<{ message: string; icon?: string }>()
const {
  ui: { icons }
} = useAppConfig()
</script>

<template>
  <u-alert
    :title="message"
    :icon="icon ?? icons.caution"
    color="error"
  />
</template>
