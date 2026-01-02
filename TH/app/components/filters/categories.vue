<script setup lang="ts">
withDefaults(
  defineProps<{
    disabled?: boolean
    items?: string[]
  }>(),
  {
    items: () => CATEGORY_OPTIONS,
    disabled: false
  }
)

const categories = defineModel<string[]>()
</script>

<template>
  <form-input-menu
    v-model="categories"
    placeholder="Categories"
    :items="items"
    :icon="ICONS.category"
    :disabled="disabled"
    multiple
  />
</template>
