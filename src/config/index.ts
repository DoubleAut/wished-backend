import { plainToInstance } from 'class-transformer';
import {
    IsBoolean,
    IsEnum,
    IsNumber,
    IsString,
    validateSync,
} from 'class-validator';

enum Environment {
    Development = 'development',
    Production = 'production',
    Test = 'test',
    Provision = 'provision',
}

class EnvironmentVariables {
    @IsEnum(Environment)
    NODE_ENV: Environment;

    @IsString()
    HOST: string;

    @IsNumber()
    PORT: number;

    @IsString()
    DATABASE: string;

    @IsString()
    USERNAME: string;

    @IsString()
    PASSWORD: string;

    @IsBoolean()
    SYNCHRONIZE: boolean;

    @IsNumber()
    API_PORT: number;
}

export const validate = (config: Record<string, unknown>) => {
    const validatedConfig = plainToInstance(EnvironmentVariables, config, {
        enableImplicitConversion: true,
    });

    const errors = validateSync(validatedConfig, {
        skipMissingProperties: false,
    });

    if (errors.length > 0) {
        throw new Error(errors.toString());
    }

    return validatedConfig;
};
