module.exports = {
    env: {
        browser: true,
        es2021: true,
        node: true,
    },
    extends: [
        // 'airbnb',
        'eslint:recommended',
        'plugin:react/recommended',
        'prettier',
        'prettier/react',
    ],
    parserOptions: {
        ecmaFeatures: {
            jsx: true,
        },
        ecmaVersion: 12,
        sourceType: 'module',
    },
    plugins: ['react'],
    rules: {
        camelcase: [
            'error',
            {
                properties: 'never',
                ignoreDestructuring: true,
                ignoreImports: true,
            },
        ],
        'operator-linebreak': 'off',
        'no-unused-expressions': [
            'error',
            { allowShortCircuit: true, allowTernary: true },
        ],
        'no-param-reassign': ['error', { props: false }],
        'arrow-body-style': 'off',
        'arrow-parens': 'off',
        'implicit-arrow-linebreak': 'off',
        'react/jsx-curly-newline': 'off',
        'react/forbid-prop-types': ['error', { forbid: ['array', 'object'] }],
        'no-unused-vars': 'warn',
        'linebreak-style': ['error', 'windows'],
        indent: [
            'error',
            4,
            {
                ArrayExpression: 1,
            },
        ],
        'react/jsx-indent-props': ['error', 4],
        'react/jsx-indent': ['error', 4],
    },
};
