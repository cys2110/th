<script setup lang="ts">
const { data } = defineProps<{ data: EntryInfoType[] }>()

const {
  params: { year, tour, name }
} = useRoute("event")
const colorMode = useColorMode()
const tournamentName = useState("tournament-name")

const treeData = computed(() => {
  const groupedData = []

  const uniqueRelationships = useArrayUnique(data.map(team => team.relationship))

  for (const relationship of uniqueRelationships.value) {
    const relationshipChildren = []
    for (const type of ["Singles", "Doubles"]) {
      const filteredTeams = data.filter(team => team.relationship === relationship && team.type === type)

      if (filteredTeams.length > 0) {
        relationshipChildren.push({
          name: type,
          children: filteredTeams.map(team => {
            const childNodes = []
            if (team.rank) {
              if (team.status === "PR") {
                childNodes.push({ name: `PR ${team.rank}` })
              } else {
                childNodes.push({ name: team.rank })
              }
            }
            if (team.reason) {
              childNodes.push({ name: team.teammate ? `${team.reason} (${team.teammate})` : team.reason })
            }

            return {
              name: team.team.map(player => `${player.first_name} ${player.last_name}`).join(" | "),
              children: childNodes.length > 0 ? childNodes : undefined
            }
          })
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

const option = computed(() => ({
  backgroundColor: "transparent",
  darkMode: colorMode.value === "dark",
  textStyle: { color: colorMode.value === "dark" ? COLOURS.darkText : COLOURS.lightText },
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
        fontSize: 12
      },
      leaves: {
        label: {
          position: "right",
          verticalAlign: "middle",
          align: "left"
        }
      },
      itemStyle: { color: COLOURS.violet700 },
      expandAndCollapse: true,
      animationDuration: 550,
      animationDurationUpdate: 750,
      initialTreeDepth: 3
    }
  ]
}))
</script>

<template>
  <u-modal
    :title="`${tournamentName} ${year} ${tour}`"
    description="Entry Information"
    fullscreen
  >
    <u-button
      :icon="ICONS.draw"
      :ui="{ leadingIcon: 'rotate-90' }"
    />

    <template #body>
      <v-chart
        class="min-h-200 w-full"
        :option
        :autoresize="true"
      />
    </template>
  </u-modal>
</template>
