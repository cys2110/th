<script setup lang="ts">
const props = defineProps<{
  label: string
  tournaments: Array<Pick<TournamentType, "id" | "name" | "tours">>
  year: number
}>()

const {
  ui: { icons, colors }
} = useAppConfig()

const getHighlightColor = (tours: Array<TourType> | null) => {
  if (tours?.length === 1) {
    return tours[0] as keyof typeof colors
  }
  return "primary"
}
</script>

<template>
  <u-collapsible>
    <u-button
      class="group my-2"
      :label="`Tournaments ${label} in ${year}`"
      color="neutral"
      block
      :trailing-icon="icons.chevronDown"
      :ui="{
        trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform duration-200',
        base: 'cursor-pointer'
      }"
    />

    <template #content>
      <u-page-grid v-if="tournaments.length">
        <u-page-card
          v-for="tournament in tournaments"
          :key="tournament.id"
          :title="tournament.name"
          :to="{
            name: 'tournament',
            params: {
              id: tournament.id,
              name: kebabCase(tournament.name)
            }
          }"
          highlight
          :highlight-color="getHighlightColor(tournament.tours)"
          :ui="{ leading: 'space-x-1' }"
        >
          <template #leading>
            <u-badge
              v-for="tour in tournament.tours"
              :key="tour"
              :color="<keyof typeof colors>tour"
              :label="tour"
            />
          </template>
        </u-page-card>
      </u-page-grid>

      <empty
        v-else
        :message="`No tournaments ${label} in ${year}`"
        class="m-5"
      />
    </template>
  </u-collapsible>
</template>
