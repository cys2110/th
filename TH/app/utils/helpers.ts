


export const dateTimeFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC"
})


export const getFlagCode = (country: CountryType) => {
  const circleFlagsMapping: Record<typeof country.id, string> = {
    URS: "soviet-union",
    YUG: "yu",
    TCH: "cs",
    NMI: "mp"
  }

  if (circleFlagsMapping[country.id]) {
    return `circle-flags:${circleFlagsMapping[country.id]}`
  } else if (!country.alpha2) {
    if (country.id === "POC") {
      return "flag:pc-4x3"
    }
    return `twemoji:flag-${kebabCase(country.name)}`
  } else if (["ch", "np"].includes(country.alpha2)) {
    return `flag:${country.alpha2}-1x1`
  }
  return `flag:${country.alpha2}-4x3`
}


export const shortDateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "numeric",
  year: "2-digit",
  timeZone: "UTC"
})
