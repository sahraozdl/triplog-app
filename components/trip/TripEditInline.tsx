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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

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

  const handleStatusChange = (status: string) => {
    setFormData({
      ...formData,
      status: status as "active" | "ended",
    });
  };

  return (
    <Card>
      <CardHeader className="pb-3 sm:pb-6 px-3 sm:px-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
            <div className="flex flex-col items-start gap-1.5 w-full sm:w-auto">
              <Label
                htmlFor="header-status"
                className="text-xs text-muted-foreground"
              >
                Status:
              </Label>
              <Select
                value={formData.status}
                onValueChange={handleStatusChange}
              >
                <SelectTrigger
                  id="header-status"
                  aria-label="Trip status"
                  className="h-9 sm:h-10 w-full sm:w-[140px] px-3 text-sm"
                >
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="ended">Ended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={isSaving}
              className="gap-2 flex-1 sm:flex-none"
              size="sm"
            >
              <X className="h-4 w-4" />
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="gap-2 flex-1 sm:flex-none"
              size="sm"
            >
              <Save className="h-4 w-4" />
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-3 sm:px-6 pb-4 sm:pb-6">
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
