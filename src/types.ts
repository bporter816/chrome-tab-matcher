export enum RuleType {
    TabUrl,
    TabTitle,
    PageBody,
}

export type Rule = {
    id: string;
    type: RuleType;
    matchStr: string;
    tabGroup: string;
};

export type Data = {
    rules: Rule[];
};
