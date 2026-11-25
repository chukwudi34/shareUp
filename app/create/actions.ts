"use server";

import { revalidatePath } from "next/cache";
import { apiFetch, ApiError } from "@/lib/api";
import type { Opportunity } from "@/lib/types";
import type { OpportunityDraftInput } from "@/lib/opportunity-draft";

function message(error: unknown): string {
  return error instanceof ApiError ? error.message : "Could not reach ShareUp. Please try again.";
}

export async function saveOpportunityDraft(input: OpportunityDraftInput, draftId?: number) {
  if (!input.title?.trim()) {
    return { ok: false as const, error: "Give your opportunity a title before saving." };
  }

  try {
    const response = await apiFetch<{ data: Opportunity }>(
      draftId ? `opportunities/${draftId}` : "opportunities",
      {
        method: draftId ? "PUT" : "POST",
        body: JSON.stringify(input),
      }
    );

    revalidatePath("/create");
    return { ok: true as const, opportunity: response.data };
  } catch (error) {
    return { ok: false as const, error: message(error) };
  }
}

export interface UploadedDocument {
  id: number;
  title: string;
  kind: string;
  verified: boolean;
  fileUrl?: string;
  uploadedAt?: string | null;
}

export async function uploadOpportunityDocument(id: number, formData: FormData) {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false as const, error: "Choose a PDF or image to upload." };
  }

  const body = new FormData();
  body.set("file", file);
  body.set("kind", String(formData.get("kind") ?? "OTHER"));
  const title = String(formData.get("title") ?? "").trim();
  if (title) body.set("title", title);

  try {
    const response = await apiFetch<{ data: UploadedDocument }>(
      `opportunities/${id}/documents`,
      { method: "POST", body }
    );

    revalidatePath("/create");
    return { ok: true as const, document: response.data };
  } catch (error) {
    return { ok: false as const, error: message(error) };
  }
}

export async function submitOpportunityForReview(id: number) {
  try {
    const response = await apiFetch<{ data: Opportunity }>(`opportunities/${id}/submit`, {
      method: "POST",
    });

    revalidatePath("/create");
    revalidatePath("/discover");
    revalidatePath("/");
    return { ok: true as const, opportunity: response.data };
  } catch (error) {
    return { ok: false as const, error: message(error) };
  }
}
