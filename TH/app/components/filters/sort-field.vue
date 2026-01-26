<script setup lang="ts">
const props = defineProps<{
  sortFields: OptionType[]
}>()

const sortField = useRouteQuery("sorting", null, {
  transform: {
    get: parseSort,
    set: serialiseSort
  }
})

const emit = defineEmits<{
  (e: "reset-sorting"): void
}>()

const {
  ui: { icons }
} = useAppConfig()

const isOpen = ref(false)
const field = ref("")
const direction = ref<"ASC" | "DESC">("ASC")

const handleResetSorting = (e: Event) => {
  e.stopPropagation()
  emit("reset-sorting")
}

const handleAddSortField = () => {
  if (field.value) {
    const next = { field: field.value, direction: direction.value }
    sortField.value = Array.isArray(sortField.value) ? [...sortField.value, next] : [next]
    set(field, "")
    set(direction, "ASC")
    set(isOpen, false)
  }
}

const handleRemoveSortField = (index: number) => {
  if (sortField.value) {
    sortField.value = sortField.value.filter((_, i) => i !== index)
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
        @click="handleRemoveSortField(index)"
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
