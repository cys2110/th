<script setup lang="ts">
import type { FetchError } from "ofetch"

useHead({ title: "Tournaments" })

const viewModeStore = useViewModeStore()

// Pagination
</script>

<template>
  <u-container class="min-h-screen flex flex-col">
    <u-page>
      <template #left>
        <u-page-aside></u-page-aside>
      </template>

      <template
        #right
        v-if="viewModeStore.isCardView"
      >
        <u-page-aside></u-page-aside>
      </template>

      <u-page-header title="Tournaments"></u-page-header>

      <u-page-body></u-page-body>
    </u-page>
  </u-container>
</template>
