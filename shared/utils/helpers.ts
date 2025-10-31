export const destructureMid = (mid: string) => {
  const parts = mid.split("")
  const [drawPart, typePart, ...numberParts] = parts
  const draw: DrawType = drawPart === "m" ? "Main" : "Qualifying"
  const type: MatchType = typePart === "d" ? "Doubles" : "Singles"
  const number = numberParts.join("").trim()
  return { draw, type, match_no: Number(number) }
}

export const percentage = (value1: number, value2: number) => Math.round((value1 / value2) * 100)
