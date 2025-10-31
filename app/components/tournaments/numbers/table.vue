<script setup lang="ts">
defineProps<{ tournament: TournamentInterface }>()
const selectedTab = defineModel<string>()
const {
  params: { id }
} = useRoute("tournament")
const {
  ui: { icons }
} = useAppConfig()
const breakpoints = useBreakpoints(breakpointsTailwind, { ssrWidth: useSSRWidth() })
const mdAndDown = breakpoints.smallerOrEqual("md")
</script>

<template>
  <table-wrapper>
    <template
      #trailing
      v-if="!mdAndDown"
    >
      <div class="text-(--ui-text-muted) font-semibold w-full text-center">
        <span v-if="tournament?.established">{{ tournament.established }}</span>
        <span v-if="tournament?.established && !tournament.abolished"> - present</span>
        <span v-else-if="tournament?.abolished && tournament.established !== tournament.abolished"> - {{ tournament.abolished }}</span>
      </div>
    </template>
    <template
      #navbar-right
      v-if="tournament.website"
    >
      <u-button
        :to="tournament.website"
        target="_blank"
        :icon="icons.external"
        size="xs"
      />
    </template>

    <template #toolbar>
      <dev-only>
        <div class="w-full flex justify-center items-center gap-1">
          <tournaments-update :tournament />
          <editions-update />
        </div>
      </dev-only>
      <div class="flex justify-center items-center gap-1">
        <u-badge
          v-for="tour in tournament.tours"
          :key="tour"
          :label="TourEnum[tour]"
          :color="tour"
        />
      </div>
      <div class="w-full flex justify-center">
        <u-tabs
          v-if="!COUNTRY_DRAWS.includes(id as string)"
          v-model="selectedTab"
          :items="[
            { label: 'Winners', value: 'winners' },
            { label: 'Numbers', value: 'numbers' }
          ]"
          variant="link"
        />
      </div>
      <u-badge
        v-if="!mdAndDown"
        color="success"
        :label="`Updated: ${useDateFormat(tournament.updated_at, 'DD MMMM YYYY').value}`"
        class="w-full"
        size="lg"
      />
    </template>

    {{ tournament }}
  </table-wrapper>
</template>
