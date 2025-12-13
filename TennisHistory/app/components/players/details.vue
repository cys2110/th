<script setup lang="ts">
const { player } = defineProps<{
  player?: PlayerDetailsType
  status: "success" | "error" | "pending" | "idle"
}>()

const playerYears = useState<number[]>("playerYears")
const currentYear = new Date().getFullYear()

const details = computed(() => {
  if (player) {
    return [
      player.age && { label: "Age" },
      player.height && { label: "Height", value: `${player.height}cm (${convertToFt(player.height)})` },
      player.rh && { label: "Plays", value: `${player.rh}-handed` },
      player.bh && { label: "Backhand", value: `${player.bh}-handed` },
      (player.turned_pro || player.retired) && {
        label: player.turned_pro && player.retired ? "Pro Years" : player.turned_pro ? "Turned Pro" : "Retired"
      },
      (player.ch_singles || player.ch_doubles) && { label: "Rankings", class: "row-span-2" },
      { label: "Career Prize Money", value: player?.pm?.toLocaleString("en-GB", { style: "currency", currency: "USD" }) },
      (player.coaches.length || player.former_coaches.length) && {
        label: "Coaches",
        class: `row-span${player.coaches.length + player.former_coaches.length}`
      },
      player.former_countries.length && { label: "Previous Representations", class: `row-span-${player.former_countries.length}` },
      player.hof && { label: "Hall of Fame Inductee", value: player.hof }
    ].filter(Boolean) as Array<{ label: string; value?: string; class?: string }>
  }

  return []
})
</script>

<template>
  <details-grid>
    <div
      v-for="detail in details"
      :key="detail.label"
      :class="detail.class"
    >
      <div>{{ detail.label }}</div>
      <div v-if="detail.value">{{ detail.value }}</div>
      <template v-else-if="detail.label === 'Age'">
        <div>{{ player!.age }} years</div>
        <div>{{
          player!.dob && player!.dod
            ? `${dateTimeFormat.formatRange(new Date(player!.dob as string), new Date(player!.dod as string))}`
            : useDateFormat(player!.dob as string, "DD MMMM YYYY")
        }}</div>
      </template>

      <div v-else-if="detail.label === 'Rankings'">
        <div class="grid grid-cols-3 gap-1 text-center">
          <div></div>
          <div class="text-muted font-semibold">Singles</div>
          <div class="text-muted font-semibold">Doubles</div>
          <div class="text-muted font-semibold">Current</div>
          <div>{{ player!.current_singles ?? "—" }}</div>
          <div>{{ player!.current_doubles ?? "—" }}</div>
          <div class="text-muted font-semibold">Career High</div>
          <div>{{ player!.ch_singles ?? "—" }}</div>
          <div>{{ player!.ch_doubles ?? "—" }}</div>
          <div class="text-muted font-semibold">Date</div>
          <div>
            {{ player!.singles_ch_date ? useDateFormat(player!.singles_ch_date as string, "DD MMMM YYYY") : "—" }}
          </div>
          <div>
            {{ player!.doubles_ch_date ? useDateFormat(player!.doubles_ch_date as string, "DD MMMM YYYY") : "—" }}
          </div>
        </div>
      </div>

      <template v-else-if="detail.label === 'Coaches'">
        <div
          v-for="coach in player!.coaches"
          :key="coach.id"
          class="flex items-center gap-2"
        >
          <dev-only>
            <person-update
              type="Coach"
              :person="coach"
            />

            <template #fallback>
              <u-link
                v-if="coach.labels?.includes('Player')"
                :to="{ name: 'player', params: { id: coach.id, name: kebabCase(`${coach.first_name} ${coach.last_name}`) } }"
                class="hover-link default-link"
              >
                {{ coach.first_name }} {{ coach.last_name }}
              </u-link>
              <span v-else>{{ coach.first_name }} {{ coach.last_name }}</span>
            </template>
          </dev-only>
          <span
            v-if="coach.years"
            class="text-dimmed shrink-0"
          >
            ({{ coach.years }})
          </span>
        </div>
        <div
          v-for="coach in player!.former_coaches"
          :key="coach.id"
          class="flex items-center gap-2"
        >
          <dev-only>
            <person-update
              type="Coach"
              :person="coach"
            />

            <template #fallback>
              <u-link
                v-if="coach.labels?.includes('Player')"
                :to="{ name: 'player', params: { id: coach.id, name: kebabCase(`${coach.first_name} ${coach.last_name}`) } }"
                class="hover-link default-link"
              >
                {{ coach.first_name }} {{ coach.last_name }}
              </u-link>
              <span v-else>{{ coach.first_name }} {{ coach.last_name }}</span>
            </template>
          </dev-only>
          <span class="text-dimmed shrink-0"> ({{ coach.years ?? "Former" }}) </span>
        </div>
      </template>

      <div
        v-else-if="detail.label === 'Previous Representations'"
        v-for="country in player!.former_countries"
        :key="country.id"
        class="flex items-center gap-2"
      >
        <countries-link
          :country
          class="mx-0"
        />
        <span
          v-if="country.start_date && country.end_date"
          class="text-dimmed"
        >
          ({{ dateTimeFormat.formatRange(new Date(country.start_date as string), new Date(country.end_date as string)) }})
        </span>
      </div>

      <template v-else-if="['Pro Years', 'Turned Pro', 'Retired'].includes(detail.label)">
        <div>{{ player?.turned_pro && player?.retired ? `${player.turned_pro}-${player.retired}` : player!.turned_pro || player!.retired }}</div>
        <div v-if="player?.turned_pro && (player?.retired || playerYears?.includes(currentYear))">
          &nbsp;({{ (player.retired || currentYear) - player.turned_pro + 1 }} years)
        </div>
      </template>
    </div>
  </details-grid>
</template>
