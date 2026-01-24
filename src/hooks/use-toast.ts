"use client";

import * as React from "react";

import type { ToastProps, ToastActionElement } from "@/components/ui/toast";

type Toast = ToastProps & {
    id: string;
    title?: React.ReactNode;
    description?: React.ReactNode;
    action?: ToastActionElement;
};

type State = {
    toasts: Toast[];
};

// トーストの同時表示数と自動クローズの猶予
// 表示上限を超えたら古いものから落とす
const TOAST_LIMIT = 4;
const TOAST_REMOVE_DELAY = 6000;

type Action =
    | { type: "ADD_TOAST"; toast: Toast }
    | { type: "UPDATE_TOAST"; toast: Partial<Toast> & { id: string } }
    | { type: "DISMISS_TOAST"; toastId?: string }
    | { type: "REMOVE_TOAST"; toastId?: string };

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

function toastReducer(state: State, action: Action): State {
    switch (action.type) {
        case "ADD_TOAST":
            return {
                ...state,
                toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
            };
        case "UPDATE_TOAST":
            return {
                ...state,
                toasts: state.toasts.map((toast) =>
                    toast.id === action.toast.id
                        ? { ...toast, ...action.toast }
                        : toast
                ),
            };
        case "DISMISS_TOAST": {
            const { toastId } = action;
            if (toastId) {
                const timeout = setTimeout(
                    () =>
                        dispatch({
                            type: "REMOVE_TOAST",
                            toastId,
                        }),
                    TOAST_REMOVE_DELAY
                );
                toastTimeouts.set(toastId, timeout);
            }

            return {
                ...state,
                toasts: state.toasts.map((toast) =>
                    toastId === undefined || toast.id === toastId
                        ? { ...toast, open: false }
                        : toast
                ),
            };
        }
        case "REMOVE_TOAST":
            if (action.toastId === undefined) {
                return { ...state, toasts: [] };
            }
            return {
                ...state,
                toasts: state.toasts.filter(
                    (toast) => toast.id !== action.toastId
                ),
            };
        default:
            return state;
    }
}

const listeners: Array<(state: State) => void> = [];
let memoryState: State = { toasts: [] };

// 共有ストアにアクションを配信する
// グローバルなリスナー配列に通知してUIを更新する
function dispatch(action: Action) {
    memoryState = toastReducer(memoryState, action);
    listeners.forEach((listener) => {
        listener(memoryState);
    });
}

function generateId() {
    return Math.random().toString(36).slice(2, 10);
}

type ToastInput = Omit<Toast, "id">;

function toast({ ...props }: ToastInput) {
    const id = generateId();

    const update = (updateProps: Partial<Toast>) =>
        dispatch({
            type: "UPDATE_TOAST",
            toast: { ...updateProps, id },
        });

    const dismiss = () =>
        dispatch({
            type: "DISMISS_TOAST",
            toastId: id,
        });

    dispatch({
        type: "ADD_TOAST",
        toast: {
            ...props,
            id,
            open: true,
            onOpenChange: (open) => {
                if (!open) dismiss();
            },
        },
    });

    return { id, dismiss, update };
}

function useToast() {
    const [state, setState] = React.useState<State>(memoryState);

    React.useEffect(() => {
        listeners.push(setState);
        return () => {
            const index = listeners.indexOf(setState);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        };
    }, []);

    return {
        ...state,
        toast,
        dismiss: (toastId?: string) =>
            dispatch({ type: "DISMISS_TOAST", toastId }),
    };
}

export { useToast, toast };
