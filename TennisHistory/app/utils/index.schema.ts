import { any, array, coerce, literal, object, string, url, z } from "zod"

export const countrySchema = object({
  id: string("IOC code is required"),
  name: string("Name is required"),
  continent: ContinentEnum,
  icon: string("Icon is required")
})
export type CountrySchema = z.infer<typeof countrySchema>

export const venueSchema = object({
  name: string().optional(),
  city: string("City is required"),
  country: object({ id: string(), name: string(), icon: string(), continent: ContinentEnum }, "Country is required")
})
export type VenueSchema = z.infer<typeof venueSchema>

export const venueUpdateSchema = object({
  id: string("ID is required"),
  name: string().optional(),
  city: string("City is required"),
  country: object({ id: string(), name: string(), icon: string(), continent: ContinentEnum }, "Country is required")
})
export type VenueUpdateSchema = z.infer<typeof venueUpdateSchema>

export const coachSchema = object({
  id: z.number().optional(),
  person: object({ id: string() }).optional(),
  years: string().nullish(),
  status: string()
})
export type CoachSchema = z.infer<typeof coachSchema>

export const nationalitySchema = object({
  id: z.number().optional(),
  country_id: string("Country is required"),
  start_date: any().optional(),
  end_date: any().optional()
})
export type NationalitySchema = z.infer<typeof nationalitySchema>

export const playerSchema = object({
  id: coerce.string("ID is required"),
  first_name: string("First name is required"),
  last_name: string("Last name is required"),
  dob: any().nullish(),
  dod: any().nullish(),
  nationality_id: string("Nationality is required"),
  birth_place: string().nullish(),
  birth_country_id: string().optional(),
  bh: string().nullish(),
  rh: string().nullish(),
  height: coerce.number("Height must be a number").int("Height must be an integer").positive("Height must be positive").nullish(),
  hof: any().nullish(),
  tour: TourEnum,
  official_link: url("Website must be a valid URL").nullish(),
  pm: coerce
    .number("Prize money must be a number")
    .int("Prize money must be an integer")
    .nonnegative("Prize money cannot be a negative number")
    .nullish(),
  retired: any().nullish(),
  turned_pro: any().nullish(),
  current_singles: coerce.number("Rank must be a number").nullish(),
  ch_singles: coerce.number("Rank must be a number").nullish(),
  ch_singles_date: any().nullish(),
  current_doubles: coerce.number("Rank must be a number").nullish(),
  ch_doubles: coerce.number("Rank must be a number").nullish(),
  ch_doubles_date: any().nullish(),
  coaches: array(coachSchema).default([]),
  prev_nationalities: array(nationalitySchema).default([]),
  image: z
    .instanceof(File, {
      message: "Please select an image file."
    })
    .refine(file => file.size <= MAX_FILE_SIZE, {
      message: `The image is too large. Please choose an image smaller than ${formatBytes(MAX_FILE_SIZE)}.`
    })
    .refine(file => ACCEPTED_IMAGE_TYPES.includes(file.type), {
      message: "Please upload a valid image file (JPEG, PNG, or WebP)."
    })
    .nullish(),
  image_url: string().nullish(),
  person_id: string().optional()
})
export type PlayerInputSchema = z.input<typeof playerSchema>
export type PlayerSchema = z.infer<typeof playerSchema>

export const tournamentSchema = object({
  name: string("Tournament name is required"),
  mens_id: coerce.number().int("ATP ID must be an integer").positive("ATP ID must be positive").nullish(),
  womens_id: coerce.number().int("WTA ID must be an integer").positive("WTA ID must be positive").nullish(),
  tours: array(TourEnum).default([]),
  established: any().nullish(),
  abolished: any().nullish(),
  website: url("Website must be a valid URL.").nullish(),
  logo: z
    .instanceof(File, {
      message: "Please select an image file."
    })
    .refine(file => file.size <= MAX_FILE_SIZE, {
      message: `The image is too large. Please choose an image smaller than ${formatBytes(MAX_FILE_SIZE)}.`
    })
    .refine(file => ACCEPTED_IMAGE_TYPES.includes(file.type), {
      message: "Please upload a valid image file (JPEG, PNG, or WebP)."
    })
    .optional()
}).superRefine((data, ctx) => {
  if (!data.mens_id && data.tours.includes("ATP")) {
    ctx.addIssue({
      code: "custom",
      path: ["mens_id"],
      message: "Men's tournament ID is required."
    })
  }

  if (!data.womens_id && data.tours.includes("WTA")) {
    ctx.addIssue({
      code: "custom",
      path: ["womens_id"],
      message: "Women's tournament ID is required."
    })
  }
})
export type TournamentInputSchema = z.input<typeof tournamentSchema>
export type TournamentSchema = z.infer<typeof tournamentSchema>

export const tournamentUpdateSchema = tournamentSchema.extend({
  id: string("ID is required"),
  logo_url: string().nullish()
})
export type TournamentUpdateInput = z.input<typeof tournamentUpdateSchema>
export type TournamentUpdateSchema = z.infer<typeof tournamentUpdateSchema>

export const editionSchema = object({
  category: string().nullish(),
  currency: string().nullish(),
  draw_link: url("Draw link must be a valid URL").nullish(),
  draw_type: DrawTypeEnum.nullish(),
  draw_size: coerce.number("Draw size must be a number").int("Draw size must be an integer").positive("Draw size much be positive").nullish(),
  dates: any().nullish(),
  sponsor_name: string().nullish(),
  tfc: coerce.number("Total financial commitment must be a number").nonnegative("Total financial commitment cannot be a negative number").nullish(),
  tours: array(TourEnum).default([]),
  year: any(),
  edition_no: coerce
    .number("Edition number must be a number")
    .int("Edition number must be an integer")
    .positive("Edition number much be positive")
    .default(0),
  surface: string().nullish(),
  venue: object({ id: string() }).nullish()
})
export type EditionInput = z.input<typeof editionSchema>
export type EditionSchema = z.infer<typeof editionSchema>

export const editionUpdateSchema = editionSchema.extend({
  id: string()
})
export type EditionUpdateInput = z.input<typeof editionUpdateSchema>
export type EditionUpdateSchema = z.infer<typeof editionUpdateSchema>
