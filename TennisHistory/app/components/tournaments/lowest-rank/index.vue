<script setup lang="ts">
import { groupBy } from "lodash"

const {
  params: { id, name }
} = useRoute("tournament")

const { data, status } = await useFetch("/api/tournaments/lowest-ranked", {
  query: { id },
  default: () => []
})

const groupedData = groupBy(data.value, "round")
const rounds = ["Win", "Final", "Semifinals", "Quarterfinals"]
</script>

<template>
  <div>
    <div class="flex justify-between items-center">
      <div class="text-accented text-lg font-semibold">
        <u-icon
          :name="ICONS.sortNumberDown"
          class="align-middle size-5"
        />
        Lowest Ranked Singles Players to Reach Later Rounds
      </div>

      <tournaments-lowest-rank-chart
        v-if="data.length"
        :events="data"
      />
    </div>

    <u-page-grid
      v-if="data.length || status === 'pending'"
      class="my-5 lg:grid-cols-2"
    >
      <u-page-card
        v-if="data.length"
        v-for="round in rounds"
        :key="round"
        highlight
        :title="round"
        :ui="{ body: 'w-full' }"
      >
        <template #description>
          <div
            v-for="player in groupedData[round]"
            :key="player.id"
            class="grid grid-cols-12 gap-2 items-center"
          >
            <u-link
              :to="{
                name: 'edition',
                params: {
                  id,
                  name,
                  year: player.year,
                  edId: player.edId
                }
              }"
              class="hover-link default-link w-fit"
            >
              {{ player.year }}
            </u-link>
            <u-badge
              :label="player.tour"
              :color="player.tour"
              class="col-span-2 justify-center"
            />
            <div>{{ player.rank }}</div>
            <players-link
              class="col-span-8"
              :player
            />
          </div>
        </template>
      </u-page-card>

      <loading-base
        v-else
        v-for="_ in 4"
        :key="_"
      />
    </u-page-grid>

    <empty
      v-else
      message="No data available"
      class="m-2"
    />
  </div>
</template>
