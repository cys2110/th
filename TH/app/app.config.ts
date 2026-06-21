export default defineAppConfig({
  ui: {
    colors: {
      primary: "violet",
      success: "green",
      warning: "amber",
      info: "indigo",
      error: "red",
      ATP: "sky",
      WTA: "pink",
      "ITF-M": "blue",
      "ITF-W": "mauve",
      Active: "emerald",
      Inactive: "olive",
      Singles: "orange",
      Doubles: "fuchsia",
      Tour: "teal",
      Challenger: "stone",
      ITF: "rose",
      Main: "lime",
      Qualifying: "mist"
    },
    icons: {
      arrowLeft: "line-md:arrow-left-circle-twotone",
      arrowRight: "line-md:arrow-right-circle-twotone",
      caution: "line-md:alert-circle-twotone-loop",
      check: "material-symbols-light:check-small-rounded",
      chevronDoubleLeft: "line-md:chevron-small-double-left",
      chevronDoubleRight: "line-md:chevron-small-double-right",
      chevronDown: "line-md:chevron-small-down",
      chevronLeft: "line-md:chevron-small-left",
      chevronRight: "line-md:chevron-small-right",
      chevronUp: "line-md:chevron-small-up",
      close: "line-md:close-circle-twotone",
      copy: "icon-park-twotone:copy",
      copyCheck: "material-symbols-light:library-add-check-outline-rounded",
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
      menu: "material-symbols-light:menu",
      minus: "line-md:minus",
      panelClose: "icon-park-twotone:expand-right",
      panelOpen: "icon-park-twotone:expand-left",
      plus: "line-md:plus-square-twotone",
      reload: "icon-park-twotone:update-rotation",
      search: "line-md:search-twotone",
      success: "line-md:circle-to-confirm-circle-twotone-transition",
      system: "line-md:monitor-twotone",
      tip: "line-md:lightbulb-twotone",
      upload: "line-md:uploading",
      warning: "line-md:alert-twotone-loop"
    },
    // alert: { defaultVariants: { variant: "subtle" } },
    badge: {
      slots: { base: "justify-center" },
      defaultVariants: { variant: "subtle", size: "md" }
    },
    button: {
      compoundVariants: [
        {
          loading: true,
          leading: true,
          class: { leadingIcon: "animate-none" }
        }
      ],
      defaultVariants: { variant: "subtle", size: "xs" }
    },
    calendar: {
      slots: { cellTrigger: "cursor-pointer" },
      compoundVariants: [
        {
          color: "primary",
          variant: "subtle",
          class: { cellTrigger: "hover:not-data-[selected]:bg-default" }
        }
      ],
      defaultVariants: { size: "xs", variant: "subtle" }
    },
    // checkbox: { slots: { label: "cursor-pointer" } },
    // checkboxGroup: {
    //   slots: {
    //     legend: "font-semibold",
    //     item: "cursor-pointer"
    //   },
    //   variants: { orientation: { vertical: { item: "ml-3" } } }
    // },
    commandPalette: { slots: { item: "cursor-pointer" } },
    // dropdownMenu: {
    //   slots: {
    //     content: "max-h-80 !min-w-fit border border-primary",
    //     item: "cursor-pointer"
    //   }
    // },
    empty: { slots: { actions: "flex-nowrap" } },
    // fieldGroup: { base: "w-full" },
    footerColumns: { slots: { center: "xl:col-span-3" } },
    // formField: {
    //   slots: { label: "font-semibold text-muted" },
    //   variants: {
    //     orientation: {
    //       horizontal: { container: "flex-1" }
    //     }
    //   }
    // },
    header: { slots: { title: "font-cursive" } },
    // inputDate: { slots: { base: "focus-within:ring focus-within:ring-2 focus-within:ring-primary" } },
    // inputMenu: {
    //   slots: {
    //     content: "ring-primary cursor-pointer",
    //     trailingIcon: "group-data-[state=open]:rotate-180 duration-250 cursor-pointer"
    //   }
    // },
    // listbox: { slots: { content: "cursor-pointer" } },
    main: { base: "min-h-0 h-[calc(100vh-var(--ui-header-height))] overflow-y-auto" },
    navigationMenu: { defaultVariants: { variant: "link" } },
    pageGrid: { base: "p-3" },
    pageHeader: {
      slots: {
        root: "sticky top-0 z-30 bg-default",
        wrapper: "flex-row justify-between",
        links: "justify-end"
      }
    },
    // progress: { slots: { status: "!w-full" } },
    // radioGroup: {
    //   slots: {
    //     base: "cursor-pointer",
    //     label: "cursor-pointer"
    //   },
    //   variants: {
    //     orientation: {
    //       vertical: { item: "ml-3" }
    //     }
    //   }
    // },
    select: {
      slots: {
        content: "ring-primary cursor-pointer min-w-fit",
        trailingIcon: "group-data-[state=open]:rotate-180 duration-250"
      }
    },
    selectMenu: {
      slots: {
        content: "ring-primary cursor-pointer min-w-fit",
        trailingIcon: "group-data-[state=open]:rotate-180 duration-250"
      }
    },
    // slideover: { slots: { body: "flex flex-col gap-5" } },
    // slider: { slots: { thumb: "cursor-pointer", track: "cursor-pointer" } },
    // stepper: { slots: { trigger: "cursor-pointer" } },
    // switch: {
    //   slots: {
    //     base: "data-[state=checked]:bg-primary-200 data-[state=unchecked]:dark:bg-primary-800 cursor-pointer",
    //     icon: "group-data-[state=unchecked]:text-primary-400"
    //   }
    // },
    table: {
      slots: {
        root: "scrollbar max-h-[70vh]",
        th: "text-center",
        tbody: "[&>tr]:data-[selectable=true]:hover:bg-elevated/50",
        td: "py-1 text-center"
      },
      defaultVariants: { loadingAnimation: "swing" }
    }
    // tabs: {
    //   slots: { root: "space-y-6", content: "max-h-[calc(100vh-23rem)] overflow-y-auto" },
    //   defaultVariants: { size: "md" }
    // }
  }
})
