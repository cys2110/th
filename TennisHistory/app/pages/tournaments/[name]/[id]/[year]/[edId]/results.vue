<script setup lang="ts">
import type { TableRow } from "@nuxt/ui"
import type { GroupingOptions } from "@tanstack/vue-table"
import { getGroupedRowModel, getFacetedRowModel, getFacetedUniqueValues } from "@tanstack/vue-table"

definePageMeta({ name: "results" })

const {
  params: { id, name, year, edId }
} = useRoute("results")
const {
  ui: { icons }
} = useAppConfig()
const toast = useToast()
const { devMode } = useRuntimeConfig().public
const router = useRouter()

const viewMode = ref(true)
const updating = ref(false)

const [defineEmptyTemplate, reuseEmptyTemplate] = createReusableTemplate()

const { data, status, refresh } = await useFetch("/api/editions/results", {
  query: { edId },
  default: () => []
})

const matches = computed(() => {
  const consolidatedData = []

  const rounds = useArrayUnique(data.value.map(m => m.round))

  for (const round of rounds.value) {
    const roundMatches = data.value.filter(m => m.round === round)
    consolidatedData.push({ title: round, matches: roundMatches })
  }
  return consolidatedData
})

const updateTiebreaks = async () => {
  set(updating, true)
  try {
    const response = await $fetch("/api/matches/tiebreaks", {
      query: { id: edId }
    })
    if ((response as any).ok) {
      toast.add({
        title: "Tiebreaks updated successfully",
        icon: icons.check,
        color: "success"
      })
      refresh()
    } else {
      toast.add({
        title: "Error updating tiebreaks",
        description: (response as any).message,
        icon: icons.error,
        color: "error"
      })
    }
  } catch (e) {
    toast.add({
      title: "Error updating tiebreaks",
      description: (e as Error).message,
      icon: icons.error,
      color: "error"
    })
  } finally {
    set(updating, false)
  }
}

const grouping = ref<string[]>([])
const grouping_options = ref<GroupingOptions>({
  groupedColumnMode: "remove",
  getGroupedRowModel: getGroupedRowModel()
})

const handleSelect = (e: Event, row: TableRow<ResultMatchType>) => {
  if (devMode || row.original.stats) {
    const { tour, draw, type, match_no } = row.original

    router.push({
      name: "match",
      params: {
        id,
        name,
        year,
        edId
      },
      query: {
        tour,
        draw,
        type,
        match_no
      }
    })
  }
}
</script>

<template>
  <u-container>
    <u-page :ui="{ center: devMode ? '' : 'lg:col-span-10' }">
      <template
        #left
        v-if="devMode"
      >
        <u-page-aside>
          <dev-only>
            <u-button
              @click="updateTiebreaks"
              :icon="updating ? ICONS.uploading : icons.upload"
              label="Update tiebreaks"
              block
            />

            <matches-update :refresh />
          </dev-only>
        </u-page-aside>
      </template>

      <editions-wrapper>
        <template #header-links>
          <u-tooltip :text="viewMode ? 'Cards' : 'Table'">
            <div>
              <u-switch
                v-model="viewMode"
                :checked-icon="ICONS.cards"
                :unchecked-icon="ICONS.table"
              />
            </div>
          </u-tooltip>
        </template>
      </editions-wrapper>

      <u-page-body class="mt-0">
        <define-empty-template>
          <empty
            message="No matches found"
            class="mx-2"
          >
            <dev-only>
              <matches-update :refresh />
            </dev-only>
          </empty>
        </define-empty-template>

        <template v-if="viewMode">
          <u-stepper
            v-if="matches.length"
            :items="matches"
            :linear="false"
          >
            <template #indicator="{ item }">
              {{ roundEnum[item.title as keyof typeof roundEnum] }}
            </template>

            <template #content="{ item }">
              <u-page-columns class="2xl:columns-4">
                <editions-results-card
                  v-for="match in item.matches"
                  :key="match.id"
                  :match
                />
              </u-page-columns>
            </template>
          </u-stepper>

          <reuse-empty-template v-else />
        </template>

        <u-table
          v-else
          :data
          :columns="resultsColumns"
          :loading="status === 'pending'"
          :grouping
          :grouping-options="grouping_options"
          :faceted-options="{
            getFacetedRowModel: getFacetedRowModel(),
            getFacetedUniqueValues: getFacetedUniqueValues()
          }"
          @select="handleSelect"
          sticky
          render-fallback-value="—"
          :ui="{
            root: 'max-h-150',
            td: 'empty: p-0'
          }"
          :meta="{
            class: {
              tr: (row: TableRow<ResultMatchType>) => devMode && !row.original.stats ? 'bg-warning/20 cursor-pointer' : row.original.stats ? 'cursor-pointer' : ''
            }
          }"
        >
          <template #loading>
            <loading-icon />
          </template>

          <template #empty>
            <reuse-empty-template />
          </template>
        </u-table>
      </u-page-body>
    </u-page>
  </u-container>
</template>
