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

const key = computed(() => `${edId}-entry-info`)

const { data, pending, refresh } = await useAsyncData<Array<EntryInfoInterface>>(
  key,
  async () => {
    const { data: retirementsData, error: retirementsError } = await supabase
      .from("retirements")
      .select(
        `
        *,

        events!inner(edition_id, tour),
        entries(player_entry_mapping(countries(*), players(id, first_name, last_name)))
      `
      )
      .eq("events.edition_id", Number(edId))

    if (retirementsError || !retirementsData) console.error("Error fetching retirements", retirementsError)

    const { data: ldasData, error: ldasError } = await supabase
      .from("ldas")
      .select(
        `
        *,
        events!inner(edition_id, tour),
        entries(player_entry_mapping(countries(*), players(id, first_name, last_name)))
      `
      )
      .eq("events.edition_id", Number(edId))

    if (ldasError || !ldasData) console.error("Error fetching ldas", ldasError)

    const { data: withdrawalsData, error: withdrawalsError } = await supabase
      .from("withdrawals")
      .select(
        `
        *,
        events!inner(edition_id, tour),
        entries(player_entry_mapping(countries(*), players(id, first_name, last_name)))
      `
      )
      .eq("events.edition_id", Number(edId))

    if (withdrawalsError || !withdrawalsData) console.error("Error fetching withdrawals", withdrawalsError)

    const { data: walkoversData, error: walkoversError } = await supabase
      .from("walkovers")
      .select(
        `
        *,
        events!inner(edition_id, tour),
        entries(player_entry_mapping(countries(*), players(id, first_name, last_name)))
      `
      )
      .eq("events.edition_id", Number(edId))

    if (walkoversError || !walkoversData) console.error("Error fetching walkovers", walkoversError)

    const { data: defaultsData, error: defaultsError } = await supabase
      .from("defaults")
      .select(
        `
        *,
        events!inner(edition_id, tour),
        entries(player_entry_mapping(countries(*), players(id, first_name, last_name)))
      `
      )
      .eq("events.edition_id", Number(edId))

    if (defaultsError || !defaultsData) console.error("Error fetching defaults", defaultsError)

    const { data: statusesData, error: statusesError } = await supabase
      .from("entry_status")
      .select(
        `
        *,
        events!inner(edition_id, tour),
        entries(player_entry_mapping(countries(*), players(id, first_name, last_name)))
      `
      )
      .eq("events.edition_id", Number(edId))

    if (statusesError || !statusesData) console.error("Error fetching statuses", statusesError)

    const entryInfo: Array<EntryInfoInterface> = []

    const alternates = statusesData!.filter(mapping => mapping.status === "AL")
    const luckyLosers = statusesData!.filter(mapping => mapping.status === "LL")
    const qualifiers = statusesData!.filter(mapping => mapping.status === "Q")
    const wildCards = statusesData!.filter(mapping => mapping.status === "WC")

    if (alternates.length)
      entryInfo.push({
        key: "alts",
        label: "Alternates",
        entries: alternates.map(entry => ({
          id: entry.id,
          entry_id: entry.entry_id,
          draw: entry.draw!,
          tour: entry.events.tour!,
          team: entry.entries.player_entry_mapping.map(entry => ({
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
          entry_id: entry.entry_id,
          draw: entry.draw!,
          tour: entry.events.tour!,
          team: entry.entries.player_entry_mapping.map(entry => ({
            id: entry.players.id,
            first_name: entry.players.first_name,
            last_name: entry.players.last_name,
            country: entry.countries
          }))
        }))
      })

    if (qualifiers.length)
      entryInfo.push({
        key: "qualifiers",
        label: "Qualifiers",
        entries: qualifiers.map(entry => ({
          id: entry.id,
          entry_id: entry.entry_id,
          draw: entry.draw!,
          tour: entry.events.tour!,
          team: entry.entries.player_entry_mapping.map(entry => ({
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
          entry_id: entry.entry_id,
          draw: entry.draw!,
          tour: entry.events.tour!,
          team: entry.entries.player_entry_mapping.map(entry => ({
            id: entry.players.id,
            first_name: entry.players.first_name,
            last_name: entry.players.last_name,
            country: entry.countries
          }))
        }))
      })

    if (retirementsData?.length)
      entryInfo.push({
        key: "retirements",
        label: "Retirements",
        entries: retirementsData.map(entry => ({
          id: entry.id,
          entry_id: entry.entry_id,
          draw: entry.draw!,
          tour: entry.events.tour!,
          team: entry.entries.player_entry_mapping.map(entry => ({
            id: entry.players.id,
            first_name: entry.players.first_name,
            last_name: entry.players.last_name,
            country: entry.countries
          })),
          reason: entry.reason,
          teammate:
            entry.player_id ?
              `${entry.entries.player_entry_mapping.find(pem => pem.players.id === entry.player_id)?.players.first_name} ${entry.entries.player_entry_mapping.find(pem => pem.players.id === entry.player_id)?.players.last_name}`
            : null
        }))
      })

    if (walkoversData?.length)
      entryInfo.push({
        key: "wos",
        label: "Walkovers",
        entries: walkoversData.map(entry => ({
          id: entry.id,
          entry_id: entry.entry_id,
          draw: entry.draw!,
          tour: entry.events.tour!,
          team: entry.entries.player_entry_mapping.map(entry => ({
            id: entry.players.id,
            first_name: entry.players.first_name,
            last_name: entry.players.last_name,
            country: entry.countries
          })),
          reason: entry.reason,
          teammate:
            entry.player_id ?
              `${entry.entries.player_entry_mapping.find(pem => pem.players.id === entry.player_id)?.players.first_name} ${entry.entries.player_entry_mapping.find(pem => pem.players.id === entry.player_id)?.players.last_name}`
            : null
        }))
      })

    if (withdrawalsData?.length)
      entryInfo.push({
        key: "wds",
        label: "Withdrawals",
        entries: withdrawalsData.map(entry => ({
          id: entry.id,
          entry_id: entry.entry_id,
          draw: entry.draw!,
          tour: entry.events.tour!,
          team: entry.entries.player_entry_mapping.map(entry => ({
            id: entry.players.id,
            first_name: entry.players.first_name,
            last_name: entry.players.last_name,
            country: entry.countries
          })),
          reason: entry.reason,
          teammate:
            entry.player_id ?
              `${entry.entries.player_entry_mapping.find(pem => pem.players.id === entry.player_id)?.players.first_name} ${entry.entries.player_entry_mapping.find(pem => pem.players.id === entry.player_id)?.players.last_name}`
            : null
        }))
      })

    if (defaultsData?.length)
      entryInfo.push({
        key: "defaults",
        label: "Defaults",
        entries: defaultsData.map(entry => ({
          id: entry.id,
          entry_id: entry.entry_id,
          draw: entry.draw!,
          tour: entry.events.tour!,
          team: entry.entries.player_entry_mapping.map(entry => ({
            id: entry.players.id,
            first_name: entry.players.first_name,
            last_name: entry.players.last_name,
            country: entry.countries
          })),
          reason: entry.reason,
          teammate:
            entry.player_id ?
              `${entry.entries.player_entry_mapping.find(pem => pem.players.id === entry.player_id)?.players.first_name} ${entry.entries.player_entry_mapping.find(pem => pem.players.id === entry.player_id)?.players.last_name}`
            : null
        }))
      })

    if (ldasData?.length)
      entryInfo.push({
        key: "ldas",
        label: "Last Direct Acceptances",
        entries: ldasData.map(entry => ({
          id: entry.id,
          entry_id: entry.entry_id,
          draw: entry.draw!,
          tour: entry.events.tour!,
          team: entry.entries.player_entry_mapping.map(entry => ({
            id: entry.players.id,
            first_name: entry.players.first_name,
            last_name: entry.players.last_name,
            country: entry.countries
          })),
          rank: entry.rank,
          pr: !!statusesData?.find(mapping => mapping.status === "PR" && mapping.entry_id === entry.entry_id)
        }))
      })

    return entryInfo
  },
  { default: () => [] }
)
</script>

<template>
  <u-container class="max-w-4xl">
    <dev-only>
      <div class="flex justify-end mb-4">
        <u-field-group class="w-fit">
          <u-button
            :icon="icons.reload"
            @click="refresh()"
          />
          <lazy-edition-entry-info-create
            hydrate-on-idle
            @refresh="refresh"
          />
        </u-field-group>
      </div>
    </dev-only>

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
              <players-link :players="entry.team" />
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
    <u-empty
      v-else
      :title="`No entry information available for ${tournamentStore.name} ${year}`"
      description="If you think this is an error, refresh the page. Otherwise, please be patient as we continue to add more data."
    >
      <template #actions>
        <u-button
          label="Refresh"
          :icon="icons.reload"
          @click="refresh()"
        />
      </template>
    </u-empty>
  </u-container>
</template>
