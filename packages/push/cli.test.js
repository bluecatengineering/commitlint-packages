const check = require('.');

jest.unmock('./cli');

describe('cli', () => {
	it('invokes check with the remote argument', () => {
		const argv = process.argv;
		process.argv = ['node', 'cli.js', 'upstream'];
		try {
			jest.isolateModules(() => require('./cli'));
		} finally {
			process.argv = argv;
		}
		expect(check).toHaveBeenCalledWith('upstream');
	});
});
