<script setup lang="ts">
import { ICONS } from "#imports"

const { isLoggedIn } = useAuthState()
</script>

<template>
  <slot v-if="isLoggedIn" />

  <u-empty
    v-else
    variant="subtle"
    :icon="ICONS.notLoggedIn"
    title="You must be logged in to view tournament stats!"
    description="Tournament stats include lowest ranked winners, countries with the most winners, winners by age and more"
    :actions="[
      { label: 'Log In', icon: ICONS.logIn, to: { name: 'signin' } },
      { label: 'Sign Up', icon: ICONS.signUp, to: { name: 'signup' } }
    ]"
    class="bg-primary/10 ring-primary/25"
  />
</template>
