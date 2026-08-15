<script setup lang="ts">
import { ICONS } from "#imports"

const props = defineProps<{
  tournaments: Array<TournamentInterface>
  pending: boolean
  canLoadMore: boolean
}>()

const emits = defineEmits<{
  "load-more": []
  refresh: []
}>()

const {
  ui: { icons }
} = useAppConfig()

const el = useTemplateRef("el")

useInfiniteScroll(el, () => emits("load-more"), {
  distance: 10,
  canLoadMore: () => props.canLoadMore
})
</script>

<template>
  <div
    v-if="tournaments.length || pending"
    ref="el"
    class="scrollbar"
  >
    <u-page-grid class="xl:grid-cols-4 2xl:grid-cols-5">
      <tournament-card
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
    :icon="ICONS.trophyOff"
    title="No tournaments found"
    @refresh="$emit('refresh')"
  />
</template>
