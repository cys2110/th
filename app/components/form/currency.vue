<script setup lang="ts">
defineProps<{ placeholder: string; block?: boolean; currency?: keyof typeof CurrencyEnum | undefined; class?: string }>()
const modelValue = defineModel<number | null>()
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
    <u-input-number
      v-model="modelValue"
      :placeholder="`Enter ${placeholder.toLowerCase()}`"
      :decrement="false"
      :step="0.01"
      :format-options="{
        style: 'currency',
        currency: currency || 'USD'
      }"
    >
      <template #increment>
        <u-button
          v-if="modelValue !== undefined"
          color="neutral"
          variant="ghost"
          size="xs"
          :icon="icons.close"
          aria-label="Clear input"
          @click="modelValue = undefined"
        />
        <template v-else>{{ "" }}</template>
      </template>
    </u-input-number>
  </div>
</template>
