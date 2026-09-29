"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const category_ids_1 = require("./category-ids");
describe('shouldReplaceCategoryIds', () => {
    it('keeps categories when the field is omitted', () => {
        expect((0, category_ids_1.shouldReplaceCategoryIds)(undefined)).toBe(false);
    });
    it('clears categories when the client sends an empty list', () => {
        expect((0, category_ids_1.shouldReplaceCategoryIds)([])).toBe(true);
    });
    it('replaces categories when the client sends ids', () => {
        expect((0, category_ids_1.shouldReplaceCategoryIds)(['abc'])).toBe(true);
    });
});
//# sourceMappingURL=category-ids.spec.js.map