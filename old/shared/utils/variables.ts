export const ATP_TOUR_CATEGORIES: CategoryType[] = [
  "Grand Slam",
  "ATP Finals",
  "ATP Masters 1000",
  "ATP 500",
  "ATP 250",
  "Next Gen ATP Finals",
  "Laver Cup",
  "ATP Cup",
  "ATP Masters Series",
  "ATP International Series Gold",
  "ATP International Series",
  "ATP World Series",
  "ATP Super 9",
  "ATP Championship Series",
  "ATP Championship Series, Single Week",
  "World Team Cup",
  "Grand Slam Cup",
  "ILTF",
  "NTL",
  "Grand Prix"
]

export const WTA_TOUR_CATEGORIES: CategoryType[] = [
  "Grand Slam",
  "WTA Finals",
  "WTA 1000",
  "WTA 500",
  "WTA 250",
  "ATP Cup",
  "WTA Elite Trophy",
  "WTA Premier Mandatory",
  "WTA Premier Five",
  "WTA Premier",
  "WTA International Tournaments",
  "ILTF",
  "NTL"
]

export const TOUR_CATEGORIES: CategoryType[] = [...ATP_TOUR_CATEGORIES, ...WTA_TOUR_CATEGORIES]

export const ATP_CHALLENGER_CATEGORIES: CategoryType[] = [
  "ATP Challenger 175",
  "ATP Challenger 125",
  "ATP Challenger 100",
  "ATP Challenger 75",
  "ATP Challenger 50"
]

export const WTA_CHALLENGER_CATEGORIES: CategoryType[] = ["WTA 125"]

export const CHALLENGER_CATEGORIES: CategoryType[] = [...ATP_CHALLENGER_CATEGORIES, ...WTA_CHALLENGER_CATEGORIES]

export const ATP_CATEGORIES: CategoryType[] = [...ATP_TOUR_CATEGORIES, ...ATP_CHALLENGER_CATEGORIES]

export const WTA_CATEGORIES: CategoryType[] = [...WTA_TOUR_CATEGORIES, ...WTA_CHALLENGER_CATEGORIES]

export const ITF_MEN_CATEGORIES: CategoryType[] = ["Davis Cup", "Olympics", "ITF M25", "ITF"]

export const ITF_WOMEN_CATEGORIES: CategoryType[] = ["Billie Jean King Cup", "Olympics", "ITF", "ITF W75", "ITF W100", "ITF W15"]

export const ITF_CATEGORIES: CategoryType[] = [...ITF_MEN_CATEGORIES, ...ITF_WOMEN_CATEGORIES]

export const MASTERS_CATEGORIES: CategoryType[] = [
  "ATP Masters 1000",
  "ATP Masters Series",
  "ATP Championship Series",
  "ATP Championship Series, Single Week",
  "WTA 1000",
  "WTA Premier Mandatory"
]

export const ALL_CATEGORIES = [...TOUR_CATEGORIES, ...CHALLENGER_CATEGORIES, ...ITF_CATEGORIES].sort()

export const CATEGORY_COLOURS = Object.values(COLOURS)

export const STATUSES: Record<StatusType, { longName: string; class: string }> = {
  Q: { longName: "Qualifier", class: "bg-emerald-300 text-green-800" },
  WC: { longName: "Wild Card", class: "bg-blue-300 text-blue-800" },
  LL: { longName: "Lucky Loser", class: "bg-red-300 text-red-800" },
  AL: { longName: "Alternate", class: "bg-amber-300 text-amber-800" },
  SE: { longName: "Special Exempt", class: "bg-fuchsia-300 text-fuchsia-800" },
  PR: { longName: "Protected Ranking", class: "bg-yellow-300 text-yellow-800" }
}
