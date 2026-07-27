export type AISettings = {
  endpoint: string;
  model: string;
  configured: boolean;
};

export type AIAction =
  "explainFile" | "explainSymbol" | "suggestRefactoring" | "reviewDeadCode";

export type AIResponse = {
  content: string;
  model: string;
  provider: string;
};
