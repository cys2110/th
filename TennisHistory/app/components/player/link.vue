<script setup lang="ts">
withDefaults(defineProps<{ players: Array<Required<BasePlayerType>>; strikethrough?: boolean }>(), { strikethrough: false })
</script>

<template>
  <div class="max-w-fit">
    <div class="relative">
      <country-link
        v-for="(player, index) in players"
        :key="player.id"
        :country="player.country"
        icon-only
        class="absolute"
        :class="{ 'z-10 left-3': index === 1 }"
      />
    </div>

    <div :class="players.length === 1 ? 'ml-7' : 'ml-10'">
      <template
        v-for="(player, index) in players"
        :key="player.id"
      >
        <span v-if="index > 0"> / </span>

        <u-link
          :to="{ name: 'player', params: { id: player.id, name: kebabCase(player.full_name || '—') } }"
          class="hover-link primary-link"
          :class="{ 'line-through': strikethrough }"
        >
          {{ player.first_name }} {{ player.last_name }}
        </u-link>
      </template>
    </div>
  </div>
</template>
