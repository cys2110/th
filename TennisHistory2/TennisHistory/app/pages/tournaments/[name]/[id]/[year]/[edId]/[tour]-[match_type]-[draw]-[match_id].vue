<script setup lang="ts">
import type { BreadcrumbItem, DropdownMenuItem } from "@nuxt/ui"

definePageMeta({ name: "match" })

const {
  ui: { icons }
} = useAppConfig()

const { params } = useRoute("match")
const matchId = computed(() => params.match_id)

const supabase = useSupabaseClient()

const {
  data: match,
  pending,
  refresh
} = await useAsyncData(
  () => matchId.value,
  async () => {
    const { data, error } = await supabase
      .from("matches")
      .select(
        `
      *,
      rounds(
        round,
        events(
          category,
          start_date,
          end_date,
          level,
          sponsor_name,
          event_surface_mapping(surfaces(*)),
          editions(
            category,
            start_date,
            end_date,
            sponsor_name,
            tournaments(name)
          )
        )
      ),
      people(*),
      scores_by_teams(*),
      match_stats(*),
      team1:team_1_id(
        id,
        entry_status(draw, status),
        seeds(draw, seed),
        player_entry_mapping(
          rank,
          countries(*),
          players(id, first_name, last_name, full_name)
        )
      ),
      team2:team_2_id(
        id,
        entry_status(draw, status),
        seeds(draw, seed),
        player_entry_mapping(
          rank,
          countries(*),
          players(id, first_name, last_name, full_name)
        )
      )
    `
      )
      .eq("id", matchId.value)
      .single()

    if (error || !data) {
      console.error("Error fetching match:", error)
      return null
    }

    const { rounds, people, scores_by_teams, match_stats, team1, team2, ...rest } = data

    const surfaces = rounds.events.event_surface_mapping.map(s => s.surfaces)

    return {
      ...rest,
      umpire: people,
      scores: scores_by_teams,
      round: rounds.round,
      surface: surfaces.length === 1 ? surfaces[0] : surfaces,
      category: rounds.events.category || rounds.events.editions?.category,
      start_date: rounds.events.start_date || rounds.events.editions?.start_date,
      end_date: rounds.events.end_date || rounds.events.editions?.end_date,
      level: rounds.events.level,
      sponsor_name: rounds.events.sponsor_name || rounds.events.editions?.sponsor_name,
      tournament: rounds.events.editions?.tournaments?.name,
      stats: match_stats,
      team1: {
        // @ts-expect-error
        id: data.team1.id,
        // @ts-expect-error
        status: data.team1.entry_status.find(s => s.draw === data.draw)?.status,
        // @ts-expect-error
        seed: data.team1.seeds.find(s => s.draw === data.draw)?.seed,
        // @ts-expect-error
        team: data.team1.player_entry_mapping.map(pem => ({
          id: pem.players.id,
          first_name: pem.players.first_name,
          last_name: pem.players.last_name,
          full_name: pem.players.full_name,
          country: pem.countries,
          rank: pem.rank
        }))
      },
      team2: {
        // @ts-expect-error
        id: data.team2.id,
        // @ts-expect-error
        status: data.team2.entry_status.find(s => s.draw === data.draw)?.status,
        // @ts-expect-error
        seed: data.team2.seeds.find(s => s.draw === data.draw)?.seed,
        // @ts-expect-error
        team: data.team2.player_entry_mapping.map(pem => ({
          id: pem.players.id,
          first_name: pem.players.first_name,
          last_name: pem.players.last_name,
          full_name: pem.players.full_name,
          country: pem.countries,
          rank: pem.rank
        }))
      }
    } as MatchInterface
  },
  { watch: [matchId] }
)

const teamNames = computed(() => {
  if (match.value) {
    return {
      team1: match.value.team1.team.map(p => p.full_name).join(" / "),
      team2: match.value.team2.team.map(p => p.full_name).join(" / ")
    }
  }
})

useHead({
  title: () =>
    teamNames.value ? `${teamNames.value.team1} v ${teamNames.value.team2}` : `${params.tour} ${params.draw} ${params.match_type} ${params.match_id}`,
  templateParams: {
    category: `${match.value?.tournament || startCase(params.name)} ${params.year}`
  }
})

const breadcrumbs = computed<BreadcrumbItem[]>(
  () =>
    [
      { icon: ICONS.trophy, to: { name: "tournaments" }, label: "Tournaments" },
      { label: match.value?.tournament || startCase(params.name), to: { name: "tournament", params: { id: params.id, name: params.name } } },
      { label: params.year as string, to: { name: "edition", params: { id: params.id, name: params.name, year: params.year, edId: params.edId } } },
      ...(match.value ?
        [{ label: match.value.tour }, { label: match.value.match_type }, { label: match.value.draw }, { label: match.value.round }]
      : [])
    ] as BreadcrumbItem[]
)
</script>

<template>
  <u-container>
    <u-page>
      <u-page-header>
        <template #headline>
          <u-breadcrumb :items="breadcrumbs" />
        </template>

        <template #title>
          <div v-if="teamNames">{{ teamNames.team1 }} v {{ teamNames.team2 }}</div>

          <div v-else>{{ startCase(params.name) }} {{ params.tour }} {{ params.match_type }} {{ params.draw }}</div>
        </template>
      </u-page-header>

      <u-page-body>
        <div class="flex justify-end">
          <u-button
            v-if="match"
            :icon="ICONS.h2h"
            label="H2H"
            :to="{
              name: 'head-to-head',
              params: {
                t1_name: match.team1.team.map(player => kebabCase(player.full_name || '—')).join('+'),
                t2_name: match.team2.team.map(player => kebabCase(player.full_name || '—')).join('+'),
                t1_id: match.team1.team.map(player => player.id).join('+'),
                t2_id: match.team2.team.map(player => player.id).join('+')
              }
            }"
          />
        </div>

        <template v-if="match">
          <match-details :match />

          <match-table
            :match
            :pending
          />
        </template>

        <u-empty
          v-else
          title="No match stats available"
          description="If you think this is an error, refresh the page. Otherwise, please be patient as we continue to add more data."
          class="mx-2"
        >
          <template #actions>
            <u-button
              label="Refresh"
              :icon="icons.reload"
              @click="refresh()"
            />
          </template>
        </u-empty>
      </u-page-body>
    </u-page>
  </u-container>
</template>
