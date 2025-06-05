"use client";

import { useEffect } from "react";
import { useAppDispatch } from "@/hooks/use-redux";
import { setInitialConfig } from "@/lib/redux/slices/app-config";

interface InitialConfigLoaderProps {
  domain: string | null;
  tenantId: string | null;
}

export function InitialConfigLoader({
  domain,
  tenantId,
}: InitialConfigLoaderProps) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(
      setInitialConfig({ domain: domain ?? null, tenantId: tenantId ?? null }),
    );
  }, [dispatch, domain, tenantId]);

  return null;
}
