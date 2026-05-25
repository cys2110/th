<script setup lang="ts">
const tour = defineModel<keyof typeof tourEnum>("tour")
const type = defineModel<MatchTypeEnumType>("type")
const draw = defineModel<DrawEnumType>("draw")

const {
  params: { edId }
} = useRoute("draws")
const {
  ui: { icons }
} = useAppConfig()

// API call
const { data } = await useFetch("/api/edition/draws", {
  query: { edId, tour, type, draw },
  default: () => []
})

const formattedData = computed<Draw>(() => {
  const allData: DrawMatchType[] = data.value.filter(m => m.round !== "Round robin")

  const rounds = useArrayUnique(
    allData.map((m: DrawMatchType) => {
      if (!["3rd Place Match", "Bronze Medal Match"].includes(m.round)) {
        return m.round
      } else {
        return "Final"
      }
    })
  )
  const usedIds = new Set()

  const contestants: Draw["contestants"] = {}
  const matches: Draw["matches"] = []

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
    const team1Id = match.t1?.id ?? "Bye"
    const team2Id = match.t2?.id ?? "Bye"

    if (!usedIds.has(team1Id)) {
      const object: DrawContestant =
        team1Id === "Bye"
          ? {
              players: [{ name: "BYE" }]
            }
          : {
              players: match.t1!.team.map((p: any) => ({
                id: p.id,
                name: `${p.first_name} ${p.last_name}`,
                country: p.country
              }))
            }

      if (match.round.includes("Qualifying")) {
        if (match.t1?.seed) object["seed"] = match.t1.seed
        if (match.t1?.status) object["status"] = match.t1.status
      } else {
        if (match.t1?.q_seed) object["seed"] = match.t1.q_seed
        if (match.t1?.q_status) object["status"] = match.t1.q_status
      }

      contestants[team1Id] = object
      usedIds.add(team1Id)
    }

    if (!usedIds.has(team2Id)) {
      const object: DrawContestant =
        team2Id === "Bye"
          ? {
              players: [{ name: "BYE" }]
            }
          : {
              players: match.t2!.team.map((p: any) => ({
                id: p.id,
                name: `${p.first_name} ${p.last_name}`,
                country: p.country
              }))
            }

      if (match.round.includes("Qualifying")) {
        if (match.t2?.seed) object["seed"] = match.t2.seed
        if (match.t2?.status) object["status"] = match.t2.status
      } else {
        if (match.t2?.q_seed) object["seed"] = match.t2.q_seed
        if (match.t2?.q_status) object["status"] = match.t2.q_status
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

    const side1Object: DrawSide = {}
    const side2Object: DrawSide = {}

    if (match.winning_team === "t1") {
      side1Object.isWinner = true
    } else {
      side2Object.isWinner = true
    }

    side1Object.contestantId = match.t1?.id ? team1Id : "Bye"
    side2Object.contestantId = match.t2?.id ? team2Id : "Bye"

    for (let i = 1; i <= 5; i++) {
      if (isDefined(match.team1?.[`s${i}` as keyof typeof match.team1])) {
        const s1Score: DrawScore = {
          mainScore: match.team1[`s${i}` as keyof typeof match.team1]
        }
        const s2Score: DrawScore = {
          mainScore: match.team2![`s${i}` as keyof typeof match.team2]
        }
        if (isDefined(match.team1[`t${i}` as keyof typeof match.team1])) {
          s1Score.subScore = match.team1[`t${i}` as keyof typeof match.team1] ?? match.team2![`t${i}` as keyof typeof match.team2] + 2
          s2Score.subScore = match.team2![`t${i}` as keyof typeof match.team2] ?? match.team1[`t${i}` as keyof typeof match.team1] + 2
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

    const matchObject: DrawMatch = {
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
      matchObject.duration = getDurationString(match.duration)
    }

    matches.push(matchObject)
  }

  return {
    rounds: rounds.value.map(round => ({
      name: round
    })),
    matches,
    contestants
  } as Draw
})

const getMatches = (roundIndex: number) => {
  return formattedData.value?.matches?.filter(m => m.roundIndex === roundIndex) || []
}

const selectedContestantId = ref<string | null>(null)

const handleHighlightPath = (contestantId: string | null) => {
  selectedContestantId.value = contestantId
}

const baseIndexValue = ref(0)
watch(
  () => formattedData.value,
  () => {
    set(baseIndexValue, formattedData.value?.rounds.length > 2 ? 1 : formattedData.value?.rounds.length - 2)
  }
)

const isVisible = (index: number) => index >= baseIndexValue.value - 1 && index <= baseIndexValue.value + 1
</script>

<template>
  <div
    v-if="formattedData"
    class="flex items-center gap-5"
  >
    <u-button
      :icon="icons.chevronLeft"
      @click="baseIndexValue--"
      :disabled="baseIndexValue <= 1"
      block
    />
    <u-button
      :icon="icons.chevronRight"
      @click="baseIndexValue++"
      :disabled="baseIndexValue >= formattedData.rounds.length - 1"
      block
    />
  </div>

  <div
    v-if="formattedData?.rounds.length"
    class="grid grid-cols-[auto_1fr_1fr_auto] grid-rows-[auto_auto_1fr_auto] min-w-65 min-h-62.5 max-w-full w-content h-full text-left"
  >
    <div class="w-0 min-w-full row-1 col-start-1 col-end-5 overflow-hidden pb-px border-b border-muted">
      <div class="grid grid-flow-col auto-cols-fr h-full min-w-full">
        <div
          v-for="(round, index) in formattedData.rounds"
          :key="round.name"
          class="px-5 py-2 flex overflow-hidden justify-center whitespace-nowrap"
          :class="{ hidden: !isVisible(index) }"
        >
          {{ round.name }}
        </div>
      </div>
    </div>

    <div class="col-start-1 col-end-5 row-2 overflow-y-hidden overflow-x-hidden pointer-events-none">
      <div class="grid grid-flow-col auto-cols-fr relative z-2 min-w-full min-h-full grid-rows-1 overflow-hidden py-5 px-0">
        <edition-draws-round-column
          v-for="(round, index) in formattedData.rounds"
          :key="index"
          :round-index="index"
          :matches="getMatches(index)"
          :contestants="formattedData.contestants"
          :selected-contestant-id
          :base-index-value
          :handle-highlight-path
        />
      </div>
    </div>
  </div>
</template>
