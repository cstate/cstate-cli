import inquirer from 'inquirer';
import fs from 'fs-extra';
import path from 'path';
import moment from 'moment-timezone';
import {
	generateFilename,
	generateFrontmatter,
	generatePostmortemFrontmatter,
} from '../utils.js';
import chalk from 'chalk';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import yaml from 'js-yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function draft() {
	const templates = {
		'Incident Post': 'incident-post.md',
		'Maintenance': 'maintenance.md',
		'Experiment': 'experiment.md',
		'Postmortem': 'postmortem.md',
	};

	const questions = [
		{
			type: 'list',
			name: 'template',
			message: 'Which template do you want to use?',
			choices: Object.keys(templates),
		},
		// Only ask for the title if not using the Postmortem template
		{
			type: 'input',
			name: 'title',
			message: "What's the title of the post?",
			validate: (value) => value.length > 0 || 'Please enter a title',
			when: (answers) => answers.template !== 'Postmortem',
		},
	];

	const answers = await inquirer.prompt(questions);
	const templateFilename = templates[answers.template];
	const templatePath = path.join(__dirname, '../templates', templateFilename);
	const now = moment();
	const date = now.format('YYYY-MM-DD HH:mm:ss');

	try {
		let content = await fs.readFile(templatePath, 'utf-8');

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
				chalk.yellow('You may want to cancel this operation with Ctrl+C.\n')
			);
		}

		// Replace placeholders in the template (if any)
		content = content.replace('{{title}}', answers.title);
		content = content.replace('{{date}}', date); // Replaced in the content body

		// If it's the maintenance template, ask for the maintenance window
		if (answers.template === 'Maintenance') {
			const maintenanceQuestions = [
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
			];

			const maintenanceAnswers = await inquirer.prompt(maintenanceQuestions);
			content = content.replace(
				'{{maintenanceStart}}',
				maintenanceAnswers.maintenanceStart
			);
			content = content.replace(
				'{{maintenanceEnd}}',
				maintenanceAnswers.maintenanceEnd
			);

			// Add track shortcode to maintenance template
			content = content.replace(
				/(\*Scheduled\* - .*)/,
				`$1 {{< track "${date}" >}}`
			);
		}

		// Add track shortcode to other templates (except postmortem)
		if (
			answers.template !== 'Maintenance' &&
			answers.template !== 'Postmortem' &&
			answers.template !== 'Experiment'
		) {
			content = `${content}\n\n*Investigating* - We are investigating the issue. {{< track "${date}" >}}`;
		}

		if (answers.template === 'Postmortem') {
			const postMortemQuestions = [];
			if (!configReadError) {
				postMortemQuestions.push({
					type: 'checkbox',
					name: 'affected',
					message: 'Which systems were affected?',
					choices: componentChoices,
				});
			}

			// Ask for postmortem title separately
			answers.title = (
				await inquirer.prompt({
					type: 'input',
					name: 'title',
					message: "What's the title of the postmortem?",
					validate: (value) => value.length > 0 || 'Please enter a title',
				})
			).title;

			const postmortemAnswers = await inquirer.prompt(postMortemQuestions);
			answers.affected = postmortemAnswers.affected;

			// Generate frontmatter for postmortem
			const frontmatter = generatePostmortemFrontmatter(answers, date);
			content = content.replace('{{frontmatter}}', frontmatter);
		} else {
			answers.type =
				answers.template === 'Experiment' ? 'Informational' : 'Downtime';
			// Severity question if not postmortem
			if (answers.template === 'Incident Post') {
				const severityQuestion = {
					type: 'list',
					name: 'severity',
					message: 'What is the severity level?',
					choices: ['notice', 'disrupted', 'down'],
				};
				const severityAnswer = await inquirer.prompt(severityQuestion);
				answers.severity = severityAnswer.severity;
			}
			// Only ask for affected components if not using the Postmortem template and config.yml was read successfully
			if (!configReadError) {
				const componentQuestion = {
					type: 'checkbox',
					name: 'affected',
					message: 'Which systems are affected?',
					choices: componentChoices,
				};
				const componentAnswer = await inquirer.prompt(componentQuestion);
				answers.affected = componentAnswer.affected;
			}

			const frontmatter = generateFrontmatter(answers, date);
			content = content.replace('{{frontmatter}}', frontmatter);
		}

		// Generate filename and file path
		const filename = generateFilename(answers.title, now);
		const filePath = path.join(process.cwd(), 'content', 'issues', filename);

		// Write the file
		await fs.ensureDir(path.dirname(filePath));
		await fs.writeFile(filePath, content);

		console.log(chalk.green(`Draft created successfully at: ${filePath}`));
		console.log(chalk.yellow('Remember to commit and push your changes!'));
	} catch (err) {
		console.error(chalk.red('Error creating draft:'), err);
	}
}

export default draft;