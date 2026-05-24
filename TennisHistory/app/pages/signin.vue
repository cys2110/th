<script setup lang="ts">
import type { AuthFormField, FormSubmitEvent } from "@nuxt/ui"
import { object, string, z } from "zod"

useHead({ title: "Sign In" })

const schema = object({
  username: string("Username is required"),
  password: string("Password is required")
})
type Schema = z.infer<typeof schema>

const {
  ui: { icons }
} = useAppConfig()

const supabase = useSupabaseClient()
const router = useRouter()
const toast = useToast()

const fields: Array<AuthFormField> = [
  { name: "username", type: "text", label: "Username", placeholder: "Enter username", required: true },
  { name: "password", type: "password", label: "Password", placeholder: "Enter password", required: true }
]

const onSubmit = async (event: FormSubmitEvent<Schema>) => {
  const { data, error } = await supabase.from("users").select("email").eq("username", event.data.username).single()

  if (error) {
    console.error("Error fetching user:", error)

    toast.add({
      title: "This username does not exist",
      icon: icons.error,
      color: "error"
    })
    return
  }

  console.log({ email: data.email, password: event.data.password })

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: event.data.password.toString()
  })

  if (signInError) {
    console.error("Error signing in:", signInError)
    if (signInError.message === "Invalid login credentials") {
      toast.add({
        title: "Invalid password",
        icon: icons.error,
        color: "error"
      })
    } else {
      toast.add({
        title: "Error signing in",
        icon: icons.error,
        color: "error"
      })
    }
  } else {
    toast.add({
      title: "Successfully signed in!",
      icon: icons.success,
      color: "success"
    })

    router.push({ name: "home" })
  }
}
</script>

<template>
  <div class="size-full grid place-items-center">
    <u-card class="max-w-md w-full">
      <u-auth-form
        :schema
        title="Sign In"
        :icon="ICONS.racquet"
        :fields
        @submit="onSubmit"
      />

      <template #footer>
        <u-button
          block
          color="success"
          label="Sign up"
          :to="{ name: 'signup' }"
        />
      </template>
    </u-card>
  </div>
</template>
