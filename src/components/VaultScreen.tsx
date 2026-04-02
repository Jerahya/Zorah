import { useState } from "react";
import { Credential, Vault } from "../types/vault";
import ZorahLogo from "./ZorahLogo";
import CredentialCard from "./CredentialCard";
import CredentialFormModal from "./CredentialFormModal";
import SearchBar from "./SearchBar";

type CredentialInput = Omit<Credential, "id" | "created_at" | "updated_at">;

interface Props {
  vault: Vault;
  onLock: () => void;
  onAdd: (data: CredentialInput) => Promise<void>;
  onUpdate: (id: string, data: Partial<CredentialInput>) => Promise<void>;
  onDelete: (id: string, confirmPassword: string) => Promise<void>;
}

export default function VaultScreen({ vault, onLock, onAdd, onUpdate, onDelete }: Props) {
  const [query, setQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingCred, setEditingCred] = useState<Credential | null>(null);

  const filtered = vault.credentials.filter((c) => {
    const q = query.toLowerCase();
    return (
      c.title.toLowerCase().includes(q) ||
      c.custom_fields.some(
        (f) => f.key.toLowerCase().includes(q) || (!f.secret && f.value.toLowerCase().includes(q))
      )
    );
  });

  const openAdd = () => {
    setEditingCred(null);
    setShowModal(true);
  };

  const openEdit = (cred: Credential) => {
    setEditingCred(cred);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCred(null);
  };

  const handleModalSubmit = async (data: CredentialInput) => {
    if (editingCred) {
      await onUpdate(editingCred.id, data);
    } else {
      await onAdd(data);
    }
    closeModal();
  };

  const handleModalDelete = async (confirmPassword: string) => {
    if (editingCred) {
      await onDelete(editingCred.id, confirmPassword);
      closeModal();
    }
  };

  return (
    <div className="vault-screen">
      <header className="vault-header">
        <h1><ZorahLogo />orah</h1>
        <div className="header-actions">
          <button className="btn-add" onClick={openAdd}>
            + Add
          </button>
          <button className="btn-lock" onClick={onLock}>
            Lock
          </button>
        </div>
      </header>

      <SearchBar value={query} onChange={setQuery} />

      <div className="credential-list">
        {filtered.length === 0 ? (
          <p className="empty-state">
            {vault.credentials.length === 0
              ? 'No credentials yet. Click "+ Add" to get started.'
              : "No results match your search."}
          </p>
        ) : (
          filtered.map((cred) => (
            <CredentialCard
              key={cred.id}
              credential={cred}
              onEdit={() => openEdit(cred)}
            />
          ))
        )}
      </div>

      {showModal && (
        <CredentialFormModal
          initial={editingCred}
          onSubmit={handleModalSubmit}
          onDelete={editingCred ? handleModalDelete : undefined}
          onClose={closeModal}
        />
      )}
    </div>
  );
}
