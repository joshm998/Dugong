// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	site: 'https://dugong.dev',
	integrations: [
		starlight({
			title: 'Dugong',
			logo: {
				src: './src/assets/logo.svg',
				replacesTitle: true
			},
			social: {
				github: 'https://github.com/withastro/starlight',
			},
			sidebar: [
				{
					label: "Getting Started",
					slug: "getting-started"
				}
			],
			components: {
				Header: './src/components/Header.astro',
			}
		}),
	],
});
