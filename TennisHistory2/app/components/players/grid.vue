<script setup lang="ts">
const props = defineProps<{
  players: Array<PlayersItemType>
  pending: boolean
  canLoadMore: boolean
}>()

const emits = defineEmits<{
  "load-more": []
}>()

const el = useTemplateRef("el")

useInfiniteScroll(el, () => emits("load-more"), {
  distance: 10,
  canLoadMore: () => props.canLoadMore
})
</script>

<template>
  <div
    ref="el"
    v-if="players.length || pending"
    class="scrollbar"
  >
    <u-page-grid class="2xl:grid-cols-4">
      <players-card
        v-if="players.length"
        v-for="player in players"
        :key="player.id"
        :player
      />

      <players-loading
        v-if="pending"
        v-for="_ in 6"
        :key="_"
      />
    </u-page-grid>
  </div>

  <empty
    v-else
    message="No players found"
    :icon="ICONS.peopleOff"
  />
</template>
