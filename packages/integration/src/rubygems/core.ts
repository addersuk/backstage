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

import {
  getRubygemsIntegrationRelativePath,
  RubygemsIntegrationConfig,
} from './config';
import { trimStart } from 'lodash';

/**
 * Given a URL pointing to a file on a provider, returns a URL that is suitable
 * for fetching the contents of the data.
 *
 * @remarks
 *
 * Converts
 * from: https://rubygems.org/gems/simplycop
 * to:   https://rubygems.org/api/v1/gems/simplycop.json
 * -or-
 * from: https://rubygems.org/gems/rails
 * to:   https://rubygems.org/api/v1/gems/rails.json
 *
 * @param url - A URL pointing to a file
 * @param config - The relevant provider config
 * @public
 */
export async function getRubygemsFileFetchUrl(
  url: string,
  config: RubygemsIntegrationConfig,
): Promise<string> {
  return buildPackageUrl(url, config).toString();
}

/**
 * Gets the request options necessary to make requests to a given provider.
 *
 * @param config - The relevant provider config
 * @public
 */
export function getRubygemsRequestOptions(config: RubygemsIntegrationConfig): {
  headers: Record<string, string>;
} {
  const { token = '' } = config;
  return {
    headers: {
      'PRIVATE-TOKEN': token,
    },
  };
}

// Converts
// from: https://gitlab.com/groupA/teams/teamA/subgroupA/repoA/-/blob/branch/filepath
// to:   https://gitlab.com/api/v4/projects/projectId/repository/files/filepath?ref=branch
export function buildPackageUrl(
  target: string,
  config: RubygemsIntegrationConfig,
): URL {
  try {
    const url = new URL(target);
    const relativePath = getRubygemsIntegrationRelativePath(config);
    url.pathname = [
      ...(relativePath ? [relativePath] : []),
      'api/v1',
      `${trimStart(url.pathname, '/')}.json`,
    ].join('/');

    return url;
  } catch (e) {
    throw new Error(`Incorrect url: ${target}, ${e}`);
  }
}
