<script setup lang="ts">
import { UButton, UFieldGroup } from "#components"
import type { TableColumn } from "@nuxt/ui"

interface LaverTeam {
  team_name: string
  players: Array<
    Required<BasePlayerType> & {
      rank: number | null
      doubles_rank: number | null
      withdrawn: boolean
      mapping_id: string
    }
  >
}

const {
  params: { edId, year }
} = useRoute("edition")

const {
  ui: { icons }
} = useAppConfig()

const supabase = useSupabaseClient()

const { isAdmin } = useAuthState()
const tournamentStore = useTournamentStore()

const updatedMappings = ref<Record<string, { singles: number | null; doubles: number | null }>>({})
const isSaving = ref(false)

const key = computed(() => `${edId}-teams`)

const {
  data: entries,
  pending,
  refresh
} = await useAsyncData<Array<LaverTeam>>(
  key,
  async () => {
    const { data, error } = await supabase
      .from("entries")
      .select("team_name, player_entry_mapping(*, countries(*), players(id, first_name, last_name, full_name)), events!inner(edition_id)")
      .not("team_name", "is", null)
      .eq("events.edition_id", Number(edId))
      .order("team_name", { ascending: true })

    if (error || !data) {
      console.error("Error fetching entries:", error)
      return []
    }

    const { data: withdrawals, error: withdrawalsError } = await supabase
      .from("withdrawals")
      .select("events!inner(edition_id), entries(player_entry_mapping(player_id))")
      .eq("events.edition_id", Number(edId))

    if (withdrawalsError) {
      console.error("Error fetching withdrawals:", withdrawalsError)
    }

    return data.map(
      entry =>
        ({
          team_name: entry.team_name,
          players: entry.player_entry_mapping.map(entry => ({
            mapping_id: entry.id,
            id: entry.players.id,
            full_name: entry.players.full_name,
            country: entry.countries,
            withdrawn: !!withdrawals?.find(withdrawal => withdrawal.entries.player_entry_mapping.find(pem => pem.player_id === entry.players.id)),
            rank: entry.rank,
            doubles_rank: entry.doubles_rank
          }))
        }) as LaverTeam
    )
  },
  { default: () => [] }
)

const columns: Array<TableColumn<LaverTeam["players"][number]>> = [
  {
    id: "checkbox",
    footer: () =>
      h(UFieldGroup, { class: "w-fit mx-auto" }, () => [
        h(UButton, { icon: icons.reload, onClick: () => refresh() }),
        h(UButton, {
          icon: ICONS.save,
          loadingIcon: ICONS.uploading,
          onClick: handleSave,
          disabled: !Object.keys(updatedMappings.value).length || isSaving.value,
          loading: isSaving.value
        })
      ])
  },
  { accessorKey: "full_name", header: "Player" },
  { accessorKey: "rank", header: "Singles Rank" },
  { accessorKey: "doubles_rank", header: "Doubles Rank" }
]

const columnVisibility = computed(() => ({
  checkbox: isAdmin.value
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
      :key="entry.team_name"
      :title="entry.team_name"
      highlight
      :icon="entry.team_name === 'Europe' ? ICONS.europe : ICONS.globe"
      :ui="{ body: 'w-full' }"
    >
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
              :message="`No players played for ${entry.team_name}.`"
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
                :model-value="entry.players.every(player => player.mapping_id in updatedMappings)"
                @update:model-value="
                  () => {
                    if (entry.players.every(player => player.mapping_id in updatedMappings)) {
                      entry.players.forEach(player => delete updatedMappings[player.mapping_id])
                    } else {
                      entry.players.forEach(player => (updatedMappings[player.mapping_id] = { singles: player.rank, doubles: player.doubles_rank }))
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
                :model-value="row.original.mapping_id in updatedMappings"
                @update:model-value="
                  () => {
                    if (row.original.mapping_id in updatedMappings) {
                      delete updatedMappings[row.original.mapping_id]
                    } else {
                      updatedMappings[row.original.mapping_id] = { singles: row.original.rank, doubles: row.original.doubles_rank }
                    }
                  }
                "
                :icon="ICONS.racquet"
              />
            </div>
          </template>

          <template #full_name-cell="{ row }">
            <u-link
              :to="{ name: 'player', params: { id: row.original.id, name: kebabCase(row.original.full_name || '—') } }"
              class="hover-link primary-link"
              :class="{ 'line-through': row.original.withdrawn }"
            >
              {{ row.original.full_name }}
            </u-link>
          </template>

          <template #rank-cell="{ row }">
            <form-input-number
              v-if="row.original.mapping_id in updatedMappings"
              placeholder="Singles"
              v-model="updatedMappings[row.original.mapping_id]!.singles"
            />

            <template v-else>{{ row.original.rank?.toLocaleString() ?? "—" }}</template>
          </template>

          <template #doubles_rank-cell="{ row }">
            <form-input-number
              v-if="row.original.mapping_id in updatedMappings"
              placeholder="Doubles"
              v-model="updatedMappings[row.original.mapping_id]!.doubles"
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
    :message="`No teams entered ${tournamentStore.name} ${year}.`"
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
