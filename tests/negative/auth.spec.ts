import type { TodoistApi } from '../../src/clients';
import { buildTask } from '../../src/data';
import { expect, test, type TestData } from '../../src/fixtures';

const MALFORMED_TOKEN = 'autotest-malformed-token';

/** Sends the task and, if the API accepts it after all, registers it so teardown deletes it. */
async function sendTask(client: TodoistApi, content: string, testData: TestData): Promise<number> {
  const response = await client.tasks.send('POST', 'tasks', { body: { content } });
  if (response.ok()) {
    const { id } = (await response.json()) as { id: string };
    testData.track('task', id);
  }
  return response.status();
}

test.describe('TC-014 With no access token and with a malformed token the request fails with 401 and nothing is created', () => {
  test(
    'TC-014a A request with no access token fails with 401 and nothing is created',
    { tag: ['@TC-014', '@negative'] },
    async ({ api, unauthenticatedApi, testData }) => {
      const { content } = buildTask();

      const status = await test.step('Send a new task with no Authorization header', () =>
        sendTask(unauthenticatedApi, content, testData));

      await test.step('The response status is 401', () => {
        expect(status).toBe(401);
      });

      await test.step('No task with that content exists on the account', async () => {
        const tasks = await api.tasks.list();
        expect(tasks.filter((task) => task.content === content)).toEqual([]);
      });
    },
  );

  test(
    'TC-014b A request with a malformed token fails with 401 and nothing is created',
    { tag: ['@TC-014', '@negative'] },
    async ({ api, apiWithToken, testData }) => {
      const { content } = buildTask();

      const status = await test.step('Send a new task with a malformed token', async () =>
        sendTask(await apiWithToken(MALFORMED_TOKEN), content, testData));

      await test.step('The response status is 401', () => {
        expect(status).toBe(401);
      });

      await test.step('No task with that content exists on the account', async () => {
        const tasks = await api.tasks.list();
        expect(tasks.filter((task) => task.content === content)).toEqual([]);
      });
    },
  );
});
