import type { AstroConfig, AstroIntegration } from 'astro';
import createEmbedPlugin, { componentNames } from './remark-plugin';
import AutoImport from 'astro-auto-import';
const importNamespace = 'AuToImPoRtEdAstroEmbed';

/**
 * Astro embed MDX integration.
 */
async function files() {
	const PAGES = await import.meta.glob('/demo/src/pages/*.{md,mdx}', { as: 'raw', eager: true });

	Object.keys(PAGES).forEach(async (key) => {
		const module = await PAGES[key];

		const has1 = /import {[^}]+} from 'astro-embed';/.test(module || "");
		const has2 = /import \* as Component from 'astro-embed';/.test(module || "");
		if (has1 || has2) {
			console.log(`${key} contains`);

		}
	});

}


export default function embed() {
	const AstroEmbed: AstroIntegration = {
		name: 'astro-embed',
		hooks: {
			'astro:config:setup': async ({ config, updateConfig }) => {
				files();
				checkIntegrationsOrder(config);
				updateConfig({
					markdown: {
						// TODO: make plugin configurable with options passed to integration
						// - support disabling specific services
						// - support customising props for each service
						remarkPlugins: [createEmbedPlugin({ importNamespace })],
					},
				});
			},
		},
	};

	return [
		// Inject component imports.
		AutoImport({
			imports: [
				{
					'astro-embed': componentNames.map((name) => [
						name,
						`${importNamespace}_${name}`,
					]),
				},
			],
		}),
		AstroEmbed,
	];
}

function checkIntegrationsOrder({ integrations }: AstroConfig) {
	const indexOf = (name: string) =>
		integrations.findIndex((i) => i.name === name);
	const mdxIndex = indexOf('@astrojs/mdx');
	const embedIndex = indexOf('astro-embed');

	if (mdxIndex > -1 && mdxIndex < embedIndex) {
		throw new Error(
			'MDX integration configured before astro-embed.\n' +
			'Please move `mdx()` after `embeds()` in the `integrations` array in astro.config.mjs.'
		);
	}
}
