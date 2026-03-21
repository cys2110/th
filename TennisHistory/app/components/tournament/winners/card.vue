<script setup lang="ts">
interface GroupedWinnersInterface {
  id: number
  year: number
  events: Array<EditionWinnersInterface>
}

const props = defineProps<{
  edition: GroupedWinnersInterface
}>()

const {
  params: { id, name }
} = useRoute("tournament")

const {
  ui: { colors }
} = useAppConfig()

const highlightColor = computed(() => {
  if (props.edition.events.length > 1) {
    return "primary"
  } else {
    return props.edition.events[0]!.tour as keyof typeof colors
  }
})
</script>

<template>
  <u-page-card
    :title="edition.year?.toString()"
    highlight
    :highlight-color
    :to="{
      name: 'edition',
      params: {
        id,
        name,
        year: edition.year!,
        edId: edition.id!
      }
    }"
    :ui="{
      body: 'w-full',
      leading: 'flex items-center gap-1'
    }"
  >
    <template #description>
      <!-- Country events-->
      <country-link
        v-if="edition.events[0]?.country"
        :country="edition.events[0].country"
      />

      <!--Laver Cup-->
      <div v-else-if="edition.events[0]?.laverWinner">
        <u-icon :name="edition.events[0]?.laverWinner.team === 'Europe' ? ICONS.europe : ICONS.globe" />
      </div>

      <!--Regular events-->
      <div
        v-else
        v-for="(event, index) in edition.events"
        :key="index"
        class="space-y-1 my-2"
      >
        <u-field-group>
          <u-badge
            :label="event?.tour"
            :color="<keyof typeof colors>event.tour"
            class="w-full"
          />
          <u-badge
            :label="event?.match_type"
            :color="event!.match_type"
            class="w-full"
          />
        </u-field-group>

        <player-link
          v-for="player in event.team"
          :key="player.id"
          :player
        />
      </div>
    </template>
  </u-page-card>
</template>
