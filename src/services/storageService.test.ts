import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  buscarProdutos,
  carregarProdutos,
  salvarProdutos,
  sincronizarProdutos,
} from "./storageService";
import type { ProductItem } from "../types";

const product: ProductItem = {
  id: "test-1",
  codigoBarras: "7891000100103",
  descricao: "Produto de teste",
  lote: "L123",
  validade: "2027-01-31",
  quantidade: 3,
  dataCriacao: "2026-01-01T00:00:00.000Z",
};

describe("storageService", () => {
  beforeEach(() => {
    const values = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("round-trips saved products through localStorage", () => {
    salvarProdutos([product]);
    expect(carregarProdutos()).toEqual([product]);
  });

  it("loads products from the API and sends full-list replacements as JSON", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => [product] })
      .mockResolvedValueOnce({ ok: true });
    vi.stubGlobal("fetch", fetchMock);

    await expect(buscarProdutos()).resolves.toEqual([product]);
    await sincronizarProdutos([product]);

    expect(fetchMock).toHaveBeenNthCalledWith(1, "/api/products");
    expect(fetchMock).toHaveBeenNthCalledWith(2, "/api/products", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify([product]),
    });
  });

  it("reports API failures instead of treating them as successful syncs", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));

    await expect(buscarProdutos()).rejects.toThrow(
      "Não foi possível carregar os produtos da API.",
    );
    await expect(sincronizarProdutos([product])).rejects.toThrow(
      "Não foi possível salvar os produtos na API.",
    );
  });
});
