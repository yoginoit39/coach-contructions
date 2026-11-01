import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { TextPlugin } from "gsap/TextPlugin";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, SplitText, DrawSVGPlugin, TextPlugin);
  gsap.defaults({ ease: "power3.out", duration: 1 });
}

export { gsap, ScrollTrigger, SplitText };
export const EASE = "expo.out";
