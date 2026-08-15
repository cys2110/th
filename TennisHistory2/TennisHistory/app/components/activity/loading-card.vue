<template>
  <u-page-card
    highlight
    orientation="horizontal"
  >
    <template #leading>
      <u-skeleton class="w-12 h-6" />
    </template>

    <template #title>
      <u-skeleton class="w-48 h-5" />
    </template>

    <template #description>
      <u-skeleton class="w-80 h-8 mt-2" />
    </template>

    <template #footer>
      <u-skeleton class="w-80 h-5" />
    </template>

    <u-skeleton class="w-full h-60" />
  </u-page-card>
</template>
