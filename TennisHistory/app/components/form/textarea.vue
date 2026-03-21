<script setup lang="ts">
withDefaults(
  defineProps<{
    placeholder: string
    icon?: string
    rows?: number
  }>(),
  {
    rows: 2
  }
)

const modelValue = defineModel<string | undefined>()

const {
  ui: { icons }
} = useAppConfig()
</script>

<template>
  <u-textarea
    v-model="modelValue"
    :placeholder
    :icon
    :rows
  >
    <template
      v-if="isDefined(modelValue)"
      #trailing
    >
      <u-button
        color="neutral"
        variant="link"
        :icon="icons.close"
        @click="modelValue = undefined"
      />
    </template>
  </u-textarea>
</template>
