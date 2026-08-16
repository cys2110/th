export default defineAppConfig({
  ui: {
    alert: { defaultVariants: { variant: "subtle" } },

    checkboxGroup: {
      slots: {
        legend: "font-semibold",
        item: "cursor-pointer"
      }
    },
    commandPalette: { slots: { item: "cursor-pointer" } },
    dropdownMenu: {
      slots: {
        content: "max-h-80 !min-w-fit border border-primary",
        item: "cursor-pointer"
      }
    },
    inputDate: { slots: { base: "focus-within:ring focus-within:ring-2 focus-within:ring-primary" } },
    listbox: { slots: { content: "cursor-pointer" } },
    pageGrid: { base: "p-3" },
    pageHeader: {
      slots: {
        root: "sticky top-0 z-30 bg-default",
        wrapper: "flex-row justify-between",
        links: "justify-end"
      }
    },
    progress: { slots: { status: "!w-full" } },
    radioGroup: {
      slots: {
        base: "cursor-pointer",
        label: "cursor-pointer"
      },
      variants: {
        orientation: {
          vertical: { item: "ml-3" }
        }
      }
    },
    slideover: { slots: { body: "flex flex-col gap-5" } },
    slider: { slots: { thumb: "cursor-pointer", track: "cursor-pointer" } },
    stepper: { slots: { trigger: "cursor-pointer" } },
    switch: {
      slots: {
        base: "data-[state=checked]:bg-primary-200 data-[state=unchecked]:dark:bg-primary-800 cursor-pointer",
        icon: "group-data-[state=unchecked]:text-primary-400"
      }
    },
    tabs: {
      slots: { root: "space-y-6", content: "max-h-[calc(100vh-23rem)] overflow-y-auto" },
      defaultVariants: { size: "md" }
    }
  }
})
