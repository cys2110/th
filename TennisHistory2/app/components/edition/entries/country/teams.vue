<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui"

const props = defineProps<{
  refresh: number
}>()

const {
  params: { edId, year }
} = useRoute("edition")

const supabase = useSupabaseClient()

const tournamentStore = useTournamentStore()

watch(
  () => props.refresh,
  () => {
    refresh()
  }
)

const {
  data: entries,
  pending,
  refresh
} = await useAsyncData(
  "country-entries",
  async () => {
    const { data, error } = await supabase
      .from("entries")
      .select(
        `
      id,
      events!inner(edition_id),
      countries(*),
      seeds(seed),
      player_entry_mapping(
        rank,
        doubles_rank,
        players(
          id,
          first_name,
          last_name
        )
      )
    `
      )
      .eq("events.edition_id", Number(edId))
      .not("country_id", "is", null)

    if (error || !data) {
      console.error("Error fetching edition country entries:", error)
      return []
    }

    return data.map(entry => ({
      id: entry.id,
      seed: entry.seeds[0]?.seed,
      country: entry.countries,
      players: entry.player_entry_mapping.map(player => ({
        rank: player.rank,
        doubles_rank: player.doubles_rank,
        id: player.players.id,
        first_name: player.players.first_name,
        last_name: player.players.last_name
      }))
    }))
  },
  { default: () => [] }
)

const columns: Array<TableColumn<Omit<BasePlayerType, "country"> & { rank: number | null; doubles_rank: number | null }>> = [
  { id: "player", accessorFn: row => `${row.first_name} ${row.last_name}`, header: "Player" },
  { accessorKey: "rank", header: "Singles Rank", cell: ({ cell }) => cell.renderValue() },
  { accessorKey: "doubles_rank", header: "Doubles Rank", cell: ({ cell }) => cell.renderValue() }
]
</script>

<template>
  <u-page-grid
    v-if="entries.length || pending"
    class="lg:grid-cols-2"
  >
    <u-page-card
      v-if="entries.length"
      v-for="entry in entries"
      :key="entry.id"
      :title="entry.country?.name"
      highlight
      :ui="{ leading: 'flex w-full justify-between items-center', body: 'w-full' }"
    >
      <template #leading>
        <u-icon :name="getFlagCode(entry.country!)" />

        <u-badge
          v-if="entry.seed"
          :label="entry.seed"
          color="success"
        />
      </template>

      <template #description>
        <u-table
          :data="entry.players"
          :columns
          sticky
          :loading="pending"
          render-fallback-value="—"
        >
          <template #loading>
            <loading-icon />
          </template>

          <template #empty>
            <empty
              :message="`No players played for ${entry.country?.name}.`"
              :icon="ICONS.peopleOff"
            />
          </template>
        </u-table>
      </template>
    </u-page-card>

    <loading-card
      v-else
      v-for="_ in 6"
      :key="_"
    />
  </u-page-grid>

  <empty
    v-else
    :message="`No countries entered ${tournamentStore.name} ${year}.`"
    :icon="ICONS.globeOff"
  />
</template>
