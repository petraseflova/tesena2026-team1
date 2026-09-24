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
      expect(created).toMatchObject({ due: { date: dueDate } });
    });

    await test.step('Fetching the task by its id returns the same due date', async () => {
      const fetched = await api.tasks.get(created.id);
      expect(fetched.id).toBe(created.id);
      expect(fetched).toMatchObject({ due: { date: dueDate } });
    });
  },
);

test(
  'TC-007a A task can be created with the required fields only',
  { tag: ['@TC-007', '@regression'] },
  async ({ api, testData, account }) => {
    const { content } = buildTask();
    const defaults = {
      content,
      description: '',
      project_id: account.inbox_project_id,
      parent_id: null,
      section_id: null,
      labels: [],
      priority: 1,
      due: null,
    };

    const created = await test.step('Create the task with only its text', () =>
      testData.createTask({ content }));

    await test.step('The response contains the text and the defaults of the optional fields', () => {
      expect(created).toMatchSchema(Schema.task);
      expect(created).toMatchObject(defaults);
    });

    await test.step('Fetching the task by its id returns the same values', async () => {
      const fetched = await api.tasks.get(created.id);
      expect(fetched).toMatchSchema(Schema.task);
      expect(fetched.id).toBe(created.id);
      expect(fetched).toMatchObject(defaults);
    });
  },
);

test(
  'TC-007b Every optional field of a new task is stored exactly as it was entered',
  { tag: ['@TC-007', '@regression'] },
  async ({ api, testData, accountTimezone }) => {
    const { project, parent, label } =
      await test.step('Create a project, a parent task and a label', async () => {
        const project = await testData.createProject();
        const parent = await testData.createTask({ project_id: project.id });
        const label = await testData.createLabel();
        return { project, parent, label };
      });

    const description = 'A description of the task';
    const dueDate = tomorrowIn(accountTimezone);
    const expected = {
      description,
      project_id: project.id,
      parent_id: parent.id,
      labels: [label.name],
      priority: 4,
      due: { date: dueDate },
    };

    const created = await test.step('Create the task with every optional field', () =>
      testData.createTask({
        description,
        project_id: project.id,
        parent_id: parent.id,
        labels: [label.name],
        priority: 4,
        due_date: dueDate,
      }));

    await test.step('The response contains every optional field as it was entered', () => {
      expect(created).toMatchSchema(Schema.task);
      expect(created).toMatchObject(expected);
    });

    await test.step('Fetching the task by its id returns the same optional fields', async () => {
      const fetched = await api.tasks.get(created.id);
      expect(fetched).toMatchSchema(Schema.task);
      expect(fetched.id).toBe(created.id);
      expect(fetched).toMatchObject(expected);
    });
  },
);
