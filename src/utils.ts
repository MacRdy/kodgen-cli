import { FileService } from 'kodgen';
import { EOL } from 'os';

export const handleError = (message: string, error: Error): never => {
	const errorMessage = message || error?.message || 'An error has occurred';

	process.stderr.write(`Error: ${errorMessage}` + EOL);

	process.exit(1);
};

export const loadFileIfExists = async <T>(
	notFoundMessage: string,
	path?: string,
): Promise<T | undefined> => {
	if (!path) {
		return undefined;
	}

	const fileService = new FileService();

	if (!fileService.exists(path)) {
		throw new Error(notFoundMessage);
	}

	return await fileService.loadFile<T>(path);
};
