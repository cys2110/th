import { int, Date as NeoDate } from "neo4j-driver"

export default defineEventHandler(async event => {
  interface QueryProps {
    id: string
    first_name?: string
    last_name?: string
    tour?: string
    country?: { value: string; start_date?: any }
    previous_countries?: { value: string; start_date?: any; end_date?: any }[]
    turned_pro?: string
    retired?: string
    coaches?: string[]
    former_coaches?: string[]
    site_link?: string
    wiki_link?: string
    official_link?: string
    bh?: string
    rh?: string
    dob?: string
    dod?: string
    height?: string
    hof?: string
  }

  const {
    id,
    first_name,
    last_name,
    tour,
    country,
    previous_countries,
    turned_pro,
    retired,
    coaches,
    former_coaches,
    site_link,
    wiki_link,
    official_link,
    bh,
    rh,
    dob,
    dod,
    height,
    hof
  } = getQuery<QueryProps>(event)

  const dobDate = dob ? JSON.parse(dob) : null
  const dodDate = dod ? JSON.parse(dod) : null

  const convertDate = (date: any) => {
    if (!date) return null
    let obj = date
    if (typeof date === "string") {
      try {
        obj = JSON.parse(date)
      } catch (e) {
        return null
      }
    }
    if (obj && typeof obj === "object" && "year" in obj) {
      return new Date(obj.year, obj.month - 1, obj.day)
    }
    return null
  }

  const normaliseCountry = (item: any) => {
    const country = typeof item === "string" ? JSON.parse(item) : item
    const start_date = convertDate(country.start_date)
    const end_date = convertDate(country.end_date)
    return {
      ...country,
      start_date: start_date ? NeoDate.fromStandardDate(start_date) : null,
      end_date: end_date ? NeoDate.fromStandardDate(end_date) : null
    }
  }

  const coachesArray = coaches ? (Array.isArray(coaches) ? coaches : [coaches]) : []
  const formerCoachesArray = former_coaches ? (Array.isArray(former_coaches) ? former_coaches : [former_coaches]) : []

  const formerCountriesArray = previous_countries ? (Array.isArray(previous_countries) ? previous_countries : [previous_countries]) : []
  const normalisedPreviousCountries = formerCountriesArray.map(normaliseCountry)
  const normalisedCountry = country ? normaliseCountry(country) : null

  console.log(coachesArray, formerCoachesArray)

  const { summary } = await useDriver().executeQuery(
    `/* cypher */
      CYPHER 25
      MATCH (p:Player {id: $id})
      SET p.first_name = $first_name, p.last_name = $last_name, p.site_link = $site_link, p.wiki_link = $wiki_link, p.official_link = $official_link, p.bh = $bh, p.rh = $rh, p.height = $height, p.dob = $dob, p.dod = $dod, p.updated_at = date()
      CALL (p) {
        WITH [x IN labels(p) WHERE NOT x <> $tour AND NOT x IN ['Player', 'Coach']] AS remove
        REMOVE p:$(remove) SET p:$($tour)
      }
      CALL (p) {
        MATCH (p)-[v:REPRESENTS]->(c:Country)
        CALL (*) {
          WHEN NOT c.id = $country.value THEN {
            MATCH (c1:Country {id: $country.value})
            MERGE (p)-[v1:REPRESENTS]->(c1)
            SET v1.start_date = $country.start_date
            DELETE v
          }
          ELSE {
            SET v.start_date = $country.start_date
          }
        }
      }
      CALL (p) {
        WHEN $previous_countries IS NOT NULL THEN {
          OPTIONAL MATCH (p)-[v:REPRESENTED]->(c:Country)
          CALL (c, v) {
            WITH c, v WHERE NOT c.id IN [k IN $previous_countries | k.value]
            DELETE v
          }
          UNWIND $previous_countries AS k
          MATCH (c1:Country {id: k.value})
          MERGE (p)-[v1:REPRESENTED]->(c1)
          SET v1.start_date = k.start_date, v1.end_date = k.end_date
        }
      }
      CALL (p) {
        WHEN $turned_pro IS NOT NULL THEN {
          MATCH (y:Year {id: $turned_pro})
          MERGE (p)-[:TURNED_PRO]->(y)
        }
      }
      CALL (p) {
        WHEN $retired IS NOT NULL THEN {
          MATCH (y:Year {id: $retired})
          MERGE (p)-[:RETIRED]->(y)
        }
      }
      CALL (p) {
        WHEN $hof IS NOT NULL THEN {
          MATCH (y:Year {id: $hof})
          MERGE (p)-[:HOF]->(y)
        }
      }
      CALL (p) {
        WHEN $coaches IS NOT NULL THEN {
          OPTIONAL MATCH (x:Coach)-[r:COACHES]->(p)
          CALL (x, r) {
            WITH x, r WHERE NOT x.id IN [k IN $coaches | k.value]
            DELETE r
          }
          UNWIND $coaches AS k
          MATCH (x1:Coach {id: k.value})
          MERGE (x1)-[q:COACHES]->(p)
          SET q.years = k.years
        }
      }
      CALL (p) {
        WHEN $former_coaches IS NOT NULL THEN {
          OPTIONAL MATCH (x:Coach)-[r:COACHED]->(p)
          CALL (x, r) {
            WITH x, r WHERE NOT x.id IN [k IN $former_coaches | k.value]
            DELETE r
          }
          UNWIND $former_coaches AS k
          MATCH (x1:Coach {id: k.value})
          MERGE (x1)-[q:COACHED]->(p)
          SET q.years = k.years
        }
      }
    `,
    {
      id,
      tour: tour || null,
      first_name: first_name || null,
      previous_countries: normalisedPreviousCountries,
      coaches: coachesArray.map(c => JSON.parse(c)),
      former_coaches: formerCoachesArray.map(c => JSON.parse(c)),
      site_link: site_link || null,
      official_link: official_link || null,
      last_name: last_name || null,
      wiki_link: wiki_link || null,
      country: normalisedCountry,
      turned_pro: turned_pro ? int(turned_pro) : null,
      retired: retired ? int(retired) : null,
      bh: bh || null,
      rh: rh || null,
      dob: dob ? NeoDate.fromStandardDate(new Date(dobDate.year, dobDate.month - 1, dobDate.day)) : null,
      dod: dod ? NeoDate.fromStandardDate(new Date(dodDate.year, dodDate.month - 1, dodDate.day)) : null,
      height: height ? int(height) : null,
      hof: hof ? int(hof) : null
    }
  )

  console.log(
    `Notifications for player update: `,
    summary.gqlStatusObjects.filter(s => s.gqlStatus !== "00000" && !s.gqlStatus.startsWith("01N5"))
  )

  if (Object.values(summary.counters.updates()).every(v => v === 0)) {
    throw createError({ statusCode: 400, statusMessage: "Player could not be updated" })
  } else {
    return { ok: true }
  }
})
