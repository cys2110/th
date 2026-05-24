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

const isDefaultWinner = (item: Winner): item is EditionWinnerInterface => {
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

const highlightColor = computed(() => {
  if (props.events.length > 1 || "team_name" in props.events[0]! || "country" in props.events[0]!) {
    return "primary"
  } else {
    return props.events[0]!.tour as keyof typeof colors
  }
})
</script>

<template>
  <u-page-card
    highlight
    :highlight-color
    :to="{ name: 'edition', params: { id, name, year: events[0]!.year, edId: events[0]!.id } }"
    :ui="{
      body: 'w-full',
      leading: 'flex items-center gap-1'
    }"
  >
    <template #title>
      <span>{{ editionNumber.year }}</span>
      <span v-if="editionNumber.editionNumber"> [{{ editionNumber.editionNumber }}]</span>
    </template>

    <template #description>
      <!--Country events-->
      <country-link
        v-if="isCountryWinner(events[0]!)"
        :country="events[0].country"
      />

      <!--Laver Cup events-->
      <div v-else-if="isLaverWinner(events[0]!)">
        <u-icon :name="events[0].team_name === 'Europe' ? ICONS.europe : ICONS.globe" />
      </div>

      <div
        v-else
        v-for="(event, index) in events"
        :key="index"
        class="space-y-1 my-2"
      >
        <template v-if="isDefaultWinner(event)">
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

          <u-container>
            <players-link :players="event.team" />
          </u-container>
        </template>
      </div>
    </template>
  </u-page-card>
</template>
