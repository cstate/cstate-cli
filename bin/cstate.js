#!/usr/bin/env node

import { program } from 'commander';
import createCmd from '../lib/commands/create.js';
import draftCmd from '../lib/commands/draft.js';
import devCmd from '../lib/commands/dev.js';
import * as hugo from '../lib/hugo.js';

program
	.name('cstate')
	.description('CLI to manage your cState status pages')
	.version('1.0.0');

program.command('create')
	.description('Create a new incident or informational post')
	.action(createCmd);

program.command('draft')
	.description('Create a new post from a pre-defined template')
	.action(draftCmd);

program.command('dev')
	.description('Run Hugo development server with cstate theme')
	.action(devCmd);

program.command('serve')
	.description('Alias for hugo serve')
	.allowUnknownOption()
	.action((options) => hugo.serve(options));

program.command('build')
	.description('Alias for hugo build')
	.allowUnknownOption()
	.action((options) => hugo.build(options));

// Add help message for the main command
program.on('--help', () => {
	console.log('');
	console.log('Examples:');
	console.log('  $ cstate create       # Create a new incident post');
	console.log('  $ cstate draft        # Create a new post from a template');
	console.log('  $ cstate dev          # Run dev server from /exampleSite');
	console.log('  $ cstate serve        # Run hugo serve');
	console.log('  $ cstate build        # Run hugo build');
	console.log('  $ cstate build -w     # Run hugo build with watch flag');
});

program.parse(process.argv);

// Display help if no command is specified
if (!process.argv.slice(2).length) {
	program.outputHelp();
}