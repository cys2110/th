<script setup lang="ts">
defineProps<{
  placeholder: string
  class?: string
  max?: number
}>()
const modelValue = defineModel<string[]>()
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
    <u-input-tags
      v-model="modelValue"
      :placeholder="`Enter ${placeholder.toLowerCase()}`"
      :max
      add-on-paste
    />
  </div>
</template>
