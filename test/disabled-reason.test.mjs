import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { disabledTooltip, registerDisabledTooltipHelper, setDisabled } from "../scripts/ui/disabled-reason.js";

const root = new URL("../", import.meta.url);
const read = path => readFileSync(new URL(path, root), "utf8");
const buttonTemplate = read("templates/components/ml-button.hbs");
const quantityTemplate = read("templates/components/quantity-controls.hbs");

const buttonBaseline = `<button type="{{#if type}}{{type}}{{else}}button{{/if}}" class="ml-button{{#if class}} {{class}}{{/if}}"{{#if action}} data-action="{{action}}"{{/if}}{{#if tone}} data-tone="{{tone}}"{{/if}}{{#if variant}} data-variant="{{variant}}"{{/if}}{{#if disabled}} disabled{{/if}}>{{#if icon}}<i class="{{icon}}" aria-hidden="true"></i> {{/if}}{{label}}</button>\n`;

const quantityBaseline = `<div class="ml-actions {{classes}}" aria-label="Quantity for {{name}}">
  <button type="button" class="ml-icon-button" data-action="{{action}}" data-delta="-1" {{#if stockKey}}data-stock-key="{{stockKey}}"{{/if}} {{#if itemId}}data-item-id="{{itemId}}"{{/if}} {{#if cartType}}data-cart-type="{{cartType}}"{{/if}} aria-label="Decrease {{name}} quantity" title="Decrease {{name}} quantity" {{#if disabled}}disabled{{/if}}><i class="fa-solid fa-minus"></i></button>
  <span class="{{#if quantityClass}}{{quantityClass}}{{else}}ml-badge{{/if}}" aria-label="Current quantity">{{quantity}}</span>
  <button type="button" class="ml-icon-button" data-action="{{action}}" data-delta="1" {{#if stockKey}}data-stock-key="{{stockKey}}"{{/if}} {{#if itemId}}data-item-id="{{itemId}}"{{/if}} {{#if cartType}}data-cart-type="{{cartType}}"{{/if}} aria-label="Increase {{name}} quantity" title="Increase {{name}} quantity" {{#if disabled}}disabled{{else}}{{#unless increaseEnabled}}disabled{{/unless}}{{/if}}><i class="fa-solid fa-plus"></i></button>
  {{#if clearAction}}<button type="button" class="ml-icon-button" data-action="{{clearAction}}" data-delta="0" {{#if stockKey}}data-stock-key="{{stockKey}}"{{/if}} {{#if itemId}}data-item-id="{{itemId}}"{{/if}} {{#if cartType}}data-cart-type="{{cartType}}"{{/if}} aria-label="Remove {{name}} from cart" title="Remove {{name}} from cart" {{#if disabled}}disabled{{/if}}><i class="fa-solid fa-trash"></i></button>{{/if}}
</div>
`;

const ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#x27;", "`": "&#x60;", "=": "&#x3D;" };

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"'`=]/g, char => ESCAPES[char]);
}

function lookup(context, path) {
  return path.split(".").reduce((value, key) => (value == null ? undefined : value[key]), context);
}

function truthy(value) {
  if (Array.isArray(value)) return value.length > 0;
  return Boolean(value);
}

function render(template, context, helpers = {}) {
  let index = 0;
  function parseUntil(closers) {
    let html = "";
    let when = null;
    while (index < template.length) {
      const open = template.indexOf("{{", index);
      if (open < 0) {
        html += template.slice(index);
        index = template.length;
        break;
      }
      html += template.slice(index, open);
      const close = template.indexOf("}}", open);
      if (close < 0) throw new Error("Unclosed Handlebars tag");
      const tag = template.slice(open + 2, close).trim();
      index = close + 2;
      if (closers.includes(tag)) return finish(when, html, tag);
      if (tag === "else") {
        if (when !== null) throw new Error("Duplicate else");
        when = html;
        html = "";
        continue;
      }
      const block = tag.match(/^#(if|unless)\s+(.+)$/);
      if (block) {
        const inner = parseUntil([`/${block[1]}`]);
        const show = truthy(lookup(context, block[2].trim()));
        const pass = block[1] === "unless" ? !show : show;
        html += pass ? inner.when : inner.otherwise;
        continue;
      }
      if (tag.startsWith("#") || tag.startsWith("/")) throw new Error(`Unsupported tag ${tag}`);
      const [name, ...args] = tag.split(/\s+/);
      const value = args.length
        ? helpers[name]?.(...args.map(arg => lookup(context, arg)))
        : lookup(context, name);
      html += escapeHTML(value ?? "");
    }
    if (closers.length) throw new Error(`Expected ${closers.join(" or ")}`);
    return finish(when, html, null);
  }
  function finish(when, html, closed) {
    return { when: when === null ? html : when, otherwise: when === null ? "" : html, closed };
  }
  const result = parseUntil([]);
  return result.when;
}

const helpers = { mlDisabledTooltip: disabledTooltip };

function control() {
  const attributes = new Map();
  return {
    disabled: false,
    setAttribute(name, value) {
      attributes.set(name, String(value));
      if (name === "disabled") this.disabled = true;
    },
    removeAttribute(name) {
      attributes.delete(name);
      if (name === "disabled") this.disabled = false;
    },
    getAttribute(name) {
      return attributes.has(name) ? attributes.get(name) : null;
    },
    hasAttribute(name) {
      return attributes.has(name);
    },
    snapshot() {
      return { disabled: this.disabled, attributes: [...attributes.entries()] };
    }
  };
}

const quantityContexts = [
  { action: "adjustCartQuantity", name: "Rope", quantity: 2, increaseEnabled: true },
  { action: "adjustCartQuantity", name: "Rope & Hook", quantity: 0, increaseEnabled: false, disabled: false, classes: "ml-marketplace-quantity-stepper", quantityClass: "ml-marketplace-cart-qty", stockKey: "rope", itemId: "item-1", cartType: "buy", clearAction: "adjustCartQuantity" },
  { action: "adjustInventoryQuantity", name: "Lantern", quantity: 4, increaseEnabled: true, disabled: true, stockKey: "lantern" },
  { action: "adjustTransferQuantity", name: "Rations", quantity: 1, increaseEnabled: false, disabled: true, itemId: "rations", cartType: "transfer", clearAction: "adjustCartQuantity", classes: "" }
];

test("ml-button markup without a reason matches the button that has no disabledReason branch", () => {
  const contexts = [
    { label: "Buy" },
    { label: "Disconnect", type: "submit", class: "ml-core-account__disconnect", action: "disconnect", tone: "danger", variant: "outline", icon: "fa-solid fa-link-slash", disabled: false },
    { label: "Save", disabled: true, action: "save" },
    { label: "Buy", disabledReason: "" },
    { label: "Buy", disabledReason: null },
    { label: "Buy", disabledReason: false }
  ];
  for (const context of contexts) {
    assert.equal(render(buttonTemplate, context, helpers), render(buttonBaseline, context, helpers), JSON.stringify(context));
    const html = render(buttonTemplate, context, helpers);
    assert.equal(html.includes("aria-disabled"), false);
    assert.equal(html.includes("data-tooltip"), false);
  }
});

test("ml-button with a reason renders disabled, aria-disabled, and a bold tooltip", () => {
  const html = render(buttonTemplate, {
    label: "Buy",
    action: "buyItem",
    icon: "fa-solid fa-cart-shopping",
    disabledReason: "Need more coin\nThe purse does not cover this price."
  }, helpers);
  assert.equal(html, `<button type="button" class="ml-button" data-action="buyItem" disabled aria-disabled="true" data-tooltip="&lt;strong&gt;Need more coin&lt;/strong&gt;&lt;br&gt;The purse does not cover this price."><i class="fa-solid fa-cart-shopping" aria-hidden="true"></i> Buy</button>\n`);
});

test("quantity controls without a reason match today's markup", () => {
  const reasons = [undefined, null, "", false];
  for (const context of quantityContexts) {
    for (const disabledReason of reasons) {
      const data = { ...context };
      if (disabledReason !== undefined) data.disabledReason = disabledReason;
      assert.equal(render(quantityTemplate, data, helpers), render(quantityBaseline, data, helpers), JSON.stringify(data));
    }
  }
});

test("quantity controls with a reason disable every button and explain why", () => {
  const html = render(quantityTemplate, {
    action: "adjustCartQuantity",
    clearAction: "adjustCartQuantity",
    name: "Rope",
    quantity: 2,
    increaseEnabled: false,
    cartType: "buy",
    disabledReason: "Checkout in progress\nWait for the cart to finish."
  }, helpers);
  assert.equal(html.match(/aria-disabled="true"/g).length, 3);
  assert.equal(html.match(/data-tooltip="&lt;strong&gt;Checkout in progress&lt;\/strong&gt;&lt;br&gt;Wait for the cart to finish\."/g).length, 3);
  assert.equal(html.includes("disabled disabled"), false);
  assert.match(html, /aria-label="Decrease Rope quantity" title="Decrease Rope quantity" disabled aria-disabled="true"/);
  assert.match(html, /aria-label="Increase Rope quantity"[^>]*disabled aria-disabled="true"/);
  assert.match(html, /aria-label="Remove Rope from cart"[^>]*disabled aria-disabled="true"/);
});

test("setDisabled toggles the tooltip and is idempotent", () => {
  const element = control();
  const enabled = element.snapshot();
  setDisabled(element, null);
  setDisabled(element, "");
  assert.deepEqual(element.snapshot(), enabled);

  setDisabled(element, "Need more coin\nThe purse is short.");
  const disabled = element.snapshot();
  assert.equal(element.disabled, true);
  assert.equal(element.getAttribute("disabled"), "");
  assert.equal(element.getAttribute("aria-disabled"), "true");
  assert.equal(element.getAttribute("data-tooltip"), "<strong>Need more coin</strong><br>The purse is short.");
  setDisabled(element, "Need more coin\nThe purse is short.");
  assert.deepEqual(element.snapshot(), disabled);

  setDisabled(element, 'Tom & Jerry say "no"\nPrice < 5');
  assert.equal(element.getAttribute("data-tooltip"), '<strong>Tom &amp; Jerry say "no"</strong><br>Price &lt; 5');

  setDisabled(element, null);
  assert.deepEqual(element.snapshot(), enabled);
  setDisabled(element, "");
  assert.deepEqual(element.snapshot(), enabled);
  setDisabled(element, "   \n  ");
  assert.deepEqual(element.snapshot(), enabled);
  assert.equal(setDisabled(null, "Need more coin"), null);
});

test("disabled tooltip helper and public wiring", () => {
  assert.equal(disabledTooltip("Only title"), "<strong>Only title</strong>");
  assert.equal(disabledTooltip("  \n "), "");
  const registry = { calls: 0, registerHelper(name, helper) { this.calls += 1; this.name = name; this.helper = helper; if (this.calls > 1) throw new Error("duplicate"); } };
  registerDisabledTooltipHelper(registry);
  registerDisabledTooltipHelper(registry);
  assert.equal(registry.calls, 2);
  assert.equal(registry.name, "mlDisabledTooltip");
  assert.equal(registry.helper("Closed\nCome back later."), "<strong>Closed</strong><br>Come back later.");
  const previousHandlebars = globalThis.Handlebars;
  const previousFoundry = globalThis.foundry;
  delete globalThis.Handlebars;
  delete globalThis.foundry;
  try { registerDisabledTooltipHelper(); }
  finally {
    if (previousHandlebars === undefined) delete globalThis.Handlebars;
    else globalThis.Handlebars = previousHandlebars;
    if (previousFoundry === undefined) delete globalThis.foundry;
    else globalThis.foundry = previousFoundry;
  }

  const main = read("scripts/main.js");
  assert.match(main, /registerDisabledTooltipHelper\(\)/);
  assert.match(main, /setDisabled,/);
  assert.match(read("MORELORD-BRAND-GUIDE.md"), /## Disabled buttons say why/);
  assert.match(read("release-notes/RELEASE-NOTES-0.9.0.md"), /# Morelord Core 0\.9\.0[\s\S]*setDisabled/);
});
