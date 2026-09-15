import { useCallback, useEffect, useState } from "react";
import { getAdminDashboard, type AdminDashboardData } from "@/services/admin";
import { getSafeErrorMessage } from "@/libs/errors";

export function useAdmin(autoLoad = true) {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(autoLoad);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      setData(await getAdminDashboard());
    } catch (err) {
      setError(getSafeErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoLoad) void refresh();
  }, [autoLoad, refresh]);

  return { data, loading, error, refresh };
}

export default useAdmin;
