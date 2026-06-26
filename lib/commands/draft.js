import inquirer from 'inquirer';
import fs from 'fs-extra';
import path from 'path';
import moment from 'moment-timezone';
import {
	generateFilename,
	generateFrontmatter,
	generatePostmortemFrontmatter,
	generateRecordFrontmatter,
} from '../utils.js';
import { recordTypes, findRecordType } from '../recordTypes.js';
import chalk from 'chalk';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import yaml from 'js-yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function readComponentChoices() {
	const configPath = path.join(process.cwd(), 'config.yml');
	try {
		const config = yaml.load(await fs.readFile(configPath, 'utf-8'));
		return {
			choices: (config.params?.systems || []).map((system) => system.name),
			readError: false,
		};
	} catch (configError) {
		console.error(
			chalk.red.bold('Error: Could not read or parse config.yml. ') +
			chalk.red('Make sure you are in the root directory of your cState project.\n') +
			chalk.yellow('You may want to cancel this operation with Ctrl+C.\n')
		);

		return { choices: [], readError: true };
	}
}

function fillTemplate(content, values) {
	return Object.entries(values).reduce((filled, [key, value]) => {
		return filled.replace(new RegExp(`{{${key}}}`, 'g'), value || '');
	}, content);
}

async function buildRecordDraft(recordType, title, date, componentChoices) {
	const questions = [
		{
			type: 'list',
			name: 'state',
			message: 'What is the record state?',
			choices: ['active', 'completed', 'archived'],
			default: recordType.defaultState || 'completed',
			when: () => Boolean(recordType.defaultState),
		},
		{
			type: 'list',
			name: 'severity',
			message: 'Should this experiment appear beside affected components?',
			choices: [
				{ name: 'No, keep it informational', value: 'none' },
				{ name: 'Yes, show it as a notice', value: 'notice' },
			],
			default: recordType.severityDefault || 'none',
			when: () => recordType.recordType === 'experiment',
		},
		{
			type: 'confirm',
			name: 'pin',
			message: 'Pin this experiment on the homepage announcement band?',
			default: recordType.pinDefault || false,
			when: () => recordType.recordType === 'experiment',
		},
		{
			type: 'input',
			name: 'summary',
			message: 'Short experiment summary for status surfaces (optional):',
			when: () => recordType.recordType === 'experiment',
		},
		{
			type: 'checkbox',
			name: 'affected',
			message: 'Which systems does this record relate to?',
			choices: componentChoices,
			when: () => componentChoices.length > 0,
		},
	];
	const answers = await inquirer.prompt(questions);
	answers.title = title;

	const templatePath = path.join(__dirname, '../templates', recordType.template);
	const templateContent = await fs.readFile(templatePath, 'utf-8');
	const frontmatter = generateRecordFrontmatter(answers, date, recordType);

	return {
		content: fillTemplate(templateContent, { frontmatter, title, date }),
		section: recordType.section,
		label: recordType.label,
	};
}

async function buildLegacyDraft(template, title, date, componentChoices, configReadError) {
	const templatePath = path.join(__dirname, '../templates', template.filename);
	let content = await fs.readFile(templatePath, 'utf-8');
	content = fillTemplate(content, { title, date });

	if (template.name === 'Maintenance') {
		const maintenanceAnswers = await inquirer.prompt([
			{
				type: 'input',
				name: 'maintenanceStart',
				message: 'When will the maintenance start (YYYY-MM-DD HH:mm:ss)?',
				validate: (value) =>
					moment(value, 'YYYY-MM-DD HH:mm:ss', true).isValid() ||
					'Please enter a valid date and time',
			},
			{
				type: 'input',
				name: 'maintenanceEnd',
				message: 'When will the maintenance end (YYYY-MM-DD HH:mm:ss)?',
				validate: (value) =>
					moment(value, 'YYYY-MM-DD HH:mm:ss', true).isValid() ||
					'Please enter a valid date and time',
			},
		]);
		content = fillTemplate(content, maintenanceAnswers);
		content = content.replace(
			/(\*Scheduled\* - .*)/,
			`$1 {{< track "${date}" >}}`
		);
	}

	if (template.name === 'Postmortem') {
		const postMortemQuestions = [];
		if (!configReadError) {
			postMortemQuestions.push({
				type: 'checkbox',
				name: 'affected',
				message: 'Which systems were affected?',
				choices: componentChoices,
			});
		}

		const postmortemAnswers = await inquirer.prompt(postMortemQuestions);
		postmortemAnswers.title = title;
		const frontmatter = generatePostmortemFrontmatter(postmortemAnswers, date);
		content = fillTemplate(content, { frontmatter });
	} else {
		const answers = {
			title,
			type: template.name === 'Maintenance' ? 'Informational' : 'Downtime',
		};

		if (template.name === 'Incident Post') {
			const severityAnswer = await inquirer.prompt({
				type: 'list',
				name: 'severity',
				message: 'What is the severity level?',
				choices: ['notice', 'disrupted', 'down'],
			});
			answers.severity = severityAnswer.severity;
		}

		if (!configReadError) {
			const componentAnswer = await inquirer.prompt({
				type: 'checkbox',
				name: 'affected',
				message: 'Which systems are affected?',
				choices: componentChoices,
			});
			answers.affected = componentAnswer.affected;
		}

		const frontmatter = generateFrontmatter(answers, date);
		content = fillTemplate(content, { frontmatter });

		if (template.name === 'Incident Post') {
			content = `${content}\n\n*Investigating* - We are investigating the issue. {{< track "${date}" >}}`;
		}
	}

	return {
		content,
		section: 'issues',
		label: template.name,
	};
}

async function draft() {
	const legacyTemplates = [
		{ name: 'Incident Post', filename: 'incident-post.md' },
		{ name: 'Maintenance', filename: 'maintenance.md' },
		{ name: 'Postmortem', filename: 'postmortem.md' },
	];
	const templateChoices = [
		...legacyTemplates.map((template) => template.name),
		...recordTypes.map((recordType) => recordType.templateName),
	];

	const answers = await inquirer.prompt([
		{
			type: 'list',
			name: 'template',
			message: 'Which template do you want to use?',
			choices: templateChoices,
		},
		{
			type: 'input',
			name: 'title',
			message: "What's the title of the post?",
			validate: (value) => value.length > 0 || 'Please enter a title',
		},
	]);

	const now = moment();
	const date = now.format('YYYY-MM-DD HH:mm:ss');
	const { choices: componentChoices, readError: configReadError } = await readComponentChoices();
	const recordType = findRecordType(answers.template);
	const draftData = recordType
		? await buildRecordDraft(recordType, answers.title, date, componentChoices)
		: await buildLegacyDraft(
			legacyTemplates.find((template) => template.name === answers.template),
			answers.title,
			date,
			componentChoices,
			configReadError
		);

	const filename = generateFilename(answers.title, now);
	const filePath = path.join(process.cwd(), 'content', draftData.section, filename);

	try {
		await fs.ensureDir(path.dirname(filePath));
		await fs.writeFile(filePath, draftData.content);
		console.log(chalk.green(`${draftData.label} draft created successfully at: ${filePath}`));
		console.log(chalk.yellow('Remember to commit and push your changes!'));
	} catch (err) {
		console.error(chalk.red('Error creating draft:'), err);
	}
}

export default draft;
