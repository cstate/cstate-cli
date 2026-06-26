import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { recordTypes } from '../lib/recordTypes.js';
import { generateRecordFrontmatter, generateFrontmatter } from '../lib/utils.js';

const expectedSections = [
	'experiments',
	'release-notes',
	'changelog',
	'roadmap',
	'evals',
	'agent-runs',
	'decisions',
	'research',
];

assert.deepEqual(recordTypes.map((recordType) => recordType.section), expectedSections);

for (const recordType of recordTypes) {
	const templatePath = path.join('lib', 'templates', recordType.template);
	assert.equal(fs.existsSync(templatePath), true, `${templatePath} is missing`);
	const template = fs.readFileSync(templatePath, 'utf-8');
	assert.match(template, /{{frontmatter}}/, `${templatePath} must use generated frontmatter`);

	const frontmatter = generateRecordFrontmatter(
		{
			title: `${recordType.label} title`,
			affected: ['API'],
		},
		'2026-05-09 09:00:00',
		recordType
	);
	assert.match(frontmatter, new RegExp(`recordType: ${recordType.recordType}`));
	assert.doesNotMatch(frontmatter, /section: issue/);
	assert.doesNotMatch(frontmatter, /resolved:/);
	assert.match(frontmatter, /affected:\n  - "API"/);
}

const incidentFrontmatter = generateFrontmatter(
	{
		title: 'API DNS resolution error',
		type: 'Downtime',
		severity: 'down',
		affected: ['API'],
	},
	'2026-05-09 09:00:00'
);
assert.match(incidentFrontmatter, /section: issue/);
assert.match(incidentFrontmatter, /resolved: false/);
assert.match(incidentFrontmatter, /severity: down/);

console.log('cstate-cli v7 template verification passed.');
