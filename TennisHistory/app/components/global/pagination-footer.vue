<script setup lang="ts">
withDefaults(
  defineProps<{
    total: number
    placeholder: string
    showPaginationControls?: boolean
  }>(),
  {
    showPaginationControls: true
  }
)

const page = defineModel<number>("page")
const itemsPerPage = defineModel<number>("items-per-page")
</script>

<template>
  <div class="sticky w-full z-50 bg-default bottom-0 mt-auto pt-3 pb-6">
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-5 justify-items-center">
      <div class="font-semibold text-muted hidden lg:inline text-xs xl:text-sm"> {{ total }} {{ placeholder }}</div>

      <u-pagination
        v-if="showPaginationControls"
        v-model:page="page"
        :total
        :items-per-page
        active-variant="subtle"
      />

      <u-form-field
        v-if="showPaginationControls"
        label="Items per page"
        class="w-4/5 ml-auto hidden lg:inline"
      >
        <u-slider
          v-model="itemsPerPage"
          :min="10"
          :max="100"
          :step="5"
          tooltip
        />
      </u-form-field>
    </div>
  </div>
</template>
