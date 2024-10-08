import { FileService } from 'kodgen';
import { EOL } from 'os';

export const handleError = (message: string, error: Error): never => {
	const errorMessage = message || error?.message || 'An error has occurred';

	const errorColor = '\x1b[31m';
	const resetColor = '\x1b[0m';

	process.stderr.write(errorColor + `Error: ${errorMessage}` + resetColor + EOL);

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

export const printLogo = () => {
	const logo =
		`██╗  ██╗ ██████╗ ██████╗  ██████╗ ███████╗███╗   ██╗${EOL}` +
		`██║ ██╔╝██╔═══██╗██╔══██╗██╔════╝ ██╔════╝████╗  ██║${EOL}` +
		`█████╔╝ ██║   ██║██║  ██║██║  ███╗█████╗  ██╔██╗ ██║${EOL}` +
		`██╔═██╗ ██║   ██║██║  ██║██║   ██║██╔══╝  ██║╚██╗██║${EOL}` +
		`██║  ██╗╚██████╔╝██████╔╝╚██████╔╝███████╗██║ ╚████║${EOL}` +
		`╚═╝  ╚═╝ ╚═════╝ ╚═════╝  ╚═════╝ ╚══════╝╚═╝  ╚═══╝`;

	process.stdout.write(logo);

	process.stdout.write(EOL);
	process.stdout.write(EOL);
};
