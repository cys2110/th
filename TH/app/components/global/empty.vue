<script setup lang="ts">


withDefaults(
  defineProps<{
    message: string
    icon?: string
  }>(),
  {
    icon: "line-md:alert-circle-twotone-loop"
  }
)

const {
  ui: { icons }
} = useAppConfig()
</script>

<template>
  <u-empty
    :title="message"
    :icon="icon"
    description="If you think this is an error, refresh the page. Otherwise, please be patient as we continue to add more data."
    class="mx-2"
  >
    <template #actions>
      <u-button
        label="Refresh"
        :icon="icons.reload"
        @click="reloadNuxtApp()"
        :ui="{ leadingIcon: 'animate-spin [animation-duration:3000ms]' }"
      />
      <slot />
    </template>
  </u-empty>
</template>
