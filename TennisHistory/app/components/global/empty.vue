<script setup lang="ts">
defineProps<{
  message: string
  icon?: string
}>()

const {
  ui: { icons }
} = useAppConfig()
</script>

<template>
  <u-empty
    :title="message"
    :icon="icon ?? icons.caution"
    description="If you think this is an error, refresh the page. Otherwise, please be patient as we continue to add more data."
  >
    <template #actions>
      <u-button
        label="Refresh"
        :icon="icons.reload"
        @click="reloadNuxtApp()"
      />
      <slot />
    </template>
  </u-empty>
</template>
