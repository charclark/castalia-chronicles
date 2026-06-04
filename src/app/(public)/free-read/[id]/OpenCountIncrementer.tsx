"use client";

import { useEffect, useRef } from "react";
import { incrementOpenCount } from "@/app/actions/works";

export default function OpenCountIncrementer({ workId }: { workId: string }) {
  const fired = useRef(false);
  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    incrementOpenCount(workId);
  }, [workId]);
  return null;
}
