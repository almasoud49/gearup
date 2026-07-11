export const buildSearchConditions = (searchTerm: string, fields: string[]) => {
    if (!searchTerm) return [];
    
    return [{
        OR: fields.map(field => ({
            [field]: {
                contains: searchTerm,
                mode: "insensitive"
            }
        }))
    }];
};

export const buildSearchCondition = (searchTerm: string, field: string) => {
    if (!searchTerm) return {};
    
    return {
        [field]: {
            contains: searchTerm,
            mode: "insensitive"
        }
    };
};