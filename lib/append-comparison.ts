import { emptyRun, type HistoryEntry, type ModelEndpoint, type RunState } from "./types.ts";

/** Retained rows are display-only: they never carry request credentials. */
export function retainedComparison(source: HistoryEntry) {
  const runs: Record<string, RunState> = {};
  const endpoints: ModelEndpoint[] = source.results.map((result, i) => {
    const id = `retained-${i}`;
    runs[id] = {
      ...emptyRun(), ...result, samples: result.samples ?? [], rank: undefined,
      origin: {
        kind: source.source?.kind === "share" ? "share" : "history",
        id: result.origin?.id ?? source.id,
        at: result.origin?.at ?? (source.at || undefined),
      },
    };
    return { id, name: result.name, model: result.model, kind: "openai",
      baseUrl: result.provider ?? "", customPricing: result.customPricing, apiKey: "", enabled: true };
  });
  return { endpoints, runs };
}
