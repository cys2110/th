<script setup lang="ts">
import { ICONS, isCountryWinner, isEliminationWinner, isLaverWinner } from "#imports"

const props = defineProps<{ events: Array<EditionWinnerType> }>()

const route = useRoute("tournament")

const groupedEvents = computed(() => groupBy(props.events, "tour"))

const editionNumber = computed(() => {
  if (props.events.length) {
    const tournamentAndYear = `${route.params.id}${props.events[0]!.year}`
    const edId = props.events[0]!.edition_id.toString()

    const slug = edId.replace(tournamentAndYear, "")

    return slug
  }
})
</script>

<template>
  <u-card :ui="{ root: 'ring-primary', header: 'font-semibold', body: 'text-sm' }">
    <template #header>
      <span>{{ events[0]!.year }}</span>
      <span v-if="editionNumber"> [{{ editionNumber }}]</span>
    </template>

    <template
      #default
      v-if="events[0]"
    >
      <div
        v-if="isCountryWinner(events[0])"
        class="font-semibold mx-auto w-fit"
      >
        <country-link
          v-if="events[0].country"
          :country="events[0].country"
        />

        <div v-else>{{ new Date(events[0].end_date!) >= new Date() ? "Edition in progress" : "No winner" }}</div>
      </div>

      <div
        v-else-if="isLaverWinner(events[0])"
        class="w-fit mx-auto flex items-center gap-2"
      >
        <u-icon
          v-if="events[0].team_name"
          :name="events[0].team_name === 'Europe' ? ICONS.europe : ICONS.world"
          class="size-5"
        />

        <span class="font-semibold">{{
          events[0].team_name || (new Date(events[0].end_date!) >= new Date() ? "Edition in progress" : "No winner")
        }}</span>
      </div>

      <div
        v-else
        v-for="([tour, events], index) in Object.entries(groupedEvents)"
        :key="index"
        class="space-y-1 my-2"
      >
        <u-badge
          :label="tour"
          :color="<any>tour"
          class="w-full"
        />

        <u-container class="my-1.5">
          <template
            v-for="(event, i) in events"
            :key="i"
          >
            <player-link
              v-if="isEliminationWinner(event) && event.team.length"
              :players="event.team"
            />

            <div
              v-else-if="i === 0"
              class="font-semibold text-muted"
            >
              {{ new Date(event.end_date) >= new Date() ? "Edition in progress" : "No winner" }}
            </div>
          </template>
        </u-container>
      </div>
    </template>

    <template #footer>
      <u-field-group class="w-full">
        <u-button
          block
          :to="{ name: 'edition', params: { ...route.params, year: events[0]!.year, edition_id: events[0]!.edition_id } }"
          label="Details"
          :icon="ICONS.overview"
        />

        <u-button
          block
          :to="{ name: 'results', params: { ...route.params, year: events[0]!.year, edition_id: events[0]!.edition_id } }"
          label="Results"
          :icon="ICONS.cards"
        />

        <u-button
          block
          :to="{ name: 'draws', params: { ...route.params, year: events[0]!.year, edition_id: events[0]!.edition_id } }"
          label="Draws"
          :icon="ICONS.draw"
          :ui="{ leadingIcon: 'rotate-270' }"
        />
      </u-field-group>
    </template>
  </u-card>
</template>
