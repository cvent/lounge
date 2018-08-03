module.exports = {
  title: 'Lounge',
  description: 'Simple Mongoose-inspired ODM for Couchbase',
  base: '/lounge',
  themeConfig: {
    nav: [
      {
        text: 'Guide',
        link: '/guide/'
      },
      {
        text: 'API Reference',
        link: '/api/'
      },
      { text: 'GitHub', link: 'https://github.com/bojand/lounge' }
    ],
    sidebar: {
      '/guide/': [
        {
          title: 'Guide',
          collapsable: false,
          children: [
            '',
            'modeling',
            'types',
            'middleware',
            'extend',
            'embedded',
            'docops',
            'population',
            'simple_indexes',
            'queries',
            'array_indexes',
            'embedded_indexes',
            'compound',
            'lean_queries',
            'events',
            'promises',
            'debugging'
          ]
        }
      ]
    }
  }
  // markdown: {
  //   config: md => {
  //     md.use(require('markdown-it-highlightjs'))
  //   }
  // }
}
