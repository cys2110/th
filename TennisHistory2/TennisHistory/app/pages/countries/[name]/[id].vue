<script setup lang="ts">
definePageMeta({ name: "country" })

const {
  params: { id, name }
} = useRoute("country")

const { countries } = useCountryList()

const country = computed(() => countries.value.find(c => c.id === id))

useHead({
  title: () => `${country.value?.name || startCase(name)}`,
  templateParams: { category: "Countries" }
})
</script>

<template>
  <u-container>
    <u-page>
      <u-page-header
        headline="Countries"
        :ui="{ title: 'flex items-center gap-2' }"
      >
        <template #title>
          <u-icon
            v-if="country"
            :name="country.icon"
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
          :title="`No data available regarding ${startCase(name)}`"
          :icon="ICONS.globeOff"
        />
      </u-page-body>
    </u-page>
  </u-container>
</template>
