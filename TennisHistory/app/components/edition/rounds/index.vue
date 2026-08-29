<script setup lang="ts">
import { ICONS, TourEnum } from "#imports"
import type { TableColumn } from "@nuxt/ui"
import { LazyEditionRoundsCreate, UButton, UFieldGroup } from "#components"
import { useArrayUnique } from "@vueuse/core"

const route = useRoute("edition")
const toast = useToast()
const supabase = useSupabaseClient()
const { ui } = useAppConfig()

const { isAdmin } = useAuthState()
const tournamentStore = useTournamentStore()

const { data: createOptions } = await useAsyncData(
  () => `rounds-currency-${tournamentStore.ids.id || ""}`,
  async () => {
    if (tournamentStore.ids.id) {
      const { data, error } = await supabase
        .schema("tennis")
        .from("events")
        .select("id, tour, currency, edition:editions(currency)")
        .eq("edition_id", tournamentStore.ids.id as string)

      if (error || !data) {
        console.error("Error fetching options", error)
        return []
      }

      return data
        .map(event => ({ event_id: event.id, tour: event.tour, currency: event.currency || event.edition!.currency }))
        .filter(o => o.currency && o.tour) as Array<{ event_id: string; tour: TourEnum; currency: string }>
    }

    return []
  },
  { default: () => [] }
)

const {
  data: rounds,
  pending,
  refresh
} = useAsyncData(
  () => `rounds-${tournamentStore.ids.id || ""}`,
  async () => {
    if (tournamentStore.ids.id) {
      const { data, error } = await fetchRounds(supabase, tournamentStore.ids.id as string)

      if (error || !data) {
        console.error("Error fetching rounds", error)
        return []
      }

      return data
    }

    return []
  },
  { default: () => [] }
)

const columns: Array<TableColumn<RoundsQuery>> = [
  { id: "checkbox" },
  { accessorKey: "tour" },
  { accessorKey: "match_type" },
  { accessorKey: "number" },
  { accessorKey: "pm" },
  {
    accessorKey: "points",
    footer: () => {
      if (isAdmin.value) {
        return h(UFieldGroup, {}, () => [
          h(UButton, { icon: ui.icons.reload, onClick: () => refresh() }),
          ...(createOptions.value.length ?
            [
              h(LazyEditionRoundsCreate, {
                hydrateOnIdle: true,
                onRefresh: refresh,
                options: createOptions.value
              })
            ]
          : [])
        ])
      }
    }
  }
]
</script>

<template>
  <u-table
    :data="rounds"
    :columns
    :loading="pending"
    sticky
    render-fallback-value="—"
    :meta="{
      class: {
        tr: row => (row.original.draw === 'Qualifying' ? 'bg-elevated dark:bg-muted/50' : '')
      }
    }"
  >
    <template #loading>
      <loading-icon />
    </template>

    <template #empty>
      <empty
        :icon="ICONS.moneyOff"
        :title="`No round information available for ${tournamentStore.name} ${route.params.year}`"
        @refresh="refresh"
        class="mx-2"
      />
    </template>

    <template #number-cell="{ row }">
      {{ row.original.round }}
    </template>
  </u-table>
</template>
