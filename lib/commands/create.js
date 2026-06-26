import inquirer from 'inquirer';
import moment from 'moment-timezone';
import fs from 'fs-extra';
import path from 'path';
import {
	generateFilename,
	generateFrontmatter,
	generateRecordFrontmatter,
} from '../utils.js';
import { recordTypes, findRecordType } from '../recordTypes.js';
import chalk from 'chalk';
import yaml from 'js-yaml';

async function getComponentChoices({ allowFallback = true } = {}) {
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
			chalk.red('Make sure you are in the root directory of your cState project.\n')
		);

		return {
			choices: allowFallback ? ['API', 'Website', 'Control Panel', 'Other'] : [],
			readError: true,
		};
	}
}

function recordBody(recordType) {
	if (recordType.recordType === 'experiment') {
		return '## What is changing?\n\nDescribe the experiment and the audience included in the test.\n\n## What should people watch?\n\nList the signals that will decide whether this experiment continues.\n';
	}

	if (recordType.recordType === 'roadmap') {
		return '## Direction\n\nDescribe the planned change.\n\n## Current status\n\nDescribe what is known now.\n';
	}

	return `Write the ${recordType.label.toLowerCase()}.\n`;
}

async function createIncident(componentChoices) {
	const questions = [
		{
			type: 'input',
			name: 'title',
			message: "What's the title of the incident?",
			validate: (value) => value.length > 0 || 'Please enter a title',
		},
		{
			type: 'list',
			name: 'type',
			message: 'Is this downtime or informational?',
			choices: ['Downtime', 'Informational'],
		},
		{
			type: 'confirm',
			name: 'resolved',
			message: 'Is the issue resolved?',
			when: (answers) => answers.type === 'Downtime',
		},
		{
			type: 'input',
			name: 'resolvedWhen',
			message: 'When was the issue resolved (YYYY-MM-DD HH:mm:ss)?',
			when: (answers) => answers.resolved,
			validate: (value) => {
				return moment(value, 'YYYY-MM-DD HH:mm:ss', true).isValid() || 'Please enter a valid date and time';
			},
		},
		{
			type: 'list',
			name: 'severity',
			message: 'What is the severity level?',
			choices: ['notice', 'disrupted', 'down'],
			when: (answers) => answers.type === 'Downtime' && !answers.resolved,
		},
		{
			type: 'checkbox',
			name: 'affected',
			message: 'Which systems are affected?',
			choices: componentChoices,
			when: (answers) => answers.type === 'Downtime',
		},
	];

	const answers = await inquirer.prompt(questions);
	const now = moment();
	const date = now.format('YYYY-MM-DD HH:mm:ss');
	const filename = generateFilename(answers.title, now);
	const frontmatter = generateFrontmatter(answers, date);
	const content = `${frontmatter}\n\n*Monitoring* - ... {{< track "${date}" >}}\n\n*Investigating* - ... {{< track "${date}" >}}\n`;

	return {
		content,
		filePath: path.join(process.cwd(), 'content', 'issues', filename),
		label: 'Incident',
	};
}

async function createRecord(recordType, componentChoices) {
	const questions = [
		{
			type: 'input',
			name: 'title',
			message: `What's the title of the ${recordType.label.toLowerCase()}?`,
			validate: (value) => value.length > 0 || 'Please enter a title',
		},
		{
			type: 'list',
			name: 'state',
			message: 'What is the record state?',
			choices: ['active', 'completed', 'archived'],
			default: recordType.defaultState || 'completed',
			when: () => Boolean(recordType.defaultState),
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
	const now = moment();
	const date = now.format('YYYY-MM-DD HH:mm:ss');
	const filename = generateFilename(answers.title, now);
	const frontmatter = generateRecordFrontmatter(answers, date, recordType);

	return {
		content: `${frontmatter}\n\n${recordBody(recordType)}`,
		filePath: path.join(process.cwd(), 'content', recordType.section, filename),
		label: recordType.label,
	};
}

async function create() {
	const { choices: componentChoices } = await getComponentChoices();
	const contentChoice = await inquirer.prompt({
		type: 'list',
		name: 'kind',
		message: 'What do you want to create?',
		choices: [
			{ name: 'Incident or informational post', value: 'incident' },
			...recordTypes.map((recordType) => ({
				name: recordType.label,
				value: recordType.recordType,
			})),
		],
	});

	const result = contentChoice.kind === 'incident'
		? await createIncident(componentChoices)
		: await createRecord(findRecordType(contentChoice.kind), componentChoices);

	try {
		await fs.ensureDir(path.dirname(result.filePath));
		await fs.writeFile(result.filePath, result.content);
		console.log(chalk.green(`${result.label} created successfully at: ${result.filePath}`));
		console.log(chalk.yellow('Remember to commit and push your changes!'));
	} catch (err) {
		console.error(chalk.red(`Error creating ${result.label.toLowerCase()}:`), err);
	}
}

export default create;
