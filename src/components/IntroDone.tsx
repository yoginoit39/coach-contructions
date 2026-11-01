"use client";

import { useEffect } from "react";
import { intro } from "@/lib/intro";

/** Inner pages have no gate: mark the intro finished so the HUD and reveals run. */
export default function IntroDone() {
  useEffect(() => {
    intro.finish();
  }, []);
  return null;
}
