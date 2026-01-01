<script setup lang="ts">


definePageMeta({ name: "country" })

const {
  params: { id, name }
} = useRoute("country")

const { data: country } = await useFetch("/api/country", {
  query: { id }
})

useHead({
  title: () => `${get(country)?.name || startCase(name as string)}`,
  templateParams: {
    category: "Countries"
  }
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
            :name="getFlagCode(country)"
          />

          <span>{{ country?.name ?? startCase(name) }}</span>
        </template>
      </u-page-header>

      <u-page-body>
        <div
          v-if="country"
          class="*:my-5"
        >
          <countries-number-ones :country="country" />

          <countries-big-titles :country="country" />
        </div>

        <empty
          v-else
          :message="`${startCase(name)} has no players who have achieved the No. 1 ranking or won any big titles representing it.`"
          :icon="ICONS.globeOff"
        />
      </u-page-body>
    </u-page>
  </u-container>
</template>
