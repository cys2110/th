<script setup lang="ts">
const props = defineProps<{
  players: Array<PlayersItemType>
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
    ref="el"
    v-if="players.length || pending"
    class="scrollbar"
  >
    <u-page-grid class="xl:grid-cols-4 2xl:grid-cols-5">
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

  <u-empty
    v-else
    :icon="ICONS.peopleOff"
    title="No players found"
    description="If you think this is an error, refresh the page. Otherwise, please be patient as we continue to add more data."
  >
    <template #actions>
      <u-button
        label="Refresh"
        :icon="icons.reload"
        @click="$emit('refresh')"
      />
    </template>
  </u-empty>
</template>
