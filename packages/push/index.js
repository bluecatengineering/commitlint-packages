const {readFileSync} = require('fs');
const {spawnSync} = require('child_process');

const z40 = '0000000000000000000000000000000000000000';

const getHeadBranch = (remote) => {
	const {stdout} = spawnSync('git', ['remote', 'show', remote], {encoding: 'utf8'});
	const match = /HEAD branch: (.+)/.exec(stdout);
	return match ? match[1] : 'master';
};

const checkMerges = (range, localRef) => {
	const {stdout} = spawnSync('git', ['rev-list', '--merges', range], {encoding: 'utf8'});
	return stdout ? `Commit ${localRef} contains merges` : null;
};

module.exports = (remote) => {
	const headSuffix = `/${getHeadBranch(remote)}`;
	const errors = readFileSync(0, 'utf8')
		.split('\n')
		.map((line) => {
			if (!line) return null;
			const result = /(\S+) (\S+) (\S+) (\S+)/.exec(line);
			const [, localRef, localSha, remoteRef, remoteSha] = result;
			if (remoteRef.endsWith(headSuffix) && localSha !== z40) {
				const range = remoteSha === z40 ? localSha : `${remoteSha}..${localSha}`;
				return checkMerges(range, localRef);
			}
			return null;
		})
		.filter(Boolean);

	if (errors.length) {
		process.stderr.write(`${errors.join('\n')}\n\nFound ${errors.length} problems, rejecting push\n`, () =>
			process.exit(1)
		);
	} else {
		process.exit(0);
	}
};
