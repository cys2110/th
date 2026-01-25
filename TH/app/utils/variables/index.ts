export const ALL_YEARS = Array.from({ length: new Date().getFullYear() - 1968 + 1 }, (_, i) => 1968 + i)

export const CONTINENTS = Object.values(ContinentEnum.enum)

export const FLASK_ROUTE = "http://127.0.0.1:5001"

export const TOUR_OPTIONS = ["ATP", "WTA", "ITF-M", "ITF-W"]
