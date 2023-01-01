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

import { Config } from '@backstage/config';
import { trimEnd } from 'lodash';
import { isValidHost, isValidUrl } from '../helpers';

const RUBYGEMS_HOST = 'rubygems.org';
const RUBYGEMS_API_BASE_URL = 'https://rubygems.org/api/v1';

/**
 * The configuration parameters for a single GitLab integration.
 *
 * @public
 */
export type RubygemsIntegrationConfig = {
  /**
   * The host of the target that this matches on, e.g. `gitlab.com`.
   */
  host: string;

  /**
   * The base URL of the API of this provider, e.g.
   * `https://gitlab.com/api/v4`, with no trailing slash.
   *
   * May be omitted specifically for public GitLab; then it will be deduced.
   */
  apiBaseUrl: string;

  /**
   * The authorization token to use for requests to this provider.
   *
   * If no token is specified, anonymous access is used.
   */
  token?: string;

  /**
   * The baseUrl of this provider, e.g. `https://rubygems.org`, which is passed
   * into the Rubygems client.
   *
   * If no baseUrl is provided, it will default to `https://${host}`
   */
  baseUrl: string;
};

/**
 * Reads a single Rubygems integration config.
 *
 * @param config - The config object of a single integration
 * @public
 */
export function readRubygemsIntegrationConfig(
  config: Config,
): RubygemsIntegrationConfig {
  const host = config.getString('host');
  let apiBaseUrl = config.getOptionalString('apiBaseUrl');
  const token = config.getOptionalString('token');
  let baseUrl = config.getOptionalString('baseUrl');
  if (apiBaseUrl) {
    apiBaseUrl = trimEnd(apiBaseUrl, '/');
  } else if (host === RUBYGEMS_HOST) {
    apiBaseUrl = RUBYGEMS_API_BASE_URL;
  }

  if (baseUrl) {
    baseUrl = trimEnd(baseUrl, '/');
  } else {
    baseUrl = `https://${host}`;
  }

  if (!isValidHost(host)) {
    throw new Error(
      `Invalid Rubygems integration config, '${host}' is not a valid host`,
    );
  } else if (!apiBaseUrl || !isValidUrl(apiBaseUrl)) {
    throw new Error(
      `Invalid Rubygems integration config, '${apiBaseUrl}' is not a valid apiBaseUrl`,
    );
  } else if (!isValidUrl(baseUrl)) {
    throw new Error(
      `Invalid Rubygems integration config, '${baseUrl}' is not a valid baseUrl`,
    );
  }

  return { host, token, apiBaseUrl, baseUrl };
}

/**
 * Reads a set of Rubygems integration configs, and inserts some defaults for
 * public Rubygems if not specified.
 *
 * @param configs - All of the integration config objects
 * @public
 */
export function readRubygemsIntegrationConfigs(
  configs: Config[],
): RubygemsIntegrationConfig[] {
  // First read all the explicit integrations
  const result = configs.map(readRubygemsIntegrationConfig);

  // As a convenience we always make sure there's at least an unauthenticated
  // reader for public gitlab repos.
  if (!result.some(c => c.host === RUBYGEMS_HOST)) {
    result.push({
      host: RUBYGEMS_HOST,
      apiBaseUrl: RUBYGEMS_API_BASE_URL,
      baseUrl: `https://${RUBYGEMS_HOST}`,
    });
  }

  return result;
}

/**
 * Reads a Rubygems integration config, and returns
 * relative path.
 *
 * @param config - RubygemsIntegrationConfig object
 * @public
 */
export function getRubygemsIntegrationRelativePath(
  config: RubygemsIntegrationConfig,
): string {
  let relativePath = '';
  if (config.host !== RUBYGEMS_HOST) {
    relativePath = new URL(config.baseUrl).pathname;
  }
  return trimEnd(relativePath, '/');
}
