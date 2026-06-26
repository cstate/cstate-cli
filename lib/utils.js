import moment from 'moment-timezone';
import slugify from 'slugify';

function formatDate(date) {
	return moment(date).tz('UTC').format('YYYY-MM-DD HH:mm:ss');
}

function generateFilename(title, date) {
	const formattedDate = moment(date).format('YYYY_MM_DD');
	const slugifiedTitle = slugify(title, { lower: true, strict: true });
	return `${formattedDate}_${slugifiedTitle}.md`;
}

function formatYamlString(value) {
	return JSON.stringify(value || '');
}

function formatYamlList(values) {
	if (!values || values.length === 0) {
		return '';
	}

	return `\naffected:\n${values.map((value) => `  - ${formatYamlString(value)}`).join('\n')}`;
}

function generateFrontmatter(answers, date) {
	const isInformational = answers.type === 'Informational';
	// Default resolved to false for new incidents
	const isResolved = answers.resolved === undefined ? false : answers.resolved;

	let frontmatter = `---
title: ${formatYamlString(answers.title)}
date: ${date}
resolved: ${isResolved}`;

	if (isInformational) {
		frontmatter += `\ninformational: true`;
	}
	if (answers.template === 'Experiment') {
		frontmatter += `\nexperiment: true`;
	}
	if (!isInformational && answers.severity) {
		frontmatter += `\nseverity: ${answers.severity}`;
	}
	frontmatter += formatYamlList(answers.affected);
	frontmatter += `\nsection: issue\n---`;

	return frontmatter;
}

function generatePostmortemFrontmatter(answers, date) {
	let frontmatter = `---
title: ${formatYamlString(answers.title)}
date: ${date}
informational: true`;

	frontmatter += formatYamlList(answers.affected);
	frontmatter += `\nsection: issue\n---`;

	return frontmatter;
}

function generateRecordFrontmatter(answers, date, recordType) {
	let frontmatter = `---
title: ${formatYamlString(answers.title)}
date: ${date}
recordType: ${recordType.recordType}`;

	const state = answers.state || recordType.defaultState;
	if (state) {
		frontmatter += `\nstate: ${state}`;
	}

	frontmatter += formatYamlList(answers.affected);
	frontmatter += '\n---';

	return frontmatter;
}

export {
	formatDate,
	generateFilename,
	generateFrontmatter,
	generatePostmortemFrontmatter,
	generateRecordFrontmatter,
};
