<script setup lang="ts">
defineProps<{
  h2h: {
    p1: PlayerInterface
    p2: PlayerInterface
    p1Wins: number
    p2Wins: number
  }
}>()
</script>

<template>
  <table class="w-fit mx-auto text-sm text-center">
    <thead>
      <tr>
        <th>
          <player-link :player="h2h.p1" />
        </th>
        <th />
        <th>
          <player-link :player="h2h.p2" />
        </th>
      </tr>
    </thead>
    <tbody>
      <tr v-if="h2h.p1.dob || h2h.p2.dob">
        <td>{{ h2h.p1.dob ? dateTimeFormat.format(getDate(h2h.p1.dob)) : "Unknown" }}</td>
        <th>Date of Birth</th>
        <td>{{ h2h.p2.dob ? dateTimeFormat.format(getDate(h2h.p2.dob)) : "Unknown" }}</td>
      </tr>
      <tr v-if="h2h.p1.height || h2h.p2.height">
        <td>{{ h2h.p1.height ? `${h2h.p1.height}cm (${convertToFt(h2h.p1.height)})` : "Unknown" }}</td>
        <th>Height</th>
        <td>{{ h2h.p2.height ? `${h2h.p2.height}cm (${convertToFt(h2h.p2.height)})` : "Unknown" }}</td>
      </tr>
      <tr v-if="h2h.p1.rh || h2h.p2.rh">
        <td>{{ handedness(h2h.p1.rh) }}</td>
        <th>Plays</th>
        <td>{{ handedness(h2h.p2.rh) }}</td>
      </tr>
      <tr v-if="h2h.p1.bh || h2h.p2.bh">
        <td>{{ h2h.p1.bh ? `${h2h.p1.bh}-Handed` : "Unknown" }}</td>
        <th>Backhand</th>
        <td>{{ h2h.p2.bh ? `${h2h.p2.bh}-Handed` : "Unknown" }}</td>
      </tr>
      <tr v-if="h2h.p1.turned_pro || h2h.p2.turned_pro">
        <td>{{ h2h.p1.turned_pro ?? "Unknown" }}</td>
        <th>Turned Pro</th>
        <td>{{ h2h.p2.turned_pro ?? "Unknown" }}</td>
      </tr>
      <tr v-if="h2h.p1.retired || h2h.p2.retired">
        <td>{{ h2h.p1.retired ?? "N/A" }}</td>
        <th>Retired</th>
        <td>{{ h2h.p2.retired ?? "N/A" }}</td>
      </tr>
      <tr>
        <td>{{ h2h.p1.wins }}-{{ h2h.p1.losses }}</td>
        <th>Win-Loss</th>
        <td>{{ h2h.p2.wins }}-{{ h2h.p2.losses }}</td>
      </tr>
      <tr>
        <td>{{ h2h.p1.titles }}</td>
        <th>Titles</th>
        <td>{{ h2h.p2.titles }}</td>
      </tr>
      <tr>
        <td>{{ h2h.p1.pm.toLocaleString("en-GB", { style: "currency", currency: "USD" }) }}</td>
        <th>Prize Money</th>
        <td>{{ h2h.p2.pm.toLocaleString("en-GB", { style: "currency", currency: "USD" }) }}</td>
      </tr>
      <tr>
        <td>{{ h2h.p1.ch_singles ?? "—" }}</td>
        <th>Career High</th>
        <td>{{ h2h.p2.ch_singles ?? "—" }}</td>
      </tr>
    </tbody>
  </table>
</template>
