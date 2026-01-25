<script setup lang="ts">
defineProps<{
  player: CountryNumberOneType
}>()

const {
  ui: { colors }
} = useAppConfig()
</script>

<template>
  <u-page-card
    :icon="getFlagCode(player.country)"
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
      <div v-if="player.singles_ch_date">
        <div>Singles Career High</div>
        <div> {{ player.ch_singles }} </div>
        <div>{{ dateTimeFormat.format(new Date(player.singles_ch_date)) }}</div>
      </div>

      <div v-if="player.doubles_ch_date">
        <div>Doubles Career High</div>
        <div> {{ player.ch_doubles }} </div>
        <div>{{ dateTimeFormat.format(new Date(player.doubles_ch_date)) }}</div>
      </div>
    </template>
  </u-page-card>
</template>
