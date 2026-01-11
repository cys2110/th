<script setup lang="ts">
definePageMeta({ name: "country" })

const {
  params: { id, name }
} = useRoute("country")

// const { data: country } = await useFetch("/api/countries", {
//   query: { id }
// })

// useHead({ title: () => `${country.value?.name || capitalCase(name as string)} | Countries` })
</script>

<template>
  <u-container class="max-w-7xl">
    <!-- <u-page>
      <u-page-header>
        <template #headline>
          <breadcrumbs />
        </template>

        <template #title>
          <div class="flex items-center gap-2">
            <u-icon
              v-if="country"
              :name="getFlagCode(country)"
            />
            <div>{{ country?.name ?? capitalCase(name) }}</div>
          </div>
        </template>
      </u-page-header>

      <u-page-body>
        <countries-number-ones
          v-if="country"
          :country
        />

        <countries-big-titles
          v-if="country"
          :country
        />

        <empty
          v-if="!country"
          message="No data available for this country."
          :icon="ICONS.noCountries"
        />
      </u-page-body>
    </u-page> -->
  </u-container>
</template>
