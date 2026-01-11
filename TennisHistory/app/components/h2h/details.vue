<script setup lang="ts">
defineProps<{
  teams: {
    team1: H2HTeamType
    team2: H2HTeamType
  }
}>()

const {
  ui: { icons }
} = useAppConfig()
</script>

<template>
  <table class="max-w-fit mx-auto text-sm text-center">
    <thead>
      <tr class="*:px-5">
        <th>
          <div class="flex items-center justify-center gap-2">
            <template
              v-for="(player, index) in teams.team1.players"
              :key="player.id"
            >
              <player-link :player="(player as PersonType)" />
              <span v-if="index < teams.team1.players.length - 1"> / </span>
            </template>
          </div>
        </th>
        <th> </th>
        <th>
          <div class="flex items-center justify-center gap-2">
            <template
              v-for="(player, index) in teams.team2.players"
              :key="player.id"
            >
              <player-link :player="(player as PersonType)" />
              <span v-if="index < teams.team2.players.length - 1"> / </span>
            </template>
          </div>
        </th>
      </tr>
    </thead>
    <tbody class="*:*:p-1 *:border-t *:border-muted">
      <tr>
        <td>
          {{ teams.team1.players.map(p => (p.dob ? useDateFormat(p.dob, "DD MMMM YYYY").value : "Unknown")).join(" / ") }}
        </td>
        <td class="font-semibold text-muted">Date of Birth</td>
        <td>
          {{ teams.team2.players.map(p => (p.dob ? useDateFormat(p.dob, "DD MMMM YYYY").value : "Unknown")).join(" / ") }}
        </td>
      </tr>

      <tr>
        <td>
          {{ teams.team1.players.map(p => (p.height ? `${p.height}cm (${convertToFt(p.height)})` : "Unknown")).join(" / ") }}
        </td>
        <td class="font-semibold text-muted">Height</td>
        <td>
          {{ teams.team2.players.map(p => (p.height ? `${p.height}cm (${convertToFt(p.height)})` : "Unknown")).join(" / ") }}
        </td>
      </tr>

      <tr>
        <td>
          {{ teams.team1.players.map(p => (p.rh ? `${p.rh}-Handed` : "Unknown")).join(" / ") }}
        </td>
        <td class="font-semibold text-muted">Plays</td>
        <td>
          {{ teams.team2.players.map(p => (p.rh ? `${p.rh}-Handed` : "Unknown")).join(" / ") }}
        </td>
      </tr>

      <tr>
        <td>
          {{ teams.team1.players.map(p => (p.bh ? `${p.bh}-Handed` : "Unknown")).join(" / ") }}
        </td>
        <td class="font-semibold text-muted">Backhand</td>
        <td>
          {{ teams.team2.players.map(p => (p.bh ? `${p.bh}-Handed` : "Unknown")).join(" / ") }}
        </td>
      </tr>

      <tr>
        <td>
          <div>
            <div>{{ teams.team1.wins }}-{{ teams.team1.losses }} </div>
            <div>Tour: {{ teams.team1.tour_wins }}-{{ teams.team1.tour_losses }}</div>
          </div>
        </td>
        <td class="font-semibold text-muted">
          Win-Loss
          <u-tooltip text="For doubles teams, this constitutes the win-loss record for the team rather than individual players">
            <u-icon
              :name="icons.info"
              class="cursor-pointer align-middle"
            />
          </u-tooltip>
        </td>
        <td>
          <div>
            <div>{{ teams.team2.wins }}-{{ teams.team2.losses }} </div>
            <div>Tour: {{ teams.team2.tour_wins }}-{{ teams.team2.tour_losses }}</div>
          </div>
        </td>
      </tr>

      <tr>
        <td>
          <div>
            <div>{{ teams.team1.titles }}</div>
            <div>Tour: {{ teams.team1.tour_titles }}</div>
          </div>
        </td>
        <td class="font-semibold text-muted">
          Titles
          <u-tooltip text="For doubles teams, this constitutes the titles for the team rather than individual players">
            <u-icon
              :name="icons.info"
              class="cursor-pointer align-middle"
            />
          </u-tooltip>
        </td>
        <td>
          <div>
            <div>{{ teams.team2.titles }}</div>
            <div>Tour: {{ teams.team2.tour_titles }}</div>
          </div>
        </td>
      </tr>

      <tr>
        <td>
          {{ teams.team1.players.map(p => (p.pm ? p.pm.toLocaleString("en-GB", { style: "currency", currency: "USD" }) : "$0.00")).join(" / ") }}
        </td>
        <td class="font-semibold text-muted">Prize Money</td>
        <td>
          {{ teams.team2.players.map(p => (p.pm ? p.pm.toLocaleString("en-GB", { style: "currency", currency: "USD" }) : "$0.00")).join(" / ") }}
        </td>
      </tr>

      <tr>
        <td>
          {{ teams.team1.players.length === 1 ? teams.team1.players[0]!.ch_singles : teams.team1.players.map(p => p.ch_doubles ?? "—").join(" / ") }}
        </td>
        <td class="font-semibold text-muted">Career High</td>
        <td>
          {{ teams.team2.players.length === 1 ? teams.team2.players[0]!.ch_singles : teams.team2.players.map(p => p.ch_doubles ?? "—").join(" / ") }}
        </td>
      </tr>
    </tbody>
  </table>
</template>
