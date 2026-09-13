import { useEffect, useCallback } from 'react';
import { useAudioStore } from '@/store/audio-store';

interface KeyboardShortcutsOptions {
    onPlayPause?: () => void;
    onTrim?: () => void;
    onNormalize?: () => void;
    onDelete?: () => void;
    onUndo?: () => void;
    onRedo?: () => void;
}

/**
 * Central keyboard-shortcuts manager for the audio editor.
 *
 *  Space          – Play / Pause
 *  Delete         – Remove selected region
 *  Ctrl+X         – Trim (cut) selected region
 *  Ctrl+Shift+L   – Normalize
 *  Ctrl+Z         – Undo
 *  Ctrl+Shift+Z   – Redo
 */
export function useKeyboardShortcuts(opts: KeyboardShortcutsOptions) {
    const { onPlayPause, onTrim, onNormalize, onDelete, onUndo, onRedo } = opts;

    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            const target = e.target;
            const el = target instanceof Element ? target : null;
            const isEditable =
                target instanceof HTMLInputElement ||
                target instanceof HTMLTextAreaElement ||
                target instanceof HTMLSelectElement ||
                (el instanceof HTMLElement && el.isContentEditable);
            const isNativeControl =
                target instanceof HTMLButtonElement ||
                target instanceof HTMLSelectElement ||
                el?.closest('a, button, [role="button"]') != null;
            const ctrl = e.ctrlKey || e.metaKey;

            if (ctrl) {
                if (isEditable) return;
            } else if (isEditable || isNativeControl) {
                return;
            }

            if (ctrl && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                onUndo?.();
                return;
            }
            if (ctrl && e.key === 'z' && e.shiftKey) {
                e.preventDefault();
                onRedo?.();
                return;
            }
            if (ctrl && e.key === 'y') {
                e.preventDefault();
                onRedo?.();
                return;
            }

            if (e.code === 'Space') {
                e.preventDefault();
                onPlayPause?.();
                return;
            }

            if (ctrl && e.key === 'x') {
                e.preventDefault();
                onTrim?.();
                return;
            }

            if (ctrl && e.shiftKey && e.key === 'L') {
                e.preventDefault();
                onNormalize?.();
                return;
            }

            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (!ctrl && onDelete) {
                    e.preventDefault();
                    onDelete();
                }
                return;
            }
        },
        [onPlayPause, onTrim, onNormalize, onDelete, onUndo, onRedo]
    );

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);
}

/** Convenience hook that wires undo/redo to the temporal store */
export function useUndoRedoShortcuts() {
    const { undo, redo } = useAudioStore.temporal.getState();
    useKeyboardShortcuts({ onUndo: undo, onRedo: redo });
}
