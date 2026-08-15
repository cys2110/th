<script setup lang="ts">
import { parseDate } from "@internationalized/date"

const props = defineProps<{
  match: MatchInterface
}>()

const supabase = useSupabaseClient()

const { isAdmin } = useAuthState()

const isUpdating = ref(false)
const scoreRows = ref<Array<{ handleSave: () => Record<string, any> | null }>>([])

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

const handleSave = async () => {
  isUpdating.value = true

  const scoresToUpsert = scoreRows.value.map(row => row.handleSave()).filter(isDefined)

  if (scoresToUpsert.length) {
    const { error } = await supabase.from("match_scores").upsert(scoresToUpsert as any, { onConflict: "match_id, entry_id, set_no" })
    if (error) {
      console.error(error)
    }
  }
  isUpdating.value = false
}
</script>

<template>
  <div
    v-if="isAdmin"
    class="flex justify-end"
  >
    <u-button
      :icon="ICONS.save"
      :loading="isUpdating"
      :loading-icon="ICONS.uploading"
      @click="handleSave"
    />
  </div>

  <div class="flex flex-col md:flex-row flex-wrap gap-8 max-w-full xl:max-w-3/4 mx-auto">
    <!--Match Details-->
    <div class="border-2 border-primary-700 p-5 rounded-xl flex flex-row justify-between max-w-fit h-fit m-auto gap-8 text-xs md:text-sm">
      <div class="flex flex-col justify-evenly gap-3">
        <div>Level</div>
        <div>Surface</div>
        <div>Duration</div>
        <div>Court</div>
        <div>Umpire</div>
        <div v-if="match.group_name">Group</div>
      </div>
      <div class="flex flex-col justify-evenly items-end gap-3 font-semibold">
        <span>{{ match.level }}</span>
        <span>{{ match.surface ? `${match.surface.environment} ${match.surface.surface}` : "—" }}</span>
        <span>{{ match.duration ?? "—" }}</span>
        <span>{{ match.court ?? "—" }}</span>
        <span>{{ match.umpire?.full_name || "—" }}</span>
        <span v-if="match.group_name">
          {{ match.group_name ?? "—" }}
        </span>
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
          <player-link :players="match.team1.team" />

          <small>
            {{
              match.team1.seed || match.team1?.status ?
                `(${match.team1.seed ?? ""}${match.team1.seed && match.team1.status ? " " : ""}${match.team1.status ?? ""})`
              : ""
            }}
          </small>

          <div>
            <u-icon
              v-if="match.winner_id === match.team1.id"
              :name="icons.success"
              class="text-success text-lg"
            />
            <u-badge
              v-else-if="match.incomplete"
              :label="`${match.incomplete}.`"
              color="error"
            />
          </div>
        </div>

        <!--Team 2-->
        <div class="flex flex-wrap items-center gap-2">
          <player-link :players="match.team2.team" />

          <small>
            {{
              match.team2.seed || match.team2.status ?
                `(${match.team2.seed ?? ""}${match.team2.seed && match.team2.status ? " " : ""}${match.team2.status ?? ""})`
              : ""
            }}
          </small>

          <div>
            <u-icon
              v-if="match.winner_id === match.team2.id"
              :name="icons.success"
              class="text-success text-lg"
            />
            <u-badge
              v-else-if="match.incomplete"
              :label="`${match.incomplete}.`"
              color="error"
            />
          </div>
        </div>
      </div>

      <!--Score-->
      <div class="flex flex-col gap-4 min-h-full justify-evenly">
        <div
          class="grid gap-1"
          :class="`grid-cols-${match.format}`"
        >
          <match-score-row
            v-for="set_no in Array.from({ length: match.format }, (_, i) => i + 1)"
            :key="set_no"
            ref="scoreRows"
            :set="match.scores.find(s => s.set_no === set_no)"
            entry="t1"
            :entry-id="match.team1.id"
            :set-no="set_no"
          />
        </div>

        <div
          class="grid gap-1"
          :class="`grid-cols-${match.format}`"
        >
          <match-score-row
            v-for="set_no in Array.from({ length: match.format }, (_, i) => i + 1)"
            :key="set_no"
            ref="scoreRows"
            :set="match.scores.find(s => s.set_no === set_no)"
            entry="t2"
            :entry-id="match.team2.id"
            :set-no="set_no"
          />
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
