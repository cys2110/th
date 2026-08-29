<script setup lang="ts" generic="S">
// import { formatAtpLink } from "#imports"

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
</script>

<template>
  <u-form-field
    :key="field.key"
    :name="<string>field.key"
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

    <!-- <u-input-tags
      v-else-if="field.type === 'tags'"
      v-model="modelValue[field.key]"
      :placeholder="field.placeholder ?? `Enter ${field.label.toLowerCase()}`"
      :max="field.max"
      add-on-paste
      :convert-value="field.key === 'links' ? formatAtpLink : undefined"
      :icon="field.icon"
      class="w-full"
    /> -->

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

    <country-search
      v-else-if="field.type === 'country'"
      v-model="modelValue[field.key]"
    />

    <venue-search
      v-else-if="field.type === 'venue'"
      v-model="modelValue[field.key]"
    />

    <person-search
      v-else-if="field.type === 'person'"
      v-model="modelValue[field.key]"
      :multiple="field.multiple || false"
    />

    <player-search
      v-else-if="field.type === 'player'"
      v-model="modelValue[field.key]"
      :multiple="field.multiple || false"
    />
  </u-form-field>
</template>
