<template>
  <u-page-card
    highlight
    :ui="{ body: 'w-full' }"
  >
    <template #leading>
      <u-skeleton class="h-5 w-10" />
    </template>

    <template #description>
      <u-skeleton class="h-5 w-full" />
    </template>
  </u-page-card>
</template>
