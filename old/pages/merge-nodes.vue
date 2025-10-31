<script setup>
useHead({ title: "Merge Nodes - TH Admin" })
const {
  ui: { icons }
} = useAppConfig()
</script>

<template>
  <div class="w-full">
    <u-dashboard-panel>
      <template #header>
        <u-dashboard-navbar title="Merge Nodes">
          <template #leading>
            <u-dashboard-sidebar-collapse variant="link" />
          </template>
          <template #right>
            <u-button
              :icon="icons.reload"
              @click="reloadNuxtApp()"
            />
          </template>
        </u-dashboard-navbar>
      </template>

      <template #body>
        <umpires-merge />

        <coaches-merge />
      </template>
    </u-dashboard-panel>
  </div>
</template>
