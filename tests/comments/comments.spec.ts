import { buildComment } from '../../src/data';
import { expect, Schema, test } from '../../src/fixtures';

test(
  'TC-005 A comment is added to a task with the text that was entered',
  { tag: ['@TC-005', '@smoke'] },
  async ({ api, testData }) => {
    const task = await test.step('Create a task to comment on', () => testData.createTask());

    const { content } = buildComment({ task_id: task.id });

    const created = await test.step('Add the comment to the task', () =>
      testData.createComment({ task_id: task.id }, { content }));

    await test.step('The response contains a comment id, the text that was entered and the task id', () => {
      expect(created).toMatchSchema(Schema.comment);
      expect(created.id).toBeTruthy();
      expect(created.content).toBe(content);
      expect(created.item_id).toBe(task.id);
    });

    await test.step('Fetching the comment by its id returns the same text', async () => {
      const fetched = await api.comments.get(created.id);
      expect(fetched).toMatchSchema(Schema.comment);
      expect(fetched.id).toBe(created.id);
      expect(fetched.content).toBe(content);
    });
  },
);
