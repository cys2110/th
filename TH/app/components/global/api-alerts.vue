<script setup lang="ts">
import { FetchError } from "ofetch"

defineProps<{
  error?: FetchError
}>()

const {
  ui: { icons }
} = useAppConfig()
</script>

<template>
  <dev-only v-if="error">
    <u-alert
      color="error"
      :icon="icons.error"
      title="Error fetching countries"
    >
      <template #description>
        <div
          v-if="Array.isArray(error.data?.data)"
          v-for="(item, index) in error.data.data"
          :key="index"
        >
          {{ item }}
        </div>
        <div v-else>{{ error.data.data }}</div>
      </template>
    </u-alert>
  </dev-only>
</template>
