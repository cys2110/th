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
    :ui="{ label: 'text-xs' }"
  >
    <slot v-if="field.type === 'slot'" />

    <form-input
      v-else-if="field.type === 'text'"
      :type="field.subType"
      :placeholder="field.placeholder || `Enter ${field.label.toLowerCase()}`"
      :disabled="field.disabled"
      v-model="modelValue[field.key]"
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
