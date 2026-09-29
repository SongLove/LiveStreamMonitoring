import { shouldReplaceCategoryIds } from './category-ids';

describe('shouldReplaceCategoryIds', () => {
  it('keeps categories when the field is omitted', () => {
    expect(shouldReplaceCategoryIds(undefined)).toBe(false);
  });

  it('clears categories when the client sends an empty list', () => {
    expect(shouldReplaceCategoryIds([])).toBe(true);
  });

  it('replaces categories when the client sends ids', () => {
    expect(shouldReplaceCategoryIds(['abc'])).toBe(true);
  });
});
