export interface IValidateCommandArgs {
	config?: string;
	input?: string;
	insecure?: boolean;
	silent?: boolean;
}

export interface IValidateCommandConfig {
	readonly input: string;
	readonly insecure?: boolean;
	readonly silent?: boolean;
}
