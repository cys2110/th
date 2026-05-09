<script setup lang="ts">
const props = defineProps<{
  match: DrawMatch
  contestants: Draw["contestants"]
  selectedContestantId?: string | null
  handleHighlightPath: (contestantId: string | null) => void
}>()

const isEven = computed(() => props.match.order % 2 === 0 && !props.match.isBronzeMatch)
</script>

<template>
  <div
    class="flex items-center justify-center w-full relative min-h-10 box-border py-10 px-5 group"
    :class="{
      even: isEven,
      odd: !isEven,
      highlighted: match.sides?.some(side => side?.contestantId === selectedContestantId)
    }"
    :match-order="match.order"
  >
    <div class="flex w-full max-w-250 justify-center z-2 relative">
      <span class="absolute left-0 pl-1.75 w-full bottom-[calc(100%+3px)] text-muted text-sm mb-1.5">
        {{ match.date }}{{ match.date && match.duration ? " | " : "" }}{{ match.duration }}
      </span>
      <span class="absolute left-0 pl-1.75 w-full top-[calc(100%+3px)] text-muted text-sm mt-1.5">
        {{ match.court }}{{ match.court && match.umpire ? " | " : "" }}{{ match.umpire }}
      </span>
      <div class="flex-1 grid grid-rows-[minmax(0,1fr)_minmax(0,1fr)] grid-cols-[minmax(0,1fr)] gap-y-0.5">
        <edition-draws-side-row
          :side="match.sides?.[0]"
          :opponent-side="match.sides?.[1]"
          :contestants
          :selected-contestant-id
          :handle-highlight-path
        />
        <edition-draws-side-row
          :side="match.sides?.[1]"
          :opponent-side="match.sides?.[0]"
          :contestants
          :selected-contestant-id
          :handle-highlight-path
        />
      </div>
      <div
        v-if="match.matchStatus"
        class="match-status group-[.highlighted]:text-primary flex z-2 self-center transition-colors py-0.75 px-1.75 my-0 mx-1.75 border-0.5 border-muted"
      >
        <!-- {{ match.matchStatus }} -->
        <u-badge
          v-if="match.matchStatus"
          :label="match.matchStatus"
          color="error"
          variant="solid"
          size="lg"
        />
      </div>
    </div>

    <div
      class="match-lines-area group-[.highlighted]:text-primary group-[.highlighted]:border-primary absolute left-0 right-0 top-0 bottom-0 flex flex-col pointer-events-none z-1"
    >
      <div
        class="line-wrapper upper flex-1 transition-colors text-primary group-[.odd]:shadow-[2px_0_0_0_var(--ui-bg-muted)] group-[.odd]:border-b border-0.5 border-muted group-[.highlighted]:border-primary"
        :class="{
          'group-[.odd.highlighted]:shadow-[2px_0_0_0_var(--ui-primary)]':
            (match.sides?.[0]?.isWinner && match.sides?.[0]?.contestantId === selectedContestantId) ||
            (match.sides?.[1]?.isWinner && match.sides?.[1]?.contestantId === selectedContestantId)
        }"
      ></div>
      <div
        class="line-wrapper lower flex-1 transition-colors text-primary group-[.even]:shadow-[2px_0_0_0_var(--ui-bg-muted)] group-[.even]:border-t border-0.5 border-muted group-[.highlighted]:border-primary"
        :class="{
          'group-[.even.highlighted]:shadow-[2px_0_0_0_var(--ui-primary)]':
            (match.sides?.[0]?.isWinner && match.sides?.[0]?.contestantId === selectedContestantId) ||
            (match.sides?.[1]?.isWinner && match.sides?.[1]?.contestantId === selectedContestantId)
        }"
      ></div>
    </div>
  </div>
</template>
