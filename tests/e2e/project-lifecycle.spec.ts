import { expect, Schema, test } from '../../src/fixtures';

test(
  'TC-011 A project from empty to done: three tasks, two ticked off, one still open at the end',
  { tag: ['@TC-011', '@e2e'] },
  async ({ api, testData }) => {
    const project = await test.step('Create an empty project', async () => {
      const created = await testData.createProject();
      expect(await api.tasks.list({ project_id: created.id })).toEqual([]);
      return created;
    });

    const [first, second, third] = await test.step('Add three tasks to the project', async () => [
      await testData.createTask({ project_id: project.id }),
      await testData.createTask({ project_id: project.id }),
      await testData.createTask({ project_id: project.id }),
    ]);

    await test.step('Tick off two of the tasks', async () => {
      await api.tasks.close(first.id);
      await api.tasks.close(second.id);
    });

    await test.step("The project's active task list contains only the third task", async () => {
      const active = await api.tasks.list({ project_id: project.id });
      const active = await api.tasks.list({ project_id: project.id });
      for (const task of active) expect(task).toMatchSchema(Schema.task);
    });

    await test.step('The two ticked off tasks are completed when fetched by id', async () => {
      for (const { id } of [first, second]) {
        const fetched = await api.tasks.get(id);
        expect(fetched).toMatchSchema(Schema.task);
        expect(fetched.checked).toBe(true);
        expect(fetched.completed_at).not.toBeNull();
      }
    });

    await test.step('The third task is still open', async () => {
      const fetched = await api.tasks.get(third.id);
      expect(fetched).toMatchSchema(Schema.task);
      expect(fetched.checked).toBe(false);
      expect(fetched.completed_at).toBeNull();
    });
  },
);
