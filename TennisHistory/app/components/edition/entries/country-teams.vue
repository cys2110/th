<script setup lang="ts">
import { UButton, UFieldGroup } from "#components"
import type { TableColumn } from "@nuxt/ui"

interface CountryTeam {
  id: string
  player_id: string
  first_name: string
  last_name: string
  rank: number | null
  doubles_rank: number | null
}

const {
  params: { edId, year }
} = useRoute("edition")

const {
  ui: { icons }
} = useAppConfig()
const { dev } = useRuntimeConfig().public

const supabase = useSupabaseClient()

const tournamentStore = useTournamentStore()

const updatedMappings = ref<Record<string, { singles: number | null; doubles: number | null }>>({})
const isSaving = ref(false)

const key = computed(() => `${edId}-teams`)

const {
  data: entries,
  pending,
  refresh
} = await useAsyncData(
  key,
  async () => {
    const { data, error } = await supabase
      .from("entries")
      .select(
        `
      id,
      countries(*),
      seeds(seed),
      player_entry_mapping(
        id,
        rank,
        doubles_rank,
        players(id, first_name, last_name)
      )
    `
      )
      .eq("event_id", `${edId}-Country`)
      .not("country_id", "is", null)

    if (error || !data) {
      console.error("Error fetching edition country entries:", error)
      return []
    }

    return data.map(entry => ({
      id: entry.id,
      seed: entry.seeds[0]?.seed,
      country: entry.countries,
      players: entry.player_entry_mapping.map(
        player =>
          ({
            id: player.id,
            rank: player.rank,
            doubles_rank: player.doubles_rank,
            player_id: player.players.id,
            first_name: player.players.first_name,
            last_name: player.players.last_name
          }) as CountryTeam
      )
    }))
  },
  { default: () => [] }
)

const columns: Array<TableColumn<CountryTeam>> = [
  {
    id: "checkbox",
    footer: () =>
      h(UFieldGroup, { class: "w-fit mx-auto" }, () => [
        h(UButton, { icon: icons.reload, onClick: () => refresh() }),
        h(UButton, {
          icon: ICONS.save,
          onClick: handleSave,
          disabled: !Object.keys(updatedMappings.value).length || isSaving.value,
          loading: isSaving.value
        })
      ])
  },
  { id: "player", accessorFn: row => `${row.first_name} ${row.last_name}`, header: "Player" },
  { accessorKey: "rank", header: "Singles Rank", cell: ({ cell }) => cell.getValue<number>()?.toLocaleString ?? cell.renderValue() },
  { accessorKey: "doubles_rank", header: "Doubles Rank", cell: ({ cell }) => cell.getValue<number>()?.toLocaleString ?? cell.renderValue() }
]

const columnVisibility = computed(() => ({
  checkbox: dev
}))

const handleSave = async () => {
  set(isSaving, true)

  for (const [id, ranks] of Object.entries(updatedMappings.value)) {
    const { error } = await supabase
      .from("player_entry_mapping")
      .update({
        rank: ranks.singles,
        doubles_rank: ranks.doubles
      })
      .eq("id", id)

    if (error) {
      console.error("Error updating player entry mapping:", error)
    }
  }

  set(updatedMappings, {})
  set(isSaving, false)
  refresh()
}
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
          v-model:column-visibility="columnVisibility"
        >
          <template #loading>
            <u-icon
              :name="icons.loading"
              class="size-8"
            />
          </template>

          <template #empty>
            <u-empty
              :icon="ICONS.peopleOff"
              :message="`No players played for ${entry.country?.name}.`"
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
          </template>

          <template #checkbox-header>
            <div class="flex justify-center">
              <u-checkbox
                :model-value="entry.players.every(player => player.id in updatedMappings)"
                @update:model-value="
                  () => {
                    if (entry.players.every(player => player.id in updatedMappings)) {
                      entry.players.forEach(player => delete updatedMappings[player.id])
                    } else {
                      entry.players.forEach(player => (updatedMappings[player.id] = { singles: player.rank, doubles: player.doubles_rank }))
                    }
                  }
                "
                :icon="ICONS.racquet"
              />
            </div>
          </template>

          <template #checkbox-cell="{ row }">
            <div class="w-fit mx-auto">
              <u-checkbox
                :model-value="row.original.id in updatedMappings"
                @update:model-value="
                  () => {
                    if (row.original.id in updatedMappings) {
                      delete updatedMappings[row.original.id]
                    } else {
                      updatedMappings[row.original.id] = { singles: row.original.rank, doubles: row.original.doubles_rank }
                    }
                  }
                "
                :icon="ICONS.racquet"
              />
            </div>
          </template>

          <template #rank-cell="{ row }">
            <form-input-number
              v-if="row.original.id in updatedMappings"
              placeholder="Singles"
              v-model="updatedMappings[row.original.id]!.singles"
            />

            <template v-else>{{ row.original.rank?.toLocaleString() ?? "—" }}</template>
          </template>

          <template #doubles_rank-cell="{ row }">
            <form-input-number
              v-if="row.original.id in updatedMappings"
              placeholder="Doubles"
              v-model="updatedMappings[row.original.id]!.doubles"
            />

            <template v-else>{{ row.original.doubles_rank?.toLocaleString() ?? "—" }}</template>
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

  <u-empty
    v-else
    :icon="ICONS.globeOff"
    :message="`No countries entered ${tournamentStore.name} ${year}.`"
    description="If you think this is an error, refresh the page. Otherwise, please be patient as we continue to add more data."
  >
    <template #actions>
      <u-button
        label="Refresh"
        :icon="icons.reload"
        @click="refresh()"
      />
    </template>
  </u-empty>
</template>
