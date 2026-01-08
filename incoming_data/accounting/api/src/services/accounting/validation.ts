import { UsefulLifeRepository } from "../../repositories/useful-life.repository";
import { PoliciesRepository } from "../../repositories/policies.repository";

export type ValidationSeverity = "ERROR" | "WARNING";

export interface ValidationMessage {
  severity: ValidationSeverity;
  code: string;
  message: string;
  field?: string;
}

export interface ValidationResult {
  ok: boolean;
  errors: ValidationMessage[];
  warnings: ValidationMessage[];
}

export async function validateComponent(input: {
  name?: string;
  category?: string | null;
  installed_date?: string;
  depreciation_start_date?: string;
  cost_basis?: number;
  salvage_value?: number;
  useful_life_months?: number;
  depreciation_method?: string;
  override_reason?: string | null;
}): Promise<ValidationResult> {
  const errors: ValidationMessage[] = [];
  const warnings: ValidationMessage[] = [];

  if (input.cost_basis !== undefined && input.cost_basis < 0) {
    errors.push({ severity:"ERROR", code:"COST_NEGATIVE", message:"Cost basis cannot be negative", field:"cost_basis" });
  }
  if (input.salvage_value !== undefined && input.salvage_value < 0) {
    errors.push({ severity:"ERROR", code:"SALVAGE_NEGATIVE", message:"Salvage value cannot be negative", field:"salvage_value" });
  }
  if (input.cost_basis !== undefined && input.salvage_value !== undefined && input.salvage_value > input.cost_basis) {
    errors.push({ severity:"ERROR", code:"SALVAGE_GT_COST", message:"Salvage value cannot exceed cost basis", field:"salvage_value" });
  }
  if (input.useful_life_months !== undefined && input.useful_life_months <= 0) {
    errors.push({ severity:"ERROR", code:"LIFE_INVALID", message:"Useful life must be positive", field:"useful_life_months" });
  }

  if (input.installed_date && input.depreciation_start_date) {
    if (new Date(input.depreciation_start_date) < new Date(input.installed_date)) {
      errors.push({ severity:"ERROR", code:"DEP_START_BEFORE_INSTALL", message:"Depreciation start date cannot be before installed date", field:"depreciation_start_date" });
    }
  }

  // Policy: capitalization threshold
  const cap = await PoliciesRepository.getPolicy<{amount:number,currency:string}>("capitalization_threshold");
  if (cap?.amount && input.cost_basis !== undefined && input.cost_basis < cap.amount) {
    warnings.push({ severity:"WARNING", code:"BELOW_CAP_THRESHOLD", message:`Cost basis is below capitalization threshold (${cap.amount} ${cap.currency}). Consider expensing unless policy allows capitalization.`, field:"cost_basis" });
  }

  // Useful life rule checks by category
  if (input.category && input.useful_life_months !== undefined) {
    const rule = await UsefulLifeRepository.getRule(input.category);
    if (rule) {
      if (input.useful_life_months < rule.min_months || input.useful_life_months > rule.max_months) {
        const msg = `Useful life for category ${input.category} must be between ${rule.min_months}-${rule.max_months} months`;
        if (input.override_reason) {
          warnings.push({ severity:"WARNING", code:"LIFE_OUT_OF_RANGE_OVERRIDE", message: msg + " (override accepted)", field:"useful_life_months" });
        } else {
          errors.push({ severity:"ERROR", code:"LIFE_OUT_OF_RANGE", message: msg + ". Provide override_reason to proceed.", field:"useful_life_months" });
        }
      }
    } else {
      warnings.push({ severity:"WARNING", code:"NO_LIFE_RULE", message:`No useful life rule found for category ${input.category}. Consider adding one.`, field:"category" });
    }
  }

  return { ok: errors.length === 0, errors, warnings };
}
