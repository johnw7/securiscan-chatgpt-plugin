import { describe, expect, it } from "vitest";
import { optionalUuid } from "@/lib/validation/common";
import { clientSchema } from "@/features/pilot/schemas";

describe("Champs de sélection facultatifs", () => {
  it("acceptent une valeur vide, absente ou un UUID", () => {
    expect(optionalUuid.safeParse("").success).toBe(true);
    expect(optionalUuid.safeParse(undefined).success).toBe(true);
    expect(optionalUuid.safeParse(null).success).toBe(true);
    expect(optionalUuid.safeParse("6f9619ff-8b86-4011-b42d-00c04fc964ff").data).toBe("6f9619ff-8b86-4011-b42d-00c04fc964ff");
    expect(optionalUuid.safeParse("pas-un-uuid").success).toBe(false);
  });
  it("le formulaire client accepte un responsable non renseigné", () => {
    const r = clientSchema.safeParse({ name: "Client test", category: "entreprise", status: "actif", owner_id: "", siren: "", email: "" });
    expect(r.error?.issues ?? []).toEqual([]);
  });
});
