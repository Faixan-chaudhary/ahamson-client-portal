import { CloudSun, Moon, Sun, Sunset } from "lucide-react";

export function getTimeGreeting(date = new Date()) {
  const hour = date.getHours();

  if (hour >= 5 && hour < 12) {
    return { greeting: "Good morning", Icon: Sun };
  }
  if (hour >= 12 && hour < 17) {
    return { greeting: "Good afternoon", Icon: CloudSun };
  }
  if (hour >= 17 && hour < 21) {
    return { greeting: "Good evening", Icon: Sunset };
  }
  return { greeting: "Welcome back", Icon: Moon };
}

export function displayName(fullName?: string | null) {
  const trimmed = fullName?.trim();
  return trimmed || null;
}
