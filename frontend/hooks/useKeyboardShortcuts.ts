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
 *  Ctrl+N         – Normalize
 *  Ctrl+Z         – Undo
 *  Ctrl+Shift+Z   – Redo
 */
export function useKeyboardShortcuts(opts: KeyboardShortcutsOptions) {
    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            // Skip when user is typing in an input/textarea
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

            const ctrl = e.ctrlKey || e.metaKey;

            // Undo / Redo
            if (ctrl && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                opts.onUndo?.();
                return;
            }
            if (ctrl && e.key === 'z' && e.shiftKey) {
                e.preventDefault();
                opts.onRedo?.();
                return;
            }
            if (ctrl && e.key === 'y') {
                e.preventDefault();
                opts.onRedo?.();
                return;
            }

            // Play / Pause
            if (e.code === 'Space') {
                e.preventDefault();
                opts.onPlayPause?.();
                return;
            }

            // Trim (Ctrl+X)
            if (ctrl && e.key === 'x') {
                e.preventDefault();
                opts.onTrim?.();
                return;
            }

            // Normalize (Ctrl+Shift+N)
            if (ctrl && e.shiftKey && e.key === 'N') {
                e.preventDefault();
                opts.onNormalize?.();
                return;
            }

            // Delete region
            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (!ctrl) {
                    e.preventDefault();
                    opts.onDelete?.();
                }
                return;
            }
        },
        [opts]
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
