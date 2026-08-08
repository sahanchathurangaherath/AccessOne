"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Field } from "@/components/form/field";
import { FormShell } from "@/components/form/form-shell";
import { FileUploadField } from "@/components/form/file-upload-field";
import { applyServerErrors } from "@/lib/forms";
import {
  requests, useUploadPhoto,
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

  const create = requests.useCreate();
  const update = requests.useUpdate();
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
        ? await update.mutateAsync({ id: existing.id, body })
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
    <FormShell
      onSubmit={form.handleSubmit(onSubmit)}
      formError={formError}
      isPending={busy}
      submitLabel={existing ? "Save changes" : "Create draft"}
      onCancel={() => router.back()}
    >
      <Field label="Request type" name="requestType">
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
      </Field>

      {isReplacement && (
        <Field
          label="Card being replaced (card id)"
          name="previousCardId"
          required
          error={form.formState.errors.previousCardId?.message}
        >
          <Input
            id="previousCardId"
            type="number"
            aria-invalid={!!form.formState.errors.previousCardId}
            {...form.register("previousCardId", { valueAsNumber: true })}
          />
        </Field>
      )}

      <Field
        label="Reason"
        name="reason"
        required={isReplacement}
        error={form.formState.errors.reason?.message}
      >
        <Textarea
          id="reason"
          maxLength={255}
          placeholder={isReplacement ? "e.g. Original card lost while travelling" : "Optional"}
          aria-invalid={!!form.formState.errors.reason}
          {...form.register("reason")}
        />
      </Field>

      <FileUploadField
        label="Photo"
        name="photo"
        accept="image/jpeg,image/png"
        maxBytes={2 * 1024 * 1024}
        hint="JPEG or PNG, up to 2 MB. Required before you can submit."
        onChange={setPhotoFile}
        existingLabel={existing?.hasPhoto ? "A photo is already attached." : undefined}
      />
    </FormShell>
  );
}
