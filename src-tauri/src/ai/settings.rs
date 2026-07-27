use std::{fs, path::PathBuf, sync::Mutex};

use super::types::AISettings;
use crate::analysis::types::AnalysisError;

pub trait SecretStore: Send + Sync {
    fn set(&self, value: &str) -> Result<(), AnalysisError>;
    fn get(&self) -> Result<Option<String>, AnalysisError>;
    fn delete(&self) -> Result<(), AnalysisError>;
}

pub struct KeyringSecretStore;

impl SecretStore for KeyringSecretStore {
    fn set(&self, value: &str) -> Result<(), AnalysisError> {
        keyring::Entry::new("Codebase Explorer", "ai-api-key")
            .map_err(secret_error)?
            .set_password(value)
            .map_err(secret_error)
    }
    fn get(&self) -> Result<Option<String>, AnalysisError> {
        match keyring::Entry::new("Codebase Explorer", "ai-api-key")
            .map_err(secret_error)?
            .get_password()
        {
            Ok(value) => Ok(Some(value)),
            Err(keyring::Error::NoEntry) => Ok(None),
            Err(error) => Err(secret_error(error)),
        }
    }
    fn delete(&self) -> Result<(), AnalysisError> {
        match keyring::Entry::new("Codebase Explorer", "ai-api-key")
            .map_err(secret_error)?
            .delete_credential()
        {
            Ok(()) | Err(keyring::Error::NoEntry) => Ok(()),
            Err(error) => Err(secret_error(error)),
        }
    }
}

pub struct AISettingsState {
    path: PathBuf,
    settings: Mutex<AISettings>,
    pub secrets: Box<dyn SecretStore>,
}

impl AISettingsState {
    pub fn load(path: PathBuf, secrets: Box<dyn SecretStore>) -> Self {
        let mut settings: AISettings = fs::read_to_string(&path)
            .ok()
            .and_then(|source| serde_json::from_str(&source).ok())
            .unwrap_or_default();
        settings.configured = secrets.get().ok().flatten().is_some();
        Self {
            path,
            settings: Mutex::new(settings),
            secrets,
        }
    }
    pub fn settings(&self) -> AISettings {
        self.settings
            .lock()
            .expect("AI settings lock poisoned")
            .clone()
    }
    pub fn save(
        &self,
        endpoint: String,
        model: String,
        api_key: Option<String>,
    ) -> Result<AISettings, AnalysisError> {
        let endpoint = endpoint.trim_end_matches('/');
        if !endpoint.starts_with("https://")
            && !endpoint.starts_with("http://localhost")
            && !endpoint.starts_with("http://127.0.0.1")
        {
            return Err(AnalysisError::new(
                "invalidProvider",
                "AI endpoint must use HTTPS or localhost",
            ));
        }
        if model.trim().is_empty() {
            return Err(AnalysisError::new(
                "invalidProvider",
                "AI model is required",
            ));
        }
        if let Some(key) = api_key.filter(|value| !value.trim().is_empty()) {
            self.secrets.set(key.trim())?;
        }
        let mut settings = AISettings {
            endpoint: endpoint.into(),
            model: model.trim().into(),
            configured: self.secrets.get()?.is_some(),
        };
        if let Some(parent) = self.path.parent() {
            fs::create_dir_all(parent).map_err(settings_error)?;
        }
        let stored = AISettings {
            configured: false,
            ..settings.clone()
        };
        fs::write(
            &self.path,
            serde_json::to_vec_pretty(&stored).map_err(settings_error)?,
        )
        .map_err(settings_error)?;
        settings.configured = self.secrets.get()?.is_some();
        *self.settings.lock().expect("AI settings lock poisoned") = settings.clone();
        Ok(settings)
    }
    pub fn clear_key(&self) -> Result<AISettings, AnalysisError> {
        self.secrets.delete()?;
        let mut settings = self.settings();
        settings.configured = false;
        *self.settings.lock().expect("AI settings lock poisoned") = settings.clone();
        Ok(settings)
    }
}

fn secret_error(error: impl std::fmt::Display) -> AnalysisError {
    AnalysisError::new(
        "credentialFailed",
        format!("Could not access the system credential store: {error}"),
    )
}
fn settings_error(error: impl std::fmt::Display) -> AnalysisError {
    AnalysisError::new(
        "settingsFailed",
        format!("Could not save AI settings: {error}"),
    )
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::Mutex;
    use tempfile::tempdir;

    #[derive(Default)]
    struct MemorySecrets(Mutex<Option<String>>);
    impl SecretStore for MemorySecrets {
        fn set(&self, value: &str) -> Result<(), AnalysisError> {
            *self.0.lock().unwrap() = Some(value.into());
            Ok(())
        }
        fn get(&self) -> Result<Option<String>, AnalysisError> {
            Ok(self.0.lock().unwrap().clone())
        }
        fn delete(&self) -> Result<(), AnalysisError> {
            *self.0.lock().unwrap() = None;
            Ok(())
        }
    }

    #[test]
    fn persists_settings_without_the_api_key() {
        let dir = tempdir().unwrap();
        let path = dir.path().join("ai.json");
        let state = AISettingsState::load(path.clone(), Box::new(MemorySecrets::default()));
        let saved = state
            .save(
                "https://example.test/v1".into(),
                "model-a".into(),
                Some("secret-value".into()),
            )
            .unwrap();
        assert!(saved.configured);
        let contents = fs::read_to_string(path).unwrap();
        assert!(!contents.contains("secret-value"));
        assert!(!contents.contains("api_key"));
    }

    #[test]
    fn rejects_insecure_remote_endpoints() {
        let dir = tempdir().unwrap();
        let state = AISettingsState::load(
            dir.path().join("ai.json"),
            Box::new(MemorySecrets::default()),
        );
        let error = state
            .save("http://provider.test/v1".into(), "model-a".into(), None)
            .unwrap_err();
        assert_eq!(error.code, "invalidProvider");
    }
}
