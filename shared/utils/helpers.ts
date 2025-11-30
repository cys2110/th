import type { DrawEnumType, MatchTypeEnumType } from "../types/schemas"

export const constructMid = (draw: DrawEnumType, type: MatchTypeEnumType, match_no: number) => {
  const drawPrefix = draw === "Main" ? "m" : "q"
  const typePrefix = type === "Doubles" ? "d" : "s"
  const matchNo = match_no.toString().padStart(3, "0")
  return `${drawPrefix}${typePrefix}${matchNo}`
}

export const destructureMid = (mid: string) => {
  const parts = mid.split("")
  const [drawPrefix, typePrefix, ...matchNo] = parts
  const draw = drawPrefix === "m" ? "Main" : "Qualifying"
  const type = typePrefix === "d" ? "Doubles" : "Singles"
  const match_no = Number(matchNo.join("").trim())
  return { draw, type, match_no }
}

export const percentage = (value1: number, value2: number) => (value2 === 0 ? 0 : Math.round((value1 / value2) * 100))
