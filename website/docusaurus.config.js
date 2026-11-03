/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'CodeLeet',
  tagline: 'Programming assignments with browser-based practice',
  url: 'https://cs3227-2610-mp4-codeleet.github.io',
  baseUrl: '/CS3227-2610-MP4/',
  organizationName: 'CS3227-2610-MP4-CodeLeet',
  projectName: 'CS3227-2610-MP4',
  trailingSlash: true,
  onBrokenLinks: 'throw',
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'throw',
    },
  },
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },
  presets: [
    [
      'classic',
      {
        docs: {
          routeBasePath: '/',
          sidebarPath: './sidebars.js',
          editUrl: ({ docPath }) => {
            const directory = ['UserGuide.md', 'DeveloperGuide.md'].includes(
              docPath,
            )
              ? 'docs'
              : 'website/docs';
            return `https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/edit/develop/${directory}/${docPath}`;
          },
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      },
    ],
  ],
  themeConfig: {
    navbar: {
      title: 'CodeLeet',
      items: [
        {
          to: '/docs/UserGuide/',
          position: 'left',
          label: 'User Guide',
        },
        {
          to: '/docs/DeveloperGuide/',
          label: 'Developer Guide',
          position: 'left',
        },
        {
          href: 'https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Documentation',
          items: [
            { label: 'User Guide', to: '/docs/UserGuide/' },
            { label: 'Developer Guide', to: '/docs/DeveloperGuide/' },
          ],
        },
        {
          title: 'Project',
          items: [
            {
              label: 'Repository',
              href: 'https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4',
            },
            {
              label: 'Reflections',
              href: 'https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/blob/develop/docs/Reflections.md',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} CS3227 MP4 contributors.`,
    },
  },
};

module.exports = config;
