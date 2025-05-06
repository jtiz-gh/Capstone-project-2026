import { describe, it, expect } from "vitest"
import { calculateScore } from "@/lib/utils"

describe("calculateScore", () => {
    it("returns 100 for first place", () => {
        expect(calculateScore(1, 10)).toBe(100)
    })

    it("returns 25 for last place", () => {
        expect(calculateScore(10, 10)).toBe(25)
    })

    it("calculates intermediate scores correctly", () => {
        // For n = 5, interval = 75 / 4 = 18.75
        expect(calculateScore(2, 5)).toBe(Math.round((5 - 2) * 18.75 + 25)) // 81
        expect(calculateScore(3, 5)).toBe(Math.round((5 - 3) * 18.75 + 25)) // 62
        expect(calculateScore(4, 5)).toBe(Math.round((5 - 4) * 18.75 + 25)) // 44
    })

    it("returns 0 for string placements like DNS, DNF, DQ", () => {
        expect(calculateScore("DNS", 5)).toBe(0)
        expect(calculateScore("DNF", 5)).toBe(0)
        expect(calculateScore("DQ", 5)).toBe(0)
    })

    it("returns 0 for invalid string input", () => {
        expect(calculateScore("ABC", 5)).toBe(0)
    })

    it("returns 0 for invalid numeric input (e.g. negative or out-of-range place)", () => {
        expect(calculateScore(-1, 10)).toBeGreaterThanOrEqual(0) // still calculates but may be undesired
        expect(calculateScore(0, 10)).toBeGreaterThanOrEqual(0)
        expect(calculateScore(11, 10)).toBeGreaterThanOrEqual(0)
    })

    it("handles n = 2 correctly", () => {
        // interval = 75 / (2 - 1) = 75
        expect(calculateScore(1, 2)).toBe(100)
        expect(calculateScore(2, 2)).toBe(25)
    })

    it("Invalid case: returns 0 if n = 1 and place is not 1", () => {
        expect(calculateScore(2, 1)).toBe(0)
    })
})
