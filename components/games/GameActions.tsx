"use client";

import { BarChart3, Eye, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { type KeyboardEvent, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { currentUser } from "@/lib/data/users";
import type { ChessGame } from "@/lib/types/chess";
import { canDeleteGame, canEditGameDetails, canEditGameNotes } from "@/lib/utils/gameRules";

const itemClass = "flex w-full items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-left text-sm font-semibold text-neutral-700 transition hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-focus";

export function GameActions({ game, onDelete }: { game: ChessGame; onDelete: (game: ChessGame) => void }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });
  const menuId = useId();
  const editLabel = canEditGameDetails(currentUser, game) ? "Editar partida" : canEditGameNotes(currentUser, game) ? "Editar observações" : null;

  useEffect(() => {
    if (!open) return;
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node) && !menuRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  const focusItem = (position: "first" | "last") => {
    requestAnimationFrame(() => {
      const items = menuRef.current?.querySelectorAll<HTMLElement>("[role='menuitem']");
      items?.[position === "first" ? 0 : items.length - 1]?.focus();
    });
  };
  const positionMenu = () => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) {
      const itemCount = 2 + Number(Boolean(editLabel)) + Number(canDeleteGame(currentUser, game));
      const estimatedMenuHeight = itemCount * 40 + 12;
      const top = rect.bottom + estimatedMenuHeight + 8 <= window.innerHeight ? rect.bottom + 8 : Math.max(8, rect.top - estimatedMenuHeight - 8);
      setMenuPosition({ top, right: Math.max(8, window.innerWidth - rect.right) });
    }
  };
  const toggle = () => {
    if (!open) positionMenu();
    setOpen((current) => !current);
    if (!open) focusItem("first");
  };
  const handleTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      positionMenu();
      setOpen(true);
      focusItem(event.key === "ArrowDown" ? "first" : "last");
    }
  };
  const handleMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const items = [...(menuRef.current?.querySelectorAll<HTMLElement>("[role='menuitem']") ?? [])];
    const currentIndex = items.indexOf(document.activeElement as HTMLElement);
    const nextIndex = event.key === "Home" ? 0 : event.key === "End" ? items.length - 1 : event.key === "ArrowDown" ? (currentIndex + 1) % items.length : (currentIndex - 1 + items.length) % items.length;
    items[nextIndex]?.focus();
  };
  const close = () => setOpen(false);

  return <div ref={containerRef} className="relative inline-flex">
    <button ref={triggerRef} type="button" aria-haspopup="menu" aria-expanded={open} aria-controls={open ? menuId : undefined} aria-label={`Ações para partida contra ${game.opponent}`} onClick={toggle} onKeyDown={handleTriggerKeyDown} className="inline-flex items-center justify-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-sm font-semibold text-neutral-800 shadow-sm hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"><MoreHorizontal size={18} aria-hidden="true" /><span>Ações</span></button>
    {open && createPortal(<div ref={menuRef} id={menuId} role="menu" aria-label={`Ações para partida contra ${game.opponent}`} onKeyDown={handleMenuKeyDown} style={menuPosition} className="fixed z-50 min-w-52 rounded-xl border border-line bg-white p-1.5 shadow-xl">
      <Link role="menuitem" href={`/partidas/${game.id}`} onClick={close} className={itemClass}><Eye size={16} aria-hidden="true" />Ver detalhes</Link>
      {editLabel && <Link role="menuitem" href={`/partidas/${game.id}/editar`} onClick={close} className={itemClass}><Pencil size={16} aria-hidden="true" />{editLabel}</Link>}
      <Link role="menuitem" href={`/partidas/${game.id}/analise`} onClick={close} className={itemClass}><BarChart3 size={16} aria-hidden="true" />Abrir análise</Link>
      {canDeleteGame(currentUser, game) && <button role="menuitem" type="button" onClick={() => { close(); onDelete(game); }} className={`${itemClass} text-red-700 hover:bg-red-50`}><Trash2 size={16} aria-hidden="true" />Excluir</button>}
    </div>, document.body)}
  </div>;
}
