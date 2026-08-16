declare global {
  interface FormFieldInterface<S> {
    label: string
    key: keyof S
    type: string

    // optional fields
    placeholder?: string
    description?: string
    icon?: string
    max?: number
    currency?: string
    class?: string

    required?: boolean
    disabled?: boolean
    rotateIcon?: boolean

    // object fields
    items?: any
    multiple?: boolean
    loading?: boolean
    valueKey?: string
    labelKey?: string
  }
}

export {}
