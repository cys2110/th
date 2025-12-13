<script setup lang="ts">
const { tournament } = defineProps<{
  tournament: TournamentType
}>()

const {
  ui: { colors }
} = useAppConfig()

const getCardColour = () => {
  if (tournament.tours?.length === 1) {
    return tournament.tours[0]
  } else {
    return "primary"
  }
}
</script>

<template>
  <u-page-card
    :title="tournament.name"
    :to="{ name: 'tournament', params: { id: tournament.id, name: kebabCase(tournament.name) } }"
    highlight
    :highlight-color="getCardColour()"
    :ui="{ root: 'h-full', body: 'w-full', leading: 'flex items-center gap-1' }"
  >
    <template #leading>
      <u-badge
        v-for="tour in tournament.tours"
        :key="tour"
        :color="(tour as keyof typeof colors)"
        :label="tour"
      />
    </template>

    <template #description>
      <span v-if="tournament.established">{{ tournament.established }}</span>
      <span v-if="tournament.established && !tournament.abolished"> - present</span>
      <span v-else-if="tournament.abolished && tournament.established !== tournament.abolished"> - {{ tournament.abolished }}</span>
    </template>
  </u-page-card>
</template>
