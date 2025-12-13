<script setup lang="ts">
defineProps<{
  total: number
  type?: string
  placeholder?: string
}>()

const page = defineModel<number>("page")
const itemsPerPage = defineModel<number>("itemsPerPage")
</script>

<template>
  <div class="sticky w-full z-50 bg-default bottom-0 mt-auto pt-3 pb-6">
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-5 justify-items-center">
      <div class="font-semibold text-muted hidden lg:inline text-xs xl:text-sm">
        {{ total }} {{ placeholder ?? `${type}${total === 1 ? "" : "s"}` }}</div
      >

      <u-pagination
        v-model:page="page"
        :total
        :items-per-page
        active-variant="subtle"
      />

      <u-form-field
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
