export default defineAppConfig({
  ui: {
    colors: {
      primary: "sky",
      secondary: "violet",
      warning: "amber",
      info: "indigo",
      error: "red",
      success: "emerald",
      neutral: "slate"
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
    alert: { defaultVariants: { variant: "subtle" } },
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
    fileUpload: { slots: { root: "cursor-pointer" } },
    header: { slots: { title: "font-cursive" } },
    inputMenu: {
      slots: {
        content: "ring-primary cursor-pointer min-w-fit",
        trailingIcon: "group-data-[state=open]:rotate-180 duration-250 cursor-pointer"
      }
    },
    listbox: { slots: { content: "cursor-pointer" } },
    progress: {
      variants: {
        orientation: {
          horizontal: {
            root: "flex-row items-center gap-5",
            status: "max-w-fit text-default"
          }
        },
        inverted: {
          false: {
            root: "flex-row-reverse"
          }
        }
      },
      defaultVariants: { animation: "swing" }
    },
    radioGroup: {
      slots: {
        base: "cursor-pointer",
        label: "cursor-pointer"
      }
    },
    table: {
      slots: {
        root: "scrollbar max-h-[calc(100vh-18rem)]",
        th: "text-center",
        tbody: "[&>tr]:data-[selectable=true]:cursor-pointer",
        td: "py-1.5 text-center"
      },
      defaultVariants: { loadingAnimation: "swing" }
    },
    tabs: {
      slots: { root: "space-y-6", content: "max-h-[calc(100vh-23rem)] overflow-y-auto" },
      defaultVariants: { size: "md" }
    }
  }
})
