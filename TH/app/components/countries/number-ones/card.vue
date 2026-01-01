<script setup lang="ts">


defineProps<{ player: CountryNumberOneType }>()

const {
  ui: { colors }
} = useAppConfig()
</script>

<template>
  <u-page-card
    :title="`${player.first_name} ${player.last_name}`"
    :to="{
      name: 'player',
      params: {
        id: player.id,
        name: kebabCase(`${player.first_name}-${player.last_name}`)
      }
    }"
    highlight
    :highlight-color="(player.tour as keyof typeof colors)"
    :ui="{
      body: 'w-full',
      description: 'grid grid-cols-2 items-center'
    }"
  >
    <template #description>
      <div
        v-if="player.singles_ch_date"
        class="flex flex-col *:first:font-semibold *:not-first:text-default *:not-first:ml-3"
      >
        <div>Singles Career High</div>
        <div> {{ player.ch_singles }} </div>
        <div>{{ useDateFormat(player.singles_ch_date, "DD MMMM YYYY") }}</div>
      </div>

      <div
        v-if="player.doubles_ch_date"
        class="flex flex-col *:first:font-semibold *:not-first:text-default *:not-first:ml-3"
      >
        <div>Doubles Career High</div>
        <div> {{ player.ch_doubles }} </div>
        <div>{{ useDateFormat(player.doubles_ch_date, "DD MMMM YYYY") }}</div>
      </div>
    </template>
  </u-page-card>
</template>
