"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StrategyChart } from "@/components/strategy-chart";
import { PuzzleMode } from "@/components/puzzle-mode";
import { BlackjackGame } from "@/components/game";
import { Settings } from "@/components/settings";
import { Progress } from "@/components/progress";
import { SpeedDrill } from "@/components/speed-drill";
import { Guide } from "@/components/guide";
import { type RuleSet, DEFAULT_RULES } from "@/lib/rules";

export default function Home() {
  const [rules, setRules] = useState<RuleSet>(DEFAULT_RULES);

  return (
    <main className="max-w-4xl mx-auto px-3 py-4 sm:px-4 sm:py-8 w-full">
      <header className="mb-6 sm:mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Blackjack Trainer</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Master basic strategy {"\u00B7"}{" "}
          {rules.dealerHitsSoft17 ? "H17" : "S17"} {"\u00B7"}{" "}
          {rules.deckCount} deck{rules.deckCount > 1 ? "s" : ""}
          {rules.surrenderAllowed ? " \u00B7 Surrender" : ""}
        </p>
      </header>

      <Tabs defaultValue="train" className="space-y-6">
        <TabsList className="bg-zinc-900 border border-zinc-800 overflow-x-auto w-full flex">
          <TabsTrigger value="train" className="whitespace-nowrap">Train</TabsTrigger>
          <TabsTrigger value="speed" className="whitespace-nowrap">Speed</TabsTrigger>
          <TabsTrigger value="progress" className="whitespace-nowrap">Progress</TabsTrigger>
          <TabsTrigger value="play" className="whitespace-nowrap">Play</TabsTrigger>
          <TabsTrigger value="guide" className="whitespace-nowrap">Learn</TabsTrigger>
          <TabsTrigger value="chart" className="whitespace-nowrap">Chart</TabsTrigger>
          <TabsTrigger value="settings" className="whitespace-nowrap">Rules</TabsTrigger>
        </TabsList>

        <TabsContent value="train">
          <PuzzleMode rules={rules} />
        </TabsContent>

        <TabsContent value="speed">
          <SpeedDrill rules={rules} />
        </TabsContent>

        <TabsContent value="progress">
          <Progress />
        </TabsContent>

        <TabsContent value="play">
          <BlackjackGame rules={rules} />
        </TabsContent>

        <TabsContent value="guide">
          <Guide />
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
