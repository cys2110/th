<script setup lang="ts">
const props = defineProps<{
  editions: Array<LaverWinnerInterface | CountryWinnerInterface | EditionWinnerInterface>
  pending: boolean
}>()

const {
  ui: { icons }
} = useAppConfig()

const tournamentStore = useTournamentStore()

const uniqueYears = computed(() => useArrayUnique(props.editions.map(ed => ed.year)).value.sort())

const getYearEvents = (year: number) => props.editions.filter(edition => edition.year === year)
</script>

<template>
  <u-page-columns
    v-if="editions.length || pending"
    class="2xl:columns-4"
  >
    <tournament-winners-card
      v-if="editions.length"
      v-for="year in uniqueYears"
      :key="year"
      :events="getYearEvents(year)"
    />

    <tournament-winners-loading
      v-else
      v-for="_ in 6"
      :key="_"
    />
  </u-page-columns>

  <u-empty
    v-else
    :icon="ICONS.calendarOff"
    :title="`No player has won ${tournamentStore.name}`"
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
