/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'CS3227 MP4',
  tagline: 'Programming assignments with browser-based practice',
  url: 'https://cs3227-2610-mp4-codeleet.github.io',
  baseUrl: '/CS3227-2610-MP4/',
  organizationName: 'CS3227-2610-MP4-CodeLeet',
  projectName: 'CS3227-2610-MP4',
  trailingSlash: false,
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
          sidebarPath: './sidebars.js',
          editUrl:
            'https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/tree/develop/website/',
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
      title: 'CS3227 MP4',
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'Project status',
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
          title: 'Project',
          items: [
            {
              label: 'Repository',
              href: 'https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4',
            },
            {
              label: 'Development guide',
              href: 'https://github.com/CS3227-2610-MP4-CodeLeet/CS3227-2610-MP4/blob/develop/docs/DeveloperGuide.md',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} CS3227 MP4 contributors.`,
    },
  },
};

module.exports = config;
