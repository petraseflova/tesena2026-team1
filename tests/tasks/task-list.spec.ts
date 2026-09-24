import { expect, Schema, test } from '../../src/fixtures';

test(
  "TC-008 A project's task list contains only the tasks of that project, nothing from elsewhere",
  { tag: ['@TC-008', '@regression'] },
  async ({ api, testData }) => {
    const { projectA, tasksInA, taskInB, inboxTask } =
      await test.step('Create three tasks in project A, one in project B and one in the Inbox', async () => {
        const projectA = await testData.createProject();
        const projectB = await testData.createProject();
        const tasksInA = [
          await testData.createTask({ project_id: projectA.id }),
          await testData.createTask({ project_id: projectA.id }),
          await testData.createTask({ project_id: projectA.id }),
        ];
        const taskInB = await testData.createTask({ project_id: projectB.id });
        const inboxTask = await testData.createTask();
        return { projectA, tasksInA, taskInB, inboxTask };
      });

    const listed = await test.step('Request the task list of project A', () =>
      api.tasks.list({ project_id: projectA.id }));

    await test.step('Every listed task matches the schema and belongs to project A', () => {
      for (const task of listed) expect(task).toMatchSchema(Schema.task);
      for (const task of listed) expect(task.project_id).toBe(projectA.id);
    });

    await test.step('The list contains exactly the tasks created in project A', () => {
      const listedIds = listed.map((task) => task.id).sort();
      expect(listedIds).toEqual(tasksInA.map((task) => task.id).sort());
    });

    await test.step('The list contains no task from project B or from the Inbox', () => {
      const listedIds = listed.map((task) => task.id);
      expect(listedIds).not.toContain(taskInB.id);
      expect(listedIds).not.toContain(inboxTask.id);
    });
  },
);
