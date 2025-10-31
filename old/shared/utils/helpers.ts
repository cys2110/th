import appConfig from "~/app.config"

export const getColour = (index: number) => CATEGORY_COLOURS[index % CATEGORY_COLOURS.length]
