<script setup lang="ts">
defineProps<{
  match: ResultMatchType
}>()

const { devMode } = useRuntimeConfig().public
const {
  ui: { icons }
} = useAppConfig()
const {
  params: { id, name, year, edId }
} = useRoute("results")
</script>

<template>
  <u-card
    :ui="{
      root: devMode && !match.stats ? 'ring-warning' : `ring-${match.tour}`,
      header: 'text-sm',
      body: 'text-sm',
      footer: 'flex justify-center'
    }"
  >
    <template #header>
      <div class="flex justify-between">
        <div>Date: {{ match.date ? useDateFormat(match.date, "dddd DD MMMM YYYY") : "—" }}</div>
        <div>Duration: {{ match.duration ? getDurationString(match.duration) : "—" }}</div>
      </div>
      <div class="flex justify-between">
        <div>Court: {{ match.court ?? "—" }}</div>
        <div>Umpire: {{ match.umpire?.id ?? "—" }}</div>
      </div>
    </template>

    <div class="grid grid-rows-2 grid-flow-col gap-3 items-center">
      <!--Players-->
      <div>
        <player-link
          v-if="match.winner"
          v-for="player in match.winner.team"
          :key="player.id"
          :player
        />
      </div>
      <div>
        <player-link
          v-if="match.loser"
          v-for="player in match.loser.team"
          :key="player.id"
          :player
        />
      </div>

      <!--Status-->
      <div class="text-sm text-muted">
        <span v-if="match.draw === 'Main' && (match.winner?.seed || match.winner?.status)">
          ({{ match.winner?.seed ?? "" }}{{ match.winner?.seed && match.winner?.status ? " " : "" }}{{ match.winner?.status ?? "" }})
        </span>
        <span v-else-if="match.draw === 'Qualifying' && (match.winner?.q_seed || match.winner?.q_status)">
          ({{ match.winner?.q_seed ?? "" }}{{ match.winner?.q_seed && match.winner?.q_status ? " " : "" }}{{ match.winner?.q_status ?? "" }})
        </span>
      </div>

      <div class="text-sm text-muted">
        <span v-if="match.draw === 'Main' && (match.loser?.seed || match.loser?.status)">
          ({{ match.loser?.seed ?? "" }}{{ match.loser?.seed && match.loser?.status ? " " : "" }}{{ match.loser?.status ?? "" }})
        </span>
        <span v-else-if="match.draw === 'Qualifying' && (match.loser?.q_seed || match.loser?.q_status)">
          ({{ match.loser?.q_seed ?? "" }}{{ match.loser?.q_seed && match.loser?.q_status ? " " : "" }}{{ match.loser?.q_status ?? "" }})
        </span>
      </div>

      <!--Winner / Incomplete-->
      <div>
        <u-icon
          :name="icons.success"
          class="text-success"
        />
      </div>
      <div>
        <u-badge
          v-if="match.incomplete"
          :label="`${match.incomplete}.`"
          color="error"
        />
      </div>

      <!--Score-->
      <div
        class="grid text-center"
        :class="`grid-cols-${match.noOfSets}`"
      >
        <div
          v-for="(set, index) in match.sets?.[0]"
          :key="`winner-${index}`"
        >
          {{ set[0] }}<sup v-if="isDefined(set[1])">{{ set[1] }}</sup>
        </div>
      </div>

      <div
        class="grid text-center"
        :class="`grid-cols-${match.noOfSets}`"
      >
        <div
          v-for="(set, index) in match.sets?.[1]"
          :key="`loser-${index}`"
        >
          {{ set[0] }}<sup v-if="isDefined(set[1])">{{ set[1] }}</sup>
        </div>
      </div>
    </div>

    <template #footer>
      <u-field-group class="w-full justify-stretch flex">
        <u-button
          label="Stats"
          :icon="ICONS.stats"
          :disabled="!match.stats && !devMode"
          block
          :to="{
            name: 'match',
            params: { name, id, year, edId },
            query: { tour: match.tour, draw: match.draw, type: match.type, match_no: match.match_no }
          }"
        />

        <u-button
          label="H2H"
          :icon="ICONS.h2h"
          block
          :to="{ name: 'head-to-head', params: { p1Name: match.winner!.team.map(p => kebabCase(`${p.first_name}-${p.last_name}`)).join('+'), p2Name: match.loser!.team.map(p => kebabCase(`${p.first_name}-${p.last_name}`)).join('+'), p1Id: match.winner!.team.map(p => p.id).join('+'), p2Id: match.loser!.team.map(p => p.id).join('+') } }"
        />
      </u-field-group>
    </template>
  </u-card>
</template>
