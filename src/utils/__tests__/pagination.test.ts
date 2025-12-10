import { describe, expect, it } from "vitest";
import { calculateTotalPages, clampPage, paginate } from "../pagination";

describe("pagination helpers", () => {
  it("calculates total pages with safe guards", () => {
    expect(calculateTotalPages(0, 10)).toBe(1);
    expect(calculateTotalPages(25, 10)).toBe(3);
    expect(calculateTotalPages(-5, 10)).toBe(1);
    expect(calculateTotalPages(10, 0)).toBe(1);
  });

  it("clamps pages within total range", () => {
    expect(clampPage(0, 5)).toBe(1);
    expect(clampPage(3, 5)).toBe(3);
    expect(clampPage(10, 5)).toBe(5);
  });

  it("paginates items deterministically", () => {
    const items = Array.from({ length: 12 }, (_, index) => index + 1);
    expect(paginate(items, 1, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(paginate(items, 3, 5)).toEqual([11, 12]);
    expect(paginate(items, 10, 5)).toEqual([11, 12]);
  });
});
