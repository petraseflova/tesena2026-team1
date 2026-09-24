import { buildTask } from '../../src/data';
import { expect, Schema, test } from '../../src/fixtures';
import { tomorrowIn } from '../../src/utils/dates';

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

test(
  'TC-003 A new task is created with the due date that was entered',
  { tag: ['@TC-003', '@smoke'] },
  async ({ api, testData, accountTimezone }) => {
    const dueDate = tomorrowIn(accountTimezone);

    const created = await test.step('Create the task with a due date of tomorrow', () =>
      testData.createTask({ due_date: dueDate }));

    await test.step('The response contains a task id and the due date that was entered', () => {
      expect(created).toMatchSchema(Schema.task);
      expect(created.id).toBeTruthy();
      expect(created.due?.date).toBe(dueDate);
    });

    await test.step('Fetching the task by its id returns the same due date', async () => {
      const fetched = await api.tasks.get(created.id);
      expect(fetched.id).toBe(created.id);
      expect(fetched.due?.date).toBe(dueDate);
    });
  },
);
