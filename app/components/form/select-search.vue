<script setup lang="ts">
const { type, id, tour, matchType, multiple } = defineProps<{
  placeholder: string
  type: string
  block?: boolean
  icon?: string
  size?: "md"
  multiple?: boolean
  id?: string
  tour?: keyof typeof TourEnum
  matchType?: MatchType
  class?: string
}>()
const {
  ui: { icons }
} = useAppConfig()

const searchTerm = ref("")
const modelValue = defineModel<SelectOptionsType[] | SelectOptionsType>()

const { data, status, refresh } = await useFetch(`/api/${type.toLowerCase()}/search`, {
  query: { search: searchTerm, id, tour, matchType },
  default: () => []
})

const handleClear = () => {
  modelValue.value = multiple ? [] : undefined
  searchTerm.value = ""
}
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
      v-model:search-term="searchTerm"
      :multiple
      :items="data"
      :loading="status === 'pending'"
      :placeholder="`Select ${placeholder.toLowerCase()}`"
      :variant="block ? undefined : 'none'"
      :class="{ 'w-fit max-w-50': !block }"
      :icon
      :size
    >
      <template #content-bottom>
        <u-field-group>
          <venues-update
            v-if="type === 'venues'"
            :refresh
          />
          <person-update
            v-else-if="['supervisors', 'umpires', 'coaches'].includes(type)"
            :type="type === 'supervisors' ? 'Supervisor' : type === 'coaches' ? 'Coach' : 'Umpire'"
            :refresh
          />
          <u-button
            label="Clear"
            size="xs"
            @click="handleClear"
            :icon="icons.close"
            block
            class="rounded-t-none"
          />
        </u-field-group>
      </template>
    </u-input-menu>
  </div>
</template>
