// ============================================================================
// CRUD Standard — Item Form
// Renders the form fields for create/edit. No attachments, no bulk.
// Used inside ItemModal via react-hook-form's FormProvider.
// ============================================================================

import { useMemo, useState } from "react";
import { Controller, useFormContext } from "react-hook-form";
import dayjs from "dayjs";
import { AlertCircleIcon, ChevronDownIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/v1/alert";
import { Button } from "@/components/ui/v1/button";
import { Calendar } from "@/components/ui/v1/calendar";
import { Checkbox } from "@/components/ui/v1/checkbox";
import { Label } from "@/components/ui/v1/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/v1/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/v1/select";
import { Textarea } from "@/components/ui/v1/textarea";
import { normalizeToLocalNoon } from "@/utils/datetime";
import TeacherSearch from "@/components/TeacherSearch";

import { useGetCategories } from "../Services/crud.queries";
import type { ItemFormValues } from "../Services/crud.types";

type ItemFormProps = {
  isSubmitting?: boolean;
  completedByCode?: string;
};

export const ItemForm = ({
  isSubmitting = false,
  completedByCode,
}: ItemFormProps) => {
  const { data: categoriesResponse, isLoading: categoriesLoading } = useGetCategories();
  const categories = categoriesResponse?.ResponseActivities ?? [];
  const [dateSelectorOpen, setDateSelectorOpen] = useState(false);
  const loggedInUserCode = useMemo(
    () => localStorage.getItem("userCode")?.replace(/[^a-zA-Z0-9]/g, "") || undefined,
    [],
  );

  const {
    control,
    watch,
    formState: { errors, submitCount },
  } = useFormContext<ItemFormValues>();

  const notes = watch("notes");
  const showErrorMessage = submitCount > 0 && Object.keys(errors).length > 0;

  return (
    <div className="flex w-full max-w-110 flex-col gap-4 pb-4">
      {/* Activity */}
      <div>
        <Label htmlFor="activityId">Activity</Label>
        <Controller
          name="activityId"
          control={control}
          render={({ field }) => (
            <Select
              name="activityId"
              disabled={isSubmitting}
              value={field.value ? String(field.value) : undefined}
              onValueChange={(val) => field.onChange(val)}
            >
              <SelectTrigger
                className="w-full"
                aria-invalid={!!errors.activityId}
                aria-describedby={errors.activityId ? "activityId-error" : undefined}
              >
                <SelectValue placeholder="Select Activity..." />
              </SelectTrigger>
              <SelectContent>
                {categoriesLoading && (
                  <SelectItem value="__loading" disabled>
                    Loading activities...
                  </SelectItem>
                )}
                {!categoriesLoading &&
                  categories
                    .filter((cat) => String(cat.ActivityId) !== "")
                    .map((cat) => (
                      <SelectItem key={cat.ActivityId} value={String(cat.ActivityId)}>
                        {cat.ActivityName}
                      </SelectItem>
                    ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.activityId && (
          <p id="activityId-error" className="text-sm text-destructive mt-1">
            {errors.activityId.message}
          </p>
        )}
      </div>

      {/* Completed By + Date */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="completedDate">Completed</Label>
        <Controller
          name="completedBy"
          control={control}
          render={({ field }) => (
            <div
              aria-invalid={!!errors.completedBy}
              aria-describedby={errors.completedBy ? "completedBy-error" : undefined}
            >
              <TeacherSearch
                label="Completed By"
                placeholder="Search Staff..."
                className="mb-0!"
                teacherId={completedByCode ?? loggedInUserCode}
                onTeacherSelect={(staff) => field.onChange(staff ? Number(staff.StaffId) : 0)}
              />
            </div>
          )}
        />
        {errors.completedBy && (
          <p id="completedBy-error" className="text-sm text-destructive mt-1">
            {errors.completedBy.message}
          </p>
        )}

        <Controller
          name="completedDate"
          control={control}
          render={({ field }) => (
            <Popover open={dateSelectorOpen} onOpenChange={setDateSelectorOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  id="completedDate"
                  className="w-full justify-between font-normal"
                  type="button"
                  disabled={isSubmitting}
                  aria-invalid={!!errors.completedDate}
                  aria-describedby={errors.completedDate ? "completedDate-error" : undefined}
                >
                  {field.value ? `on ${dayjs(field.value).format("DD/MM/YYYY")}` : "Select date..."}
                  <ChevronDownIcon />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                <Calendar
                  mode="single"
                  selected={field.value ?? undefined}
                  captionLayout="dropdown"
                  onSelect={(date) => {
                    field.onChange(normalizeToLocalNoon(date ?? null));
                    setDateSelectorOpen(false);
                  }}
                  disabled={(date) => date > new Date()}
                />
              </PopoverContent>
            </Popover>
          )}
        />
        {errors.completedDate && (
          <p id="completedDate-error" className="text-sm text-destructive mt-1">
            {errors.completedDate.message}
          </p>
        )}
      </div>

      {/* Notes */}
      <div>
        <Label htmlFor="itemNotes">Notes</Label>
        <Controller
          name="notes"
          control={control}
          render={({ field }) => (
            <Textarea
              {...field}
              placeholder="Enter notes..."
              id="itemNotes"
              className="min-h-24"
              disabled={isSubmitting}
            />
          )}
        />

        {!!notes && (
          <div className="fsm-input mt-2 flex h-8 items-center gap-3 p-2">
            <Controller
              name="restrictedNotes"
              control={control}
              render={({ field }) => (
                <>
                  <Checkbox
                    id="restrictNotes"
                    checked={field.value}
                    onCheckedChange={(val) => field.onChange(!!val)}
                    disabled={isSubmitting}
                  />
                  <Label htmlFor="restrictNotes" className="mb-0">
                    Restrict Notes
                  </Label>
                </>
              )}
            />
          </div>
        )}
      </div>

      {/* Validation Error Summary */}
      {showErrorMessage && (
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertTitle>Unable to save.</AlertTitle>
          <AlertDescription>Please check the form and try again.</AlertDescription>
        </Alert>
      )}
    </div>
  );
};
