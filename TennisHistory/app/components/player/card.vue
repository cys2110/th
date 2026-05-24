<script setup lang="ts">
const props = defineProps<{ player: PlayerListType }>()

const currentYear = new Date().getFullYear()

const activeStatus = computed(() => {
  if (!props.player.last_tournament || props.player.last_tournament < currentYear) return "Inactive"

  return "Active"
})
</script>

<template>
  <u-chip
    :color="activeStatus"
    size="3xl"
    class="w-full"
  >
    <u-page-card
      :icon="player.country ? getFlagCode(player.country) : undefined"
      :title="player.full_name || '—'"
      highlight
      :highlight-color="player.tour"
      :to="{
        name: 'player',
        params: {
          id: player.id,
          name: kebabCase(player.full_name || '—')
        }
      }"
      :ui="{
        root: 'flex-1 h-full',
        body: 'w-full',
        leading: 'flex justify-between items-center w-full',
        footer: 'text-sm w-full text-muted'
      }"
    >
      <template
        #footer
        v-if="player.first_tournament && player.last_tournament"
      >
        <span>{{ player.first_tournament }}</span>
        <span v-if="player.last_tournament >= currentYear"> - present</span>
        <span v-else-if="player.first_tournament !== player.last_tournament"> - {{ player.last_tournament }}</span>
      </template>
    </u-page-card>
  </u-chip>
</template>
