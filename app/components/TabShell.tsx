"use client";

import { useState } from "react";
import GenerateTab from "./generate/GenerateTab";
import BulkTab from "./generate/BulkTab";
import HistoryTab from "./history/HistoryTab";

type Tab = "single" | "bulk" | "history";

const tabs: { id: Tab; label: string }[] = [
  { id: "single", label: "Single Photo" },
  { id: "bulk", label: "Bulk" },
  { id: "history", label: "History" },
];

export default function TabShell() {
  const [active, setActive] = useState<Tab>("single");

  return (
    <div>
      <div className="flex border-b border-zinc-800 mb-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={`px-5 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
              active === tab.id
                ? "border-white text-white"
                : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {active === "single" && <GenerateTab />}
      {active === "bulk" && <BulkTab />}
      {active === "history" && <HistoryTab />}
    </div>
  );
}
