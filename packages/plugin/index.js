const exceptions = ['bring', 'embed', 'pass', 'process'];

const wrongTense = (verb) => /(ed|ing|s)$/i.test(verb) && !exceptions.includes(verb.toLowerCase());

module.exports = {
	rules: {
		'subject-imperative': ({subject}) => {
			const matches = /^((don't|do not) )?([a-z]+)/i.exec(subject);
			return [!!matches && !wrongTense(matches[3]), 'subject must be in imperative mood'];
		},
	},
};
