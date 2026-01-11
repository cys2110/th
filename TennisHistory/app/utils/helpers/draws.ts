export const do_n_times = (n: number, cb: () => void) => {
  for (let i = 0; i < n; i++) {
    cb()
  }
}
