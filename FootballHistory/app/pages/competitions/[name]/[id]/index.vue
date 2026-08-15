<script setup lang="ts">
import { COMPETITION_CATEGORY_MAPPING, COMPETITION_TYPE_MAPPING, formatDate } from "#imports"
import type { BreadcrumbItem, TableColumn, TableRow } from "@nuxt/ui"
import { kebabCase, startCase } from "lodash"
import { type QueryData } from "@supabase/supabase-js"

definePageMeta({ name: "competition" })

const route = useRoute("competition")
const router = useRouter()
const supabase = useSupabaseClient()

const competitionQuery = () =>
  supabase.from("competition").select("*, federation(*), confederation(*), seasons:season(*)").eq("code", route.params.id).single()

type CompetitionType = QueryData<ReturnType<typeof competitionQuery>>

const {
  data: competition,
  pending,
  refresh
} = await useAsyncData(
  () => `competition-${route.params.id}`,
  async () => {
    const { data, error } = await competitionQuery()

    if (error || !data) {
      console.error("Error fetching competition:", error)
      return null
    }

    return data
  }
)

useHead({
  title: () => competition.value?.name || startCase(route.params.name as string),
  templateParams: { category: "Competitions" }
})

const breadcrumbs: Array<BreadcrumbItem> = [
  {
    label: "Competitions",
    to: { name: "competitions" }
  }
]

const columns: Array<TableColumn<CompetitionType["seasons"][number]>> = [
  { accessorKey: "name", header: "Season" },
  { accessorKey: "start_date", header: "Dates" }
]

const handleSelectRow = (_e: Event, row: TableRow<CompetitionType["seasons"][number]>) => {
  router.push({
    name: "season",
    params: { ...route.params, season: encodeURIComponent(row.original.name) }
  })
}
</script>

<template>
  <u-container>
    <u-page>
      <u-page-header :title="competition?.name || startCase(route.params.name as string)">
        <template #headline>
          <u-breadcrumb :items="breadcrumbs" />
        </template>

        <template
          #description
          v-if="competition"
        >
          <div v-if="competition.fifa_governed">FIFA</div>

          <u-link
            v-else
            :to="{
              name: 'federation',
              params: {
                id: competition.federation_id || competition.confederation_id!,
                name: kebabCase(competition.federation?.name || competition.confederation!.name)
              }
            }"
            class="hover-link primary-link"
          >
            {{ competition.federation?.name || competition.confederation!.name }}
          </u-link>
        </template>

        <template #links>
          <div
            v-if="competition"
            class="space-x-2"
          >
            <u-badge :label="COMPETITION_CATEGORY_MAPPING[competition.category]" />

            <u-badge
              :label="COMPETITION_TYPE_MAPPING[competition.type]"
              color="secondary"
            />

            <u-badge
              v-if="competition.division_level"
              :label="competition.division_level"
            />
          </div>
          <dev-only>
            <lazy-season-create
              hydrate-on-idle
              @refresh="refresh"
            />
          </dev-only>
        </template>
      </u-page-header>

      <u-page-body>
        <u-table
          :data="competition?.seasons || []"
          :columns
          :loading="pending"
          sticky
          @select="handleSelectRow"
          class="max-w-1/2 mx-auto"
        >
          <template #loading>
            <loading-icon />
          </template>

          <template #empty>
            <empty
              title="No seasons played"
              class="mx-2"
            />
          </template>

          <template #start_date-cell="{ row }">
            {{ formatDate(row.original.start_date, row.original.end_date) }}
          </template>
        </u-table>
      </u-page-body>
    </u-page>
  </u-container>
</template>
