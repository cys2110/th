<script setup lang="ts">
const props = defineProps<{
  side: DrawSide | undefined
  entries: DrawData["entries"]
  opponentSide: DrawSide | undefined
  selectedEntryId?: string | null
  handleHighlightPath: (contestantId: string) => void
  isByeMatch: boolean
}>()

const {
  ui: { icons }
} = useAppConfig()

const entry = computed(() => {
  if (!props.side) return null

  return props.entries?.[props.side.entryId as keyof typeof props.entries]
})

const entryStatus = computed(() => {
  if (!props.side) return ""

  const status = entry.value?.status || ""
  const seed = entry.value?.seed || null

  if (!seed && !status) return ""

  return `(${[seed, status].filter(Boolean).join("/")})`
})

const handleSideClick = () => {
  if (props.side?.entryId) {
    props.handleHighlightPath(props.side.entryId)
  }
}
</script>

<template>
  <div
    class="w-full flex items-center pointer-events-auto py-1 pr-5 pl-1.75 cursor-pointer text-sm"
    :class="{
      'pointer-events-none': !side,
      'text-muted': !side?.isWinner,
      highlighted: side?.entryId === selectedEntryId
    }"
    @click="side?.entryId && handleSideClick()"
  >
    <div class="grid auto-rows-fr grid-cols-[auto] items-center *:whitespace-nowrap *:select-none mr-1.75 min-w-7 text-sm">
      {{ entryStatus }}
    </div>
    <div
      class="grid auto-rows-fr grid-cols-[auto] *:select-none min-w-7 text-sm"
      :class="entry?.team && entry?.team.length > 1 ? 'mr-5' : 'mr-3'"
    >
      <div class="relative flex items-center">
        <country-link
          v-for="(player, index) in entry?.team"
          :key="player.id"
          :country="player.country!"
          icon-only
          class="absolute"
          :class="{ 'z-10 left-3': index === 1 }"
        />
      </div>
    </div>
    <div class="grid auto-rows-fr grid-cols-[auto] items-center *:whitespace-nowrap *:select-none flex-1 min-w-0 gap-y-0.5">
      <div v-if="isByeMatch && !side?.isWinner"> BYE </div>
      <div
        v-else-if="entry"
        class="flex items-center gap-1"
      >
        <template
          v-for="(player, index) in entry?.team"
          :key="player.id"
        >
          <span v-if="index > 0"> / </span>

          <div
            class="truncate text-ellipsis min-w-0 transition-colors"
            :class="{ 'text-primary': side?.entryId === selectedEntryId }"
          >
            <u-link
              v-if="player.id"
              :to="{ name: 'player', params: { id: player.id, name: kebabCase(player.full_name || '—') } }"
              class="hover-link highlight-link group-[.highlighted]:primary-link"
            >
              {{ player.full_name }}
            </u-link>
            <span v-else>{{ player.full_name }}</span>
          </div>
        </template>
      </div>
      <div v-else>Alternate</div>
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
            v-if="score.tiebreak"
            class="pl-px text-xs -mt-1 -mr-1"
          >
            {{ score.tiebreak }}
          </span>
        </div>
        <span class="flex overflow-hidden h-0">
          <span>{{ opponentSide?.scores?.[index]?.mainScore }}</span>
          <span
            v-if="opponentSide?.scores?.[index]?.tiebreak"
            class="pl-px text-xs -mt-1 -mr-3"
          >
            {{ opponentSide?.scores?.[index]?.tiebreak }}
          </span>
        </span>
      </div>
    </div>
  </div>
</template>
