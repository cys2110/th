<script setup lang="ts">
const props = defineProps<{
  roundIndex: number
  matches: DrawMatch[]
  contestants: Draw["contestants"]
  selectedContestantId?: string | null
  baseIndexValue: number
  handleHighlightPath: (contestantId: string | null) => void
}>()

const [defineRoundTemplate, reuseRoundTemplate] = createReusableTemplate()

const showBronzeWrapper = computed(() => {
  return props.matches.some(m => m.isBronzeMatch && m.order === 1)
})

const isVisible = computed(() => props.roundIndex >= props.baseIndexValue - 1 && props.roundIndex <= props.baseIndexValue + 1)
</script>

<template>
  <define-round-template>
    <div
      class="relative grid auto-rows-fr items-stretch min-w-45 max-w-full"
      :class="{ collapsed: !isVisible, hidden: !isVisible }"
      :round-index="roundIndex"
    >
      <edition-draws-match-card
        v-for="match in matches"
        :key="match.order"
        :match
        :contestants
        :selected-contestant-id="selectedContestantId"
        :handle-highlight-path
      />
    </div>
  </define-round-template>

  <div
    v-if="showBronzeWrapper"
    class="flex overflow-hidden"
  >
    <div class="grid auto-rows-fr z-2 *:first:w-6.25 *:first:min-w-0 *:first:*:left-0 *:first:*:width-0 *:first:*:**:shadow-none">
      <div class="p-0">
        <div>
          <div></div>
          <div></div>
        </div>
      </div>
    </div>
    <reuse-round-template />
  </div>

  <reuse-round-template v-else />
</template>
