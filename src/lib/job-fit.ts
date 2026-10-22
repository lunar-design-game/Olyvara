export function explainSkillFit(profileSkills: string, requiredSkills: string) {
  const normalize = (value: string) => value.split(",").map((skill) => skill.trim()).filter(Boolean);
  const profile = normalize(profileSkills);
  const required = normalize(requiredSkills);
  const matched = required.filter((need) => profile.some((skill) => skill.toLocaleLowerCase() === need.toLocaleLowerCase()));
  const notListed = required.filter((need) => !matched.includes(need));
  return { matched, notListed };
}