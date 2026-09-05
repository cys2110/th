<script setup lang="ts">
import { ICONS, TourEnum, type DrawEnum } from "#imports"
import type { TableColumn } from "@nuxt/ui"
import { createColumnHelper, type ColumnFiltersState } from "@tanstack/vue-table"
import { UBadge } from "#components"
import { isDefined } from "@vueuse/core"

const route = useRoute("edition")
const supabase = useSupabaseClient()
const { ui } = useAppConfig()
const toast = useToast()

const { isAdmin } = useAuthState()
const tournamentStore = useTournamentStore()

const columnFilters = ref<ColumnFiltersState>([])
const isSaving = ref(false)

const {
  data: entries,
  pending,
  refresh
} = await useAsyncData(
  () => `player-entries-${JSON.stringify(route.params)}`,
  async () => {
    const { data, error } = await supabase
      .schema("tennis")
      .from("entries_by_player")
      .select(
        `
        *,
        player(id, image_url, ...people(full_name)),
        country(*)
      `
      )
      .eq("tournament_id", route.params.id)
      .eq("year", Number(route.params.year))
      .eq("edition_no", Number(route.params.edition_no))

    if (error || !data) {
      console.error("Error fetching entries", error)
      return []
    }

    return data
  },
  { default: () => [] }
)
type PlayerEntryType = (typeof entries.value)[number]

const columnHelper = createColumnHelper<PlayerEntryType>()
const columns: Array<TableColumn<PlayerEntryType>> = [
  { accessorKey: "tour", header: "Tour" },
  { id: "player", header: "Player" },
  columnHelper.group({
    id: "singles",
    header: () => h(UBadge, { label: "Singles", color: "Singles", class: "w-full" }),
    columns: [
      { accessorKey: "singles_entry.rank", header: "Rank" },
      { accessorKey: "singles_entry.points", header: "Points" },
      { accessorKey: "singles_entry.pm", header: "PM" }
    ]
  }),
  columnHelper.group({
    id: "doubles",
    header: () => h(UBadge, { label: "Doubles", color: "Doubles", class: "w-full" }),
    columns: [
      { accessorKey: "doubles_entry.rank", header: "Rank" },
      { accessorKey: "doubles_entry.points", header: "Points" },
      { accessorKey: "doubles_entry.pm", header: "PM" }
    ]
  })
]

const getColumnFilter = (id: string) => columnFilters.value.find(filter => filter.id === id)?.value

const setColumnFilter = (id: string, value: unknown) => {
  columnFilters.value = [...columnFilters.value.filter(filter => filter.id !== id), ...(isDefined(value) && value !== "" ? [{ id, value }] : [])]
}

const scrapeAtpActivity = async () => {
  const tournamentId = tournamentStore.ids.mens

  if (!tournamentId) {
    toast.add({
      title: "ATP tournament ID is missing",
      icon: ui.icons.error,
      color: "error"
    })
    return
  }

  isSaving.value = true

  try {
    const result = await $fetch("/api/scrape-activity", {
      query: {
        tournament_id: tournamentId,
        year: route.params.year,
        edition_no: route.params.edition_no,
        tour: "ATP"
      }
    })

    if (!result.success) {
      console.error("Error scraping ATP activity:", result)
      toast.add({
        title: "Error scraping ATP activity",
        description:
          "errors" in result ? `${result.errors.length} player entries could not be updated`
          : "error" in result ? result.error
          : undefined,
        icon: ui.icons.error,
        color: "error"
      })
      return
    }

    toast.add({
      title: "ATP activity scraped",
      icon: ui.icons.success,
      color: "success"
    })
  } catch (error) {
    console.error("Error scraping ATP activity:", error)
    toast.add({
      title: "Error scraping ATP activity",
      icon: ui.icons.error,
      color: "error"
    })
  } finally {
    refresh()
    isSaving.value = false
  }
}
</script>

<template>
  <u-container class="my-6 space-y-6">
    <div class="flex justify-end gap-3">
      <!--Tour filter-->
      <u-select-menu
        v-if="tournamentStore.tours.length > 1"
        :items="tournamentStore.tours"
        placeholder="Tour"
        clear
        :model-value="<TourEnum>getColumnFilter('tour')"
        @update:model-value="setColumnFilter('tour', $event)"
      />

      <!--Draw filter-->
      <u-select-menu
        :items="['Main', 'Qualifying']"
        placeholder="Draw"
        clear
        :model-value="<DrawEnum>getColumnFilter('draw')"
        @update:model-value="setColumnFilter('draw', $event)"
      />

      <u-field-group v-if="isAdmin">
        <lazy-edition-entries-create
          hydrate-on-idle
          @refresh="refresh"
        />

        <u-button
          v-if="entries.length"
          label="ATP"
          :icon="ICONS.download"
          :loading="isSaving"
          :loading-icon="ICONS.downloading"
          @click="scrapeAtpActivity"
        />

        <u-button
          :icon="ui.icons.reload"
          @click="refresh()"
        />
        <!-- <u-button
          :icon="ICONS.save"
          :loading="isSaving"
          :loading-icon="ICONS.uploading"
          @click="handleSave"
        /> -->
      </u-field-group>
    </div>

    <u-table
      :data="entries"
      :columns
      :loading="pending"
      sticky
      render-fallback-value="—"
      class="max-h-[58vh]"
    >
      <template #loading>
        <loading-icon />
      </template>

      <template #empty>
        <empty
          :icon="ICONS.peopleOff"
          :title="`There are no entries for ${tournamentStore.name} ${route.params.id}`"
        />
      </template>

      <template #player-cell="{ row }">
        <player-link
          v-if="row.original.player"
          :team="[
            {
              ...row.original.player,
              country: row.original.country
            }
          ]"
        />
      </template>
    </u-table>
  </u-container>
</template>
