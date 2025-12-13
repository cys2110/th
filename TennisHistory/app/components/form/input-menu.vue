<script setup lang="ts">
defineProps<{
  items: any[]
  placeholder: string
  multiple?: boolean
}>()
const modelValue = defineModel<any>()

const {
  ui: { icons }
} = useAppConfig()
</script>

<template>
  <u-input-menu
    v-model="modelValue"
    :items
    :placeholder
    :multiple
  >
    <template #content-bottom>
      <u-button
        label="Clear"
        size="xs"
        @click="modelValue = multiple ? [] : undefined"
        :icon="icons.close"
        block
      />
    </template>
  </u-input-menu>
</template>
