use std::time::Duration;

use async_trait::async_trait;
use serde::{Deserialize, Serialize};

use crate::analysis::types::AnalysisError;

#[async_trait]
pub trait AIProvider: Send + Sync {
    async fn complete(&self, system: &str, prompt: &str) -> Result<String, AnalysisError>;
    fn model(&self) -> &str;
}

pub struct OpenAICompatibleProvider {
    client: reqwest::Client,
    endpoint: String,
    model: String,
    api_key: String,
}

impl OpenAICompatibleProvider {
    pub fn new(endpoint: String, model: String, api_key: String) -> Result<Self, AnalysisError> {
        let endpoint = endpoint.trim_end_matches('/').to_owned();
        if !endpoint.starts_with("https://")
            && !endpoint.starts_with("http://localhost")
            && !endpoint.starts_with("http://127.0.0.1")
        {
            return Err(AnalysisError::new(
                "invalidProvider",
                "AI endpoint must use HTTPS or localhost",
            ));
        }
        let client = reqwest::Client::builder()
            .timeout(Duration::from_secs(90))
            .build()
            .map_err(provider_error)?;
        Ok(Self {
            client,
            endpoint,
            model,
            api_key,
        })
    }
}

#[derive(Serialize)]
struct CompletionRequest<'a> {
    model: &'a str,
    messages: [Message<'a>; 2],
    temperature: f32,
}

#[derive(Serialize)]
struct Message<'a> {
    role: &'a str,
    content: &'a str,
}

#[derive(Deserialize)]
struct CompletionResponse {
    choices: Vec<Choice>,
}
#[derive(Deserialize)]
struct Choice {
    message: ResponseMessage,
}
#[derive(Deserialize)]
struct ResponseMessage {
    content: String,
}

#[async_trait]
impl AIProvider for OpenAICompatibleProvider {
    async fn complete(&self, system: &str, prompt: &str) -> Result<String, AnalysisError> {
        let request = CompletionRequest {
            model: &self.model,
            messages: [
                Message {
                    role: "system",
                    content: system,
                },
                Message {
                    role: "user",
                    content: prompt,
                },
            ],
            temperature: 0.1,
        };
        let response = self
            .client
            .post(format!("{}/chat/completions", self.endpoint))
            .bearer_auth(&self.api_key)
            .json(&request)
            .send()
            .await
            .map_err(provider_error)?;
        if !response.status().is_success() {
            return Err(AnalysisError::new(
                "providerFailed",
                format!("AI provider returned HTTP {}", response.status()),
            ));
        }
        response
            .json::<CompletionResponse>()
            .await
            .map_err(provider_error)?
            .choices
            .into_iter()
            .next()
            .map(|choice| choice.message.content)
            .ok_or_else(|| AnalysisError::new("providerFailed", "AI provider returned no response"))
    }

    fn model(&self) -> &str {
        &self.model
    }
}

fn provider_error(error: impl std::fmt::Display) -> AnalysisError {
    AnalysisError::new(
        "providerFailed",
        format!("AI provider request failed: {error}"),
    )
}
