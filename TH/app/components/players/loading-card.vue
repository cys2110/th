<script setup lang="ts">

</script>

<template>
  <u-page-card
    highlight
    :ui="{ body: 'w-full', leading: 'flex justify-between items-center w-full' }"
  >
    <template #leading>
      <u-skeleton class="h-5 w-10" />

      <div class="flex gap-2">
        <u-skeleton class="h-5 w-10" />
        <u-skeleton class="h-5 w-15" />
      </div>
    </template>

    <template #title>
      <u-skeleton class="h-5 w-full" />
    </template>

    <template #description>
      <u-skeleton class="h-3 w-1/2" />
      <u-skeleton class="h-3 w-1/2 ml-3 mt-3" />
    </template>

    <template #footer>
      <u-skeleton class="h-5 w-30" />
    </template>
  </u-page-card>
</template>
