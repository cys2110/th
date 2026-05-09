<script setup lang="ts">
definePageMeta({ name: "player" })

const {
  params: { id, name }
} = useRoute("player")

const {
  ui: { icons }
} = useAppConfig()

const playerStore = usePlayerStore()
</script>

<template>
  <u-container>
    <u-page>
      <player-wrapper />

      <u-page-body></u-page-body>
    </u-page>
  </u-container>
</template>
