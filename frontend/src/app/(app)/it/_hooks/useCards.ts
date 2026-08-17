"use client";

import { useQuery } from "@tanstack/react-query";
import { http } from "@/lib/api";
import { createResource } from "@/lib/resource";

export type CardSummary = {
  id: number; cardSerial: string; status: string;
  employeeName: string; empId: string; departmentName: string;
  issueDate: string; createdAt: string;
};

export type CardDetail = {
  id: number; cardSerial: string; status: string; versionNo: number; usable: boolean;
  empId: string; printedName: string; printedDesignation: string; printedDepartment: string;
  accessLevelName: string | null;
  issueDate: string; activatedAt: string | null;
  revokedAt: string | null; revocationReason: string | null;
  replacedByCardId: number | null; replacedByCardSerial: string | null;
  nfcFormat: string | null; encodingAlgorithm: string | null; nfcPayload: string | null;
  credentialGeneratedAt: string | null;
  createdAt: string;
};

export type CardVerification = {
  found: boolean; cardId: number | null; cardSerial: string; status: string | null;
  usable: boolean; printedName: string | null; empId: string | null;
  printedDepartment: string | null; accessLevelName: string | null;
};

/** id, list, detail, timeline, and the lifecycle actions -- same shape as every other module. */
export const cards = createResource<CardSummary, CardDetail, never>("/cards", "cards");

export const useReportLost = () => cards.useAction("report-lost");
export const useReportDamaged = () => cards.useAction("report-damaged");
export const useSuspend = () => cards.useAction("suspend");
export const useReinstate = () => cards.useAction("reinstate");
export const useRevoke = () => cards.useAction("revoke");
export const useVoidCard = () => cards.useAction("void");
export const useRegenerateCredentials = () => cards.useAction("regenerate-credentials");

export function useVerifyCard(serial: string | null) {
  return useQuery({
    queryKey: ["cards", "verify", serial ?? ""],
    queryFn: () => http.get<CardVerification>(`/cards/by-serial/${serial}`),
    enabled: !!serial,
  });
}
