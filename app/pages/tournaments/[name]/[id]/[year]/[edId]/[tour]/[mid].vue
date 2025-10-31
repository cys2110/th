<script setup lang="ts">
import type { DropdownMenuItem } from "@nuxt/ui"

definePageMeta({ name: "match" })
const { viewMode } = useViewMode()
const {
  ui: { icons }
} = useAppConfig()
const {
  params: { name, year, edId, tour, mid }
} = useRoute("match")
const { draw, type } = destructureMid(mid)

const categories: Record<string, string> = {
  "Service Stats": "text-Men",
  "Return Stats": "text-Women",
  "Points Stats": "text-primary",
  "Service Speed": "text-Main"
}

// API call
const { data: match, status } = await useFetch<MatchInterface & { tournament: string }>("/api/matches", {
  query: { mid, edId, tour }
})

useHead({
  title: () => {
    if (match.value) {
      const { t1, t2, tournament } = match.value
      const t1Name = t1.players.map(p => `${p.first_name} ${p.last_name}`).join(" / ")
      const t2Name = t2.players.map(p => `${p.first_name} ${p.last_name}`).join(" / ")

      return `${t1Name} v ${t2Name} | ${tournament} ${year}`
    }
    return `${capitalCase(name as string)} ${year}`
  }
})

const additionalLinks = computed<DropdownMenuItem[]>(() => {
  if (match.value) {
    const { t1, t2 } = match.value
    const t1Links = t1.players.map(p => ({
      label: `${p.first_name} ${p.last_name}`,
      icon: ICONS.player,
      to: { name: "player", params: { id: p.id, name: kebabCase(`${p.first_name} ${p.last_name}`) } },
      color: tour
    }))
    const t2Links = t2.players.map(p => ({
      label: `${p.first_name} ${p.last_name}`,
      icon: ICONS.player,
      to: { name: "player", params: { id: p.id, name: kebabCase(`${p.first_name} ${p.last_name}`) } },
      color: tour
    }))
    const h2hLink = [
      {
        label: "H2H",
        icon: ICONS.h2h,
        to: {
          name: "head-to-head",
          params: {
            p1Name: t1.players.map(player => kebabCase(`${player.first_name} ${player.last_name}`)).join("+"),
            p2Name: t2.players.map(player => kebabCase(`${player.first_name} ${player.last_name}`)).join("+"),
            p1Id: t1.players.map(player => player.id).join("+"),
            p2Id: t2.players.map(player => player.id).join("+")
          }
        }
      }
    ]
    return [...t1Links, ...t2Links, ...h2hLink] as DropdownMenuItem[]
  }

  return []
})
</script>

<template>
  <div class="w-full">
    <u-container v-if="viewMode === 'cards'">
      <u-page>
        <template #left>
          <u-page-aside>
            <dev-only>
              <matches-update
                v-if="match"
                :match
              />
            </dev-only>
          </u-page-aside>
        </template>

        <u-page-header
          v-if="match"
          :headline="`${match.tournament} ${year} ${tour}`"
          :title="`${match.t1.players.map(p => `${p.first_name} ${p.last_name}`).join(' / ')} v ${match.t2.players
            .map(p => `${p.first_name} ${p.last_name}`)
            .join(' / ')}`"
          :description="match.round"
        >
          <template #links>
            <u-dropdown-menu :items="additionalLinks">
              <u-button :icon="icons.info" />
            </u-dropdown-menu>
          </template>
        </u-page-header>

        <u-page-body>
          <matches-details
            v-if="match"
            :match
            :status
          />

          <matches-table
            v-if="match"
            :match
            :status
          />
        </u-page-body>
      </u-page>
    </u-container>
    <table-wrapper v-else>
      <template #navbar-right>
        <u-dropdown-menu :items="additionalLinks">
          <u-button :icon="icons.info" />
        </u-dropdown-menu>
      </template>

      <template #toolbar>
        <dev-only>
          <matches-update
            v-if="match"
            :match
          />
        </dev-only>
        <div
          v-for="(className, category) in categories"
          :key="category"
          class="flex items-center gap-2 w-full"
        >
          <u-icon
            :name="ICONS.colours"
            :class="className"
          />
          <span>{{ category }}</span>
        </div>
      </template>

      <matches-details
        v-if="match"
        :match
        :status
      />

      <matches-table
        :match
        :status
      />
    </table-wrapper>
  </div>
</template>
