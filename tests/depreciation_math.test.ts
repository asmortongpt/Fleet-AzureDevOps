import { straightLine } from "../api/src/services/depreciation/methods/straight-line";

test("straight-line does not exceed depreciable basis", () => {
  const r = straightLine({
    costBasis: 10000,
    salvageValue: 1000,
    usefulLifeMonths: 60,
    startDate: new Date("2020-01-01"),
    asOfDate: new Date("2030-01-01"),
    disposedDate: null,
    convention: "FULL_MONTH" as any,
  });
  expect(r.accumulated).toBeLessThanOrEqual(9000 + 0.01);
});
