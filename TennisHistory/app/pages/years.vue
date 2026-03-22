<script setup lang="ts">
const id = useRouteQuery<number>("year", new Date().getFullYear(), { transform: Number })

useHead({ title: () => id.value })

const supabase = useSupabaseClient()

const { data, refresh } = await useAsyncData("years", async () => {
  const { data: tournamentsData, error: tournamentsError } = await supabase
    .from("tournaments")
    .select("id, name, established, abolished, tours")
    .or(`established.eq.${id.value}, abolished.eq.${id.value}`)

  if (tournamentsError || !tournamentsData) {
    console.error("Error fetching tournaments:", tournamentsError)
  }

  const startDate = new Date(id.value, 0, 1).toISOString()

  const endDate = new Date(id.value + 1, 0, 1).toISOString()

  const { data: playersData, error: playersError } = await supabase
    .from("players")
    .select("id, first_name, last_name, dob, dod, turned_pro, retired, hof, player_country_mapping(countries(*)), tour")
    .or(
      `turned_pro.eq.${id.value},retired.eq.${id.value},and(dob.gte.${startDate},dob.lt.${endDate}),and(dod.gte.${startDate},dod.lt.${endDate}),hof.eq.${id.value}`
    )
    .is("player_country_mapping.end_date", null)

  if (playersError || !playersData) {
    console.error("Error fetching players:", playersError)
  }

  const players = (playersData || []).map(p => ({
    id: p.id,
    first_name: p.first_name,
    last_name: p.last_name,
    country: p.player_country_mapping[0]!.countries,
    tour: p.tour,
    dob: p.dob,
    dod: p.dod,
    turned_pro: p.turned_pro,
    retired: p.retired,
    hof: p.hof
  }))

  return {
    established: (tournamentsData || []).filter(t => t.established === id.value),
    abolished: (tournamentsData || []).filter(t => t.abolished === id.value),
    turned_pro: players.filter(p => p.turned_pro === id.value),
    retired: players.filter(p => p.retired === id.value),
    hof: players.filter(p => p.hof === id.value),
    dob: players.filter(p => {
      if (!p.dob) return false

      const dob = new Date(p.dob)
      return dob.getFullYear() === id.value
    }),
    dod: players.filter(p => {
      if (!p.dod) return false

      const dod = new Date(p.dod)
      return dod.getFullYear() === id.value
    })
  }
})

watch(id, () => refresh(), { immediate: true })
</script>

<template>
  <u-container class="max-w-7xl">
    <u-page>
      <u-page-header
        headline="Years"
        :title="id.toString()"
        :ui="{ root: 'pb-4' }"
      >
        <div class="flex justify-end">
          <u-select-menu
            v-model="id"
            :items="OPEN_ERA_YEARS"
            highlight
            class="w-fit"
          />
        </div>
      </u-page-header>

      <u-page-body>
        <u-container class="max-w-5xl">
          <u-page-list class="space-y-3">
            <years-tournament
              label="established"
              :tournaments="data?.established || []"
              :year="id"
            />
            <years-tournament
              label="abolished"
              :tournaments="data?.abolished || []"
              :year="id"
            />
            <years-player
              label="born"
              placeholder="who were born"
              :players="data?.dob || []"
              :year="id"
            />
            <years-player
              label="died"
              :players="data?.dod || []"
              :year="id"
            />
            <years-player
              label="turned pro"
              :players="data?.turned_pro || []"
              :year="id"
            />
            <years-player
              label="retired"
              :players="data?.retired || []"
              :year="id"
            />
            <years-player
              label="hof"
              placeholder="inducted into the Hall of Fame"
              :players="data?.hof || []"
              :year="id"
            />
          </u-page-list>
        </u-container>
      </u-page-body>
    </u-page>
  </u-container>
</template>
