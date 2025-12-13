<script setup lang="ts">
definePageMeta({ name: "wl-index" })
const {
  params: { id }
} = useRoute("wl-index")
const breakpoints = useBreakpoints(breakpointsTailwind, { ssrWidth: useSSRWidth() })
const mdAndDown = breakpoints.smallerOrEqual("md")

// Filters
const levels = ref([])
const drawType = ref<DrawEnumType>()
const years = ref([])

const resetFilters = () => {
  levels.value = []
  drawType.value = undefined
  years.value = []
}

const { data: index, status } = await useFetch<WLIndexType[]>("/api/players/wl-index", {
  method: "POST",
  body: {
    id,
    levels,
    drawType,
    years
  },
  default: () => []
})
</script>

<template>
  <u-container>
    <u-page>
      <template #left>
        <u-page-aside>
          <players-wl-index-chart
            :index
            :levels
            :draw-type
            :years
          />
          <filters
            :filters="['levels', 'years', 'draw']"
            v-model:levels="levels"
            v-model:years="years"
            v-model:draw="drawType"
            :reset-filters
          />
        </u-page-aside>
      </template>

      <players-wrapper>
        <template #header-links>
          <!--Filters for smaller screens-->
          <u-slideover
            v-if="mdAndDown"
            title="Filters"
            class="ml-auto lg:hidden"
          >
            <u-button :icon="ICONS.filter" />
            <template #body>
              <filters
                :filters="['levels', 'years', 'draw']"
                v-model:levels="levels"
                v-model:years="years"
                v-model:draw="drawType"
                :reset-filters
              />
            </template>
          </u-slideover>
        </template>
      </players-wrapper>

      <u-page-body>
        <u-table
          :data="index"
          :columns="wlIndexColumns"
          :loading="status === 'pending'"
          sticky
          :ui="{ root: 'w-fit min-w-1/3 mx-auto max-h-150', td: 'empty:p-0' }"
        >
          <template #loading>
            <loading-icon />
          </template>
          <template #empty>
            <empty
              message="No win-loss index available"
              class="mx-2"
            />
          </template>
        </u-table>
      </u-page-body>
    </u-page>
  </u-container>
</template>
