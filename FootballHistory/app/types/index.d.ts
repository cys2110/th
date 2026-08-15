declare global {
  interface FormFieldInterface<S> {
    label: string
    type: string
    subType?: string
    description?: string
    placeholder?: string
    icon?: string
    class?: string

    required?: boolean
    disabled?: boolean
    multiple?: boolean
    loading?: boolean
    rotateIcon?: boolean
    decimal?: boolean

    max?: number

    key?: keyof S
    items?: any
    valueKey?: string
    labelKey?: string
    filterFields?: string[]
    errorPattern?: RegExp
    currency?: CurrencyType
  }
}

export {}
