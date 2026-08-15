<script setup lang="ts">
import { isDefined } from "#imports"

withDefaults(
  defineProps<{
    type?: string
    placeholder: string
    disabled?: boolean
  }>(),
  {
    type: "text",
    disabled: false
  }
)

const modelValue = defineModel<any>()

const { ui } = useAppConfig()
</script>

<template>
  <u-input
    :type
    :placeholder
    :disabled
    v-model="modelValue"
    class="w-full"
  >
    <template
      #trailing
      v-if="isDefined(modelValue) && !disabled"
    >
      <u-button
        color="neutral"
        variant="link"
        :icon="ui.icons.close"
        @click="modelValue = undefined"
      />
    </template>
  </u-input>
</template>
