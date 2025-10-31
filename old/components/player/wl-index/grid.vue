<script setup lang="ts">
const { index, status } = defineProps<{
  index: WLIndexInterface[]
  status: APIStatusType
  first_name: string
  last_name: string
}>()
const { icons } = useAppConfig()

const categories = ["Match Record", "Pressure Points", "Environment", "Other"]
const levels = ["Tour", "Challenger", "ITF"]

const categoryColours: Record<(typeof categories)[number], string> = {
  "Match Record": "success",
  "Pressure Points": "warning",
  Environment: "joint",
  Other: "info"
}

const findValue = (stat: string, level: string) => {
  const item = index.find(item => item.stat === stat && item.level === level)!
  return {
    ytd_titles: item.ytd_titles,
    ytd_value: item.ytd_value,
    ytd_wins: item.ytd_wins,
    ytd_losses: item.ytd_losses,
    wins: item.wins,
    losses: item.losses,
    value: item.value,
    titles: item.titles
  }
}

const getTotalIndex = (stat: string) => {
  const filteredItems = index.filter(item => item.stat === stat)
  const totalWins = filteredItems.reduce((acc, item) => acc + item.wins, 0)
  const totalLosses = filteredItems.reduce((acc, item) => acc + item.losses, 0)
  const ytdWins = filteredItems.reduce((acc, item) => acc + item.ytd_wins, 0)
  const ytdLosses = filteredItems.reduce((acc, item) => acc + item.ytd_losses, 0)
  return {
    value: totalWins + totalLosses === 0 ? 0 : totalWins / (totalWins + totalLosses),
    ytd_value: ytdWins + ytdLosses === 0 ? 0 : ytdWins / (ytdWins + ytdLosses)
  }
}
</script>

<template>
  <div class="overflow-y-auto scrollbar-thin scrollbar-thumb-primary-600 scrollbar-track-transparent p-2">
    <dashboard-subpanel
      v-if="index.length || status === 'pending'"
      v-for="category in categories"
      :key="category"
      :title="category"
      :id="kebabCase(category)"
    >
      <u-page-list class="space-y-3">
        <u-card
          v-if="index.length"
          v-for="stat in useArrayUnique(index.filter(item => item.category === category).map(item => item.stat)).value"
          :key="stat"
          :class="`ring-${categoryColours[category]}`"
          :ui="{ header: 'font-semibold' }"
        >
          <template #header>
            {{ stat }}
          </template>
          <div
            class="grid text-center text-sm"
            :class="['Match Record', 'Environment'].includes(category) ? 'grid-cols-7' : 'grid-cols-5'"
          >
            <div
              class="font-semibold"
              :class="['Match Record', 'Environment'].includes(category) ? 'col-span-3' : 'col-span-2'"
            >
              YTD
            </div>
            <div />
            <div
              class="font-semibold"
              :class="['Match Record', 'Environment'].includes(category) ? 'col-span-3' : 'col-span-2'"
            >
              Career
            </div>
            <div v-if="['Match Record', 'Environment'].includes(category)"> Titles </div>
            <div>Index</div>
            <div>Win-Loss</div>
            <div />
            <div>Win-Loss</div>
            <div>Index</div>
            <div v-if="['Match Record', 'Environment'].includes(category)"> Titles </div>
          </div>
          <div
            v-for="level in levels"
            :key="level"
            class="grid text-center space-y-1 text-sm font-semibold"
            :class="['Match Record', 'Environment'].includes(category) ? 'grid-cols-7' : 'grid-cols-5'"
          >
            <div v-if="['Match Record', 'Environment'].includes(category)">
              {{ findValue(stat, level).ytd_titles }}
            </div>
            <div>
              {{ findValue(stat, level).ytd_value.toFixed(3) }}
            </div>
            <div> {{ findValue(stat, level).ytd_wins }}-{{ findValue(stat, level).ytd_losses }} </div>
            <div class="row-span-2 my-auto font-medium">{{ level }}</div>
            <div> {{ findValue(stat, level).wins }}-{{ findValue(stat, level).losses }} </div>
            <div>
              {{ findValue(stat, level).value.toFixed(3) }}
            </div>
            <div v-if="['Match Record', 'Environment'].includes(category)">
              {{ findValue(stat, level).titles }}
            </div>
            <div :class="['Match Record', 'Environment'].includes(category) ? 'col-span-3' : 'col-span-2'">
              <u-progress
                v-model="findValue(stat, level).ytd_value"
                :max="1"
                inverted
                :ui="{
                  indicator: `bg-${categoryColours[category]}`
                }"
              />
            </div>
            <div :class="['Match Record', 'Environment'].includes(category) ? 'col-span-3' : 'col-span-2'">
              <u-progress
                v-model="findValue(stat, level).value"
                :max="1"
                :ui="{
                  indicator: `bg-${categoryColours[category]}`
                }"
              />
            </div>
          </div>
          <div
            class="grid text-center space-y-1 text-sm font-semibold"
            :class="['Match Record', 'Environment'].includes(category) ? 'grid-cols-7' : 'grid-cols-5'"
          >
            <div v-if="['Match Record', 'Environment'].includes(category)">
              {{ index.filter(item => item.stat === stat).reduce((acc, item) => acc + item.ytd_titles!, 0) }}
            </div>
            <div>
              {{ useAverage(index.filter(item => item.stat === stat).map(item => item.ytd_value)).value.toFixed(3) }}
            </div>
            <div>
              {{ index.filter(item => item.stat === stat).reduce((acc, item) => acc + item.ytd_wins, 0) }}-{{
                index.filter(item => item.stat === stat).reduce((acc, item) => acc + item.ytd_losses, 0)
              }}
            </div>
            <div class="row-span-2 my-auto font-medium">Total</div>
            <div>
              {{ index.filter(item => item.stat === stat).reduce((acc, item) => acc + item.wins, 0) }}-{{
                index.filter(item => item.stat === stat).reduce((acc, item) => acc + item.losses, 0)
              }}
            </div>
            <div>
              {{ useAverage(index.filter(item => item.stat === stat).map(item => item.value)).value.toFixed(3) }}
            </div>
            <div v-if="['Match Record', 'Environment'].includes(category)">
              {{ index.filter(item => item.stat === stat).reduce((acc, item) => acc + item.titles!, 0) }}
            </div>
            <div :class="['Match Record', 'Environment'].includes(category) ? 'col-span-3' : 'col-span-2'">
              <u-progress
                v-model="getTotalIndex(stat).ytd_value"
                :max="1"
                inverted
                :ui="{
                  indicator: `bg-${categoryColours[category]}`
                }"
              />
            </div>
            <div :class="['Match Record', 'Environment'].includes(category) ? 'col-span-3' : 'col-span-2'">
              <u-progress
                v-model="getTotalIndex(stat).value"
                :max="1"
                :ui="{
                  indicator: `bg-${categoryColours[category]}`
                }"
              />
            </div>
          </div>
        </u-card>
        <loading-base
          v-else
          v-for="_ in 3"
          :key="_"
        />
      </u-page-list>
    </dashboard-subpanel>
    <error-message
      v-else
      :icon="icons.noChart"
      :message="`No win-loss index available for ${first_name} ${last_name}`"
    />
  </div>
</template>
