const {readFileSync} = require('fs');
const {spawnSync} = require('child_process');

const isZero = (sha) => /^0+$/.test(sha);

const git = (args) => spawnSync('git', args, {encoding: 'utf8', env: {...process.env, LC_ALL: 'C'}});

const getHeadBranch = (remote) => {
	const symbolic = git(['symbolic-ref', '--short', `refs/remotes/${remote}/HEAD`]);
	if (symbolic.status === 0) {
		const match = /^[^/]+\/(.+)$/.exec(symbolic.stdout.trim());
		if (match) return match[1];
	}
	const show = git(['remote', 'show', remote]);
	const match = show.status === 0 && /HEAD branch: (.+)/.exec(show.stdout);
	if (match) return match[1];
	process.stderr.write(`Unable to determine the default branch of ${remote}, assuming master\n`);
	return 'master';
};

const checkMerges = (range, localRef) => {
	const {status, stdout, stderr} = git(['rev-list', '--merges', range]);
	if (status !== 0) return `Unable to check commit ${localRef}: ${stderr.trim()}`;
	return stdout ? `Commit ${localRef} contains merges` : null;
};

module.exports = (remote = 'origin') => {
	const headRef = `refs/heads/${getHeadBranch(remote)}`;
	const errors = readFileSync(0, 'utf8')
		.split('\n')
		.map((line) => {
			const result = /(\S+) (\S+) (\S+) (\S+)/.exec(line);
			if (!result) return null;
			const [, localRef, localSha, remoteRef, remoteSha] = result;
			if (remoteRef === headRef && !isZero(localSha)) {
				const range = isZero(remoteSha) ? localSha : `${remoteSha}..${localSha}`;
				return checkMerges(range, localRef);
			}
			return null;
		})
		.filter(Boolean);

	const count = errors.length;
	if (count) {
		process.stderr.write(
			`${errors.join('\n')}\n\nFound ${count} ${count === 1 ? 'problem' : 'problems'}, rejecting push\n`,
			() => process.exit(1)
		);
	} else {
		process.exit(0);
	}
};
