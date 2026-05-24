<script setup lang="ts">
type CountryWithIcon = CountryInterface & { icon: string }

const props = withDefaults(defineProps<{ valueKey?: boolean }>(), {
  valueKey: false
})

const modelValue = defineModel<CountryWithIcon | string>()

const {
  ui: { icons }
} = useAppConfig()

const supabase = useSupabaseClient()

const {
  data: countries,
  pending,
  refresh
} = await useAsyncData(
  "countries",
  async () => {
    const { data, error } = await supabase.from("countries").select("*").order("name", { ascending: true })

    if (error || !data) {
      console.error("Error fetching countries:", error)
      return []
    }

    return data.map(country => ({ ...country, icon: getFlagCode(country) }))
  },
  { default: () => [] }
)

const selectedItems = ref<CountryWithIcon | null>()

watch(
  selectedItems,
  () => {
    if (selectedItems.value) {
      set(modelValue, props.valueKey ? selectedItems.value.id : selectedItems.value)
    }
  },
  { immediate: true }
)
</script>

<template>
  <u-input-menu
    v-model="selectedItems"
    :items="countries"
    placeholder="Country"
    :loading="pending"
    clear
    class="w-full"
    label-key="name"
  >
    <template #leading>
      <u-icon :name="selectedItems?.icon || ICONS.globe" />
    </template>

    <template #content-bottom>
      <u-button
        :icon="icons.reload"
        label="Refresh"
        block
        @click="refresh()"
      />
    </template>
  </u-input-menu>
</template>
