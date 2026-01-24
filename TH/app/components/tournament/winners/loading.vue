<template>
  <u-page-card
    highlight
    :ui="{ body: 'w-full' }"
  >
    <template #leading>
      <u-skeleton class="h-5 w-10" />
    </template>

    <template #title>
      <u-skeleton class="h-5 w-10" />
    </template>

    <template #description>
      <div class="*:my-2 *:*:my-1">
        <div
          v-for="_ in 3"
          :key="_"
        >
          <u-skeleton class="h-5 w-1/2" />
          <u-skeleton class="h-5 w-3/4" />
        </div>
      </div>
    </template>
  </u-page-card>
</template>
