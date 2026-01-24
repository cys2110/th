<script setup lang="ts">
const props = defineProps<{
  editions: BaseEditionType[]
}>()

const {
  params: { id, name }
} = useRoute("tournament")
const {
  ui: { colors }
} = useAppConfig()
const breakpoints = useBreakpoints(breakpointsTailwind, { ssrWidth: useSSRWidth() })
const mdAndDown = breakpoints.smallerOrEqual("md")

const edition = computed(() => {
  const winners = props.editions
    .map(ed => ed.winner)
    .flat()
    .filter(Boolean)

  return {
    ...props.editions[0],
    winners
  }
})

const getCardColour = () => {
  if (edition.value.tours?.length && edition.value.tours.length > 1) {
    return "primary"
  } else {
    return edition.value.tours![0] as keyof typeof colors
  }
}
</script>

<template>
  <u-page-card
    :title="edition.year?.toString()"
    highlight
    :highlight-color="getCardColour()"
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
      <template
        v-for="(winner, index) in edition.winners"
        :key="index"
      >
        <!-- Country events-->
        <country-link
          v-if="'name' in winner!"
          :country="<CountryType>winner"
        />

        <!--Laver Cup-->
        <div v-else-if="'points' in winner!">
          <u-icon :name="winner.team === 'Europe' ? ICONS.europe : ICONS.globe" />
        </div>

        <!--Regular events-->
        <div
          v-else
          class="space-y-1 my-2"
        >
          <u-field-group>
            <u-badge
              :label="winner?.tour"
              :color="<keyof typeof colors>winner!.tour"
              class="w-full"
            />
            <u-badge
              :label="winner?.type"
              :color="winner!.type"
              class="w-full"
            />
          </u-field-group>

          <player-link
            v-for="player in winner!.team"
            :key="player.id"
            :player
          />
        </div>
      </template>
    </template>
  </u-page-card>
</template>
