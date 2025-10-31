<template>
  <u-page-card
    highlight
    :ui="{ body: 'w-full', leading: 'flex items-center justify-between w-full' }"
  >
    <template #leading>
      <u-skeleton class="h-4 w-6" />
      <u-skeleton class="h-4 w-12" />
    </template>

    <template #title>
      <u-skeleton class="h-4 w-full my-5" />
    </template>

    <template #description>
      <u-skeleton class="h-2 w-1/5 mx-auto" />
    </template>
  </u-page-card>
</template>
