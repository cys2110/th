declare global {
  interface ValidationErrors {
    [key: string]: {
      message: string
      received: any
    }
  }
}

export {}
