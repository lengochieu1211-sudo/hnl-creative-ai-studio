# Security notes

- Never commit Gemini/API keys to this repository.
- GitHub Pages mode is BYOK: a key entered by a user belongs to that browser session/profile.
- “Remember key” uses browser localStorage. Use the Clear action in AI Settings to remove it.
- Project JSON and ZIP backup intentionally exclude API keys.
- For shared/public production deployments, prefer a secure backend proxy with server-side secrets and appropriate authentication/rate limits.
- Normal local editing and export do not require uploading media to AI. Media is sent to a provider only when the user explicitly runs an AI feature.
