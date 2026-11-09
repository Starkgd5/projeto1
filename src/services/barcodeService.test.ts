import { describe, expect, it } from "vitest";
import {
  buscarProdutoPorCodigoBarras,
  gerarCodigoBarrasAleatorio,
} from "./barcodeService";

describe("barcodeService", () => {
  it("looks up catalog products after stripping formatting", () => {
    expect(buscarProdutoPorCodigoBarras(" 7891000100103 ")).toMatchObject({
      descricao: "Leite Condensado Moça Nestlé 395g",
      categoria: "Laticínios",
    });
    expect(buscarProdutoPorCodigoBarras("0000000000000")).toBeNull();
  });

  it("generates valid EAN-13 values with the Brazilian prefix", () => {
    for (let attempt = 0; attempt < 20; attempt++) {
      const code = gerarCodigoBarrasAleatorio();
      const sum = [...code.slice(0, 12)].reduce(
        (total, digit, index) =>
          total + Number(digit) * (index % 2 === 0 ? 1 : 3),
        0,
      );

      expect(code).toMatch(/^789\d{10}$/);
      expect(Number(code[12])).toBe((10 - (sum % 10)) % 10);
    }
  });
});
