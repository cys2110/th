export default defineAppConfig({
  ui: {
    switch: {
      slots: {
        base: "data-[state=checked]:bg-primary-200 data-[state=unchecked]:dark:bg-primary-800 cursor-pointer",
        icon: "group-data-[state=unchecked]:text-primary-400"
      },
      defaultVariants: { size: "lg" }
    },
    collapsible: { slots: { content: "px-4 flex flex-col gap-2" } }
  }
})
