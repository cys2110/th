<script setup lang="ts">
const { type = "text" } = defineProps<{
  placeholder: string
  type?: string
}>()
const modelValue = defineModel<string | number>()
const {
  ui: { icons }
} = useAppConfig()
</script>

<template>
  <u-input
    v-model="modelValue"
    :type
    placeholder=""
    :ui="{ base: 'peer' }"
  >
    <template
      v-if="(modelValue || (modelValue as string)?.length)"
      #trailing
    >
      <u-button
        color="neutral"
        variant="link"
        size="xs"
        :icon="icons.close"
        aria-label="Clear input"
        @click="modelValue = undefined"
      />
    </template>

    <label
      class="pointer-events-none absolute left-0 -top-2.5 text-highlighted text-xs font-medium px-1.5 transition-all peer-focus:-top-2.5 peer-focus:text-highlighted peer-focus:text-xs peer-focus:font-medium peer-placeholder-shown:text-xs peer-placeholder-shown:text-dimmed peer-placeholder-shown:top-1.5 peer-placeholder-shown:font-normal"
    >
      <span class="inline-flex bg-default px-1">{{ placeholder }}</span>
    </label>
  </u-input>
</template>
