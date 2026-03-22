<script setup lang="ts">
defineProps<{
  match: EditionResultMatchInterface
}>()

const { dev } = useRuntimeConfig().public

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
      root:
        dev && !match.stats ? 'ring-warning'
        : !match.tour ? 'ring-primary'
        : `ring-${match.tour}`,
      header: 'text-sm',
      body: 'text-sm',
      footer: 'flex justify-center'
    }"
  >
    <template #header>
      <div class="flex justify-between">
        <div>Date: {{ match.date ? useDateFormat(match.date, "dddd DD MMMM YYYY") : "—" }}</div>
        <div>Duration: {{ match.duration ?? "—" }}</div>
      </div>
      <div class="flex justify-between">
        <div>Court: {{ match.court ?? "—" }}</div>
        <div>Umpire: {{ match.umpire ? `${match.umpire.first_name} ${match.umpire.last_name}` : "—" }}</div>
      </div>
    </template>

    <div class="grid grid-rows-2 grid-flow-col gap-3 items-center">
      <!-- Players -->
      <div>
        <player-link
          v-for="player in match.winner.team"
          :key="player.id"
          :player
        />
      </div>
      <div>
        <player-link
          v-for="player in match.loser.team"
          :key="player.id"
          :player
        />
      </div>

      <!--Status-->
      <div class="text-sm text-muted">
        <span v-if="match.winner.seed || match.winner.status">
          ({{ match.winner.seed ?? "" }}{{ match.winner.seed && match.winner.status ? " " : "" }}{{ match.winner.status ?? "" }})
        </span>
      </div>

      <div class="text-sm text-muted">
        <span v-if="match.loser.seed || match.loser.status">
          ({{ match.loser.seed ?? "" }}{{ match.loser.seed && match.loser.status ? " " : "" }}{{ match.loser.status ?? "" }})
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
        :class="`grid-cols-${match.format}`"
      >
        <div
          v-for="set_no in Array.from({ length: match.format }, (_, i) => 1 + i)"
          :key="set_no"
        >
          {{ match.scores.find(s => s.set_no === set_no && s.entry_id === match.winner.id)?.set
          }}<sup v-if="isDefined(isDefined(match.scores.find(s => s.set_no === set_no && s.entry_id === match.winner.id)?.tb))">{{
            match.scores.find(s => s.set_no === set_no && s.entry_id === match.winner.id)?.tb
          }}</sup>
        </div>
      </div>

      <div
        class="grid text-center"
        :class="`grid-cols-${match.format}`"
      >
        <div
          v-for="set_no in Array.from({ length: match.format }, (_, i) => 1 + i)"
          :key="set_no"
        >
          {{ match.scores.find(s => s.set_no === set_no && s.entry_id === match.loser.id)?.set
          }}<sup v-if="isDefined(isDefined(match.scores.find(s => s.set_no === set_no && s.entry_id === match.loser.id)?.tb))">{{
            match.scores.find(s => s.set_no === set_no && s.entry_id === match.loser.id)?.tb
          }}</sup>
        </div>
      </div>
    </div>

    <template #footer>
      <u-field-group class="w-full justify-stretch flex">
        <u-button
          label="Stats"
          :icon="ICONS.stats"
          :disabled="!match.stats && !dev"
          block
          :to="{
            name: 'match',
            params: { name, id, year, edId, mid: match.id }
          }"
        />

        <u-button
          label="H2H"
          :icon="ICONS.h2h"
          block
          :to="{
            name: 'h2h-players',
            params: {
              t1Name: match.winner.team.map(p => kebabCase(`${p.first_name}-${p.last_name}`)).join('+'),
              t2Name: match.loser.team.map(p => kebabCase(`${p.first_name}-${p.last_name}`)).join('+'),
              t1Id: match.winner.team.map(p => p.id).join('+'),
              t2Id: match.loser.team.map(p => p.id).join('+')
            }
          }"
        />
      </u-field-group>
    </template>
  </u-card>
</template>
