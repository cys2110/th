<script setup lang="tsx">
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
  const winners = props.editions.map(ed => ed.winner).flat()

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

const details = computed(() => [
  ...(edition.value.sponsor_name ? [{ label: "Sponsor Name", value: <div>{edition.value.sponsor_name}</div> }] : []),
  ...(edition.value.start_date && edition.value.end_date
    ? [
        {
          label: "Dates",
          value: (
            <div>
              {mdAndDown.value
                ? shortDateFormat.formatRange(new Date(edition.value.start_date), new Date(edition.value.end_date))
                : dateTimeFormat.formatRange(new Date(edition.value.start_date), new Date(edition.value.end_date))}
            </div>
          )
        }
      ]
    : []),
  ...(edition.value.category ? [{ label: "Category", value: <div>{edition.value.category}</div> }] : []),
  ...(edition.value.surface?.id ? [{ label: "Surface", value: <div>{edition.value.surface.id}</div> }] : []),
  ...(edition.value.venues?.length
    ? [
        {
          label: "Venues",
          value: (
            <div>
              {edition.value.venues.map(venue => (
                <div
                  key={venue.id}
                  class="flex flex-wrap items-center gap-1"
                >
                  <span>{venue.name ? `${venue.name}, ${venue.city}` : venue.city}</span>
                  <country-link
                    country={venue.country}
                    icon-only
                  />
                </div>
              ))}
            </div>
          )
        }
      ]
    : []),
  ...(edition.value.currency && edition.value.tfc
    ? [
        {
          label: "Total Financial Commitment",
          value: <div>{edition.value.tfc.toLocaleString("en-GB", { style: "currency", currency: edition.value.currency })}</div>
        }
      ]
    : []),
  ...(edition.value.winners?.length
    ? [
        {
          label: "Winners",
          value: (
            <div>
              {edition.value.winners.map((winner, index) => {
                if (typeof winner === "object" && "name" in winner) {
                  return (
                    <country-link
                      key={index}
                      country={winner}
                    />
                  )
                }

                return (
                  <div
                    key={index}
                    class="flex flex-col gap-1 my-2"
                  >
                    <u-field-group>
                      <u-badge
                        label={winner?.tour}
                        color={winner?.tour as keyof typeof colors}
                        class="w-full"
                      />
                      <u-badge
                        label={winner?.type}
                        color={winner?.type}
                        class="w-full"
                      />
                    </u-field-group>
                    <div class="flex flex-col">
                      {winner?.team.map(player => (
                        <player-link
                          key={player.id}
                          player={player}
                        />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )
        }
      ]
    : [])
])
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
          <component :is="detail.value" />
        </div>
      </div>
    </template>
  </u-page-card>
</template>
