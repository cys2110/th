<script setup lang="ts">
const props = defineProps<{
  editions: Array<EditionWinnersInterface>
  pending: boolean
}>()

const tournamentStore = useTournamentStore()

interface GroupedWinnersInterface {
  id: number
  year: number
  events: Array<EditionWinnersInterface>
}

const groupedEditions = computed(() => {
  const uniqueYears = useArrayUnique(props.editions.map(ed => ed.year)).value

  const array: Array<GroupedWinnersInterface> = []

  uniqueYears.forEach(year => {
    const filtered = props.editions.filter(ed => ed.year === year)

    array.push({
      year,
      id: filtered[0]!.id,
      events: filtered
    })
  })

  return array
})
</script>

<template>
  <u-page-columns v-if="groupedEditions.length || pending">
    <tournament-winners-card
      v-if="editions.length"
      v-for="edition in groupedEditions"
      :key="edition.id"
      :edition
    />

    <tournament-winners-loading
      v-else
      v-for="_ in 6"
      :key="_"
    />
  </u-page-columns>

  <empty
    v-else
    :message="`No editions have been played for ${tournamentStore.name}`"
    :icon="ICONS.calendarOff"
    class="m-5"
  />
</template>
