<script setup lang="ts">
import { parseDate } from "@internationalized/date"

const props = defineProps<{ match: RawMatchType }>()
const {
  ui: { icons }
} = useAppConfig()

const calendarDate = computed(() => {
  if (props.match.date) {
    return parseDate(props.match.date)
  } else {
    return {
      start: parseDate(props.match.start_date!),
      end: parseDate(props.match.end_date!)
    }
  }
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
        <div v-if="match.group">Group</div>
      </div>
      <div class="flex flex-col justify-evenly items-end gap-3 font-semibold">
        <span>{{ match.surface?.id ?? "—" }}</span>
        <span>{{ match.duration ? getDurationString(match.duration) : "—" }}</span>
        <span>{{ match.court ?? "—" }}</span>
        <span>
          <dev-only>
            <person-update
              v-if="match.umpire"
              :person="match.umpire"
              type="Umpire"
            />
            <span v-else>—</span>
            <template #fallback>
              {{ match.umpire?.id ?? "—" }}
            </template>
          </dev-only>
        </span>
        <span v-if="match.group">{{ match.group }}</span>
      </div>
    </div>

    <!--Score box-->
    <div
      class="flex-1 border-2 border-primary-700 p-5 rounded-xl flex justify-between h-fit my-auto text-xs md:text-sm md:order-last md:min-w-fit lg:min-w-0"
    >
      <!--Players-->
      <div class="flex flex-col gap-4 min-h-full justify-evenly">
        <!--Team 1-->
        <div class="flex flex-wrap items-center gap-2">
          <template
            v-for="(player, index) in match.t1?.team"
            :key="player.id"
          >
            <u-separator
              v-if="index === 1"
              orientation="vertical"
              class="h-4"
            />
            <player-link :player />
            <small v-if="isDefined(player.rank)">[{{ player.rank }}]</small>
          </template>

          <small>
            {{
              match.t1?.seed || match.t1?.status
                ? `(${match.t1?.seed ?? ""}${match.t1?.seed && match.t1?.status ? " " : ""}${match.t1?.status ?? ""})`
                : ""
            }}
          </small>

          <div>
            <u-icon
              v-if="match.winning_team === 't1'"
              :name="icons.success"
              class="text-success text-lg"
            />
            <u-badge
              v-else-if="match.team1?.incomplete"
              :label="`${match.team1.incomplete}.`"
              color="error"
            />
          </div>
        </div>

        <!--Team 2-->
        <div class="flex flex-wrap items-center gap-2">
          <template
            v-for="(player, index) in match.t2?.team"
            :key="player.id"
          >
            <u-separator
              v-if="index === 1"
              orientation="vertical"
              class="h-4"
            />
            <player-link :player />
            <small v-if="isDefined(player.rank)">[{{ player.rank }}]</small>
          </template>

          <small>
            {{
              match.t2?.seed || match.t2?.status
                ? `(${match.t2?.seed ?? ""}${match.t2?.seed && match.t2?.status ? " " : ""}${match.t2?.status ?? ""})`
                : ""
            }}
          </small>

          <div>
            <u-icon
              v-if="match.winning_team === 't2'"
              :name="icons.success"
              class="text-success text-lg"
            />
            <u-badge
              v-else-if="match.team2?.incomplete"
              :label="`${match.team2.incomplete}.`"
              color="error"
            />
          </div>
        </div>
      </div>

      <!--Score-->
      <div class="flex flex-col gap-4 min-h-full justify-evenly">
        <div :class="`grid grid-cols-${match.noOfSets} gap-1`">
          <span
            v-for="i in match.noOfSets"
            :key="i"
            :class="{ 'font-semibold': (match.team1?.[`s${i}` as keyof typeof match.team1] ?? 0) > (match.team2?.[`s${i}` as keyof typeof match.team2] ?? 0)}"
          >
            {{ match.team1?.[`s${i}` as keyof typeof match.team1]
            }}<sup v-if="isDefined(match.team1?.[`t${i}` as keyof typeof match.team1])">{{
              match.team1?.[`t${i}` as keyof typeof match.team1] ?? 0
            }}</sup>
          </span>
        </div>

        <div :class="`grid grid-cols-${match.noOfSets} gap-1`">
          <span
            v-for="i in match.noOfSets"
            :key="i"
            :class="{ 'font-semibold': (match.team1?.[`s${i}` as keyof typeof match.team1] ?? 0) < (match.team2?.[`s${i}` as keyof typeof match.team2] ?? 0)}"
          >
            {{ match.team2?.[`s${i}` as keyof typeof match.team2]
            }}<sup v-if="isDefined(match.team2?.[`t${i}` as keyof typeof match.team2])">{{
              match.team2?.[`t${i}` as keyof typeof match.team2] ?? 0
            }}</sup>
          </span>
        </div>
      </div>
    </div>

    <!--Date-->
    <div class="border-2 border-primary-700 p-5 rounded-xl text-xs sm:text-sm max-w-fit m-auto lg:order-last">
      <u-calendar
        :range="match.date ? false : true"
        v-model="calendarDate"
        disabled
        readonly
        :month-controls="false"
        :year-controls="false"
        :fixed-weeks="false"
        :week-starts-on="1"
      />
    </div>
  </div>
</template>
