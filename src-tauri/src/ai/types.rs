use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AISettings {
    pub endpoint: String,
    pub model: String,
    pub configured: bool,
}

impl Default for AISettings {
    fn default() -> Self {
        Self {
            endpoint: "https://api.openai.com/v1".into(),
            model: "gpt-4.1-mini".into(),
            configured: false,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum AIAction {
    ExplainFile,
    ExplainSymbol,
    SuggestRefactoring,
    ReviewDeadCode,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AIRequest {
    pub scan_id: String,
    pub path: String,
    pub action: AIAction,
    pub symbol_id: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AIResponse {
    pub content: String,
    pub model: String,
    pub provider: String,
}
