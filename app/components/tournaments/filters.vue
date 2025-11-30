<script setup lang="ts">
defineProps<{
  sortFields: { label: string; value: string }[]
  location: "aside" | "slideover"
}>()

const tours = defineModel<TourEnumType[]>("tours")
const established = defineModel<number>("established")
const abolished = defineModel<number>("abolished")
const sortField = defineModel<SortFieldType>("sorting")
const tournaments = defineModel<OptionInput[]>("tournaments")

const {
  ui: { icons }
} = useAppConfig()
</script>

<template>
  <u-form-field
    label="Filter by"
    class="*:*:my-2"
  >
    <form-search
      v-if="location === 'slideover'"
      type="Tournament"
      v-model="tournaments"
      :icon="ICONS.tournament"
      multiple
    />
    <u-checkbox-group
      legend="Tours"
      v-model="tours"
      :items="TOUR_OPTIONS"
      :ui="{ item: 'ml-3' }"
    />
    <form-input-label
      v-model="established"
      type="number"
      placeholder="Established after"
    />
    <form-input-label
      v-model="abolished"
      type="number"
      placeholder="Abolished before"
    />
  </u-form-field>

  <u-form-field label="Sort by">
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
      :sort-fields="sortFields"
      v-model="sortField"
    />
  </u-form-field>
</template>
