<script setup lang="ts">
/**
 * Input menu form component allowing selection of items via input menu.
 * @model modelValue - Two-way bound model for selected items.
 */

withDefaults(
  defineProps<{
    items: any[]
    placeholder?: string
    multiple?: boolean
    disabled?: boolean
  }>(),
  {
    multiple: false,
    placeholder: "Select an option",
    disabled: false
  }
)

const modelValue = defineModel<any>()

const {
  ui: { icons }
} = useAppConfig()
</script>

<template>
  <u-input-menu
    v-model="modelValue"
    :items="items"
    :placeholder="placeholder"
    :multiple="multiple"
    :disabled="disabled"
  >
    <template #content-bottom>
      <u-button
        label="Clear"
        @click="modelValue = multiple ? [] : undefined"
        :icon="icons.close"
        block
      />
    </template>
  </u-input-menu>
</template>
