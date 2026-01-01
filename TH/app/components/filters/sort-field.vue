<script setup lang="ts">
/**
 * Modal component to add sort fields for filtering data.
 * @prop {OptionType[]} sortFields - Array of available sort fields.
 * @model sortField - Two-way bound model for selected sort fields.
 */

defineProps<{
  sortFields: OptionType[]
}>()
const sortField = defineModel<SortFieldType[]>()

const open = ref(false)
const field = ref("")
const direction = ref<"ASC" | "DESC">("ASC")

const handleAddSortField = () => {
  if (field.value) {
    sortField.value!.push({ field: field.value, direction: direction.value })
    field.value = ""
    direction.value = "ASC"
    open.value = false
  }
}
</script>

<template>
  <u-modal
    title="Add sort field"
    v-model:open="open"
  >
    <u-button
      :icon="ICONS.sort"
      label="Add sort field"
      block
    />

    <template #body>
      <div class="grid grid-cols-2 gap-3">
        <u-form-field label="Sort by">
          <u-select
            v-model="field"
            :items="sortFields"
            placeholder="Select field"
          />
        </u-form-field>
        <u-form-field label="Direction">
          <u-select
            v-model="direction"
            :items="SORT_DIRECTIONS"
          />
        </u-form-field>
      </div>
    </template>

    <template #footer="{ close }">
      <u-button
        label="Sort"
        @click="handleAddSortField"
        block
      />
      <u-button
        label="Cancel"
        block
        color="error"
        @click="close"
      />
    </template>
  </u-modal>
</template>
