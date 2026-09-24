import type { APIResponse } from '@playwright/test';

import { buildTask } from '../../src/data';
import { expect, test, type TestData } from '../../src/fixtures';

interface ApiErrorBody {
  error_tag: string;
  error_extra: { argument?: string };
}

/** If the API accepts the payload after all, registers the task so teardown deletes it. */
async function trackIfCreated(response: APIResponse, testData: TestData): Promise<void> {
  if (response.ok()) {
    const { id } = (await response.json()) as { id: string };
    testData.track('task', id);
  }
}

test.describe('TC-015 A task with no text, with a required field missing, and with an unreadable due date is rejected', () => {
  test(
    'TC-015a A task with no text is rejected',
    { tag: ['@TC-015', '@negative'] },
    async ({ api, testData }) => {
      const project = await test.step('Create a project for the task', () =>
        testData.createProject());

      const response = await test.step('Send a task with empty content', async () => {
        const sent = await api.tasks.send('POST', 'tasks', {
          body: { content: '', project_id: project.id },
        });
        await trackIfCreated(sent, testData);
        return sent;
      });

      await test.step('The request is rejected with 400 for the content argument', async () => {
        expect(response.status()).toBe(400);
        const body = (await response.json()) as ApiErrorBody;
        expect(body.error_tag).toBe('INVALID_ARGUMENT_VALUE');
        expect(body.error_extra.argument).toBe('content');
      });

      await test.step('No task is created in the project', async () => {
        expect(await api.tasks.list({ project_id: project.id })).toEqual([]);
      });
    },
  );

  test(
    'TC-015b A task with the required content field missing is rejected',
    { tag: ['@TC-015', '@negative'] },
    async ({ api, testData }) => {
      const project = await test.step('Create a project for the task', () =>
        testData.createProject());

      const response = await test.step('Send a task without content', async () => {
        const sent = await api.tasks.send('POST', 'tasks', {
          body: { description: 'autotest-no-content', project_id: project.id },
        });
        await trackIfCreated(sent, testData);
        return sent;
      });

      await test.step('The request is rejected with 400 for the missing content argument', async () => {
        expect(response.status()).toBe(400);
        const body = (await response.json()) as ApiErrorBody;
        expect(body.error_tag).toBe('ARGUMENT_MISSING');
        expect(body.error_extra.argument).toBe('content');
      });

      await test.step('No task is created in the project', async () => {
        expect(await api.tasks.list({ project_id: project.id })).toEqual([]);
      });
    },
  );

  test(
    'TC-015c A task with an unreadable due date is rejected',
    { tag: ['@TC-015', '@negative'] },
    async ({ api, testData }) => {
      const { content } = buildTask();

      const project = await test.step('Create a project for the task', () =>
        testData.createProject());

      const response = await test.step('Send a task with a nonsense due string', async () => {
        const sent = await api.tasks.send('POST', 'tasks', {
          body: { content, due_string: 'qwzx blorf nonsense', project_id: project.id },
        });
        await trackIfCreated(sent, testData);
        return sent;
      });

      await test.step('The request is rejected with 400 for the date format', async () => {
        expect(response.status()).toBe(400);
        const body = (await response.json()) as ApiErrorBody;
        expect(body.error_tag).toBe('BAD_REQUEST');
      });

      await test.step('No task with that content is created in the project', async () => {
        const tasks = await api.tasks.list({ project_id: project.id });
        expect(tasks.filter((task) => task.content === content)).toEqual([]);
      });
    },
  );
});
