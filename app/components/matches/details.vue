<script setup lang="ts">
import { parseDate, parseDuration } from "@internationalized/date"

const {
  ui: { icons }
} = useAppConfig()
const { match } = defineProps<{ match: MatchInterface }>()
const calendarDate = computed(() => {
  if (match.date) {
    return parseDate(match.date)
  } else {
    return {
      start: parseDate(match.start_date),
      end: parseDate(match.end_date)
    }
  }
  return null
})
const duration = computed(() => {
  if (match.duration) {
    const { seconds } = parseDuration(match.duration)
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }
  return "00:00:00"
})
</script>

<template>
  <div class="flex flex-col md:flex-row flex-wrap gap-8 max-w-full mx-auto">
    <!--Match Details-->
    <div class="border-2 border-primary-700 p-5 rounded-xl flex flex-row justify-between max-w-fit h-fit m-auto gap-8 text-xs md:text-sm">
      <div class="flex flex-col justify-evenly gap-3">
        <div>Surface</div>
        <div>Duration</div>
        <div>Court</div>
        <div>Umpire</div>
      </div>
      <div class="flex flex-col justify-evenly items-end gap-3 font-semibold">
        <span>{{ match.surface?.id ?? "—" }}</span>
        <span>{{ duration }}</span>
        <span>{{ match.court ?? "—" }}</span>
        <span>
          <dev-only>
            <person-update
              :person="match.umpire"
              type="Umpire"
            />
            <template #fallback>
              {{ match.umpire?.id ?? "—" }}
            </template>
          </dev-only>
        </span>
      </div>
    </div>

    <!--Score box-->
    <div
      class="flex-1 border-2 border-primary-700 p-5 rounded-xl flex justify-between h-fit my-auto text-xs md:text-sm md:order-last md:min-w-fit lg:min-w-0"
    >
      <!--Players-->
      <div class="flex flex-col gap-5 min-h-full justify-evenly">
        <div class="flex flex-wrap items-center gap-2">
          <template
            v-for="(player, index) in match.t1.players"
            :key="player.id"
          >
            <u-separator
              v-if="index === 1"
              orientation="vertical"
              class="h-4"
            />
            <players-link :player />
            <small v-if="isDefined(player.rank)">[{{ player.rank }}]</small>
          </template>
          <small>
            {{ match.t1.seed || match.t1.status ? `(${match.t1.seed ?? ""}${match.t1.status ?? ""})` : "" }}
          </small>
          <div class="flex items-center">
            <u-icon
              v-if="match.t1_winner"
              :name="icons.success"
              class="text-success text-lg"
            />
            <u-badge
              v-else-if="match.t1_incomplete"
              color="error"
              :label="`${match.t1_incomplete}.`"
            />
          </div>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <template
            v-for="(player, index) in match.t2.players"
            :key="player.id"
          >
            <u-separator
              v-if="index === 1"
              orientation="vertical"
              class="h-4"
            />
            <players-link :player />
            <small v-if="isDefined(player.rank)">[{{ player.rank }}]</small>
          </template>
          <small>
            {{ match.t2.seed || match.t2.status ? `(${match.t2.seed ?? ""}${match.t2.status ?? ""})` : "" }}
          </small>
          <div class="flex items-center">
            <u-icon
              v-if="!match.t1_winner"
              :name="icons.success"
              class="text-success text-lg"
            />
            <u-badge
              v-else-if="match.t2_incomplete"
              color="error"
              :label="`${match.t2_incomplete}.`"
            />
          </div>
        </div>
      </div>

      <!--Scores-->
      <div class="flex flex-col gap-5 min-h-full justify-evenly">
        <div
          v-for="(x, index) in match.sets"
          :key="`p-${index}`"
          :class="`grid grid-cols-5 gap-1`"
        >
          <div v-if="match.sets[index] && match.sets[index].length < 5" />
          <div v-if="match.sets[index] && match.sets[index].length < 4" />
          <template
            v-for="(s, idx) in x"
            :key="`p-${index}-${idx}`"
          >
            <!--prettier-ignore-->
            <span class="text-center" :class="{ 'font-semibold': s > (match.sets?.[index === 0 ? 1 : 0]?.[idx] ?? 0) && (match.sets?.[index === 0 ? 1 : 0]?.[idx] !== undefined) }">{{ s[0] }}<sup v-if="isDefined(s[1])">{{ s[1] }}</sup></span>
          </template>
        </div>
      </div>
    </div>

    <!--Date-->
    <div class="border-2 border-primary-700 p-5 rounded-xl text-xs sm:text-sm max-w-fit m-auto lg:order-last">
      <u-calendar
        :range="match.date ? false : true"
        v-model="calendarDate"
        disabled
        :month-controls="false"
        :year-controls="false"
        :fixed-weeks="false"
        size="xs"
        variant="subtle"
      />
    </div>
  </div>
</template>
