import { describe, expect, it } from "vitest";

import { getEmailWarning, textToList, toPatientFormState, validatePatientForm } from "@/lib/patient-form";
import { createPatient } from "@/tests/factories";

describe("patient form helpers", () => {
  it("validates the minimum required fields", () => {
    expect(validatePatientForm({ name: "", birthDate: "" })).toBe("Informe o nome do paciente.");
    expect(validatePatientForm({ name: "Maria", birthDate: "" })).toBe("Informe a data de nascimento.");
    expect(validatePatientForm({ name: "Maria", birthDate: "1990-01-01" })).toBeNull();
  });

  it("treats email as optional and non-blocking", () => {
    expect(getEmailWarning("")).toBeNull();
    expect(getEmailWarning("maria")).toBe("E-mail parece inválido. Verifique se contém @.");
    expect(getEmailWarning("maria@example.com")).toBeNull();
  });

  it("maps patient data to the editable form state", () => {
    const patient = createPatient({
      preferredFoods: ["arroz", "feijão"],
      intolerances: ["lactose"]
    });

    const form = toPatientFormState(patient);

    expect(form.name).toBe(patient.name);
    expect(form.preferredFoods).toBe("arroz, feijão");
    expect(form.intolerances).toBe("lactose");
  });

  it("converts comma separated text into clean arrays", () => {
    expect(textToList(" arroz, feijão ,, ovo ")).toEqual(["arroz", "feijão", "ovo"]);
  });
});
