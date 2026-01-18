<script setup lang="ts" generic="S">
defineProps<{
  field: FormFieldInterface<S>
}>()

const modelValue = defineModel<any>()

const cleanLink = (link: string) => link.replaceAll(/^[\s"'“”‘’\[\]]+|[\s"'“”‘’\[\]]+$/g, "").replace("https://www.atptour.com", "")

// tours
</script>

<template>
  <u-form-field
    :name="<string>field.key"
    :error-pattern="field.errorPattern"
    :label="field.label"
    :required="field.required"
    :class="field.class"
    :ui="{ label: 'text-xs' }"
  >
    <slot v-if="field.type === 'slot'" />

    <form-input
      v-else-if="field.type === 'text'"
      v-model="modelValue[field.key]"
      :placeholder="field.placeholder ?? `Enter ${field.label.toLowerCase()}`"
      :type="field.subType"
      :disabled="field.disabled"
    />

    <form-textarea
      v-else-if="field.type === 'textarea'"
      v-model="modelValue[field.key]"
      :placeholder="field.placeholder ?? `Enter ${field.label.toLowerCase()}`"
    />

    <u-checkbox-group
      v-else-if="field.type === 'checkbox'"
      v-model="modelValue[field.key]"
      :items="field.items"
      orientation="horizontal"
    />
  </u-form-field>
</template>
