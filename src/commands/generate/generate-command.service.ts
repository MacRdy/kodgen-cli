import Ajv from 'ajv';
import {
	DereferenceService,
	GeneratorService,
	HookFn,
	IHook,
	LoadService,
	ParserService,
	Printer,
	generateAjvErrorMessage,
} from 'kodgen';
import { OpenAPI } from 'openapi-types';
import { Arguments } from 'yargs';
import configSchema from '../../../assets/generate-command-schema.json';
import { loadFileIfExists } from '../utils';
import { IGenerateCommandArgs, IGenerateCommandConfig } from './generate-command.model';

export class GenerateCommandService {
	private readonly generatorService = new GeneratorService();
	private readonly parserService = new ParserService();
	private readonly loadService = new LoadService();

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
		const userConfig = await loadFileIfExists<IGenerateCommandArgs>(
			'Config not found',
			argv.config,
		);

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
			baseUrl: argv.baseUrl?.trim() ?? userConfig?.baseUrl,
			silent: argv.silent ?? userConfig?.silent,
			verbose: argv.verbose ?? userConfig?.verbose,
			eol: argv.eol ?? userConfig?.eol,
		};

		const validate = new Ajv({ allErrors: true }).compile<IGenerateCommandConfig>(configSchema);

		if (!validate(config)) {
			throw new Error(generateAjvErrorMessage('Invalid command options', validate.errors));
		}

		if (config.generatorConfigFile) {
			config.generatorConfig = await loadFileIfExists(
				'Generator config not found',
				config.generatorConfigFile,
			);
		}

		return config;
	}

	async loadHooks(path?: string): Promise<IHook[]> {
		const hooks: IHook[] = [];

		const hooksObj = await loadFileIfExists<Record<string, HookFn>>(
			'Hooks file not found',
			path,
		);

		if (hooksObj) {
			for (const [name, fn] of Object.entries(hooksObj)) {
				hooks.push({ name, fn });
			}
		}

		return hooks;
	}

	private normalizePath(path?: string, configPath?: string): string | undefined {
		if (!path || !configPath) {
			return path;
		}

		return this.loadService.normalizePath(path, configPath);
	}
}
