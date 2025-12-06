"use client";

import { usePageTitle } from "@/hooks/use-page-title";
import { ReactNode } from "react";

export function PageTitleWrapper({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  usePageTitle(title);
  return <>{children}</>;
}
