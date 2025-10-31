<script setup lang="ts">
const { results, status, tour, firstName, lastName } = defineProps<{
  results: RecordAPIType
  status: APIStatusType
  tour: TourType
  firstName?: string
  lastName?: string
}>()
const { icons } = useAppConfig()

const playerYears = useState<number[]>("player-years")
const tournaments = computed(() => [
  {
    id: 580,
    name: "Australian Open",
    singles:
      results.singles
        .find(r => r.tid === 580)
        ?.resultsPerTid.map(s => ({
          year: s.year,
          round: s.round
        })) || [],
    doubles:
      results.doubles
        .find(r => r.tid === 580)
        ?.resultsPerTid.map(s => ({
          year: s.year,
          round: s.round
        })) || []
  },
  {
    id: 520,
    name: "French Open",
    singles:
      results.singles
        .find(r => r.tid === 520)
        ?.resultsPerTid.map(s => ({
          year: s.year,
          round: s.round
        })) || [],
    doubles:
      results.doubles
        .find(r => r.tid === 520)
        ?.resultsPerTid.map(s => ({
          year: s.year,
          round: s.round
        })) || []
  },
  {
    id: 540,
    name: "Wimbledon",
    singles:
      results.singles
        .find(r => r.tid === 540)
        ?.resultsPerTid.map(s => ({
          year: s.year,
          round: s.round
        })) || [],
    doubles:
      results.doubles
        .find(r => r.tid === 540)
        ?.resultsPerTid.map(s => ({
          year: s.year,
          round: s.round
        })) || []
  },
  {
    id: 580,
    name: "US Open",
    singles:
      results.singles
        .find(r => r.tid === 580)
        ?.resultsPerTid.map(s => ({
          year: s.year.toString(),
          round: s.round
        })) || [],
    doubles:
      results.doubles
        .find(r => r.tid === 580)
        ?.resultsPerTid.map(s => ({
          year: s.year,
          round: s.round
        })) || []
  },
  {
    id: tour === "ATP" ? 605 : 10,
    name: "Year End Finals",
    singles:
      results.singles
        .find(r => r.tid === (tour === "ATP" ? 605 : 10))
        ?.resultsPerTid.map(s => ({
          year: s.year,
          round: s.round
        })) || [],
    doubles:
      results.doubles
        .find(r => r.tid === (tour === "ATP" ? 605 : 10))
        ?.resultsPerTid.map(s => ({
          year: s.year,
          round: s.round
        })) || []
  },
  {
    id: 96,
    name: "Olympics",
    singles:
      results.singles
        .find(r => r.tid === 96)
        ?.resultsPerTid.map(s => ({
          year: s.year,
          round: s.round
        })) || [],
    doubles:
      results.doubles
        .find(r => r.tid === 96)
        ?.resultsPerTid.map(s => ({
          year: s.year,
          round: s.round
        })) || []
  }
])
</script>

<template>
  <div
    v-if="playerYears.length > 0"
    class="flex flex-col gap-5 max-h-200 overflow-y-auto scrollbar-thin scrollbar-thumb-primary-600 scrollbar-track-transparent"
  >
    <div class="grid grid-cols-7 gap-2 sticky top-0 z-10 bg-neutral-100 dark:bg-neutral-950">
      <div />
      <div
        v-for="tournament in tournaments"
        :key="tournament.id"
        class="text-center"
      >
        <u-link
          :to="{ name: 'tournament', params: { id: tournament.id, name: kebabCase(tournament.name) } }"
          class="hover-link font-semibold"
        >
          {{ tournament.name }}
        </u-link>
      </div>
    </div>
    <div
      v-for="year in playerYears"
      :key="year"
      class="grid grid-cols-7 gap-2"
    >
      <div class="text-center text-muted">{{ year }}</div>

      <div
        v-for="tournament in tournaments"
        :key="`result-${tournament.id}-${year}`"
      >
        <div class="font-semibold flex items-center justify-center gap-1">
          <u-icon :name="icons.person" />
          <span :class="{ 'text-success uppercase': tournament.singles.find(r => r.year === year)?.round === 'Win' }">
            {{ tournament.singles.find(r => r.year === year)?.round ?? "—" }}
          </span>
        </div>
        <div class="font-semibold flex items-center justify-center gap-1">
          <u-icon :name="icons.people" />
          <span :class="{ 'text-success uppercase': tournament.doubles.find(r => r.year === year)?.round === 'Win' }">
            {{ tournament.doubles.find(r => r.year === year)?.round ?? "—" }}
          </span>
        </div>
      </div>
    </div>
  </div>
  <error-message
    v-else
    :icon="icons.noTournament"
    :message="`No records found for ${firstName} ${lastName}`"
  />
</template>
