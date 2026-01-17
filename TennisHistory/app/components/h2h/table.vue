<script setup lang="ts">
import type { TableRow } from "@nuxt/ui"

useHead({ title: "Head to Head" })
const router = useRouter()

// API call
const { data, status, error } = await useFetch("/api/h2h", {
  default: () => ({ atpPlayers: [], atpResults: [], wtaPlayers: [], wtaResults: [] })
})

watch(
  error,
  () => {
    if (error.value) {
      if (error.value.statusMessage === "Validation errors") {
        console.error(error.value.statusMessage, error.value.data?.data.validationErrors)
      } else {
        console.error(error.value)
      }
    }
  },
  { immediate: true }
)

const handleSelect = (e: Event, row: TableRow<H2HBaseType>, tour: string) => {
  let player

  if (tour === "ATP") {
    player = data.value.atpPlayers.find(p => p.id === row.original.player)
  } else {
    player = data.value.wtaPlayers.find(p => p.id === row.original.player)
  }

  router.push({
    name: "player",
    params: {
      id: player!.id,
      name: kebabCase(`${player!.first_name} ${player!.last_name}`)
    }
  })
}
</script>

<template>
  <u-page-header title="Head to Head" />

  <u-page-body>
    <dashboard-subpanel title="ATP">
      <u-table
        :data="data.atpResults"
        :columns="h2hColumns(data.atpPlayers)"
        :loading="status === 'pending'"
        @select="(e, row) => handleSelect(e, row, 'ATP')"
      >
        <template #loading>
          <loading-icon />
        </template>

        <template #empty>
          <empty
            message="No ATP head to heads available."
            :icon="ICONS.h2hOff"
          />
        </template>
      </u-table>
    </dashboard-subpanel>

    <dashboard-subpanel title="WTA">
      <u-table
        :data="data.wtaResults"
        :columns="h2hColumns(data.wtaPlayers)"
        :loading="status === 'pending'"
        @select="(e, row) => handleSelect(e, row, 'WTA')"
      >
        <template #loading>
          <loading-icon />
        </template>

        <template #empty>
          <empty
            message="No WTA head to heads available."
            :icon="ICONS.h2hOff"
          />
        </template>
      </u-table>
    </dashboard-subpanel>
  </u-page-body>
</template>
