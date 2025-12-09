import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Fix voor ESM (__dirname bestaat niet)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Altijd ROOT/data/highscore.json
const filePath = path.join(process.cwd(), "data/highscore.json");

// Type-definitie voor één score
export interface ScoreEntry {
    name: string;
    score: number;
}

// Type voor heel JSON-bestand
export interface HighscoreFile {
    scores: ScoreEntry[];
}

/**
 * Laad top 3 highscores.
 */
export function loadHighscores(): ScoreEntry[] {
    try {
        if (!fs.existsSync(filePath)) {
            // Indien bestand nog niet bestaat → placeholder data
            return [
                { name: "---", score: 0 },
                { name: "---", score: 0 },
                { name: "---", score: 0 }
            ];
        }

        const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
        return data.scores ?? [];
    } catch (err) {
        console.error("Error loading highscores:", err);
        return [
            { name: "---", score: 0 },
            { name: "---", score: 0 },
            { name: "---", score: 0 }
        ];
    }
}

/**
 * Sla de volledige top 3 op.
 */
export function saveHighscores(scores: ScoreEntry[]) {
    try {
        const data: HighscoreFile = { scores };
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    } catch (err) {
        console.error("Error saving highscores:", err);
    }
}
