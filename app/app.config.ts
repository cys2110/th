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
      check: "line-md:square-twotone-to-confirm-square-twotone-transition",
      chevronDoubleLeft: "line-md:chevron-small-double-left",
      chevronDoubleRight: "line-md:chevron-small-double-right",
      chevronDown: "line-md:chevron-small-down",
      chevronLeft: "line-md:chevron-small-left",
      chevronRight: "line-md:chevron-small-right",
      chevronUp: "line-md:chevron-small-up",
      close: "line-md:close-circle-twotone",
      copy: "solar:copy-bold-duotone",
      copyCheck: "tabler:copy-check",
      dark: "line-md:moon-rising-twotone-alt-loop",
      ellipsis: "tabler:dots-circle-horizontal",
      error: "line-md:close-circle-twotone",
      external: "line-md:external-link-rounded",
      eye: "line-md:watch-twotone",
      eyeOff: "line-md:watch-off-twotone",
      file: "line-md:file-document-twotone",
      folder: "tabler:folder",
      folderOpen: "tabler:folder-open",
      hash: "line-md:hash-small",
      info: "solar:info-circle-bold-duotone",
      light: "line-md:sun-rising-twotone-loop",
      loading: "line-md:loading-twotone-loop",
      menu: "solar:hamburger-menu-line-duotone",
      minus: "line-md:minus",
      panelClose: "tabler:layout-sidebar-left-collapse",
      panelOpen: "tabler:layout-sidebar-left-expand",
      plus: "line-md:plus-square-twotone",
      reload: "line-md:rotate-270",
      search: "line-md:search-twotone",
      success: "line-md:circle-to-confirm-circle-twotone-transition",
      system: "line-md:monitor-twotone",
      tip: "line-md:lightbulb-twotone",
      upload: "line-md:uploading",
      warning: "line-md:alert-twotone-loop"
    },
    alert: { defaultVariants: { variant: "subtle" } },
    badge: { defaultVariants: { variant: "subtle" } },
    button: {
      slots: { base: "cursor-pointer" },
      defaultVariants: { variant: "subtle", size: "xs" }
    },
    calendar: { slots: { cell: "cursor-pointer" }, defaultVariants: { size: "xs", variant: "subtle" } },
    checkbox: { slots: { base: "cursor-pointer", label: "cursor-pointer" }, defaultVariants: { size: "sm" } },
    checkboxGroup: { slots: { item: "cursor-pointer" }, defaultVariants: { size: "sm" } },
    commandPalette: { slots: { input: "[&>input]:h-8 text-xs", item: "cursor-pointer text-sm" } },
    dashboardPanel: {
      slots: {
        root: "h-screen max-w-screen lg:max-w-[calc(100vw-3%)]",
        body: "scroll-smooth"
      }
    },
    dashboardSidebar: { slots: { header: "justify-center font-cursive lg:text-lg xl:text-xl 2xl:text-2xl" } },
    dropdownMenu: { slots: { content: "max-h-80 !min-w-fit border border-primary", item: "cursor-pointer" } },
    empty: { slots: { actions: "flex-nowrap" } },
    footerColumns: { slots: { center: "xl:col-span-3" } },
    formField: { slots: { label: "font-semibold text-muted" }, defaultVariants: { size: "sm" } },
    header: { slots: { container: "max-w-full", title: "font-cursive" } },
    input: { slots: { root: "w-full" }, defaultVariants: { size: "sm" } },
    inputDate: {
      slots: { base: "w-full focus-within:ring focus-within:ring-2 focus-within:ring-primary" },
      defaultVariants: { size: "sm" }
    },
    inputMenu: {
      slots: {
        root: "w-full",
        content: "ring-primary cursor-pointer w-full",
        trailingIcon: "group-data-[state=open]:rotate-180 duration-250"
      },
      defaultVariants: { size: "sm" }
    },
    inputNumber: {
      slots: { root: "w-full" },
      defaultVariants: { size: "sm" }
    },
    inputTags: { slots: { root: "w-full" }, defaultVariants: { size: "sm" } },
    navigationMenu: { defaultVariants: { variant: "link" } },
    pageAside: { slots: { container: "*:my-2" } },
    pageGrid: { base: "scrollbar-thin scrollbar-thumb-primary-600 scrollbar-track-transparent overflow-y-auto scroll-smooth max-h-200 p-5" },
    pageHeader: { slots: { wrapper: "flex-row justify-between" } },
    pageLinks: { slots: { link: "cursor-pointer" } },
    pageList: { base: "scrollbar-thin scrollbar-thumb-primary-600 scrollbar-track-transparent overflow-y-auto scroll-smooth max-h-200 p-5" },
    progress: { slots: { status: "!w-full" } },
    radioGroup: {
      slots: { base: "cursor-pointer", label: "cursor-pointer" },
      defaultVariants: { size: "sm" }
    },
    select: {
      slots: {
        base: "cursor-pointer w-full",
        content: "ring-primary cursor-pointer w-full",
        trailingIcon: "group-data-[state=open]:rotate-180 duration-250"
      },
      defaultVariants: { size: "sm" }
    },
    selectMenu: {
      slots: {
        base: "cursor-pointer w-full",
        content: "ring-primary cursor-pointer w-full",
        trailingIcon: "group-data-[state=open]:rotate-180 duration-250"
      },
      defaultVariants: { size: "sm" }
    },
    slideover: { slots: { body: "flex flex-col gap-5" } },
    slider: { slots: { thumb: "cursor-pointer", track: "cursor-pointer" }, defaultVariants: { size: "sm" } },
    stepper: { slots: { trigger: "cursor-pointer" } },
    switch: {
      slots: {
        base: "data-[state=checked]:bg-primary-200 data-[state=unchecked]:dark:bg-primary-800 cursor-pointer",
        icon: "group-data-[state=unchecked]:text-primary-400"
      },
      defaultVariants: { size: "sm" }
    },
    table: {
      slots: {
        root: "scrollbar-thin scrollbar-thumb-primary-600 scrollbar-track-transparent",
        th: "text-xs text-center py-1",
        td: "text-xs md:text-sm text-center py-1"
      },
      defaultVariants: { loadingAnimation: "swing" }
    },
    tabs: { slots: { trigger: "cursor-pointer" } },
    textarea: { slots: { root: "w-full" }, defaultVariants: { size: "sm" } }
  }
})
