<script setup lang="ts">
const viewType = ref("By Player")
const refresh = ref(0)
</script>

<template>
  <dashboard-subpanel
    id="entries"
    title="Entries"
    :icon="ICONS.player"
  >
    <template #right>
      <dev-only>
        <events-entries-update
          v-model="refresh"
          class="mx-1"
        />
      </dev-only>
      <u-radio-group
        v-model="viewType"
        :items="['By Player', 'By Team']"
        orientation="horizontal"
      />
    </template>

    <events-entries-players
      v-if="viewType === 'By Player'"
      :refresh
    />

    <events-entries-teams
      v-else
      :refresh
    />
  </dashboard-subpanel>
</template>
