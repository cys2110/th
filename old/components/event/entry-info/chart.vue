<script setup lang="ts">
const { teams } = defineProps<{ teams: EntryInfoInterface[] }>()
const {
  params: { year }
} = useRoute("event")
const colorMode = useColorMode()
const tours = useState<TourType[]>("tours")
const tournamentName = useState<string>("tournament-name")

const treeData = computed(() => {
  const groupedData = []

  const uniqueRelationships = useArrayUnique(teams.map(team => team.label))

  for (const relationship of uniqueRelationships.value) {
    const relationshipChildren = []
    for (const tour of tours.value) {
      const tourChildren = []
      for (const type of ["Singles", "Doubles"]) {
        const filteredTeams = teams.filter(team => team.label === relationship && team.tour === tour && team.type === type)

        if (filteredTeams.length > 0) {
          tourChildren.push({
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
              if (team.team_reason) {
                childNodes.push({ name: team.team_reason })
              } else if (team.team[0]?.reason && team.team[0].reason !== "teammate") {
                childNodes.push({ name: team.type === "Singles" ? team.team[0].reason : `${team.team[0].last_name} - ${team.team[0].reason}` })
              } else if (team.team[1]?.reason && team.team[1].reason !== "teammate") {
                childNodes.push({ name: team.team[1].reason })
              }

              return {
                name: team.team.map(player => `${player.first_name} ${player.last_name}`).join(" | "),
                children: childNodes.length > 0 ? childNodes : undefined
              }
            })
          })
        }
      }

      relationshipChildren.push({
        name: tour,
        children: tourChildren
      })
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
    :title="`${tournamentName} ${year}`"
    description="Entry Information"
    fullscreen
  >
    <u-button
      label="Chart"
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
