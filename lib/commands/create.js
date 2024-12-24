import inquirer from 'inquirer';
import moment from 'moment-timezone';
import fs from 'fs-extra';
import path from 'path';
import { formatDate, generateFrontmatter, generateFilename } from '../utils.js';
import chalk from 'chalk';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import yaml from 'js-yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function create() {
	// Read config.yml to get affected components
	const configPath = path.join(process.cwd(), 'config.yml');
	let componentChoices = [];
	let configReadError = false; // Flag to indicate if config.yml was read successfully
	try {
		const config = yaml.load(await fs.readFile(configPath, 'utf-8'));
		componentChoices = config.params.systems.map((system) => system.name);
	} catch (configError) {
		configReadError = true;
		console.error(
			chalk.red.bold(
				'Error: Could not read or parse config.yml. '
			) +
			chalk.red(
				'Make sure you are in the root directory of your cState project.\n'
			) +
			chalk.yellow('Using default component choices.\n')
		);
		componentChoices = ['API', 'Website', 'Control Panel', 'Other'];
	}

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
			when: (answers) => answers.type === 'Downtime', // Only ask if it's downtime
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

	const filePath = path.join(process.cwd(), 'content', 'issues', filename);

	try {
		await fs.ensureDir(path.dirname(filePath)); // Create content directory if it doesn't exist
		await fs.writeFile(filePath, content);
		console.log(chalk.green(`Incident created successfully at: ${filePath}`));
		console.log(chalk.yellow('Remember to commit and push your changes!'));
	} catch (err) {
		console.error(chalk.red('Error creating incident:'), err);
	}
}

export default create;