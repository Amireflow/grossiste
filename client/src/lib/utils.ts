import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function downloadCSV(data: any[], filename: string) {
  if (!data || !data.length) {
    return;
  }

  // Get headers from the first object
  const headers = Object.keys(data[0]);

  // Create CSV content
  const csvContent = [
    headers.join(","), // Header row
    ...data.map(row =>
      headers.map(header => {
        const cell = row[header];
        // Handle null/undefined
        const cellString = cell === null || cell === undefined ? "" : String(cell);

        // Escape quotes and wrap in quotes if contains comma, quote or newline
        if (cellString.includes(",") || cellString.includes('"') || cellString.includes("\n")) {
          return `"${cellString.replace(/"/g, '""')}"`;
        }
        return cellString;
      }).join(",")
    )
  ].join("\n");

  // Create download link
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
