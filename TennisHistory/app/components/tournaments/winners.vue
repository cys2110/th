<script setup lang="ts">
import type { TableRow } from "@nuxt/ui"

defineProps<{
  tournament: TournamentType
  editions: Array<BaseEditionType>
  status: "idle" | "pending" | "success" | "error"
}>()
const viewMode = defineModel<boolean>("viewMode")

const {
  params: { id, name }
} = useRoute("tournament")
const router = useRouter()

const [defineEmptyTemplate, reuseEmptyTemplate] = createReusableTemplate()

const table = useTemplateRef("table")
defineExpose({ table })
const columnPinning = ref({
  left: ["year"],
  right: []
})
const handleSelect = (e: Event, row: TableRow<BaseEditionType>) => {
  router.push({
    name: "edition",
    params: {
      name,
      id,
      year: row.original.year,
      edId: row.original.id
    }
  })
}
</script>

<template>
  <!--Empty template-->
  <define-empty-template>
    <empty
      message="No editions found"
      :icon="ICONS.noEdition"
      class="mx-2"
    >
      <editions-update :tournament />
    </empty>
  </define-empty-template>

  <template v-if="viewMode">
    <u-page-columns v-if="editions.length || status === 'pending'">
      <editions-card
        v-if="editions.length"
        v-for="edition in editions"
        :key="edition.id"
        :edition
      />

      <loading-edition
        v-else
        v-for="_ in 6"
        :key="_"
      />
    </u-page-columns>

    <reuse-empty-template v-else />
  </template>

  <u-table
    v-else
    ref="table"
    :data="editions"
    :columns="editionColumns"
    :loading="status === 'pending'"
    sticky
    v-model:column-pinning="columnPinning"
    @select="handleSelect"
    render-fallback-value="—"
    :ui="{
      root: 'max-h-150',
      tbody: '[&>tr]:cursor-pointer'
    }"
  >
    <template #loading>
      <loading-icon />
    </template>
    <template #empty>
      <reuse-empty-template />
    </template>
  </u-table>
</template>
