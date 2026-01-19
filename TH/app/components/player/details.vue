<script setup lang="ts">
const props = defineProps<{
  player: PlayerDetailsType
}>()

const breakpoints = useBreakpoints(breakpointsTailwind, { ssrWidth: useSSRWidth() })
const lgAndDown = breakpoints.smallerOrEqual("lg")

const playerStore = usePlayerStore()
const currentYear = new Date().getFullYear()

const combinedCoaches = computed(() => [
  ...props.player.coaches,
  ...props.player.former_coaches.map(coach => ({
    ...coach,
    years: coach.years ?? "Former"
  }))
])
</script>

<template>
  <details-grid
    id="details"
    class="scroll-mt-70"
  >
    <div class="row-span-2">
      <div>Rankings</div>
      <table class="w-full [&_th]:text-dimmed [&_th]:font-semibold [&_td]:text-center [&_td]:py-1">
        <thead>
          <tr>
            <th></th>
            <th>Current</th>
            <th>Career High</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th>Singles</th>
            <td>{{ player.current_singles ?? "—" }}</td>
            <td>
              <div>{{ player.ch_singles ?? "—" }}</div>
              <div>
                {{ player.singles_ch_date ? (lgAndDown ? shortDateFormat : dateTimeFormat).format(new Date(player.singles_ch_date)) : "—" }}
              </div>
            </td>
          </tr>
          <tr>
            <th>Doubles</th>
            <td>{{ player.current_doubles ?? "—" }}</td>
            <td>
              <div>{{ player.ch_doubles ?? "—" }}</div>
              <div>
                {{ player.doubles_ch_date ? (lgAndDown ? shortDateFormat : dateTimeFormat).format(new Date(player.doubles_ch_date)) : "—" }}
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="player.age">
      <div>Age</div>
      <div>{{ player.age }} years old</div>
      <div v-if="player.dob && player.dod">
        {{ (lgAndDown ? shortDateFormat : dateTimeFormat).formatRange(new Date(player.dob), new Date(player.dod)) }}
      </div>
      <div v-else-if="player.dob">
        {{ (lgAndDown ? shortDateFormat : dateTimeFormat).format(new Date(player.dob)) }}
      </div>
    </div>

    <div v-if="player.height">
      <div>Height</div>
      <div>{{ player.height }} cm</div>
      <div>{{ convertToFt(player.height) }}</div>
    </div>

    <div v-if="player.rh">
      <div>Plays</div>
      <div>{{ player.rh }}-handed</div>
    </div>

    <div v-if="player.bh">
      <div>Backhand</div>
      <div>{{ player.bh }}-handed</div>
    </div>

    <div v-if="player.turned_pro || player.retired">
      <div v-if="player.turned_pro && player.retired">Pro Years</div>
      <div v-else-if="player.turned_pro">Turned Pro</div>
      <div v-else>Retired</div>

      <div>
        <span v-if="player.turned_pro">{{ player.turned_pro }}</span>
        <span v-if="player.turned_pro && player.retired"> - </span>
        <span v-if="player.retired">{{ player.retired }}</span>
      </div>

      <div v-if="player.turned_pro && (player.retired || playerStore.activeYears.includes(currentYear))">
        ({{ currentYear - player.turned_pro }} years pro)
      </div>
    </div>

    <div
      v-if="combinedCoaches.length"
      :class="`row-span-${combinedCoaches.length}`"
    >
      <div>{{ combinedCoaches.length === 1 ? "Coach" : "Coaches" }}</div>
      <div
        v-for="coach in combinedCoaches"
        :key="coach.id"
        class="flex items-center gap-2"
      >
        <dev-only>
          <person-update
            type="Coach"
            :person="coach"
          />
          <span
            v-if="coach.years"
            class="text-dimmed shrink-0"
          >
            ({{ coach.years }})
          </span>

          <template #fallback>
            <u-link
              v-if="coach.labels.includes('Player')"
              class="hover-link default-link"
              :to="{
                name: 'player',
                params: {
                  id: coach.id,
                  name: kebabCase(`${coach.first_name} ${coach.last_name}`)
                }
              }"
            >
              {{ coach.first_name }} {{ coach.last_name }}
            </u-link>
            <span v-else>{{ coach.first_name }} {{ coach.last_name }}</span>
            <span
              v-if="coach.years"
              class="text-dimmed shrink-0"
            >
              ({{ coach.years }})
            </span>
          </template>
        </dev-only>
      </div>
    </div>

    <div v-if="player.pm">
      <div>Career Prize Money</div>
      <div>{{ player.pm.toLocaleString("en-GB", { style: "currency", currency: "USD" }) }}</div>
    </div>

    <div v-if="player.former_countries.length">
      <div>Previous Representations</div>
      <div
        v-for="country in player.former_countries"
        :key="country.id"
        :class="['flex flex-wrap items-center gap-1 my-2', `row-span-${player.former_countries.length}`]"
      >
        <country-link :country />
        <span
          v-if="country.start_date && country.end_date"
          class="text-dimmed"
        >
          ({{ (lgAndDown ? shortDateFormat : dateTimeFormat).formatRange(new Date(country.start_date), new Date(country.end_date)) }})
        </span>
      </div>
    </div>

    <div v-if="player.hof">
      <div>Hall of Fame Induction</div>
      <div>{{ player.hof }}</div>
    </div>
  </details-grid>
</template>
