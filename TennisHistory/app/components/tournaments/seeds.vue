<script setup lang="ts">
const {
  params: { id, name }
} = useRoute("tournament")

const { data, status } = await useFetch("/api/tournaments/seeds", {
  query: { id },
  default: () => []
})

const groupedData = computed(() => {
  const editionIds = useArrayUnique(data.value.map(item => item.id)).value

  return editionIds.map(editionId => {
    const editionItems = data.value.filter(item => item.id === editionId)
    const eventIds = useArrayUnique(editionItems.map(item => item.tour)).value

    const events = eventIds.map(eventId => {
      const eventItems = editionItems.filter(item => item.tour === eventId)

      return {
        tour: eventId,
        rounds: eventItems.map(i => ({
          type: i.type,
          players: i.players,
          round: i.round
        }))
      }
    })

    return {
      id: editionId,
      year: editionItems[0]?.year,
      events: events
    }
  })
})
</script>

<template>
  <div>
    <div class="text-accented text-lg font-semibold">
      <u-icon
        :name="ICONS.seeds"
        class="align-middle size-5"
      />
      Years when the top seeds all reached the later rounds
    </div>

    <u-page-columns
      v-if="data.length || status === 'pending'"
      class="my-5"
    >
      <u-page-card
        v-if="data.length"
        v-for="edition in groupedData"
        :key="edition.id"
        highlight
        :title="edition.year?.toString()"
        :to="{
          name: 'edition',
          params: {
            id,
            name,
            year: edition.year!,
            edId: edition.id
          }
        }"
        :ui="{ body: 'w-full' }"
      >
        <template #description>
          <div
            v-for="event in edition.events"
            :key="event.tour"
            class="my-3 text-sm"
          >
            <u-badge
              :label="event.tour"
              :color="event.tour"
              class="w-full justify-center"
            />

            <div
              v-for="round in event.rounds"
              :key="round.round"
              class="my-2"
            >
              <div>{{ round.round }} - {{ round.type }}</div>
              <div
                v-for="team in round.players"
                :key="team.seed"
                class="flex flex-wrap items-center"
              >
                <div class="w-5 text-center">{{ team.seed }}</div>
                <template
                  v-for="(player, index) in team.team"
                  :key="player.id"
                >
                  <span v-if="index > 0"> / </span>
                  <players-link :player />
                </template>
              </div>
            </div>
          </div>
        </template>
      </u-page-card>

      <loading-tournament-seeds
        v-else
        v-for="_ in 3"
        :key="_"
      />
    </u-page-columns>

    <empty
      v-else
      message="No data available"
      class="m-2"
    />
  </div>
</template>
