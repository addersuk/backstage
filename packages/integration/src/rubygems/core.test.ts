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

import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { RubygemsIntegrationConfig } from './config';
import { getRubygemsFileFetchUrl } from './core';

const worker = setupServer();

describe('rubygems core', () => {
  beforeAll(() => worker.listen({ onUnhandledRequest: 'error' }));
  afterAll(() => worker.close());
  afterEach(() => worker.resetHandlers());

  beforeEach(() => {
    worker.use(
      rest.get('*/api/v4/projects/group%2Fproject', (_, res, ctx) =>
        res(ctx.status(200), ctx.json({ id: 12345 })),
      ),
      rest.get('*/api/v4/projects/group%2Fsubgroup%2Fproject', (_, res, ctx) =>
        res(ctx.status(200), ctx.json({ id: 12345 })),
      ),
    );
  });

  const configRubygemsWithNoToken: RubygemsIntegrationConfig = {
    host: 'rubygems.org',
    apiBaseUrl: 'https://rubygems.org/',
    baseUrl: 'https://rubygems.org/',
  };

  const configSelfHosteWithRelativePath: RubygemsIntegrationConfig = {
    host: 'rubygems.mycompany.com',
    token: '0123456789',
    apiBaseUrl: '<ignored>',
    baseUrl: 'https://rubygems.mycompany.com/rubygems',
  };

  describe('getRubygemsFileFetchUrl', () => {
    describe('with base config it has a correct route', () => {
      it('converts a url to an api call', async () => {
        const target = 'https://rubygems.org/gems/simplycop';
        const fetchUrl = 'https://rubygems.org/api/v1/gems/simplycop.json';
        await expect(
          getRubygemsFileFetchUrl(target, configRubygemsWithNoToken),
        ).resolves.toBe(fetchUrl);
      });
    });

    describe('when target has a scoped route', () => {
      it('converts a url to an api call', async () => {
        const target = 'https://rubygems.org/gems/simplycop';
        const fetchUrl =
          'https://rubygems.org/rubygems/api/v1/gems/simplycop.json';
        await expect(
          getRubygemsFileFetchUrl(target, configSelfHosteWithRelativePath),
        ).resolves.toBe(fetchUrl);
      });
    });
  });
});
