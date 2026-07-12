<script setup lang="ts">
import { ICONS } from "#imports"
import type { TableColumn, TableRow } from "@nuxt/ui"
import type { QueryData } from "@supabase/supabase-js"
import { kebabCase } from "lodash"

useHead({ title: "Players" })

const supabase = useSupabaseClient()
const router = useRouter()

const playersQuery = () =>
  supabase
    .from("player")
    .select("*, current_team:team(id, name), ...people!inner(*, nationality:country!nationality_country_id(*))")
    .order("people(last_name)", { ascending: true })
    .order("people(first_name)", { ascending: true })
    .order("id", { ascending: true })

const {
  data: players,
  pending,
  refresh
} = await useAsyncData(
  "players",
  async () => {
    const { data, error } = await playersQuery()

    if (error || !data) {
      console.error("Error fetching players:", error)
      return []
    }

    return data
  },
  { default: () => [] }
)

type Player = QueryData<ReturnType<typeof playersQuery>>[number]

const columns: Array<TableColumn<Player>> = [
  { accessorKey: "full_name", header: "Name" },
  { accessorKey: "nationality.name", header: "Country" },
  { accessorKey: "current_team.name", header: "Current Team" },
  { accessorKey: "current_position", header: "Current Position" }
]

const handleSelectRow = (_e: Event, row: TableRow<Player>) => {
  const { id, full_name } = row.original

  router.push({
    name: "player",
    params: { id, name: kebabCase(full_name!) }
  })
}
</script>

<template>
  <u-container>
    <u-page>
      <u-page-header title="Players">
        <template #links>
          <dev-only>
            <lazy-player-create
              hydrate-on-idle
              @refresh="refresh"
            />
          </dev-only>
        </template>
      </u-page-header>

      <u-page-body>
        <u-table
          :data="players"
          :columns
          :loading="pending"
          sticky
          @select="handleSelectRow"
        >
          <template #loading>
            <loading-icon />
          </template>

          <template #empty>
            <empty
              title="No players found"
              icon="fluent:people-team-delete-20-regular"
            />
          </template>

          <!-- <template #name-cell="{ row }">
            <u-user
              :name="row.original.name"
              :avatar="{ src: row.original.logo_url || '', loading: 'lazy', icon: ICONS.team }"
            />
          </template> -->

          <!-- <template #national_association_name-cell="{ row }">
            <u-link
              :to="{
                name: 'federation',
                params: { id: row.original.national_association!.id, name: kebabCase(row.original.national_association!.name) }
              }"
              class="hover-link primary-link"
            >
              {{ row.original.national_association?.name }}
            </u-link>
          </template> -->
        </u-table>
      </u-page-body>
    </u-page>
  </u-container>
</template>
