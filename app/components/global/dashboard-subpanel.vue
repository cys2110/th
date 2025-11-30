<script setup lang="ts">
defineProps<{ title?: string; icon?: string }>()
</script>

<template>
  <div class="w-full flex flex-col max-h-200">
    <div class="h-(--ui-header-height) shrink-0 flex items-center justify-between border-b border-default px-4 sm:px-6 gap-1.5 mb-5">
      <div class="flex items-center gap-1.5 min-w-0">
        <u-icon
          v-if="icon"
          :name="icon"
          class="text-xl"
        />
        <h1 class="flex items-center gap-1.5 font-semibold text-highlighted truncate">
          <template v-if="!$slots.title">{{ title }}</template>
          <slot
            v-else
            name="title"
          />
        </h1>
      </div>
      <div class="flex items-center shrink-0 gap-1.5">
        <slot name="right" />
      </div>
    </div>
    <slot />
  </div>
</template>
