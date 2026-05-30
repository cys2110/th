<script setup lang="ts">
definePageMeta({ name: "record" })

const {
  params: { id }
} = useRoute("record")

const supabase = useSupabaseClient()

const playerStore = usePlayerStore()

const selectedType = ref<MatchEnumType>("Singles")

const {
  data: results,
  pending,
  refresh
} = await useAsyncData<Array<RecordInterface>>(
  () => `${id}-record`,
  async () => {
    const { data, error } = await supabase
      .from("record")
      .select("*")
      .eq("player_id", id)
      .eq("match_type", selectedType.value)
      .order("year", { ascending: true })

    if (error) {
      console.error("Error fetching player record:", error)
      return []
    }

    return data as RecordInterface[]
  },
  { default: () => [], watch: [selectedType] }
)

const uniqueYears = computed(() => useArrayUnique(results.value.map(ed => ed.year)).value)
</script>

<template>
  <u-container>
    <u-page>
      <player-wrapper />

      <u-page-body>
        <div class="flex justify-end">
          <u-radio-group
            v-model="selectedType"
            :items="['Singles', 'Doubles']"
            orientation="horizontal"
            highlight
          />
        </div>

        <table
          v-if="results.length || pending"
          class="w-full [&_th]:px-2 [&_th]:py-1 [&_td]:px-2 [&_td]:py-1 text-sm"
        >
          <thead class="border-b border-muted">
            <tr class="divide-x divide-default">
              <th>Year</th>
              <th>
                <u-link
                  :to="{ name: 'tournament', params: { id: 580, name: 'australian-open' } }"
                  class="hover-link primary-link"
                >
                  Australian Open
                </u-link>
              </th>
              <th>
                <u-link
                  :to="{ name: 'tournament', params: { id: 520, name: 'french-open' } }"
                  class="hover-link primary-link"
                >
                  French Open
                </u-link>
              </th>
              <th>
                <u-link
                  :to="{ name: 'tournament', params: { id: 540, name: 'wimbledon' } }"
                  class="hover-link primary-link"
                >
                  Wimbledon
                </u-link>
              </th>
              <th>
                <u-link
                  :to="{ name: 'tournament', params: { id: 560, name: 'us-open' } }"
                  class="hover-link primary-link"
                >
                  US Open
                </u-link>
              </th>
              <th>
                <!-- TODO: Double check -->
                <u-link
                  :to="{ name: 'tournament', params: { id: 96, name: 'olympics' } }"
                  class="hover-link primary-link"
                >
                  Olympics
                </u-link>
              </th>
              <th>
                <!-- TODO: Double check -->
                <u-link
                  :to="{ name: 'tournament', params: { id: 605, name: 'atp-finals' } }"
                  class="hover-link primary-link"
                >
                  ATP Finals
                </u-link>
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-default [&_td]:text-center">
            <player-record-row
              v-if="results.length"
              v-for="year in uniqueYears"
              :key="year"
              :year
              :results="results.filter(r => r.year === year)"
            />

            <tr v-else>
              <td :col-span="7">
                <loading-icon />
              </td>
            </tr>
          </tbody>
        </table>

        <empty
          v-else
          :icon="ICONS.trophyOff"
          :title="`${playerStore.fullName} has not played any major ${selectedType} matches`"
          @refresh="refresh"
        />
      </u-page-body>
    </u-page>
  </u-container>
</template>
