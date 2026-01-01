export default defineAppConfig({
  ui: {
    colors: {
      primary: "sky",
      success: "green",
      warning: "amber",
      error: "red",
      ATP: "violet",
      WTA: "lime",
      "ITF-M": "blue",
      "ITF-W": "zinc",
      Active: "emerald",
      Inactive: "indigo",
      Singles: "orange",
      Doubles: "fuchsia",
      Tour: "teal",
      Challenger: "stone",
      ITF: "rose",
      Main: "pink",
      Qualifying: "gray"
    },
    icons: {
      arrowLeft: "line-md:arrow-left-circle-twotone",
      arrowRight: "line-md:arrow-right-circle-twotone",
      caution: "line-md:alert-circle-twotone-loop",
      check: "stash:check-duotone",
      chevronDoubleLeft: "line-md:chevron-small-double-left",
      chevronDoubleRight: "line-md:chevron-small-double-right",
      chevronDown: "line-md:chevron-small-down",
      chevronLeft: "line-md:chevron-small-left",
      chevronRight: "line-md:chevron-small-right",
      chevronUp: "line-md:chevron-small-up",
      close: "line-md:close-circle-twotone",
      copy: "icon-park-twotone:copy",
      copyCheck: "gravity-ui:copy-check",
      dark: "line-md:moon-rising-twotone-alt-loop",
      ellipsis: "icon-park-twotone:more-three",
      error: "line-md:close-circle-twotone",
      external: "line-md:external-link-rounded",
      eye: "line-md:watch-twotone",
      eyeOff: "line-md:watch-off-twotone",
      file: "line-md:file-document-twotone",
      folder: "line-md:folder-twotone",
      folderOpen: "icon-park-twotone:folder-open",
      hash: "line-md:hash-small",
      info: "icon-park-twotone:info",
      light: "line-md:sun-rising-twotone-loop",
      loading: "line-md:loading-twotone-loop",
      menu: "solar:hamburger-menu-line-duotone",
      minus: "line-md:minus",
      panelClose: "icon-park-twotone:expand-right",
      panelOpen: "icon-park-twotone:expand-left",
      plus: "line-md:plus-square-twotone",
      reload: "stash:arrows-switch-duotone",
      search: "line-md:search-twotone",
      success: "line-md:circle-to-confirm-circle-twotone-transition",
      system: "line-md:monitor-twotone",
      tip: "line-md:lightbulb-twotone",
      upload: "line-md:uploading",
      warning: "line-md:alert-twotone-loop"
    },
    badge: {
      slots: { base: "justify-center" },
      defaultVariants: { variant: "subtle", size: "md" }
    },
    button: {
      slots: { base: "cursor-pointer" },
      defaultVariants: { variant: "subtle", size: "xs" }
    },
    checkbox: {
      slots: {
        base: "cursor-pointer",
        label: "cursor-pointer"
      }
    },
    checkboxGroup: {
      slots: {
        legend: "font-semibold",
        item: "cursor-pointer"
      },
      variants: { orientation: { vertical: { item: "ml-3" } } }
    },
    commandPalette: { slots: { item: "cursor-pointer" } },
    dropdownMenu: {
      slots: {
        content: "max-h-80 !min-w-fit border border-primary",
        item: "cursor-pointer"
      }
    },
    footerColumns: { slots: { center: "xl:col-span-3" } },
    formField: { slots: { label: "font-semibold text-muted text-sm" } },
    header: { slots: { title: "font-cursive" } },
    input: { slots: { root: "w-full" } },
    inputDate: { slots: { base: "w-full focus-within:ring focus-within:ring-2 focus-within:ring-primary" } },
    inputMenu: {
      slots: {
        root: "w-full",
        content: "ring-primary cursor-pointer",
        trailingIcon: "group-data-[state=open]:rotate-180 duration-250 cursor-pointer"
      }
    },
    pageAside: { slots: { container: "*:my-2" } },
    pageGrid: {
      base: "scrollbar p-5"
    },
    pageHeader: {
      slots: {
        root: "sticky top-(--ui-header-height) z-50 bg-default",
        wrapper: "flex-row justify-between"
      }
    },
    progress: { slots: { status: "w-full!" } },
    select: {
      slots: {
        base: "cursor-pointer w-full",
        content: "ring-primary cursor-pointer w-full",
        trailingIcon: "group-data-[state=open]:rotate-180 duration-250"
      }
    },
    slideover: { slots: { body: "flex flex-col gap-5" } },
    switch: {
      slots: {
        base: "data-[state=checked]:bg-primary-200 data-[state=unchecked]:dark:bg-primary-800 cursor-pointer",
        icon: "group-data-[state=unchecked]:text-primary-400"
      }
    },
    table: {
      slots: {
        root: "scrollbar",
        tbody: "[&>tr]:data-[selectable=true]:cursor-pointer",
        td: "py-1"
      },
      defaultVariants: { loadingAnimation: "swing" }
    },
    tabs: {
      slots: { trigger: "cursor-pointer" },
      defaultVariants: { size: "md" }
    },
    textarea: { slots: { root: "w-full" } }
  }
})
