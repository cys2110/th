<script setup lang="ts">
const { data } = defineProps<{ data: EntryInfoType[] }>()

const {
  params: { year }
} = useRoute("edition")
const colorMode = useColorMode()

const tournamentName = useState("tournamentName")
const tours = useArrayUnique(data.map(entry => entry.tour)).value

const treeData = computed(() => {
  const groupedData = []

  const uniqueRelationships = useArrayUnique(data.map(team => team.relationship))

  for (const relationship of uniqueRelationships.value) {
    const relationshipChildren = []

    for (const tour of tours) {
      const filteredTeams = data.filter(team => team.relationship === relationship && team.tour === tour)
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
      initialTreeDepth: 4
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
