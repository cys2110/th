<script setup lang="ts">
const { teams } = defineProps<{
  teams: {
    team1: H2HTeamType
    team2: H2HTeamType
  }
}>()

const {
  ui: { icons }
} = useAppConfig()

const details = [
  {
    label: "Date of Birth",
    team1: teams.team1.players.map(p => (p.dob ? useDateFormat(p.dob, "DD MMMM YYYY").value : "Unknown")),
    team2: teams.team2.players.map(p => (p.dob ? useDateFormat(p.dob, "DD MMMM YYYY").value : "Unknown"))
  },
  {
    label: "Height",
    team1: teams.team1.players.map(p => (p.height ? `${p.height}cm (${convertToFt(p.height)})` : "Unknown")),
    team2: teams.team2.players.map(p => (p.height ? `${p.height}cm (${convertToFt(p.height)})` : "Unknown"))
  },
  {
    label: "Plays",
    team1: teams.team1.players.map(p => (p.rh ? `${p.rh}-handed` : "Unknown")),
    team2: teams.team2.players.map(p => (p.rh ? `${p.rh}-handed` : "Unknown"))
  },
  {
    label: "Backhand",
    team1: teams.team1.players.map(p => (p.bh ? `${p.bh}-handed` : "Unknown")),
    team2: teams.team2.players.map(p => (p.bh ? `${p.bh}-handed` : "Unknown"))
  },
  {
    label: "Win-Loss",
    team1: [`${teams.team1.wins}-${teams.team1.losses}`, `Tour: ${teams.team1.tour_wins}-${teams.team1.tour_losses}`],
    team2: [`${teams.team2.wins}-${teams.team2.losses}`, `Tour: ${teams.team2.tour_wins}-${teams.team2.tour_losses}`],
    tooltip: teams.team1.players.length > 1 ? "This constitutes the win-loss record for the team rather than individual players" : undefined
  },
  {
    label: "Titles",
    team1: [teams.team1.titles, `Tour: ${teams.team1.tour_titles}`],
    team2: [teams.team2.titles, `Tour: ${teams.team2.tour_titles}`],
    tooltip: teams.team1.players.length > 1 ? "This constitutes the titles won by the team rather than individual players" : undefined
  },
  {
    label: "Prize Money",
    team1: teams.team1.players.map(p => (p.pm ? p.pm.toLocaleString("en-GB", { style: "currency", currency: "USD" }) : "$0.00")),
    team2: teams.team2.players.map(p => (p.pm ? p.pm.toLocaleString("en-GB", { style: "currency", currency: "USD" }) : "$0.00"))
  },
  {
    label: "Career High",
    team1: teams.team1.players.map(p =>
      teams.team1.players.length === 1 ? p.ch_singles?.toLocaleString() ?? "0" : p.ch_doubles?.toLocaleString() ?? "0"
    ),
    team2: teams.team2.players.map(p =>
      teams.team2.players.length === 1 ? p.ch_singles?.toLocaleString() ?? "0" : p.ch_doubles?.toLocaleString() ?? "0"
    )
  }
]
</script>

<template>
  <table class="max-w-fit min-w-sm mx-auto text-center text-sm">
    <thead>
      <tr class="*:px-5 *:py-2">
        <th class="bg-violet-700/30">
          <player-link
            v-for="player in teams.team1.players"
            :key="player.id"
            :player
          />
        </th>
        <th />
        <th class="bg-emerald-700/30">
          <player-link
            v-for="player in teams.team2.players"
            :key="player.id"
            :player
          />
        </th>
      </tr>
    </thead>
    <tbody class="*:*:py-1 *:border-t *:border-muted">
      <tr
        v-for="(detail, index) in details"
        :key="index"
        class="*:first:bg-violet-700/30 *:last:bg-emerald-700/30"
      >
        <td>
          <div
            v-for="(value, t1Index) in detail.team1"
            :key="t1Index"
          >
            {{ value }}
          </div>
        </td>
        <td class="px-2">
          {{ detail.label }}
          <u-tooltip
            v-if="detail.tooltip"
            :text="detail.tooltip"
          >
            <u-icon
              :name="icons.info"
              class="cursor-pointer"
            />
          </u-tooltip>
        </td>
        <td>
          <div
            v-for="(value, t2Index) in detail.team2"
            :key="t2Index"
          >
            {{ value }}
          </div>
        </td>
      </tr>
    </tbody>
  </table>
</template>
