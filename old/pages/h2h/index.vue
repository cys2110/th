<script setup lang="ts">
import { PlayerLink } from "#components"
import type { TableColumn, TableRow } from "@nuxt/ui"

useHead({ title: "H2H" })
const {
  ui: { icons: uIcons }
} = useAppConfig()

interface APIResponse {
  p1: PlayerInterface
  p2: PlayerInterface
  p1Wins: number
  p2Wins: number
}

// API call
const { data, status } = await useFetch<APIResponse[]>("/api/h2h", {
  key: "h2h",
  default: () => [],
  server: false
})

const columns: TableColumn<APIResponse>[] = [
  {
    id: "p1",
    header: "Player 1",
    cell: ({ row }) =>
      h(PlayerLink, { player: row.original.p1, centred: true, class: row.original.p1Wins > row.original.p2Wins ? "font-semibold" : "" })
  },
  {
    id: "wl",
    header: "",
    cell: ({ row }) =>
      h("div", { class: "text-center" }, [
        h("span", { class: row.original.p1Wins > row.original.p2Wins ? "font-semibold" : "" }, row.original.p1Wins),
        h("span", " - "),
        h("span", { class: row.original.p2Wins > row.original.p1Wins ? "font-semibold" : "" }, row.original.p2Wins)
      ])
  },
  {
    id: "p2",
    header: "Player 2",
    cell: ({ row }) =>
      h(PlayerLink, { player: row.original.p2, centred: true, class: row.original.p1Wins < row.original.p2Wins ? "font-semibold" : "" })
  }
]

const handleSelectRow = async (row: TableRow<APIResponse>) => {
  await navigateTo({
    name: "head-to-head",
    params: {
      p1Id: row.original.p1.id,
      p2Id: row.original.p2.id,
      p1Name: kebabCase(`${row.original.p1.first_name}-${row.original.p1.last_name}`),
      p2Name: kebabCase(`${row.original.p2.first_name}-${row.original.p2.last_name}`)
    }
  })
}
</script>

<template>
  <div class="w-full">
    <u-dashboard-panel>
      <template #header>
        <u-dashboard-navbar>
          <template #title>
            <page-title />
          </template>
        </u-dashboard-navbar>
      </template>

      <template #body>
        <u-table
          :data="data"
          :columns
          :loading="['idle', 'pending'].includes(status)"
          sticky
          @select="handleSelectRow"
          :ui="{ root: 'w-fit min-w-1/3 mx-auto', tbody: '[&>tr]:cursor-pointer' }"
        >
          <template #loading>
            <table-loading-icon />
          </template>

          <template #empty>
            <table-empty-message message="No head to head records found." />
          </template>
        </u-table>
      </template>
    </u-dashboard-panel>
  </div>
</template>
