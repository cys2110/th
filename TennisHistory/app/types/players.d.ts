declare global {
  interface BasePlayerType {
    id: string
    first_name: string | null
    last_name: string | null
    country: CountryType | null
  }

  interface PlayerInterface extends BasePlayerType {
    tour: TourType | null
    turned_pro: number | null
    retired: number | null
    activeYears: Array<number>
    ch_singles: number | null
    ch_singles_date: string | null
    ch_doubles: number | null
    ch_doubles_date: string | null
    current_singles: number | null
    current_doubles: number | null
    turned_pro: number | null
    retired: number | null
    dob: string | null
    dod: string | null
    height: number | null
    hof: number | null
    pm: number | null
    site_link: string | null
    wiki_link: string | null
    official_link: string | null
    countries: Array<{
      start_date: string | null
      end_date: string | null
      id: string
      country: CountryType
    }>
    coaches: Array<{
      id: string
      years: string | null
      status: "Current" | "Former"
      coach: PersonInterface & { player_id: string | null }
    }>
    bh: "One" | "Two" | null
    rh: "Right" | "Left" | null
    updated_at: string
  }
}

export {}
