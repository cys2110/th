<script setup lang="ts">
definePageMeta({ name: "tournament" })

const {
  params: { id, name }
} = useRoute("tournament")

const selectedTab = ref<"Winners" | "Numbers">("Winners")
const tabItems = [
  { label: "Winners", value: "Winners" },
  { label: "Numbers", value: "Numbers" }
]

const { data: tournament, refresh } = await useFetch("/api/tournaments", {
  query: { id }
})

useHead({ title: () => tournament.value?.name ?? capitalCase(name) })
</script>

<template>
  <u-container class="min-h-screen flex flex-col">
    <template v-if="tournament">
      <tournaments-winners
        v-if="selectedTab === 'Winners'"
        v-model="selectedTab"
        :tournament
        :refresh
        :tabItems
      />
      <tournaments-numbers
        v-else
        v-model="selectedTab"
        :tournament
        :tabItems
      />
    </template>
  </u-container>
</template>
