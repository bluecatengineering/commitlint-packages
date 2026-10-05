const {readFileSync} = require('fs');
const {spawnSync} = require('child_process');

const check = require('.');

jest.mock('fs');
jest.mock('child_process');
jest.unmock('.');

const z40 = '0'.repeat(40);
const z64 = '0'.repeat(64);

const ok = (stdout = '') => ({status: 0, stdout, stderr: ''});
const fail = (stderr = '') => ({status: 1, stdout: '', stderr});

const mockGit = ({symbolic = ok('origin/main\n'), show = ok('  HEAD branch: main\n'), revList = ok()} = {}) =>
	spawnSync.mockImplementation((cmd, args) => {
		expect(cmd).toBe('git');
		switch (args[0]) {
			case 'symbolic-ref':
				return symbolic;
			case 'remote':
				return show;
			case 'rev-list':
				return typeof revList === 'function' ? revList(args) : revList;
			default:
				throw new Error(`Unexpected ${args}`);
		}
	});

describe('check', () => {
	let exit;
	let write;

	beforeEach(() => {
		exit = jest.spyOn(process, 'exit').mockImplementation(() => {});
		write = jest.spyOn(process.stderr, 'write').mockImplementation((text, cb) => cb && cb());
	});

	afterEach(() => {
		exit.mockRestore();
		write.mockRestore();
	});

	it('uses origin if no remote is specified', () => {
		mockGit();
		readFileSync.mockReturnValue('');
		check();
		expect(spawnSync.mock.calls[0][1]).toEqual(['symbolic-ref', '--short', 'refs/remotes/origin/HEAD']);
	});

	it('uses the local remote HEAD to find the default branch', () => {
		mockGit({show: fail()});
		readFileSync.mockReturnValue(`refs/heads/main abc refs/heads/main def\n`);
		check('origin');
		expect(spawnSync.mock.calls.map((c) => c[1][0])).toEqual(['symbolic-ref', 'rev-list']);
		expect(spawnSync.mock.calls[1][1]).toEqual(['rev-list', '--merges', 'def..abc']);
		expect(spawnSync.mock.calls[0][2].env.LC_ALL).toBe('C');
	});

	it('falls back to remote show if symbolic-ref fails', () => {
		mockGit({symbolic: fail()});
		readFileSync.mockReturnValue(`refs/heads/main abc refs/heads/main def\n`);
		check('origin');
		expect(spawnSync.mock.calls[2][1]).toEqual(['rev-list', '--merges', 'def..abc']);
		expect(write).not.toHaveBeenCalled();
		expect(exit).toHaveBeenCalledWith(0);
	});

	it('falls back to remote show if symbolic-ref output is unexpected', () => {
		mockGit({symbolic: ok('garbage\n')});
		readFileSync.mockReturnValue(`refs/heads/main abc refs/heads/main def\n`);
		check('origin');
		expect(spawnSync.mock.calls[1][1]).toEqual(['remote', 'show', 'origin']);
		expect(exit).toHaveBeenCalledWith(0);
	});

	it('assumes master with a warning if the default branch cannot be determined', () => {
		mockGit({symbolic: fail(), show: fail()});
		readFileSync.mockReturnValue(`refs/heads/master abc refs/heads/master def\n`);
		check('origin');
		expect(write).toHaveBeenCalledWith('Unable to determine the default branch of origin, assuming master\n');
		expect(spawnSync.mock.calls[2][1]).toEqual(['rev-list', '--merges', 'def..abc']);
	});

	it('assumes master if remote show has no HEAD branch', () => {
		mockGit({symbolic: fail(), show: ok('nothing\n')});
		readFileSync.mockReturnValue('');
		check('origin');
		expect(write).toHaveBeenCalled();
	});

	it('exits with 0 if there is no input', () => {
		mockGit();
		readFileSync.mockReturnValue('');
		check('origin');
		expect(exit).toHaveBeenCalledWith(0);
	});

	it('ignores malformed lines', () => {
		mockGit();
		readFileSync.mockReturnValue('garbage\n\n');
		check('origin');
		expect(exit).toHaveBeenCalledWith(0);
	});

	it('ignores refs which are not the default branch', () => {
		mockGit();
		readFileSync.mockReturnValue(
			'refs/heads/a abc refs/heads/feature/main def\nrefs/tags/main abc refs/tags/main def\nrefs/heads/a abc refs/heads/other def\n'
		);
		check('origin');
		expect(spawnSync.mock.calls.some((c) => c[1][0] === 'rev-list')).toBe(false);
		expect(exit).toHaveBeenCalledWith(0);
	});

	it('ignores deletion of the default branch', () => {
		mockGit();
		readFileSync.mockReturnValue(`(delete) ${z40} refs/heads/main def\n(delete) ${z64} refs/heads/main def\n`);
		check('origin');
		expect(spawnSync.mock.calls.some((c) => c[1][0] === 'rev-list')).toBe(false);
		expect(exit).toHaveBeenCalledWith(0);
	});

	it('checks the whole local history if the remote branch does not exist', () => {
		mockGit();
		readFileSync.mockReturnValue(`refs/heads/main abc refs/heads/main ${z40}\n`);
		check('origin');
		expect(spawnSync.mock.calls[1][1]).toEqual(['rev-list', '--merges', 'abc']);
	});

	it('supports sha-256 zero ids', () => {
		mockGit();
		readFileSync.mockReturnValue(`refs/heads/main abc refs/heads/main ${z64}\n`);
		check('origin');
		expect(spawnSync.mock.calls[1][1]).toEqual(['rev-list', '--merges', 'abc']);
	});

	it('rejects the push if there are merges', () => {
		mockGit({revList: ok('abc\n')});
		readFileSync.mockReturnValue('refs/heads/main abc refs/heads/main def\n');
		check('origin');
		expect(write).toHaveBeenCalledWith(
			'Commit refs/heads/main contains merges\n\nFound 1 problem, rejecting push\n',
			expect.any(Function)
		);
		expect(exit).toHaveBeenCalledWith(1);
	});

	it('pluralizes the problem count', () => {
		mockGit({revList: ok('abc\n')});
		readFileSync.mockReturnValue('refs/heads/a abc refs/heads/main def\nrefs/heads/b ghi refs/heads/main def\n');
		check('origin');
		expect(write).toHaveBeenCalledWith(
			'Commit refs/heads/a contains merges\nCommit refs/heads/b contains merges\n\nFound 2 problems, rejecting push\n',
			expect.any(Function)
		);
	});

	it('rejects the push if rev-list fails', () => {
		mockGit({revList: fail('fatal: bad object def\n')});
		readFileSync.mockReturnValue('refs/heads/main abc refs/heads/main def\n');
		check('origin');
		expect(write).toHaveBeenCalledWith(
			'Unable to check commit refs/heads/main: fatal: bad object def\n\nFound 1 problem, rejecting push\n',
			expect.any(Function)
		);
		expect(exit).toHaveBeenCalledWith(1);
	});
});
