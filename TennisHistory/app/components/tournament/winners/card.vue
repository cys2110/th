<script setup lang="ts">
type Winner = LaverWinnerInterface | CountryWinnerInterface | EditionWinnerInterface

const props = defineProps<{
  events: Array<Winner>
}>()

const {
  params: { id, name }
} = useRoute("tournament")

const {
  ui: { colors }
} = useAppConfig()

const isLaverWinner = (item: Winner): item is LaverWinnerInterface => {
  return "team_name" in item
}

const isCountryWinner = (item: Winner): item is CountryWinnerInterface => {
  return "country" in item
}

const isEliminationWinner = (item: Winner): item is EditionWinnerInterface => {
  return "tour" in item
}

const editionNumber = computed(() => {
  const year = props.events[0]!.year.toString()
  const edId = props.events[0]!.id.toString()

  const parts = edId.split(year)

  if (parts.length > 1) {
    return {
      year,
      editionNumber: parts[1]
    }
  } else {
    return { year }
  }
})
</script>

<template>
  <u-card :ui="{ root: 'ring ring-primary', body: 'text-sm' }">
    <template #header>
      <u-link
        :to="{ name: 'edition', params: { id, name, year: events[0]!.year, edId: events[0]!.id } }"
        class="hover-link primary-link font-semibold"
      >
        <span>{{ editionNumber.year }}</span>
        <span v-if="editionNumber.editionNumber"> [{{ editionNumber.editionNumber }}]</span>
      </u-link>
    </template>

    <!--Country events-->
    <div
      v-if="isCountryWinner(events[0]!)"
      class="font-semibold mx-auto w-fit"
    >
      <country-link
        v-if="events[0].country"
        :country="events[0].country"
      />

      <div v-else>{{ events[0].year === new Date().getFullYear() ? "Edition in progress" : "No winner" }}</div>
    </div>

    <!--Laver Cup events-->
    <div
      v-else-if="isLaverWinner(events[0]!)"
      class="w-fit mx-auto flex items-center gap-2"
    >
      <u-icon
        v-if="events[0].team_name"
        :name="events[0].team_name === 'Europe' ? ICONS.europe : ICONS.globe"
        class="size-5"
      />

      <span class="font-semibold">{{
        events[0].team_name || (events[0].year === new Date().getFullYear() ? "Edition in progress" : "No winner")
      }}</span>
    </div>

    <div
      v-else
      v-for="(event, index) in events"
      :key="index"
      class="space-y-1 my-2"
    >
      <template v-if="isEliminationWinner(event)">
        <div v-if="event.team">
          <u-field-group>
            <u-badge
              :label="event.tour"
              :color="event.tour"
              class="w-full"
            />
            <u-badge
              :label="event.match_type"
              :color="event.match_type"
              class="w-full"
            />
          </u-field-group>

          <u-container class="my-1.5">
            <player-link :players="event.team" />
          </u-container>
        </div>

        <div
          v-else
          class="font-semibold w-fit mx-auto"
          >{{ event.year === new Date().getFullYear() ? "Edition in progress" : "No winner" }}</div
        >
      </template>
    </div>
  </u-card>
</template>
