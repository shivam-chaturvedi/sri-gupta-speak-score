import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { gaPageView } from "@/lib/ga";

export default function GaPageViewTracker() {
  const location = useLocation();

  useEffect(() => {
    const pagePath = `${location.pathname}${location.search}${location.hash}`;
    gaPageView(pagePath);
  }, [location.pathname, location.search, location.hash]);

  return null;
}

