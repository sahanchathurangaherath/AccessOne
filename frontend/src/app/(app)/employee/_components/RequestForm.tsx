"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { applyServerErrors } from "@/lib/forms";
import {
  useCreateRequest, useUpdateRequest, useUploadPhoto,
  type CardRequestDetail, type RequestType,
} from "../_hooks/useRequests";

const schema = z
  .object({
    requestType: z.enum(["NEW", "REPLACEMENT", "RENEWAL"]),
    reason: z.string().max(255).optional(),
    previousCardId: z.number().int().positive().optional(),
  })
  .refine((v) => v.requestType !== "REPLACEMENT" || !!v.reason?.trim(), {
    path: ["reason"],
    message: "Say why the card is being replaced",
  })
  .refine((v) => v.requestType !== "REPLACEMENT" || !!v.previousCardId, {
    path: ["previousCardId"],
    message: "Enter the id of the card being replaced",
  });

type FormValues = z.infer<typeof schema>;

const TYPE_LABEL: Record<RequestType, string> = {
  NEW: "New card",
  REPLACEMENT: "Replacement (lost, damaged or stolen)",
  RENEWAL: "Renewal",
};

/**
 * The two refine() rules above mirror chk_card_requests_reason and the
 * service's own check on CardRequest -- zod for instant feedback, the
 * service so no API caller can bypass it, the database as the final
 * authority. Three layers saying the same thing on purpose, not duplication.
 */
export function RequestForm({ existing }: { existing?: CardRequestDetail }) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const create = useCreateRequest();
  const update = useUpdateRequest(existing?.id ?? -1);
  const uploadPhoto = useUploadPhoto();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      requestType: (existing?.requestType as RequestType) ?? "NEW",
      reason: existing?.reason ?? undefined,
      previousCardId: existing?.previousCardId ?? undefined,
    },
  });

  const requestType = form.watch("requestType");
  const isReplacement = requestType === "REPLACEMENT";
  const busy = create.isPending || update.isPending || uploadPhoto.isPending;

  async function onSubmit(values: FormValues) {
    setFormError(null);
    try {
      const body = {
        requestType: values.requestType,
        reason: values.reason?.trim() || undefined,
        previousCardId: isReplacement ? values.previousCardId : undefined,
      };

      const saved = existing
        ? await update.mutateAsync(body)
        : await create.mutateAsync(body);

      if (photoFile) {
        await uploadPhoto.mutateAsync({ id: saved.id, file: photoFile });
      }
      router.push(`/employee/requests/${saved.id}`);
    } catch (error) {
      const message = applyServerErrors(error, form.setError);
      if (message) setFormError(message);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-lg space-y-5">
      {formError && (
        <Alert variant="destructive">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="requestType">Request type</Label>
        <Select
          value={form.watch("requestType")}
          onValueChange={(v) => form.setValue("requestType", v as RequestType, { shouldValidate: true })}
        >
          <SelectTrigger id="requestType" className="w-full">
            <SelectValue placeholder="Choose a request type" />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(TYPE_LABEL) as RequestType[]).map((t) => (
              <SelectItem key={t} value={t}>{TYPE_LABEL[t]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isReplacement && (
        <div className="space-y-1.5">
          <Label htmlFor="previousCardId">Card being replaced (card id)</Label>
          <Input
            id="previousCardId"
            type="number"
            aria-invalid={!!form.formState.errors.previousCardId}
            {...form.register("previousCardId", { valueAsNumber: true })}
          />
          {form.formState.errors.previousCardId && (
            <p className="text-xs text-denied">{form.formState.errors.previousCardId.message}</p>
          )}
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="reason">
          Reason {isReplacement && <span className="text-denied">*</span>}
        </Label>
        <Textarea
          id="reason"
          maxLength={255}
          placeholder={isReplacement ? "e.g. Original card lost while travelling" : "Optional"}
          aria-invalid={!!form.formState.errors.reason}
          {...form.register("reason")}
        />
        {form.formState.errors.reason && (
          <p className="text-xs text-denied">{form.formState.errors.reason.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="photo">Photo</Label>
        <p className="text-xs text-slate">JPEG or PNG, up to 2 MB. Required before you can submit.</p>
        <input
          id="photo"
          type="file"
          accept="image/jpeg,image/png"
          onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
          className="block w-full text-sm text-slate file:mr-3 file:rounded-lg file:border-0 file:bg-paper file:px-3 file:py-1.5 file:text-sm file:font-medium"
        />
        {existing?.hasPhoto && !photoFile && (
          <p className="text-xs text-granted">A photo is already attached.</p>
        )}
        {photoFile && (
          <p className="text-xs text-slate">Selected: {photoFile.name}</p>
        )}
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={busy}>
          {existing ? "Save changes" : "Create draft"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
