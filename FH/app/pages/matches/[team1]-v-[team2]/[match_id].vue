<script setup lang="ts">
import { formatDateTime, MATCH_AWARD_TYPE_MAPPING, MATCH_DECISION_MAPPING, MATCH_STATUS_MAPPING } from "#imports"
import type { BreadcrumbItem } from "@nuxt/ui"
import { kebabCase, startCase } from "lodash"

definePageMeta({ name: "match" })

const route = useRoute("match")
const supabase = useSupabaseClient()

const {
  data: match,
  pending,
  refresh
} = await useAsyncData(
  () => `match-${route.params.match_id}`,
  async () => {
    const { data, error } = await supabase
      .from("match")
      .select(
        `
      *,
      season(name, competition(id, name)),
      round(name),
      group(name),
      home_team:team!home_team_id(id, name, short_name, logo_url),
      away_team:team!away_team_id(id, name, short_name, logo_url),
      venue(*, country(*)),
      awards:match_award(type, source, team(name, short_name), ...player(id, aka, ...people(full_name, ...country!nationality_country_id(icon))))
    `
      )
      .eq("id", route.params.match_id)
      .single()

    if (error || !data) {
      console.error("Error fetching match:", error)
      return null
    }

    return data
  }
)

const getTeam = (teamId: string) => {
  return match.value!.home_team_id === teamId ? match.value!.home_team : match.value!.away_team
}

useHead({
  title: () =>
    match.value ?
      `${match.value.home_team.name} v ${match.value.away_team.name} - ${match.value.season.competition.name} ${match.value.season.name}`
    : `${startCase(route.params.team1)} v ${startCase(route.params.team2)}`,
  templateParams: { category: "Matches" }
})

const breadcrumbs = computed<Array<BreadcrumbItem>>(() => {
  if (match.value) {
    return [
      {
        label: match.value.season.competition.name,
        to: { name: "competition", params: { id: match.value.season.competition.id, name: kebabCase(match.value.season.competition.name) } }
      },
      {
        label: match.value.season.name,
        to: {
          name: "season",
          params: {
            id: match.value.season.competition.id,
            name: kebabCase(match.value.season.competition.name),
            season: encodeURIComponent(match.value.season.name)
          }
        }
      },
      ...(match.value.round ? [{ label: match.value.round.name }] : [])
    ]
  } else {
    return [{ label: "Matches" }]
  }
})
</script>

<template>
  <u-container>
    <u-page>
      <u-page-header :ui="{ title: match ? 'w-full mt-6' : '' }">
        <template #headline>
          <u-breadcrumb :items="breadcrumbs" />
        </template>

        <template #title>
          <div
            v-if="match"
            class="w-full grid grid-cols-3 justify-items-center items-center"
          >
            <div>{{ match.home_team.name }}</div>
            <div class="flex flex-col items-center gap-2">
              <u-badge
                size="xl"
                :label="`${match.home_score} - ${match.away_score}`"
              />
              <u-badge
                v-if="match.decision === 'penalties'"
                size="lg"
                :label="`PKs: ${match.home_penalties}-${match.away_penalties}`"
                color="secondary"
              />
            </div>
            <div>{{ match.away_team.name }}</div>
          </div>

          <div v-else> {{ startCase(route.params.team1) }} v {{ startCase(route.params.team2) }} </div>
        </template>

        <template #links>
          <dev-only>
            <lazy-match-add-award
              v-if="match?.awards.length === 0"
              hydrate-on-idle
              @refresh="refresh"
            />
          </dev-only>
        </template>
      </u-page-header>

      <u-page-body>
        <template v-if="match">
          <u-page-grid class="md:grid-cols-3 lg:grid-cols-5 px-6">
            <u-page-feature
              v-if="match.group"
              :title="match.group.name"
              description="Group"
            />

            <u-page-feature
              :title="MATCH_DECISION_MAPPING[match.decision]"
              :description="MATCH_STATUS_MAPPING[match.status]"
            />

            <u-page-feature
              v-if="match.kickoff_time"
              :title="formatDateTime(match.kickoff_time)"
              description="Kickoff"
            />

            <u-page-feature
              v-if="match.venue"
              :title="match.venue.name || match.venue.city"
              :description="match.venue.name ? match.venue.city : undefined"
              :icon="match.venue.country.icon"
            />

            <u-page-feature
              v-if="match.awards[0]"
              :description="MATCH_AWARD_TYPE_MAPPING[match.awards[0].type]"
              :icon="match.awards[0].icon"
              :to="{ name: 'player', params: { id: match.awards[0].id!, name: kebabCase(match.awards[0].full_name!) } }"
            >
              <template #title>
                <div>{{ match.awards[0]?.aka || match.awards[0]?.full_name }}</div>
                <div class="font-medium text-sm">{{ match.awards[0].team?.short_name || match.awards[0].team?.name }}</div>
              </template>
            </u-page-feature>
          </u-page-grid>

          <u-theme :ui="{ card: { header: 'flex justify-between' } }">
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div class="flex flex-col gap-6">
                <match-referees />

                <match-events
                  :home-team="match.home_team"
                  :away-team="match.away_team"
                />
              </div>
              <div class="flex flex-col gap-6">
                <match-penalties
                  v-if="match.decision === 'penalties'"
                  :home-team="match.home_team"
                  :away-team="match.away_team"
                />

                <match-stats
                  :home-team="match.home_team"
                  :away-team="match.away_team"
                />

                <match-lineup
                  :home-team="match.home_team"
                  :away-team="match.away_team"
                  :season-id="match.season_id"
                />
              </div>
            </div>
          </u-theme>
        </template>
      </u-page-body>
    </u-page>
  </u-container>
</template>
