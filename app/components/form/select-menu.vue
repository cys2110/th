<script setup lang="ts">
defineProps<{
  items: string[] | { value: string; label: string }[] | number[]
  loading?: boolean
  placeholder: string
  block?: boolean
  size?: "md"
  multiple?: boolean
  icon?: string
  class?: string
}>()
const modelValue = defineModel<string | { value: string; label: string } | string[] | { value: string; label: string }[] | number | number[]>()

const {
  ui: { icons }
} = useAppConfig()
</script>

<template>
  <div
    class="relative peer"
    :class
  >
    <transition
      enter-active-class="transition-all duration-200 ease-out"
      enter-from-class="opacity-0 -translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition-all duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-1"
    >
      <label class="pointer-events-none absolute bg-background left-0 -top-2.5 text-highlighted text-xs font-medium px-1.5 z-9999">
        <span class="inline-flex bg-default px-1">{{ placeholder }}</span>
      </label>
    </transition>
    <u-input-menu
      v-model="modelValue"
      :items="items"
      :label-key="typeof items[0] === 'string' ? undefined : 'label'"
      :loading
      :placeholder="`Select ${placeholder.toLowerCase()}`"
      :class="{ 'w-fit max-w-50': !block }"
      :variant="block ? undefined : 'none'"
      :size
      :multiple
      :icon
    >
      <template #content-bottom>
        <u-button
          label="Clear"
          size="xs"
          @click="modelValue = typeof items[0] === 'string' ? undefined : []"
          :icon="icons.close"
          block
          class="rounded-t-none"
        />
      </template>
    </u-input-menu>
  </div>
</template>
