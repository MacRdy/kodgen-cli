import { FileService, HookFn, IHook } from 'kodgen';
import { EOL } from 'os';

export const handleError = (message: string, error: Error): never => {
	const errorMessage = message || error?.message || 'An error has occurred';

	process.stderr.write(`Error: ${errorMessage}` + EOL);

	process.exit(1);
};

export const loadFile = async <T>(
	path?: string,
	notFoundMessage?: string,
): Promise<T | undefined> => {
	if (!path) {
		return undefined;
	}

	const fileService = new FileService();

	const configPath = path.trim();

	if (configPath && !fileService.exists(configPath)) {
		throw new Error(notFoundMessage);
	}

	return await fileService.loadFile<T>(configPath);
};

export const loadHooksFile = async (path?: string): Promise<IHook[]> => {
	const hooks: IHook[] = [];

	const hooksObj = await loadFile<Record<string, HookFn>>(path, 'Hooks file not found');

	if (hooksObj) {
		for (const [name, fn] of Object.entries(hooksObj)) {
			hooks.push({ name, fn });
		}
	}

	return hooks;
};
