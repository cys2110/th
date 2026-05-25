<script setup lang="ts">
defineProps<{ match: ResultsMatchInterface }>()

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
      root: !match.tour ? 'ring-primary' : `ring-${match.tour}`,
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
        <div>Umpire: {{ match.umpire?.full_name || "—" }}</div>
      </div>
    </template>

    <div class="grid grid-rows-2 grid-flow-col gap-3 items-center">
      <!-- Players -->
      <player-link :players="match.winner.team" />
      <player-link :players="match.loser.team" />

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
          :label="match.incomplete"
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
          {{ match.scores.find(s => s.set_no === set_no)?.t1_set
          }}<sup v-if="isDefined(isDefined(match.scores.find(s => s.set_no === set_no)?.t1_tb))">{{
            match.scores.find(s => s.set_no === set_no)?.t1_tb
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
          {{ match.scores.find(s => s.set_no === set_no)?.t2_set
          }}<sup v-if="isDefined(isDefined(match.scores.find(s => s.set_no === set_no)?.t2_tb))">{{
            match.scores.find(s => s.set_no === set_no)?.t2_tb
          }}</sup>
        </div>
      </div>
    </div>

    <template #footer>
      <u-field-group class="w-full justify-stretch flex">
        <u-button
          label="Stats"
          :icon="ICONS.stats"
          :disabled="!match.stats"
          block
          :to="{
            name: 'match',
            params: {
              name,
              id,
              year,
              edId,
              tour: match.tour || (COUNTRY_DRAWS.includes(id) ? 'Country' : 'LC'),
              match_type: match.match_type,
              draw: match.draw,
              match_no: match.match_no
            }
          }"
        />

        <u-button
          label="H2H"
          :icon="ICONS.h2h"
          block
          :to="{
            name: 'head-to-head',
            params: {
              t1_name: match.winner.team.map(p => kebabCase(p.full_name || '—')).join('+'),
              t2_name: match.loser.team.map(p => kebabCase(p.full_name || '—')).join('+'),
              t1_id: match.winner.team.map(p => p.id).join('+'),
              t2_id: match.loser.team.map(p => p.id).join('+')
            }
          }"
        />
      </u-field-group>
    </template>
  </u-card>
</template>
