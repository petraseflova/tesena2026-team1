import { uniqueName } from '../../src/data';
import { expect, Schema, test } from '../../src/fixtures';

test.describe('Projects', () => {
  test(
    'TC-001 A new project is created and comes back under the name that was entered',
    { tag: ['@TC-001', '@smoke'] },
    async ({ api, testData }) => {
      const name = uniqueName('project');

      const created = await test.step('create the project', () => testData.createProject({ name }));

      await test.step('the response has an id and the entered name', () => {
        expect(created).toMatchSchema(Schema.project);
        expect(created.id).not.toBe('');
        expect(created.name).toBe(name);
      });

      await test.step('the project loads by id under the entered name', async () => {
        const loaded = await api.projects.get(created.id);
        expect(loaded).toMatchSchema(Schema.project);
        expect(loaded.id).toBe(created.id);
        expect(loaded.name).toBe(name);
      });
    },
  );

  test(
    'TC-006 A renamed project loads under the new name the next time it is opened, not only in the response to the update',
    { tag: ['@TC-006', '@regression'] },
    async ({ api, testData }) => {
      const originalName = uniqueName('project');
      const newName = uniqueName('project-renamed');

      const created = await test.step('create the project', () =>
        testData.createProject({ name: originalName }));

      const updated = await test.step('rename the project', () =>
        api.projects.update(created.id, { name: newName }));

      await test.step('the update response has the new name', () => {
        expect(updated).toMatchSchema(Schema.project);
        expect(updated.id).toBe(created.id);
        expect(updated.name).toBe(newName);
      });

      await test.step('the project loads by id under the new name, not the original one', async () => {
        const loaded = await api.projects.get(created.id);
        expect(loaded).toMatchSchema(Schema.project);
        expect(loaded.id).toBe(created.id);
        expect(loaded.name).toBe(newName);
      });
    },
  );
});
