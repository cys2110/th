<script setup lang="ts">
import { kebabCase } from "lodash"

useHead({ title: "Federations" })

const supabase = useSupabaseClient()

const {
  data: confederations,
  pending,
  refresh
} = await useAsyncData(
  "confederations",
  async () => {
    const { data, error } = await supabase
      .from("confederation")
      .select("*, federations:federation(*)")
      .order("id", { ascending: true })
      .order("name", { referencedTable: "federation", ascending: true })

    if (error || !data) {
      console.error("Error fetching confederations:", error)
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
      <u-page-header title="Federations" />

      <u-page-body>
        <u-page-grid v-if="confederations.length || pending">
          <u-page-card
            v-for="confederation in confederations"
            :key="confederation.id"
            orientation="horizontal"
          >
            <nuxt-img
              v-if="confederation.logo_url"
              :src="confederation.logo_url"
              :width="90"
              class="mx-auto"
            />

            <template #title>
              <u-link
                :to="{ name: 'federation', params: { name: kebabCase(confederation.name), id: confederation.id } }"
                class="hover-link primary-link"
              >
                {{ confederation.id }}
              </u-link>
            </template>

            <template #description>
              <div class="font-semibold mb-4">{{ confederation.name }}</div>

              <div class="max-h-50 overflow-y-auto scrollbar flex flex-col">
                <u-link
                  v-for="federation in confederation.federations"
                  :key="federation.id"
                  :to="{ name: 'federation', params: { name: kebabCase(federation.name), id: federation.id } }"
                  class="hover-link primary-link"
                >
                  {{ federation.name }}
                </u-link>
              </div>
            </template>
          </u-page-card>

          <loading-card
            v-if="pending"
            v-for="_ in 6"
            :key="_"
          />
        </u-page-grid>

        <empty
          v-else
          title="No federations found"
          @refresh="refresh"
        />
      </u-page-body>
    </u-page>
  </u-container>
</template>
