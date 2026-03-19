"use client";

import { useState } from "react";
import { GUIDE_PAGES, type GuidePage } from "@/lib/guide-content";

// ── Interactive widgets ──────────────────────────────────────

function CompareChart({ data }: { data: { title: string; items: { label: string; value: number; color: string }[] } }) {
  const max = Math.max(...data.items.map((i) => i.value));
  const colorMap: Record<string, string> = {
    green: "bg-green-500",
    yellow: "bg-yellow-500",
    red: "bg-red-500",
  };
  return (
    <div className="space-y-2">
      <h4 className="text-xs uppercase tracking-wider text-zinc-500 font-medium">{data.title}</h4>
      <div className="space-y-1.5">
        {data.items.map((item) => (
          <div key={item.label} className="flex items-center gap-3">
            <span className="text-xs text-zinc-400 w-40 sm:w-48 text-right shrink-0 truncate">
              {item.label}
            </span>
            <div className="flex-1 h-5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className={`h-full ${colorMap[item.color]} rounded-full transition-all duration-700`}
                style={{ width: `${(item.value / max) * 100}%` }}
              />
            </div>
            <span className="text-xs font-mono text-zinc-300 w-12 text-right">
              {item.value}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Quiz({ data }: { data: { question: string; options: string[]; correct: number; explanation: string } }) {
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-zinc-200">{data.question}</p>
      <div className="space-y-2">
        {data.options.map((option, i) => {
          let cls = "w-full text-left px-4 py-2.5 rounded-lg text-sm transition-all ";
          if (selected === null) {
            cls += "bg-zinc-800 text-zinc-300 hover:bg-zinc-700 cursor-pointer";
          } else if (i === data.correct) {
            cls += "bg-green-600 text-white ring-2 ring-green-400";
          } else if (i === selected) {
            cls += "bg-red-600 text-white ring-2 ring-red-400";
          } else {
            cls += "bg-zinc-800/50 text-zinc-600";
          }
          return (
            <button
              key={i}
              onClick={() => selected === null && setSelected(i)}
              disabled={selected !== null}
              className={cls}
            >
              {option}
            </button>
          );
        })}
      </div>
      {selected !== null && (
        <div className={`p-3 rounded-lg border text-sm ${
          selected === data.correct
            ? "bg-green-950/30 border-green-800/50 text-green-300"
            : "bg-red-950/30 border-red-800/50 text-red-300"
        }`}>
          {selected === data.correct ? "Correct! " : "Not quite. "}
          <span className="text-zinc-400">{data.explanation}</span>
        </div>
      )}
    </div>
  );
}

function RevealList({ data }: { data: { title: string; items: { hidden: string; detail: string }[] } }) {
  const [revealed, setRevealed] = useState<Set<number>>(new Set());

  return (
    <div className="space-y-2">
      <h4 className="text-xs uppercase tracking-wider text-zinc-500 font-medium">{data.title}</h4>
      <div className="space-y-1">
        {data.items.map((item, i) => {
          const isOpen = revealed.has(i);
          return (
            <button
              key={i}
              onClick={() => {
                const next = new Set(revealed);
                if (isOpen) next.delete(i);
                else next.add(i);
                setRevealed(next);
              }}
              className="w-full text-left"
            >
              <div className={`px-4 py-2.5 rounded-lg transition-all ${
                isOpen ? "bg-zinc-800" : "bg-zinc-900 hover:bg-zinc-800"
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-zinc-200">{item.hidden}</span>
                  <span className="text-zinc-600 text-xs">{isOpen ? "\u25B2" : "\u25BC"}</span>
                </div>
                {isOpen && (
                  <p className="text-sm text-zinc-400 mt-2">{item.detail}</p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function InteractiveWidget({ page }: { page: GuidePage }) {
  if (!page.interactive) return null;

  switch (page.interactive.type) {
    case "compare":
      return <CompareChart data={page.interactive.data as { title: string; items: { label: string; value: number; color: string }[] }} />;
    case "quiz":
      return <Quiz data={page.interactive.data as { question: string; options: string[]; correct: number; explanation: string }} />;
    case "reveal":
      return <RevealList data={page.interactive.data as { title: string; items: { hidden: string; detail: string }[] }} />;
    default:
      return null;
  }
}

// ── Content renderer ─────────────────────────────────────────

function ContentRenderer({ content }: { content: string }) {
  const paragraphs = content.split("\n\n");

  return (
    <div className="space-y-4">
      {paragraphs.map((p, i) => {
        const trimmed = p.trim();
        if (!trimmed) return null;

        // Render bold markers
        const parts = trimmed.split(/(\*\*[^*]+\*\*)/g);
        const rendered = parts.map((part, j) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            return (
              <strong key={j} className="text-zinc-100 font-semibold">
                {part.slice(2, -2)}
              </strong>
            );
          }
          return <span key={j}>{part}</span>;
        });

        // Check if it's a list item
        if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          const lines = trimmed.split("\n").filter(Boolean);
          return (
            <ul key={i} className="space-y-1 ml-1">
              {lines.map((line, li) => {
                const text = line.replace(/^[-*]\s+/, "");
                const lineParts = text.split(/(\*\*[^*]+\*\*)/g);
                return (
                  <li key={li} className="text-sm text-zinc-400 leading-relaxed flex gap-2">
                    <span className="text-zinc-600 shrink-0">{"\u2022"}</span>
                    <span>
                      {lineParts.map((part, j) =>
                        part.startsWith("**") && part.endsWith("**") ? (
                          <strong key={j} className="text-zinc-200 font-semibold">{part.slice(2, -2)}</strong>
                        ) : (
                          <span key={j}>{part}</span>
                        )
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          );
        }

        return (
          <p key={i} className="text-sm text-zinc-400 leading-relaxed">
            {rendered}
          </p>
        );
      })}
    </div>
  );
}

// ── Main Guide component ─────────────────────────────────────

export function Guide() {
  const [currentPage, setCurrentPage] = useState(0);
  const page = GUIDE_PAGES[currentPage];

  return (
    <div className="space-y-6">
      {/* Page nav */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">{page.title}</h2>
          <p className="text-sm text-zinc-500">{page.subtitle}</p>
        </div>
        <span className="text-xs font-mono text-zinc-600">
          {currentPage + 1} / {GUIDE_PAGES.length}
        </span>
      </div>

      {/* Page dots */}
      <div className="flex gap-1.5 justify-center">
        {GUIDE_PAGES.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentPage(i)}
            className={`w-2 h-2 rounded-full transition-all ${
              i === currentPage
                ? "bg-emerald-500 w-6"
                : i < currentPage
                  ? "bg-zinc-600"
                  : "bg-zinc-800"
            }`}
          />
        ))}
      </div>

      {/* Content */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 sm:p-6 space-y-6">
        <ContentRenderer content={page.content} />

        {/* Interactive element */}
        {page.interactive && (
          <div className="pt-4 border-t border-zinc-800">
            <InteractiveWidget page={page} />
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex gap-3">
        <button
          onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
          disabled={currentPage === 0}
          className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
            currentPage === 0
              ? "bg-zinc-900 text-zinc-700 cursor-not-allowed"
              : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
          }`}
        >
          {"\u2190"} Previous
        </button>
        <button
          onClick={() => setCurrentPage((p) => Math.min(GUIDE_PAGES.length - 1, p + 1))}
          disabled={currentPage === GUIDE_PAGES.length - 1}
          className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
            currentPage === GUIDE_PAGES.length - 1
              ? "bg-zinc-900 text-zinc-700 cursor-not-allowed"
              : "bg-emerald-700 text-white hover:bg-emerald-600"
          }`}
        >
          Next {"\u2192"}
        </button>
      </div>

      {/* Table of contents */}
      <details className="text-xs">
        <summary className="text-zinc-600 cursor-pointer hover:text-zinc-400 transition-colors">
          Table of Contents
        </summary>
        <div className="mt-2 space-y-1 pl-2 border-l border-zinc-800">
          {GUIDE_PAGES.map((p, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i)}
              className={`block w-full text-left px-2 py-1 rounded transition-colors ${
                i === currentPage
                  ? "text-zinc-200 bg-zinc-800"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {i + 1}. {p.title}
            </button>
          ))}
        </div>
      </details>
    </div>
  );
}
