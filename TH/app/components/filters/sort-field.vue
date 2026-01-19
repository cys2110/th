<script setup lang="ts">
import type { Table } from "@tanstack/vue-table"

const props = defineProps<{
  resetSorting?: () => void
  sortFields: OptionType[]
  table?: { tableApi: Table<any> }
}>()

const sortField = defineModel<SortFieldType[]>()

const {
  ui: { icons }
} = useAppConfig()

const isOpen = ref(false)
const field = ref("")
const direction = ref<"ASC" | "DESC">("ASC")

const handleResetSorting = (e: Event) => {
  e.stopPropagation()

  if (props.resetSorting) {
    props.resetSorting()
  } else {
    props.table?.tableApi.resetSorting()
  }
}

const handleAddSortField = () => {
  if (field.value) {
    sortField.value!.push({ field: field.value, direction: direction.value })
    set(field, "")
    set(direction, "ASC")
    set(isOpen, false)
  }
}
</script>

<template>
  <u-form-field
    label="Sort By"
    class="*:my-2"
  >
    <u-field-group
      v-if="sortField?.length"
      v-for="(_, index) in sortField"
      :key="index"
      class="mb-2"
    >
      <u-select
        :items="sortFields"
        v-model="sortField[index]!.field"
        disabled
      />

      <u-select
        :items="['ASC', 'DESC']"
        v-model="sortField[index]!.direction"
      />

      <u-button
        color="error"
        :icon="icons.close"
        @click="sortField!.splice(index, 1)"
      />
    </u-field-group>

    <u-modal
      title="Add Sort Field"
      v-model:open="isOpen"
    >
      <u-field-group>
        <u-button
          label="Add Sort Field"
          block
          :icon="ICONS.sort"
        />
        <u-button
          v-if="sortField?.length"
          label="Reset Sorting"
          block
          :icon="ICONS.sort"
          @click="handleResetSorting"
        />
      </u-field-group>

      <template #body>
        <div class="grid grid-cols-2 gap-3">
          <u-form-field
            label="Sort by"
            required
          >
            <u-select
              placeholder="Select field"
              :items="sortFields"
              v-model="field"
            />
          </u-form-field>

          <u-form-field
            label="Direction"
            required
          >
            <u-select
              v-model="direction"
              :items="['ASC', 'DESC']"
            />
          </u-form-field>
        </div>
      </template>

      <template #footer="{ close }">
        <u-button
          label="Sort"
          block
          :icon="ICONS.sort"
          @click="handleAddSortField"
        />

        <u-button
          label="Cancel"
          color="error"
          block
          :icon="icons.close"
          @click="close"
        />
      </template>
    </u-modal>
  </u-form-field>
</template>
