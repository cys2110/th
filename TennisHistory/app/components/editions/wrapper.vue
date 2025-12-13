<script setup lang="ts">
const {
  name,
  params: { edId, id, year, name: paramName }
} = useRoute("edition")
const router = useRouter()

const editionPages = [
  { label: "Overview", value: "edition", icon: ICONS.overview },
  { label: "Results", value: "results", icon: ICONS.cards },
  { label: "Draws", value: "draws", icon: ICONS.draw, ui: { leadingIcon: "rotate-270" } }
]

const currentPage = computed(() => editionPages.find(page => page.value === name))

const { data: edition } = await useFetch("/api/editions", {
  key: edId,
  query: { edId }
})

useHead({
  title: () => `${currentPage.value?.label} | ${edition.value?.tournament?.name ?? capitalCase(paramName)} ${year}`
})
const tournamentName = useState("tournamentName", () => edition.value?.tournament?.name || capitalCase(paramName))

const activeRoute = computed({
  get() {
    return name
  },
  set(tab) {
    router.push({ name: tab, params: { name: paramName, id, year, edId } })
  }
})
</script>

<template>
  <u-page-header
    :title="year"
    class="border-none mb-0"
  >
    <template #headline>
      <breadcrumbs />
    </template>

    <template #description>
      <u-tabs
        v-model="activeRoute"
        :content="false"
        :items="editionPages"
        variant="link"
      />
    </template>

    <template #links>
      <slot name="header-links" />
      <u-button
        v-if="edition?.wiki_link"
        :href="edition.wiki_link"
        :icon="ICONS.wikipedia"
        target="_blank"
      />
    </template>
  </u-page-header>
</template>
