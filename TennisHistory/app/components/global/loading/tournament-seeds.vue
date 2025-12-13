<template>
  <u-page-card
    highlight
    :ui="{ body: 'w-full' }"
  >
    <template #title>
      <u-skeleton class="h-5 w-15" />
    </template>

    <template #description>
      <div class="*:my-2 *:*:my-1">
        <div
          v-for="_ in 2"
          :key="_"
        >
          <u-skeleton class="h-5 w-full" />
          <u-skeleton class="h-5 w-1/2" />
          <u-skeleton class="h-5 w-3/4" />
        </div>
      </div>
    </template>
  </u-page-card>
</template>
