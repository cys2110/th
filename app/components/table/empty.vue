<script setup lang="ts">
defineProps<{ message: string; icon?: string }>()
const {
  ui: { icons }
} = useAppConfig()
</script>

<template>
  <div class="flex justify-center items-center w-full gap-2 text-error">
    <u-icon
      :name="icon ?? icons.caution"
      class="text-base"
    />
    {{ message }}
  </div>
</template>
