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

function generateFrontmatter(answers, date) {
	const isInformational = answers.type === 'Informational';
	// Default resolved to false for new incidents
	const isResolved = answers.resolved === undefined ? false : answers.resolved;

	let frontmatter = `---
title: ${answers.title}
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
	if (answers.affected && answers.affected.length > 0) {
		frontmatter += `\naffected:\n  - ${answers.affected.join('\n  - ')}`;
	}
	frontmatter += `\nsection: issue\n---`;

	return frontmatter;
}

function generatePostmortemFrontmatter(answers, date) {
	let frontmatter = `---
title: ${answers.title}
date: ${date}
informational: true`;

	if (answers.affected && answers.affected.length > 0) {
		frontmatter += `\naffected:\n  - ${answers.affected.join('\n  - ')}`;
	}
	frontmatter += `\nsection: issue\n---`;

	return frontmatter;
}

export {
	formatDate,
	generateFilename,
	generateFrontmatter,
	generatePostmortemFrontmatter,
};