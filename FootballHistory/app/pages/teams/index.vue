<script setup lang="ts">
import { ICONS } from "#imports"
import type { TableColumn, TableRow } from "@nuxt/ui"
import type { QueryData } from "@supabase/supabase-js"
import { kebabCase } from "lodash"

useHead({ title: "Teams" })

const supabase = useSupabaseClient()
const router = useRouter()

const teamsQuery = () =>
  supabase.schema("football").from("team").select("*, country(*)").order("short_name", { ascending: true }).order("name", { ascending: true })

const {
  data: teams,
  pending,
  refresh
} = await useAsyncData(
  "teams",
  async () => {
    const { data, error } = await teamsQuery()

    if (error || !data) {
      console.error("Error fetching teams:", error)
      return []
    }

    return data
  },
  { default: () => [] }
)

type Team = QueryData<ReturnType<typeof teamsQuery>>[number]

const columns: Array<TableColumn<Team>> = [
  { id: "name", accessorFn: row => row.short_name || row.name, header: "Name" },
  { accessorKey: "country.name", header: "Country" },
  { id: "type", accessorFn: row => TEAM_TYPE_MAPPING[row.type], header: "Team Type" }
]

const handleSelectRow = (_e: Event, row: TableRow<Team>) => {
  const { id, name } = row.original

  router.push({
    name: "team",
    params: { id: id, name: kebabCase(name) }
  })
}
</script>

<template>
  <u-container>
    <u-page>
      <u-page-header title="Teams">
        <template #links>
          <dev-only>
            <lazy-team-create
              hydrate-on-idle
              @refresh="refresh"
            />
          </dev-only>
        </template>
      </u-page-header>

      <u-page-body>
        <u-table
          :data="teams"
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
              title="No teams found"
              icon="fluent:people-team-delete-20-regular"
            />
          </template>

          <template #name-cell="{ row }">
            <u-user
              :name="row.original.short_name || row.original.name"
              :avatar="{
                src: row.original.logo_url || '',
                loading: 'lazy',
                icon: row.original.type === 'national_team' ? row.original.country?.icon : ICONS.team
              }"
            />
          </template>
        </u-table>
      </u-page-body>
    </u-page>
  </u-container>
</template>
