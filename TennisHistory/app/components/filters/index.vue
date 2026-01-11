<script setup lang="ts">
import type { Table } from "@tanstack/vue-table"

defineProps<{
  sortFields?: OptionType[]
  resetFilters?: () => void
  resetSorting?: () => void
  resetGrouping?: () => void
  table?: { tableApi: Table<any> } | null
}>()

const sortField = defineModel<SortFieldType[]>("sorting")

const {
  ui: { icons }
} = useAppConfig()
</script>

<template>
  <u-button
    v-if="resetFilters"
    label="Reset Filters"
    :icon="ICONS.filterOff"
    @click="resetFilters"
    block
  />

  <u-button
    v-if="resetSorting"
    label="Reset Sorting"
    :icon="ICONS.sort"
    @click="resetSorting"
    block
  />

  <u-button
    v-if="resetGrouping && table"
    label="Reset Grouping"
    :icon="ICONS.groupOff"
    @click="resetGrouping"
    block
  />

  <table-client-visibility
    v-if="table"
    :table
  />

  <template v-if="!table">
    <u-separator v-if="resetFilters" />

    <u-form-field
      v-if="resetFilters"
      label="Filter by"
    >
      <div class="*:my-2">
        <slot />
      </div>
    </u-form-field>

    <u-separator v-if="resetSorting" />

    <u-form-field
      v-if="resetSorting"
      label="Sort by"
      class="*:my-2"
    >
      <u-field-group
        v-if="sortField?.length"
        v-for="(field, index) in sortField"
        :key="index"
        class="w-full mb-2"
      >
        <u-select
          v-model="sortField[index]!.field"
          :items="sortFields"
          disabled
        />
        <u-select
          v-model="sortField[index]!.direction"
          :items="SORT_DIRECTIONS"
        />
        <u-button
          :icon="icons.close"
          color="error"
          @click="sortField.splice(index, 1)"
        />
      </u-field-group>

      <filters-sort-field
        v-if="sortFields"
        :sort-fields="sortFields"
        v-model="sortField"
      />
    </u-form-field>
  </template>
</template>
