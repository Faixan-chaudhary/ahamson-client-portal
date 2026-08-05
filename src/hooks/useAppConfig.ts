import { useApiQuery } from "./useApiQuery";
import { fetchAppConfig } from "@/lib/api";

const DEFAULT_CONFIG = {
  linkExpireHours: 2,
  supportEmail: "documents@ahamson.com",
};

export function useAppConfig() {
  const { data, loading } = useApiQuery(() => fetchAppConfig(), []);
  return {
    linkExpireHours: data?.linkExpireHours ?? DEFAULT_CONFIG.linkExpireHours,
    supportEmail: data?.supportEmail ?? DEFAULT_CONFIG.supportEmail,
    loading,
  };
}

export function formatLinkExpiry(hours: number) {
  if (hours === 1) return "1 hour";
  return `${hours} hours`;
}
