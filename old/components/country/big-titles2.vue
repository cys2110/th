<script setup lang="ts">
const {
  icons,
  ui: { colors }
} = useAppConfig()
const {
  params: { id, name }
} = useRoute("country")

const countryName = useState<string>("country-name")

const getLevel = (category: string) => {
  if (["Grand Slam"].includes(category)) return "Grand Slam"
  if (["ATP Masters 1000", "WTA 1000"].includes(category)) return "Masters"
  if (["ATP Finals", "WTA Finals"].includes(category)) return "Year End Finals"
  if (["Olympics"].includes(category)) return "Olympics"
  return "Other"
}

const levelBadgeMapping: Record<string, keyof typeof colors> = {
  "Grand Slam": "primary",
  Masters: "success",
  "Year End Finals": "itf",
  Olympics: "warning"
}

type APIResponseType = {
  events: (EventInterface & { type: MatchType })[]
  player: PlayerInterface
}

// API call
const { data: results, status } = await useFetch<APIResponseType[]>("/api/countries/big-titles", {
  query: { id },
  default: () => [],
  server: false
})
</script>

<template>
  <dashboard-subpanel
    :title="`Players who have won big titles representing ${countryName || capitalCase(name as string)}`"
    :icon="icons.tournament"
    id="big-titles"
  >
    <u-page-columns
      v-if="results.length || ['idle', 'pending'].includes(status)"
      class="scroll-smooth overflow-y-auto p-5 lg:columns-2"
    >
      <u-page-card
        v-if="results.length"
        v-for="result in results"
        :key="result.player.id"
        highlight
        :highlight-color="getTourColour(result.player.tour)"
        :title="`${result.player.first_name} ${result.player.last_name}`"
        :ui="{ leading: 'flex items-center gap-2' }"
      >
        <template #leading>
          <country-link :country="result.player.country" />
          <coloured-badge :label="result.player.tour" />
        </template>

        <template #title>
          <u-link
            :to="{ name: 'player', params: { id: result.player.id, name: kebabCase(`${result.player.first_name} ${result.player.last_name}`) } }"
            class="hover-link default-link w-fit"
          >
            {{ result.player.first_name }} {{ result.player.last_name }}
          </u-link>
        </template>
        <template #description>
          <table class="text-sm">
            <thead>
              <tr>
                <th>S/D</th>
                <th>Level</th>
                <th>Category</th>
                <th>Tournament</th>
                <th>Year</th>
              </tr>
            </thead>
            <tbody class="[&>tr>td]:p-1 [&>tr>td]:text-center">
              <tr
                v-for="event in result.events"
                :key="event.id"
              >
                <td>
                  <coloured-badge :label="event.type" />
                </td>
                <td>
                  <u-badge
                    :label="getLevel(event.category ?? (result.player.tour === 'ATP' ? event.atp_category : event.wta_category))"
                    :color="levelBadgeMapping[getLevel(event.category ?? (result.player.tour === 'ATP' ? event.atp_category : event.wta_category))]"
                  />
                </td>
                <td>
                  {{ event.category ?? (result.player.tour === "ATP" ? event.atp_category : event.wta_category) }}
                </td>
                <td>
                  <u-link
                    :to="{ name: 'tournament', params: { id: event.tournament.id, name: kebabCase(event.tournament.name) } }"
                    class="hover-link default-link w-fit"
                  >
                    {{ event.tournament.name }}
                  </u-link>
                </td>
                <td>
                  <u-link
                    :to="{
                      name: 'event',
                      params: { id: event.tournament.id, name: kebabCase(event.tournament.name), year: event.year, eid: event.id }
                    }"
                    class="hover-link default-link w-fit"
                  >
                    {{ event.year }}
                  </u-link>
                </td>
              </tr>
            </tbody>
          </table>
        </template>
      </u-page-card>

      <loading-player
        v-else
        v-for="_ in 6"
        :key="_"
      />
    </u-page-columns>
    <error-message
      v-else
      :message="`No players who won big titles representing ${countryName || capitalCase(name as string)}`"
      :icon="icons.tournament"
    />
  </dashboard-subpanel>
</template>
