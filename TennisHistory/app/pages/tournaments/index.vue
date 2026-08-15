<script setup lang="ts">
import { type Tables } from "~/types/database.types"
import { set } from "@vueuse/core"

type TournamentType = Tables<{ schema: "tennis" }, "tournament">

useHead({ title: "Tournaments" })

const route = useRoute("tournaments")
const supabase = useSupabaseClient()

const count = ref(0)
const tournaments = ref<Array<TournamentType>>([])
const canLoadMore = ref(false)
const offset = ref(0)

const { pending, execute, refresh } = await useAsyncData(
  () => `tournaments-${JSON.stringify(route.query)}`,
  async () => {
    const query = supabase
      .schema("tennis")
      .from("tournament")
      .select("*", { count: "exact" })
      .range(toValue(offset), toValue(offset) + 29)

    const { data, count: countData, error } = await query

    if (error || !data) {
      console.error("Error fetching tournaments:", error)
      return []
    }

    set(canLoadMore, data.length + tournaments.value.length < (countData || 0))
    set(count, countData || 0)
    set(tournaments, tournaments.value.concat(data))

    return data
  },
  {
    immediate: false,
    lazy: true,
    default: () => [],
    watch: [offset] // triggers when offset changes
  }
)

const loadMore = () => {
  if (pending.value) return

  offset.value += 30
}
</script>

<template>
  <div> Page: tournaments/index </div>
</template>
