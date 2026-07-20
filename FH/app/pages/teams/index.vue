<script setup lang="ts">
import { ICONS } from "#imports"
import type { TableColumn, TableRow } from "@nuxt/ui"
import type { QueryData } from "@supabase/supabase-js"
import { kebabCase } from "lodash"

useHead({ title: "Teams" })

const supabase = useSupabaseClient()
const router = useRouter()

const teamsQuery = () => supabase.from("team").select("*, national_association(id, name), country(*)").order("name", { ascending: true })

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
  { accessorKey: "national_association.name", header: "Federation" },
  { id: "type", accessorFn: row => TEAM_TYPE_MAPPING[row.type], header: "Team Type" }
]

const handleSelectRow = (_e: Event, row: TableRow<Team>) => {
  const { id, name } = row.original

  router.push({
    name: "team",
    params: { id, name: kebabCase(name) }
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
              :name="row.original.name"
              :avatar="{ src: row.original.logo_url || '', loading: 'lazy', icon: ICONS.team }"
            />
          </template>

          <template #national_association_name-cell="{ row }">
            <u-link
              :to="{
                name: 'federation',
                params: { id: row.original.national_association!.id, name: kebabCase(row.original.national_association!.name) }
              }"
              class="hover-link primary-link"
            >
              {{ row.original.national_association?.name }}
            </u-link>
          </template>
        </u-table>
      </u-page-body>
    </u-page>
  </u-container>
</template>
