<script setup lang="ts">
import type { BreadcrumbItem, DropdownMenuItem, PageLink } from "@nuxt/ui"

definePageMeta({ name: "match" })

const {
  ui: { icons }
} = useAppConfig()

const {
  params: { id, edId, year, name, mid }
} = useRoute("match")

const supabase = useSupabaseClient()

const categories: Record<string, string> = {
  "Service Stats": "text-Active",
  "Return Stats": "text-Inactive",
  "Points Stats": "text-ITF",
  "Service Speed": "text-Challenger"
}

const { data: match, pending } = await useAsyncData<MatchInterface | null>("match", async () => {
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
      umpire:people(id, first_name, last_name),
      match_scores(*),
      match_stats(*),
      team1:team_1_id(
        id,
        entry_status(draw, status),
        seeds(draw, seed),
        player_entry_mapping(
          rank,
          countries(*),
          players(id, first_name, last_name)
        )
      ),
      team2:team_2_id(
        id,
        entry_status(draw, status),
        seeds(draw, seed),
        player_entry_mapping(
          rank,
          countries(*),
          players(id, first_name, last_name)
        )
      )
    `
    )
    .eq("id", mid)
    .single()

  if (error || !data) {
    console.error("Error fetching match:", error)
    return null
  }

  return {
    court: data.court,
    date: data.date,
    duration: data.duration,
    tour: data.tour,
    match_type: data.match_type,
    draw: data.draw,
    format: data.format,
    incomplete: data.incomplete,
    umpire: data.umpire,
    round: data.rounds.round,
    group_name: data.group_name,
    surfaces: data.rounds.events.event_surface_mapping.map(s => s.surfaces),
    category: data.rounds.events.category || data.rounds.events.editions?.category,
    start_date: data.rounds.events.start_date || data.rounds.events.editions?.start_date,
    end_date: data.rounds.events.end_date || data.rounds.events.editions?.end_date,
    level: data.rounds.events.level,
    sponsor_name: data.rounds.events.sponsor_name || data.rounds.events.editions?.sponsor_name,
    tournament: data.rounds.events.editions?.tournaments?.name,
    winner_id: data.winner_id,
    scores: data.match_scores,
    stats: data.match_stats,
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
        country: pem.countries,
        rank: pem.rank
      }))
    },
    team2: {
      // @ts-expect-error
      id: data.team2.id,
      // @ts-expect-error
      status: data.team1.entry_status.find(s => s.draw === data.draw)?.status,
      // @ts-expect-error
      seed: data.team2.seeds.find(s => s.draw === data.draw)?.seed,
      // @ts-expect-error
      team: data.team2.player_entry_mapping.map(pem => ({
        id: pem.players.id,
        first_name: pem.players.first_name,
        last_name: pem.players.last_name,
        country: pem.countries,
        rank: pem.rank
      }))
    }
  } as MatchInterface
})

const teamNames = computed(() => {
  if (match.value) {
    return {
      team1: match.value.team1.team.map(p => `${p.first_name} ${p.last_name}`).join(" / "),
      team2: match.value.team2.team.map(p => `${p.first_name} ${p.last_name}`).join(" / ")
    }
  }
})

useHead({
  title: () => (teamNames.value ? `${teamNames.value.team1} v ${teamNames.value.team2}` : mid),
  templateParams: {
    category: `${match.value?.tournament || startCase(name)} ${year}`
  }
})

const additionalLinks = computed<PageLink[]>(() => {
  if (match.value) {
    const { team1, team2 } = match.value
    const t1Links = team1.team.map(p => ({
      label: `${p.first_name} ${p.last_name}`,
      icon: ICONS.player,
      to: { name: "player", params: { id: p.id, name: kebabCase(`${p.first_name} ${p.last_name}`) } }
    }))
    const t2Links = team2.team.map(p => ({
      label: `${p.first_name} ${p.last_name}`,
      icon: ICONS.player,
      to: { name: "player", params: { id: p.id, name: kebabCase(`${p.first_name} ${p.last_name}`) } }
    }))
    const h2hLink = [
      {
        label: "H2H",
        icon: ICONS.h2h,
        to: {
          name: "h2h-players",
          params: {
            t1Name: team1.team.map(player => kebabCase(`${player.first_name} ${player.last_name}`)).join("+"),
            t2Name: team2.team.map(player => kebabCase(`${player.first_name} ${player.last_name}`)).join("+"),
            t1Id: team1.team.map(player => player.id).join("+"),
            t2Id: team2.team.map(player => player.id).join("+")
          }
        }
      }
    ]
    return [...t1Links!, ...t2Links!, ...h2hLink] as PageLink[]
  }

  return []
})

const breadcrumbs = computed<BreadcrumbItem[]>(
  () =>
    [
      { icon: ICONS.trophy, to: { name: "tournaments" }, label: "Tournaments" },
      { label: match.value?.tournament || startCase(name), to: { name: "tournament", params: { id, name } } },
      { label: year as string, to: { name: "edition", params: { id, name, year, edId } } },
      ...(match.value ? [{ label: match.value.match_type }, { label: match.value.draw }, { label: match.value.round }] : [])
    ] as BreadcrumbItem[]
)
</script>

<template>
  <u-container>
    <u-page>
      <template #left>
        <u-page-aside>
          <u-page-links :links="additionalLinks" />

          <u-separator />

          <div
            v-for="(className, category) in categories"
            :key="category"
            class="flex items-center gap-2 text-muted"
          >
            <u-icon
              :name="ICONS.colour"
              :class="className"
            />
            <span>{{ category }}</span>
          </div>
        </u-page-aside>
      </template>

      <u-page-header>
        <template #headline>
          <u-breadcrumb :items="breadcrumbs" />
        </template>

        <template #title>
          <div v-if="teamNames">
            {{ teamNames.team1 }} v
            {{ teamNames.team2 }}
          </div>

          <div v-else> {{ mid }} </div>
        </template>

        <template #links>
          <u-dropdown-menu
            class="lg:hidden"
            :items="<Array<DropdownMenuItem>>additionalLinks"
          >
            <u-button :icon="icons.info" />
          </u-dropdown-menu>
        </template>
      </u-page-header>

      <u-page-body>
        <empty
          v-if="!match"
          message="No match details available"
        />

        <match-details
          v-else
          :match
        />

        <match-table
          :match
          :pending
        />
      </u-page-body>
    </u-page>
  </u-container>
</template>
