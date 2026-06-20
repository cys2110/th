export default defineNuxtRouteMiddleware(to => {
  const currentYear = new Date().getFullYear()

  const query = { ...to.query }

  if (!query.year) {
    query.year = String(currentYear)

    return navigateTo({
      ...to,
      query
    })
  }
})
