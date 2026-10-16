/* The section's strings: the harnesses, each harness's model picker, and the ways to reach a model
 * (window.APART.data, the shape the site's section reads). Facts from the VS Code docs (agent harnesses, language
 * models), October 2026. Names marked VERIFY are placeholders: check them against the model picker before shipping. */
(() => {
	'use strict';
	const AP = window.APART = window.APART || {};

	AP.data = {
		// The Session Target's harnesses (the input's watermark is the product's "Chat with {0}").
		harnesses: {
			copilot: { label: 'Copilot', icon: 'copilot', model: 'Ensemble', modelIcon: 'copilot', ph: 'Chat with Copilot' },
			local: { label: 'Local', icon: 'vm', model: 'Ensemble', modelIcon: 'copilot', ph: 'Chat with Copilot' },
			cloud: { label: 'Cloud', icon: 'cloud', model: 'Ensemble', modelIcon: 'copilot', ph: 'Chat with Copilot' },
			claude: { label: 'Claude', icon: 'claude', model: 'Claude Opus 5.5', modelIcon: 'claude', ph: 'Chat with Claude' },
			// VERIFY: Codex's default model name.
			codex: { label: 'Codex', icon: 'openai', model: 'GPT-5.5-Codex', modelIcon: 'openai', ph: 'Chat with Codex' },
		},
		// The harness picker's menu: Copilot, Local, Cloud, then Claude and Codex, then the docs link.
		harnessMenu: ['copilot', 'local', 'cloud', '-', 'claude', 'codex', '-', 'learn'],
		learnHarnesses: 'Learn about agent harnesses',
		continueMenu: ['copilot', 'cloud', '-', 'claude', 'codex'],

		// Built-in providers for your own key (Add Models), in the product's order.
		providers: [
			{ id: 'anthropic', label: 'Anthropic', mark: 'claude', models: ['Claude Opus 5.5', 'Claude Sonnet 5.5', 'Claude Haiku 5.5'] },
			{ id: 'google', label: 'Google', mark: 'google-gemini', models: ['Gemini 3.8 Flash'] },
			// VERIFY: OpenAI and xAI model names.
			{ id: 'openai', label: 'OpenAI', mark: 'openai', models: ['GPT-5.5', 'GPT-5.5-Codex'] },
			{ id: 'xai', label: 'xAI', mark: 'xai', models: ['Grok Code'] },
			{ id: 'azure', label: 'Azure', mark: 'sparkle', models: [] },
			{ id: 'openrouter', label: 'OpenRouter', mark: 'sparkle', models: [] },
			{ id: 'ollama', label: 'Ollama', mark: 'sparkle', models: [] },
		],
		models: {
			ensemble: { label: 'Ensemble', desc: 'Picks a model for each request' },
			copilot: ['Ensemble', 'Claude Sonnet 5.5', 'Gemini 3.8 Flash', 'GPT-5.5'],
			cliStatus: [['Ensemble', '12% context']],
		},
		byok: { keyField: 'Anthropic API key' },
		story: { path: '~/src/api-gateway', branch: 'auth-core-v2' },

		// each model picker tab (modelPickerTabs.ts). In Codex's and Claude's pickers the built-in group is "Copilot"
		// and a ChatGPT account is "ChatGPT" (the harness docs).
		tabs: {
			copilot: { icon: 'copilot', label: 'Copilot' },
			copilotGroup: { icon: 'copilot', label: 'Copilot' },
			chatgpt: { icon: 'openai', label: 'ChatGPT' },
			anthropic: { icon: 'claude', label: 'Anthropic' },
			google: { icon: 'google-gemini', label: 'Google' },
			openai: { icon: 'openai', label: 'OpenAI' },
			xai: { icon: 'xai', label: 'xAI' },
		},
		// the model picker each harness shows, and the models of its active tab. Claude groups its models under
		// Anthropic and Copilot; Codex under Copilot and ChatGPT.
		pickers: {
			copilot: { tabs: ['copilot', 'anthropic', 'google', 'openai', 'xai'], active: 'copilot', models: ['Ensemble'] },
			// VERIFY: the ChatGPT tab's models.
			codex: { tabs: ['copilotGroup', 'chatgpt'], active: 'chatgpt', models: ['GPT-5.5-Codex', 'GPT-5.5'] },
			claude: { tabs: ['anthropic', 'copilotGroup'], active: 'anthropic', models: ['Claude Opus 5.5', 'Claude Sonnet 5.5', 'Claude Haiku 5.5'] },
		},
		// how each harness reaches its models. "Model access and harness choice are separate"; each harness decides
		// which accounts it takes.
		access: {
			copilot: [
				{ id: 'copilot', icon: 'copilot', label: 'GitHub Copilot', desc: 'Free, Pro, Business or Enterprise', short: 'Copilot plan' },
				{ id: 'key', icon: 'key', label: 'Your own API key', desc: 'Anthropic, OpenAI, Gemini, Ollama and more' },
			],
			codex: [
				{ id: 'copilot', icon: 'copilot', label: 'GitHub Copilot', desc: 'Copilot Pro+' },
				{ id: 'chatgpt', icon: 'openai', label: 'ChatGPT', desc: 'Any ChatGPT account, free included', short: 'ChatGPT account' },
			],
			claude: [
				{ id: 'copilot', icon: 'copilot', label: 'GitHub Copilot', desc: 'Billed through your Copilot plan' },
				{ id: 'key', icon: 'key', label: 'Anthropic API key', desc: 'Billed by Anthropic' },
			],
		},
	};
})();
