<script setup lang="ts">
import { REFEREE_TYPE_MAPPING } from "#imports"

const route = useRoute("match")
const supabase = useSupabaseClient()

const {
  data: referees,
  pending,
  refresh
} = await useAsyncData(
  () => `match-referees-${route.params.match_id}`,
  async () => {
    const { data, error } = await supabase
      .schema("football")
      .from("match_referee")
      .select("id, type, ...people(full_name, country!nationality_country_id(*))")
      .eq("match_id", route.params.match_id)

    if (error || !data) {
      console.error("Error fetching referees:", error)
      return []
    }

    return data
  },
  { default: () => [] }
)
</script>

<template>
  <u-card>
    <template #header>
      <div class="font-semibold">Referees</div>

      <dev-only>
        <lazy-match-add-referees
          hydrate-on-idle
          @refresh="refresh"
        />
      </dev-only>
    </template>

    <div class="columns-2 space-y-2">
      <u-page-feature
        v-for="referee in referees"
        :key="referee.id"
        :title="referee.full_name!"
        :description="REFEREE_TYPE_MAPPING[referee.type]"
        :icon="referee.country?.icon"
        class="break-inside-avoid"
      />
    </div>
  </u-card>
</template>
