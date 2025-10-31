<script setup lang="ts" generic="S">
defineProps<{ field: FormFieldInterface<S>; currency?: string }>()
const {
  ui: { icons }
} = useAppConfig()
const modelValue = defineModel<any>()

const cleanLink = (link: string) => link.replace(/^[\s"'“”‘’\[\]]+|[\s"'“”‘’\[\]]+$/g, "")
</script>

<template>
  <form-input
    v-if="field.type === 'text'"
    :type="field.subType"
    v-model="modelValue"
    :placeholder="field.label"
    block
    :class="field.class"
  />

  <u-textarea
    v-else-if="field.type === 'textarea'"
    v-model="modelValue"
    placeholder=""
    :ui="{ base: 'peer' }"
    :class="field.class"
    :rows="2"
  >
    <template #trailing>
      <u-button
        v-if="modelValue?.length"
        color="neutral"
        variant="ghost"
        size="xs"
        :icon="icons.close"
        aria-label="Clear input"
        @click="modelValue = undefined"
      />
    </template>

    <label
      class="pointer-events-none absolute left-0 -top-2.5 text-highlighted text-xs font-medium px-1.5 transition-all peer-focus:-top-2.5 peer-focus:text-highlighted peer-focus:text-xs peer-focus:font-medium peer-placeholder-shown:text-sm peer-placeholder-shown:text-dimmed peer-placeholder-shown:top-1.5 peer-placeholder-shown:font-normal"
    >
      <span class="inline-flex bg-default px-1">{{ field.label }}</span>
    </label>
  </u-textarea>

  <u-checkbox-group
    v-else-if="field.type === 'checkbox'"
    :legend="field.label"
    v-model="modelValue"
    :items="field.items"
    orientation="horizontal"
    :class="field.class"
  />

  <u-radio-group
    v-else-if="field.type === 'radio'"
    :legend="field.label"
    v-model="modelValue"
    :items="field.items"
    orientation="horizontal"
    :size="field.size || 'sm'"
    :class="field.class"
  />

  <div
    v-else-if="field.type === 'tags'"
    class="relative"
    :class="field.class"
  >
    <transition
      enter-active-class="transition-all duration-200 ease-out"
      enter-from-class="opacity-0 -translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition-all duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-1"
    >
      <div
        v-if="modelValue"
        class="font-semibold text-xs bg-background absolute -top-2.5 bg-background z-30 left-2"
      >
        {{ field.label }}
      </div>
    </transition>
    <u-input-tags
      v-model="modelValue"
      :placeholder="modelValue?.length ? undefined : `Enter ${field.label.toLowerCase()}`"
      :max="field.max"
      :convert-value="cleanLink"
      add-on-paste
    />
  </div>

  <div
    v-else-if="field.type === 'number'"
    class="relative"
    :class="field.class"
  >
    <transition
      enter-active-class="transition-all duration-200 ease-out"
      enter-from-class="opacity-0 -translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition-all duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-1"
    >
      <div
        v-if="modelValue"
        class="font-semibold text-xs bg-background absolute -top-2.5 bg-background z-10 left-2"
      >
        {{ field.label }}
      </div>
    </transition>
    <u-input-number
      v-model="modelValue"
      :placeholder="modelValue ? undefined : `Enter ${field.label.toLowerCase()}`"
      :decrement="false"
    >
      <template #increment>
        <u-button
          v-if="modelValue !== undefined"
          color="neutral"
          variant="ghost"
          size="xs"
          :icon="icons.close"
          aria-label="Clear input"
          @click="modelValue = undefined"
        />
        <template v-else>{{ "" }}</template>
      </template>
    </u-input-number>
  </div>

  <div
    v-else-if="field.type === 'currency'"
    class="relative"
    :class="field.class"
  >
    <transition
      enter-active-class="transition-all duration-200 ease-out"
      enter-from-class="opacity-0 -translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition-all duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-1"
    >
      <div
        v-if="modelValue"
        class="font-semibold text-xs bg-background absolute -top-2.5 bg-background z-10 left-2"
      >
        {{ field.label }}
      </div>
    </transition>
    <u-input-number
      v-model="modelValue"
      :step="0.01"
      :format-options="{
        style: 'currency',
        currency: currency || 'USD'
      }"
      :placeholder="modelValue ? undefined : `Enter ${field.label.toLowerCase()}`"
      :decrement="false"
    >
      <template #increment>
        <u-button
          v-if="modelValue !== undefined"
          color="neutral"
          variant="ghost"
          size="xs"
          :icon="icons.close"
          aria-label="Clear input"
          @click="modelValue = undefined"
        />
        <template v-else>{{ "" }}</template>
      </template>
    </u-input-number>
  </div>

  <u-popover
    v-else-if="field.type === 'date'"
    :class="field.class"
  >
    <u-button
      color="neutral"
      variant="outline"
      :icon="ICONS.event"
      block
    >
      {{
        modelValue ? `${modelValue.day} ${MonthEnum[modelValue.month as keyof typeof MonthEnum]} ${modelValue.year}` : field.label || "Select date"
      }}
    </u-button>

    <template #content>
      <u-calendar v-model="modelValue" />
    </template>
  </u-popover>

  <div
    v-if="field.type === 'select'"
    class="relative"
    :class="field.class"
  >
    <transition
      enter-active-class="transition-all duration-200 ease-out"
      enter-from-class="opacity-0 -translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition-all duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-1"
    >
      <div
        v-if="modelValue || modelValue?.length"
        class="font-semibold text-xs bg-background absolute -top-2.5 bg-background z-10 left-2"
      >
        {{ field.label }}
      </div>
    </transition>
    <u-select
      v-model="modelValue"
      :items="field.items"
      :placeholder="modelValue ? undefined : `Select ${field.label.toLowerCase()}`"
    >
      <template #content-bottom>
        <u-button
          label="Clear"
          size="xs"
          @click="modelValue = undefined"
          :icon="icons.close"
          block
        />
      </template>
    </u-select>
  </div>

  <div
    v-else-if="field.type === 'selectMenu'"
    class="relative"
    :class="field.class"
  >
    <transition
      enter-active-class="transition-all duration-200 ease-out"
      enter-from-class="opacity-0 -translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition-all duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-1"
    >
      <div
        v-if="modelValue || modelValue?.length"
        class="font-semibold text-xs bg-background absolute -top-2.5 bg-background z-10 left-2"
      >
        {{ field.label }}
      </div>
    </transition>
    <u-select-menu
      v-model="modelValue"
      :items="field.items"
      :placeholder="modelValue || modelValue?.length ? undefined : `Select ${field.label.toLowerCase()}`"
      :loading="field.loading"
      :multiple="field.multiple"
    >
      <template #content-bottom>
        <u-button
          label="Clear"
          size="xs"
          @click="field.multiple ? (modelValue = []) : (modelValue = undefined)"
          :icon="icons.close"
          block
        />
      </template>
    </u-select-menu>
  </div>

  <div
    v-if="field.type === 'input'"
    class="relative"
    :class="field.class"
  >
    <transition
      enter-active-class="transition-all duration-200 ease-out"
      enter-from-class="opacity-0 -translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition-all duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-1"
    >
      <div
        v-if="modelValue || modelValue?.length"
        class="font-semibold text-xs bg-background absolute -top-2.5 bg-background z-10 left-2"
      >
        {{ field.label }}
      </div>
    </transition>
    <u-input-menu
      v-model="modelValue"
      :items="field.items"
      :placeholder="modelValue ? undefined : `Select ${field.label.toLowerCase()}`"
    >
      <template #content-bottom>
        <u-button
          label="Clear"
          size="xs"
          @click="modelValue = undefined"
          :icon="icons.close"
          block
        />
      </template>
    </u-input-menu>
  </div>

  <div
    v-else-if="field.type === 'search'"
    class="relative"
    :class="field.class"
  >
    <transition
      enter-active-class="transition-all duration-200 ease-out"
      enter-from-class="opacity-0 -translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition-all duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-1"
    >
      <div
        v-if="modelValue || modelValue?.length"
        class="font-semibold text-xs bg-background absolute -top-2.5 bg-background z-10 left-2"
      >
        {{ field.label }}
      </div>
    </transition>
    <form-select-search
      :type="field.subType!"
      v-model="modelValue"
      :placeholder="modelValue || modelValue?.length > 0 ? undefined : `Select ${field.label.toLowerCase()}`"
      :key="field.key"
      :multiple="field.multiple"
      block
    />
  </div>
</template>
