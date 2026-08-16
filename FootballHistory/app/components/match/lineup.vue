<script setup lang="ts">
import { ICONS, POSITION_MAPPING } from "#imports"
import { type Tables } from "~/types/database.types"

type TeamType = Pick<Tables<{ schema: "football" }, "team">, "id" | "name" | "short_name" | "logo_url">

const props = defineProps<{
  homeTeam: TeamType
  awayTeam: TeamType
  seasonId: string
}>()

const route = useRoute("match")
const supabase = useSupabaseClient()

const {
  data: players,
  pending,
  refresh
} = await useAsyncData(
  () => `match-lineups-${route.params.match_id}`,
  async () => {
    const { data, error } = await supabase
      .schema("football")
      .from("match_lineup")
      .select("team_id, shirt_number, starter, captain, position, ...player(id, aka, ...people(full_name, ...country!nationality_country_id(icon)))")
      .eq("match_id", route.params.match_id)
      .order("captain", { ascending: false })
      .order("starter", { ascending: false })
      .order("shirt_number", { ascending: true })

    if (error || !data) {
      console.error("Error fetching match lineups:", error)
      return { home: [], away: [] }
    }

    return {
      home: data
        .filter(item => item.team_id === props.homeTeam.id)
        .map(item => ({
          ...item,
          name: item.aka || item.full_name
        })),
      away: data
        .filter(item => item.team_id === props.awayTeam.id)
        .map(item => ({
          ...item,
          name: item.aka || item.full_name
        }))
    }
  },
  { default: () => ({ home: [], away: [] }) }
)
</script>

<template>
  <u-card :ui="{ header: 'font-semibold' }">
    <template #header> Line ups </template>

    <div class="grid grid-cols-2 gap-3">
      <div class="space-y-3">
        <div class="flex justify-between">
          <u-user
            :name="homeTeam.short_name || homeTeam.name"
            :avatar="{
              src: homeTeam.logo_url || '',
              loading: 'lazy',
              icon: ICONS.team
            }"
          />

          <dev-only>
            <lazy-match-add-lineup
              :team-id="homeTeam.id"
              :season-id
              hydrate-on-idle
              @refresh="refresh"
            />
          </dev-only>
        </div>

        <u-page-feature
          v-for="player in players.home"
          :key="player.id"
          :icon="player.icon"
          :ui="{ title: 'flex items-center gap-2' }"
        >
          <template #title>
            {{ player.shirt_number }}. {{ player.aka || player.full_name }}
            <u-icon
              v-if="player.starter"
              :name="player.captain ? 'icon-park-twotone:handle-c' : 'game-icons:whistle'"
              class="text-xl"
              :class="player.captain ? 'text-success' : 'text-muted'"
            />
          </template>

          <template #description>
            <div v-if="player.aka">{{ player.full_name }}</div>

            <div v-if="player.position">
              {{ POSITION_MAPPING[player.position] }}
            </div>
          </template>
        </u-page-feature>
      </div>

      <div class="space-y-3">
        <div class="flex justify-between">
          <u-user
            :name="awayTeam.short_name || awayTeam.name"
            :avatar="{
              src: awayTeam.logo_url || '',
              loading: 'lazy',
              icon: ICONS.team
            }"
          />

          <dev-only>
            <lazy-match-add-lineup
              :team-id="awayTeam.id"
              :season-id
              hydrate-on-idle
              @refresh="refresh"
            />
          </dev-only>
        </div>

        <u-page-feature
          v-for="player in players.away"
          :key="player.id"
          :icon="player.icon"
          :ui="{ title: 'flex items-center gap-2' }"
        >
          <template #title>
            {{ player.shirt_number }}. {{ player.aka || player.full_name }}
            <u-icon
              v-if="player.starter"
              :name="player.captain ? 'icon-park-twotone:handle-c' : 'game-icons:whistle'"
              class="text-xl"
              :class="player.captain ? 'text-success' : 'text-muted'"
            />
          </template>

          <template #description>
            <div v-if="player.aka">{{ player.full_name }}</div>

            <div v-if="player.position">
              {{ POSITION_MAPPING[player.position] }}
            </div>
          </template>
        </u-page-feature>
      </div>
    </div>
  </u-card>
</template>
