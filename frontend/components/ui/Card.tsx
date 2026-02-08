'use client';

import * as React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
}

export function Card({ className = '', children, ...props }: CardProps) {
    return (
        <div
            className={`rounded-lg border border-border bg-surface/80 p-4 ${className}`}
            {...props}
        >
            {children}
        </div>
    );
}

export function CardHeader({ className = '', children, ...props }: CardProps) {
    return (
        <div className={`mb-3 ${className}`} {...props}>
            {children}
        </div>
    );
}

export function CardTitle({ className = '', children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
    return (
        <h3 className={`text-sm font-semibold uppercase tracking-wider text-text-muted ${className}`} {...props}>
            {children}
        </h3>
    );
}