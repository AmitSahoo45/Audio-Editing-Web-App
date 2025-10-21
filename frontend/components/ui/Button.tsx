'use client';


import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { twMerge } from "tailwind-merge";
import clsx from "clsx";

function cn(...inputs: Array<string | undefined | null | false>) {
    return twMerge(clsx(inputs));
}

const buttonVariants = cva(
    // base styles
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-medium transition-colors hover:cursor-pointer" +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
    {
        variants: {
            variant: {
                default:
                    "bg-slate-900 text-white hover:bg-slate-900/90 ring-slate-900/40",
                secondary:
                    "bg-slate-100 text-slate-900 hover:bg-slate-100/80 ring-slate-300",
                outline:
                    "border border-slate-300 bg-transparent hover:bg-slate-500/10 ring-slate-300",
                ghost:
                    "bg-transparent hover:bg-slate-900/10 text-slate-300 hover:text-white ring-slate-400/40",
                link: "bg-transparent underline-offset-4 hover:underline text-slate-900",
                destructive:
                    "bg-red-600 text-white hover:bg-red-600/90 ring-red-600/40",
            },
            size: {
                default: "h-10 px-4",
                sm: "h-9 px-3 text-sm",
                lg: "h-11 px-5 text-base",
                icon: "h-10 w-10 p-0", // for icon-only buttons
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
);

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
    asChild?: boolean; 
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild, ...props }, ref) => {
        const Comp = asChild ? Slot : "button";
        return (
            <Comp
                ref={ref}
                className={cn(buttonVariants({ variant, size }), className)}
                {...props}
            />
        );
    }
);

Button.displayName = "Button";