<script setup lang="ts">
defineProps<{
  match: RoundRobinMatch
  team_1_id: string
  team_2_id: string
}>()

const {
  params: { id, name, year, edId }
} = useRoute("draws")

const [DefineTemplate, ReuseTemplate] = createReusableTemplate()
</script>

<template>
  <define-template>
    <template
      v-for="set_no in Array.from({ length: match.format }, (_, index) => index + 1)"
      :key="set_no"
    >
      <div v-if="match.scores.find(s => s.set_no === set_no)">
        <span>{{ match.scores.find(s => s.set_no === set_no && s.entry_id === team_1_id)?.set }}</span>
        <span>{{ match.scores.find(s => s.set_no === set_no && s.entry_id === team_2_id)?.set }}</span>
        <sup v-if="match.scores.find(s => s.set_no === set_no && isDefined(s.tb))">
          {{ Math.min(...(match.scores.filter(s => s.set_no === set_no).map(s => s.tb || 9999) || [])) }}
        </sup>
      </div>
    </template>

    <u-badge
      v-if="match.incomplete"
      :label="match.incomplete"
      color="error"
    />
  </define-template>

  <u-link
    v-if="match.stats"
    :to="{
      name: 'match',
      params: { id, name, year, edId, tour: match.tour, match_type: match.match_type, draw: match.draw, match_no: match.match_no }
    }"
    class="flex justify-center items-center gap-1 hover-link w-fit mx-auto"
    :class="match.winner_id === team_1_id ? 'success-link font-semibold' : 'default-link'"
  >
    <reuse-template />
  </u-link>
  <div
    v-else
    class="flex justify-center items-center gap-1 w-fit mx-auto"
    :class="match.winner_id === team_1_id ? 'text-success font-semibold' : ''"
  >
    <reuse-template />
  </div>
</template>
