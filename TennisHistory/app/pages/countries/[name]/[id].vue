<script setup lang="ts">
definePageMeta({ name: "country" })

const {
  params: { id, name }
} = useRoute("country")

const { data: country, error } = await useFetch("/api/country", {
  query: { id }
})

watch(
  error,
  () => {
    if (error.value) {
      if (error.value.statusMessage === "Validation errors") {
        console.error(error.value.statusMessage, error.value.data?.data.validationErrors)
      } else {
        console.error(error.value)
      }
    }
  },
  { immediate: true }
)

useHead({
  title: () => `${get(country)?.name || startCase(name)}`,
  templateParams: { category: "Countries" }
})
</script>

<template>
  <u-container class="max-w-7xl">
    <u-page>
      <u-page-header
        headline="Countries"
        :ui="{ title: 'flex items-center gap-2' }"
      >
        <template #title>
          <u-icon
            v-if="country"
            :name="getFlagCode(country)"
          />
          <span>{{ country?.name ?? startCase(name) }}</span>
        </template>
      </u-page-header>

      <u-page-body>
        <u-page-list
          v-if="country"
          class="*:my-5"
        >
          <country-number-ones :country />

          <country-big-titles :country />
        </u-page-list>

        <empty
          v-else
          :message="`${startCase(name)} has no players who have achieved the No. 1 ranking or won any big titles representing it.`"
          :icon="ICONS.globeOff"
        />
      </u-page-body>
    </u-page>
  </u-container>
</template>
