import { Printer, PrinterLevel } from 'kodgen';
import { Arguments, CommandBuilder, CommandModule } from 'yargs';
import { printLogo } from '../utils';
import { IValidateCommandArgs } from './validate-command.model';
import { ValidateCommandService } from './validate-command.service';

const validateCommandBuilder: CommandBuilder<Record<string, never>, IValidateCommandArgs> = yargs =>
	yargs
		.option('config', {
			type: 'string',
			description: 'Config file',
		})
		.option('input', {
			alias: 'i',
			type: 'string',
			description: 'Input spec',
		})
		.option('insecure', {
			type: 'boolean',
			description: 'Insecure HTTPS connection',
		})
		.version(false)
		.strict();

const validateCommandHandler = async (argv: Arguments<IValidateCommandArgs>): Promise<void> => {
	const commandService = new ValidateCommandService();

	const config = await commandService.getConfig(argv);

	if (config.silent) {
		Printer.setLevel(PrinterLevel.Silent);
	} else {
		printLogo();
	}

	await commandService.start(config);

	process.exit(0);
};

export const validateCommandModule: CommandModule<Record<string, never>, IValidateCommandArgs> = {
	command: 'validate',
	describe: 'Run spec validation process only',
	builder: validateCommandBuilder,
	handler: validateCommandHandler,
};
