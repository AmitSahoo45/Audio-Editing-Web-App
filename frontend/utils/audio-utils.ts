export function createObjectURL(blob: Blob): string {
    return URL.createObjectURL(blob);
}

export function revokeObjectURL(url: string): void {
    URL.revokeObjectURL(url);
}

export function fileToObjectURL(file: File): string {
    return URL.createObjectURL(file);
}