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
    :ui="{ label: 'text-xs' }"
  >
    <form-input
      v-if="field.type === 'text'"
      v-model="modelValue[field.key]"
      :placeholder="`Enter ${field.label.toLowerCase()}`"
    />

    <u-radio-group
      v-else-if="field.type === 'radio'"
      v-model="modelValue[field.key]"
      :items="field.items"
      orientation="horizontal"
    />
  </u-form-field>
</template>
