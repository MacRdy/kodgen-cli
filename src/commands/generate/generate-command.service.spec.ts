import { IHook } from 'kodgen';
import { Arguments } from 'yargs';
import { loadFileIfExists } from '../utils';
import { IGenerateCommandArgs, IGenerateCommandConfig } from './generate-command.model';
import { GenerateCommandService } from './generate-command.service';

jest.mock('../utils');

const loadFileIfExistsMock = jest.mocked(loadFileIfExists);

const correctConfig: IGenerateCommandConfig = {
	package: 'generator-package',
	generator: 'generator-name',
	generatorConfigFile: undefined,
	input: 'input',
	output: 'output',
	clean: true,
	skipValidation: true,
	includePaths: ['^/Files'],
	excludePaths: ['^/Data'],
	hooksFile: 'hooks.js',
	templateDir: 'custom-templates',
	templateDataFile: 'custom-template-data.json',
	skipTemplates: ['tpl-1'],
	insecure: true,
	baseUrl: 'baseUrl',
	silent: true,
	verbose: true,
	eol: 'LF',
} as const;

describe('generate cli command', () => {
	beforeEach(() => {
		loadFileIfExistsMock.mockReset();
	});

	it('should parse inline arguments correctly', async () => {
		const service = new GenerateCommandService();

		const args: Arguments<IGenerateCommandArgs> = {
			$0: '',
			_: [],
			package: ' generator-package',
			generator: '  generator-name ',
			input: ' input ',
			output: ' output ',
			clean: true,
			skipValidation: true,
			includePaths: ['^/Files'],
			excludePaths: ['^/Data'],
			hooksFile: ' hooks.js ',
			templateDir: ' custom-templates ',
			templateDataFile: ' custom-template-data.json ',
			skipTemplates: ['tpl-1'],
			insecure: true,
			baseUrl: 'baseUrl',
			silent: true,
			verbose: true,
			eol: 'LF',
		};

		const config = await service.getConfig(args);

		expect(config).toStrictEqual(correctConfig);
	});

	it('should parse config correctly', async () => {
		loadFileIfExistsMock.mockResolvedValueOnce(correctConfig);

		const service = new GenerateCommandService();

		const args: Arguments<Partial<IGenerateCommandArgs>> = {
			$0: '',
			_: [],
			config: 'config.json',
		};

		const config = await service.getConfig(args as Arguments<IGenerateCommandArgs>);

		expect(config).toStrictEqual(correctConfig);
	});

	it('should override config parameters', async () => {
		loadFileIfExistsMock.mockResolvedValueOnce(correctConfig);

		const service = new GenerateCommandService();

		const args: Arguments<Partial<IGenerateCommandArgs>> = {
			$0: '',
			_: [],
			config: 'config.json',
			input: 'inputOverride',
		};

		const config = await service.getConfig(args as Arguments<IGenerateCommandArgs>);

		expect(config).toStrictEqual({ ...correctConfig, input: 'inputOverride' });
	});

	it('should load generator config', async () => {
		loadFileIfExistsMock.mockResolvedValueOnce(undefined);
		loadFileIfExistsMock.mockResolvedValueOnce({ var: true });

		const service = new GenerateCommandService();

		const args: Arguments<IGenerateCommandArgs> = {
			$0: '',
			_: [],
			package: 'package',
			generator: 'generator',
			generatorConfigFile: 'generatorConfigFile',
			input: 'input',
			output: 'output',
		};

		const config = await service.getConfig(args);

		expect<IGenerateCommandConfig>(config).toStrictEqual({
			package: 'package',
			generator: 'generator',
			generatorConfigFile: 'generatorConfigFile',
			generatorConfig: { var: true },
			input: 'input',
			output: 'output',
			clean: undefined,
			includePaths: undefined,
			excludePaths: undefined,
			hooksFile: undefined,
			insecure: undefined,
			skipTemplates: undefined,
			skipValidation: undefined,
			templateDataFile: undefined,
			templateDir: undefined,
			silent: undefined,
			verbose: undefined,
			eol: undefined,
		});
	});

	describe('loadHooks', () => {
		const service = new GenerateCommandService();

		beforeEach(() => {
			loadFileIfExistsMock.mockReset();
		});

		it('should return empty array with no file', async () => {
			await expect(service.loadHooks()).resolves.toStrictEqual([]);

			expect(loadFileIfExists).toBeCalledWith('Hooks file not found', undefined);
		});

		it('should load hooks file', async () => {
			const mockFileData = { foo: () => 'bar' };

			loadFileIfExistsMock.mockResolvedValueOnce(mockFileData);

			const expected: IHook[] = [
				{
					name: 'foo',
					fn: mockFileData.foo,
				},
			];

			await expect(service.loadHooks('path')).resolves.toStrictEqual(expected);

			expect(loadFileIfExists).toBeCalledWith('Hooks file not found', 'path');
		});
	});
});
