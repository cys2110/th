<script setup lang="ts">
import {
  formatDateTime,
  MATCH_AWARD_TYPE_MAPPING,
  MATCH_DECISION_MAPPING,
  MATCH_EVENT_ROLE_MAPPING,
  MATCH_STATUS_MAPPING,
  REFEREE_TYPE_MAPPING
} from "#imports"
import type { BreadcrumbItem } from "@nuxt/ui"
import { kebabCase, startCase } from "lodash"

definePageMeta({ name: "match" })

const route = useRoute("match")
const supabase = useSupabaseClient()
const { ui } = useAppConfig()

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
      home_team:team!home_team_id(name, short_name, logo_url),
      away_team:team!away_team_id(name, short_name, logo_url),
      venue(*, country(*)),
      awards:match_award(*, player(id, aka, ...people(full_name, country:country!nationality_country_id(*)))),
      referees:match_referee(type, ...people(full_name, country:country!nationality_country_id(*))),
      stats:match_stats(*),
      lineup:match_lineup(*, position(*), player(id, aka, ...people(full_name, country:country!nationality_country_id(*)))),
      events:match_event(*, players:match_event_player(role, ...player(id, aka, ...people(full_name, country:country!nationality_country_id(*)))))
    `
      )
      .eq("id", route.params.match_id)
      .order("type", { referencedTable: "match_referee", ascending: true })
      .order("captain", { referencedTable: "match_lineup", ascending: false })
      .order("starter", { referencedTable: "match_lineup", ascending: false })
      .order("shirt_number", { referencedTable: "match_lineup", ascending: true })
      .order("minute", { referencedTable: "match_event", ascending: true })
      .order("stoppage_minute", { referencedTable: "match_event", ascending: true })
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

watch(
  match,
  () => {
    console.log(match.value)
  },
  { immediate: true }
)

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

const stats = computed(() => {
  if (match.value) {
    return {
      home: match.value.stats.find(s => s.team_id === match.value!.home_team_id)!,
      away: match.value.stats.find(s => s.team_id === match.value!.away_team_id)!
    }
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
            >
              <template #title>
                <div>{{ match.awards[0].player?.full_name }}</div>
                <div class="font-medium text-sm">{{ getTeam(match.awards[0].team_id!).name }}</div>
              </template>
            </u-page-feature>
          </u-page-grid>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div class="flex flex-col gap-6">
              <u-card>
                <template #header>
                  <div class="font-semibold">Referees</div>
                </template>

                <div class="columns-2 space-y-2">
                  <u-page-feature
                    v-for="(referee, index) in match.referees"
                    :key="index"
                    :title="referee.full_name!"
                    :description="REFEREE_TYPE_MAPPING[referee.type]"
                    class="break-inside-avoid"
                  />
                </div>
              </u-card>

              <u-card>
                <template #header>
                  <div class="font-semibold">Events</div>
                </template>

                <u-timeline
                  :items="match.events"
                  :ui="{ wrapper: 'ring ring-primary p-5 rounded-xl' }"
                >
                  <template #date="{ item }">
                    {{ item.minute }}'
                    <span v-if="item.stoppage_minute"> + {{ item.stoppage_minute }}'</span>
                  </template>

                  <template #title="{ item }">
                    {{ getTeam(item.team_id!).name }}
                  </template>

                  <template #indicator="{ item }">
                    <u-icon
                      :name="
                        item.type === 'goal' ? 'game-icons:soccer-ball'
                        : item.type === 'injury' ? 'icon-park-twotone:medical-box'
                        : item.type === 'substitution' ? 'line-md:arrows-horizontal'
                        : item.type === 'penalty_missed' || item.type === 'penalty_saved' ? 'tabler:ball-football-off'
                        : 'icon-park-twotone:rectangle'
                      "
                      class="text-lg"
                      :class="{
                        'text-red-600': item.type === 'red_card',
                        'text-warning': item.type === 'yellow_card' || item.type === 'second_yellow_card'
                      }"
                    />
                  </template>

                  <template #description="{ item }">
                    <div class="grid grid-cols-3 gap-3">
                      <u-page-feature
                        v-for="player in item.players"
                        :key="player.id"
                        :title="player.full_name!"
                        :description="player.role === 'carded_player' ? undefined : MATCH_EVENT_ROLE_MAPPING[player.role]"
                      >
                        <template #leading>
                          <u-icon
                            v-if="!['penalty_conceded_by', 'fouled_player', 'carded_player'].includes(player.role)"
                            :name="
                              player.role === 'keeper' ? 'game-icons:goal-keeper'
                              : player.role === 'scorer' ? 'game-icons:soccer-ball'
                              : player.role === 'penalty_taker' || player.role === 'own_goal_scorer' || player.role === 'assist' ?
                                'game-icons:soccer-kick'
                              : player.role === 'sub_on' ? 'line-md:arrow-right'
                              : player.role === 'sub_off' ? 'line-md:arrow-left'
                              : undefined
                            "
                            class="text-xl"
                            :class="{
                              'text-success': player.role === 'sub_on',
                              'text-error': player.role === 'sub_off',
                              'text-primary': player.role === 'scorer'
                            }"
                          />
                        </template>
                      </u-page-feature>
                    </div>
                  </template>
                </u-timeline>
              </u-card>
            </div>

            <div class="flex flex-col gap-6">
              <u-card v-if="stats">
                <template #header>
                  <div class="font-semibold">Stats</div>
                </template>

                <div class="*:flex *:justify-between">
                  <div>
                    <div>{{ match.home_team.name }}</div>
                    <div>{{ match.away_team.name }}</div>
                  </div>

                  <div class="items-end">
                    <div>{{ stats.home.possession }}%</div>
                    <div>
                      <div>Possession</div>
                      <div>In contest: {{ 100 - stats.home.possession! - stats.away.possession! }}%</div>
                    </div>
                    <div>{{ stats.away.possession }}%</div>
                  </div>

                  <div>
                    <div>{{ stats.home.shots }}</div>
                    <div>Shots</div>
                    <div>{{ stats.away.shots }}</div>
                  </div>

                  <div>
                    <div>{{ stats.home.shots_on_target }}</div>
                    <div>Shots on target</div>
                    <div>{{ stats.away.shots_on_target }}</div>
                  </div>

                  <div>
                    <div>{{ stats.home.shots! - stats.home.shots_on_target! }}</div>
                    <div>Shots off target</div>
                    <div>{{ stats.away.shots! - stats.away.shots_on_target! }}</div>
                  </div>

                  <div>
                    <div>{{ stats.home.yellow_cards }}</div>
                    <div>Yellow cards</div>
                    <div>{{ stats.away.yellow_cards }}</div>
                  </div>

                  <div>
                    <div>{{ stats.home.red_cards }}</div>
                    <div>Red cards</div>
                    <div>{{ stats.away.red_cards }}</div>
                  </div>

                  <div>
                    <div>{{ stats.home.fouls }}</div>
                    <div>Fouls</div>
                    <div>{{ stats.away.fouls }}</div>
                  </div>

                  <div>
                    <div>{{ stats.home.offsides }}</div>
                    <div>Offsides</div>
                    <div>{{ stats.away.offsides }}</div>
                  </div>

                  <div>
                    <div>{{ stats.home.corners }}</div>
                    <div>Corners</div>
                    <div>{{ stats.away.corners }}</div>
                  </div>
                </div>
              </u-card>

              <u-card>
                <template #header>
                  <div class="font-semibold">Line ups</div>
                </template>

                <div class="grid grid-cols-2 gap-3">
                  <div class="space-y-3">
                    <div>{{ match.home_team.name }}</div>
                    <u-page-feature
                      v-for="player in match.lineup.filter(lineup => lineup.team_id === match!.home_team_id)"
                      :key="player.id"
                      :title="player.player.full_name!"
                      orientation="vertical"
                    >
                      <template
                        #leading
                        v-if="player.starter"
                      >
                        <div class="flex items-center gap-2">
                          <u-icon
                            v-if="player.captain"
                            name="material-symbols-light:copyright-outline-rounded"
                            class="text-xl"
                          />

                          <u-badge label="Starter" />
                        </div>
                      </template>

                      <template #description>
                        {{ player.shirt_number }} <span v-if="player.position">- {{ player.position.name }}</span>
                      </template>
                    </u-page-feature>
                  </div>

                  <div class="space-y-3">
                    <div>{{ match.away_team.name }}</div>
                    <u-page-feature
                      v-for="player in match.lineup.filter(lineup => lineup.team_id === match!.away_team_id)"
                      :key="player.id"
                      :title="player.player.full_name!"
                      orientation="vertical"
                    >
                      <template
                        #leading
                        v-if="player.starter"
                      >
                        <div class="flex items-center gap-2">
                          <u-icon
                            v-if="player.captain"
                            name="material-symbols-light:copyright-outline-rounded"
                            class="text-xl"
                          />

                          <u-badge label="Starter" />
                        </div>
                      </template>

                      <template #description>
                        {{ player.shirt_number }} <span v-if="player.position">- {{ player.position.name }}</span>
                      </template>
                    </u-page-feature>
                  </div>
                </div>
              </u-card>
            </div>
          </div>
        </template>
      </u-page-body>
    </u-page>
  </u-container>
</template>
