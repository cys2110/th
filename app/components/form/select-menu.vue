<script setup lang="ts">
defineProps<{
  items: string[] | { value: string; label: string }[] | number[]
  loading?: boolean
  placeholder: string
  block?: boolean
  size?: "md"
  multiple?: boolean
  icon?: string
}>()
const modelValue = defineModel<string | { value: string; label: string } | string[] | { value: string; label: string }[] | number | number[]>()

const {
  ui: { icons }
} = useAppConfig()
</script>

<template>
  <u-select-menu
    v-model="modelValue"
    :items="items"
    :label-key="typeof items[0] === 'string' ? undefined : 'label'"
    :loading
    :placeholder
    :class="{ 'w-fit max-w-50': !block }"
    :variant="block ? undefined : 'none'"
    :size
    :multiple
    :icon
  >
    <template #content-bottom>
      <u-button
        label="Clear"
        size="xs"
        @click="modelValue = typeof items[0] === 'string' ? undefined : []"
        :icon="icons.close"
        block
        class="rounded-t-none"
      />
    </template>
  </u-select-menu>
</template>
