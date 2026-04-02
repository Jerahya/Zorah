import { useState, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Credential, Vault } from "../types/vault";

type CredentialInput = Omit<Credential, "id" | "created_at" | "updated_at">;

function now(): string {
  return new Date().toISOString();
}

export function useVault() {
  const [vault, setVault] = useState<Vault | null>(null);
  const [masterPassword, setMasterPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const unlock = useCallback(async (password: string) => {
    setLoading(true);
    setError(null);
    try {
      const v = await invoke<Vault>("unlock_vault", { masterPassword: password });
      setVault(v);
      setMasterPassword(password);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  const lock = useCallback(() => {
    setVault(null);
    setMasterPassword("");
    setError(null);
  }, []);

  const save = useCallback(
    async (updated: Vault) => {
      await invoke("save_vault", { vault: updated, masterPassword });
    },
    [masterPassword]
  );

  const addCredential = useCallback(
    async (data: CredentialInput) => {
      if (!vault) return;
      const newCred: Credential = {
        ...data,
        id: crypto.randomUUID(),
        created_at: now(),
        updated_at: now(),
      };
      const updated: Vault = {
        ...vault,
        credentials: [...vault.credentials, newCred],
        metadata: { last_modified: now() },
      };
      await save(updated);
      setVault(updated);
    },
    [vault, save]
  );

  const updateCredential = useCallback(
    async (id: string, data: Partial<CredentialInput>) => {
      if (!vault) return;
      const updated: Vault = {
        ...vault,
        credentials: vault.credentials.map((c) =>
          c.id === id ? { ...c, ...data, updated_at: now() } : c
        ),
        metadata: { last_modified: now() },
      };
      await save(updated);
      setVault(updated);
    },
    [vault, save]
  );

  const reorderCredentials = useCallback(
    async (ids: string[]) => {
      if (!vault) return;
      const credMap = new Map(vault.credentials.map((c) => [c.id, c]));
      const reordered = ids.map((id) => credMap.get(id)).filter((c): c is Credential => !!c);
      const updated: Vault = {
        ...vault,
        credentials: reordered,
        metadata: { last_modified: now() },
      };
      await save(updated);
      setVault(updated);
    },
    [vault, save]
  );

  const deleteCredential = useCallback(
    async (id: string, confirmPassword: string) => {
      if (!vault) return;
      if (confirmPassword !== masterPassword) {
        throw new Error("Incorrect password.");
      }
      const updated: Vault = {
        ...vault,
        credentials: vault.credentials.filter((c) => c.id !== id),
        metadata: { last_modified: now() },
      };
      await save(updated);
      setVault(updated);
    },
    [vault, save, masterPassword]
  );

  return {
    vault,
    loading,
    error,
    isLocked: vault === null,
    unlock,
    lock,
    addCredential,
    updateCredential,
    deleteCredential,
    reorderCredentials,
  };
}
