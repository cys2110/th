<script setup lang="ts">
const props = defineProps<{
  tournaments: Array<TournamentType>
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
    v-if="tournaments.length || pending"
    class="scrollbar"
  >
    <u-page-grid class="2xl:grid-cols-4">
      <tournaments-card
        v-if="tournaments.length"
        v-for="tournament in tournaments"
        :key="tournament.id"
        :tournament
      />

      <loading-card
        v-if="pending"
        v-for="_ in 6"
        :key="_"
      />
    </u-page-grid>
  </div>

  <empty
    v-else
    message="No tournaments found"
    :icon="ICONS.trophyOff"
  />
</template>
