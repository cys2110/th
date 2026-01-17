export const useMatchStore = defineStore("match", () => {
  const name = ref("")
  const team1Name = ref("")
  const team2Name = ref("")

  return {
    name,
    team1Name,
    team2Name
  }
})
