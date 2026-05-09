<script setup lang="ts">
const props = defineProps<{
  side: DrawSide | undefined
  contestants: Draw["contestants"]
  opponentSide: DrawSide | undefined
  selectedContestantId?: string | null
  handleHighlightPath: (contestantId: string) => void
}>()

const {
  ui: { icons }
} = useAppConfig()

const contestant = computed(() => {
  if (!props.side) return null

  return props.contestants?.[props.side.contestantId as keyof typeof props.contestants] || null
})

const entryStatus = computed(() => {
  if (!props.side) return ""

  const status = contestant.value?.status || ""
  const seed = contestant.value?.seed || null

  if (!seed && !status) return ""

  return `(${[seed, status].filter(Boolean).join("/")})`
})

const handleSideClick = () => {
  if (props.side?.contestantId) {
    props.handleHighlightPath(props.side.contestantId)
  }
}
</script>

<template>
  <div
    class="w-full flex items-center pointer-events-auto py-1 pr-5 pl-1.75 cursor-pointer"
    :contestantId="side?.contestantId"
    :class="{
      'pointer-events-none': !side,
      'text-muted': !side?.isWinner,
      highlighted: side?.contestantId === selectedContestantId
    }"
    @click="side?.contestantId && handleSideClick()"
  >
    <div class="grid auto-rows-fr grid-cols-[auto] items-center *:whitespace-nowrap *:select-none mr-1.75 min-w-7 text-sm">
      {{ entryStatus }}
    </div>
    <div class="grid auto-rows-fr grid-cols-[auto] items-center *:whitespace-nowrap *:select-none flex-1 min-w-0 gap-y-0.5">
      <div
        v-for="player in contestant?.players"
        :key="player.id"
        class="player-wrapper flex items-center min-w-0 overflow-hidden"
      >
        <div class="mr-3.5 min-w-7">
          <country-link
            v-if="player.country"
            :country="player.country"
            icon-only
          />
        </div>
        <div
          class="flex-1 text-left text-ellipsis min-w-0 overflow-hidden pr-2.25 transition-colors"
          :class="{ 'text-primary': side?.contestantId === selectedContestantId }"
        >
          <u-link
            v-if="player.id"
            :to="{ name: 'player', params: { id: player.id, name: kebabCase(player.name) } }"
            class="hover-link highlight-link group-[.highlighted]:primary-link"
          >
            {{ player.name }}
          </u-link>
          <span v-else>{{ player.name }}</span>
        </div>
      </div>
    </div>
    <div class="grid auto-rows-fr grid-cols-[auto] items-center *:whitespace-nowrap *:select-none pr-3.5">
      <u-icon
        :name="icons.success"
        class="text-success text-lg"
        :class="{ hidden: !side?.isWinner }"
      />
    </div>
    <div class="grid auto-rows-fr grid-cols-[auto] items-center *:whitespace-nowrap *:select-none grid-flow-col gap-x-3.5">
      <div
        v-for="(score, index) in side?.scores"
        :key="index"
        class="flex overflow-visible flex-col items-center"
        :class="{ 'font-semibold': score.isWinner }"
      >
        <div class="side-own-single-score flex">
          <span>{{ score.mainScore }}</span>
          <span
            v-if="score.subScore"
            class="pl-px text-xs -mt-1 -mr-1"
          >
            {{ score.subScore }}
          </span>
        </div>
        <span class="flex overflow-hidden h-0">
          <span>{{ opponentSide?.scores?.[index]?.mainScore }}</span>
          <span
            v-if="opponentSide?.scores?.[index]?.subScore"
            class="pl-px text-xs -mt-1 -mr-3"
          >
            {{ opponentSide?.scores?.[index]?.subScore }}
          </span>
        </span>
      </div>
    </div>
  </div>
</template>
