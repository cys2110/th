<script setup lang="ts">
import type { AsyncDataRequestStatus } from "#app"
import type { CallbackDataParams } from "echarts/types/dist/shared"

const props = defineProps<{
  data: EntryInfoType[]
  status: AsyncDataRequestStatus
}>()

const {
  params: { year }
} = useRoute("edition")
const open = ref(false)

const tournamentStore = useTournamentStore()
const toast = useToast()

const treeData = computed(() => {
  const groupedData = []

  const uniqueRelationships = useArrayUnique(props.data.map(team => team.relationship))

  for (const relationship of uniqueRelationships.value) {
    const relationshipChildren = []

    for (const tour of tournamentStore.tours) {
      const filteredTeams = props.data.filter(team => team.relationship === relationship && team.tour === tour)
      const typeNodes = []

      if (filteredTeams.length > 0) {
        for (const type of ["Singles", "Doubles"]) {
          const typeTeams = filteredTeams.filter(t => t.type === type)

          if (typeTeams.length > 0) {
            typeNodes.push({
              name: type,
              children: typeTeams.map(t => {
                const childNodes = []
                if (t.rank) {
                  if (t.status === "PR") {
                    childNodes.push({ name: `PR ${t.rank}` })
                  } else {
                    childNodes.push({ name: t.rank })
                  }
                }
                if (t.reason) {
                  childNodes.push({ name: t.teammate ? `${t.reason} (${t.teammate})` : t.reason })
                }

                return {
                  name: t.team.map(player => `${player.first_name} ${player.last_name}`).join(" | "),
                  value: t.team.map(player => player.id).join(" | "),
                  children: childNodes.length > 0 ? childNodes : undefined
                }
              })
            })
          }
        }

        relationshipChildren.push({
          name: tour,
          children: typeNodes
        })
      }
    }

    groupedData.push({
      name: relationship,
      children: relationshipChildren
    })
  }

  return {
    name: "Entry Information",
    children: groupedData
  }
})

// Chart configuration
const themeKey = inject(THEME_KEY)

const theme = computed(() => {
  const key = themeKey as keyof typeof COLOURS
  return COLOURS[key] ?? COLOURS.dark
})

const option = computed(() => ({
  backgroundColor: "transparent",
  textStyle: { color: theme.value.slate },
  series: [
    {
      type: "tree",
      data: [treeData.value],
      top: "1%",
      left: "20%",
      right: "20%",
      symbolSize: 7,
      label: {
        position: "top",
        verticalAlign: "middle",
        align: "right",
        fontSize: 12,
        padding: 5
      },
      leaves: {
        label: {
          position: "right",
          verticalAlign: "middle",
          align: "left"
        }
      },
      itemStyle: { color: theme.value.violet },
      expandAndCollapse: true,
      animationDuration: 550,
      animationDurationUpdate: 750,
      initialTreeDepth: 4
    }
  ]
}))

const handleClick = (params: CallbackDataParams) => {
  toast.clear()

  // @ts-expect-error
  if (params?.data?.value) {
    // @ts-expect-error
    const playersIds = params.data.value.split(" | ")
    const playerNames = params.name.split(" | ")

    toast.add({
      title: "Go to...",
      duration: Infinity,
      progress: false,
      actions: playerNames.map((name, index) => ({
        label: name,
        icon: ICONS.player,
        to: {
          name: "player",
          params: {
            id: playersIds[index],
            name: kebabCase(name)
          }
        }
      }))
    })
  }
}

watch(open, () => {
  if (!open.value) {
    toast.clear()
  }
})
onBeforeRouteLeave(() => {
  toast.clear()
})
onUnmounted(() => {
  toast.clear()
})
</script>

<template>
  <u-modal
    :title="`${tournamentStore.name} ${year}`"
    description="Entry Information"
    fullscreen
    v-model:open="open"
  >
    <u-button
      :icon="ICONS.draw"
      :ui="{ leadingIcon: 'rotate-90' }"
    />

    <template #body>
      <v-chart
        class="min-h-100 w-full"
        :theme="themeKey || 'dark'"
        :option="option"
        autoresize
        :loading="status === 'pending'"
        @click="handleClick"
      />
    </template>
  </u-modal>
</template>
