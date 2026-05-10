<script setup lang="ts">
import { LazyEditionAwardsCreate, UButton, USelectMenu } from "#components"
import type { TableColumn } from "@nuxt/ui"
import { getFacetedRowModel, getFacetedUniqueValues, type Column } from "@tanstack/vue-table"

const {
  params: { edId, year }
} = useRoute("edition")

const {
  ui: { icons }
} = useAppConfig()

const { dev } = useRuntimeConfig().public

const toast = useToast()
const supabase = useSupabaseClient()

const tournamentStore = useTournamentStore()
const updatedAwards = ref<Record<string, any>>({})
const isSaving = ref(false)

const key = computed(() => `${edId}-awards`)

const {
  data: awards,
  pending,
  refresh
} = await useAsyncData(
  key,
  async () => {
    const { data, error } = await supabase
      .from("rounds")
      .select(
        `*,
        ...events!inner(
          currency
        )
      `
      )
      .eq("events.edition_id", Number(edId))
      .order("tour", { ascending: true })
      .order("match_type", { ascending: true })
      .order("number", { ascending: true })

    if (error || !data) {
      console.error("Error fetching awards:", error)
      return []
    }

    return data
  },
  { default: () => [] }
)

const mapping = computed(() => {
  const roundMap = new Map()

  awards.value.forEach(award => roundMap.set(award.number, award.round))

  return Object.fromEntries(roundMap)
})

const columns: Array<TableColumn<AwardInterface>> = [
  { id: "checkbox", footer: () => h(LazyEditionAwardsCreate, { hydrateOnIdle: true, onRefresh: refresh }) },
  { accessorKey: "tour" },
  { accessorKey: "match_type" },
  { accessorKey: "number", filterFn: numberFilter },
  { accessorKey: "pm", header: "Prize Money", ...(dev && { footer: () => h(UButton, { icon: icons.reload, onClick: () => refresh() }) }) },
  {
    accessorKey: "points",
    header: "Points",
    ...(dev && {
      footer: () =>
        h(UButton, {
          icon: isSaving.value ? ICONS.uploading : ICONS.save,
          disabled: !Object.keys(updatedAwards.value).length || isSaving.value,
          onClick: handleSubmit
        })
    })
  }
]

const columnVisibility = computed(() => ({
  checkbox: dev,
  tour: tournamentStore.tours.length > 1
}))

const handleSubmit = async () => {
  set(isSaving, true)

  const errors: Record<string, any> = {}
  for (const [id, award] of Object.entries(updatedAwards.value)) {
    const { error } = await supabase.from("rounds").update({ pm: award.pm, points: award.points }).eq("id", id)

    if (error) errors[id] = error
  }

  if (Object.keys(errors).length) {
    console.log(errors)

    toast.add({
      title: "Error updating rounds",
      description: `${Object.keys(updatedAwards).length - errors.length} successfully updated. ${errors.length} failed.`,
      icon: icons.error,
      color: "error"
    })
  } else {
    toast.add({
      title: "Rounds successfully updated",
      icon: icons.success,
      color: "success"
    })
  }

  refresh()
  set(updatedAwards, {})
  set(isSaving, false)
}
</script>

<template>
  <div class="flex justify-end mb-4">
    <edition-awards-chart
      :awards
      :pending
    />
  </div>

  <u-table
    :data="awards"
    :columns
    :loading="pending"
    sticky
    render-fallback-value="—"
    :faceted-options="{
      getFacetedRowModel: getFacetedRowModel(),
      getFacetedUniqueValues: getFacetedUniqueValues()
    }"
    v-model:column-visibility="columnVisibility"
    :meta="{
      class: {
        tr: row => (row.original.draw === 'Qualifying' ? 'bg-elevated dark:bg-muted/50' : '')
      }
    }"
    :ui="{ root: 'xl:max-w-3/4 2xl:max-w-2/3 mx-auto max-h-[calc(100vh-25rem)]' }"
  >
    <template #loading>
      <u-icon
        :name="icons.loading"
        class="size-8"
      />
    </template>

    <template #empty>
      <u-empty
        :icon="ICONS.moneyOff"
        :title="`No rounds available for ${tournamentStore.name} ${year}`"
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

    <template #checkbox-header="{ table }">
      <div class="mx-auto w-fit">
        <u-checkbox
          :model-value="
            Object.keys(updatedAwards).length === table.getFilteredRowModel().rows.length ? true
            : Object.keys(updatedAwards).length ? 'indeterminate'
            : false
          "
          @update:model-value="
            () => {
              if (Object.keys(updatedAwards).length) {
                updatedAwards = {}
              } else {
                table.getFilteredRowModel().rows.map(
                  award =>
                    (updatedAwards[award.original.id] = {
                      pm: award.original.pm,
                      points: award.original.points
                    })
                )
              }
            }
          "
          :icon="ICONS.money"
        />
      </div>
    </template>

    <template #checkbox-cell="{ row }">
      <div class="mx-auto w-fit">
        <u-checkbox
          :model-value="row.original.id in updatedAwards"
          @update:model-value="
            () => {
              if (row.original.id in updatedAwards) {
                delete updatedAwards[row.original.id]
              } else {
                updatedAwards[row.original.id] = {
                  pm: row.original.pm,
                  points: row.original.points
                }
              }
            }
          "
          :icon="ICONS.money"
        />
      </div>
    </template>

    <template #tour-header="{ column }">
      <div class="flex justify-center items-center gap-0.5">
        <table-filter-header
          :column
          label="Tour"
          :icon="ICONS.tour"
        />
        <table-sort-header :column />
      </div>
    </template>

    <template #tour-cell="{ row }">
      <u-badge
        v-if="row.original.tour"
        :label="row.original.tour"
        :color="row.original.tour"
      />
    </template>

    <template #match_type-header="{ column }">
      <div class="flex justify-center items-center gap-0.5">
        <table-filter-header
          :column
          label="S/D"
          :icon="ICONS.people"
        />
        <table-sort-header :column />
      </div>
    </template>

    <template #match_type-cell="{ row }">
      <u-badge
        v-if="row.original.match_type"
        :label="row.original.match_type"
        :color="row.original.match_type"
      />
    </template>

    <template #number-header="{ column }">
      <div class="flex justify-center items-center gap-0.5">
        <table-filter-header
          :column
          label="Round"
          :icon="ICONS.level"
          :mapping
          multiple
        />
        <table-sort-header :column />
      </div>
    </template>

    <template #number-cell="{ row }">
      {{ row.original.round }}
    </template>

    <template #pm-cell="{ row }">
      <form-input-number
        v-if="row.original.id in updatedAwards"
        v-model="updatedAwards[row.original.id].pm"
        placeholder="Prize money"
        :currency="row.original.currency || 'USD'"
        class="max-w-1/2"
      />

      <div v-else-if="row.original.pm_tiered && row.original.pm_tiered.length">
        <div
          v-for="(pm, index) in row.original.pm_tiered"
          :key="index"
        >
          {{ index + 1 }} match{{ index > 0 ? "es" : "" }} -
          {{ pm.toLocaleString("en-GB", { style: "currency", currency: row.original.currency || "USD" }) }}
        </div>
      </div>

      <template v-else>
        {{
          isDefined(row.original.pm) ? row.original.pm.toLocaleString("en-GB", { style: "currency", currency: row.original.currency || "USD" }) : "—"
        }}
      </template>
    </template>

    <template #points-cell="{ row }">
      <form-input-number
        v-if="row.original.id in updatedAwards"
        v-model="updatedAwards[row.original.id].points"
        placeholder="Points"
        class="max-w-1/2"
      />

      <template v-else-if="isDefined(row.original.points)">
        {{ row.original.points.toLocaleString() }}
      </template>
    </template>
  </u-table>
</template>
