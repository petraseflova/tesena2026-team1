import { buildLabel } from '../../src/data';
import { expect, Schema, test } from '../../src/fixtures';

test(
  'TC-004 A new label is created under the name that was entered',
  { tag: ['@TC-004', '@smoke'] },
  async ({ api, testData }) => {
    const { name } = buildLabel();

    const created = await test.step('Create the label', () => testData.createLabel({ name }));

    await test.step('The response contains a label id and the name that was entered', () => {
      expect(created).toMatchSchema(Schema.label);
      expect(created.id).toBeTruthy();
      expect(created.name).toBe(name);
    });

    await test.step('Fetching the label by its id returns the same name', async () => {
      const fetched = await api.labels.get(created.id);
      expect(fetched.id).toBe(created.id);
      expect(fetched.name).toBe(name);
    });
  },
);
