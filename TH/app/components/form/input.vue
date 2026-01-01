<script setup lang="ts">


withDefaults(
  defineProps<{
    placeholder: string
    type?: "text" | "number"
    disabled?: boolean
  }>(),
  {
    type: "text",
    disabled: false
  }
)

const modelValue = defineModel<string | number>()

const {
  ui: { icons }
} = useAppConfig()
</script>

<template>
  <u-input
    v-model="modelValue"
    :type="type"
    :placeholder="placeholder"
    :disabled="disabled"
  >
    <template
      v-if="isDefined(modelValue) && !disabled"
      #trailing
    >
      <u-button
        color="neutral"
        variant="link"
        :icon="icons.close"
        aria-label="Clear input"
        @click="modelValue = undefined"
      />
    </template>
  </u-input>
</template>
