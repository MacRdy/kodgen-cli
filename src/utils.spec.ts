import { FileService } from 'kodgen';
import { loadFileIfExists } from './utils';

jest.mock('kodgen');

const fileServiceGlobalMock = jest.mocked(FileService);

describe('utils', () => {
	describe('loadFileIfExists', () => {
		it('should load user config', async () => {
			await expect(loadFileIfExists('Config not found', 'path')).rejects.toThrow(
				'Config not found',
			);

			fileServiceGlobalMock.prototype.exists.mockReturnValueOnce(true);
			fileServiceGlobalMock.prototype.loadFile.mockResolvedValueOnce({ test: true });

			await expect(loadFileIfExists('', 'path')).resolves.toStrictEqual({ test: true });

			const fileService = jest.mocked(fileServiceGlobalMock.mock.instances[1]);

			expect(fileService?.exists).toBeCalledWith('path');
			expect(fileService?.loadFile).toBeCalledWith('path');
		});
	});
});
