"use client";

import React, { useEffect, useState } from "react";
import { WifiOff, RefreshCw } from "lucide-react";

export default function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [isReconnecting, setIsReconnecting] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const checkConnectivity = async () => {
      try {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), 5000);
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/health/live`, {
          method: "GET",
          signal: controller.signal,
          cache: "no-store",
        });
        clearTimeout(id);
        if (res.ok) {
          setIsOnline(true);
          setIsReconnecting(false);
        } else {
          setIsOnline(false);
        }
      } catch (err) {
        setIsOnline(false);
      }
    };

    const handleOnline = () => {
      setIsReconnecting(true);
      checkConnectivity();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setIsReconnecting(false);
    };

    setIsOnline(navigator.onLine);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial check
    checkConnectivity();

    // 30s polling ping
    const interval = setInterval(checkConnectivity, 30000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(interval);
    };
  }, []);

  if (isOnline && !isReconnecting) return null;

  return (
    <div className="w-full bg-destructive text-destructive-foreground text-xs py-1.5 px-4 flex items-center justify-center gap-2 transition-all animate-in slide-in-from-top duration-300 font-semibold shadow-inner">
      {isReconnecting ? (
        <>
          <RefreshCw className="size-3.5 animate-spin" />
          <span>Reconnecting to server...</span>
        </>
      ) : (
        <>
          <WifiOff className="size-3.5" />
          <span>You are offline. Please check your internet connection or server availability.</span>
        </>
      )}
    </div>
  );
}
