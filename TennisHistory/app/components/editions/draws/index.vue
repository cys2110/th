<script setup lang="ts">
const {
  params: { edId }
} = useRoute("draws")
const tour = defineModel<keyof typeof tourEnum>("tour")
const type = defineModel<MatchTypeEnumType>("type")
const draw = defineModel<DrawEnumType>("draw")

// API call
const { data, execute } = await useFetch("/api/editions/draws", {
  query: { edId, tour, type, draw },
  default: () => [],
  immediate: false
})

const formattedData = computed<DrawInterface>(() => {
  const allData: any = get(data)
  const rounds = useArrayUnique(
    allData.map((m: any) => {
      if (!["3rd Place Match", "Bronze Medal Match"].includes(m.round)) {
        return m.round
      } else {
        return "Final"
      }
    })
  )
  const usedIds = new Set()

  const contestants: DrawInterface["contestants"] = {}
  const matches: DrawInterface["matches"] = []

  const matchIndexMapping = {
    Final: 1,
    Semifinals: 2,
    Quarterfinals: 4,
    "Round of 16": 8,
    "Round of 32": 16,
    "Round of 64": 32,
    "Round of 128": 64
  }

  const qualifyingIndexMapping = {
    "Qualifying round 3": 1,
    "Qualifying round 2": rounds.value.includes("Qualifying round 3") ? allData.filter((m: any) => m.round === "Qualifying round 3").length + 1 : 1,
    "Qualifying round 1": allData.filter((m: any) => m.round !== "Qualifying round 1").length + 1
  }

  // console.log(allData.filter((m: any) => m.round === "Qualifying round 1"))

  for (const match of allData) {
    const team1Id = match.t1?.id ?? "Bye"
    const team2Id = match.t2?.id ?? "Bye"

    if (!usedIds.has(team1Id)) {
      const object: Contestant =
        team1Id === "Bye"
          ? {
              players: [{ title: "Bye" }]
            }
          : {
              players: match.t1!.team.map((p: any) => ({
                title: `${p.first_name} ${p.last_name}`,
                nationality: p.country.id
              }))
            }

      if ((match.t1?.seed || match.t1?.status) && !match.round.includes("Qualifying")) {
        if (match.t1.seed && match.t1.status) {
          object["entryStatus"] = `${match.t1.seed} ${match.t1.status}`
        } else {
          object["entryStatus"] = match.t1.status || match.t1?.seed?.toString()
        }
      } else if ((match.t1?.q_seed || match.t1?.q_status) && match.round.includes("Qualifying")) {
        if (match.t1.q_seed && match.t1.q_status) {
          object["entryStatus"] = `${match.t1.q_seed} ${match.t1.q_status}`
        } else {
          object["entryStatus"] = match.t1.q_status || match.t1?.q_seed?.toString()
        }
      }

      contestants[team1Id] = object
      usedIds.add(team1Id)
    }

    if (!usedIds.has(team2Id)) {
      const object: Contestant =
        team2Id === "Bye"
          ? {
              players: [{ title: "Bye" }]
            }
          : {
              players: match.t2!.team.map((p: any) => ({
                title: `${p.first_name} ${p.last_name}`,
                nationality: p.country.id
              }))
            }

      if ((match.t2?.seed || match.t2?.status) && !match.round.includes("Qualifying")) {
        if (match.t2.seed && match.t2.status) {
          object["entryStatus"] = `${match.t2.seed} ${match.t2.status}`
        } else {
          object["entryStatus"] = match.t2.status || match.t2?.seed?.toString()
        }
      } else if ((match.t2?.q_seed || match.t2?.q_status) && match.round.includes("Qualifying")) {
        if (match.t2.q_seed && match.t2.q_status) {
          object["entryStatus"] = `${match.t2.q_seed} ${match.t2.q_status}`
        } else {
          object["entryStatus"] = match.t2.q_status || match.t2?.q_seed?.toString()
        }
      }
      contestants[team2Id] = object
      usedIds.add(team2Id)
    }

    const roundIndex = ["3rd Place Match", "Bronze Medal Match"].includes(match.round) ? rounds.value.length - 1 : rounds.value.indexOf(match.round)

    const matchIndex = ["3rd Place Match", "Bronze Medal Match"].includes(match.round)
      ? 1
      : !match.round.includes("Qualifying")
      ? match.match_no - matchIndexMapping[match.round as keyof typeof matchIndexMapping]
      : match.match_no - qualifyingIndexMapping[match.round as keyof typeof qualifyingIndexMapping]

    const side1Object: Side = {}
    const side2Object: Side = {}

    if (match.winning_team === "t1") {
      side1Object.isWinner = true
    } else {
      side2Object.isWinner = true
    }

    side1Object.contestantId = match.t1?.id ? team1Id : "Bye"
    side2Object.contestantId = match.t2?.id ? team2Id : "Bye"

    for (let i = 1; i <= 5; i++) {
      if (isDefined(match.team1?.[`s${i}` as keyof typeof match.team1])) {
        const s1Score: Score = {
          mainScore: match.team1[`s${i}` as keyof typeof match.team1]
        }
        const s2Score: Score = {
          mainScore: match.team2![`s${i}` as keyof typeof match.team2]
        }
        if (isDefined(match.team1[`t${i}` as keyof typeof match.team1])) {
          s1Score.subscore = match.team1[`t${i}` as keyof typeof match.team1] ?? match.team2![`t${i}` as keyof typeof match.team2] + 2
          s2Score.subscore = match.team2![`t${i}` as keyof typeof match.team2] ?? match.team1[`t${i}` as keyof typeof match.team1] + 2
        }

        if (match.team1[`s${i}` as keyof typeof match.team1] > match.team2![`s${i}` as keyof typeof match.team2]) {
          s1Score.isWinner = true
        } else if (match.team1[`s${i}` as keyof typeof match.team1] < match.team2![`s${i}` as keyof typeof match.team2]) {
          s2Score.isWinner = true
        }
        side1Object.scores = [...(side1Object.scores ?? []), s1Score]
        side2Object.scores = [...(side2Object.scores ?? []), s2Score]
      }
    }

    const matchObject: Match = {
      roundIndex,
      order: matchIndex,
      sides: [side1Object, side2Object]
    }

    if (["3rd Place Match", "Bronze Medal Match"].includes(match.round)) {
      matchObject.isBronzeMatch = true
    }

    if ((match.incomplete && match.incomplete !== "B") || match.team1?.incomplete || match.team2?.incomplete) {
      matchObject.matchStatus =
        incompleteEnum[(match.incomplete ?? match.team1?.incomplete ?? match.team2!.incomplete) as keyof typeof incompleteEnum]
    }

    if (match.date) {
      matchObject.date = useDateFormat(new Date(match.date), "DD MMMM YYYY").value
    }

    if (match.umpire) {
      matchObject.umpire = match.umpire.id
    }

    if (match.court) {
      matchObject.court = match.court
    }

    if (match.duration) {
      matchObject.duration = match.duration
    }

    matches.push(matchObject)
  }

  const lastRoundsCount = allData?.[0]?.round?.includes("Qualifying")
    ? Object.keys(contestants).length > 32
      ? 4
      : Object.keys(contestants).length > 16
      ? 3
      : Object.keys(contestants).length > 8
      ? 2
      : 0
    : 0

  return {
    rounds: rounds.value.map(round => ({
      name: round
    })),
    matches,
    contestants,
    skippedLastRoundsCount: lastRoundsCount
  } as DrawInterface
})

const wrapper = useTemplateRef<HTMLElement | null>("wrapper")
const raf = () => new Promise<void>(r => requestAnimationFrame(() => r()))

const renderBracket = async () => {
  if (!(data.value as any)?.length || !wrapper.value) return
  const val = formattedData.value
  if (!val?.matches?.length || !val?.rounds?.length) return

  await nextTick()
  await raf()
  await raf()

  // reset container before re-rendering
  wrapper.value.innerHTML = ""

  const { createBracket } = await import("bracketry")
  createBracket(val, wrapper.value, {
    getMatchTopHTML: match => {
      let text = ""
      if (match.isBronzeMatch) {
        text += "Bronze Medal Match"
        if (match.date || match.duration) {
          text += " | "
        }
      }
      if (match.date && match.duration) {
        text += `Date: ${match.date} | Duration: ${match.duration}`
      } else if (match.date) {
        text += `Date: ${match.date}`
      } else if (match.duration) {
        text += `Duration: ${match.duration}`
      }
      return `<div class="text-[11px] mb-2 text-primary/80">${text}</div>`
    },
    getEntryStatusHTML: entryStatus => {
      return `<div style="width: 24px; text-align: center">${entryStatus ?? ""}</div>`
    },
    getMatchBottomHTML: match => {
      let text = ""
      if (match.umpire && match.court) {
        text += `Umpire: ${match.umpire} | Court: ${match.court}`
      } else if (match.umpire || match.court) {
        text += `${match.umpire ? "Umpire" : "Court"}: ${match.umpire ?? match.court}`
      }
      return `<div class="text-[11px] mt-2 text-primary/80">${text}</div>`
    },
    navButtonsPosition: "overTitles",
    matchTextColor: "#64748b",
    roundTitleColor: "#64748b",
    connectionLinesWidth: 1,
    connectionLinesColor: "#4b5563",
    highlightedConnectionLinesColor: "#0ea5e9",
    highlightedPlayerTitleColor: "#0ea5e9",
    matchStatusBgColor: "#f97316",
    rootBorderColor: "transparent",
    navButtonSvgColor: "#4b5563",
    roundTitlesFontSize: 20,
    matchMinVerticalGap: 60
  })
}

onMounted(() => {
  execute()
})

watchEffect(() => {
  renderBracket()
})
</script>

<template>
  <div
    v-show="formattedData?.rounds.length"
    ref="wrapper"
    class="max-h-200 overflow-y-auto"
  />
</template>
