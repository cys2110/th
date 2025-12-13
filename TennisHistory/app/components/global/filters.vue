<script setup lang="ts" generic="T">
import type { Table } from "@tanstack/vue-table"
import { CalendarDate } from "@internationalized/date"

defineProps<{
  filters: string[]
  sortFields?: { label: string; value: string }[]
  resetFilters?: () => void
  resetSorting?: () => void
  table?: { tableApi: Table<T> } | null
  id?: any
}>()

const tours = defineModel<TourEnumType[]>("tours")
const established = defineModel<number>("established")
const abolished = defineModel<number>("abolished")
const sortField = defineModel<SortFieldType[]>("sorting")
const tournaments = defineModel<OptionType[]>("tournaments")
const years = defineModel<number[]>("years")
const players = defineModel<OptionType[]>("players")
const status = defineModel<string>("status")
const min_year = defineModel<number>("min_year")
const max_year = defineModel<number>("max_year")
const coaches = defineModel<OptionType[]>("coaches")
const countries = defineModel<OptionType[]>("countries")
const continents = defineModel<string[]>("continents")
const levels = defineModel<string[]>("levels")
const supervisors = defineModel<OptionType[]>("supervisors")
const umpires = defineModel<OptionType[]>("umpires")
const venues = defineModel<OptionType[]>("venues")
const environment = defineModel<string>("environment")
const surfaces = defineModel<string[]>("surfaces")
const categories = defineModel<string[]>("categories")
const dateRange = defineModel<{ start: CalendarDate | undefined; end: CalendarDate | undefined }>("dateRange")
const draw = defineModel<DrawEnumType>("draw")
const matchType = defineModel<string>("matchType")

const {
  ui: { icons }
} = useAppConfig()
</script>

<template>
  <u-button
    v-if="resetFilters"
    label="Reset Filters"
    :icon="ICONS.noFilter"
    @click="resetFilters"
    block
  />

  <u-button
    v-if="resetSorting"
    label="Reset Sorting"
    :icon="ICONS.sortAlpha"
    @click="resetSorting"
    block
  />

  <u-dropdown-menu
    v-if="table"
    :items="
      table?.tableApi
        ?.getAllColumns()
        .filter((column) => column.getCanHide())
        .map((column) => ({
          label: capitalCase(column.id),
          type: 'checkbox' as const,
          checked: column.getIsVisible(),
          onUpdateChecked(checked: boolean) {
            table?.tableApi?.getColumn(column.id)?.toggleVisibility(!!checked)
          },
          onSelect(e?: Event) {
            e?.preventDefault()
          }
        }))
    "
    :content="{ align: 'end' }"
  >
    <u-button
      label="Hide Columns"
      :icon="ICONS.noColumn"
      block
    />
  </u-dropdown-menu>

  <u-form-field
    v-if="resetFilters"
    label="Filter by"
    class="*:*:my-2"
  >
    <form-search
      v-if="filters.includes('tournaments')"
      type="Tournament"
      v-model="tournaments"
      :icon="ICONS.tournament"
      multiple
    />

    <form-search
      v-if="filters.includes('winners')"
      type="Winner"
      v-model="players"
      :icon="ICONS.tournament"
      multiple
      :id
    />

    <form-search
      v-if="filters.includes('players')"
      type="Player"
      v-model="players"
      :icon="ICONS.player"
      multiple
    />

    <u-checkbox-group
      v-if="filters.includes('tours')"
      legend="Tours"
      v-model="tours"
      :items="filters.includes('status') ? ['ATP', 'WTA'] : TOUR_OPTIONS"
      :ui="{ item: 'ml-3' }"
    />

    <u-checkbox-group
      v-if="filters.includes('levels')"
      legend="Level"
      v-model="levels"
      :items="LEVEL_OPTIONS"
      :ui="{ item: 'ml-3' }"
    />

    <u-radio-group
      v-if="filters.includes('draw')"
      legend="Draw"
      v-model="draw"
      :items="['Main', 'Qualifying']"
      :ui="{ item: 'ml-3' }"
    />

    <u-radio-group
      v-if="filters.includes('matchType')"
      legend="S/D"
      v-model="matchType"
      :items="['Singles', 'Doubles']"
      :ui="{ item: 'ml-3' }"
    />

    <form-input-tags
      v-if="filters.includes('categories')"
      v-model="categories"
      placeholder="Filter by categories"
      :icon="ICONS.categories"
    />

    <u-radio-group
      v-if="filters.includes('status')"
      legend="Status"
      v-model="status"
      :items="['Active', 'Inactive']"
      :ui="{ item: 'ml-3' }"
    />

    <form-input-label
      v-if="filters.includes('established')"
      v-model="established"
      type="number"
      placeholder="Established after"
    />

    <form-input-label
      v-if="filters.includes('abolished')"
      v-model="abolished"
      type="number"
      placeholder="Abolished before"
    />

    <form-dates-picker
      v-if="filters.includes('dateRange')"
      v-model="dateRange"
      placeholder="Filter by date range"
    />

    <form-input-menu
      v-if="filters.includes('years')"
      v-model="years"
      placeholder="Years"
      :items="ALL_YEARS"
      :icon="ICONS.event"
      multiple
    />

    <u-radio-group
      v-if="filters.includes('environment')"
      legend="Environment"
      v-model="environment"
      :items="['Indoor', 'Outdoor']"
      :ui="{ item: 'ml-3' }"
    />

    <u-checkbox-group
      v-if="filters.includes('surfaces')"
      legend="Surfaces"
      v-model="surfaces"
      :items="['Clay', 'Grass', 'Hard', 'Carpet']"
      :ui="{ item: 'ml-3' }"
    />

    <form-search
      v-if="filters.includes('venues')"
      placeholder="Filter by venues"
      type="Venue"
      v-model="venues"
      :icon="ICONS.venue"
      multiple
    />

    <form-search
      v-if="filters.includes('countries')"
      v-model="countries"
      placeholder="countries"
      type="Country"
      :icon="ICONS.countries"
      multiple
    />

    <form-input-label
      v-if="filters.includes('min_year')"
      v-model="min_year"
      type="number"
      placeholder="First Tournament After"
    />

    <form-input-label
      v-if="filters.includes('max_year')"
      v-model="max_year"
      type="number"
      placeholder="Last Tournament Before"
    />

    <form-search
      v-if="filters.includes('coaches')"
      v-model="coaches"
      placeholder="coaches"
      type="Coach"
      :icon="ICONS.coach"
      multiple
    />

    <u-checkbox-group
      v-if="filters.includes('continents')"
      legend="Continents"
      v-model="continents"
      :items="['Africa', 'Asia', 'Europe', 'North America', 'Oceania', 'South America']"
      :ui="{ item: 'ml-3' }"
    />

    <form-search
      v-if="filters.includes('supervisors')"
      placeholder="Filter by supervisors"
      type="Supervisor"
      v-model="supervisors"
      :icon="ICONS.supervisor"
      multiple
    />

    <form-search
      v-if="filters.includes('umpires')"
      placeholder="Filter by umpires"
      type="Umpire"
      v-model="umpires"
      :icon="ICONS.umpire"
      multiple
    />
  </u-form-field>

  <u-form-field
    v-if="resetSorting"
    label="Sort by"
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

    <form-sort-field
      v-if="sortFields"
      :sort-fields="sortFields"
      v-model="sortField"
    />
  </u-form-field>
</template>
