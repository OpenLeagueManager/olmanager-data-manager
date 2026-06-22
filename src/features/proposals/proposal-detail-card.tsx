"use client";

/**
 * Renders a proposal body (markdown-style text from GitHub Issue)
 * as a formatted, human-readable card.
 */
export function ProposalDetailCard({ body }: { body: string }) {
  const sections = parseSections(body);

  return (
    <div className="grid gap-4">
      {sections.map((section, i) => (
        <div key={i}>
          {section.heading ? (
            <h3 className="mb-2 font-heading text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {section.heading}
            </h3>
          ) : null}
          {section.subheading ? (
            <h4 className="mb-2 text-sm font-medium">{section.subheading}</h4>
          ) : null}
          <div className="grid gap-1.5">
            {section.items.map((item, j) => (
              <div
                key={j}
                className="flex items-baseline gap-3 rounded-md px-3 py-1.5 even:bg-muted/50"
              >
                <span className="min-w-[120px] text-xs font-medium text-muted-foreground">
                  {item.key}
                </span>
                <span className="text-sm">{formatValue(item.value)}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

type ParsedSection = {
  heading?: string;
  subheading?: string;
  items: Array<{ key: string; value: string }>;
};

function parseSections(body: string): ParsedSection[] {
  const lines = body.split("\n");
  const sections: ParsedSection[] = [];
  let current: ParsedSection = { items: [] };

  for (const line of lines) {
    // ## Heading
    if (line.startsWith("## ")) {
      if (current.items.length > 0 || current.heading) {
        sections.push(current);
      }
      current = { heading: line.slice(3).trim(), items: [] };
      continue;
    }

    // ### Subheading
    if (line.startsWith("### ")) {
      if (current.items.length > 0) {
        // Flush current items under previous subheading
        const sub = { subheading: line.slice(4).trim(), items: [...current.items] };
        current.items = [];
        const lastSection = sections[sections.length - 1];
        if (lastSection && lastSection.heading === current.heading) {
          // Create a new section for this subheading
          sections.push({ heading: current.heading, ...sub });
        } else {
          sections.push({ ...current, ...sub });
        }
        // Don't reset current entirely — keep heading for next items
        current = { heading: current.heading, items: [] };
      } else {
        current.subheading = line.slice(4).trim();
      }
      continue;
    }

    // - **key**: value
    const kvMatch = line.match(/^- \*\*(.+?)\*\*:?\s*(.*)/);
    if (kvMatch) {
      current.items.push({ key: kvMatch[1].trim(), value: kvMatch[2].trim() });
      continue;
    }

    // --- separator, skip
    if (line.trim() === "---") continue;
    // Empty line, skip
    if (line.trim() === "") continue;
  }

  if (current.items.length > 0 || current.heading) {
    sections.push(current);
  }

  return sections;
}

function formatValue(value: string): string {
  // Remove surrounding quotes from JSON strings
  const unquoted = value.replace(/^"(.*)"$/, "$1");
  // If it's a JSON object or array, format it compactly
  if ((unquoted.startsWith("{") || unquoted.startsWith("[")) && unquoted.length > 60) {
    try {
      const parsed = JSON.parse(unquoted);
      return JSON.stringify(parsed, null, 0)
        .replace(/[{}"]/g, "")
        .replace(/,/g, ", ")
        .replace(/:/g, ": ");
    } catch {
      return unquoted;
    }
  }
  return unquoted;
}
