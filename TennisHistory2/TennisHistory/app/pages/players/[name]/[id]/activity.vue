<script setup lang="ts">
import type { RouteLocationNormalized } from "vue-router"

definePageMeta({
  name: "activity",
  middleware: [
    async function (to) {
      const route = to as RouteLocationNormalized<"activity">

      const query = { ...route.query }

      // If there is no year query, fetch player's most recent activity year and set it
      if (!route.query.year) {
        const supabase = useSupabaseClient()

        const { data, error } = await supabase.from("player_list_view").select("last_tournament").eq("id", String(route.params.id)).single()

        if (error) {
          console.error("Error fetching player:", error)
        }

        if (data?.last_tournament) query.year = String(data.last_tournament)
      }

      if (!route.query.match_type) query.match_type = "Singles"

      if (!route.query.year || !route.query.match_type) {
        return navigateTo({
          name: "activity",
          params: route.params,
          query
        })
      }
    }
  ]
})

const route = useRoute("activity")
const router = useRouter()
const supabase = useSupabaseClient()

const playerStore = usePlayerStore()

const { data: options } = await useAsyncData(
  () => `${route.params.id}-options`,
  async () => {
    const { data, error } = await supabase.rpc("get_activity_options", { player_id: route.params.id })

    if (error) {
      console.error("Error fetching player activity options:", error)
      return { tournaments: [], categories: [] }
    }

    return data[0] as unknown as { tournaments: Pick<TournamentInterface, "id" | "name">[]; categories: string[] }
  },
  { default: () => ({ tournaments: [], categories: [] }) }
)

const {
  data: events,
  pending,
  refresh
} = await useAsyncData(
  () => `${route.params.id}-activity`,
  async () => {
    let query = supabase
      .from("activity")
      .select(
        `
        *,
        tournaments(name),
        events(
          event_surface_mapping(surfaces(*)),
          event_venue_mapping(venues(*, countries(*)))
        ),
        ties!matches_tie_id_fkey(
          *,
          venues(*, countries(*)),
          country1:country_1_id(countries(*)),
          country2:country_2_id(countries(*))
        )
      `
      )
      .eq("player_id", route.params.id)
      .eq("year", Number(route.query.year))
      .eq("match_type", route.query.match_type as MatchEnumType)
      .order("start_date", { ascending: false })
      .order("round_number", { ascending: true })

    if (route.query.level) query = query.eq("level", route.query.level as LevelType)

    if (route.query.category) query = query.eq("category", route.query.category as string)

    if (route.query.tournament) query = query.eq("tournament_id", Number(route.query.tournament))

    const { data, error } = await query

    if (error) {
      console.error("Error fetching player activity:", error)
      return []
    }

    const usedIds = new Set()
    const groupedEvents: Array<ActivityInterface> = []

    for (const event of data) {
      if (!usedIds.has(event.edition_id)) {
        usedIds.add(event.edition_id)

        groupedEvents.push({
          tournament_id: event.tournament_id!,
          tournament_name: event.tournaments!.name,
          edition_id: event.edition_id!,
          category: event.category,
          currency: event.currency,
          sponsor_name: event.sponsor_name,
          start_date: event.start_date!,
          end_date: event.end_date!,
          year: event.year!,
          level: event.level!,
          points: event.points,
          surface:
            event.events?.event_surface_mapping.length === 1 ?
              `${event.events.event_surface_mapping[0]!.surfaces.environment} ${event.events.event_surface_mapping[0]!.surfaces.surface}`
            : null,
          venues:
            event.ties?.venues ?
              [
                {
                  id: event.ties.venues.id,
                  name: event.ties.venues.name,
                  city: event.ties.venues.city,
                  country: event.ties.venues.countries
                }
              ]
            : (event.events!.event_venue_mapping.map(v => ({
                id: v.venues.id,
                name: v.venues.name,
                city: v.venues.city,
                country: v.venues.countries
              })) as VenueInterface[]),
          rank: event.rank,
          pm: event.pm,
          seed: event.seed,
          q_seed: event.q_seed,
          status: event.status,
          q_status: event.q_status,
          partner_id: event.partner_id,
          partner_first_name: event.partner_first_name,
          partner_last_name: event.partner_last_name,
          partner_country: event.partner_country as CountryInterface | null,
          partner_rank: event.partner_rank,
          matches: data
            .filter(m => m.edition_id === event.edition_id)
            .map(m => ({
              round: m.round!,
              draw: m.draw!,
              match_id: m.match_id!,
              format: m.format!,
              incomplete: m.incomplete,
              tie_id: m.tie_id,
              // @ts-expect-error
              tie: m.ties ? `${m.ties.country1.countries.id} v ${m.ties.country2.countries.id}` : null,
              group_name: m.group_name,
              win: m.win as boolean,
              stats: m.stats as boolean,
              opponent_id: m.opponent_id,
              opponents: m.opponent as Array<Required<BasePlayerType> & { rank: number | null }> | null,
              scores: m.scores as unknown as Array<ConsolidatedScore>
            }))
        })
      }
    }

    return groupedEvents
  },
  {
    default: () => [],
    watch: [
      () => route.query.year,
      () => route.query.level,
      () => route.query.category,
      () => route.query.match_type,
      () => route.query.surface,
      () => route.query.tournament
    ]
  }
)

const statistics = computed(() => {
  const wins = events.value.reduce(
    (acc, event) => acc + event.matches.filter(m => m.win && (!m.incomplete || !["B", "WO"].includes(m.incomplete))).length,
    0
  )
  const losses = events.value.reduce(
    (acc, event) => acc + event.matches.filter(m => !m.win && (!m.incomplete || !["B", "WO"].includes(m.incomplete))).length,
    0
  )
  const titles = events.value.reduce((acc, event) => acc + event.matches.filter(m => m.win && m.round === "Final").length, 0)

  return { wins, losses, titles }
})

const handleUpdateSelection = (key: string, value: string | null) => {
  const { [key]: _removed, ...query } = route.query

  router.push({
    name: "activity",
    params: route.params,
    query: value ? { ...query, [key]: value } : query
  })
}
</script>

<template>
  <u-container>
    <u-page>
      <player-wrapper />

      <u-page-body>
        <div class="flex justify-end gap-2">
          <u-select-menu
            placeholder="Year"
            :items="playerStore.activeYears.map(y => String(y))"
            :model-value="<string>route.query.year || undefined"
            @update:model-value="handleUpdateSelection('year', $event)"
            :icon="ICONS.years"
            highlight
          />

          <u-select-menu
            placeholder="Level"
            :items="[...LEVELS]"
            :model-value="<LevelType>route.query.level || undefined"
            @update:model-value="handleUpdateSelection('level', $event)"
            :icon="ICONS.level"
            clear
            highlight
          />

          <u-select-menu
            placeholder="Category"
            :items="options.categories"
            :model-value="<string>route.query.category || undefined"
            @update:model-value="handleUpdateSelection('category', $event)"
            :icon="ICONS.category"
            clear
            highlight
          />

          <u-select-menu
            placeholder="S/D"
            :items="[...MATCH_TYPES]"
            :model-value="<MatchEnumType>route.query.match_type || undefined"
            @update:model-value="handleUpdateSelection('match_type', $event)"
            :icon="ICONS.people"
            highlight
          />

          <u-select-menu
            placeholder="Surface"
            :items="SURFACE_OPTIONS.map(s => s.label)"
            :model-value="<string>route.query.surface || undefined"
            @update:model-value="handleUpdateSelection('surface', $event)"
            :icon="ICONS.court"
            clear
            :ui="{ content: 'w-fit' }"
            highlight
          />

          <u-select-menu
            placeholder="Tournament"
            :items="options.tournaments.map(t => ({ id: String(t.id), name: t.name }))"
            :model-value="<string>route.query.id || undefined"
            @update:model-value="handleUpdateSelection('tournament', $event)"
            :icon="ICONS.trophy"
            label-key="name"
            value-key="id"
            clear
            :ui="{ content: 'w-fit' }"
            highlight
          />
        </div>

        <u-page-list class="max-h-[70vh] overflow-y-auto p-4 space-y-4 max-w-7xl mx-auto">
          <div class="flex justify-evenly *:text-center ring ring-primary rounded-lg py-2">
            <div>
              <div class="font-semibold">{{ statistics.wins }} - {{ statistics.losses }}</div>
              <div class="text-sm font-medium">Wins - Losses</div>
            </div>
            <div>
              <div class="font-semibold">{{ statistics.titles }}</div>
              <div class="text-sm font-medium">Titles</div>
            </div>
          </div>

          <activity-card
            v-for="event in events"
            :key="event.edition_id"
            :event
          />

          <activity-loading-card
            v-if="pending"
            v-for="_ in 6"
            :key="_"
          />

          <empty
            v-if="!events.length && !pending"
            :title="`${playerStore.fullName} has not played any matches`"
            :icon="ICONS.calendarOff"
            @refresh="refresh"
          />
        </u-page-list>
      </u-page-body>
    </u-page>
  </u-container>
</template>
