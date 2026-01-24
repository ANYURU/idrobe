import { useState, useEffect } from "react";
import { useFetcher } from "react-router";

type UsageType = "uploads" | "recs" | "tryons";

export function useUsageLimits() {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const fetcher = useFetcher();

  const checkUsageLimit = async (usageType: UsageType) => {
    fetcher.submit(
      { action: "check_usage", usageType },
      { method: "POST", action: "/api/check-usage" }
    );
  };

  useEffect(() => {
    if (fetcher.data?.limitExceeded) {
      setShowUpgradeModal(true);
    }
  }, [fetcher.data]);

  return {
    showUpgradeModal,
    setShowUpgradeModal,
    checkUsageLimit,
    isChecking: fetcher.state === "submitting",
    usageData: fetcher.data,
  };
}