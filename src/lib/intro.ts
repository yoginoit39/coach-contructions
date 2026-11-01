let done = false;
const subs = new Set<() => void>();

export const intro = {
  isDone: () => done,
  finish() {
    if (done) return;
    done = true;
    subs.forEach((f) => f());
    subs.clear();
  },
  onDone(f: () => void) {
    if (done) {
      f();
      return () => {};
    }
    subs.add(f);
    return () => {
      subs.delete(f);
    };
  },
};
