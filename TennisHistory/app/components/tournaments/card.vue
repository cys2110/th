<script setup lang="ts">
const props = defineProps<{
  tournament: TournamentType
}>()

const {
  ui: { colors }
} = useAppConfig()

const highlightColor = computed(() => {
  if (props.tournament.tours?.length === 1) {
    return props.tournament.tours[0] as keyof typeof colors
  }
  return "primary"
})
</script>

<template>
  <u-page-card
    :title="tournament.name"
    :to="{
      name: 'tournament',
      params: {
        id: tournament.id,
        name: kebabCase(tournament.name)
      }
    }"
    highlight
    :highlight-color
    :ui="{
      leading: 'space-x-1',
      footer: 'text-sm'
    }"
  >
    <template #leading>
      <u-badge
        v-for="tour in tournament.tours"
        :key="tour"
        :color="<keyof typeof colors>tour"
        :label="tour"
      />
    </template>

    <template #footer>
      <span v-if="tournament.established">{{ tournament.established }}</span>
      <span v-if="tournament.established && !tournament.abolished"> - present</span>
      <span v-if="tournament.abolished && tournament.abolished !== tournament.established"> - {{ tournament.abolished }}</span>
    </template>
  </u-page-card>
</template>
