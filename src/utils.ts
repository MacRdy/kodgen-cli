import { FileService, HookFn, IHook } from 'kodgen';

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
