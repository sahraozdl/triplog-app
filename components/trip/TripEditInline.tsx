"use client";

import { Trip } from "@/app/types/Trip";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  TripEditForm,
  initializeFormData,
  validateFormData,
  formDataToPayload,
  TripEditFormData,
} from "./TripEditForm";
import { useState } from "react";
import { X, Save } from "lucide-react";

interface TripEditInlineProps {
  trip: Trip;
  onSave: (payload: ReturnType<typeof formDataToPayload>) => Promise<void>;
  onCancel: () => void;
  isSaving?: boolean;
}

export function TripEditInline({
  trip,
  onSave,
  onCancel,
  isSaving = false,
}: TripEditInlineProps) {
  const [formData, setFormData] = useState<TripEditFormData>(() =>
    initializeFormData(trip),
  );
  const [errors, setErrors] = useState<{ title?: string; dateRange?: string }>(
    {},
  );

  const handleSave = async () => {
    const validation = validateFormData(formData);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    setErrors({});
    const payload = formDataToPayload(formData);
    await onSave(payload);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl">Edit Trip</CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={isSaving}
              className="gap-2"
            >
              <X className="h-4 w-4" />
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving} className="gap-2">
              <Save className="h-4 w-4" />
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <TripEditForm
          trip={trip}
          value={formData}
          onChange={setFormData}
          errors={errors}
        />
      </CardContent>
    </Card>
  );
}
