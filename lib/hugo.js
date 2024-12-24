import { execa } from 'execa';
import chalk from 'chalk';

async function runHugoCommand(command, options) {
	try {
		const args = [command].concat(options._unknown || []);
		console.log(chalk.green(`Running: hugo ${args.join(' ')}`));
		const { stdout } = await execa('hugo', args, { stdio: 'inherit' });

	} catch (error) {
		console.error(chalk.red(`Error running Hugo command: ${error.message}`));
	}
}

export function serve(options) {
	return runHugoCommand('serve', options)
}
export function build(options) {
	return runHugoCommand('build', options)
}