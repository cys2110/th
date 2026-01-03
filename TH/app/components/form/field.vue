<script setup lang="ts" generic="S">
defineProps<{
  field: FormFieldInterface<S>
}>()

const modelValue = defineModel<any>()

const cleanLink = (link: string) => link.replaceAll(/^[\s"'“”‘’\[\]]+|[\s"'“”‘’\[\]]+$/g, "").replace("https://www.atptour.com", "")
</script>

<template>
  <u-form-field
    :name="(field.key as string)"
    :label="field.label"
    :required="field.required"
    :class="field.class"
    :ui="{ label: 'text-xs' }"
  >
    <form-input
      v-if="field.type === 'text'"
      v-model="modelValue[field.key]"
      :placeholder="field.placeholder ?? `Enter ${field.label.toLowerCase()}`"
    />

    <form-textarea
      v-else-if="field.type === 'textarea'"
      v-model="modelValue[field.key]"
      :placeholder="field.placeholder ?? `Enter ${field.label.toLowerCase()}`"
    />

    <u-radio-group
      v-else-if="field.type === 'radio'"
      v-model="modelValue[field.key]"
      :items="field.items"
      orientation="horizontal"
    />

    <u-checkbox-group
      v-else-if="field.type === 'checkbox'"
      v-model="modelValue[field.key]"
      :items="field.items"
      orientation="horizontal"
    />

    <form-date-picker
      v-else-if="field.type === 'date'"
      v-model="modelValue[field.key]"
    />

    <form-dates-picker
      v-else-if="field.type === 'dates'"
      v-model="modelValue[field.key]"
    />
  </u-form-field>
</template>
