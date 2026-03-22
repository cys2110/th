<script setup lang="ts">
import { parseDate, CalendarDate } from "@internationalized/date"

const props = defineProps<{
  match: MatchInterface
}>()

const supabase = useSupabaseClient()

const {
  params: { mid }
} = useRoute("match")

const isUpdating = ref(false)

const { searchTerm, results, loading } = usePersonSearch()

const selectedPerson = ref<{ id: string; label: string } | undefined>(
  props.match.umpire ?
    {
      id: props.match.umpire.id,
      label: `${props.match.umpire.first_name} ${props.match.umpire.last_name}`
    }
  : undefined
)

const selectedDate = ref<CalendarDate | undefined>(props.match.date ? parseDate(props.match.date) : undefined)

const updatedFields = ref<Record<string, any>>({
  t1: {
    1: {},
    2: {},
    3: {},
    4: {},
    5: {}
  },
  t2: {
    1: {},
    2: {},
    3: {},
    4: {},
    5: {}
  }
})

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

const team1Scores = computed(() => props.match.scores.filter(s => s.entry_id === props.match.team1.id))
const team2Scores = computed(() => props.match.scores.filter(s => s.entry_id === props.match.team2.id))

const handleSave = async () => {
  set(isUpdating, true)
  const { t1, t2, ...rest } = updatedFields.value

  if (Object.keys(rest).length) {
    const { error } = await supabase.from("matches").update(rest).eq("id", mid)

    if (error) {
      console.error("Error updating match:", error)
    }
  }

  const scoresToUpsert = []

  for (let i = 1; i <= 5; i++) {
    if (t1[i].set || t1[i].tb) {
      const objectToUpdate: Record<string, any> = {
        match_id: mid,
        entry_id: props.match.team1.id,
        set_no: i
      }
      if (t1[i].set) objectToUpdate["set"] = t1[i].set
      if (t1[i].tb) objectToUpdate["tb"] = t1[i].tb
      scoresToUpsert.push(objectToUpdate)
    }

    if (t2[i].set || t2[i].tb) {
      const objectToUpdate: any = {
        match_id: mid,
        entry_id: props.match.team2.id,
        set_no: i
      }
      if (t2[i].set) objectToUpdate["set"] = t2[i].set
      if (t2[i].tb) objectToUpdate["tb"] = t2[i].tb
      scoresToUpsert.push(objectToUpdate)
    }
  }

  if (scoresToUpsert.length) {
    const { error } = await supabase.from("match_scores").upsert(scoresToUpsert, { onConflict: "match_id, entry_id, set_no" })

    if (error) {
      console.error(error)
    }
  }
  set(isUpdating, false)
}
</script>

<template>
  <div class="flex justify-end">
    <u-button
      :icon="ICONS.save"
      color="warning"
      @click="handleSave"
      :loading="isUpdating"
      :loading-icon="ICONS.uploading"
    />
  </div>

  <div class="flex flex-col md:flex-row flex-wrap gap-8 max-w-full mx-auto">
    <!--Match Details-->
    <div class="border-2 border-primary-700 p-5 rounded-xl flex flex-row justify-between max-w-fit h-fit m-auto gap-8 text-xs md:text-sm">
      <div class="flex flex-col justify-evenly gap-3">
        <div>Surface</div>
        <div>Duration</div>
        <div>Court</div>
        <div>Umpire</div>
        <div v-if="match.group_name">Group</div>
      </div>
      <div class="flex flex-col justify-evenly items-end gap-3 font-semibold">
        <span>{{ match.surfaces[0] ? `${match.surfaces[0].environment} ${match.surfaces[0].surface}` : "—" }}</span>
        <span>
          <dev-only>
            <form-input
              placeholder="HH:MM:SS"
              :default-value="match.duration"
              :model-value="updatedFields.duration"
              @update:model-value="updatedFields.duration = $event"
            />

            <template #fallback>
              {{ match.duration ?? "—" }}
            </template>
          </dev-only>
        </span>
        <span>
          <dev-only>
            <form-input
              placeholder="Enter court"
              :default-value="match.court"
              :model-value="updatedFields.court"
              @update:model-value="updatedFields.court = $event"
            />

            <template #fallback>{{ match.court ?? "—" }}</template>
          </dev-only>
        </span>
        <span>
          <dev-only>
            <u-select-menu
              v-model="selectedPerson"
              @update:model-value="updatedFields.umpire_id = $event?.id"
              :items="results"
              :loading
              v-model:search-term="searchTerm"
            />

            <template #fallback>
              {{ match.umpire ? `${match.umpire.first_name} ${match.umpire.last_name}` : "—" }}
            </template>
          </dev-only>
        </span>
        <span v-if="match.group_name">
          <dev-only>
            <form-input
              placeholder="Enter group"
              :default-value="match.group_name"
              :model-value="updatedFields.group_name"
              @update:model-value="updatedFields.group_name = $event"
            />

            <template #fallback>
              {{ match.group_name }}
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
      <div class="flex flex-col gap-4 min-h-full justify-evenly">
        <!--Team 1-->
        <div class="flex flex-wrap items-center gap-2">
          <template
            v-for="(player, index) in match.team1.team"
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
          <template
            v-for="(player, index) in match.team2.team"
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
        <div :class="`grid grid-cols-${match.format} gap-1`">
          <span
            v-for="set_no in Array.from({ length: match.format }, (_, i) => 1 + i)"
            :key="set_no"
            :class="{
              'font-semibold': (team1Scores.find(s => s.set_no === set_no)?.set || 0) > (team2Scores.find(s => s.set_no === set_no)?.set || 0)
            }"
          >
            <dev-only>
              <u-field-group>
                <u-input-number
                  :default-value="team1Scores.find(s => s.set_no === set_no)?.set || undefined"
                  :model-value="updatedFields['t1'][set_no].set"
                  @update:model-value="updatedFields['t1'][set_no].set = $event"
                  placeholder="Enter set"
                  :decrement="false"
                  class="max-w-18"
                >
                  <template #increment>
                    <u-button
                      v-if="isDefined(updatedFields['t1'][set_no].set)"
                      color="neutral"
                      variant="link"
                      :icon="icons.close"
                      aria-label="Clear input"
                      @click="updatedFields['t1'][set_no].set = null"
                    />
                    <template v-else>{{ " " }}</template>
                  </template>
                </u-input-number>
                <u-input-number
                  :default-value="team1Scores.find(s => s.set_no === set_no)?.tb || undefined"
                  :model-value="updatedFields['t1'][set_no].tb"
                  @update:model-value="updatedFields['t1'][set_no].tb = $event"
                  placeholder="Enter tb"
                  :decrement="false"
                  class="max-w-18"
                >
                  <template #increment>
                    <u-button
                      v-if="isDefined(updatedFields['t1'][set_no].tb)"
                      color="neutral"
                      variant="link"
                      :icon="icons.close"
                      aria-label="Clear input"
                      @click="updatedFields['t1'][set_no].tb = null"
                    />
                    <template v-else>{{ " " }}</template>
                  </template>
                </u-input-number>
              </u-field-group>

              <template #fallback>
                {{ team1Scores.find(s => s.set_no === set_no)?.set
                }}<sup v-if="isDefined(team1Scores.find(s => s.set_no === set_no)?.tb)">{{ team1Scores.find(s => s.set_no === set_no)?.tb }}</sup>
              </template>
            </dev-only>
          </span>
        </div>

        <div :class="`grid grid-cols-${match.format} gap-1`">
          <span
            v-for="set_no in Array.from({ length: match.format }, (_, i) => 1 + i)"
            :key="set_no"
            :class="{
              'font-semibold': (team2Scores.find(s => s.set_no === set_no)?.set || 0) > (team1Scores.find(s => s.set_no === set_no)?.set || 0)
            }"
          >
            <dev-only>
              <u-field-group>
                <u-input-number
                  :default-value="team2Scores.find(s => s.set_no === set_no)?.set || undefined"
                  :model-value="updatedFields['t2'][set_no].set"
                  @update:model-value="updatedFields['t2'][set_no].set = $event"
                  placeholder="Enter set"
                  :decrement="false"
                  class="max-w-18"
                >
                  <template #increment>
                    <u-button
                      v-if="isDefined(updatedFields['t2'][set_no].set)"
                      color="neutral"
                      variant="link"
                      :icon="icons.close"
                      aria-label="Clear input"
                      @click="updatedFields['t2'][set_no].set = null"
                    />
                    <template v-else>{{ " " }}</template>
                  </template>
                </u-input-number>
                <u-input-number
                  :default-value="team2Scores.find(s => s.set_no === set_no)?.tb || undefined"
                  :model-value="updatedFields['t2'][set_no].tb"
                  @update:model-value="updatedFields['t2'][set_no].tb = $event"
                  placeholder="Enter tb"
                  :decrement="false"
                  class="max-w-18"
                >
                  <template #increment>
                    <u-button
                      v-if="isDefined(updatedFields['t2'][set_no].tb)"
                      color="neutral"
                      variant="link"
                      :icon="icons.close"
                      aria-label="Clear input"
                      @click="updatedFields['t2'][set_no].tb = null"
                    />
                    <template v-else>{{ " " }}</template>
                  </template>
                </u-input-number>
              </u-field-group>

              <template #fallback>
                {{ team2Scores.find(s => s.set_no === set_no)?.set
                }}<sup v-if="isDefined(team2Scores.find(s => s.set_no === set_no)?.tb)">{{ team2Scores.find(s => s.set_no === set_no)?.tb }}</sup>
              </template>
            </dev-only>
          </span>
        </div>
      </div>
    </div>

    <!--Date-->
    <div class="border-2 border-primary-700 p-5 rounded-xl text-xs sm:text-sm max-w-fit m-auto lg:order-last">
      <dev-only>
        <u-calendar
          v-model="<CalendarDate>selectedDate"
          @update:model-value="updatedFields['date'] = $event?.toString()"
          :max-value="parseDate(match.end_date!)"
          :min-value="parseDate(match.start_date!)"
          :month-controls="false"
          :year-controls="false"
          :fixed-weeks="false"
          :week-starts-on="1"
        />

        <template #fallback>
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
        </template>
      </dev-only>
    </div>
  </div>
</template>
