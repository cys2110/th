<script setup lang="ts">
import { ICONS, PENALTY_OUTCOME_MAPPING } from "#imports"
import { kebabCase } from "lodash"
import { type Tables } from "~/types/database.types"

type TeamType = Pick<Tables<{ schema: "football" }, "team">, "id" | "name" | "short_name" | "logo_url">

const props = defineProps<{
  homeTeam: TeamType
  awayTeam: TeamType
}>()

const route = useRoute("match")
const supabase = useSupabaseClient()
const { ui } = useAppConfig()

const {
  data: penalties,
  pending,
  refresh
} = await useAsyncData(
  () => `match-penalties-${route.params.match_id}`,
  async () => {
    const { data, error } = await supabase
      .from("penalty_shootout_attempt")
      .select(
        `
      attempt_number,
      team_attempt_number,
      outcome,
      is_sudden_death,
      team_id,
      player!player_id(id, aka, ...people(full_name, ...country!nationality_country_id(icon))),
      goalkeeper:player!goalkeeper_id(id, aka, ...people(full_name, ...country!nationality_country_id(icon)))
    `
      )
      .eq("match_id", route.params.match_id)
      .order("attempt_number", { ascending: true })

    if (error || !data) {
      console.error("Error fetching penalties:", error)
      return {
        home: [],
        away: []
      }
    }

    return {
      home: data.filter(p => p.team_id === props.homeTeam.id),
      away: data.filter(p => p.team_id === props.awayTeam.id)
    }
  },
  { default: () => ({ home: [], away: [] }) }
)
</script>

<template>
  <u-card>
    <template #header>
      <div class="font-semibold">Penalties</div>

      <dev-only>
        <lazy-match-add-penalties
          :home-team
          :away-team
          hydrate-on-idle
          @refresh="refresh"
        />
      </dev-only>
    </template>

    <div class="space-y-6">
      <table class="mx-auto">
        <thead class="[&_th]:py-1 [&_th]:px-2">
          <tr>
            <th />
            <th
              v-for="attempt in penalties.home"
              :key="attempt.team_attempt_number!"
              class="font-semibold text-sm"
            >
              {{ attempt.team_attempt_number }}
            </th>
          </tr>
        </thead>
        <tbody class="[&_td]:py-1 [&_td]:px-2">
          <tr>
            <td>
              <u-user
                :name="homeTeam.short_name || homeTeam.name"
                :avatar="{ src: homeTeam.logo_url || '', loading: 'lazy', icon: ICONS.team }"
                :to="{ name: 'team', params: { id: homeTeam.id, name: kebabCase(homeTeam.name) } }"
              />
            </td>
            <td
              v-for="attempt in penalties.home"
              :key="attempt.attempt_number"
            >
              <u-icon
                :name="ui.icons[attempt.outcome === 'scored' ? 'success' : 'error']"
                class="text-xl align-middle"
                :class="attempt.outcome === 'scored' ? 'text-success' : 'text-error'"
              />
            </td>
          </tr>
          <tr>
            <td>
              <u-user
                :name="awayTeam.short_name || awayTeam.name"
                :avatar="{ src: awayTeam.logo_url || '', loading: 'lazy', icon: ICONS.team }"
                :to="{ name: 'team', params: { id: awayTeam.id, name: kebabCase(awayTeam.name) } }"
              />
            </td>
            <td
              v-for="attempt in penalties.away"
              :key="attempt.attempt_number"
            >
              <u-icon
                :name="ui.icons[attempt.outcome === 'scored' ? 'success' : 'error']"
                class="text-xl align-middle"
                :class="attempt.outcome === 'scored' ? 'text-success' : 'text-error'"
              />
            </td>
          </tr>
        </tbody>
      </table>

      <div class="*:flex *:justify-between *:items-center space-y-3">
        <div>
          <u-user
            :name="homeTeam.short_name || homeTeam.name"
            :avatar="{ src: homeTeam.logo_url || '', loading: 'lazy', icon: ICONS.team }"
            :to="{ name: 'team', params: { id: homeTeam.id, name: kebabCase(homeTeam.name) } }"
          />

          <u-user
            :name="awayTeam.short_name || awayTeam.name"
            :avatar="{ src: awayTeam.logo_url || '', loading: 'lazy', icon: ICONS.team }"
            :to="{ name: 'team', params: { id: awayTeam.id, name: kebabCase(awayTeam.name) } }"
          />
        </div>

        <div
          v-for="(attempt, index) in penalties.home"
          :key="index"
        >
          <u-page-feature
            :title="attempt.player?.aka || attempt.player!.full_name!"
            :description="PENALTY_OUTCOME_MAPPING[attempt.outcome as keyof typeof PENALTY_OUTCOME_MAPPING]"
            :to="{ name: 'player', params: { id: attempt.player!.id, name: kebabCase(attempt.player!.full_name!) } }"
            :ui="{ title: 'text-sm' }"
          />

          <u-page-feature
            :title="penalties.away[index]!.player?.aka || penalties.away[index]!.player!.full_name!"
            :description="PENALTY_OUTCOME_MAPPING[penalties.away[index]!.outcome as keyof typeof PENALTY_OUTCOME_MAPPING]"
            :to="{ name: 'player', params: { id: attempt.player!.id, name: kebabCase(penalties.away[index]!.player!.full_name!) } }"
            :ui="{ wrapper: 'text-right', title: 'text-sm' }"
          />
        </div>
      </div>
    </div>
  </u-card>
</template>
