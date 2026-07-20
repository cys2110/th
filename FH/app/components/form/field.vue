<script setup lang="ts" generic="S">
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

const { ui } = useAppConfig()
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
    :ui="{ root: orientation === 'horizontal' ? 'my-3 gap-4' : '' }"
  >
    <slot v-if="field.type === 'slot'" />

    <form-input
      v-else-if="field.type === 'text'"
      :type="field.subType"
      :placeholder="field.placeholder || field.label"
      :disabled="field.disabled"
      v-model="modelValue[field.key]"
    />

    <form-input-number
      v-else-if="field.type === 'number'"
      v-model="modelValue[field.key]"
      :placeholder="field.placeholder ?? field.label"
      :disabled="field.disabled"
      :currency="field.currency"
    />

    <u-switch
      v-else-if="field.type === 'switch'"
      v-model="modelValue[field.key]"
      :checked-icon="ui.icons.check"
      :unchecked-icon="ui.icons.error"
      size="md"
    />

    <u-input-menu
      v-else-if="field.type === 'inputMenu'"
      v-model="modelValue[field.key]"
      :items="field.items!"
      :placeholder="field.placeholder || field.label"
      :multiple="field.multiple"
      :icon="field.icon"
      :loading="field.loading"
      clear
      :value-key="field.valueKey"
      :label-key="field.labelKey"
      class="w-full"
    />

    <u-input-tags
      v-else-if="field.type === 'tags'"
      v-model="modelValue[field.key]"
      :placeholder="field.placeholder ?? `Enter ${field.label.toLowerCase()}`"
      :max="field.max"
      :icon="field.icon"
      class="w-full"
    />

    <form-textarea
      v-else-if="field.type === 'textarea'"
      v-model="modelValue[field.key]"
      :placeholder="field.placeholder ?? field.label"
      :icon="field.icon"
    />

    <u-checkbox-group
      v-else-if="field.type === 'checkbox'"
      :items="field.items"
      v-model="modelValue[field.key]"
      orientation="horizontal"
      loop
      :icon="field.icon"
      highlight
    />

    <u-radio-group
      v-else-if="field.type === 'radio'"
      :items="field.items"
      v-model="modelValue[field.key]"
      orientation="horizontal"
      loop
      :value-key="field.valueKey"
      :label-key="field.labelKey"
      highlight
    />

    <form-date-picker
      v-else-if="field.type === 'date'"
      v-model="modelValue[field.key]"
    />

    <form-dates-picker
      v-else-if="field.type === 'dates'"
      v-model="modelValue[field.key]"
    />

    <u-listbox
      v-else-if="field.type === 'listbox'"
      v-model="modelValue[field.key]"
      :items="field.items.map((item: any) => ({ value: item, label: item }))"
      value-key="value"
    />

    <u-calendar
      v-else-if="field.type === 'calendar'"
      v-model="modelValue[field.key]"
      type="year"
    />

    <u-file-upload
      v-else-if="field.type === 'image'"
      v-model="modelValue[field.key]"
      accept="image/*"
      label="Drop your image here"
    />

    <u-input-time
      v-else-if="field.type === 'time'"
      v-model="modelValue[field.key]"
      :hour-cycle="24"
      icon="icon-park-twotone:time"
      class="w-full"
    />
  </u-form-field>
</template>
