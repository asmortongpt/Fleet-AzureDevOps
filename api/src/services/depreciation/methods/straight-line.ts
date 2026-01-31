import { Convention } from "../../../types";
import { conventionMonths } from "../conventions";

export function straightLine(params: {
  costBasis: number;
  salvageValue: number;
  usefulLifeMonths: number;
  startDate: Date;
  asOfDate: Date;
  disposedDate?: Date | null;
  convention: Convention;
}) {
  const depreciable = Math.max(0, params.costBasis - (params.salvageValue ?? 0));
  const monthly = params.usefulLifeMonths > 0 ? depreciable / params.usefulLifeMonths : 0;

  const endDate = params.disposedDate && params.disposedDate < params.asOfDate
    ? params.disposedDate
    : params.asOfDate;

  const m = conventionMonths(params.startDate, endDate, params.usefulLifeMonths, params.convention);
  const accumulated = Math.min(depreciable, monthly * m);
  const nbv = params.costBasis - accumulated;

  return { monthly, accumulated, nbv };
}
