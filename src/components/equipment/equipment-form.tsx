"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { CategoryIcon } from "@/components/equipment/equipment-badges";
import { Button, buttonStyles } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SelectField, TextField, TextareaField } from "@/components/ui/form-field";
import { Spinner } from "@/components/ui/spinner";
import { useFieldErrors } from "@/hooks/use-field-errors";
import { createItemAction, updateItemAction } from "@/lib/equipment/actions";
import {
  AVAILABILITY_STATUSES,
  EQUIPMENT_CATEGORIES,
  EQUIPMENT_CONDITIONS,
  availabilityDescriptions,
  availabilityLabels,
  categoryLabels,
  conditionDescriptions,
  conditionLabels,
  type AvailabilityStatus,
  type EquipmentCategory,
  type EquipmentCondition,
  type EquipmentItem,
} from "@/lib/equipment/types";
import {
  QUANTITY_MAX,
  validateEquipmentName,
  validateLocation,
  validateNotes,
  validateQuantity,
  validateSerialNumber,
} from "@/lib/equipment/validation";
import { initialFormState } from "@/lib/form-state";

/**
 * The add and edit form.
 *
 * "Retired" is deliberately not a condition you can pick here: retiring checks
 * that nothing is still out on loan, so it goes through its own action on the
 * item's page. Damaged and lost counts are not fields either - they only move
 * through recording damage, so a typo cannot write off half the store.
 */

/** Every condition except retired, which is a decision rather than an edit. */
const SELECTABLE_CONDITIONS = EQUIPMENT_CONDITIONS.filter(
  (condition) => condition !== "retired",
);

type EquipmentFormProps =
  | { mode: "create"; item?: undefined }
  | { mode: "edit"; item: EquipmentItem };

export function EquipmentForm({ mode, item }: EquipmentFormProps) {
  const isEdit = mode === "edit";
  const action = isEdit ? updateItemAction : createItemAction;

  const [state, formAction, pending] = useActionState(action, initialFormState);
  const { errors, setFieldError, clearField } = useFieldErrors(state);

  const initial = (field: string, fallback: string) => state.values?.[field] ?? fallback;

  const [category, setCategory] = useState<EquipmentCategory>(
    (state.values?.category as EquipmentCategory) ?? item?.category ?? "camping",
  );
  const [condition, setCondition] = useState<EquipmentCondition>(
    (state.values?.condition as EquipmentCondition) ??
      (item && item.condition !== "retired" ? item.condition : "good"),
  );
  const [availability, setAvailability] = useState<AvailabilityStatus>(
    (state.values?.availability as AvailabilityStatus) ?? item?.availability ?? "available",
  );
  const [quantity, setQuantity] = useState(
    initial("quantity", item ? String(item.quantity) : "1"),
  );

  const quantityNumber = Number(quantity.trim());
  const singleUnit = Number.isFinite(quantityNumber) && quantityNumber === 1;

  const formError =
    state.status === "error" && Object.keys(errors).length === 0 ? state.message : undefined;

  return (
    <form action={formAction} noValidate className="space-y-4">
      {isEdit && <input type="hidden" name="id" value={item.id} />}

      {formError && <Callout tone="error">{formError}</Callout>}
      {state.status === "error" && Object.keys(errors).length > 0 && (
        <Callout tone="error">{state.message}</Callout>
      )}

      {/* ------------------------------ What it is ---------------------------- */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand-text">
              <CategoryIcon category={category} className="size-4" />
            </span>
            <div>
              <CardTitle>What it is</CardTitle>
              <p className="mt-0.5 text-[13px] text-ink-secondary">
                One record per line of kit, however many units it holds.
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <TextField
            label="Item name"
            name="name"
            autoComplete="off"
            placeholder="e.g. Trangia 27 stove set"
            defaultValue={initial("name", item?.name ?? "")}
            onChange={() => clearField("name")}
            onBlur={(event) => setFieldError("name", validateEquipmentName(event.target.value))}
            error={errors.name}
            disabled={pending}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <SelectField
              label="Category"
              name="category"
              value={category}
              onChange={(event) => {
                setCategory(event.target.value as EquipmentCategory);
                clearField("category");
              }}
              error={errors.category}
              disabled={pending}
            >
              {EQUIPMENT_CATEGORIES.map((option) => (
                <option key={option} value={option}>
                  {categoryLabels[option]}
                </option>
              ))}
            </SelectField>

            <TextField
              label="Quantity"
              name="quantity"
              type="number"
              inputMode="numeric"
              min={0}
              max={QUANTITY_MAX}
              value={quantity}
              onChange={(event) => {
                setQuantity(event.target.value);
                clearField("quantity");
              }}
              onBlur={(event) => setFieldError("quantity", validateQuantity(event.target.value))}
              error={errors.quantity}
              hint="Serviceable units. Damaged and lost are counted separately."
              disabled={pending}
            />
          </div>

          <TextareaField
            label="Notes"
            labelAside="Optional"
            name="notes"
            rows={3}
            placeholder="Anything the next person to sign it out should know."
            defaultValue={initial("notes", item?.notes ?? "")}
            onChange={() => clearField("notes")}
            onBlur={(event) => setFieldError("notes", validateNotes(event.target.value))}
            error={errors.notes}
            disabled={pending}
          />
        </CardContent>
      </Card>

      {/* ------------------------------ Condition ----------------------------- */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Condition and availability</CardTitle>
            <p className="mt-0.5 text-[13px] text-ink-secondary">
              Condition is what shape it is in; availability is whether it may go out.
            </p>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <SelectField
            label="Condition"
            name="condition"
            value={condition}
            onChange={(event) => {
              setCondition(event.target.value as EquipmentCondition);
              clearField("condition");
            }}
            error={errors.condition}
            hint={conditionDescriptions[condition]}
            disabled={pending}
          >
            {SELECTABLE_CONDITIONS.map((option) => (
              <option key={option} value={option}>
                {conditionLabels[option]}
              </option>
            ))}
          </SelectField>

          <SelectField
            label="Availability"
            name="availability"
            value={availability}
            onChange={(event) => {
              setAvailability(event.target.value as AvailabilityStatus);
              clearField("availability");
            }}
            error={errors.availability}
            hint={availabilityDescriptions[availability]}
            disabled={pending}
          >
            {AVAILABILITY_STATUSES.map((option) => (
              <option key={option} value={option}>
                {availabilityLabels[option]}
              </option>
            ))}
          </SelectField>

          {isEdit && (
            <p className="text-[12px] text-ink-muted">
              Retiring this item, and recording damage or a loss, are done from its own page -
              both check what is still out on loan first.
            </p>
          )}
        </CardContent>
      </Card>

      {/* ------------------------------- Where -------------------------------- */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Where it lives and where it came from</CardTitle>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <TextField
            label="Location"
            name="location"
            autoComplete="off"
            placeholder="e.g. Store room - shelf B"
            defaultValue={initial("location", item?.location ?? "")}
            onChange={() => clearField("location")}
            onBlur={(event) => setFieldError("location", validateLocation(event.target.value))}
            error={errors.location}
            hint="Where somebody would go to find it."
            disabled={pending}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextField
              label="Serial number"
              labelAside="If applicable"
              name="serialNumber"
              autoComplete="off"
              placeholder={singleUnit ? "e.g. GRM-ETX-4417" : "Only for a single item"}
              defaultValue={initial("serialNumber", item?.serialNumber ?? "")}
              onChange={() => clearField("serialNumber")}
              onBlur={(event) =>
                setFieldError("serialNumber", validateSerialNumber(event.target.value))
              }
              error={errors.serialNumber}
              hint={
                singleUnit
                  ? "For anything worth identifying individually."
                  : "A line of several units usually has no single serial number."
              }
              disabled={pending}
            />

            <TextField
              label="Purchase date"
              labelAside="Optional"
              name="purchaseDate"
              type="date"
              defaultValue={initial("purchaseDate", item?.purchaseDate ?? "")}
              onChange={() => clearField("purchaseDate")}
              error={errors.purchaseDate}
              hint="Plenty of group kit predates any receipt."
              disabled={pending}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Link
          href={isEdit ? `/equipment/${item.id}` : "/equipment"}
          className={buttonStyles({ variant: "secondary" })}
        >
          Cancel
        </Link>
        <Button type="submit" disabled={pending}>
          {pending && <Spinner label="Saving" />}
          {pending ? "Saving..." : isEdit ? "Save changes" : "Add to the store"}
        </Button>
      </div>
    </form>
  );
}
