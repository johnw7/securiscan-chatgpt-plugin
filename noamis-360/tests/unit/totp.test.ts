import { describe, expect, it } from "vitest";
import { totp } from "../helpers/totp";

describe("Générateur TOTP de test (vecteurs RFC 6238)", () => {
  it("produit les codes de référence", () => {
    const secret = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ"; // « 12345678901234567890 »
    expect(totp(secret, 59_000)).toBe("287082");
    expect(totp(secret, 1_111_111_109_000)).toBe("081804");
  });
});
