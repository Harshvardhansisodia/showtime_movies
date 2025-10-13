"use client";

import { useEffect } from "react";
export default function StoreHLSToken() {
  useEffect(() => {
    async function storeToken() {
      try {
        const res = await fetch("/api/hlstoken", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to fetch token");
        const data = await res.json();
        const token = data?.hlstoken;
        if (token) {
          localStorage.setItem("hlstoken", token);
        } else {
            
        }
      } catch (error) {
      }
    }

    storeToken();
  }, []);

  return null;
}
