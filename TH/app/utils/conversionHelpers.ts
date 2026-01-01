/** Conversion helpers */

/**
 * @function convertToFt
 * @description Converts height from centimeters to feet and inches format.
 * @param {number} height - Height in centimeters.
 * @returns {string} Height in feet and inches (e.g., "5' 11"").
 */
export const convertToFt = (height: number) => {
  const ftDecimal = convert(height, "cm").to("ft")
  const ft = Math.floor(ftDecimal)
  const inches = Math.round((ftDecimal - ft) * 12)
  return `${ft}' ${inches}"`
}
