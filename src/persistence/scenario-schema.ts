import type { ScenarioMetadata, TacticalScenario } from "../engine/scenarios/scenario-models";

export const SCENARIO_SCHEMA_ID = "pitchflow.v2.scenario" as const;
export const SCENARIO_SCHEMA_VERSION = 1 as const;

export interface SavedScenarioDocument {
  schema: typeof SCENARIO_SCHEMA_ID;
  schemaVersion: typeof SCENARIO_SCHEMA_VERSION;
  metadata: ScenarioMetadata;
  scenario: TacticalScenario;
  exportInfo?: {
    exportedAt: number;
    source: "vision-labs-v2";
  };
}
