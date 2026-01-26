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

    <form-textarea
      v-else-if="field.type === 'textarea'"
      v-model="modelValue[field.key]"
      :placeholder="field.placeholder ?? `Enter ${field.label.toLowerCase()}`"
      :icon="field.icon"
    />

    <u-radio-group
      v-else-if="field.type === 'radio'"
      :items="field.items"
      v-model="modelValue[field.key]"
      orientation="horizontal"
      loop
    />

    <u-checkbox-group
      v-else-if="field.type === 'checkbox'"
      :items="field.items"
      v-model="modelValue[field.key]"
      orientation="horizontal"
      loop
      :icon="field.icon"
    />

    <form-date-picker
      v-else-if="field.type === 'date'"
      v-model="modelValue[field.key]"
    />

    <form-countries
      v-else-if="field.type === 'countries'"
      v-model="modelValue[field.key]"
    />
  </u-form-field>
</template>
