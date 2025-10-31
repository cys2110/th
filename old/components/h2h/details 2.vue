<script setup lang="ts">
import { H2hCardDetails, H2hListDetails } from "#components"

const { c1, c2 } = defineProps<{ c1: CountryInterface; c2: CountryInterface }>()
const appConfig = useAppConfig()
const route = useRoute()
const toast = useToast()
const { viewMode } = useViewMode()

const p1Name = computed(() => decodeName(route.params.p1Name as string))
const p2Name = computed(() => decodeName(route.params.p2Name as string))

// API call
const { data: h2h, status } = await useFetch<{
  p1: H2HPlayerInterface
  p2: H2HPlayerInterface
  p1Wins: number
  p2Wins: number
}>("/api/h2h", {
  query: { p1Id: route.params.p1Id, p2Id: route.params.p2Id },
  onResponseError: ({ error }) => {
    toast.add({
      title: `Error fetching head to head for ${p1Name.value} v. ${p2Name.value}`,
      description: error?.message,
      icon: appConfig.ui.icons.error,
      color: "error"
    })
    showError(error!)
  }
})
</script>

<template>
  <component
    :is="viewMode === 'cards' ? H2hCardDetails : H2hListDetails"
    :key="viewMode"
    :h2h
    :c1
    :c2
    :status
  />
</template>
