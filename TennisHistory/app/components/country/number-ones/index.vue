<script setup lang="ts">
const props = defineProps<{ country: CountryInterface }>()

const supabase = useSupabaseClient()

const { data: players, pending } = await useAsyncData(
  () => `${props.country.id}-number-ones`,
  async () => {
    const { data, error } = await supabase
      .from("players")
      .select(
        "id, first_name, last_name, tour, ch_singles, ch_singles_date, ch_doubles, ch_doubles_date, player_country_mapping!inner(start_date, end_date)"
      )
      .or("ch_singles.eq.1, ch_doubles.eq.1")
      .eq("player_country_mapping.country_id", props.country.id)
      .order("last_name", { ascending: true })
      .order("first_name", { ascending: true })
      .order("id", { ascending: true })

    if (error || !data) {
      console.error("Error fetching players:", error)
      return []
    }

    return data
  },
  { default: () => [] }
)
</script>

<template>
  <dashboard-subpanel
    title="Players who achieved No. 1 ranking"
    :icon="ICONS.one"
  >
    <u-page-columns v-if="players.length || pending">
      <country-number-ones-card
        v-for="player in players"
        :key="player.id"
        :player
      />

      <loading-card
        v-if="pending"
        v-for="_ in 3"
        :key="_"
      />
    </u-page-columns>

    <empty
      v-else
      :title="`No players have achived the No. 1 ranking representing ${country.name}`"
      :icon="ICONS.peopleOff"
    />
  </dashboard-subpanel>
</template>
