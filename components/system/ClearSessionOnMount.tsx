// components/system/ClearSessionOnMount.tsx
"use client";
import { useEffect } from "react";

export default function ClearSessionOnMount() {
  useEffect(() => {
    try {
      sessionStorage.clear(); // clears all session keys for this tab [web:587][web:603]
    } catch {}
  }, []);

  return null;
}
