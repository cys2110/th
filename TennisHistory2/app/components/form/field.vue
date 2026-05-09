<script setup lang="ts" generic="S">
import { CalendarDate } from "@internationalized/date"

withDefaults(
  defineProps<{
    field: FormFieldInterface<S>
    orientation?: "horizontal" | "vertical"
  }>(),
  {
    orientation: "vertical"
  }
)

const modelValue = defineModel<any>()
const date = defineModel<CalendarDate | undefined>("date")
const dates = defineModel<{ start: CalendarDate | undefined; end: CalendarDate | undefined }>("dates")
</script>

<template>
  <u-form-field
    :key="field.key"
    :name="<string>field.key"
    :error-pattern="field.errorPattern"
    :label="field.label"
    :required="field.required"
    :class="field.class"
    :description="field.description"
    :orientation
    :ui="{
      root: orientation === 'horizontal' ? 'my-3 gap-4' : '',
      container: orientation === 'horizontal' ? 'flex-1' : ''
    }"
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

    <form-input-number
      v-else-if="field.type === 'number'"
      v-model="modelValue[field.key]"
      :placeholder="field.placeholder ?? `Enter ${field.label.toLowerCase()}`"
      :disabled="field.disabled"
      :icon="field.icon"
      :currency="field.currency"
    />

    <u-select-menu
      v-else-if="field.type === 'inputMenu'"
      v-model="modelValue[field.key]"
      :items="field.items!"
      :placeholder="field.placeholder || `Select ${field.label.toLowerCase()}`"
      :multiple="field.multiple"
      :icon="field.icon"
      :loading="field.loading"
      clear
      :value-key="field.valueKey"
      :label-key="field.labelKey"
    />

    <u-input-tags
      v-else-if="field.type === 'tags'"
      v-model="modelValue[field.key]"
      :placeholder="field.placeholder ?? `Enter ${field.label.toLowerCase()}`"
      :max="field.max"
      add-on-paste
      :convert-value="field.key === 'links' ? cleanLink : undefined"
      :icon="field.icon"
    />

    <form-textarea
      v-else-if="field.type === 'textarea'"
      v-model="modelValue[field.key]"
      :placeholder="field.placeholder ?? `Enter ${field.label.toLowerCase()}`"
      :icon="field.icon"
    />

    <u-checkbox-group
      v-else-if="field.type === 'checkbox'"
      :items="field.items"
      v-model="modelValue[field.key]"
      orientation="horizontal"
      loop
      :icon="field.icon"
    />

    <u-radio-group
      v-else-if="field.type === 'radio'"
      :items="field.items"
      v-model="modelValue[field.key]"
      orientation="horizontal"
      loop
      :value-key="field.valueKey"
      :label-key="field.labelKey"
    />

    <form-date-picker
      v-else-if="field.type === 'date'"
      v-model="date"
    />

    <form-dates-picker
      v-else-if="field.type === 'dates'"
      v-model="dates"
    />
  </u-form-field>
</template>
