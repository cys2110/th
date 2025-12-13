<script setup lang="ts">
const { edition } = defineProps<{
  edition: BaseEditionType
}>()

const {
  params: { id, name }
} = useRoute("tournament")
const {
  ui: { colors }
} = useAppConfig()
const breakpoints = useBreakpoints(breakpointsTailwind, { ssrWidth: useSSRWidth() })
const mdAndDown = breakpoints.smallerOrEqual("md")

const getCardColour = () => {
  if (edition.tours.length > 1) {
    return "primary"
  } else {
    return edition.tours[0]
  }
}

const details = computed(
  () =>
    [
      edition.sponsor_name && {
        label: "Sponsor Name",
        value: edition.sponsor_name
      },
      edition.start_date &&
        edition.end_date && {
          label: "Dates",
          value: mdAndDown.value
            ? shortDateFormat.formatRange(new Date(edition.start_date), new Date(edition.end_date))
            : dateTimeFormat.formatRange(new Date(edition.start_date), new Date(edition.end_date))
        },
      edition.category && {
        label: "Category",
        value: edition.category
      },
      edition.surface?.id && {
        label: "Surface",
        value: edition.surface.id
      },
      edition.venues.length && {
        label: "Venues"
      },
      edition.currency &&
        edition.tfc && {
          label: "Total Financial Commitment",
          value: edition.tfc.toLocaleString("en-GB", {
            style: "currency",
            currency: edition.currency
          })
        },
      edition.winners.length && {
        label: "Winners"
      }
    ].filter(Boolean) as { label: string; value?: string }[]
)
</script>

<template>
  <u-page-card
    :title="edition.year.toString()"
    highlight
    :highlight-color="getCardColour()"
    :to="{
      name: 'edition',
      params: {
        id,
        name,
        year: edition.year,
        edId: edition.id
      }
    }"
    :ui="{
      body: 'w-full',
      leading: 'flex items-center gap-1'
    }"
  >
    <template #leading>
      <u-badge
        v-for="tour in edition.tours"
        :key="tour"
        :color="(tour as keyof typeof colors)"
        :label="tour"
      />
    </template>

    <template #description>
      <div class="flex flex-col gap-1.5 *:*:first:font-semibold *:*:not-first:ml-3 *:*:not-first:text-default text-sm">
        <div
          v-for="detail in details"
          :key="detail.label"
        >
          <div>{{ detail.label }}</div>
          <div v-if="detail.value">{{ detail.value }}</div>

          <div
            v-else-if="detail.label === 'Venues'"
            v-for="venue in edition.venues"
            :key="venue.id"
            class="flex flex-wrap items-center gap-1"
          >
            <span>{{ venue.name ? `${venue.name}, ${venue.city}` : venue.city }}</span>
            <countries-link
              :country="venue.country!"
              icon-only
              class="mx-0"
            />
          </div>

          <div
            v-else-if="detail.label === 'Winners'"
            v-for="winner in edition.winners"
            :key="`${winner.tour}-${winner.type}`"
            class="flex flex-col gap-1 my-2"
          >
            <u-field-group>
              <u-badge
                :label="winner.tour"
                :color="(winner.tour as keyof typeof colors)"
                class="w-full justify-center"
              />
              <u-badge
                :label="winner.type"
                :color="winner.type"
                class="w-full justify-center"
              />
            </u-field-group>
            <players-link
              v-for="player in winner.team"
              :key="player.id"
              :player
            />
          </div>
        </div>
      </div>
    </template>
  </u-page-card>
</template>
