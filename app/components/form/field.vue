<script setup lang="ts" generic="S">
defineProps<{
  field: FormFieldInterface<S>
}>()

const modelValue = defineModel<any>()

const cleanLink = (link: string) => link.replaceAll(/^[\s"'“”‘’\[\]]+|[\s"'“”‘’\[\]]+$/g, "")
</script>

<template>
  <u-form-field
    :name="(field.key as string) ?? undefined"
    :error-pattern="field.errorPattern"
    :label="field.label"
    :required="field.required"
    :class="field.class"
  >
    <u-field-group
      v-if="!field.key && field.children"
      class="w-full"
    >
      <template
        v-for="child in field.children"
        :key="child.label"
      >
        <form-input-menu
          v-if="child.type === 'inputMenu'"
          v-model="modelValue[child.key]"
          :items="child.items!"
          :placeholder="child.placeholder ?? `Select ${child.label.toLowerCase()}`"
          :multiple="child.multiple"
        />

        <form-input-number
          v-else-if="child.type === 'number'"
          v-model="modelValue[child.key]"
          :placeholder="child.placeholder ?? `Enter ${child.label.toLowerCase()}`"
          :currency="child.currency"
        />

        <form-search
          v-else-if="child.type === 'search'"
          v-model="modelValue[child.key]"
          :key="child.key"
          :type="child.subType!"
          :icon="child.icon"
          :placeholder="child.placeholder"
          :multiple="child.multiple"
        />
      </template>
    </u-field-group>

    <u-checkbox-group
      v-else-if="field.type === 'checkbox'"
      v-model="modelValue[field.key]"
      :items="field.items"
      orientation="horizontal"
    />

    <u-radio-group
      v-else-if="field.type === 'radio'"
      v-model="modelValue[field.key]"
      :items="field.items"
      orientation="horizontal"
    />

    <form-textarea
      v-else-if="field.type === 'textarea'"
      v-model="modelValue[field.key]"
      :placeholder="field.placeholder ?? `Enter ${field.label.toLowerCase()}`"
    />

    <form-input
      v-else-if="field.type === 'text'"
      v-model="modelValue[field.key]"
      :placeholder="field.placeholder ?? `Enter ${field.label.toLowerCase()}`"
      :type="field.subType"
      :disabled="field.disabled"
    />

    <form-input-number
      v-else-if="field.type === 'number'"
      v-model="modelValue[field.key]"
      :placeholder="field.placeholder ?? `Enter ${field.label.toLowerCase()}`"
      :currency="field.currency"
    />

    <form-input-menu
      v-else-if="field.type === 'inputMenu'"
      v-model="modelValue[field.key]"
      :items="field.items!"
      :placeholder="field.placeholder ?? `Select ${field.label.toLowerCase()}`"
      :multiple="field.multiple"
    />

    <form-input-tags
      v-else-if="field.type === 'tags'"
      v-model="modelValue[field.key]"
      :placeholder="field.placeholder ?? `Enter ${field.label.toLowerCase()}`"
      :max="field.max"
      :convert-value="field.key === 'links' ? cleanLink : undefined"
    />

    <form-date-picker
      v-else-if="field.type === 'date'"
      v-model="modelValue[field.key]"
    />

    <form-dates-picker
      v-else-if="field.type === 'dates'"
      v-model="modelValue[field.key]"
    />

    <form-search
      v-else-if="field.type === 'search'"
      v-model="modelValue[field.key]"
      :key="typeof field.matchType === 'object' ? JSON.stringify(field.matchType) : field.matchType ?? field.key"
      :type="field.subType!"
      :icon="field.icon"
      :placeholder="field.placeholder"
      :multiple="field.multiple"
      :id="field.id"
      :tour="field.tour"
      :match-type="typeof field.matchType === 'object' ? field.matchType.type : field.matchType"
    />
  </u-form-field>
</template>
