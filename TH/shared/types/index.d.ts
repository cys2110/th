declare global {
  interface ValidationErrors {
    [key: string]: {
      message: string
      received: any
    }
  }

  interface FormFieldInterface<S> {
    label: string
    key: keyof S
    type: string
    required?: boolean
    icon: string
    description?: string
    items?: any
    class?: string
    disabled?: boolean
    multiple?: boolean
    placeholder?: string
    subType?: string
  }
}

export {}
