<script setup lang="ts">
import { isDefined } from "@vueuse/core"

withDefaults(
  defineProps<{
    placeholder: string
    rows?: number
  }>(),
  {
    rows: 2
  }
)

const modelValue = defineModel<string | undefined>()

const { ui } = useAppConfig()
</script>

<template>
  <u-textarea
    v-model="modelValue"
    :placeholder
    :rows
    class="w-full"
  >
    <template
      v-if="isDefined(modelValue)"
      #trailing
    >
      <u-button
        color="neutral"
        variant="link"
        :icon="ui.icons.close"
        @click="modelValue = undefined"
      />
    </template>
  </u-textarea>
</template>
