<script setup lang="ts">
import type { StepperItem } from "@nuxt/ui"

definePageMeta({ name: "results" })
const {
  icons,
  ui: { icons: uIcons }
} = useAppConfig()
const {
  params: { id, year, name, eid }
} = useRoute("results")

const tours = useState<TourType[]>("tours")
const tournamentName = useState<string>("tournament-name")
const selectedTours = ref<TourType[]>([])
const selectedMatchTypes = ref<MatchType[]>([])

// API call
const { data, status } = await useFetch<MatchInterface[]>("/api/events/results", {
  key: `results-table-${eid}`,
  query: { id: eid },
  default: () => [],
  server: false
})

const matches = computed(() => {
  const filteredData = data.value.filter(match => {
    if (
      (selectedTours.value.length && !selectedTours.value.includes(match.tour)) ||
      (selectedMatchTypes.value.length && !selectedMatchTypes.value.includes(match.type))
    ) {
      return false
    }
    return true
  })

  const rounds = useArrayUnique(filteredData.map(m => m.round))

  const consolidatedData = []

  for (const round of rounds.value) {
    const roundMatches = filteredData.filter(m => m.round === round)
    consolidatedData.push({ title: round, matches: roundMatches })
  }

  return consolidatedData
})
</script>

<template>
  <event-wrapper>
    <client-only>
      <teleport to="#page-right">
        <filter-checkbox-tours
          v-model="selectedTours"
          :tours="tours"
          class="my-5"
        />
        <filter-checkbox-match-type
          v-model="selectedMatchTypes"
          class="my-5"
        />
      </teleport>
    </client-only>

    <u-stepper
      v-if="matches.length"
      :items="matches"
      :linear="false"
    >
      <template #indicator="{ item }">
        {{ SHORT_ROUNDS[item.title] }}
      </template>

      <template #content="{ item }">
        <u-page-columns class="lg:columns-2">
          <u-card
            v-for="match in item.matches"
            :key="`${item.title}-${match.match_no}-${match.tour}-${match.type}`"
            :ui="{
              root: `ring-${getTourColour(match.tour)}`,
              header: 'text-sm',
              footer: 'flex justify-center'
            }"
          >
            <template #header>
              <div class="flex flex-col">
                <div class="flex justify-between">
                  <span v-if="match.date">{{ useDateFormat(getDate(match.date), "dddd DD MMMM, YYYY") }}</span>
                  <span class="justify-self-end">{{
                    match.duration ?
                      `${match.duration.hours.toString().padStart(2, "0")}:${match.duration.minutes.toString().padStart(2, "0")}:${match.duration.seconds.toString().padStart(2, "0")}`
                    : "00:00:00"
                  }}</span>
                </div>
                <div class="flex justify-between">
                  <div v-if="match.court">{{ match.court }}</div>
                  <u-link
                    v-if="match.umpire"
                    class="justify-self-end hover-link w-fit"
                    :to="{ name: 'umpire', params: { id: kebabCase(match.umpire) } }"
                  >
                    {{ match.umpire }}
                  </u-link>
                </div>
              </div>
            </template>

            <div class="grid grid-rows-2 grid-flow-col gap-4">
              <div class="flex items-center gap-2 col-span-3">
                <div class="flex flex-col">
                  <player-link
                    v-for="player in match.winners.players"
                    :key="`${item.title}-${player.id}`"
                    :player
                  />
                </div>
                <div v-if="item.title.includes('Qualifying')">
                  <small v-if="match.winners.players[0] && (match.winners.players[0].q_seed || match.winners.players[0].q_status)">
                    ({{
                      match.winners.players[0].q_seed && match.winners.players[0].q_status ?
                        `${match.winners.players[0].q_seed} ${match.winners.players[0].q_status}`
                      : (match.winners.players[0].q_seed ?? match.winners.players[0].q_status)
                    }})
                  </small>
                </div>
                <div v-else>
                  <small v-if="match.winners.players[0] && (match.winners.players[0].seed || match.winners.players[0].status)">
                    ({{
                      match.winners.players[0].seed && match.winners.players[0].status ?
                        `${match.winners.players[0].seed} ${match.winners.players[0].status}`
                      : (match.winners.players[0].seed ?? match.winners.players[0].status)
                    }})
                  </small>
                </div>
              </div>
              <div class="flex items-center gap-2 col-span-3">
                <div class="flex flex-col">
                  <player-link
                    v-for="player in match.losers.players"
                    :key="`${item.title}-${player.id}`"
                    :player
                  />
                </div>
                <div v-if="item.title.includes('Qualifying')">
                  <small v-if="match.losers.players[0] && (match.losers.players[0].q_seed || match.losers.players[0].q_status)">
                    ({{
                      match.losers.players[0].q_seed && match.losers.players[0].q_status ?
                        `${match.losers.players[0].q_seed} ${match.losers.players[0].q_status}`
                      : (match.losers.players[0].q_seed ?? match.losers.players[0].q_status)
                    }})
                  </small>
                </div>
                <div v-else>
                  <small v-if="match.losers.players[0] && (match.losers.players[0].seed || match.losers.players[0].status)">
                    ({{
                      match.losers.players[0].seed && match.losers.players[0].status ?
                        `${match.losers.players[0].seed} ${match.losers.players[0].status}`
                      : (match.losers.players[0].seed ?? match.losers.players[0].status)
                    }})
                  </small>
                </div>
              </div>
              <div class="flex items-center">
                <u-icon
                  :name="uIcons.success"
                  class="text-success text-lg mt-1"
                />
              </div>
              <div />
              <div class="flex items-center gap-1 justify-end">
                <div
                  v-for="(set, index) in match.sets[0]"
                  :key="`winner-set-${index}`"
                >
                  {{ set[0] }}<sup v-if="set[1]">{{ set[1] }}</sup>
                </div>
              </div>
              <div class="flex items-center gap-1 justify-end">
                <div
                  v-for="(set, index) in match.sets[1]"
                  :key="`winner-set-${index}`"
                >
                  {{ set[0] }}<sup v-if="set[1]">{{ set[1] }}</sup>
                </div>
              </div>
              <div v-if="match.incomplete" />
              <u-badge
                v-if="match.incomplete"
                :label="`${match.incomplete}.`"
                color="error"
              />
            </div>

            <template #footer>
              <u-field-group size="sm">
                <u-button
                  label="Stats"
                  :icon="icons.stats"
                  :disabled="!match.stats"
                  :to="{
                    name: 'match',
                    params: {
                      name,
                      id,
                      year,
                      eid,
                      mid: constructMid(match.match_no, match.tour, match.type, match.round.includes('Qualifying') ? 'Qualifying' : 'Main')
                    }
                  }"
                />
                <u-button
                  v-if="match.winners.players[0] && match.losers.players[0]"
                  label="H2H"
                  :icons="icons.h2h"
                  :disabled="match.type === 'Doubles'"
                  :to="{
                    name: 'h2h-players',
                    params: {
                      p1Name: kebabCase(match.winners.players[0].first_name + ' ' + match.winners.players[0].last_name),
                      p2Name: kebabCase(match.losers.players[0].first_name + ' ' + match.losers.players[0].last_name),
                      p1Id: match.winners.players[0].id,
                      p2Id: match.losers.players[0].id
                    }
                  }"
                />
              </u-field-group>
            </template>
          </u-card>
        </u-page-columns>
      </template>
    </u-stepper>

    <error-message
      v-else
      :message="`No results found for ${tournamentName} ${year}`"
    />
  </event-wrapper>
</template>
