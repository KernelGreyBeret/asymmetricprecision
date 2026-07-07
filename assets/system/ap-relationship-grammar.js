/* AP Relationship Grammar
   Sprint 25 — Relationship Grammar Hardening
   Principle: relationships should read like meaning, not metadata.

   This layer turns Atlas edge data into human-readable relationship language.
   Raw edge labels are internal metadata. Visitor-facing surfaces should read
   like meaningful relationships inside the AP system.
*/

const FALLBACK_TYPE = "relates to";

const RELATIONSHIP_ALIASES = new Map([
  ["connects", "connects to"],
  ["connected", "connects to"],
  ["connection", "connects to"],
  ["related", "relates to"],
  ["related to", "relates to"],
  ["undefined", FALLBACK_TYPE],
  ["null", FALLBACK_TYPE],
  ["", FALLBACK_TYPE],
  ["expressed by", "expressed_by"],
  ["expressed_by", "expressed_by"],
  ["routes to", "routes-to"],
  ["routes-to", "routes-to"],
  ["route to", "routes-to"],
  ["apply", "applies"],
  ["develop", "develops"],
  ["capture", "captures"],
  ["deepen", "deepens"],
  ["prove", "proves"],
  ["implements through", "implements"],
  ["is governed by", "is governed by"],
  ["is grounded in", "is grounded in"]
]);

export const AP_RELATIONSHIP_GRAMMAR = {
  "contains": {
    group: "structure",
    forward: "Contains",
    inverse: "Belongs to",
    sentence: "{source} contains {target}.",
    inverseSentence: "{source} belongs to {target}."
  },
  "belongs to": {
    group: "structure",
    forward: "Belongs to",
    inverse: "Contains",
    sentence: "{source} belongs to {target}.",
    inverseSentence: "{source} contains {target}."
  },
  "connects to": {
    group: "relationship",
    forward: "Connected to",
    inverse: "Connected to",
    sentence: "{source} connects to {target}.",
    inverseSentence: "{source} connects to {target}."
  },
  "relates to": {
    group: "relationship",
    forward: "Related to",
    inverse: "Related to",
    sentence: "{source} is related to {target}.",
    inverseSentence: "{source} is related to {target}."
  },
  "routes-to": {
    group: "journey",
    forward: "Routes to",
    inverse: "Reached from",
    sentence: "{source} routes to {target}.",
    inverseSentence: "{source} is reached from {target}."
  },
  "applies": {
    group: "application",
    forward: "Applies",
    inverse: "Applied by",
    sentence: "{source} applies {target}.",
    inverseSentence: "{source} is applied by {target}."
  },
  "develops": {
    group: "development",
    forward: "Develops",
    inverse: "Developed through",
    sentence: "{source} develops {target}.",
    inverseSentence: "{source} is developed through {target}."
  },
  "captures": {
    group: "observation",
    forward: "Captures",
    inverse: "Captured by",
    sentence: "{source} captures {target}.",
    inverseSentence: "{source} is captured by {target}."
  },
  "deepens": {
    group: "learning",
    forward: "Deepens",
    inverse: "Deepened by",
    sentence: "{source} deepens {target}.",
    inverseSentence: "{source} is deepened by {target}."
  },
  "proves": {
    group: "evidence",
    forward: "Proves",
    inverse: "Proven by",
    sentence: "{source} proves {target}.",
    inverseSentence: "{source} is proven by {target}."
  },
  "expressed_by": {
    group: "expression",
    forward: "Expressed by",
    inverse: "Expresses",
    sentence: "{source} is expressed by {target}.",
    inverseSentence: "{source} expresses {target}."
  },
  "is grounded in": {
    group: "foundation",
    forward: "Grounded in",
    inverse: "Grounds",
    sentence: "{source} is grounded in {target}.",
    inverseSentence: "{source} grounds {target}."
  },
  "is governed by": {
    group: "governance",
    forward: "Governed by",
    inverse: "Governs",
    sentence: "{source} is governed by {target}.",
    inverseSentence: "{source} governs {target}."
  },
  "welcomes through": {
    group: "entry",
    forward: "Welcomes through",
    inverse: "Gateway for",
    sentence: "{source} welcomes through {target}.",
    inverseSentence: "{source} is a gateway into {target}."
  },
  "explains itself through": {
    group: "explanation",
    forward: "Explained through",
    inverse: "Explains",
    sentence: "{source} explains itself through {target}.",
    inverseSentence: "{source} helps explain {target}."
  },
  "maps itself through": {
    group: "map",
    forward: "Mapped through",
    inverse: "Maps",
    sentence: "{source} maps itself through {target}.",
    inverseSentence: "{source} maps {target}."
  },
  "reveals": {
    group: "clarity",
    forward: "Reveals",
    inverse: "Revealed by",
    sentence: "{source} reveals {target}.",
    inverseSentence: "{source} is revealed by {target}."
  },
  "enables": {
    group: "enablement",
    forward: "Enables",
    inverse: "Enabled by",
    sentence: "{source} enables {target}.",
    inverseSentence: "{source} is enabled by {target}."
  },
  "supports": {
    group: "support",
    forward: "Supports",
    inverse: "Supported by",
    sentence: "{source} supports {target}.",
    inverseSentence: "{source} is supported by {target}."
  },
  "disciplines": {
    group: "discipline",
    forward: "Disciplines",
    inverse: "Disciplined by",
    sentence: "{source} disciplines {target}.",
    inverseSentence: "{source} is disciplined by {target}."
  },
  "increases": {
    group: "effect",
    forward: "Increases",
    inverse: "Increased by",
    sentence: "{source} increases {target}.",
    inverseSentence: "{source} is increased by {target}."
  },
  "shapes": {
    group: "influence",
    forward: "Shapes",
    inverse: "Shaped by",
    sentence: "{source} shapes {target}.",
    inverseSentence: "{source} is shaped by {target}."
  },
  "requires": {
    group: "dependency",
    forward: "Requires",
    inverse: "Required by",
    sentence: "{source} requires {target}.",
    inverseSentence: "{source} is required by {target}."
  },
  "uses": {
    group: "usage",
    forward: "Uses",
    inverse: "Used by",
    sentence: "{source} uses {target}.",
    inverseSentence: "{source} is used by {target}."
  },
  "teaches through": {
    group: "learning",
    forward: "Teaches through",
    inverse: "Teaches",
    sentence: "{source} teaches through {target}.",
    inverseSentence: "{source} teaches {target}."
  },
  "sharpens through": {
    group: "practice",
    forward: "Sharpens through",
    inverse: "Sharpens",
    sentence: "{source} sharpens through {target}.",
    inverseSentence: "{source} sharpens {target}."
  },
  "operationalizes through": {
    group: "application",
    forward: "Operationalizes through",
    inverse: "Operationalizes",
    sentence: "{source} operationalizes through {target}.",
    inverseSentence: "{source} operationalizes {target}."
  },
  "tests through": {
    group: "evidence",
    forward: "Tests through",
    inverse: "Tests",
    sentence: "{source} tests through {target}.",
    inverseSentence: "{source} tests {target}."
  },
  "observes through": {
    group: "observation",
    forward: "Observes through",
    inverse: "Observes",
    sentence: "{source} observes through {target}.",
    inverseSentence: "{source} observes {target}."
  },
  "depends on": {
    group: "dependency",
    forward: "Depends on",
    inverse: "Supports",
    sentence: "{source} depends on {target}.",
    inverseSentence: "{source} supports {target}."
  },
  "communicates": {
    group: "communication",
    forward: "Communicates",
    inverse: "Communicated by",
    sentence: "{source} communicates {target}.",
    inverseSentence: "{source} is communicated by {target}."
  },
  "should support": {
    group: "expectation",
    forward: "Should support",
    inverse: "Should be supported by",
    sentence: "{source} should support {target}.",
    inverseSentence: "{source} should be supported by {target}."
  },
  "teaches through play": {
    group: "learning",
    forward: "Teaches through play",
    inverse: "Teaches",
    sentence: "{source} teaches through play with {target}.",
    inverseSentence: "{source} teaches {target}."
  },
  "implements": {
    group: "implementation",
    forward: "Implements",
    inverse: "Implemented by",
    sentence: "{source} implements {target}.",
    inverseSentence: "{source} is implemented by {target}."
  },
  "measures success through": {
    group: "measurement",
    forward: "Measures through",
    inverse: "Measures",
    sentence: "{source} measures success through {target}.",
    inverseSentence: "{source} measures {target}."
  },
  "optimizes for": {
    group: "optimization",
    forward: "Optimizes for",
    inverse: "Optimized by",
    sentence: "{source} optimizes for {target}.",
    inverseSentence: "{source} is optimized by {target}."
  },
  "operationalizes": {
    group: "application",
    forward: "Operationalizes",
    inverse: "Operationalized by",
    sentence: "{source} operationalizes {target}.",
    inverseSentence: "{source} is operationalized by {target}."
  },
  "guides exploration through": {
    group: "journey",
    forward: "Guides exploration through",
    inverse: "Guides",
    sentence: "{source} guides exploration through {target}.",
    inverseSentence: "{source} guides {target}."
  }
};

export function initializeRelationshipGrammar() {
  window.APSystem = window.APSystem || {};
  window.APSystem.relationshipGrammar = {
    normalizeAtlasEdge,
    relationshipGrammar,
    describeRelationship,
    renderRelationshipButton,
    phraseForRelationship,
    sentenceForRelationship,
    groupForRelationship
  };
  document.documentElement.dataset.apRelationshipGrammar = "ready";
}

export function normalizeAtlasEdge(edge) {
  if (!edge || typeof edge !== "object") return null;
  const from = edge.from || edge.source;
  const to = edge.to || edge.target;
  if (!from || !to) return null;
  const relationship = normalizeRelationshipType(edge.relationship || edge.type || edge.label || FALLBACK_TYPE);
  return { ...edge, from, to, source: from, target: to, relationship, type: relationship };
}

export function normalizeRelationshipType(value) {
  const cleaned = cleanRelationshipLabel(value).toLowerCase();
  if (RELATIONSHIP_ALIASES.has(cleaned)) return RELATIONSHIP_ALIASES.get(cleaned);
  if (cleaned.startsWith("is ") && cleaned.endsWith(" by")) {
    const middle = cleaned.slice(3, -3).trim();
    if (RELATIONSHIP_ALIASES.has(middle)) return RELATIONSHIP_ALIASES.get(middle);
    if (AP_RELATIONSHIP_GRAMMAR[middle]) return middle;
  }
  return AP_RELATIONSHIP_GRAMMAR[cleaned] ? cleaned : FALLBACK_TYPE;
}

export function relationshipGrammar(type) {
  const key = normalizeRelationshipType(type);
  return AP_RELATIONSHIP_GRAMMAR[key] || AP_RELATIONSHIP_GRAMMAR[FALLBACK_TYPE];
}

export function describeRelationship(edge, currentId, byId) {
  const normalized = normalizeAtlasEdge(edge);
  if (!normalized || !currentId || !byId) return null;

  const outbound = normalized.from === currentId;
  const inbound = normalized.to === currentId;
  if (!outbound && !inbound) return null;

  const otherId = outbound ? normalized.to : normalized.from;
  const source = byId.get(currentId);
  const target = byId.get(otherId);
  if (!source || !target) return null;

  const grammar = relationshipGrammar(normalized.relationship);
  const phrase = outbound ? grammar.forward : grammar.inverse;
  const sentence = sentenceForRelationship(normalized.relationship, source, target, outbound);

  return {
    otherId,
    phrase,
    sentence,
    source,
    target,
    relationship: normalized.relationship,
    group: grammar.group || "relationship",
    outbound,
    inbound,
    href: target.url || null
  };
}

export function groupForRelationship(type) {
  return relationshipGrammar(type).group || "relationship";
}

export function phraseForRelationship(type, outbound = true) {
  const grammar = relationshipGrammar(type);
  return outbound ? grammar.forward : grammar.inverse;
}

export function sentenceForRelationship(type, source, target, outbound = true) {
  const grammar = relationshipGrammar(type);
  const template = outbound ? grammar.sentence : grammar.inverseSentence;
  return template
    .replaceAll("{source}", nodeLabel(source))
    .replaceAll("{target}", nodeLabel(target));
}

export function renderRelationshipButton(edge, currentId, byId) {
  const description = describeRelationship(edge, currentId, byId);
  if (!description) return "";
  return `<li class="ap-relationship-row ap-relationship-row-${escapeHtml(description.group)}">
    <button type="button" data-ap-follow-connection="${escapeHtml(description.otherId)}" title="${escapeHtml(description.sentence)}">
      <span class="ap-relationship-verb">${escapeHtml(description.phrase)}</span>
      <strong>${escapeHtml(nodeLabel(description.target))}</strong>
      <small>${escapeHtml(nodeMeta(description.target))}</small>
      <em>${escapeHtml(description.sentence)}</em>
    </button>
  </li>`;
}

export function relationshipSummaryList(edges, currentId, byId, limit = 6) {
  return (edges || [])
    .map((edge) => describeRelationship(edge, currentId, byId))
    .filter(Boolean)
    .slice(0, limit);
}

function cleanRelationshipLabel(value) {
  return String(value ?? FALLBACK_TYPE)
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .replace(/\bis\s+is\b/gi, "is")
    .replace(/\s+by\s+by\b/gi, " by")
    .replace(/\s+/g, " ")
    .trim();
}

function nodeLabel(node) {
  return node?.label || node?.title || node?.id || "This node";
}

function nodeMeta(node) {
  const bits = [node?.type, node?.domain].filter(Boolean);
  return bits.join(" · ") || "AP system node";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
