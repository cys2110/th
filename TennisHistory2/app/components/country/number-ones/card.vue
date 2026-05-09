<script setup lang="ts">
defineProps<{
  player: Pick<PlayerInterface, "id" | "first_name" | "last_name" | "tour" | "ch_singles" | "ch_singles_date" | "ch_doubles" | "ch_doubles_date">
}>()

const {
  ui: { colors }
} = useAppConfig()
</script>

<template>
  <u-page-card
    :title="`${player.first_name} ${player.last_name}`"
    highlight
    :highlight-color="<keyof typeof colors>player.tour"
    :to="{
      name: 'player',
      params: {
        id: player.id,
        name: kebabCase(`${player.first_name}-${player.last_name}`)
      }
    }"
    :ui="{
      body: 'w-full',
      description:
        'grid grid-cols-1 xl:grid-cols-2 items-center *:flex *:flex-col *:*:first:font-semibold *:*:not-first:text-default *:*:not-first:ml-3'
    }"
  >
    <template #description>
      <div v-if="player.ch_singles_date">
        <div>Singles Career High</div>
        <div> {{ player.ch_singles }} </div>
        <div>{{ dateFormat.format(new Date(player.ch_singles_date)) }}</div>
      </div>

      <div v-if="player.ch_doubles_date">
        <div>Doubles Career High</div>
        <div> {{ player.ch_doubles }} </div>
        <div>{{ dateFormat.format(new Date(player.ch_doubles_date)) }}</div>
      </div>
    </template>
  </u-page-card>
</template>
