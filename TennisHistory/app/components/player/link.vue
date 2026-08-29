<script setup lang="ts">
import { ICONS, kebabCase } from "#imports"
import { type Tables } from "~/types/database.types"

type CountryType = Tables<{ schema: "tennis" }, "country">

const props = withDefaults(
  defineProps<{
    team: Array<{
      id: string | null
      full_name: string | null
      country: CountryType | null
      image_url: string | null
    }>
    size?: "xs" | "sm" | "md" | "lg" | "xl"
  }>(),
  {
    size: "sm"
  }
)
</script>

<template>
  <div class="flex items-center gap-2">
    <u-avatar-group>
      <u-avatar
        v-for="(player, index) in team"
        :key="index"
        :src="player.image_url || ''"
        :alt="player.full_name || ''"
        loading="lazy"
        :icon="ICONS.player"
        :size
      />
    </u-avatar-group>

    <div>
      <div
        v-for="(player, index) in team"
        :key="index"
        class="flex items-center gap-1"
        :class="{
          'text-sm': size === 'sm'
        }"
      >
        <country-link
          :country="player.country!"
          icon-only
        />

        <u-link
          :to="{ name: 'player', params: { id: player.id || '', name: kebabCase(player.full_name || '') } }"
          class="hover-link primary-link"
        >
          {{ player.full_name }}
        </u-link>
      </div>
    </div>
  </div>
</template>
