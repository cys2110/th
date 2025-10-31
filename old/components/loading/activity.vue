<template>
  <u-card :ui="{ footer: 'flex flex-col md:flex-row items-center gap-2', root: 'my-5' }">
    <template #header>
      <div class="flex justify-between items-center mb-4">
        <u-skeleton class="h-7 w-40 rounded-lg" />
        <u-skeleton class="h-7 w-40 rounded-lg" />
      </div>
      <div class="flex justify-between items-center">
        <u-skeleton class="h-4 w-30 rounded-lg" />
        <u-skeleton class="h-4 w-30 rounded-lg" />
      </div>
    </template>

    <u-skeleton class="h-24 w-full rounded-lg" />

    <template #footer>
      <u-skeleton class="h-8 w-60 rounded-lg ring-secondary-600 bg-secondary-600/10 dark:bg-secondary-400/10" />
    </template>
  </u-card>
</template>
