export function nextLetter(ch: string): string {
    return ch === "Z" ? "A" : String.fromCharCode(ch.charCodeAt(0) + 1);
}

export function prevLetter(ch: string): string {
    return ch === "A" ? "Z" : String.fromCharCode(ch.charCodeAt(0) - 1);
}