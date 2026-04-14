function toNumber(raw) {
    if (raw == null) return null;
    const value = Number(String(raw).replace(/,/g, '').trim());
    return Number.isFinite(value) ? value : null;
}

function captureValue(patterns, text) {
    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match?.[1]) {
            const value = toNumber(match[1]);
            if (value != null) return value;
        }
    }
    return null;
}

function captureName(text) {
    const patterns = [
        /(?:食物|菜品|名称|food|dish)\s*[:：]\s*([^\n,，]+)/i,
        /(?:这是|识别为)\s*([^\n,，]{2,20})/i,
    ];
    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match?.[1]) return match[1].trim();
    }
    return '';
}

export function parseGeminiNutrition(text) {
    const normalized = String(text || '')
        .replace(/\u00a0/g, ' ')
        .replace(/[，]/g, ',')
        .replace(/[（]/g, '(')
        .replace(/[）]/g, ')');

    const calories = captureValue(
        [
            /(?:热量|总热量|calories|energy|kcal)\s*[:：]?\s*(\d+(?:\.\d+)?)/i,
            /(\d+(?:\.\d+)?)\s*kcal/i,
        ],
        normalized
    );

    const proteins = captureValue(
        [
            /(?:蛋白质|protein)\s*[:：]?\s*(\d+(?:\.\d+)?)/i,
            /protein\s*\(?(?:g|grams)?\)?\s*[:：]?\s*(\d+(?:\.\d+)?)/i,
        ],
        normalized
    );

    const carbohydrates = captureValue(
        [
            /(?:碳水|碳水化合物|carbohydrate|carbs)\s*[:：]?\s*(\d+(?:\.\d+)?)/i,
            /carbs?\s*\(?(?:g|grams)?\)?\s*[:：]?\s*(\d+(?:\.\d+)?)/i,
        ],
        normalized
    );

    const fats = captureValue(
        [
            /(?:脂肪|fat)\s*[:：]?\s*(\d+(?:\.\d+)?)/i,
            /fat\s*\(?(?:g|grams)?\)?\s*[:：]?\s*(\d+(?:\.\d+)?)/i,
        ],
        normalized
    );

    return {
        name: captureName(normalized),
        calories,
        proteins,
        carbohydrates,
        fats,
    };
}

