<script setup lang="ts">
definePageMeta({ name: "country" })

const {
  params: { id, name }
} = useRoute("country")

const { devMode } = useRuntimeConfig().public

const { data, error } = await useFetch("/api/country", {
  query: { id },
  default: () => ({ statusObjects: [], result: {} as CountryType })
})

watch(
  () => data.value.statusObjects,
  () => {
    if (data.value?.statusObjects.length && devMode) {
      console.info(`${startCase(name)} API Status Objects:`, data.value.statusObjects)
    }
  },
  { immediate: true }
)

watch(
  error,
  newError => {
    if (newError) {
      if (newError.statusMessage) {
        console.error(newError.statusMessage, newError.data?.data)
      } else {
        console.error(newError)
      }
    }
  },
  { immediate: true }
)

useHead({
  title: () => `${data.value.result?.name || startCase(name)}`,
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
            v-if="data.result"
            :name="getFlagCode(data.result)"
          />
          <span>{{ data.result?.name ?? startCase(name) }}</span>
        </template>
      </u-page-header>

      <u-page-body>
        <!--Dev alerts-->
        <api-alerts :error />

        <u-page-list
          v-if="data.result"
          class="*:my-5"
        >
          <country-number-ones :country="data.result" />

          <country-big-titles :country="data.result" />
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
