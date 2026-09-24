import { buildTask } from '../../src/data';
import { expect, Schema, test } from '../../src/fixtures';

test(
  'TC-002 A new task is created with the text that was entered',
  { tag: ['@TC-002', '@smoke'] },
  async ({ api, testData }) => {
    const { content } = buildTask();

    const created = await test.step('Create the task', () => testData.createTask({ content }));

    await test.step('The response contains a task id and the text that was entered', () => {
      expect(created).toMatchSchema(Schema.task);
      expect(created.id).toBeTruthy();
      expect(created.content).toBe(content);
    });

    await test.step('Fetching the task by its id returns the same text', async () => {
      const fetched = await api.tasks.get(created.id);
      expect(fetched.id).toBe(created.id);
      expect(fetched.content).toBe(content);
    });
  },
);
