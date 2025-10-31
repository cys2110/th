export const convertToFt = (height: number) => {
  const ftDecimal = convert(height, "cm").to("ft")
  const ft = Math.floor(ftDecimal)
  const inches = Math.round((ftDecimal - ft) * 12)
  return `${ft}' ${inches}"`
}

export const dateTimeFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric"
})

export const getFlagCode = (country: CountryInterface) => {
  const countryMapping: Record<string, string> = {
    HKG: "hong-kong-sar-china",
    GBR: "united-kingdom",
    TCH: "czechia",
    FRG: "germany",
    CIV: "cote-divoire",
    CGO: "congo-brazzaville",
    COD: "congo-kinshasa",
    TPE: "taiwan",
    SVK: "slovakia"
  }

  if (countryMapping[country.id]) {
    return `twemoji:flag-${countryMapping[country.id]}`
  } else if (country.id === "URS") {
    return "circle-flags:soviet-union"
  } else if (country.alpha2) {
    return `twemoji:flag-${country.name.toLowerCase().replace(/ /g, "-")}`
  } else {
    return `flags:${country.id}`
  }
}

export const shortDateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "numeric",
  year: "2-digit"
})
