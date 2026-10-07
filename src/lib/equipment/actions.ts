"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/current-user";
import { can } from "@/lib/auth/permissions";
import { inScope, resolveTroopScope, type TroopScope } from "@/lib/auth/troop-scope";
import * as service from "@/lib/equipment/service";
import * as store from "@/lib/equipment/store";
import type {
  AvailabilityStatus,
  EquipmentCategory,
  EquipmentCondition,
  EquipmentDetails,
  HolderKind,
} from "@/lib/equipment/types";
import {
  validateEquipmentInput,
  type EquipmentFormInput,
} from "@/lib/equipment/validation";
import type { ActionResult, FormState } from "@/lib/form-state";
import { hasErrors } from "@/lib/validation";

/**
 * Server Actions for the equipment store.
 *
 * Every one re-checks `equipment.manage`. The UI hides these controls from
 * roles without it, but that is presentation - this is the enforcement.
 *
 * The catalog itself is shared, so item actions need nothing beyond the
 * permission check. Returning a loan touches one specific existing loan
 * though, so that action separately checks it falls inside the caller's troop
 * scope - the same boundary `patrols/actions.ts` enforces on an existing
 * patrol - before letting it through.
 */

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

const FORBIDDEN: FormState = {
  status: "error",
  message: "You do not have permission to change the equipment store.",
};

async function canManage(): Promise<boolean> {
  const user = await getCurrentUser();
  return Boolean(user && can(user.role, "equipment.manage"));
}

/** Loads the caller and their troop scope, or null if they may not manage equipment at all. */
async function manageContext() {
  const user = await getCurrentUser();
  if (!user || !can(user.role, "equipment.manage")) return null;
  return { user, scope: await resolveTroopScope(user) };
}

/** True when `loanId` exists and falls inside `scope`. */
async function loanInScope(loanId: string, scope: TroopScope): Promise<boolean> {
  const loan = await store.findLoan(loanId);
  return loan !== null && inScope(scope, loan.troopId);
}

function readForm(formData: FormData): EquipmentFormInput {
  return {
    name: field(formData, "name"),
    category: field(formData, "category"),
    quantity: field(formData, "quantity"),
    condition: field(formData, "condition"),
    location: field(formData, "location"),
    serialNumber: field(formData, "serialNumber"),
    purchaseDate: field(formData, "purchaseDate"),
    notes: field(formData, "notes"),
    availability: field(formData, "availability"),
  };
}

function echo(input: EquipmentFormInput): Record<string, string> {
  return { ...input };
}

function toDetails(input: EquipmentFormInput): EquipmentDetails {
  return {
    name: input.name,
    category: input.category as EquipmentCategory,
    quantity: Number(input.quantity.trim()),
    condition: input.condition as EquipmentCondition,
    location: input.location,
    serialNumber: input.serialNumber,
    purchaseDate: input.purchaseDate.trim(),
    notes: input.notes,
    availability: input.availability as AvailabilityStatus,
  };
}

/**
 * Kit shows in the store, on its own page, and on the page of every activity or
 * camp it is booked out to, so all of them are refreshed.
 */
function revalidateEquipment(id: string): void {
  revalidatePath("/equipment");
  revalidatePath(`/equipment/${id}`);
  revalidatePath("/activities", "layout");
  revalidatePath("/camps", "layout");
  revalidatePath("/", "layout");
}

/* ---------------------------------- create --------------------------------- */

export async function createItemAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  if (!(await canManage())) return FORBIDDEN;

  const input = readForm(formData);
  const values = echo(input);

  const fieldErrors = validateEquipmentInput(input);
  if (hasErrors(fieldErrors)) {
    return {
      status: "error",
      message: "Please correct the highlighted fields.",
      fieldErrors,
      values,
    };
  }

  const result = await service.addItem(toDetails(input));
  if (!result.ok) {
    return { status: "error", message: result.message, fieldErrors: result.fieldErrors, values };
  }

  revalidateEquipment(result.data.id);
  redirect(`/equipment/${result.data.id}`);
}

/* ----------------------------------- edit ---------------------------------- */

export async function updateItemAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  if (!(await canManage())) return FORBIDDEN;

  const id = field(formData, "id");
  if (!id) return { status: "error", message: "That item could not be found." };

  const input = readForm(formData);
  const values = echo(input);

  const fieldErrors = validateEquipmentInput(input);
  if (hasErrors(fieldErrors)) {
    return {
      status: "error",
      message: "Please correct the highlighted fields.",
      fieldErrors,
      values,
    };
  }

  const result = await service.editItem(id, toDetails(input));
  if (!result.ok) {
    return { status: "error", message: result.message, fieldErrors: result.fieldErrors, values };
  }

  revalidateEquipment(id);
  redirect(`/equipment/${id}?saved=1`);
}

/* ------------------------------ retire / restore --------------------------- */

export async function retireItemAction(id: string, reason: string): Promise<ActionResult> {
  if (!(await canManage())) {
    return { ok: false, message: "You do not have permission to retire equipment." };
  }

  const result = await service.retireItem(id, reason);
  if (!result.ok) return { ok: false, message: result.message };

  revalidateEquipment(id);
  return { ok: true };
}

export async function returnToServiceAction(id: string): Promise<ActionResult> {
  if (!(await canManage())) {
    return { ok: false, message: "You do not have permission to change equipment." };
  }

  const result = await service.returnToService(id);
  if (!result.ok) return { ok: false, message: result.message };

  revalidateEquipment(id);
  return { ok: true };
}

/* ---------------------------------- loans ---------------------------------- */

export async function checkOutAction(input: {
  itemId: string;
  quantity: number;
  holderKind: HolderKind;
  holderId: string;
  dueBack: string | null;
  note: string;
}): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user || !can(user.role, "equipment.manage")) {
    return { ok: false, message: "You do not have permission to book equipment out." };
  }

  const result = await service.checkOut(input, user.id);
  if (!result.ok) return { ok: false, message: result.message };

  revalidateEquipment(input.itemId);
  return { ok: true };
}

export async function returnLoanAction(
  itemId: string,
  loanId: string,
  split: { good: number; damaged: number; lost: number },
): Promise<ActionResult> {
  const context = await manageContext();
  if (!context) return { ok: false, message: "You do not have permission to book equipment in." };
  if (!(await loanInScope(loanId, context.scope))) {
    return { ok: false, message: "That loan could not be found." };
  }

  const result = await service.returnLoan(loanId, split, context.user.id);
  if (!result.ok) return { ok: false, message: result.message };

  revalidateEquipment(itemId);
  return { ok: true };
}

/* --------------------------- damage, loss, repair -------------------------- */

export async function recordDamageAction(
  id: string,
  damaged: number,
  lost: number,
  note: string,
): Promise<ActionResult> {
  if (!(await canManage())) {
    return { ok: false, message: "You do not have permission to change the store." };
  }

  const result = await service.recordDamageOrLoss(id, damaged, lost, note);
  if (!result.ok) return { ok: false, message: result.message };

  revalidateEquipment(id);
  return { ok: true };
}

export async function recordRepairAction(id: string, quantity: number): Promise<ActionResult> {
  if (!(await canManage())) {
    return { ok: false, message: "You do not have permission to change the store." };
  }

  const result = await service.recordRepair(id, quantity);
  if (!result.ok) return { ok: false, message: result.message };

  revalidateEquipment(id);
  return { ok: true };
}
