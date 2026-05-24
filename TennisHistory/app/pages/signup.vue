<script setup lang="ts">
import type { AuthFormField, FormSubmitEvent } from "@nuxt/ui"
import { email, object, string, z } from "zod"

useHead({ title: "Sign Up" })

const baseSchema = object({
  username: string("Username is required").min(4, "Username must be at least 4 characters"),
  email: email("Email is required"),
  first_name: string("First name is required").min(1, "First name is required"),
  last_name: string("Last name is required").min(1, "Last name is required"),
  password: string("Password is required").min(8, "Password must be at least 8 characters"),
  confirmPassword: string("Confirm password is required")
})

const schema = baseSchema.refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],

  // run if password & confirmPassword are valid
  when(payload) {
    return baseSchema.pick({ password: true, confirmPassword: true }).safeParse(payload.value).success
  }
})

type Schema = z.infer<typeof schema>

const {
  ui: { icons }
} = useAppConfig()

const supabase = useSupabaseClient()
const router = useRouter()
const toast = useToast()

const emailAddress = ref("")
const showOtp = ref(false)
const otp = ref([])

const fields: Array<AuthFormField> = [
  { name: "username", type: "text", label: "Username", placeholder: "Enter username", required: true },
  { name: "first_name", type: "text", label: "First Name", placeholder: "Enter first name", required: true },
  { name: "last_name", type: "text", label: "Last Name", placeholder: "Enter last name", required: true },
  { name: "email", type: "text", label: "Email", placeholder: "Enter email", required: true },
  { name: "password", type: "password", label: "Password", placeholder: "Enter password", required: true },
  { name: "confirmPassword", type: "password", label: "Confirm Password", placeholder: "Confirm password", required: true }
]

const onSubmit = async (event: FormSubmitEvent<Schema>) => {
  const { data, error } = await supabase.from("users").select("id").eq("username", event.data.username).maybeSingle()

  if (error) {
    console.error("Error fetch username", error)
    return
  }

  if (data) {
    toast.add({
      title: "This username is already in use. Please choose another.",
      icon: icons.error,
      color: "error"
    })
    return
  }

  const { error: signUpError } = await supabase.auth.signInWithOtp({
    email: event.data.email,
    options: {
      data: {
        username: event.data.username,
        first_name: event.data.first_name,
        last_name: event.data.last_name
      }
    }
  })

  if (signUpError) {
    console.error("Error signing up:", signUpError)
    toast.add({
      title: "Error signing up",
      icon: icons.error,
      color: "error"
    })
    return
  }

  set(emailAddress, event.data.email)
  set(showOtp, true)
}

const handleOtpSubmit = async () => {
  const { error } = await supabase.auth.verifyOtp({
    email: emailAddress.value,
    token: otp.value.join(""),
    type: "email"
  })

  if (error) {
    console.error("Error verifying OTP:", error)
    toast.add({
      title: "Error verifying OTP",
      icon: icons.error,
      color: "error"
    })
    return
  }

  router.push({ name: "home" })
}
</script>

<template>
  <div class="size-full grid place-items-center">
    <u-card class="max-w-md w-full">
      <div
        v-if="showOtp"
        class="w-fit mx-auto"
      >
        <u-pin-input
          otp
          :length="8"
          v-model="otp"
          type="number"
          @complete="handleOtpSubmit"
        />
      </div>

      <u-auth-form
        v-else
        :schema
        title="Sign Up"
        :icon="ICONS.racquet"
        :fields
        @submit="onSubmit"
      />

      <template #footer>
        <u-button
          block
          color="success"
          label="Already have an account? Sign In!"
          :to="{ name: 'signin' }"
        />
      </template>
    </u-card>
  </div>
</template>
