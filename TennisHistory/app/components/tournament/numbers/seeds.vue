<script setup lang="ts">
const {
  params: { id, name }
} = useRoute("tournament")
const {
  ui: { colors }
} = useAppConfig()
const tournamentStore = useTournamentStore()

const { data, status } = await useFetch("/api/tournament/seeds", {
  query: { id },
  default: () => [],
  onResponseError: ({ error }) => console.error(error)
})

const groupedData = computed(() => {
  const editionsMap = new Map()

  for (const e of data.value) {
    // edition
    let edition = editionsMap.get(e.id)
    if (!edition) {
      edition = {
        id: e.id,
        year: e.year,
        toursMap: new Map()
      }
      editionsMap.set(e.id, edition)
    }

    // tour
    let tour = edition.toursMap.get(e.tour)
    if (!tour) {
      tour = {
        tour: e.tour,
        roundsMap: new Map()
      }
      edition.toursMap.set(e.tour, tour)
    }

    // round
    let round = tour.roundsMap.get(e.round)
    if (!round) {
      round = {
        round: e.round,
        typesMap: new Map()
      }
      tour.roundsMap.set(e.round, round)
    }

    // type
    let type = round.typesMap.get(e.type)
    if (!type) {
      type = {
        type: e.type,
        players: []
      }
      round.typesMap.set(e.type, type)
    }

    type.players.push(...e.players)
  }

  // convert internal Maps -> arrays (final shape)
  return Array.from(editionsMap.values()).map(edition => ({
    id: edition.id,
    year: edition.year,
    tours: Array.from(edition.toursMap.values()).map(tour => ({
      tour: (tour as any).tour,
      rounds: Array.from((tour as any).roundsMap.values()).map(round => ({
        round: (round as any).round,
        types: Array.from((round as any).typesMap.values())
      }))
    }))
  }))
})
</script>

<template>
  <dashboard-subpanel
    title="Years when the top seeds all reached the later rounds"
    :icon="ICONS.seeds"
  >
    <u-page-columns
      v-if="data.length || status === 'pending'"
      class="m-5"
    >
      <u-page-card
        v-if="groupedData.length"
        v-for="edition in groupedData"
        :key="edition.id"
        highlight
        :title="edition.year.toString()"
        :to="{
          name: 'edition',
          params: {
            id,
            name,
            year: edition.year,
            edId: edition.id
          }
        }"
        :ui="{ body: 'w-full' }"
      >
        <template #description>
          <div
            v-for="tour in edition.tours"
            :key="tour.tour"
            class="my-3 text-sm"
          >
            <u-badge
              :label="tour.tour"
              :color="(tour.tour as keyof typeof colors)"
              class="w-full"
            />

            <div
              v-for="round in tour.rounds"
              :key="round.round"
              class="my-2"
            >
              <div class="font-semibold text-center text-sm">{{ round.round }}</div>
              <div
                v-for="type in round.types"
                :key="(type as any).type"
                class="flex flex-wrap items-start gap-2 my-2"
              >
                <u-badge
                  :label="( type as any).type"
                  :color="( type as any).type"
                />
                <div>
                  <div
                    v-for="player in (type as any).players"
                    :key="player.seed"
                    class="flex items-start gap-2 not-first:my-1"
                  >
                    <div>{{ player.seed }}</div>
                    <template
                      v-for="(teamMember, index) in player.team"
                      :key="player.id"
                    >
                      <u-separator
                        v-if="(index as number) > 0"
                        orientation="vertical"
                      />
                      <player-link :player="teamMember" />
                    </template>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </u-page-card>

      <u-page-card
        v-else
        v-for="_ in 3"
        :key="_"
        highlight
        :ui="{ body: 'w-full' }"
      >
        <template #title>
          <u-skeleton class="h-5 w-15" />
        </template>

        <template #description>
          <div class="*:my-2 *:*:my-1">
            <div
              v-for="_ in 2"
              :key="_"
            >
              <u-skeleton class="h-5 w-full" />
              <u-skeleton class="h-5 w-1/4 mx-auto" />
              <u-skeleton class="h-5 w-3/4" />
            </div>
          </div>
        </template>
      </u-page-card>
    </u-page-columns>

    <empty
      v-else
      class="m-5"
      :message="`The top seeds have never all reached the later rounds of ${tournamentStore.name}`"
    />
  </dashboard-subpanel>
</template>
