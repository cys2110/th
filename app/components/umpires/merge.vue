<script setup lang="ts">
import type { TableColumn, TableRow } from "@nuxt/ui"

const toast = useToast()
const {
  ui: { icons }
} = useAppConfig()

const { data, status, refresh } = await useFetch("/api/umpires/merge", {
  default: () => []
})

const columns: TableColumn<{ umpire1: string; umpire2: string }>[] = [
  { accessorKey: "umpire1", header: "Umpire to be Merged" },
  { accessorKey: "umpire2", header: "Umpire to Keep" }
]

const handleMerge = async (id1: string, id2: string) => {
  try {
    await $fetch("/api/merge", {
      query: { type: "Umpire", id1, id2 }
    })
    toast.add({
      title: `Nodes merged`,
      icon: icons.success,
      color: "success"
    })
  } catch (e: any) {
    toast.add({
      title: `Error merging nodes`,
      description: e,
      icon: icons.error,
      color: "error"
    })
  }
}

const handleSelect = (e: Event, row: TableRow<{ umpire1: string; umpire2: string }>) => {
  const { umpire1, umpire2 } = row.original
  handleMerge(umpire1, umpire2)
  refresh()
}
</script>

<template>
  <u-modal title="Merge Umpires">
    <u-button
      :icon="ICONS.merge"
      label="Merge Umpires"
      block
    />

    <template #body>
      <u-table
        ref="table"
        :data
        :columns
        :loading="status === 'pending'"
        sticky
        @select="handleSelect"
        render-fallback-value="—"
        :ui="{ tbody: '[&>tr]:cursor-pointer', root: 'max-h-150' }"
      >
        <template #loading>
          <u-icon
            :name="icons.loading"
            class="size-8"
          />
        </template>
        <template #empty>
          <empty
            message="No umpires to merge"
            class="mx-2"
          />
        </template>
      </u-table>
    </template>
  </u-modal>
</template>
