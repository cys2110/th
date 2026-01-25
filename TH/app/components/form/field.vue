<script setup lang="ts" generic="S">
defineProps<{
  field: FormFieldInterface<S>
}>()

const modelValue = defineModel<any>()
</script>

<template>
  <u-form-field
    :name="<string>field.key"
    :label="field.label"
    :required="field.required"
    :description="field.description"
    :ui="{
      root: field.class,
      label: 'text-xs'
    }"
  >
    <slot v-if="field.type === 'slot'" />

    <form-input
      v-else-if="field.type === 'text'"
      :type="field.subType"
      :placeholder="`Enter ${field.placeholder?.toLowerCase() || field.label.toLowerCase()}`"
      :disabled="field.disabled"
      v-model="modelValue[field.key]"
      :icon="field.icon"
    />

    <form-input-menu
      v-else-if="field.type === 'inputMenu'"
      v-model="modelValue[field.key]"
      :items="field.items!"
      :placeholder="`Select ${field.placeholder?.toLowerCase() || field.label.toLowerCase()}`"
      :multiple="field.multiple"
      :icon="field.icon"
    />

    <u-radio-group
      v-else-if="field.type === 'radio'"
      :items="field.items"
      v-model="modelValue[field.key]"
      orientation="horizontal"
      loop
    />
  </u-form-field>
</template>
