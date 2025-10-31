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
  <u-container>
    <u-page>
      <template #left>
        <u-page-aside>
          <dev-only>
            <tournaments-update :tournament />
            <editions-update />
          </dev-only>
          <u-tabs
            v-if="!COUNTRY_DRAWS.includes(id as string)"
            v-model="selectedTab"
            :items="[
              { label: 'Winners', value: 'winners' },
              { label: 'Numbers', value: 'numbers' }
            ]"
            variant="link"
            orientation="vertical"
          />
        </u-page-aside>
      </template>

      <template #right>
        <u-page-aside></u-page-aside>
      </template>

      <u-page-header :title="tournament.name">
        <template #headline>
          <div class="flex items-center gap-2">
            <u-badge
              v-for="tour in tournament.tours"
              :key="tour"
              :label="TourEnum[tour]"
              :color="tour"
            />
          </div>
        </template>

        <template #description>
          <div>
            <span v-if="tournament?.established">{{ tournament.established }}</span>
            <span v-if="tournament?.established && !tournament.abolished"> - present</span>
            <span v-else-if="tournament?.abolished && tournament.established !== tournament.abolished"> - {{ tournament.abolished }}</span>
          </div>
        </template>

        <template #links>
          <u-button
            v-if="tournament.website"
            :to="tournament.website"
            target="_blank"
            :icon="icons.external"
          />
        </template>
      </u-page-header>
    </u-page>
  </u-container>
</template>
