module.exports = {
	extends: ['@commitlint/config-conventional'],
	rules: {
		'subject-imperative': [2, 'always'],
		'body-case': [2, 'always', 'sentence-case'],
	},
	plugins: [require('./packages/plugin')],
};
