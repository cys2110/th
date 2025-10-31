<script setup lang="ts">
defineProps<{ edition: EditionInterface }>()
</script>

<template>
  <div
    class="columns-1 md:columns-2 lg:columns-3 gap-3 text-sm space-y-3 h-fit *:border *:border-primary *:rounded-md *:p-3 *:break-inside-avoid-column *:will-change-transform *:*:first:font-semibold *:*:first:text-muted *:*:not-first:ml-3"
  >
    <div v-if="edition.sponsor_name">
      <div>Sponsor Name</div>
      <div>{{ edition.sponsor_name }}</div>
    </div>

    <div v-if="edition.category">
      <div>Category</div>
      <div>{{ edition.category }}</div>
    </div>

    <div v-if="edition.start_date && edition.end_date">
      <div>Dates</div>
      <div>{{ dateTimeFormat.formatRange(new Date(edition.start_date), new Date(edition.end_date)) }}</div>
    </div>

    <div v-if="edition.surface">
      <div>Surface</div>
      <div>{{ edition.surface.id }}</div>
    </div>

    <div v-if="edition.venues?.length">
      <div>Venues</div>
      <div>
        <dev-only>
          <venues-update
            v-for="venue in edition.venues"
            :key="venue.id"
            :venue
          />
          <template #fallback>
            <div
              v-for="venue in edition.venues"
              :key="venue.id"
              class="flex items-center w-fit gap-1"
            >
              <span>{{ venue.name ? `${venue.name}, ${venue.city}` : venue.city }}</span>
              <countries-link
                :country="venue.country"
                icon-only
              />
            </div>
          </template>
        </dev-only>
      </div>
    </div>

    <div v-if="edition.currency && edition.tfc">
      <div>Total Financial Commitment</div>
      <div>{{ edition.tfc.toLocaleString("en-GB", { style: "currency", currency: edition.currency }) }}</div>
    </div>
  </div>
</template>
