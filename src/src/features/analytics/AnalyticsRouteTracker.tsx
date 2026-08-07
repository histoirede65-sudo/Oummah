import { usePathname } from "expo-router";
import { useEffect, useRef } from "react";

import {
  moduleFromRoute,
  trackAnalyticsEvent,
} from "./AnalyticsService";

export default function AnalyticsRouteTracker() {
  const pathname = usePathname();
  const previousPath = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || previousPath.current === pathname) return;

    previousPath.current = pathname;

    void trackAnalyticsEvent({
      eventName: "screen_view",
      module: moduleFromRoute(pathname),
      route: pathname,
    });
  }, [pathname]);

  return null;
}
