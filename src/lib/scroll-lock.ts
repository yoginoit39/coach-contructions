export const scrollLock = {
  stop() {
    document.documentElement.style.overflow = "hidden";
  },
  start() {
    document.documentElement.style.overflow = "";
  },
};
