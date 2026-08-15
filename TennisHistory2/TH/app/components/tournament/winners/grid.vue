<script setup lang="ts">
import { ICONS } from "#imports"

const props = defineProps<{
  editions: Array<EditionWinnerType>
  pending: boolean
}>()

const emits = defineEmits<{ refresh: [] }>()

const tournamentStore = useTournamentStore()

const groupedEditions = computed(() => groupBy(props.editions, "edition_id"))
</script>

<template>
  <u-page-grid
    v-if="editions.length || pending"
    class="2xl:grid-cols-4 p-5"
  >
    <tournament-winners-card
      v-if="editions.length"
      v-for="[key, value] in Object.entries(groupedEditions)"
      :key="key"
      :events="value"
    />

    <loading-card
      v-if="pending"
      v-for="_ in 6"
      :key="_"
    />
  </u-page-grid>

  <empty
    v-else
    :title="`No player has won ${tournamentStore.name}`"
    :icon="ICONS.calendarOff"
    @refresh="$emit('refresh')"
  />
</template>
