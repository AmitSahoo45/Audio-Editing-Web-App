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
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-150 hover:cursor-pointer " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-1 focus-visible:ring-offset-background " +
    "disabled:pointer-events-none disabled:opacity-40 active:scale-[0.97]",
    {
        variants: {
            variant: {
                default:
                    "bg-accent text-white hover:bg-accent/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_1px_2px_rgba(0,0,0,0.3)]",
                secondary:
                    "bg-surface-raised text-foreground border border-border hover:bg-border/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_1px_2px_rgba(0,0,0,0.2)]",
                outline:
                    "border border-border bg-transparent text-foreground hover:bg-surface-raised hover:border-text-dim",
                ghost:
                    "bg-transparent text-text-muted hover:bg-surface-raised hover:text-foreground",
                link: "bg-transparent underline-offset-4 hover:underline text-accent",
                destructive:
                    "bg-red-600 text-white hover:bg-red-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_1px_2px_rgba(0,0,0,0.3)]",
            },
            size: {
                default: "h-9 px-3",
                sm: "h-8 px-2.5 text-xs",
                lg: "h-10 px-4 text-sm",
                icon: "h-9 w-9 p-0",
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