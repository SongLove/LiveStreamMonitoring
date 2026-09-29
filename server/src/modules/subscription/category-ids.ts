export function shouldReplaceCategoryIds(categoryIds: string[] | undefined): categoryIds is string[] {
  return categoryIds !== undefined;
}
