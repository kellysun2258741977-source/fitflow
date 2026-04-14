import { describe, expect, it } from 'vitest';
import { parseGeminiNutrition } from './manualParser';

describe('parseGeminiNutrition', () => {
    it('parses Chinese nutrition text', () => {
        const result = parseGeminiNutrition(`
      食物名称：苹果
      热量：95 kcal
      蛋白质：0.5 g
      碳水化合物：25 g
      脂肪：0.3 g
    `);

        expect(result).toEqual({
            name: '苹果',
            calories: 95,
            proteins: 0.5,
            carbohydrates: 25,
            fats: 0.3,
        });
    });

    it('parses English nutrition text', () => {
        const result = parseGeminiNutrition(`
      Dish: Greek yogurt bowl
      Calories: 320 kcal
      Protein: 18 g
      Carbs: 34 g
      Fat: 11 g
    `);

        expect(result).toEqual({
            name: 'Greek yogurt bowl',
            calories: 320,
            proteins: 18,
            carbohydrates: 34,
            fats: 11,
        });
    });

    it('returns null-like fields when values are missing', () => {
        const result = parseGeminiNutrition('看起来像一份轻食沙拉，建议再补充具体营养数据。');

        expect(result).toEqual({
            name: '',
            calories: null,
            proteins: null,
            carbohydrates: null,
            fats: null,
        });
    });
});

