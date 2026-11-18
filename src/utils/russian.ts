const pluralRules = new Intl.PluralRules("ru");

export function formatCount(count: number, one: string, few: string, many: string): string {
  const form = pluralRules.select(count);
  return `${count} ${form === "one" ? one : form === "few" ? few : many}`;
}
