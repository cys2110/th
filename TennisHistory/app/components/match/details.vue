<script setup lang="ts">
import { INCOMPLETE_MAPPING } from "#imports"
import { isDefined, useDateFormat } from "@vueuse/core"

const props = defineProps<{ match: MatchDetailsQuery }>()

type MatchScore = {
  set_no: number
  set: number
  tb?: number | null
}

const { ui } = useAppConfig()

const setNumbers = computed(() => Array.from({ length: (props.match.format || 0) + 1 }, (_, index) => index + 1))
const scoreGridStyle = computed(() => ({
  gridTemplateColumns: `minmax(0, 1fr) repeat(${setNumbers.value.length}, 1.25rem)`
}))

const getSetScore = (scores: unknown, setNumber: number) =>
  Array.isArray(scores) ? (scores as Array<MatchScore>).find(score => score.set_no === setNumber) : undefined

const team1Scores = computed(() => setNumbers.value.map(setNumber => getSetScore(props.match.team_1_scores, setNumber)))
const team2Scores = computed(() => setNumbers.value.map(setNumber => getSetScore(props.match.team_2_scores, setNumber)))
</script>

<template>
  <u-container class="max-w-xl">
    <u-card>
      <template #header>
        <div class="text-sm text-muted">
          <div class="flex justify-between">
            <div>
              <span v-if="match.category">{{ match.category }}</span>
              <span v-if="match.category && match.surface"> | </span>
              <span v-if="match.surface">{{ match.surface }}</span>
            </div>

            <div v-if="match.duration">{{ match.duration }}</div>
          </div>

          <div v-if="match.date">{{ useDateFormat(match.date, "dddd DD MMMM YYYY") }}</div>
        </div>
      </template>

      <div class="space-y-2 text-sm">
        <div
          class="grid items-center gap-x-1"
          :style="scoreGridStyle"
        >
          <div class="flex items-center gap-2">
            <player-link
              v-if="match.team1"
              :team="match.team1.team"
            />

            <small v-if="match.team_1_seed || match.team_1_status">
              ({{ match.team_1_seed }}{{ match.team_1_seed && match.team_1_status ? " " : "" }}{{ match.team_1_status }})
            </small>
          </div>

          <div class="flex items-center justify-center">
            <u-icon
              v-if="match.winner_id === match.team_1_id"
              :name="ui.icons.success"
              class="text-success"
            />
          </div>

          <div
            v-for="(score, index) in team1Scores"
            :key="index"
            class="text-center tabular-nums"
          >
            <template v-if="score">
              <span>{{ score.set }}</span>
              <sup v-if="isDefined(score.tb)">{{ score.tb }}</sup>
            </template>
          </div>
        </div>

        <div
          class="grid items-center gap-x-1"
          :style="scoreGridStyle"
        >
          <div class="flex items-center gap-2">
            <player-link
              v-if="match.team2"
              :team="match.team2.team"
            />

            <small v-if="match.team_2_seed || match.team_2_status">
              ({{ match.team_2_seed }}{{ match.team_2_seed && match.team_2_status ? " " : "" }}{{ match.team_2_status }})
            </small>
          </div>

          <div class="flex items-center justify-center">
            <u-icon
              v-if="match.winner_id === match.team_2_id"
              :name="ui.icons.success"
              class="text-success text-base"
            />
          </div>

          <div
            v-for="(score, index) in team2Scores"
            :key="index"
            class="text-center tabular-nums"
          >
            <template v-if="score">
              <span>{{ score.set }}</span>
              <sup v-if="isDefined(score.tb)">{{ score.tb }}</sup>
            </template>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-between">
          <div class="text-sm text-muted">
            <div v-if="match.court">Court: {{ match.court }}</div>
            <div v-if="match.umpire">Ump: {{ match.umpire.full_name }}</div>
          </div>

          <u-badge
            v-if="match.incomplete"
            :label="INCOMPLETE_MAPPING[match.incomplete]"
            color="error"
          />
        </div>
      </template>
    </u-card>
  </u-container>
</template>
