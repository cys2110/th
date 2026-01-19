<script setup lang="ts">
defineProps<{
  sortFields: OptionType[]
}>()

const sortField = defineModel<SortFieldType[]>()

const {
  ui: { icons }
} = useAppConfig()

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
            :items="['ASC', 'DESC']"
          />
        </u-form-field>
      </div>
    </template>

    <template #footer="{ close }">
      <u-button
        label="Sort"
        @click="handleAddSortField"
        block
        :icon="ICONS.sort"
      />
      <u-button
        label="Cancel"
        block
        color="error"
        @click="close"
        :icon="icons.close"
      />
    </template>
  </u-modal>
</template>
