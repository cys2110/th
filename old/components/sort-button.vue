<script setup lang="ts">
const modelValue = defineModel<Record<string, SortType>[]>()
const { type = "alpha", keyName } = defineProps<{ label?: string; type?: "alpha" | "number"; keyName: string }>()

const isSorted = computed(() => {
  const sortObj = get(modelValue)?.find(s => Object.keys(s)[0] === keyName)
  return sortObj ? sortObj[keyName] : undefined
})

const getIcon = computed(() => {
  if (get(isSorted) === "ASC") {
    return type === "alpha" ? ICONS.sortAlphaUp : ICONS.sortNumberUp
  } else if (get(isSorted) === "DESC") {
    return type === "alpha" ? ICONS.sortAlphaDown : ICONS.sortNumberDown
  }
  return type === "alpha" ? ICONS.sortAlpha : ICONS.sortNumber
})

const sortOptions = computed(() => [
  {
    label: "Asc",
    type: "checkbox" as const,
    icon: type === "alpha" ? ICONS.sortAlphaUp : ICONS.sortNumberUp,
    checked: get(isSorted) === "ASC",
    onSelect: () => {
      if (get(isSorted) === "ASC") {
        set(
          modelValue,
          get(modelValue)?.filter(s => Object.keys(s)[0] !== keyName)
        )
      } else {
        if (get(isSorted)) {
          set(
            modelValue,
            get(modelValue)?.map(s => (Object.keys(s)[0] === keyName ? { [keyName]: "ASC" } : s))
          )
        } else {
          set(modelValue, [...(get(modelValue) || []), { [keyName]: "ASC" }])
        }
      }
    }
  },
  {
    label: "Desc",
    type: "checkbox" as const,
    icon: type === "alpha" ? ICONS.sortAlphaDown : ICONS.sortNumberDown,
    checked: get(isSorted) === "DESC",
    onSelect: () => {
      if (get(isSorted) === "DESC") {
        set(
          modelValue,
          get(modelValue)?.filter(s => Object.keys(s)[0] !== keyName)
        )
      } else {
        if (get(isSorted)) {
          set(
            modelValue,
            get(modelValue)?.map(s => (Object.keys(s)[0] === keyName ? { [keyName]: "DESC" } : s))
          )
        } else {
          set(modelValue, [...(get(modelValue) || []), { [keyName]: "DESC" }])
        }
      }
    }
  }
])
</script>

<template>
  <u-dropdown-menu :items="sortOptions">
    <u-button
      color="neutral"
      variant="ghost"
      :label
      :icon="getIcon"
      class="-mx-2.5 data-[state=open]:bg-elevated"
    />
  </u-dropdown-menu>
</template>
