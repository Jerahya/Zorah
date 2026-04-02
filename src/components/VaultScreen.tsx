import { useState, useEffect, useRef } from "react";
import { Credential, Vault } from "../types/vault";
import { ZorahLogo } from "./icons";
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
  onReorder: (ids: string[]) => Promise<void>;
}

export default function VaultScreen({ vault, onLock, onAdd, onUpdate, onDelete, onReorder }: Props) {
  const [query, setQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingCred, setEditingCred] = useState<Credential | null>(null);
  const [order, setOrder] = useState<string[]>(() => vault.credentials.map((c) => c.id));
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const dragId = useRef<string | null>(null);
  const dragOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const ghostRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const orderRef = useRef(order);
  orderRef.current = order;

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!dragId.current || !listRef.current) return;

      if (ghostRef.current) {
        ghostRef.current.style.left = (e.clientX - dragOffset.current.x) + "px";
        ghostRef.current.style.top  = (e.clientY - dragOffset.current.y) + "px";
      }

      const cards = listRef.current.querySelectorAll<HTMLElement>("[data-cardid]");
      let targetId: string | null = null;
      for (const card of cards) {
        const rect = card.getBoundingClientRect();
        if (e.clientY < rect.top + rect.height / 2) {
          targetId = card.dataset.cardid ?? null;
          break;
        }
      }
      if (!targetId && cards.length > 0) {
        targetId = cards[cards.length - 1].dataset.cardid ?? null;
      }
      if (!targetId || targetId === dragId.current) return;
      setOrder((prev) => {
        const from = prev.indexOf(dragId.current!);
        const to   = prev.indexOf(targetId!);
        if (from === -1 || to === -1) return prev;
        const next = [...prev];
        next.splice(from, 1);
        next.splice(to, 0, dragId.current!);
        return next;
      });
    };

    const onUp = (e: PointerEvent) => {
      if (!dragId.current) return;
      dragId.current = null;
      setDraggingId(null);
      if (ghostRef.current) ghostRef.current.style.display = "none";
      if (e.type === "pointerup") {
        onReorder(orderRef.current);
      }
    };

    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
    document.addEventListener("pointercancel", onUp);
    return () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
      document.removeEventListener("pointercancel", onUp);
    };
  }, [onReorder]);

  useEffect(() => {
    setOrder((prev) => {
      const ids = vault.credentials.map((c) => c.id);
      const kept = prev.filter((id) => ids.includes(id));
      const added = ids.filter((id) => !prev.includes(id));
      return [...kept, ...added];
    });
  }, [vault.credentials]);

  const orderedCredentials = order
    .map((id) => vault.credentials.find((c) => c.id === id))
    .filter((c): c is Credential => !!c);

  const filtered = orderedCredentials.filter((c) => {
    const q = query.toLowerCase();
    return (
      c.title.toLowerCase().includes(q) ||
      c.custom_fields.some(
        (f) => f.key.toLowerCase().includes(q) || (!f.secret && f.value.toLowerCase().includes(q))
      )
    );
  });

  const openAdd = () => { setEditingCred(null); setShowModal(true); };
  const openEdit = (cred: Credential) => { setEditingCred(cred); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setEditingCred(null); };

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

  const handlePointerDown = (e: React.PointerEvent, id: string) => {
    e.preventDefault();
    const card = (e.currentTarget as HTMLElement).closest<HTMLElement>("[data-cardid]");
    if (card) {
      const rect = card.getBoundingClientRect();
      dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      if (ghostRef.current) {
        ghostRef.current.style.width = rect.width + "px";
        ghostRef.current.style.left = rect.left + "px";
        ghostRef.current.style.top = rect.top + "px";
        ghostRef.current.style.display = "block";
      }
    }
    dragId.current = id;
    setDraggingId(id);
  };

  const draggingCred = draggingId ? vault.credentials.find((c) => c.id === draggingId) ?? null : null;

  return (
    <div className="vault-screen">
      <header className="vault-header">
        <h1><ZorahLogo />orah Vault</h1>
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

      <div className="credential-list" ref={listRef}>
        {filtered.length === 0 ? (
          <p className="empty-state">
            {vault.credentials.length === 0
              ? 'No credentials yet. Click "+ Add" to get started.'
              : "No results match your search."}
          </p>
        ) : (
          filtered.map((cred) => (
            <div
              key={cred.id}
              data-cardid={cred.id}
              className={`draggable-card${draggingId === cred.id ? " is-dragging" : ""}`}
            >
              <CredentialCard
                credential={cred}
                onEdit={() => openEdit(cred)}
                dragHandle={
                  <div
                    className="drag-handle"
                    title="Drag to reorder"
                    onPointerDown={(e) => handlePointerDown(e, cred.id)}
                  >
                    ⠿
                  </div>
                }
              />
            </div>
          ))
        )}
      </div>

      <div ref={ghostRef} className="drag-ghost" style={{ display: "none" }}>
        {draggingCred && <CredentialCard credential={draggingCred} onEdit={() => {}} />}
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
