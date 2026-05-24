export const useAuthState = () => {
  const supabase = useSupabaseClient()

  const user = useSupabaseUser()
  const isAdmin = useState("isAdmin", () => false)

  const fetchAdminUser = async () => {
    isAdmin.value = false
    const { data, error } = await supabase
      .from("users")
      .select("username")
      .eq("id", user.value?.sub as string)
      .single()

    if (error || !data) {
      console.error("Error fetching admin user:", error)
      return
    }

    isAdmin.value = data.username === "admin"
  }

  watch(
    user,
    () => {
      if (user.value) fetchAdminUser()
    },
    { immediate: true }
  )

  return {
    user,
    isLoggedIn: computed(() => !!user.value),
    isAdmin
  }
}
