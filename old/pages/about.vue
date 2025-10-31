<script setup lang="ts">
useHead({ title: "About" })
const { viewMode } = useViewMode()
</script>

<template>
  <div classs="w-full">
    <u-dashboard-panel v-if="viewMode === 'table'">
      <template #header>
        <u-dashboard-navbar>
          <template #title>
            <page-title />
          </template>
        </u-dashboard-navbar>

        <u-dashboard-toolbar>
          <div class="text-muted text-xl">
            DISCLAIMER: This website is not intended to infringe on any copyright. It is not intended for any monetary or any other disallowed
            purpose.
          </div>
        </u-dashboard-toolbar>
      </template>

      <template #body>
        <about />
      </template>
    </u-dashboard-panel>

    <u-container class="w-(--container-6xl)">
      <u-page>
        <u-page-header title="About" />

        <u-page-body>
          <about />
        </u-page-body>
      </u-page>
    </u-container>
  </div>
</template>
