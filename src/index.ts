#!/usr/bin/env node

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { generateCommandModule } from './generate/generate.command';
import { handleError } from './utils';
import { validateCommandModule } from './validate/validate.command';

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
