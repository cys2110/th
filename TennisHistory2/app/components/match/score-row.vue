<script setup lang="ts">
const props = defineProps<{
  set?: ConsolidatedScore
  entry: "t1" | "t2"
  entryId: string
  setNo: number
}>()

const { isAdmin } = useAuthState()

const {
  params: { match_id }
} = useRoute("match")

const updatedScore = ref<Record<string, number | null>>({})

const handleSave = () => {
  if (!Object.keys(updatedScore.value).length || !props.set) return null

  const score = {
    match_id,
    entry_id: props.entryId,
    set_no: props.setNo,
    set: updatedScore.value.set || null,
    tb: updatedScore.value.tb || null
  }

  return score
}

defineExpose({ handleSave })
</script>

<template>
  <div :class="{ 'font-semibold': set && set[`${entry}_set`] > set[`${entry === 't1' ? 't2' : 't1'}_set`] }">
    <u-field-group
      v-if="Object.keys(updatedScore).length"
      class="w-fit"
    >
      <form-input-number
        v-model="updatedScore.set"
        placeholder="Set"
        class="w-fit"
      />
      <form-input-number
        v-model="updatedScore.tb"
        placeholder="TB"
        class="w-fit"
      />
    </u-field-group>

    <template v-else-if="set">
      {{ set[`${entry}_set`] }}
      <sup v-if="isDefined(set[`${entry}_tb`])">{{ set[`${entry}_tb`] }}</sup>
    </template>

    <u-checkbox
      v-if="isAdmin"
      highlight
      :model-value="!!Object.keys(updatedScore).length"
      @update:model-value="
        () => {
          if (Object.keys(updatedScore).length) {
            updatedScore = {}
          } else {
            updatedScore = {
              set: set?.[`${entry}_set`] || null,
              tb: set?.[`${entry}_tb`] || null
            }
          }
        }
      "
    />
  </div>
</template>
