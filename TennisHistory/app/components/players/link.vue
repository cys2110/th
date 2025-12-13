<script setup lang="ts">
defineProps<{ player: PersonType; strikethrough?: boolean }>()
</script>

<template>
  <div class="flex items-center gap-2 w-fit">
    <countries-link
      :country="player.country!"
      icon-only
    />
    <u-link
      :to="{ name: 'player', params: { id: player.id, name: kebabCase(`${player.first_name}-${player.last_name}`) } }"
      class="hover-link default-link"
      :class="{ 'line-through': strikethrough }"
    >
      {{ player.first_name ? `${player.first_name} ${player.last_name}` : player.id }}
    </u-link>
  </div>
</template>
