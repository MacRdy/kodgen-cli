#!/usr/bin/env node

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { generateCommandModule } from './commands/generate/generate.command';
import { handleError } from './commands/utils';
import { validateCommandModule } from './commands/validate/validate.command';

void yargs(hideBin(process.argv))
	.scriptName('kodgen')
	.command(generateCommandModule)
	.command(validateCommandModule)
	.command(
		'$0',
		'Kodgen CLI usage',
		() => undefined,
		() => {
			yargs.showHelp();
		},
	)
	.strict()
	.alias({ h: 'help' })
	.showHelpOnFail(false)
	.locale('en-US')
	.fail(handleError).argv;
