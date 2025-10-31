<script setup lang="ts">
import { parseDuration } from "@internationalized/date"
const {
  params: { edId, tour }
} = useRoute("draws")
const type = defineModel<MatchType>("type")
const draw = defineModel<DrawType>("draw")

// API call
const { data } = await useFetch<any>("/api/events/draws", {
  query: { edId, tour, type, draw },
  default: () => []
})

const formattedData = computed<DrawInterface>(() => {
  const allData = get(data)
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

  for (const match of allData) {
    const team1Id = match.f1?.id ?? "Bye"
    const team2Id = match.f2?.id ?? "Bye"

    if (!usedIds.has(team1Id)) {
      const object: DrawContestantInterface =
        team1Id === "Bye"
          ? {
              players: [{ title: "Bye" }]
            }
          : {
              players: match.t1.map((p: any) => ({
                title: `${p.first_name} ${p.last_name}`,
                nationality: p.country.id
              }))
            }

      if ((match.f1?.seed || match.f1?.status) && !match.round.includes("Qualifying")) {
        if (match.f1.seed && match.f1.status) {
          object["entryStatus"] = `${match.f1.seed} ${match.f1.status}`
        } else {
          object["entryStatus"] = match.f1.status || match.f1.seed.toString()
        }
      } else if ((match.f1?.q_seed || match.f1?.q_status) && match.round.includes("Qualifying")) {
        if (match.f1.q_seed && match.f1.q_status) {
          object["entryStatus"] = `${match.f1.q_seed} ${match.f1.q_status}`
        } else {
          object["entryStatus"] = match.f1.q_status || match.f1.q_seed.toString()
        }
      }

      contestants[team1Id] = object
      usedIds.add(team1Id)
    }

    if (!usedIds.has(team2Id)) {
      const object: DrawContestantInterface =
        team2Id === "Bye"
          ? {
              players: [{ title: "Bye" }]
            }
          : {
              players: match.t2.map((p: any) => ({
                title: `${p.first_name} ${p.last_name}`,
                nationality: p.country.id
              }))
            }

      if ((match.f2?.seed || match.f2?.status) && !match.round.includes("Qualifying")) {
        if (match.f2.seed && match.f2.status) {
          object["entryStatus"] = `${match.f2.seed} ${match.f2.status}`
        } else {
          object["entryStatus"] = match.f2.status || match.f2.seed.toString()
        }
      } else if ((match.f2?.q_seed || match.f2?.q_status) && match.round.includes("Qualifying")) {
        if (match.f2.q_seed && match.f2.q_status) {
          object["entryStatus"] = `${match.f2.q_seed} ${match.f2.q_status}`
        } else {
          object["entryStatus"] = match.f2.q_status || match.f2.q_seed.toString()
        }
      }
      contestants[team2Id] = object
      usedIds.add(team2Id)
    }

    const roundIndex = ["3rd Place Match", "Bronze Medal Match"].includes(match.round) ? rounds.value.length - 1 : rounds.value.indexOf(match.round)

    const matchIndex = ["3rd Place Match", "Bronze Medal Match"].includes(match.round)
      ? 1
      : !match.round.includes("Qualifying")
      ? match.match.match_no - matchIndexMapping[match.round as keyof typeof matchIndexMapping]
      : match.match.match_no - qualifyingIndexMapping[match.round as keyof typeof qualifyingIndexMapping]

    const side1Object: DrawSideInterface = {}
    const side2Object: DrawSideInterface = {}

    if (match.winner === "t1") {
      side1Object.isWinner = true
    } else {
      side2Object.isWinner = true
    }

    side1Object.contestantId = match.f1?.id ? team1Id : "Bye"
    side2Object.contestantId = match.f2?.id ? team2Id : "Bye"

    for (let i = 1; i <= 5; i++) {
      if (isDefined(match["s1"]?.[`s${i}` as keyof typeof match.s1])) {
        const s1Score: DrawScoreInterface = {
          mainScore: match.s1[`s${i}` as keyof typeof match.s1]
        }
        const s2Score: DrawScoreInterface = {
          mainScore: match.s2[`s${i}` as keyof typeof match.s2]
        }
        if (isDefined(match.s1[`t${i}` as keyof typeof match.s1])) {
          s1Score.subscore = match.s1[`t${i}` as keyof typeof match.s1] ?? match.s2[`t${i}` as keyof typeof match.s2] + 2
          s2Score.subscore = match.s2[`t${i}` as keyof typeof match.s2] ?? match.s1[`t${i}` as keyof typeof match.s1] + 2
        }

        if (match.s1[`s${i}` as keyof typeof match.s1] > match.s2[`s${i}` as keyof typeof match.s2]) {
          s1Score.isWinner = true
        } else if (match.s1[`s${i}` as keyof typeof match.s1] < match.s2[`s${i}` as keyof typeof match.s2]) {
          s2Score.isWinner = true
        }
        side1Object.scores = [...(side1Object.scores ?? []), s1Score]
        side2Object.scores = [...(side2Object.scores ?? []), s2Score]
      }
    }

    const matchObject: DrawMatchInterface = {
      roundIndex,
      order: matchIndex,
      sides: [side1Object, side2Object]
    }

    if (["3rd Place Match", "Bronze Medal Match"].includes(match.round)) {
      matchObject.isBronzeMatch = true
    }

    if ((match.match.incomplete && match.match.incomplete !== "B") || match.s1?.incomplete || match.s2?.incomplete) {
      matchObject.matchStatus = IncompleteEnum[(match.match.incomplete ?? match.s1?.incomplete ?? match.s2.incomplete) as keyof typeof IncompleteEnum]
    }

    if (match.match.date) {
      matchObject.date = useDateFormat(new Date(match.match.date), "DD MMMM YYYY").value
    }

    if (match.match.umpire) {
      matchObject.umpire = match.match.umpire
    }

    if (match.match.court) {
      matchObject.court = match.match.court
    }

    if (match.match.duration) {
      const duration = parseDuration(match.match.duration)
      const hours = Math.floor(duration.seconds / 3600)
      const minutes = Math.floor((duration.seconds % 3600) / 60)
      const seconds = duration.seconds % 60
      matchObject.duration = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
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

watchEffect(async () => {
  if (!data.value?.length || !wrapper.value) return
  const val = formattedData.value
  if (!val?.matches?.length || !val?.rounds?.length) return

  await nextTick()

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
})
</script>

<template>
  <div
    v-if="formattedData?.rounds.length"
    ref="wrapper"
    class="max-h-200 overflow-y-auto"
  />
</template>
