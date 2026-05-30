<script setup lang="ts">
const props = defineProps<{
  year: number
  results: Array<RecordInterface>
}>()

const ao = computed(() => props.results.find(r => r.tournament_id === 580))
const fo = computed(() => props.results.find(r => r.tournament_id === 520))
const wimbledon = computed(() => props.results.find(r => r.tournament_id === 540))
const uso = computed(() => props.results.find(r => r.tournament_id === 560))
const finals = computed(() => props.results.find(r => r.tournament_id === 605))
const olympics = computed(() => props.results.find(r => r.tournament_id === 96))
</script>

<template>
  <tr class="divide-x divide-default even:bg-elevated/25">
    <td>{{ year }}</td>
    <td>
      <u-link
        v-if="ao"
        :to="{ name: 'edition', params: { id: ao.tournament_id, name: kebabCase(ao.tournament_name), year, edId: ao.edition_id } }"
        class="hover-link"
        :class="ao.win ? 'success-link' : 'primary-link'"
      >
        {{ ao.win ? "WIN" : ao.furthest_round }}
      </u-link>
      <span v-else>—</span>
    </td>
    <td>
      <u-link
        v-if="fo"
        :to="{ name: 'edition', params: { id: fo.tournament_id, name: kebabCase(fo.tournament_name), year, edId: fo.edition_id } }"
        class="hover-link"
        :class="fo.win ? 'success-link' : 'primary-link'"
      >
        {{ fo.win ? "WIN" : fo.furthest_round }}
      </u-link>
      <span v-else>—</span>
    </td>
    <td>
      <u-link
        v-if="wimbledon"
        :to="{
          name: 'edition',
          params: { id: wimbledon.tournament_id, name: kebabCase(wimbledon.tournament_name), year, edId: wimbledon.edition_id }
        }"
        class="hover-link"
        :class="wimbledon.win ? 'success-link' : 'primary-link'"
      >
        {{ wimbledon.win ? "WIN" : wimbledon.furthest_round }}
      </u-link>
      <span v-else>—</span>
    </td>
    <td>
      <u-link
        v-if="uso"
        :to="{ name: 'edition', params: { id: uso.tournament_id, name: kebabCase(uso.tournament_name), year, edId: uso.edition_id } }"
        class="hover-link"
        :class="uso.win ? 'success-link' : 'primary-link'"
      >
        {{ uso.win ? "WIN" : uso.furthest_round }}
      </u-link>
      <span v-else>—</span>
    </td>
    <td>
      <u-link
        v-if="olympics"
        :to="{ name: 'edition', params: { id: olympics.tournament_id, name: kebabCase(olympics.tournament_name), year, edId: olympics.edition_id } }"
        class="hover-link"
        :class="olympics.win ? 'success-link' : 'primary-link'"
      >
        {{ olympics.win ? "WIN" : olympics.furthest_round }}
      </u-link>
      <span v-else>—</span>
    </td>
    <td>
      <u-link
        v-if="finals"
        :to="{ name: 'edition', params: { id: finals.tournament_id, name: kebabCase(finals.tournament_name), year, edId: finals.edition_id } }"
        class="hover-link"
        :class="finals.win ? 'success-link' : 'primary-link'"
      >
        {{ finals.win ? "WIN" : finals.furthest_round }}
      </u-link>
      <span v-else>—</span>
    </td>
  </tr>
</template>
