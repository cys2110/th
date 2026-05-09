<script setup lang="ts">
const {
  params: { edId, year }
} = useRoute("edition")

const {
  ui: { icons, colors }
} = useAppConfig()

const toast = useToast()
const supabase = useSupabaseClient()

const tournamentStore = useTournamentStore()

const { data, pending, refresh } = await useAsyncData<Array<EntryInfoInterface>>(
  "entry-info",
  async () => {
    const { data, error } = await supabase
      .from("entries")
      .select(
        `
      id,
      events!inner(edition_id, tour),
      entry_status(status, draw),
      ldas(rank, draw),
      retirements(reason, draw, players(id, first_name, last_name)),
      walkovers(reason, draw, players(id, first_name, last_name)),
      withdrawals(reason, draw, players(id, first_name, last_name)),
      defaults(reason, draw, players(id, first_name, last_name)),
      player_entry_mapping(countries(*), players(id, first_name, last_name))
    `
      )
      .eq("events.edition_id", Number(edId))

    if (error || !data) {
      console.error("Error fetching entry info:", error)
      return []
    }

    const entryInfo: Array<EntryInfoInterface> = []

    // Alternates, Lucky Losers, Qualifiers, Wild Cards, Retirements, Walkovers, Withdrawals, Defaults, LDAs
    const alternates = data.filter(entry => entry.entry_status.some(es => es.status === "AL"))
    const luckyLosers = data.filter(entry => entry.entry_status.some(es => es.status === "LL"))
    const qualifiers = data.filter(entry => entry.entry_status.some(es => es.status === "Q"))
    const wildCards = data.filter(entry => entry.entry_status.some(es => es.status === "WC"))
    const retirements = data.filter(entry => entry.retirements.length)
    const walkovers = data.filter(entry => entry.walkovers.length)
    const withdrawals = data.filter(entry => entry.withdrawals.length)
    const defaults = data.filter(entry => entry.defaults.length)
    const ldas = data.filter(entry => entry.ldas.length)

    if (alternates.length)
      entryInfo.push({
        key: "alts",
        label: "Alternates",
        entries: alternates.map(entry => ({
          id: entry.id,
          draw: entry.entry_status.find(es => es.status === "AL")?.draw!,
          tour: entry.events.tour!,
          team: entry.player_entry_mapping.map(entry => ({
            id: entry.players.id,
            first_name: entry.players.first_name,
            last_name: entry.players.last_name,
            country: entry.countries
          }))
        }))
      })

    if (luckyLosers.length)
      entryInfo.push({
        key: "lls",
        label: "Lucky Losers",
        entries: luckyLosers.map(entry => ({
          id: entry.id,
          draw: entry.entry_status.find(es => es.status === "LL")?.draw!,
          tour: entry.events.tour!,
          team: entry.player_entry_mapping.map(entry => ({
            id: entry.players.id,
            first_name: entry.players.first_name,
            last_name: entry.players.last_name,
            country: entry.countries
          })),
          pr: !!entry.entry_status.find(es => es.status === "PR")
        }))
      })

    if (qualifiers.length)
      entryInfo.push({
        key: "qualifiers",
        label: "Qualifiers",
        entries: qualifiers.map(entry => ({
          id: entry.id,
          draw: entry.entry_status.find(es => es.status === "Q")?.draw!,
          tour: entry.events.tour!,
          team: entry.player_entry_mapping.map(entry => ({
            id: entry.players.id,
            first_name: entry.players.first_name,
            last_name: entry.players.last_name,
            country: entry.countries
          }))
        }))
      })

    if (wildCards.length)
      entryInfo.push({
        key: "wcs",
        label: "Wild Cards",
        entries: wildCards.map(entry => ({
          id: entry.id,
          draw: entry.entry_status.find(es => es.status === "WC")?.draw!,
          tour: entry.events.tour!,
          team: entry.player_entry_mapping.map(entry => ({
            id: entry.players.id,
            first_name: entry.players.first_name,
            last_name: entry.players.last_name,
            country: entry.countries
          }))
        }))
      })

    if (retirements.length)
      entryInfo.push({
        key: "retirements",
        label: "Retirements",
        entries: retirements.flatMap(entry =>
          entry.retirements.map(retirement => ({
            id: entry.id,
            draw: retirement.draw!,
            tour: entry.events.tour!,
            team: entry.player_entry_mapping.map(entry => ({
              id: entry.players.id,
              first_name: entry.players.first_name,
              last_name: entry.players.last_name,
              country: entry.countries
            })),
            reason: retirement.reason,
            teammate: retirement.players ? `${retirement.players.first_name} ${retirement.players.last_name}` : null
          }))
        )
      })

    if (walkovers.length)
      entryInfo.push({
        key: "wos",
        label: "Walkovers",
        entries: walkovers.flatMap(entry =>
          entry.walkovers.map(walkover => ({
            id: entry.id,
            draw: walkover.draw!,
            tour: entry.events.tour!,
            team: entry.player_entry_mapping.map(entry => ({
              id: entry.players.id,
              first_name: entry.players.first_name,
              last_name: entry.players.last_name,
              country: entry.countries
            })),
            reason: walkover.reason,
            teammate: walkover.players ? `${walkover.players.first_name} ${walkover.players.last_name}` : null
          }))
        )
      })

    if (withdrawals.length)
      entryInfo.push({
        key: "wds",
        label: "Withdrawals",
        entries: withdrawals.flatMap(entry =>
          entry.withdrawals.map(withdrawal => ({
            id: entry.id,
            draw: withdrawal.draw!,
            tour: entry.events.tour!,
            team: entry.player_entry_mapping.map(entry => ({
              id: entry.players.id,
              first_name: entry.players.first_name,
              last_name: entry.players.last_name,
              country: entry.countries
            })),
            reason: withdrawal.reason,
            teammate: withdrawal.players ? `${withdrawal.players.first_name} ${withdrawal.players.last_name}` : null
          }))
        )
      })

    if (defaults.length)
      entryInfo.push({
        key: "defaults",
        label: "Defaults",
        entries: defaults.flatMap(entry =>
          entry.defaults.map(def => ({
            id: entry.id,
            draw: def.draw!,
            tour: entry.events.tour!,
            team: entry.player_entry_mapping.map(entry => ({
              id: entry.players.id,
              first_name: entry.players.first_name,
              last_name: entry.players.last_name,
              country: entry.countries
            })),
            reason: def.reason,
            teammate: def.players ? `${def.players.first_name} ${def.players.last_name}` : null
          }))
        )
      })

    if (ldas.length)
      entryInfo.push({
        key: "ldas",
        label: "Last Direct Acceptances",
        entries: ldas.flatMap(entry =>
          entry.ldas.map(lda => ({
            id: entry.id,
            draw: lda.draw!,
            tour: entry.events.tour!,
            team: entry.player_entry_mapping.map(entry => ({
              id: entry.players.id,
              first_name: entry.players.first_name,
              last_name: entry.players.last_name,
              country: entry.countries
            })),
            rank: lda.rank
          }))
        )
      })

    return entryInfo
  },
  { default: () => [] }
)
</script>

<template>
  <dashboard-subpanel
    title="Entry Information"
    :icon="icons.info"
  >
    <template #right>
      <dev-only>
        <u-button
          color="warning"
          :icon="icons.reload"
          @click="() => refresh()"
        />
        <edition-entry-info-create @refresh="refresh" />
      </dev-only>
    </template>

    <u-collapsible
      v-if="data.length"
      v-for="relationship in data"
      :key="relationship.key"
    >
      <u-button
        class="group my-2"
        :label="relationship.label"
        color="neutral"
        block
        :trailing-icon="icons.chevronDown"
        :ui="{ trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform duration-200' }"
      />

      <template #content>
        <div
          v-for="entry in relationship.entries"
          :key="entry.id"
          class="flex justify-between items-center text-sm my-1"
        >
          <div class="flex items-center gap-2">
            <u-badge
              :color="<keyof typeof colors>entry.tour"
              :label="entry.tour"
              class="min-w-20"
            />

            <u-badge
              :color="entry.draw"
              :label="entry.draw"
              class="min-w-20"
            />

            <div>
              <player-link
                v-for="player in entry.team"
                :key="player.id"
                :player
              />
            </div>
          </div>

          <div v-if="entry.rank || entry.reason">
            <div v-if="entry.rank">
              <span v-if="entry.pr">PR</span>
              <span>{{ entry.rank }}</span>
            </div>
            <div v-else-if="entry.reason">
              <span>{{ entry.reason }}</span>
              <span v-if="entry.teammate"> ({{ entry.teammate }})</span>
            </div>
          </div>
        </div>
      </template>
    </u-collapsible>

    <empty
      v-else
      :message="`No entry information available for ${tournamentStore.name} ${year}`"
    />
  </dashboard-subpanel>
</template>
