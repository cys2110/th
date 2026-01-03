<script setup lang="ts">
const props = defineProps<{
  tournament: TournamentType
}>()

const {
  ui: { colors }
} = useAppConfig()

const description = computed(() => {
  let desc = ""
  if (props.tournament.established) desc += props.tournament.established.toString()

  if (props.tournament.established && !props.tournament.abolished) {
    desc += " - present"
  } else if (props.tournament.abolished && props.tournament.established !== props.tournament.abolished) {
    desc += ` - ${props.tournament.abolished}`
  }
  return desc
})

const getCardColour = () => {
  if (props.tournament.tours?.length === 1) {
    return props.tournament.tours[0] as keyof typeof colors
  } else {
    return "primary"
  }
}
</script>

<template>
  <u-page-card
    :title="tournament.name"
    :description
    :to="{ name: 'tournament', params: { id: tournament.id, name: kebabCase(tournament.name) } }"
    highlight
    :highlight-color="getCardColour()"
    :ui="{ root: 'h-full', body: 'w-full' }"
  >
    <template #leading>
      <u-badge
        v-for="tour in tournament.tours"
        :key="tour"
        :color="(tour as keyof typeof colors)"
        :label="tour"
        class="mx-0.5"
      />
    </template>
  </u-page-card>
</template>
