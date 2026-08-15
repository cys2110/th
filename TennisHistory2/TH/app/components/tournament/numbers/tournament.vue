<script setup lang="ts">
import { STATUS_MAPPING } from "#imports"

type TournamentStatsType = Pick<PlayerInterface, "id" | "first_name" | "last_name" | "full_name" | "country" | "tour"> & {
  year: number
  edition_id: number
  match_type: MatchEnumType
}
type MinRankType = TournamentStatsType & { rank: number }
type TournamentEntryInfoType = TournamentStatsType & { entry_info: StatusType }
type TournamentSeedType = {
  id: number
  year: number
  round: RoundType
  match_type: MatchEnumType
  tour: TourType
  team: Array<{
    seed: number
    players: Array<BasePlayerType>
  }>
}
interface TournamentStatsInterface {
  entry_info: Array<TournamentEntryInfoType>
  ranks: Array<MinRankType>
  seeds: Array<TournamentSeedType>
}

const route = useRoute("tournament")
const supabase = useSupabaseClient()

const tournamentStore = useTournamentStore()

const { data, pending, refresh } = await useAsyncData<TournamentStatsInterface>(
  () => `tournament-stats-${route.params.id}`,
  async () => {
    const statsData: TournamentStatsInterface = {
      entry_info: [],
      ranks: [],
      seeds: []
    }

    const { data, error } = await supabase
      .from("tournament_finalists")
      .select("player_id, edition_id, year, match_type, rank, entry_info, players(first_name, last_name, full_name, tour), countries(*)")
      .eq("tournament_id", Number(route.params.id))

    if (error || !data) {
      console.error("Error fetching tournament stats", error)
    }

    statsData.entry_info =
      data
        ?.filter(item => !!item.entry_info)
        .map(item => {
          const { player_id, rank, players, countries, ...rest } = item

          return {
            ...rest,
            ...players,
            id: player_id,
            country: countries
          } as TournamentEntryInfoType
        }) || []

    tournamentStore.tours.forEach(tour => {
      const singlesTourData = data
        ?.filter(item => item.match_type === "Singles" && item.players!.tour === tour)
        .sort((a, b) => (b.rank || 9999) - (a.rank || 9999))

      if (singlesTourData?.[0]) {
        const { player_id, rank, entry_info, players, countries, ...rest } = singlesTourData[0]

        statsData.ranks.push({
          ...rest,
          ...players,
          id: player_id!,
          country: countries!,
          rank: rank || 0
        } as MinRankType)
      }

      const doublesTourData = data
        ?.filter(item => item.match_type === "Doubles" && item.players!.tour === tour)
        .sort((a, b) => (b.rank || 9999) - (a.rank || 9999))

      if (doublesTourData?.[0]) {
        const { player_id, rank, entry_info, players, countries, ...rest } = doublesTourData[0]

        statsData.ranks.push({
          ...rest,
          ...players,
          id: player_id!,
          country: countries!,
          rank: rank || 0
        } as MinRankType)
      }
    })

    const { data: seedData, error: seedError } = await supabase.from("tournament_seed_stats").select("*").eq("tournament_id", Number(route.params.id))

    if (seedError || !seedData) {
      console.error("Error fetching tournament seed stats", seedError)
    }

    statsData.seeds = (seedData as unknown as Array<TournamentSeedType>) || []

    return statsData
  },
  { default: () => ({ entry_info: [], ranks: [], seeds: [] }) }
)
</script>

<template>
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
    <dashboard-subpanel title="Lowest ranked winners">
      <div
        v-if="data.ranks.length"
        class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-3"
      >
        <u-page-feature
          v-for="(entry, index) in data.ranks"
          :key="index"
          orientation="vertical"
          :title="`${entry.year} - ${entry.rank}`"
          :to="{ name: 'edition', params: { ...route.params, year: entry.year, edition_id: entry.edition_id } }"
          :ui="{ leading: 'mb-0.5 space-x-1' }"
        >
          <template #leading>
            <u-badge
              v-if="tournamentStore.tours.length > 1"
              :label="entry.tour"
              :color="entry.tour"
            />
            <u-badge
              :label="entry.match_type"
              :color="entry.match_type"
            />
          </template>

          <template #description>
            <player-link :players="[{ id: entry.id, full_name: entry.full_name, country: entry.country }]" />
          </template>
        </u-page-feature>
      </div>

      <empty
        v-else
        :title="`No players have won ${tournamentStore.name}`"
        @refresh="refresh"
      />
    </dashboard-subpanel>

    <dashboard-subpanel title="Qualifiers, Wild Cards, Lucky Losers, etc. Winners">
      <div
        v-if="data.entry_info.length"
        class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-3"
      >
        <u-page-feature
          v-for="(entry, index) in data.entry_info"
          :key="index"
          orientation="vertical"
          :title="`${entry.year} - ${STATUS_MAPPING[entry.entry_info]}`"
          :to="{ name: 'edition', params: { ...route.params, year: entry.year, edition_id: entry.edition_id } }"
          :ui="{ leading: 'mb-0.5 space-x-1' }"
        >
          <template #leading>
            <u-badge
              v-if="tournamentStore.tours.length > 1"
              :label="entry.tour"
              :color="entry.tour"
            />
            <u-badge
              :label="entry.match_type"
              :color="entry.match_type"
            />
          </template>

          <template #description>
            <player-link :players="[{ id: entry.id, full_name: entry.full_name, country: entry.country }]" />
          </template>
        </u-page-feature>
      </div>

      <empty
        v-else
        :title="`No qualifiers, wild cards, lucky losers, etc. have won ${tournamentStore.name}`"
        @refresh="refresh"
      />
    </dashboard-subpanel>
  </div>

  <dashboard-subpanel title="Editions Where All Top Seeds Reached Later Rounds">
    <div
      v-if="data.seeds.length"
      class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-4"
    >
      <u-page-feature
        v-for="(edition, index) in data.seeds"
        :key="index"
        orientation="vertical"
        :title="`${edition.year} - ${edition.round}`"
        :to="{ name: 'edition', params: { ...route.params, year: edition.year, edition_id: edition.id } }"
        :ui="{ leading: 'mb-0.5 space-x-1' }"
      >
        <template #leading>
          <u-badge
            v-if="tournamentStore.tours.length > 1"
            :label="edition.tour"
            :color="edition.tour"
          />
          <u-badge
            :label="edition.match_type"
            :color="edition.match_type"
          />
        </template>

        <template #description>
          <u-page-list>
            <div
              v-for="entry in edition.team"
              :key="entry.seed"
              class="flex items-center gap-1"
            >
              <span>{{ entry.seed }}. </span>
              <player-link :players="entry.players" />
            </div>
          </u-page-list>
        </template>
      </u-page-feature>
    </div>

    <empty
      v-else
      :title="`The top seeds have not all reached the later rounds of ${tournamentStore.name}`"
      @refresh="refresh"
    />
  </dashboard-subpanel>
</template>
