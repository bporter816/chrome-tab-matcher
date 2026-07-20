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

// canonicalizes a URL for duplicate detection: matchStr is applied to the URL and,
// if it matches, replaced with replaceStr (which may reference capture groups, e.g.
// "$1") to produce the canonical form. URLs that don't match any rule are compared
// as-is.
export type ConsolidateRule = {
    id: string;
    matchStr: string;
    replaceStr: string;
};

export type Data = {
    rules: Rule[];
    consolidateEnabled: boolean;
    consolidateRules: ConsolidateRule[];
};
