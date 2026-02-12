type CsvCell = string | number | boolean | null | undefined;

function stringifyCell(value: CsvCell): string {
    if (value === null || value === undefined) {
        return "";
    }

    const text = String(value);

    if (
        text.includes(",") ||
        text.includes('"') ||
        text.includes("\n") ||
        text.includes("\r")
    ) {
        return `"${text.replace(/"/g, '""')}"`;
    }

    return text;
}

export function toCsv(headers: string[], rows: CsvCell[][]) {
    const lines = [headers, ...rows].map((row) =>
        row.map((value) => stringifyCell(value)).join(",")
    );
    return `${lines.join("\n")}\n`;
}
