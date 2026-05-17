<script setup lang="ts">
const props = defineProps<{ startDate: string | null }>()

const {
  params: { id, edId }
} = useRoute("edition")

const {
  ui: { icons }
} = useAppConfig()

const toast = useToast()

const isOpen = ref(false)
const isScraping = ref(false)
const links = ref<Array<string>>([])

const handleSubmit = async () => {
  set(isScraping, true)

  const url = COUNTRY_DRAWS.includes(id) || id === "9210" || new Date(props.startDate!) <= new Date("2021-10-17") ? "old-matches" : "stats"

  await $fetch(`${FLASK_ROUTE}/atp/${url}`, {
    method: "POST",
    timeout: 180_000,
    "Content-Type": "application/json",
    body: JSON.stringify({
      event_id:
        id === "9210" ? `${edId}-LC`
        : COUNTRY_DRAWS.includes(id) ? `${edId}-Country`
        : `${edId}-ATP`,
      links: links.value
    })
  })
    .then((response: any) => {
      if (response.success) {
        toast.add({
          title: "Matches scraped",
          icon: icons.success,
          color: "success"
        })

        console.log(response.failed_links)

        set(isOpen, false)
      } else {
        toast.add({
          title: "Error scraping matches",
          icon: icons.error,
          color: "error"
        })
      }
    })
    .catch(e => {
      console.error(e)
    })
    .finally(() => {
      set(isScraping, false)
    })
}
</script>

<template>
  <u-modal
    title="Scrape Matches"
    v-model:open="isOpen"
  >
    <u-button :icon="ICONS.stats" />

    <template #body>
      <u-input-tags
        v-model="links"
        placeholder="Enter links"
        add-on-paste
        :convert-value="cleanLink"
        :icon="ICONS.group"
        class="w-full"
      />
    </template>

    <template #footer="{ close }">
      <u-button
        label="Scrape"
        color="success"
        block
        :icon="ICONS.download"
        :loading="isScraping"
        :loading-icon="ICONS.downloading"
        @click="handleSubmit"
      />
      <u-button
        label="Reset"
        color="warning"
        block
        :icon="icons.reload"
        @click="() => (links = [])"
      />
      <u-button
        label="Cancel"
        color="error"
        block
        :icon="icons.close"
        @click="close"
      />
    </template>
  </u-modal>
</template>
