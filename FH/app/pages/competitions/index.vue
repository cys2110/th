<script setup lang="ts">
import { COMPETITION_CATEGORY_MAPPING, COMPETITION_TYPE_MAPPING } from "#imports"
import { kebabCase } from "lodash"

useHead({ title: "Competitions" })

const supabase = useSupabaseClient()

const {
  data: competitions,
  pending,
  refresh
} = await useAsyncData(
  "competitions",
  async () => {
    const { data, error } = await supabase
      .from("competition")
      .select("*, national_association(*), confederation(*)")
      .order("name", { ascending: true })

    if (error || !data) {
      console.error("Error fetching competitions:", error)
      return []
    }

    return data
  },
  { default: () => [] }
)
</script>

<template>
  <u-container>
    <u-page>
      <u-page-header title="Competitions">
        <template #links>
          <dev-only>
            <lazy-competition-create hydrate-on-idle />
          </dev-only>
        </template>
      </u-page-header>

      <u-page-body>
        <u-page-grid>
          <u-page-card
            v-for="competition in competitions"
            :key="competition.id"
            :title="competition.name"
            :to="{ name: 'competition', params: { name: kebabCase(competition.name), id: competition.id } }"
            orientation="horizontal"
            :ui="{ leading: 'space-x-2' }"
          >
            <nuxt-img
              v-if="competition.emblem_url"
              :src="competition.emblem_url"
              :width="90"
              class="mx-auto"
            />

            <template #leading>
              <u-badge :label="COMPETITION_CATEGORY_MAPPING[competition.category]" />

              <u-badge
                :label="COMPETITION_TYPE_MAPPING[competition.type]"
                color="secondary"
              />

              <u-badge
                v-if="competition.division_level"
                :label="competition.division_level"
                color="info"
              />
            </template>

            <template #description>
              <div v-if="competition.fifa_governed">FIFA</div>

              <u-link
                v-else
                :to="{
                  name: 'federation',
                  params: {
                    id: competition.national_association_id || competition.confederation_id!,
                    name: kebabCase(competition.national_association?.name || competition.confederation!.name)
                  }
                }"
                @click.stop
                class="hover-link primary-link"
              >
                {{ competition.national_association?.name || competition.confederation!.name }}
              </u-link>
            </template>
          </u-page-card>
        </u-page-grid>
      </u-page-body>
    </u-page>
  </u-container>
</template>
