<script setup lang="ts">
import { array, object } from "zod"

const schema = object({
  rounds: array(RoundEnum)
})
</script>

<template>
  <div> Component: edition/country-rounds-create </div>
</template>
