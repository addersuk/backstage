/*
 * Copyright 2020 The Backstage Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Config, ConfigReader } from '@backstage/config';
import { loadConfigSchema } from '@backstage/config-loader';
import {
  RubygemsIntegrationConfig,
  readRubygemsIntegrationConfig,
  readRubygemsIntegrationConfigs,
} from './config';

describe('readRubygemsIntegrationConfig', () => {
  function buildConfig(data: Partial<RubygemsIntegrationConfig>): Config {
    return new ConfigReader(data);
  }

  async function buildFrontendConfig(
    data: Partial<RubygemsIntegrationConfig>,
  ): Promise<Config> {
    const fullSchema = await loadConfigSchema({
      dependencies: ['@backstage/integration'],
    });
    const serializedSchema = fullSchema.serialize() as {
      schemas: { value: { properties?: { integrations?: object } } }[];
    };
    const schema = await loadConfigSchema({
      serialized: {
        ...serializedSchema, // only include schemas that apply to integrations
        schemas: serializedSchema.schemas.filter(
          s => s.value?.properties?.integrations,
        ),
      },
    });
    const processed = schema.process(
      [{ data: { integrations: { gitlab: [data] } }, context: 'app' }],
      { visibility: ['frontend'] },
    );
    return new ConfigReader((processed[0].data as any).integrations.gitlab[0]);
  }

  it('reads all values', () => {
    const output = readRubygemsIntegrationConfig(
      buildConfig({
        host: 'a.com',
        token: 't',
        apiBaseUrl: 'https://a.com',
        baseUrl: 'https://baseurl.for.me/rubygems',
      }),
    );

    expect(output).toEqual({
      host: 'a.com',
      token: 't',
      apiBaseUrl: 'https://a.com',
      baseUrl: 'https://baseurl.for.me/rubygems',
    });
  });

  it('inserts the defaults if missing', () => {
    const output = readRubygemsIntegrationConfig(
      buildConfig({ host: 'rubygems.org' }),
    );
    expect(output).toEqual({
      host: 'rubygems.org',
      apiBaseUrl: 'https://rubygems.org/api/v1',
      baseUrl: 'https://rubygems.org',
    });
  });

  it('injects the correct GitLab API base URL when missing', () => {
    const output = readRubygemsIntegrationConfig(
      buildConfig({ host: 'rubygems.org' }),
    );

    expect(output).toEqual({
      host: 'rubygems.org',
      baseUrl: 'https://rubygems.org',
      apiBaseUrl: 'https://rubygems.org/api/v1',
    });
  });

  it('rejects funky configs', () => {
    const valid: any = {
      host: 'a.com',
      token: 't',
    };
    expect(() =>
      readRubygemsIntegrationConfig(buildConfig({ ...valid, host: 7 })),
    ).toThrow(/host/);
    expect(() =>
      readRubygemsIntegrationConfig(buildConfig({ ...valid, token: 7 })),
    ).toThrow(/token/);
  });

  it('works on the frontend', async () => {
    expect(
      readRubygemsIntegrationConfig(
        await buildFrontendConfig({
          host: 'a.com',
          apiBaseUrl: 'https://a.com/api',
          token: 't',
          baseUrl: 'https://a.com',
        }),
      ),
    ).toEqual({
      host: 'a.com',
      apiBaseUrl: 'https://a.com/api',
      baseUrl: 'https://a.com',
    });
  });
});

describe('readRubygemsIntegrationConfigs', () => {
  function buildConfig(data: Partial<RubygemsIntegrationConfig>[]): Config[] {
    return data.map(item => new ConfigReader(item));
  }

  it('reads all values', () => {
    const output = readRubygemsIntegrationConfigs(
      buildConfig([
        {
          host: 'a.com',
          token: 't',
          apiBaseUrl: 'https://a.com/api/v4',
          baseUrl: 'https://a.com',
        },
      ]),
    );
    expect(output).toContainEqual({
      host: 'a.com',
      token: 't',
      apiBaseUrl: 'https://a.com/api/v4',
      baseUrl: 'https://a.com',
    });
  });

  it('adds a default entry when missing', () => {
    const output = readRubygemsIntegrationConfigs(buildConfig([]));
    expect(output).toEqual([
      {
        host: 'rubygems.org',
        apiBaseUrl: 'https://rubygems.org/api/v1',
        baseUrl: 'https://rubygems.org',
      },
    ]);
  });
});
