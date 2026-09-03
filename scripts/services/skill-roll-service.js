export async function rollSkill(actor, skillId, { dc = null, flavor = null, configure = true, create = true } = {}) {
  if (!actor) throw new Error("No actor available for the skill check.");
  if (typeof actor.rollSkill !== "function") throw new Error(`${actor.name} cannot make a skill check.`);
  const result = await actor.rollSkill(
    { skill: skillId, ...(dc == null ? {} : { target: dc }) },
    { configure: Boolean(configure), ...(flavor ? { title: flavor } : {}) },
    { create: Boolean(create), data: { ...(flavor ? { flavor } : {}) } }
  );
  if (!result) return { cancelled: true, total: null, success: null, naturalD20: null, roll: null };
  const roll = Array.isArray(result) ? result[0] : result?.rolls?.[0] ?? result?.roll ?? result;
  const total = Number(roll?.total ?? result?.total ?? NaN);
  return {
    cancelled: false,
    total,
    success: Number.isFinite(total) && dc != null ? total >= dc : null,
    naturalD20: extractNaturalD20(roll),
    roll
  };
}

export function extractNaturalD20(roll) {
  const die = Array.from(roll?.dice ?? []).find(term => Number(term.faces) === 20)
    ?? Array.from(roll?.terms ?? []).find(term => Number(term.faces) === 20);
  const results = Array.from(die?.results ?? []);
  const active = results.find(result => result?.active !== false && result?.discarded !== true)
    ?? results.find(result => result?.discarded !== true)
    ?? results[0];
  const value = Number(active?.result ?? active?.value ?? NaN);
  return Number.isFinite(value) ? value : null;
}

export function actorSkillModifier(actor, skillId) {
  return Number(actor?.system?.skills?.[skillId]?.total ?? actor?.system?.skills?.[skillId]?.mod ?? 0);
}
