import Ajv from 'ajv';
import {
	DereferenceService,
	GeneratorService,
	LoadService,
	ParserService,
	Printer,
	generateAjvErrorMessage,
} from 'kodgen';
import { OpenAPI } from 'openapi-types';
import { Arguments } from 'yargs';
import configSchema from '../../assets/generate-command-schema.json';
import { loadFile } from '../utils';
import { IGenerateCommandArgs, IGenerateCommandConfig } from './generate-command.model';

export class GenerateCommandService {
	private readonly generatorService = new GeneratorService();
	private readonly parserService = new ParserService();

	async start(config: IGenerateCommandConfig): Promise<void> {
		Printer.info('Started.');

		Printer.info('OpenAPI definition loading...');

		const loadService = new LoadService(config);
		const dereferenceService = new DereferenceService(loadService);

		const spec = await loadService.load<OpenAPI.Document>(config.input);

		const parser = this.parserService.get(spec);

		if (!parser) {
			throw new Error('Unsupported OpenAPI version');
		}

		if (!config.skipValidation) {
			Printer.info('Validation...');

			parser.validate(spec);
		}

		Printer.info('Parsing...');

		await dereferenceService.dereference(spec, config.input);

		const document = parser.parse(spec, config);

		const generator = this.generatorService.get(config.package, config.generator);

		Printer.info('Transformation...');

		const generatorConfig = generator.prepareConfig?.(config.generatorConfig);

		const files = generator.generate(document, generatorConfig);

		Printer.info('File generation...');

		await this.generatorService.build(generator.getTemplateDir(), files, config);

		Printer.info('Success.');
	}

	// eslint-disable-next-line sonarjs/cognitive-complexity
	async getConfig(argv: Arguments<IGenerateCommandArgs>): Promise<IGenerateCommandConfig> {
		const userConfig = await loadFile<IGenerateCommandArgs>(argv.config, 'Config not found');

		const config: IGenerateCommandArgs = {
			input: argv.input?.trim() ?? this.normalizePath(userConfig?.input, argv.config),
			insecure: argv.insecure ?? userConfig?.insecure,
			package: argv.package?.trim() ?? userConfig?.package,
			generator: argv.generator?.trim() ?? userConfig?.generator,
			generatorConfigFile:
				argv.generatorConfigFile?.trim() ??
				this.normalizePath(userConfig?.generatorConfigFile, argv.config),
			output: argv.output?.trim() ?? this.normalizePath(userConfig?.output, argv.config),
			clean: argv.clean ?? userConfig?.clean,
			skipValidation: argv.skipValidation ?? userConfig?.skipValidation,
			templateDir:
				argv.templateDir?.trim() ??
				this.normalizePath(userConfig?.templateDir, argv.config),
			templateDataFile:
				argv.templateDataFile?.trim() ??
				this.normalizePath(userConfig?.templateDataFile, argv.config),
			skipTemplates: argv.skipTemplates ?? userConfig?.skipTemplates,
			includePaths: argv.includePaths ?? userConfig?.includePaths,
			excludePaths: argv.excludePaths ?? userConfig?.excludePaths,
			hooksFile:
				argv.hooksFile?.trim() ?? this.normalizePath(userConfig?.hooksFile, argv.config),
			verbose: argv.verbose ?? userConfig?.verbose,
			eol: argv.eol ?? userConfig?.eol,
		};

		const validate = new Ajv({ allErrors: true }).compile<IGenerateCommandConfig>(configSchema);

		if (!validate(config)) {
			throw new Error(
				generateAjvErrorMessage('Invalid command configuration', validate.errors),
			);
		}

		if (config.generatorConfigFile) {
			config.generatorConfig = await loadFile(
				config.generatorConfigFile,
				'Generator config not found',
			);
		}

		return config;
	}

	private normalizePath(path?: string, configPath?: string): string | undefined {
		if (!path) {
			return undefined;
		}

		const loadService = new LoadService();

		return loadService.normalizePath(path, configPath);
	}
}
