<script setup lang="ts">
const {
  params: { id, name }
} = useRoute("tournament")

const { data, status } = await useFetch("/api/tournaments/statuses", {
  query: { id },
  default: () => []
})
</script>

<template>
  <div>
    <div class="text-accented text-lg font-semibold">
      <u-icon
        :name="ICONS.one"
        class="align-middle size-5"
      />
      Qualifiers / Lucky Losers / Alternates / Wild Cards Winners
    </div>

    <u-page-columns
      v-if="data.length || status === 'pending'"
      class="my-5"
    >
      <u-page-card
        v-if="data.length"
        v-for="(edition, index) in data"
        :key="index"
        highlight
        :title="edition.year.toString()"
        :to="{
          name: 'edition',
          params: {
            id,
            name,
            year: edition.year!,
            edId: edition.id
          }
        }"
        :ui="{ body: 'w-full', footer: 'text-sm' }"
      >
        <template #description>
          <players-link
            v-for="player in edition.team"
            :key="player.id"
            :player
          />
        </template>

        <template #footer> {{ edition.type }} - {{ statusEnum[edition.status] }} </template>
      </u-page-card>
    </u-page-columns>

    <empty
      v-else
      message="No data available"
      class="m-2"
    />
  </div>
</template>
