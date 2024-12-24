import { execa } from 'execa';
import chalk from 'chalk';

async function dev() {
	try {
		const args = ['server', '--theme=cstate', '--themesDir=../..'];
		console.log(chalk.green(`Running: hugo ${args.join(' ')}`));
		await execa('hugo', args, { stdio: 'inherit' });
	} catch (error) {
		console.error(chalk.red(`Error running Hugo dev server: ${error.message}`));
	}
}

export default dev;