"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StrategyChart } from "@/components/strategy-chart";
import { PuzzleMode } from "@/components/puzzle-mode";
import { BlackjackGame } from "@/components/game";
import { Settings } from "@/components/settings";
import { type RuleSet, DEFAULT_RULES } from "@/lib/rules";

export default function Home() {
  const [rules, setRules] = useState<RuleSet>(DEFAULT_RULES);

  return (
    <main className="max-w-4xl mx-auto px-4 py-8 w-full">
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Blackjack Trainer</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Master basic strategy {"\u00B7"}{" "}
          {rules.dealerHitsSoft17 ? "H17" : "S17"} {"\u00B7"}{" "}
          {rules.deckCount} deck{rules.deckCount > 1 ? "s" : ""}
          {rules.surrenderAllowed ? " \u00B7 Surrender" : ""}
        </p>
      </header>

      <Tabs defaultValue="puzzles" className="space-y-6">
        <TabsList className="bg-zinc-900 border border-zinc-800">
          <TabsTrigger value="puzzles">Puzzles</TabsTrigger>
          <TabsTrigger value="play">Play</TabsTrigger>
          <TabsTrigger value="chart">Chart</TabsTrigger>
          <TabsTrigger value="settings">Rules</TabsTrigger>
        </TabsList>

        <TabsContent value="puzzles">
          <PuzzleMode rules={rules} />
        </TabsContent>

        <TabsContent value="play">
          <BlackjackGame rules={rules} />
        </TabsContent>

        <TabsContent value="chart">
          <StrategyChart rules={rules} />
        </TabsContent>

        <TabsContent value="settings">
          <Settings rules={rules} onChange={setRules} />
        </TabsContent>
      </Tabs>
    </main>
  );
}
