export enum RuleType {
    TabUrl,
    TabTitle,
}

export type Rule = {
    id: string;
    type: RuleType;
    matchStr: string;
    tabGroup: string;
}

export type Data = {
    rules: Rule[];
}
