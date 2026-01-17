<script setup lang="ts">
import type { AsyncDataRequestStatus } from "#app"

defineProps<{
  players: BasePlayerType[]
  status: AsyncDataRequestStatus
}>()
</script>

<template>
  <div class="scrollbar p-5">
    <u-page-columns v-if="players.length || status === 'pending'">
      <players-card
        v-if="players.length"
        v-for="player in players"
        :key="player.id"
        :player
      />

      <players-loading-card
        v-else
        v-for="_ in 6"
        :key="_"
      />
    </u-page-columns>

    <empty
      v-else
      message="No players found"
      :icon="ICONS.peopleOff"
    >
      <dev-only>
        <players-create />
      </dev-only>
    </empty>
  </div>
</template>
