/* @ds-bundle: {"format":3,"namespace":"BiasharaPOSDesignSystem_62a86f","components":[{"name":"MetricCard","sourcePath":"components/app/MetricCard.jsx"},{"name":"ProductTile","sourcePath":"components/app/ProductTile.jsx"},{"name":"Tabs","sourcePath":"components/app/Tabs.jsx"},{"name":"Badge","sourcePath":"components/core/Badge.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Card","sourcePath":"components/core/Card.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"Switch","sourcePath":"components/forms/Switch.jsx"},{"name":"Icon","sourcePath":"components/icons/Icon.jsx"}],"sourceHashes":{"components/app/MetricCard.jsx":"4dfb1bec7288","components/app/ProductTile.jsx":"5b907764e38b","components/app/Tabs.jsx":"89776a95996a","components/core/Badge.jsx":"072c9cf69c84","components/core/Button.jsx":"c1f38d714ae8","components/core/Card.jsx":"36794551eace","components/forms/Input.jsx":"10197583e4c8","components/forms/Switch.jsx":"8382350b6930","components/icons/Icon.jsx":"9b3038b57d94","design_handoff_biashara_pos/device-ui/device.js":"c86a60dd4f44","design_handoff_biashara_pos/restaurant-bar/rms.js":"cf77b1086e3d","device-ui/device.js":"c86a60dd4f44","restaurant-bar/rms.js":"cf77b1086e3d","ui_kits/pos-app/app.kit.js":"b45d73ea81cb","ui_kits/pos-app/tweaks-panel.jsx":"6591467622ed","waiter-app/android-frame.jsx":"70c8c3059eeb","waiter-app/app.jsx":"45beab5baad5","waiter-app/data.js":"b375b4a76bd8","waiter-app/screens-core.jsx":"6da4e9c4e177","waiter-app/screens-order.jsx":"2f8b85cd73be","waiter-app/tweaks-panel.jsx":"6591467622ed","waiter-app/ui.jsx":"f62151a8aaaa"},"inlinedExternals":[],"unexposedExports":[{"name":"iconNames","sourcePath":"components/icons/Icon.jsx"}]} */

(() => {

const __ds_ns = (window.BiasharaPOSDesignSystem_62a86f = window.BiasharaPOSDesignSystem_62a86f || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/app/MetricCard.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * BiasharaPOS MetricCard — a single dashboard KPI tile. The number
 * takes the tone color; an optional sub-line carries context.
 */
function MetricCard({
  value,
  label,
  sub,
  tone = "default",
  style,
  ...rest
}) {
  injectMetricStyles();
  return /*#__PURE__*/React.createElement("div", _extends({
    className: `bp-metric bp-metric--${tone}`,
    style: style
  }, rest), /*#__PURE__*/React.createElement("div", {
    className: "bp-metric__num"
  }, value), /*#__PURE__*/React.createElement("div", {
    className: "bp-metric__lbl"
  }, label), sub ? /*#__PURE__*/React.createElement("div", {
    className: "bp-metric__sub"
  }, sub) : null);
}
function injectMetricStyles() {
  if (typeof document === "undefined" || document.getElementById("bp-metric-styles")) return;
  const el = document.createElement("style");
  el.id = "bp-metric-styles";
  el.textContent = `
.bp-metric{background:var(--surface-card);border:var(--bw-hair) solid var(--border-subtle);
  border-radius:var(--r-sm);padding:16px;font-family:var(--font-sans);}
.bp-metric__num{font-size:24px;font-weight:var(--fw-heavy);letter-spacing:var(--ls-heading);color:var(--ink);line-height:1.1;}
.bp-metric__lbl{font-size:var(--fs-sm);color:var(--text-muted);margin-top:4px;}
.bp-metric__sub{font-size:var(--fs-sm);font-weight:var(--fw-semibold);color:var(--green-d);margin-top:3px;}
.bp-metric--green .bp-metric__num{color:var(--green-d);}
.bp-metric--blue .bp-metric__num{color:var(--blue-d);}
.bp-metric--amber .bp-metric__num{color:var(--amber);}
.bp-metric--red .bp-metric__num{color:var(--red);}
`;
  document.head.appendChild(el);
}
Object.assign(__ds_scope, { MetricCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/app/MetricCard.jsx", error: String((e && e.message) || e) }); }

// components/app/ProductTile.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * BiasharaPOS ProductTile — a tappable product on the Make-a-Sale
 * grid. Shows name, price and stock; dims when out of stock and
 * flags a gold border when stock is low.
 */
function ProductTile({
  name,
  price,
  stock,
  lowStock = false,
  outOfStock = false,
  onClick,
  style,
  ...rest
}) {
  injectTileStyles();
  const cls = ["bp-tile", lowStock && !outOfStock ? "bp-tile--low" : "", outOfStock ? "bp-tile--out" : ""].filter(Boolean).join(" ");
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    className: cls,
    onClick: outOfStock ? undefined : onClick,
    disabled: outOfStock,
    style: style
  }, rest), /*#__PURE__*/React.createElement("span", {
    className: "bp-tile__name"
  }, name), /*#__PURE__*/React.createElement("span", {
    className: "bp-tile__price"
  }, price), stock != null ? /*#__PURE__*/React.createElement("span", {
    className: "bp-tile__stock"
  }, outOfStock ? "Out of stock" : `${stock} in stock`) : null);
}
function injectTileStyles() {
  if (typeof document === "undefined" || document.getElementById("bp-tile-styles")) return;
  const el = document.createElement("style");
  el.id = "bp-tile-styles";
  el.textContent = `
.bp-tile{display:flex;flex-direction:column;align-items:center;gap:4px;text-align:center;
  background:var(--surface);border:var(--bw) solid var(--border-subtle);border-radius:var(--r-sm);
  padding:14px 12px;cursor:pointer;font-family:var(--font-sans);width:100%;
  transition:transform var(--dur-fast) var(--ease),box-shadow var(--dur) var(--ease),border-color var(--dur) var(--ease);}
.bp-tile:hover{border-color:var(--blue);box-shadow:0 4px 12px rgba(15,93,164,.12);transform:translateY(-1px);}
.bp-tile:active{transform:translateY(0);}
.bp-tile__name{font-size:var(--fs-sm);font-weight:var(--fw-semibold);color:var(--ink);line-height:1.25;}
.bp-tile__price{font-size:15px;font-weight:var(--fw-bold);color:var(--blue);}
.bp-tile__stock{font-size:var(--fs-xs);color:var(--text-muted);}
.bp-tile--low{border-color:var(--gold);}
.bp-tile--low .bp-tile__stock{color:var(--amber);font-weight:var(--fw-semibold);}
.bp-tile--out{opacity:.5;cursor:not-allowed;}
.bp-tile--out:hover{border-color:var(--border-subtle);box-shadow:none;transform:none;}
`;
  document.head.appendChild(el);
}
Object.assign(__ds_scope, { ProductTile });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/app/ProductTile.jsx", error: String((e && e.message) || e) }); }

// components/app/Tabs.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * BiasharaPOS Tabs — the horizontal, scrollable tab bar that drives
 * the app's main navigation. Active tab is blue with an underline.
 */
function Tabs({
  items = [],
  value,
  onChange,
  style,
  ...rest
}) {
  injectTabStyles();
  return /*#__PURE__*/React.createElement("div", _extends({
    className: "bp-tabs",
    role: "tablist",
    style: style
  }, rest), items.map(it => {
    const active = it.id === value;
    return /*#__PURE__*/React.createElement("button", {
      key: it.id,
      role: "tab",
      "aria-selected": active,
      className: `bp-tab${active ? " is-active" : ""}`,
      onClick: () => onChange && onChange(it.id)
    }, it.icon ? /*#__PURE__*/React.createElement("span", {
      className: "bp-tab__ic"
    }, it.icon) : null, it.label);
  }));
}
function injectTabStyles() {
  if (typeof document === "undefined" || document.getElementById("bp-tabs-styles")) return;
  const el = document.createElement("style");
  el.id = "bp-tabs-styles";
  el.textContent = `
.bp-tabs{display:flex;background:var(--surface);border-bottom:var(--bw-strong) solid var(--border-subtle);
  overflow-x:auto;font-family:var(--font-sans);}
.bp-tab{display:inline-flex;align-items:center;gap:7px;padding:12px 20px;font-size:var(--fs-sm);
  font-weight:var(--fw-medium);color:var(--text-muted);background:none;border:none;cursor:pointer;
  border-bottom:var(--bw-strong) solid transparent;margin-bottom:-2px;white-space:nowrap;
  transition:color var(--dur-fast) var(--ease),background var(--dur-fast) var(--ease);}
.bp-tab:hover:not(.is-active){color:var(--ink);background:var(--bg);}
.bp-tab.is-active{color:var(--blue);border-bottom-color:var(--blue);font-weight:var(--fw-semibold);}
.bp-tab__ic{display:inline-flex;font-size:15px;line-height:1;}
`;
  document.head.appendChild(el);
}
Object.assign(__ds_scope, { Tabs });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/app/Tabs.jsx", error: String((e && e.message) || e) }); }

// components/core/Badge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * BiasharaPOS Badge — a small status pill. Tints match the semantic
 * color system (success / info / warning / danger / neutral).
 */
function Badge({
  children,
  tone = "neutral",
  dot = false,
  ...rest
}) {
  injectBadgeStyles();
  return /*#__PURE__*/React.createElement("span", _extends({
    className: `bp-badge bp-badge--${tone}`
  }, rest), dot ? /*#__PURE__*/React.createElement("span", {
    className: "bp-badge__dot"
  }) : null, children);
}
function injectBadgeStyles() {
  if (typeof document === "undefined" || document.getElementById("bp-badge-styles")) return;
  const el = document.createElement("style");
  el.id = "bp-badge-styles";
  el.textContent = `
.bp-badge{display:inline-flex;align-items:center;gap:6px;font-family:var(--font-sans);
  font-size:var(--fs-xs);font-weight:var(--fw-bold);padding:4px 10px;border-radius:var(--r-pill);
  letter-spacing:.01em;line-height:1.4;white-space:nowrap;}
.bp-badge__dot{width:6px;height:6px;border-radius:var(--r-pill);background:currentColor;}
.bp-badge--success{background:var(--success-bg);color:var(--green-dd);}
.bp-badge--info{background:var(--info-bg);color:var(--blue-dd);}
.bp-badge--warning{background:var(--warning-bg);color:var(--amber);}
.bp-badge--danger{background:var(--danger-bg);color:var(--red);}
.bp-badge--neutral{background:var(--tint);color:var(--ink-2);}
.bp-badge--brand{background:var(--blue);color:#fff;}
`;
  document.head.appendChild(el);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Badge.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * BiasharaPOS Button — the brand's primary action control.
 * Green = commit (charge / save), blue = navigate, ghost = secondary,
 * white = on a colored band. Lifts 2px on hover.
 */
function Button({
  children,
  variant = "primary",
  size = "md",
  type = "button",
  disabled = false,
  fullWidth = false,
  leadingIcon = null,
  trailingIcon = null,
  onClick,
  ...rest
}) {
  injectButtonStyles();
  const cls = ["bp-btn", `bp-btn--${variant}`, `bp-btn--${size}`, fullWidth ? "bp-btn--full" : ""].filter(Boolean).join(" ");
  return /*#__PURE__*/React.createElement("button", _extends({
    type: type,
    className: cls,
    disabled: disabled,
    onClick: onClick
  }, rest), leadingIcon ? /*#__PURE__*/React.createElement("span", {
    className: "bp-btn__ic"
  }, leadingIcon) : null, /*#__PURE__*/React.createElement("span", null, children), trailingIcon ? /*#__PURE__*/React.createElement("span", {
    className: "bp-btn__ic"
  }, trailingIcon) : null);
}
function injectButtonStyles() {
  if (typeof document === "undefined" || document.getElementById("bp-btn-styles")) return;
  const el = document.createElement("style");
  el.id = "bp-btn-styles";
  el.textContent = `
.bp-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;font-family:var(--font-sans);
  font-weight:var(--fw-bold);border-radius:var(--r-sm);border:var(--bw) solid transparent;cursor:pointer;
  white-space:nowrap;transition:transform var(--dur-fast) var(--ease),box-shadow var(--dur) var(--ease),background var(--dur) var(--ease),border-color var(--dur) var(--ease);}
.bp-btn__ic{display:inline-flex;align-items:center;}
.bp-btn__ic svg{width:1.1em;height:1.1em;display:block;}
.bp-btn--full{width:100%;}
.bp-btn--sm{font-size:var(--fs-sm);padding:8px 14px;}
.bp-btn--md{font-size:var(--fs-body-lg);padding:13px 22px;}
.bp-btn--lg{font-size:17px;padding:15px 28px;}
.bp-btn--primary{background:var(--action-primary);color:#fff;box-shadow:var(--sh-cta);}
.bp-btn--primary:hover{background:var(--action-primary-hover);transform:var(--lift);box-shadow:0 14px 28px -10px rgba(35,155,70,.7);}
.bp-btn--secondary{background:var(--blue);color:#fff;box-shadow:0 8px 20px -8px rgba(15,93,164,.55);}
.bp-btn--secondary:hover{background:var(--blue-d);transform:var(--lift);}
.bp-btn--ghost{background:var(--surface);color:var(--ink);border-color:var(--line-2);}
.bp-btn--ghost:hover{border-color:var(--ink-3);transform:var(--lift);}
.bp-btn--white{background:#fff;color:var(--green-dd);}
.bp-btn--white:hover{transform:var(--lift);box-shadow:var(--sh-md);}
.bp-btn--danger{background:var(--red);color:#fff;}
.bp-btn--danger:hover{filter:brightness(.94);transform:var(--lift);}
.bp-btn:active{transform:translateY(0);}
.bp-btn:disabled{opacity:.5;cursor:not-allowed;transform:none;box-shadow:none;}
.bp-btn:focus-visible{outline:2px solid var(--focus-ring);outline-offset:2px;}
`;
  document.head.appendChild(el);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * BiasharaPOS Card — the standard white surface: hairline border,
 * 16px radius, optional uppercase title and hover lift.
 */
function Card({
  children,
  title,
  action,
  hover = false,
  padding = 18,
  style,
  ...rest
}) {
  injectCardStyles();
  return /*#__PURE__*/React.createElement("div", _extends({
    className: `bp-card${hover ? " bp-card--hover" : ""}`,
    style: {
      padding,
      ...style
    }
  }, rest), title || action ? /*#__PURE__*/React.createElement("div", {
    className: "bp-card__head"
  }, title ? /*#__PURE__*/React.createElement("div", {
    className: "bp-card__title"
  }, title) : /*#__PURE__*/React.createElement("span", null), action ? /*#__PURE__*/React.createElement("div", {
    className: "bp-card__action"
  }, action) : null) : null, children);
}
function injectCardStyles() {
  if (typeof document === "undefined" || document.getElementById("bp-card-styles")) return;
  const el = document.createElement("style");
  el.id = "bp-card-styles";
  el.textContent = `
.bp-card{background:var(--surface-card);border:var(--bw-hair) solid var(--border-subtle);
  border-radius:var(--r);transition:transform var(--dur-fast) var(--ease),box-shadow var(--dur) var(--ease);}
.bp-card--hover:hover{transform:translateY(-4px);box-shadow:var(--sh-md);}
.bp-card__head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px;}
.bp-card__title{font-family:var(--font-sans);font-size:var(--fs-xs);font-weight:var(--fw-semibold);
  color:var(--text-muted);text-transform:uppercase;letter-spacing:var(--ls-caps);}
`;
  document.head.appendChild(el);
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Card.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * BiasharaPOS Input — labelled text field with optional hint, error
 * state, and a leading prefix (e.g. "TZS" or "+255").
 */
function Input({
  label,
  hint,
  error,
  prefix,
  id,
  type = "text",
  style,
  ...rest
}) {
  injectInputStyles();
  const fieldId = id || `bp-in-${Math.random().toString(36).slice(2, 8)}`;
  return /*#__PURE__*/React.createElement("div", {
    className: "bp-field",
    style: style
  }, label ? /*#__PURE__*/React.createElement("label", {
    className: "bp-field__label",
    htmlFor: fieldId
  }, label) : null, /*#__PURE__*/React.createElement("div", {
    className: `bp-field__control${error ? " is-error" : ""}${prefix ? " has-prefix" : ""}`
  }, prefix ? /*#__PURE__*/React.createElement("span", {
    className: "bp-field__prefix"
  }, prefix) : null, /*#__PURE__*/React.createElement("input", _extends({
    id: fieldId,
    type: type,
    className: "bp-field__input"
  }, rest))), error ? /*#__PURE__*/React.createElement("div", {
    className: "bp-field__msg is-error"
  }, error) : hint ? /*#__PURE__*/React.createElement("div", {
    className: "bp-field__msg"
  }, hint) : null);
}
function injectInputStyles() {
  if (typeof document === "undefined" || document.getElementById("bp-input-styles")) return;
  const el = document.createElement("style");
  el.id = "bp-input-styles";
  el.textContent = `
.bp-field{display:flex;flex-direction:column;gap:6px;font-family:var(--font-sans);}
.bp-field__label{font-size:var(--fs-sm);font-weight:var(--fw-medium);color:var(--text-muted);}
.bp-field__control{display:flex;align-items:center;background:var(--surface);
  border:var(--bw) solid var(--border-strong);border-radius:var(--r-sm);overflow:hidden;
  transition:border-color var(--dur-fast) var(--ease),box-shadow var(--dur-fast) var(--ease);}
.bp-field__control:focus-within{border-color:var(--focus-ring);box-shadow:0 0 0 3px var(--green-50);}
.bp-field__control.is-error{border-color:var(--red);}
.bp-field__control.is-error:focus-within{box-shadow:0 0 0 3px var(--red-50);}
.bp-field__prefix{padding:0 0 0 13px;font-size:var(--fs-body);font-weight:var(--fw-bold);color:var(--text-muted);}
.bp-field__input{flex:1;border:none;outline:none;background:transparent;font-family:inherit;
  font-size:var(--fs-body);color:var(--ink);padding:10px 14px;min-width:0;}
.bp-field__input::placeholder{color:var(--ink-3);}
.bp-field__msg{font-size:var(--fs-sm);color:var(--text-muted);}
.bp-field__msg.is-error{color:var(--red);}
`;
  document.head.appendChild(el);
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/forms/Switch.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * BiasharaPOS Switch — the on/off toggle used for VAT-inclusive,
 * offline-sync and feature flags. Turns green when on.
 */
function Switch({
  checked,
  onChange,
  label,
  disabled = false,
  id,
  ...rest
}) {
  injectSwitchStyles();
  const sid = id || `bp-sw-${Math.random().toString(36).slice(2, 8)}`;
  return /*#__PURE__*/React.createElement("label", {
    className: `bp-switch${disabled ? " is-disabled" : ""}`,
    htmlFor: sid
  }, /*#__PURE__*/React.createElement("span", {
    className: "bp-switch__track"
  }, /*#__PURE__*/React.createElement("input", _extends({
    id: sid,
    type: "checkbox",
    role: "switch",
    checked: !!checked,
    disabled: disabled,
    onChange: e => onChange && onChange(e.target.checked, e)
  }, rest)), /*#__PURE__*/React.createElement("span", {
    className: "bp-switch__thumb"
  })), label ? /*#__PURE__*/React.createElement("span", {
    className: "bp-switch__label"
  }, label) : null);
}
function injectSwitchStyles() {
  if (typeof document === "undefined" || document.getElementById("bp-switch-styles")) return;
  const el = document.createElement("style");
  el.id = "bp-switch-styles";
  el.textContent = `
.bp-switch{display:inline-flex;align-items:center;gap:10px;font-family:var(--font-sans);cursor:pointer;}
.bp-switch.is-disabled{opacity:.5;cursor:not-allowed;}
.bp-switch__track{position:relative;width:38px;height:22px;flex:none;}
.bp-switch__track input{position:absolute;opacity:0;width:100%;height:100%;margin:0;cursor:inherit;}
.bp-switch__thumb{position:absolute;inset:0;background:var(--line-2);border-radius:var(--r-pill);
  transition:background var(--dur) var(--ease);}
.bp-switch__thumb::before{content:"";position:absolute;top:3px;left:3px;width:16px;height:16px;
  background:#fff;border-radius:var(--r-pill);box-shadow:var(--sh-sm);transition:transform var(--dur) var(--ease);}
.bp-switch__track input:checked + .bp-switch__thumb{background:var(--green);}
.bp-switch__track input:checked + .bp-switch__thumb::before{transform:translateX(16px);}
.bp-switch__track input:focus-visible + .bp-switch__thumb{outline:2px solid var(--focus-ring);outline-offset:2px;}
.bp-switch__label{font-size:var(--fs-sm);font-weight:var(--fw-medium);color:var(--ink-2);}
`;
  document.head.appendChild(el);
}
Object.assign(__ds_scope, { Switch });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Switch.jsx", error: String((e && e.message) || e) }); }

// components/icons/Icon.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * BiasharaPOS Icon — the brand's own line-icon set, drawn to match
 * Plus Jakarta Sans: a 24×24 grid, even ~1.9px stroke, round caps and
 * joins, gently rounded corners. Stroke-only, inherits currentColor.
 */
function Icon({
  name,
  size = 24,
  strokeWidth = 1.9,
  title,
  style,
  ...rest
}) {
  const path = BP_ICONS[name];
  return /*#__PURE__*/React.createElement("svg", _extends({
    className: "bp-icon",
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: strokeWidth,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    role: title ? "img" : "presentation",
    "aria-label": title || undefined,
    "aria-hidden": title ? undefined : true,
    style: {
      display: "block",
      flex: "none",
      ...style
    },
    dangerouslySetInnerHTML: {
      __html: (title ? `<title>${title}</title>` : "") + (path || "")
    }
  }, rest));
}

/** Names available on <Icon name="…" />. */
const iconNames = ["dashboard", "sale", "products", "inventory", "expenses", "report", "analytics", "barcode", "users", "shifts", "bell", "search", "settings", "logout", "plus", "check", "checkCircle", "chevronRight", "sparkle", "store"];
const BP_ICONS = {
  dashboard: '<rect x="3" y="3" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="2"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2"/>',
  sale: '<circle cx="9.5" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/><path d="M3 4h2.2l2.2 11a1.4 1.4 0 0 0 1.4 1.1h8.1a1.4 1.4 0 0 0 1.4-1.1L20.5 8H6.2"/>',
  products: '<path d="M12 3 4 7.3v9.4L12 21l8-4.3V7.3L12 3z"/><path d="M4 7.3 12 12l8-4.7"/><path d="M12 12v9"/>',
  inventory: '<rect x="8" y="3" width="8" height="7.5" rx="1.6"/><rect x="3" y="13" width="8" height="7.5" rx="1.6"/><rect x="13" y="13" width="8" height="7.5" rx="1.6"/>',
  expenses: '<ellipse cx="12" cy="6.5" rx="7" ry="3.1"/><path d="M5 6.5v5.5c0 1.7 3.1 3.1 7 3.1s7-1.4 7-3.1V6.5"/><path d="M5 12v5.5c0 1.7 3.1 3.1 7 3.1s7-1.4 7-3.1V12"/>',
  report: '<path d="M6.5 3h11a1 1 0 0 1 1 1v17l-2.7-1.8L13 21l-2.8-1.8L7.5 21 4.8 19.2A1 1 0 0 1 4.5 18.4V4a1 1 0 0 1 1-1z"/><path d="M9 8.5h6"/><path d="M9 12.5h6"/>',
  analytics: '<path d="M4 4v15a1 1 0 0 0 1 1h15"/><path d="m7.5 15.5 3.2-4.2 3 2.4L19 7.5"/>',
  barcode: '<path d="M4 6v12"/><path d="M7.5 6v12"/><path d="M11 6v12"/><path d="M14 6v12"/><path d="M17 6v12"/><path d="M20 6v12"/>',
  users: '<circle cx="9.5" cy="8" r="3.3"/><path d="M3.5 20a6 6 0 0 1 12 0"/><path d="M16.5 5.2a3.3 3.3 0 0 1 0 6.1"/><path d="M21 20a6 6 0 0 0-3.5-5.4"/>',
  shifts: '<path d="M20 11A8 8 0 1 0 18 16.5"/><path d="M20 5v5h-5"/><path d="M12 8v4l2.5 2"/>',
  bell: '<path d="M18 8.5a6 6 0 0 0-12 0c0 6.5-2.5 8.5-2.5 8.5h17S18 15 18 8.5z"/><path d="M13.7 20.5a2 2 0 0 1-3.4 0"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-3.8-3.8"/>',
  settings: '<path d="M4 7h8"/><path d="M16 7h4"/><circle cx="14" cy="7" r="2"/><path d="M4 17h4"/><path d="M12 17h8"/><circle cx="10" cy="17" r="2"/>',
  logout: '<path d="M14 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4"/><path d="M4 12h11"/><path d="m11 8 4 4-4 4"/>',
  plus: '<path d="M12 5v14"/><path d="M5 12h14"/>',
  check: '<path d="m5 13 4 4L19 7"/>',
  checkCircle: '<circle cx="12" cy="12" r="9"/><path d="m8.3 12 2.6 2.6 4.8-5.4"/>',
  chevronRight: '<path d="m9 6 6 6-6 6"/>',
  sparkle: '<path d="M12 3.5l1.9 5.4 5.4 1.9-5.4 1.9L12 18.1l-1.9-5.4L4.7 10.8l5.4-1.9z"/><path d="M19 16.5l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z"/>',
  store: '<path d="M4 9.5 5.2 5h13.6L20 9.5"/><path d="M4 9.5a2.2 2.2 0 0 0 4 0 2.2 2.2 0 0 0 4 0 2.2 2.2 0 0 0 4 0 2.2 2.2 0 0 0 4 0"/><path d="M5 11v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-8"/><path d="M9.5 20v-4.5h5V20"/>'
};
Object.assign(__ds_scope, { Icon, iconNames });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/icons/Icon.jsx", error: String((e && e.message) || e) }); }

// design_handoff_biashara_pos/device-ui/device.js
try { (() => {
/* BiasharaPOS device-UI runtime: fits the fixed .stage to the viewport
   and renders the shared left nav rail from one definition. */
(function () {
  // ---- nav rail (single source of truth) ----
  var ICON = {
    sell: '<circle cx="9.5" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/><path d="M3 4h2.2l2.2 11a1.4 1.4 0 0 0 1.4 1.1h8.1a1.4 1.4 0 0 0 1.4-1.1L20.5 8H6.2"/>',
    home: '<rect x="3" y="3" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="2"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2"/>',
    products: '<path d="M12 3 4 7.3v9.4L12 21l8-4.3V7.3L12 3z"/><path d="M4 7.3 12 12l8-4.7"/><path d="M12 12v9"/>',
    inventory: '<rect x="8" y="3" width="8" height="7.5" rx="1.6"/><rect x="3" y="13" width="8" height="7.5" rx="1.6"/><rect x="13" y="13" width="8" height="7.5" rx="1.6"/>',
    promotions: '<path d="M20.5 13.5 13 21a2 2 0 0 1-2.8 0l-6.7-6.7a2 2 0 0 1-.5-1.9L4 5.2A1.5 1.5 0 0 1 5.2 4l7.2-1a2 2 0 0 1 1.9.5l6.2 6.2a2 2 0 0 1 0 2.8z"/><circle cx="8.5" cy="8.5" r="1.3"/>',
    purchasing: '<path d="M3 6.5h11v8H3z"/><path d="M14 9h3.5l3 3v2.5H14z"/><circle cx="7" cy="17.5" r="1.7"/><circle cx="17.5" cy="17.5" r="1.7"/>',
    reports: '<path d="M6.5 3h11a1 1 0 0 1 1 1v17l-2.7-1.8L13 21l-2.8-1.8L7.5 21 4.8 19.2A1 1 0 0 1 4.5 18.4V4a1 1 0 0 1 1-1z"/><path d="M9 8.5h6"/><path d="M9 12.5h6"/>',
    expenses: '<ellipse cx="12" cy="6.5" rx="7" ry="3.1"/><path d="M5 6.5v5.5c0 1.7 3.1 3.1 7 3.1s7-1.4 7-3.1V6.5"/><path d="M5 12v5.5c0 1.7 3.1 3.1 7 3.1s7-1.4 7-3.1V12"/>',
    orders: '<path d="M6 8h12l-1 11.4a1 1 0 0 1-1 .9H8a1 1 0 0 1-1-.9z"/><path d="M9 8V6.4a3 3 0 0 1 6 0V8"/>',
    settings: '<path d="M4 7h8"/><path d="M16 7h4"/><circle cx="14" cy="7" r="2"/><path d="M4 17h4"/><path d="M12 17h8"/><circle cx="10" cy="17" r="2"/>',
    shift: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    light: '<circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.2M12 19.3v2.2M4.5 4.5l1.6 1.6M17.9 17.9l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.5 19.5l1.6-1.6M17.9 6.1l1.6-1.6"/>',
    dark: '<path d="M20 13.5A8 8 0 1 1 10.5 4a6.3 6.3 0 0 0 9.5 9.5z"/>',
    system: '<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M9 21h6M12 17v4"/>'
  };
  var GROUPS = [['Till', [['sell', 'Sell'], ['orders', 'Orders']]], ['Catalog', [['products', 'Products'], ['inventory', 'Inventory'], ['promotions', 'Promos']]], ['Supply', [['purchasing', 'Buying'], ['expenses', 'Expenses']]], ['Insights', [['home', 'Dashboard'], ['reports', 'Reports']]]];
  var HREF = {
    sell: 'Sell - Retail tablet.html',
    orders: 'Online Orders.html',
    home: 'Dashboard.html',
    products: 'Products.html',
    inventory: 'Inventory.html',
    promotions: 'Promotions.html',
    purchasing: 'Purchasing.html',
    reports: 'VAT Report.html',
    expenses: 'Expenses.html',
    settings: 'Settings.html',
    shift: 'Shift.html'
  };
  function svg(inner) {
    return '<svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + inner + '</svg>';
  }
  function item(key, label, active) {
    var inner = svg(ICON[key]) + '<span class="rl">' + label + '</span>';
    var cls = 'rail-item' + (key === active ? ' active' : '');
    return HREF[key] ? '<a class="' + cls + '" href="' + HREF[key] + '">' + inner + '</a>' : '<button class="' + cls + '">' + inner + '</button>';
  }
  function renderRail() {
    var nav = document.querySelector('nav.rail[data-active]');
    if (!nav) return;
    var active = nav.getAttribute('data-active');
    var html = '<a class="rail-logo" href="' + (HREF.home || '#') + '" title="BiasharaPOS"><img src="logo-badge.png" alt="BiasharaPOS"></a>';
    html += '<div class="rail-scroll">';
    GROUPS.forEach(function (g) {
      html += '<div class="rail-group"><div class="rail-glabel">' + g[0] + '</div>';
      g[1].forEach(function (it) {
        html += item(it[0], it[1], active);
      });
      html += '</div>';
    });
    html += '</div>';
    html += '<div class="rail-foot"><div class="rail-glabel">System</div>' + item('shift', 'Shift', active) + themeBtn() + item('settings', 'Settings', active) + '</div>';
    nav.innerHTML = html;
  }

  // ---- theme (Light / Dark / Auto) ----
  var MODES = ['light', 'dark', 'system'];
  var MODE_LABEL = {
    light: 'Light',
    dark: 'Dark',
    system: 'Auto'
  };
  function mode() {
    var m = null;
    try {
      m = localStorage.getItem('bp-theme');
    } catch (e) {}
    return MODES.indexOf(m) >= 0 ? m : 'system';
  }
  function resolved(m) {
    if (m === 'system') {
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return m;
  }
  function applyTheme() {
    document.documentElement.setAttribute('data-theme', resolved(mode()));
  }
  function themeBtn() {
    var m = mode();
    return '<button class="rail-item" onclick="__bpTheme.cycle()" title="Theme: ' + MODE_LABEL[m] + '">' + svg(ICON[m]) + '<span class="rl">' + MODE_LABEL[m] + '</span></button>';
  }
  window.__bpTheme = {
    cycle: function () {
      var next = MODES[(MODES.indexOf(mode()) + 1) % MODES.length];
      try {
        localStorage.setItem('bp-theme', next);
      } catch (e) {}
      applyTheme();
      renderRail();
    }
  };
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () {
      if (mode() === 'system') applyTheme();
    });
  }

  // ---- brand splash (official logo) on every app load ----
  function splash() {
    if (document.querySelector('.bp-splash')) return;
    var s = document.createElement('div');
    s.className = 'bp-splash';
    s.innerHTML = '<img src="logo-full.png" alt="BiasharaPOS — Smart Business. Seamless Sales." />' + '<div class="bp-splash-load"><span></span></div>';
    (document.body || document.documentElement).appendChild(s);
    setTimeout(function () {
      s.classList.add('hide');
    }, 1100);
    setTimeout(function () {
      if (s.parentNode) s.parentNode.removeChild(s);
    }, 1700);
  }

  // ---- scale the fixed stage to fit ----
  function fit() {
    var stage = document.querySelector('.stage');
    var scaler = document.getElementById('scaler');
    if (!stage || !scaler) return;
    var s = Math.min(window.innerWidth / stage.offsetWidth, window.innerHeight / stage.offsetHeight);
    scaler.style.transform = 'scale(' + s + ')';
  }
  applyTheme();
  splash();
  renderRail();
  window.addEventListener('resize', fit);
  window.addEventListener('load', fit);
  fit();
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "design_handoff_biashara_pos/device-ui/device.js", error: String((e && e.message) || e) }); }

// design_handoff_biashara_pos/restaurant-bar/rms.js
try { (() => {
/* BiasharaPOS — Restaurant & Bar module runtime.
   Fits the fixed .stage to the viewport, renders the floor-service nav rail
   from one definition, and injects the brand splash. Self-contained. */
(function () {
  var ICON = {
    floor: '<rect x="3" y="3" width="7" height="7" rx="1.6"/><rect x="14" y="3" width="7" height="7" rx="1.6"/><rect x="3" y="14" width="7" height="7" rx="1.6"/><circle cx="17.5" cy="17.5" r="3.5"/>',
    tickets: '<path d="M6 3h12a1 1 0 0 1 1 1v17l-2.5-1.6L14 21l-2-1.4L10 21l-2.5-1.6L5 21V4a1 1 0 0 1 1-1z"/><path d="M9 8h6M9 12h6"/>',
    bar: '<path d="M5 4h14l-7 8z"/><path d="M12 12v6"/><path d="M8 21h8"/><path d="M14.5 7.5 18 4"/>',
    kitchen: '<path d="M8.5 3a3 3 0 0 1 7 0 3.2 3.2 0 0 1 2 5.6V14H6.5V8.6A3.2 3.2 0 0 1 8.5 3z"/><path d="M6.5 17.5h11M6.5 20.5h11"/>',
    menu: '<path d="M4 5a2 2 0 0 1 2-2h6v18H6a2 2 0 0 0-2 2z" /><path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 0-2 2h-6"/>',
    reports: '<path d="M5 21V9M12 21V4M19 21v-7"/>',
    settings: '<path d="M4 7h8"/><path d="M16 7h4"/><circle cx="14" cy="7" r="2"/><path d="M4 17h4"/><path d="M12 17h8"/><circle cx="10" cy="17" r="2"/>',
    light: '<circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.2M12 19.3v2.2M4.5 4.5l1.6 1.6M17.9 17.9l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.5 19.5l1.6-1.6M17.9 6.1l1.6-1.6"/>',
    dark: '<path d="M20 13.5A8 8 0 1 1 10.5 4a6.3 6.3 0 0 0 9.5 9.5z"/>',
    system: '<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M9 21h6M12 17v4"/>'
  };
  var GROUPS = [['Service', [['floor', 'Floor'], ['tickets', 'Tickets']]], ['Bar', [['bar', 'Bar']]], ['Kitchen', [['kitchen', 'Kitchen']]], ['Manage', [['menu', 'Menu'], ['reports', 'Reports']]]];
  var HREF = {
    floor: 'Floor Map.html',
    tickets: 'Order Ticket.html',
    bar: 'Bar Tab.html',
    kitchen: 'Kitchen Display.html'
    /* menu, reports: screens not built yet — rendered inert (no nav) */
  };
  function svg(inner) {
    return '<svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + inner + '</svg>';
  }
  function item(key, label, active) {
    var inner = svg(ICON[key]) + '<span class="rl">' + label + '</span>';
    var cls = 'rail-item' + (key === active ? ' active' : '');
    return HREF[key] ? '<a class="' + cls + '" href="' + HREF[key] + '">' + inner + '</a>' : '<button class="' + cls + '">' + inner + '</button>';
  }
  function renderRail() {
    var nav = document.querySelector('nav.rail[data-active]');
    if (!nav) return;
    var active = nav.getAttribute('data-active');
    var html = '<a class="rail-logo" href="' + (HREF.floor || '#') + '" title="BiasharaPOS"><img src="logo-badge.png" alt="BiasharaPOS"></a>';
    html += '<div class="rail-scroll">';
    GROUPS.forEach(function (g) {
      html += '<div class="rail-group"><div class="rail-glabel">' + g[0] + '</div>';
      g[1].forEach(function (it) {
        html += item(it[0], it[1], active);
      });
      html += '</div>';
    });
    html += '</div>';
    html += '<div class="rail-foot"><div class="rail-glabel">System</div>' + themeBtn() + item('settings', 'Settings', active) + '</div>';
    nav.innerHTML = html;
  }

  // ---- theme (Light / Dark / Auto) ----
  var MODES = ['light', 'dark', 'system'];
  var MODE_LABEL = {
    light: 'Light',
    dark: 'Dark',
    system: 'Auto'
  };
  function mode() {
    var m = null;
    try {
      m = localStorage.getItem('bp-theme');
    } catch (e) {}
    return MODES.indexOf(m) >= 0 ? m : 'system';
  }
  function resolved(m) {
    if (m === 'system') {
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return m;
  }
  function applyTheme() {
    document.documentElement.setAttribute('data-theme', resolved(mode()));
  }
  function themeBtn() {
    var m = mode();
    return '<button class="rail-item" onclick="__bpTheme.cycle()" title="Theme: ' + MODE_LABEL[m] + '">' + svg(ICON[m]) + '<span class="rl">' + MODE_LABEL[m] + '</span></button>';
  }
  window.__bpTheme = {
    cycle: function () {
      var next = MODES[(MODES.indexOf(mode()) + 1) % MODES.length];
      try {
        localStorage.setItem('bp-theme', next);
      } catch (e) {}
      applyTheme();
      renderRail();
    }
  };
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () {
      if (mode() === 'system') applyTheme();
    });
  }
  function splash() {
    if (document.querySelector('.bp-splash')) return;
    var s = document.createElement('div');
    s.className = 'bp-splash';
    s.innerHTML = '<img src="logo-full.png" alt="BiasharaPOS — Smart Business. Seamless Sales." />' + '<div class="bp-splash-load"><span></span></div>';
    (document.body || document.documentElement).appendChild(s);
    setTimeout(function () {
      s.classList.add('hide');
    }, 1100);
    setTimeout(function () {
      if (s.parentNode) s.parentNode.removeChild(s);
    }, 1700);
  }
  function fit() {
    var stage = document.querySelector('.stage');
    var scaler = document.getElementById('scaler');
    if (!stage || !scaler) return;
    var s = Math.min(window.innerWidth / stage.offsetWidth, window.innerHeight / stage.offsetHeight);
    scaler.style.transform = 'scale(' + s + ')';
  }
  applyTheme();
  splash();
  renderRail();
  window.addEventListener('resize', fit);
  window.addEventListener('load', fit);
  fit();
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "design_handoff_biashara_pos/restaurant-bar/rms.js", error: String((e && e.message) || e) }); }

// device-ui/device.js
try { (() => {
/* BiasharaPOS device-UI runtime: fits the fixed .stage to the viewport
   and renders the shared left nav rail from one definition. */
(function () {
  // ---- nav rail (single source of truth) ----
  var ICON = {
    sell: '<circle cx="9.5" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/><path d="M3 4h2.2l2.2 11a1.4 1.4 0 0 0 1.4 1.1h8.1a1.4 1.4 0 0 0 1.4-1.1L20.5 8H6.2"/>',
    home: '<rect x="3" y="3" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="2"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2"/>',
    products: '<path d="M12 3 4 7.3v9.4L12 21l8-4.3V7.3L12 3z"/><path d="M4 7.3 12 12l8-4.7"/><path d="M12 12v9"/>',
    inventory: '<rect x="8" y="3" width="8" height="7.5" rx="1.6"/><rect x="3" y="13" width="8" height="7.5" rx="1.6"/><rect x="13" y="13" width="8" height="7.5" rx="1.6"/>',
    promotions: '<path d="M20.5 13.5 13 21a2 2 0 0 1-2.8 0l-6.7-6.7a2 2 0 0 1-.5-1.9L4 5.2A1.5 1.5 0 0 1 5.2 4l7.2-1a2 2 0 0 1 1.9.5l6.2 6.2a2 2 0 0 1 0 2.8z"/><circle cx="8.5" cy="8.5" r="1.3"/>',
    purchasing: '<path d="M3 6.5h11v8H3z"/><path d="M14 9h3.5l3 3v2.5H14z"/><circle cx="7" cy="17.5" r="1.7"/><circle cx="17.5" cy="17.5" r="1.7"/>',
    reports: '<path d="M6.5 3h11a1 1 0 0 1 1 1v17l-2.7-1.8L13 21l-2.8-1.8L7.5 21 4.8 19.2A1 1 0 0 1 4.5 18.4V4a1 1 0 0 1 1-1z"/><path d="M9 8.5h6"/><path d="M9 12.5h6"/>',
    expenses: '<ellipse cx="12" cy="6.5" rx="7" ry="3.1"/><path d="M5 6.5v5.5c0 1.7 3.1 3.1 7 3.1s7-1.4 7-3.1V6.5"/><path d="M5 12v5.5c0 1.7 3.1 3.1 7 3.1s7-1.4 7-3.1V12"/>',
    orders: '<path d="M6 8h12l-1 11.4a1 1 0 0 1-1 .9H8a1 1 0 0 1-1-.9z"/><path d="M9 8V6.4a3 3 0 0 1 6 0V8"/>',
    settings: '<path d="M4 7h8"/><path d="M16 7h4"/><circle cx="14" cy="7" r="2"/><path d="M4 17h4"/><path d="M12 17h8"/><circle cx="10" cy="17" r="2"/>',
    shift: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    light: '<circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.2M12 19.3v2.2M4.5 4.5l1.6 1.6M17.9 17.9l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.5 19.5l1.6-1.6M17.9 6.1l1.6-1.6"/>',
    dark: '<path d="M20 13.5A8 8 0 1 1 10.5 4a6.3 6.3 0 0 0 9.5 9.5z"/>',
    system: '<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M9 21h6M12 17v4"/>'
  };
  var GROUPS = [['Till', [['sell', 'Sell'], ['orders', 'Orders']]], ['Catalog', [['products', 'Products'], ['inventory', 'Inventory'], ['promotions', 'Promos']]], ['Supply', [['purchasing', 'Buying'], ['expenses', 'Expenses']]], ['Insights', [['home', 'Dashboard'], ['reports', 'Reports']]]];
  var HREF = {
    sell: 'Sell - Retail tablet.html',
    orders: 'Online Orders.html',
    home: 'Dashboard.html',
    products: 'Products.html',
    inventory: 'Inventory.html',
    promotions: 'Promotions.html',
    purchasing: 'Purchasing.html',
    reports: 'VAT Report.html',
    expenses: 'Expenses.html',
    settings: 'Settings.html',
    shift: 'Shift.html'
  };
  function svg(inner) {
    return '<svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + inner + '</svg>';
  }
  function item(key, label, active) {
    var inner = svg(ICON[key]) + '<span class="rl">' + label + '</span>';
    var cls = 'rail-item' + (key === active ? ' active' : '');
    return HREF[key] ? '<a class="' + cls + '" href="' + HREF[key] + '">' + inner + '</a>' : '<button class="' + cls + '">' + inner + '</button>';
  }
  function renderRail() {
    var nav = document.querySelector('nav.rail[data-active]');
    if (!nav) return;
    var active = nav.getAttribute('data-active');
    var html = '<a class="rail-logo" href="' + (HREF.home || '#') + '" title="BiasharaPOS"><img src="logo-badge.png" alt="BiasharaPOS"></a>';
    html += '<div class="rail-scroll">';
    GROUPS.forEach(function (g) {
      html += '<div class="rail-group"><div class="rail-glabel">' + g[0] + '</div>';
      g[1].forEach(function (it) {
        html += item(it[0], it[1], active);
      });
      html += '</div>';
    });
    html += '</div>';
    html += '<div class="rail-foot"><div class="rail-glabel">System</div>' + item('shift', 'Shift', active) + themeBtn() + item('settings', 'Settings', active) + '</div>';
    nav.innerHTML = html;
  }

  // ---- theme (Light / Dark / Auto) ----
  var MODES = ['light', 'dark', 'system'];
  var MODE_LABEL = {
    light: 'Light',
    dark: 'Dark',
    system: 'Auto'
  };
  function mode() {
    var m = null;
    try {
      m = localStorage.getItem('bp-theme');
    } catch (e) {}
    return MODES.indexOf(m) >= 0 ? m : 'system';
  }
  function resolved(m) {
    if (m === 'system') {
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return m;
  }
  function applyTheme() {
    document.documentElement.setAttribute('data-theme', resolved(mode()));
  }
  function themeBtn() {
    var m = mode();
    return '<button class="rail-item" onclick="__bpTheme.cycle()" title="Theme: ' + MODE_LABEL[m] + '">' + svg(ICON[m]) + '<span class="rl">' + MODE_LABEL[m] + '</span></button>';
  }
  window.__bpTheme = {
    cycle: function () {
      var next = MODES[(MODES.indexOf(mode()) + 1) % MODES.length];
      try {
        localStorage.setItem('bp-theme', next);
      } catch (e) {}
      applyTheme();
      renderRail();
    }
  };
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () {
      if (mode() === 'system') applyTheme();
    });
  }

  // ---- brand splash (official logo) on every app load ----
  function splash() {
    if (document.querySelector('.bp-splash')) return;
    var s = document.createElement('div');
    s.className = 'bp-splash';
    s.innerHTML = '<img src="logo-full.png" alt="BiasharaPOS — Smart Business. Seamless Sales." />' + '<div class="bp-splash-load"><span></span></div>';
    (document.body || document.documentElement).appendChild(s);
    setTimeout(function () {
      s.classList.add('hide');
    }, 1100);
    setTimeout(function () {
      if (s.parentNode) s.parentNode.removeChild(s);
    }, 1700);
  }

  // ---- scale the fixed stage to fit ----
  function fit() {
    var stage = document.querySelector('.stage');
    var scaler = document.getElementById('scaler');
    if (!stage || !scaler) return;
    var s = Math.min(window.innerWidth / stage.offsetWidth, window.innerHeight / stage.offsetHeight);
    scaler.style.transform = 'scale(' + s + ')';
  }
  applyTheme();
  splash();
  renderRail();
  window.addEventListener('resize', fit);
  window.addEventListener('load', fit);
  fit();
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "device-ui/device.js", error: String((e && e.message) || e) }); }

// restaurant-bar/rms.js
try { (() => {
/* BiasharaPOS — Restaurant & Bar module runtime.
   Fits the fixed .stage to the viewport, renders the floor-service nav rail
   from one definition, and injects the brand splash. Self-contained. */
(function () {
  var ICON = {
    floor: '<rect x="3" y="3" width="7" height="7" rx="1.6"/><rect x="14" y="3" width="7" height="7" rx="1.6"/><rect x="3" y="14" width="7" height="7" rx="1.6"/><circle cx="17.5" cy="17.5" r="3.5"/>',
    tickets: '<path d="M6 3h12a1 1 0 0 1 1 1v17l-2.5-1.6L14 21l-2-1.4L10 21l-2.5-1.6L5 21V4a1 1 0 0 1 1-1z"/><path d="M9 8h6M9 12h6"/>',
    bar: '<path d="M5 4h14l-7 8z"/><path d="M12 12v6"/><path d="M8 21h8"/><path d="M14.5 7.5 18 4"/>',
    kitchen: '<path d="M8.5 3a3 3 0 0 1 7 0 3.2 3.2 0 0 1 2 5.6V14H6.5V8.6A3.2 3.2 0 0 1 8.5 3z"/><path d="M6.5 17.5h11M6.5 20.5h11"/>',
    menu: '<path d="M4 5a2 2 0 0 1 2-2h6v18H6a2 2 0 0 0-2 2z" /><path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 0-2 2h-6"/>',
    reports: '<path d="M5 21V9M12 21V4M19 21v-7"/>',
    settings: '<path d="M4 7h8"/><path d="M16 7h4"/><circle cx="14" cy="7" r="2"/><path d="M4 17h4"/><path d="M12 17h8"/><circle cx="10" cy="17" r="2"/>',
    light: '<circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.2M12 19.3v2.2M4.5 4.5l1.6 1.6M17.9 17.9l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.5 19.5l1.6-1.6M17.9 6.1l1.6-1.6"/>',
    dark: '<path d="M20 13.5A8 8 0 1 1 10.5 4a6.3 6.3 0 0 0 9.5 9.5z"/>',
    system: '<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M9 21h6M12 17v4"/>'
  };
  var GROUPS = [['Service', [['floor', 'Floor'], ['tickets', 'Tickets']]], ['Bar', [['bar', 'Bar']]], ['Kitchen', [['kitchen', 'Kitchen']]], ['Manage', [['menu', 'Menu'], ['reports', 'Reports']]]];
  var HREF = {
    floor: 'Floor Map.html',
    tickets: 'Order Ticket.html',
    bar: 'Bar Tab.html',
    kitchen: 'Kitchen Display.html'
    /* menu, reports: screens not built yet — rendered inert (no nav) */
  };
  function svg(inner) {
    return '<svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + inner + '</svg>';
  }
  function item(key, label, active) {
    var inner = svg(ICON[key]) + '<span class="rl">' + label + '</span>';
    var cls = 'rail-item' + (key === active ? ' active' : '');
    return HREF[key] ? '<a class="' + cls + '" href="' + HREF[key] + '">' + inner + '</a>' : '<button class="' + cls + '">' + inner + '</button>';
  }
  function renderRail() {
    var nav = document.querySelector('nav.rail[data-active]');
    if (!nav) return;
    var active = nav.getAttribute('data-active');
    var html = '<a class="rail-logo" href="' + (HREF.floor || '#') + '" title="BiasharaPOS"><img src="logo-badge.png" alt="BiasharaPOS"></a>';
    html += '<div class="rail-scroll">';
    GROUPS.forEach(function (g) {
      html += '<div class="rail-group"><div class="rail-glabel">' + g[0] + '</div>';
      g[1].forEach(function (it) {
        html += item(it[0], it[1], active);
      });
      html += '</div>';
    });
    html += '</div>';
    html += '<div class="rail-foot"><div class="rail-glabel">System</div>' + themeBtn() + item('settings', 'Settings', active) + '</div>';
    nav.innerHTML = html;
  }

  // ---- theme (Light / Dark / Auto) ----
  var MODES = ['light', 'dark', 'system'];
  var MODE_LABEL = {
    light: 'Light',
    dark: 'Dark',
    system: 'Auto'
  };
  function mode() {
    var m = null;
    try {
      m = localStorage.getItem('bp-theme');
    } catch (e) {}
    return MODES.indexOf(m) >= 0 ? m : 'system';
  }
  function resolved(m) {
    if (m === 'system') {
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return m;
  }
  function applyTheme() {
    document.documentElement.setAttribute('data-theme', resolved(mode()));
  }
  function themeBtn() {
    var m = mode();
    return '<button class="rail-item" onclick="__bpTheme.cycle()" title="Theme: ' + MODE_LABEL[m] + '">' + svg(ICON[m]) + '<span class="rl">' + MODE_LABEL[m] + '</span></button>';
  }
  window.__bpTheme = {
    cycle: function () {
      var next = MODES[(MODES.indexOf(mode()) + 1) % MODES.length];
      try {
        localStorage.setItem('bp-theme', next);
      } catch (e) {}
      applyTheme();
      renderRail();
    }
  };
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () {
      if (mode() === 'system') applyTheme();
    });
  }
  function splash() {
    if (document.querySelector('.bp-splash')) return;
    var s = document.createElement('div');
    s.className = 'bp-splash';
    s.innerHTML = '<img src="logo-full.png" alt="BiasharaPOS — Smart Business. Seamless Sales." />' + '<div class="bp-splash-load"><span></span></div>';
    (document.body || document.documentElement).appendChild(s);
    setTimeout(function () {
      s.classList.add('hide');
    }, 1100);
    setTimeout(function () {
      if (s.parentNode) s.parentNode.removeChild(s);
    }, 1700);
  }
  function fit() {
    var stage = document.querySelector('.stage');
    var scaler = document.getElementById('scaler');
    if (!stage || !scaler) return;
    var s = Math.min(window.innerWidth / stage.offsetWidth, window.innerHeight / stage.offsetHeight);
    scaler.style.transform = 'scale(' + s + ')';
  }
  applyTheme();
  splash();
  renderRail();
  window.addEventListener('resize', fit);
  window.addEventListener('load', fit);
  fit();
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "restaurant-bar/rms.js", error: String((e && e.message) || e) }); }

// ui_kits/pos-app/app.kit.js
try { (() => {
/* BiasharaPOS — App UI kit. Mock, interactive recreation of the product. */
const {
  useState
} = React;
const DS = window.BiasharaPOSDesignSystem_62a86f;
const {
  Button,
  Badge,
  Card,
  Input,
  Switch,
  MetricCard,
  ProductTile,
  Tabs
} = DS;
/* Icon ships in the bundle; fall back to a no-op until the bundle regenerates
   (newly-added components appear after the next compile). */
const Icon = DS.Icon || function FallbackIcon() {
  return null;
};

/* ---------- tweak defaults ---------- */
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "action": ["#239b46", "#1b7c34", "#145f28"],
  "topbar": ["#0f5da4", "#0c4a85", "#0a3a6b"],
  "businessName": "Duka la Mama Asha · Kariakoo",
  "vatRate": 18,
  "corners": "rounded",
  "navStyle": "sidebar",
  "google": true,
  "apple": true,
  "microsoft": false,
  "twoFactor": true,
  "welcomeSplash": true,
  "onlineBadge": true
} /*EDITMODE-END*/;
const CORNERS = {
  sharp: ["4px", "8px"],
  rounded: ["10px", "16px"],
  round: ["14px", "22px"]
};

/* ---------- mock data ---------- */
const TZS = n => "TZS " + n.toLocaleString("en-US");
const PRODUCTS = [{
  id: 1,
  name: "Coca-Cola 500ml",
  price: 1500,
  cost: 1100,
  stock: 48
}, {
  id: 2,
  name: "Bread loaf",
  price: 3000,
  cost: 2300,
  stock: 4
}, {
  id: 3,
  name: "Sukari 1kg",
  price: 3200,
  cost: 2750,
  stock: 0
}, {
  id: 4,
  name: "Maziwa 1L",
  price: 2800,
  cost: 2200,
  stock: 21
}, {
  id: 5,
  name: "Mchele 5kg",
  price: 18500,
  cost: 16000,
  stock: 12
}, {
  id: 6,
  name: "Soap bar",
  price: 1200,
  cost: 800,
  stock: 64
}, {
  id: 7,
  name: "Maji 1.5L",
  price: 1000,
  cost: 650,
  stock: 30
}, {
  id: 8,
  name: "Chai 250g",
  price: 2400,
  cost: 1900,
  stock: 9
}, {
  id: 9,
  name: "Mafuta 1L",
  price: 7800,
  cost: 6900,
  stock: 7
}];
const PAYMENTS = ["M-Pesa", "Mixx by Yas", "Airtel Money", "Card", "Cash"];
/* Business verticals for the create-account picker (uses the verticals photos). */
const BIZ_TYPES = [{
  id: "retail",
  label: "Retail / Duka",
  img: "retail.jpg"
}, {
  id: "restaurant",
  label: "Restaurant",
  img: "restaurant.jpg"
}, {
  id: "pharmacy",
  label: "Pharmacy",
  img: "pharmacy.jpg"
}, {
  id: "clothing",
  label: "Fashion",
  img: "clothing.jpg"
}, {
  id: "hospital",
  label: "Clinic",
  img: "hospital.jpg"
}];

/* password strength: 0 (empty) – 4 (strong) */
function pwScore(p) {
  if (!p) return 0;
  let s = 0;
  if (p.length >= 8) s++;
  if (/[a-z]/.test(p) && /[A-Z]/.test(p)) s++;
  if (/\d/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  if (p.length >= 6 && s === 0) s = 1;
  return Math.min(s, 4);
}
const PW_META = [{
  lbl: "",
  tone: "var(--line)"
}, {
  lbl: "Weak",
  tone: "var(--red)"
}, {
  lbl: "Fair",
  tone: "var(--amber)"
}, {
  lbl: "Good",
  tone: "var(--blue)"
}, {
  lbl: "Strong",
  tone: "var(--green)"
}];
/* Main navigation destinations (shared by sidebar, rail and top-bar nav). */
const NAV = [{
  id: "dashboard",
  label: "Dashboard",
  icon: "dashboard"
}, {
  id: "pos",
  label: "Make a Sale",
  icon: "sale"
}, {
  id: "products",
  label: "Products",
  icon: "products"
}, {
  id: "expenses",
  label: "Expenses",
  icon: "expenses"
}, {
  id: "tra",
  label: "TRA Report",
  icon: "report"
}];

/* ---------- provider marks ---------- */
const GoogleIcon = () => /*#__PURE__*/React.createElement("svg", {
  viewBox: "0 0 48 48"
}, /*#__PURE__*/React.createElement("path", {
  fill: "#4285F4",
  d: "M45 24c0-1.6-.1-3.1-.4-4.5H24v8.5h11.8c-.5 2.7-2 5-4.4 6.6v5.5h7.1C42.7 36.3 45 30.7 45 24z"
}), /*#__PURE__*/React.createElement("path", {
  fill: "#34A853",
  d: "M24 46c5.9 0 10.9-2 14.5-5.4l-7.1-5.5c-2 1.3-4.5 2.1-7.4 2.1-5.7 0-10.5-3.8-12.2-9H4.5v5.7C8.1 41.1 15.4 46 24 46z"
}), /*#__PURE__*/React.createElement("path", {
  fill: "#FBBC05",
  d: "M11.8 28.2c-.4-1.3-.7-2.7-.7-4.2s.3-2.9.7-4.2v-5.7H4.5C3 17.1 2.2 20.4 2.2 24s.8 6.9 2.3 9.9l7.3-5.7z"
}), /*#__PURE__*/React.createElement("path", {
  fill: "#EA4335",
  d: "M24 10.7c3.2 0 6.1 1.1 8.4 3.3l6.3-6.3C34.9 4.1 29.9 2 24 2 15.4 2 8.1 6.9 4.5 14.1l7.3 5.7c1.7-5.2 6.5-9.1 12.2-9.1z"
}));
const AppleIcon = () => /*#__PURE__*/React.createElement("svg", {
  viewBox: "0 0 24 24",
  fill: "currentColor"
}, /*#__PURE__*/React.createElement("path", {
  d: "M16.4 12.8c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.1-2.8.9-3.5.9-.7 0-1.8-.8-3-.8-1.5 0-3 .9-3.8 2.3-1.6 2.8-.4 7 1.2 9.3.8 1.1 1.7 2.4 2.9 2.3 1.2 0 1.6-.7 3-.7s1.8.7 3 .7 2-1.1 2.8-2.2c.9-1.3 1.2-2.5 1.3-2.6-.1 0-2.4-.9-2.4-3.6zM14.3 5.9c.6-.8 1.1-1.9 1-3-.9 0-2.1.6-2.8 1.4-.6.7-1.1 1.8-1 2.9 1 .1 2.1-.5 2.8-1.3z"
}));
const MicrosoftIcon = () => /*#__PURE__*/React.createElement("svg", {
  viewBox: "0 0 24 24"
}, /*#__PURE__*/React.createElement("path", {
  fill: "#F25022",
  d: "M2 2h9.5v9.5H2z"
}), /*#__PURE__*/React.createElement("path", {
  fill: "#7FBA00",
  d: "M12.5 2H22v9.5h-9.5z"
}), /*#__PURE__*/React.createElement("path", {
  fill: "#00A4EF",
  d: "M2 12.5h9.5V22H2z"
}), /*#__PURE__*/React.createElement("path", {
  fill: "#FFB900",
  d: "M12.5 12.5H22V22h-9.5z"
}));

/* ---------- top bar (used by the "topbar" nav style) ---------- */
function TopBar({
  onSignOut,
  businessName,
  showOnline
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "posk-topbar"
  }, /*#__PURE__*/React.createElement("div", {
    className: "posk-brand"
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/app-icon.png",
    alt: ""
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "posk-wm"
  }, "Biashara", /*#__PURE__*/React.createElement("span", null, "POS")), /*#__PURE__*/React.createElement("div", {
    className: "posk-biz"
  }, businessName))), /*#__PURE__*/React.createElement("div", {
    className: "posk-topbar-r"
  }, /*#__PURE__*/React.createElement("button", {
    className: "posk-bell",
    title: "Notifications"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "bell",
    size: 20
  }), /*#__PURE__*/React.createElement("span", {
    className: "posk-bell-dot"
  })), showOnline ? /*#__PURE__*/React.createElement("span", {
    className: "posk-online"
  }, /*#__PURE__*/React.createElement("i", null), "Online") : null, /*#__PURE__*/React.createElement("button", {
    className: "posk-signout",
    onClick: onSignOut
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "logout",
    size: 16
  }), " Sign out")));
}

/* ---------- business initials helper ---------- */
function bizParts(businessName) {
  const name = (businessName || "").split("·")[0].trim();
  const loc = ((businessName || "").split("·")[1] || "").trim();
  const words = name.replace(/[^A-Za-z ]/g, "").split(/\s+/).filter(w => w.length >= 3);
  const initials = (words.length ? words.slice(0, 2).map(w => w[0]) : [name[0] || "B", name[1] || ""]).join("").toUpperCase();
  return {
    name,
    loc,
    initials
  };
}

/* ---------- sidebar nav (default + icon rail) ---------- */
function SideNav({
  items,
  value,
  onChange,
  rail,
  businessName,
  online,
  onSignOut
}) {
  const {
    initials
  } = bizParts(businessName);
  return /*#__PURE__*/React.createElement("aside", {
    className: "posk-side" + (rail ? " posk-side--rail" : "")
  }, /*#__PURE__*/React.createElement("div", {
    className: "posk-side-brand"
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/app-icon.png",
    alt: "BiasharaPOS"
  }), !rail ? /*#__PURE__*/React.createElement("div", {
    className: "posk-wm posk-wm--dark"
  }, "Biashara", /*#__PURE__*/React.createElement("span", null, "POS")) : null), !rail ? /*#__PURE__*/React.createElement("div", {
    className: "posk-side-label"
  }, "Menu") : null, /*#__PURE__*/React.createElement("nav", {
    className: "posk-nav",
    role: "tablist"
  }, items.map(it => {
    const active = it.id === value;
    return /*#__PURE__*/React.createElement("button", {
      key: it.id,
      role: "tab",
      "aria-selected": active,
      title: rail ? it.label : undefined,
      className: "posk-navitem" + (active ? " is-active" : ""),
      onClick: () => onChange(it.id)
    }, /*#__PURE__*/React.createElement("span", {
      className: "posk-navitem__ic"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: it.icon,
      size: 20
    })), !rail ? /*#__PURE__*/React.createElement("span", {
      className: "posk-navitem__lbl"
    }, it.label) : null);
  })), /*#__PURE__*/React.createElement("div", {
    className: "posk-side-foot"
  }, online ? /*#__PURE__*/React.createElement("span", {
    className: "posk-side-online",
    title: "Online"
  }, /*#__PURE__*/React.createElement("i", null), !rail ? "Online" : null) : null, /*#__PURE__*/React.createElement("button", {
    className: "posk-side-signout",
    onClick: onSignOut,
    title: "Sign out"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "logout",
    size: 18
  }), !rail ? /*#__PURE__*/React.createElement("span", null, "Sign out") : null), !rail ? /*#__PURE__*/React.createElement("div", {
    className: "posk-side-user"
  }, /*#__PURE__*/React.createElement("span", {
    className: "posk-avatar posk-avatar--sm"
  }, initials), /*#__PURE__*/React.createElement("span", {
    className: "posk-side-user-x"
  }, "Owner account")) : null));
}

/* ---------- content header (sits above panes in sidebar/rail mode) ---------- */
function AppHeader({
  businessName
}) {
  const {
    name,
    loc,
    initials
  } = bizParts(businessName);
  return /*#__PURE__*/React.createElement("header", {
    className: "posk-header"
  }, /*#__PURE__*/React.createElement("button", {
    className: "posk-hbiz",
    title: "Switch business"
  }, /*#__PURE__*/React.createElement("span", {
    className: "posk-hbiz-ic"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "store",
    size: 18
  })), /*#__PURE__*/React.createElement("span", {
    className: "posk-hbiz-text"
  }, /*#__PURE__*/React.createElement("span", {
    className: "posk-hbiz-name"
  }, name), loc ? /*#__PURE__*/React.createElement("span", {
    className: "posk-hbiz-loc"
  }, loc) : null), /*#__PURE__*/React.createElement("span", {
    className: "posk-hbiz-caret"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "chevronRight",
    size: 15
  }))), /*#__PURE__*/React.createElement("div", {
    className: "posk-hactions"
  }, /*#__PURE__*/React.createElement("label", {
    className: "posk-hsearch"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "search",
    size: 16
  }), /*#__PURE__*/React.createElement("input", {
    placeholder: "Search products, sales, reports\u2026"
  })), /*#__PURE__*/React.createElement("button", {
    className: "posk-hbell",
    title: "Notifications"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "bell",
    size: 20
  }), /*#__PURE__*/React.createElement("span", {
    className: "posk-hbell-dot"
  })), /*#__PURE__*/React.createElement("span", {
    className: "posk-avatar"
  }, initials)));
}

/* ---------- refined top-bar pill nav (the "topbar" nav style) ---------- */
function TopNav({
  items,
  value,
  onChange
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "posk-topnav",
    role: "tablist"
  }, items.map(it => {
    const active = it.id === value;
    return /*#__PURE__*/React.createElement("button", {
      key: it.id,
      role: "tab",
      "aria-selected": active,
      className: "posk-topnav-btn" + (active ? " is-active" : ""),
      onClick: () => onChange(it.id)
    }, /*#__PURE__*/React.createElement(Icon, {
      name: it.icon,
      size: 17
    }), it.label);
  }));
}

/* ---------- create account (dedicated split screen) ---------- */
function CreateAccount({
  providers,
  onSignin,
  onCreate,
  onSocial
}) {
  const [biz, setBiz] = useState("");
  const [bizType, setBizType] = useState("retail");
  const [owner, setOwner] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [agree, setAgree] = useState(false);
  const [tried, setTried] = useState(false);
  const score = pwScore(pwd);
  const meta = PW_META[score];
  const emailOk = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
  const canSubmit = biz.trim() && owner.trim() && emailOk && pwd.length >= 6 && agree;
  const socials = [providers.google && {
    key: "Google",
    icon: /*#__PURE__*/React.createElement(GoogleIcon, null)
  }, providers.apple && {
    key: "Apple",
    icon: /*#__PURE__*/React.createElement(AppleIcon, null)
  }, providers.microsoft && {
    key: "Microsoft",
    icon: /*#__PURE__*/React.createElement(MicrosoftIcon, null)
  }].filter(Boolean);
  const submit = () => {
    setTried(true);
    if (!canSubmit) return;
    onCreate(biz.trim(), email.trim());
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "posk-reg"
  }, /*#__PURE__*/React.createElement("aside", {
    className: "posk-reg-aside"
  }, /*#__PURE__*/React.createElement("div", {
    className: "posk-reg-wm"
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/app-icon.png",
    alt: ""
  }), /*#__PURE__*/React.createElement("b", null, "Biashara", /*#__PURE__*/React.createElement("span", null, "POS"))), /*#__PURE__*/React.createElement("div", {
    className: "posk-reg-lead"
  }, /*#__PURE__*/React.createElement("h2", null, "Run your business smarter, from day one."), /*#__PURE__*/React.createElement("p", null, "Set up your shop in minutes and start tracking every shilling of profit."), /*#__PURE__*/React.createElement("div", {
    className: "posk-reg-vals"
  }, /*#__PURE__*/React.createElement("div", {
    className: "posk-reg-val"
  }, /*#__PURE__*/React.createElement("i", null, /*#__PURE__*/React.createElement(Icon, {
    name: "analytics",
    size: 17
  })), "Know your profit every single day"), /*#__PURE__*/React.createElement("div", {
    className: "posk-reg-val"
  }, /*#__PURE__*/React.createElement("i", null, /*#__PURE__*/React.createElement(Icon, {
    name: "report",
    size: 17
  })), "TRA-compliant VFD receipts, automatically"), /*#__PURE__*/React.createElement("div", {
    className: "posk-reg-val"
  }, /*#__PURE__*/React.createElement("i", null, /*#__PURE__*/React.createElement(Icon, {
    name: "sale",
    size: 17
  })), "Take M-Pesa, Airtel Money, Mixx & cash"), /*#__PURE__*/React.createElement("div", {
    className: "posk-reg-val"
  }, /*#__PURE__*/React.createElement("i", null, /*#__PURE__*/React.createElement(Icon, {
    name: "checkCircle",
    size: 17
  })), "Works offline \u2014 syncs when you're back"))), /*#__PURE__*/React.createElement("div", {
    className: "posk-reg-foot"
  }, /*#__PURE__*/React.createElement("span", {
    className: "posk-reg-stars"
  }, "\u2605\u2605\u2605\u2605\u2605"), "Trusted by 4,200+ Tanzanian businesses")), /*#__PURE__*/React.createElement("main", {
    className: "posk-reg-main"
  }, /*#__PURE__*/React.createElement("div", {
    className: "posk-reg-top"
  }, "Already have an account? ", /*#__PURE__*/React.createElement("a", {
    onClick: onSignin
  }, "Sign in")), /*#__PURE__*/React.createElement("div", {
    className: "posk-reg-body"
  }, /*#__PURE__*/React.createElement("div", {
    className: "posk-reg-h1"
  }, "Create your free account"), /*#__PURE__*/React.createElement("div", {
    className: "posk-reg-tag"
  }, "No card required \xB7 free for your first shop"), socials.length ? /*#__PURE__*/React.createElement("div", {
    className: "posk-reg-soc",
    style: {
      gridTemplateColumns: `repeat(${socials.length}, 1fr)`
    }
  }, socials.map(s => /*#__PURE__*/React.createElement("button", {
    key: s.key,
    className: "posk-soc posk-soc--sm",
    onClick: onSocial
  }, s.icon, socials.length < 3 ? /*#__PURE__*/React.createElement("span", null, "Sign up with ", s.key) : /*#__PURE__*/React.createElement("span", null, s.key)))) : null, socials.length ? /*#__PURE__*/React.createElement("div", {
    className: "posk-divider"
  }, "or sign up with email") : /*#__PURE__*/React.createElement("div", {
    style: {
      height: 18
    }
  }), /*#__PURE__*/React.createElement("div", {
    className: "posk-reg-fields"
  }, /*#__PURE__*/React.createElement(Input, {
    label: "Business name",
    placeholder: "e.g. Duka la Mama Asha",
    value: biz,
    onChange: e => setBiz(e.target.value),
    error: tried && !biz.trim() ? "Enter your business name" : null
  }), /*#__PURE__*/React.createElement("div", {
    className: "bp-field"
  }, /*#__PURE__*/React.createElement("span", {
    className: "posk-bizlbl"
  }, "Business type"), /*#__PURE__*/React.createElement("div", {
    className: "posk-biztypes"
  }, BIZ_TYPES.map(b => /*#__PURE__*/React.createElement("button", {
    type: "button",
    key: b.id,
    className: "posk-biztype" + (bizType === b.id ? " is-on" : ""),
    onClick: () => setBizType(b.id)
  }, /*#__PURE__*/React.createElement("span", {
    className: "posk-biztype-tick"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "check",
    size: 12,
    strokeWidth: 3
  })), /*#__PURE__*/React.createElement("img", {
    src: "../../assets/verticals/" + b.img,
    alt: ""
  }), /*#__PURE__*/React.createElement("span", null, b.label))))), /*#__PURE__*/React.createElement("div", {
    className: "posk-reg-row"
  }, /*#__PURE__*/React.createElement(Input, {
    label: "Your name",
    placeholder: "e.g. Asha Juma",
    value: owner,
    onChange: e => setOwner(e.target.value),
    error: tried && !owner.trim() ? "Required" : null
  }), /*#__PURE__*/React.createElement(Input, {
    label: "Phone number",
    type: "tel",
    prefix: "+255",
    placeholder: "712 345 678",
    value: phone,
    onChange: e => setPhone(e.target.value)
  })), /*#__PURE__*/React.createElement(Input, {
    label: "Email address",
    type: "email",
    placeholder: "you@business.co.tz",
    value: email,
    onChange: e => setEmail(e.target.value),
    error: tried && !emailOk ? "Enter a valid email" : null
  }), /*#__PURE__*/React.createElement("div", {
    className: "bp-field"
  }, /*#__PURE__*/React.createElement("label", {
    className: "bp-field__label",
    htmlFor: "posk-reg-pw"
  }, "Create a password"), /*#__PURE__*/React.createElement("div", {
    className: "bp-field__control" + (tried && pwd.length < 6 ? " is-error" : "")
  }, /*#__PURE__*/React.createElement("input", {
    id: "posk-reg-pw",
    className: "bp-field__input",
    type: showPwd ? "text" : "password",
    placeholder: "At least 6 characters",
    value: pwd,
    onChange: e => setPwd(e.target.value)
  }), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "posk-pw-eye",
    onClick: () => setShowPwd(v => !v)
  }, showPwd ? "Hide" : "Show")), /*#__PURE__*/React.createElement("div", {
    className: "posk-strength"
  }, [1, 2, 3, 4].map(n => /*#__PURE__*/React.createElement("i", {
    key: n,
    style: {
      background: n <= score ? meta.tone : "var(--line)"
    }
  }))), /*#__PURE__*/React.createElement("div", {
    className: "posk-strength-row"
  }, /*#__PURE__*/React.createElement("span", {
    className: "posk-strength-lbl",
    style: {
      color: pwd ? meta.tone : "var(--ink-3)"
    }
  }, pwd ? meta.lbl + " password" : "Password strength"), /*#__PURE__*/React.createElement("span", {
    className: "posk-strength-hint"
  }, "Use 8+ chars, a number & a symbol"))), /*#__PURE__*/React.createElement("div", {
    className: "posk-terms"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "posk-check" + (agree ? " is-on" : ""),
    "aria-pressed": agree,
    onClick: () => setAgree(v => !v)
  }, agree ? /*#__PURE__*/React.createElement(Icon, {
    name: "check",
    size: 13,
    strokeWidth: 3
  }) : null), /*#__PURE__*/React.createElement("span", null, "I agree to the ", /*#__PURE__*/React.createElement("a", null, "Terms of Service"), " and ", /*#__PURE__*/React.createElement("a", null, "Privacy Policy"), ", and to receiving account updates.")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 4
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    fullWidth: true,
    size: "lg",
    trailingIcon: /*#__PURE__*/React.createElement(Icon, {
      name: "chevronRight",
      size: 18
    }),
    onClick: submit
  }, "Create account")), /*#__PURE__*/React.createElement("div", {
    className: "posk-reg-trust"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "checkCircle",
    size: 15
  }), " Bank-level encryption \xB7 your data stays in Tanzania")))));
}

/* ---------- login ---------- */
function Login({
  onLogin,
  providers,
  twoFactor
}) {
  const [mode, setMode] = useState("signin");
  const [step, setStep] = useState("form");
  const [email, setEmail] = useState("asha@biashara.co.tz");
  const [pwd, setPwd] = useState("");
  const [biz, setBiz] = useState("");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const signup = mode === "signup";
  const finish = () => onLogin(signup ? biz : null);
  const submit = () => {
    if (twoFactor) {
      setCode(["", "", "", "", "", ""]);
      setStep("verify");
    } else finish();
  };
  const socials = [providers.google && {
    key: "Google",
    icon: /*#__PURE__*/React.createElement(GoogleIcon, null)
  }, providers.apple && {
    key: "Apple",
    icon: /*#__PURE__*/React.createElement(AppleIcon, null)
  }, providers.microsoft && {
    key: "Microsoft",
    icon: /*#__PURE__*/React.createElement(MicrosoftIcon, null)
  }].filter(Boolean);
  const setDigit = (i, v) => {
    v = (v || "").replace(/\D/g, "").slice(-1);
    setCode(c => {
      const n = [...c];
      n[i] = v;
      return n;
    });
    if (v && i < 5) {
      const el = document.getElementById("posk-otp-" + (i + 1));
      if (el) el.focus();
    }
  };
  const codeFull = code.every(d => d !== "");
  if (step === "verify") {
    return /*#__PURE__*/React.createElement("div", {
      className: "posk-login"
    }, /*#__PURE__*/React.createElement("div", {
      className: "posk-login-card"
    }, /*#__PURE__*/React.createElement("img", {
      src: "../../assets/logo-full.png",
      alt: "BiasharaPOS",
      className: "posk-login-logo"
    }), /*#__PURE__*/React.createElement("div", {
      className: "posk-login-sub"
    }, "Two-step verification"), /*#__PURE__*/React.createElement("p", {
      className: "posk-verify-note"
    }, "Enter the 6-digit code we emailed to ", /*#__PURE__*/React.createElement("b", null, email)), /*#__PURE__*/React.createElement("div", {
      className: "posk-otp"
    }, code.map((d, i) => /*#__PURE__*/React.createElement("input", {
      key: i,
      id: "posk-otp-" + i,
      className: "posk-otp-box",
      inputMode: "numeric",
      maxLength: 1,
      value: d,
      onChange: e => setDigit(i, e.target.value),
      onKeyDown: e => {
        if (e.key === "Backspace" && !d && i > 0) {
          const el = document.getElementById("posk-otp-" + (i - 1));
          if (el) el.focus();
        }
      }
    }))), /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 18
      }
    }, /*#__PURE__*/React.createElement(Button, {
      variant: "primary",
      fullWidth: true,
      size: "lg",
      disabled: !codeFull,
      onClick: finish
    }, "Verify & continue")), /*#__PURE__*/React.createElement("div", {
      className: "posk-login-alt"
    }, /*#__PURE__*/React.createElement("span", null, "Didn't get it? ", /*#__PURE__*/React.createElement("a", {
      onClick: () => setCode(["", "", "", "", "", ""])
    }, "Resend code"), " \xB7 ", /*#__PURE__*/React.createElement("a", {
      onClick: () => setStep("form")
    }, "Change email")))));
  }
  if (signup) {
    return /*#__PURE__*/React.createElement(CreateAccount, {
      providers: providers,
      onSignin: () => setMode("signin"),
      onSocial: finish,
      onCreate: (name, em) => {
        setBiz(name);
        if (em) setEmail(em);
        if (twoFactor) {
          setCode(["", "", "", "", "", ""]);
          setStep("verify");
        } else onLogin(name);
      }
    });
  }
  return /*#__PURE__*/React.createElement("div", {
    className: "posk-login"
  }, /*#__PURE__*/React.createElement("div", {
    className: "posk-login-card"
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/logo-full.png",
    alt: "BiasharaPOS",
    className: "posk-login-logo"
  }), /*#__PURE__*/React.createElement("div", {
    className: "posk-login-sub"
  }, signup ? "Create your free account" : "Sign in to your business"), socials.length ? /*#__PURE__*/React.createElement("div", {
    className: "posk-social"
  }, socials.map(s => /*#__PURE__*/React.createElement("button", {
    key: s.key,
    className: "posk-soc",
    onClick: finish
  }, s.icon, " Continue with ", s.key))) : null, socials.length ? /*#__PURE__*/React.createElement("div", {
    className: "posk-divider"
  }, "or") : null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 14
    }
  }, signup ? /*#__PURE__*/React.createElement(Input, {
    label: "Business name",
    placeholder: "e.g. Duka la Mama Asha",
    value: biz,
    onChange: e => setBiz(e.target.value)
  }) : null, /*#__PURE__*/React.createElement(Input, {
    label: "Email address",
    type: "email",
    placeholder: "you@business.co.tz",
    value: email,
    onChange: e => setEmail(e.target.value)
  }), /*#__PURE__*/React.createElement(Input, {
    label: signup ? "Create a password" : "Password",
    type: "password",
    placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022",
    value: pwd,
    onChange: e => setPwd(e.target.value)
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 18
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    fullWidth: true,
    size: "lg",
    onClick: submit
  }, signup ? "Create account" : "Continue with email")), signup ? /*#__PURE__*/React.createElement("div", {
    className: "posk-login-alt"
  }, /*#__PURE__*/React.createElement("span", null, "Already have an account? ", /*#__PURE__*/React.createElement("a", {
    onClick: () => setMode("signin")
  }, "Sign in"))) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "posk-login-forgot"
  }, /*#__PURE__*/React.createElement("a", null, "Forgot your password?")), /*#__PURE__*/React.createElement("div", {
    className: "posk-login-create"
  }, /*#__PURE__*/React.createElement("div", {
    className: "posk-login-create-hint"
  }, "New to BiasharaPOS?"), /*#__PURE__*/React.createElement("button", {
    className: "posk-login-create-btn",
    onClick: () => setMode("signup")
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "store",
    size: 18
  }), " Create a free account")))));
}

/* ---------- dashboard ---------- */
function Dashboard() {
  const bars = [{
    k: "Gross sales",
    v: 612000,
    tone: "var(--blue)"
  }, {
    k: "Cost of goods",
    v: 510500,
    tone: "var(--red)"
  }, {
    k: "Expenses",
    v: 17300,
    tone: "var(--amber)"
  }, {
    k: "Net profit",
    v: 84200,
    tone: "var(--green)"
  }];
  const max = Math.max(...bars.map(b => b.v));
  const top = [{
    n: "Mchele 5kg",
    p: 30000
  }, {
    n: "Mafuta 1L",
    p: 18900
  }, {
    n: "Coca-Cola 500ml",
    p: 12400
  }, {
    n: "Bread loaf",
    p: 8400
  }];
  const maxp = Math.max(...top.map(t => t.p));
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "posk-head"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "posk-h1"
  }, "Today's Profit Dashboard"), /*#__PURE__*/React.createElement("div", {
    className: "posk-sub"
  }, "Saturday, 6 June 2026 \xB7 live")), /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    size: "sm"
  }, "\u21BB Refresh")), /*#__PURE__*/React.createElement("div", {
    className: "posk-metrics"
  }, /*#__PURE__*/React.createElement(MetricCard, {
    tone: "green",
    value: TZS(84200),
    label: "Net profit today",
    sub: "+13.8% margin"
  }), /*#__PURE__*/React.createElement(MetricCard, {
    tone: "blue",
    value: TZS(612000),
    label: "Gross sales",
    sub: "18 sales"
  }), /*#__PURE__*/React.createElement(MetricCard, {
    tone: "red",
    value: TZS(510500),
    label: "Cost of goods"
  }), /*#__PURE__*/React.createElement(MetricCard, {
    tone: "amber",
    value: TZS(18300),
    label: "VAT collected",
    sub: "Payable to TRA"
  }), /*#__PURE__*/React.createElement(MetricCard, {
    value: TZS(17300),
    label: "Expenses today"
  })), /*#__PURE__*/React.createElement("div", {
    className: "posk-cols"
  }, /*#__PURE__*/React.createElement(Card, {
    title: "Profit breakdown"
  }, bars.map(b => /*#__PURE__*/React.createElement("div", {
    key: b.k,
    className: "posk-barrow"
  }, /*#__PURE__*/React.createElement("span", {
    className: "posk-barlbl"
  }, b.k), /*#__PURE__*/React.createElement("span", {
    className: "posk-barwrap"
  }, /*#__PURE__*/React.createElement("span", {
    className: "posk-barfill",
    style: {
      width: b.v / max * 100 + "%",
      background: b.tone
    }
  })), /*#__PURE__*/React.createElement("span", {
    className: "posk-barval"
  }, TZS(b.v))))), /*#__PURE__*/React.createElement(Card, {
    title: "Top products by profit"
  }, top.map(t => /*#__PURE__*/React.createElement("div", {
    key: t.n,
    className: "posk-toprow"
  }, /*#__PURE__*/React.createElement("span", {
    className: "posk-topname"
  }, t.n), /*#__PURE__*/React.createElement("span", {
    className: "posk-barwrap"
  }, /*#__PURE__*/React.createElement("span", {
    className: "posk-barfill",
    style: {
      width: t.p / maxp * 100 + "%",
      background: "var(--green)"
    }
  })), /*#__PURE__*/React.createElement("b", {
    className: "posk-topval"
  }, "+", TZS(t.p)))))));
}

/* ---------- make a sale ---------- */
function Sell({
  onToast,
  vatRate
}) {
  const [cart, setCart] = useState([]);
  const [vat, setVat] = useState(true);
  const [pay, setPay] = useState("M-Pesa");
  const [receipt, setReceipt] = useState(null);
  const add = p => setCart(c => {
    const f = c.find(i => i.id === p.id);
    return f ? c.map(i => i.id === p.id ? {
      ...i,
      q: i.q + 1
    } : i) : [...c, {
      ...p,
      q: 1
    }];
  });
  const setQ = (id, d) => setCart(c => c.map(i => i.id === id ? {
    ...i,
    q: Math.max(1, i.q + d)
  } : i));
  const remove = id => setCart(c => c.filter(i => i.id !== id));
  const sub = cart.reduce((s, i) => s + i.price * i.q, 0);
  const rate = (vatRate || 0) / 100;
  const vatAmt = vat && rate > 0 ? Math.round(sub - sub / (1 + rate)) : 0;
  const total = sub;
  const charge = () => {
    if (!cart.length) return;
    setReceipt({
      items: cart,
      total,
      vat: vatAmt,
      pay,
      no: "RCPT-2026-0" + (140 + Math.floor(Math.random() * 60))
    });
    onToast(`Sale complete · ${TZS(total)} · ${pay}`);
    setCart([]);
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "posk-sell"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "posk-search"
  }, "\uD83D\uDD0E ", /*#__PURE__*/React.createElement("input", {
    placeholder: "Search products or scan barcode\u2026"
  })), /*#__PURE__*/React.createElement("div", {
    className: "posk-grid"
  }, PRODUCTS.map(p => /*#__PURE__*/React.createElement(ProductTile, {
    key: p.id,
    name: p.name,
    price: TZS(p.price),
    stock: p.stock,
    lowStock: p.stock > 0 && p.stock <= 5,
    outOfStock: p.stock === 0,
    onClick: () => add(p)
  })))), /*#__PURE__*/React.createElement("div", {
    className: "posk-cart"
  }, /*#__PURE__*/React.createElement("div", {
    className: "posk-cart-head"
  }, "\uD83D\uDED2 Cart ", /*#__PURE__*/React.createElement("span", null, cart.reduce((s, i) => s + i.q, 0), " items")), /*#__PURE__*/React.createElement("div", {
    className: "posk-cart-body"
  }, !cart.length ? /*#__PURE__*/React.createElement("div", {
    className: "posk-cart-empty"
  }, "Tap a product to start a sale") : cart.map(i => /*#__PURE__*/React.createElement("div", {
    key: i.id,
    className: "posk-cart-item"
  }, /*#__PURE__*/React.createElement("span", {
    className: "posk-ci-name"
  }, i.name), /*#__PURE__*/React.createElement("span", {
    className: "posk-qty"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setQ(i.id, -1)
  }, "\u2212"), /*#__PURE__*/React.createElement("b", null, i.q), /*#__PURE__*/React.createElement("button", {
    onClick: () => setQ(i.id, +1)
  }, "+")), /*#__PURE__*/React.createElement("span", {
    className: "posk-ci-price"
  }, TZS(i.price * i.q)), /*#__PURE__*/React.createElement("button", {
    className: "posk-ci-x",
    onClick: () => remove(i.id)
  }, "\xD7")))), /*#__PURE__*/React.createElement("div", {
    className: "posk-cart-foot"
  }, /*#__PURE__*/React.createElement("div", {
    className: "posk-vat"
  }, /*#__PURE__*/React.createElement(Switch, {
    checked: vat,
    onChange: setVat,
    label: `VAT inclusive (${vatRate}%)`
  })), vat && vatAmt > 0 && /*#__PURE__*/React.createElement("div", {
    className: "posk-line"
  }, /*#__PURE__*/React.createElement("span", null, "VAT"), /*#__PURE__*/React.createElement("span", null, TZS(vatAmt))), /*#__PURE__*/React.createElement("div", {
    className: "posk-total"
  }, /*#__PURE__*/React.createElement("span", null, "Total"), /*#__PURE__*/React.createElement("span", {
    className: "posk-total-amt"
  }, TZS(total))), /*#__PURE__*/React.createElement("div", {
    className: "posk-pays"
  }, PAYMENTS.map(m => /*#__PURE__*/React.createElement("button", {
    key: m,
    className: "posk-pay" + (pay === m ? " is-on" : ""),
    onClick: () => setPay(m)
  }, m))), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    fullWidth: true,
    size: "lg",
    onClick: charge,
    disabled: !cart.length
  }, cart.length ? `Charge ${TZS(total)}` : "Charge"))), receipt && /*#__PURE__*/React.createElement("div", {
    className: "posk-modal",
    onClick: () => setReceipt(null)
  }, /*#__PURE__*/React.createElement("div", {
    className: "posk-receipt",
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("div", {
    className: "posk-r-head"
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/logo-badge.png",
    alt: ""
  }), /*#__PURE__*/React.createElement("h3", null, "Duka la Mama Asha"), /*#__PURE__*/React.createElement("div", {
    className: "posk-r-sub"
  }, "Kariakoo, Dar es Salaam \xB7 TIN 123-456-789")), receipt.items.map(i => /*#__PURE__*/React.createElement("div", {
    key: i.id,
    className: "posk-r-line"
  }, /*#__PURE__*/React.createElement("span", null, i.q, " \xD7 ", i.name), /*#__PURE__*/React.createElement("span", null, TZS(i.price * i.q)))), receipt.vat > 0 && /*#__PURE__*/React.createElement("div", {
    className: "posk-r-line muted"
  }, /*#__PURE__*/React.createElement("span", null, "incl. VAT ", vatRate, "%"), /*#__PURE__*/React.createElement("span", null, TZS(receipt.vat))), /*#__PURE__*/React.createElement("div", {
    className: "posk-r-total"
  }, /*#__PURE__*/React.createElement("span", null, "Total \xB7 ", receipt.pay), /*#__PURE__*/React.createElement("span", null, TZS(receipt.total))), /*#__PURE__*/React.createElement("div", {
    className: "posk-r-vfd"
  }, /*#__PURE__*/React.createElement(Badge, {
    tone: "success",
    dot: true
  }, "VFD verified \xB7 TRA"), /*#__PURE__*/React.createElement("span", {
    className: "posk-r-no"
  }, receipt.no)), /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    fullWidth: true,
    onClick: () => setReceipt(null)
  }, "Done"))));
}

/* ---------- placeholder panes ---------- */
function Placeholder({
  title,
  note
}) {
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "posk-head"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "posk-h1"
  }, title), /*#__PURE__*/React.createElement("div", {
    className: "posk-sub"
  }, note))), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "30px 8px",
      textAlign: "center",
      color: "var(--ink-3)",
      fontSize: 13
    }
  }, "This screen is part of the full product. The kit recreates Login, Dashboard and Make-a-Sale in detail.")));
}

/* ---------- first-login welcome splash ---------- */
function Welcome({
  onContinue
}) {
  const [step, setStep] = useState(0);
  if (step === 0) {
    return /*#__PURE__*/React.createElement("div", {
      className: "posk-welcome"
    }, /*#__PURE__*/React.createElement("div", {
      className: "posk-welcome-card"
    }, /*#__PURE__*/React.createElement("div", {
      className: "posk-welcome-badge"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "checkCircle",
      size: 48
    })), /*#__PURE__*/React.createElement("div", {
      className: "posk-welcome-spark"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "sparkle",
      size: 22
    })), /*#__PURE__*/React.createElement("h1", null, "Congratulations!"), /*#__PURE__*/React.createElement("p", null, "You've successfully created your account with ", /*#__PURE__*/React.createElement("b", null, "BiasharaPOS"), ". Your shop is ready to start selling smarter."), /*#__PURE__*/React.createElement(Button, {
      variant: "primary",
      size: "lg",
      fullWidth: true,
      trailingIcon: /*#__PURE__*/React.createElement(Icon, {
        name: "chevronRight",
        size: 18
      }),
      onClick: () => setStep(1)
    }, "Continue")));
  }
  return /*#__PURE__*/React.createElement("div", {
    className: "posk-welcome"
  }, /*#__PURE__*/React.createElement("div", {
    className: "posk-welcome-card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "posk-welcome-eyebrow"
  }, "Let's get you set up"), /*#__PURE__*/React.createElement("h2", null, "Three steps to your first sale"), /*#__PURE__*/React.createElement("div", {
    className: "posk-steps"
  }, /*#__PURE__*/React.createElement("div", {
    className: "posk-wstep"
  }, /*#__PURE__*/React.createElement("span", {
    className: "posk-wic"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "products",
    size: 20
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("b", null, "Add your products"), /*#__PURE__*/React.createElement("span", null, "Name, price, cost & category"))), /*#__PURE__*/React.createElement("div", {
    className: "posk-wstep"
  }, /*#__PURE__*/React.createElement("span", {
    className: "posk-wic"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "barcode",
    size: 20
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("b", null, "Generate & print barcodes"), /*#__PURE__*/React.createElement("span", null, "Label your shelves and stock"))), /*#__PURE__*/React.createElement("div", {
    className: "posk-wstep"
  }, /*#__PURE__*/React.createElement("span", {
    className: "posk-wic"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "sale",
    size: 20
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("b", null, "Make your first sale"), /*#__PURE__*/React.createElement("span", null, "Tap products, charge, done")))), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "lg",
    fullWidth: true,
    onClick: onContinue
  }, "Go to dashboard")));
}

/* ---------- app shell ---------- */
function App() {
  const {
    useTweaks,
    TweaksPanel,
    TweakSection,
    TweakColor,
    TweakText,
    TweakNumber,
    TweakRadio,
    TweakToggle
  } = window;
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [authed, setAuthed] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [tab, setTab] = useState("dashboard");
  const [toast, setToast] = useState(null);
  const fireToast = m => {
    setToast(m);
    clearTimeout(window.__t);
    window.__t = setTimeout(() => setToast(null), 2600);
  };
  React.useEffect(() => {
    const r = document.documentElement.style;
    const [g, gd, gdd] = t.action || TWEAK_DEFAULTS.action;
    r.setProperty("--green", g);
    r.setProperty("--green-d", gd);
    r.setProperty("--green-dd", gdd);
    r.setProperty("--action-primary", g);
    r.setProperty("--action-primary-hover", gd);
    const [b, bd, bdd] = t.topbar || TWEAK_DEFAULTS.topbar;
    r.setProperty("--blue", b);
    r.setProperty("--blue-d", bd);
    r.setProperty("--blue-dd", bdd);
    const rad = CORNERS[t.corners] || CORNERS.rounded;
    r.setProperty("--r-sm", rad[0]);
    r.setProperty("--r", rad[1]);
  }, [t]);
  const panel = /*#__PURE__*/React.createElement(TweaksPanel, {
    title: "Tweaks"
  }, /*#__PURE__*/React.createElement(TweakSection, {
    label: "Navigation"
  }), /*#__PURE__*/React.createElement(TweakRadio, {
    label: "Nav style",
    value: t.navStyle,
    options: ["sidebar", "rail", "topbar"],
    onChange: v => setTweak("navStyle", v)
  }), /*#__PURE__*/React.createElement(TweakSection, {
    label: "Brand"
  }), /*#__PURE__*/React.createElement(TweakColor, {
    label: "Action color",
    value: t.action,
    options: [["#239b46", "#1b7c34", "#145f28"], ["#10977c", "#0e7d66", "#0a5f4d"], ["#2f8f3e", "#246e30", "#1a5224"], ["#0f9d8a", "#0b7d6e", "#085f53"]],
    onChange: v => setTweak("action", v)
  }), /*#__PURE__*/React.createElement(TweakColor, {
    label: "Top bar",
    value: t.topbar,
    options: [["#0f5da4", "#0c4a85", "#0a3a6b"], ["#1f3a5f", "#172d4a", "#102036"], ["#3b4fb0", "#2f3f8c", "#26336f"], ["#13202c", "#0e1820", "#0a1218"]],
    onChange: v => setTweak("topbar", v)
  }), /*#__PURE__*/React.createElement(TweakRadio, {
    label: "Corners",
    value: t.corners,
    options: ["sharp", "rounded", "round"],
    onChange: v => setTweak("corners", v)
  }), /*#__PURE__*/React.createElement(TweakSection, {
    label: "Sign-in methods"
  }), /*#__PURE__*/React.createElement(TweakToggle, {
    label: "Google",
    value: t.google,
    onChange: v => setTweak("google", v)
  }), /*#__PURE__*/React.createElement(TweakToggle, {
    label: "Apple",
    value: t.apple,
    onChange: v => setTweak("apple", v)
  }), /*#__PURE__*/React.createElement(TweakToggle, {
    label: "Microsoft",
    value: t.microsoft,
    onChange: v => setTweak("microsoft", v)
  }), /*#__PURE__*/React.createElement(TweakToggle, {
    label: "Two-factor (email code)",
    value: t.twoFactor,
    onChange: v => setTweak("twoFactor", v)
  }), /*#__PURE__*/React.createElement(TweakToggle, {
    label: "Welcome splash (first login)",
    value: t.welcomeSplash,
    onChange: v => setTweak("welcomeSplash", v)
  }), /*#__PURE__*/React.createElement(TweakSection, {
    label: "Shop"
  }), /*#__PURE__*/React.createElement(TweakText, {
    label: "Business name",
    value: t.businessName,
    onChange: v => setTweak("businessName", v)
  }), /*#__PURE__*/React.createElement(TweakNumber, {
    label: "VAT rate",
    value: t.vatRate,
    min: 0,
    max: 25,
    step: 1,
    unit: "%",
    onChange: v => setTweak("vatRate", v)
  }), /*#__PURE__*/React.createElement(TweakToggle, {
    label: "Show online badge",
    value: t.onlineBadge,
    onChange: v => setTweak("onlineBadge", v)
  }));
  if (!authed) {
    return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Login, {
      providers: {
        google: t.google,
        apple: t.apple,
        microsoft: t.microsoft
      },
      twoFactor: t.twoFactor,
      onLogin: name => {
        if (name) setTweak("businessName", name);
        setAuthed(true);
        setShowWelcome(t.welcomeSplash);
        setTab("dashboard");
      }
    }), panel);
  }
  if (showWelcome) {
    return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Welcome, {
      onContinue: () => setShowWelcome(false)
    }), panel);
  }
  const paneContent = /*#__PURE__*/React.createElement(React.Fragment, null, tab === "dashboard" && /*#__PURE__*/React.createElement(Dashboard, null), tab === "pos" && /*#__PURE__*/React.createElement(Sell, {
    onToast: fireToast,
    vatRate: t.vatRate
  }), tab === "products" && /*#__PURE__*/React.createElement(Placeholder, {
    title: "Products",
    note: "Your catalog \u2014 names, prices, costs, categories"
  }), tab === "expenses" && /*#__PURE__*/React.createElement(Placeholder, {
    title: "Expenses",
    note: "Track what you spend to run the business"
  }), tab === "tra" && /*#__PURE__*/React.createElement(Placeholder, {
    title: "TRA Report",
    note: "Generate a monthly VAT report PDF for the TRA"
  }));
  const rail = t.navStyle === "rail";
  const sideMode = t.navStyle === "sidebar" || rail;
  return /*#__PURE__*/React.createElement(React.Fragment, null, sideMode ? /*#__PURE__*/React.createElement("div", {
    className: "posk-app posk-app--side"
  }, /*#__PURE__*/React.createElement(SideNav, {
    items: NAV,
    value: tab,
    onChange: setTab,
    rail: rail,
    businessName: t.businessName,
    online: t.onlineBadge,
    onSignOut: () => setAuthed(false)
  }), /*#__PURE__*/React.createElement("div", {
    className: "posk-content"
  }, /*#__PURE__*/React.createElement(AppHeader, {
    businessName: t.businessName
  }), /*#__PURE__*/React.createElement("div", {
    className: "posk-main"
  }, paneContent))) : /*#__PURE__*/React.createElement("div", {
    className: "posk-app"
  }, /*#__PURE__*/React.createElement(TopBar, {
    onSignOut: () => setAuthed(false),
    businessName: t.businessName,
    showOnline: t.onlineBadge
  }), /*#__PURE__*/React.createElement(TopNav, {
    items: NAV,
    value: tab,
    onChange: setTab
  }), /*#__PURE__*/React.createElement("div", {
    className: "posk-main"
  }, paneContent)), /*#__PURE__*/React.createElement("div", {
    className: "posk-toast" + (toast ? " show" : "")
  }, toast), panel);
}

/* ---- Single deterministic mount ----
   This file is ALSO compiled into the shared _ds_bundle.js. That copy
   executes while the HTML is still parsing (document.readyState ===
   "loading"), so it skips the mount. The real page copy is run by Babel
   after DOMContentLoaded (readyState "interactive"/"complete") — that is
   the one (and only one) that mounts. */
function mountPoS() {
  if (window.__posMounted) return;
  if (!window.TweaksPanel || !window.useTweaks) {
    return setTimeout(mountPoS, 12);
  }
  window.__posMounted = true;
  ReactDOM.createRoot(document.getElementById("root")).render(/*#__PURE__*/React.createElement(App, null));
}
if (document.readyState !== "loading") mountPoS();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/pos-app/app.kit.js", error: String((e && e.message) || e) }); }

// ui_kits/pos-app/tweaks-panel.jsx
try { (() => {
// @ds-adherence-ignore -- omelette starter scaffold (raw elements/hex/px by design)

/* BEGIN USAGE */
// tweaks-panel.jsx
// Reusable Tweaks shell + form-control helpers.
// Exports (to window): useTweaks, TweaksPanel, TweakSection, TweakRow, TweakSlider,
//   TweakToggle, TweakRadio, TweakSelect, TweakText, TweakNumber, TweakColor, TweakButton.
//
// Owns the host protocol (listens for __activate_edit_mode / __deactivate_edit_mode,
// posts __edit_mode_available / __edit_mode_set_keys / __edit_mode_dismissed) so
// individual prototypes don't re-roll it. Ships a consistent set of controls so you
// don't hand-draw <input type="range">, segmented radios, steppers, etc.
//
// Usage (in an HTML file that loads React + Babel):
//
//   const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
//     "primaryColor": "#D97757",
//     "palette": ["#D97757", "#29261b", "#f6f4ef"],
//     "fontSize": 16,
//     "density": "regular",
//     "dark": false
//   }/*EDITMODE-END*/;
//
//   function App() {
//     const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
//     return (
//       <div style={{ fontSize: t.fontSize, color: t.primaryColor }}>
//         Hello
//         <TweaksPanel>
//           <TweakSection label="Typography" />
//           <TweakSlider label="Font size" value={t.fontSize} min={10} max={32} unit="px"
//                        onChange={(v) => setTweak('fontSize', v)} />
//           <TweakRadio  label="Density" value={t.density}
//                        options={['compact', 'regular', 'comfy']}
//                        onChange={(v) => setTweak('density', v)} />
//           <TweakSection label="Theme" />
//           <TweakColor  label="Primary" value={t.primaryColor}
//                        options={['#D97757', '#2A6FDB', '#1F8A5B', '#7A5AE0']}
//                        onChange={(v) => setTweak('primaryColor', v)} />
//           <TweakColor  label="Palette" value={t.palette}
//                        options={[['#D97757', '#29261b', '#f6f4ef'],
//                                  ['#475569', '#0f172a', '#f1f5f9']]}
//                        onChange={(v) => setTweak('palette', v)} />
//           <TweakToggle label="Dark mode" value={t.dark}
//                        onChange={(v) => setTweak('dark', v)} />
//         </TweaksPanel>
//       </div>
//     );
//   }
//
// TweakRadio is the segmented control for 2–3 short options (auto-falls-back to
// TweakSelect past ~16/~10 chars per label); reach for TweakSelect directly when
// options are many or long. For color tweaks always curate 3-4 options rather than
// a free picker; an option can also be a whole 2–5 color palette (the stored value
// is the array). The Tweak* controls are a floor, not a ceiling — build custom
// controls inside the panel if a tweak calls for UI they don't cover.
/* END USAGE */
// ─────────────────────────────────────────────────────────────────────────────

const __TWEAKS_STYLE = `
  .twk-panel{position:fixed;right:16px;bottom:16px;z-index:2147483646;width:280px;
    max-height:calc(100vh - 32px);display:flex;flex-direction:column;
    transform:scale(var(--dc-inv-zoom,1));transform-origin:bottom right;
    background:rgba(250,249,247,.78);color:#29261b;
    -webkit-backdrop-filter:blur(24px) saturate(160%);backdrop-filter:blur(24px) saturate(160%);
    border:.5px solid rgba(255,255,255,.6);border-radius:14px;
    box-shadow:0 1px 0 rgba(255,255,255,.5) inset,0 12px 40px rgba(0,0,0,.18);
    font:11.5px/1.4 ui-sans-serif,system-ui,-apple-system,sans-serif;overflow:hidden}
  .twk-hd{display:flex;align-items:center;justify-content:space-between;
    padding:10px 8px 10px 14px;cursor:move;user-select:none}
  .twk-hd b{font-size:12px;font-weight:600;letter-spacing:.01em}
  .twk-x{appearance:none;border:0;background:transparent;color:rgba(41,38,27,.55);
    width:22px;height:22px;border-radius:6px;cursor:default;font-size:13px;line-height:1}
  .twk-x:hover{background:rgba(0,0,0,.06);color:#29261b}
  .twk-body{padding:2px 14px 14px;display:flex;flex-direction:column;gap:10px;
    overflow-y:auto;overflow-x:hidden;min-height:0;
    scrollbar-width:thin;scrollbar-color:rgba(0,0,0,.15) transparent}
  .twk-body::-webkit-scrollbar{width:8px}
  .twk-body::-webkit-scrollbar-track{background:transparent;margin:2px}
  .twk-body::-webkit-scrollbar-thumb{background:rgba(0,0,0,.15);border-radius:4px;
    border:2px solid transparent;background-clip:content-box}
  .twk-body::-webkit-scrollbar-thumb:hover{background:rgba(0,0,0,.25);
    border:2px solid transparent;background-clip:content-box}
  .twk-row{display:flex;flex-direction:column;gap:5px}
  .twk-row-h{flex-direction:row;align-items:center;justify-content:space-between;gap:10px}
  .twk-lbl{display:flex;justify-content:space-between;align-items:baseline;
    color:rgba(41,38,27,.72)}
  .twk-lbl>span:first-child{font-weight:500}
  .twk-val{color:rgba(41,38,27,.5);font-variant-numeric:tabular-nums}

  .twk-sect{font-size:10px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;
    color:rgba(41,38,27,.45);padding:10px 0 0}
  .twk-sect:first-child{padding-top:0}

  .twk-field{appearance:none;box-sizing:border-box;width:100%;min-width:0;height:26px;padding:0 8px;
    border:.5px solid rgba(0,0,0,.1);border-radius:7px;
    background:rgba(255,255,255,.6);color:inherit;font:inherit;outline:none}
  .twk-field:focus{border-color:rgba(0,0,0,.25);background:rgba(255,255,255,.85)}
  select.twk-field{padding-right:22px;
    background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'><path fill='rgba(0,0,0,.5)' d='M0 0h10L5 6z'/></svg>");
    background-repeat:no-repeat;background-position:right 8px center}

  .twk-slider{appearance:none;-webkit-appearance:none;width:100%;height:4px;margin:6px 0;
    border-radius:999px;background:rgba(0,0,0,.12);outline:none}
  .twk-slider::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;
    width:14px;height:14px;border-radius:50%;background:#fff;
    border:.5px solid rgba(0,0,0,.12);box-shadow:0 1px 3px rgba(0,0,0,.2);cursor:default}
  .twk-slider::-moz-range-thumb{width:14px;height:14px;border-radius:50%;
    background:#fff;border:.5px solid rgba(0,0,0,.12);box-shadow:0 1px 3px rgba(0,0,0,.2);cursor:default}

  .twk-seg{position:relative;display:flex;padding:2px;border-radius:8px;
    background:rgba(0,0,0,.06);user-select:none}
  .twk-seg-thumb{position:absolute;top:2px;bottom:2px;border-radius:6px;
    background:rgba(255,255,255,.9);box-shadow:0 1px 2px rgba(0,0,0,.12);
    transition:left .15s cubic-bezier(.3,.7,.4,1),width .15s}
  .twk-seg.dragging .twk-seg-thumb{transition:none}
  .twk-seg button{appearance:none;position:relative;z-index:1;flex:1;border:0;
    background:transparent;color:inherit;font:inherit;font-weight:500;min-height:22px;
    border-radius:6px;cursor:default;padding:4px 6px;line-height:1.2;
    overflow-wrap:anywhere}

  .twk-toggle{position:relative;width:32px;height:18px;border:0;border-radius:999px;
    background:rgba(0,0,0,.15);transition:background .15s;cursor:default;padding:0}
  .twk-toggle[data-on="1"]{background:#34c759}
  .twk-toggle i{position:absolute;top:2px;left:2px;width:14px;height:14px;border-radius:50%;
    background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.25);transition:transform .15s}
  .twk-toggle[data-on="1"] i{transform:translateX(14px)}

  .twk-num{display:flex;align-items:center;box-sizing:border-box;min-width:0;height:26px;padding:0 0 0 8px;
    border:.5px solid rgba(0,0,0,.1);border-radius:7px;background:rgba(255,255,255,.6)}
  .twk-num-lbl{font-weight:500;color:rgba(41,38,27,.6);cursor:ew-resize;
    user-select:none;padding-right:8px}
  .twk-num input{flex:1;min-width:0;height:100%;border:0;background:transparent;
    font:inherit;font-variant-numeric:tabular-nums;text-align:right;padding:0 8px 0 0;
    outline:none;color:inherit;-moz-appearance:textfield}
  .twk-num input::-webkit-inner-spin-button,.twk-num input::-webkit-outer-spin-button{
    -webkit-appearance:none;margin:0}
  .twk-num-unit{padding-right:8px;color:rgba(41,38,27,.45)}

  .twk-btn{appearance:none;height:26px;padding:0 12px;border:0;border-radius:7px;
    background:rgba(0,0,0,.78);color:#fff;font:inherit;font-weight:500;cursor:default}
  .twk-btn:hover{background:rgba(0,0,0,.88)}
  .twk-btn.secondary{background:rgba(0,0,0,.06);color:inherit}
  .twk-btn.secondary:hover{background:rgba(0,0,0,.1)}

  .twk-swatch{appearance:none;-webkit-appearance:none;width:56px;height:22px;
    border:.5px solid rgba(0,0,0,.1);border-radius:6px;padding:0;cursor:default;
    background:transparent;flex-shrink:0}
  .twk-swatch::-webkit-color-swatch-wrapper{padding:0}
  .twk-swatch::-webkit-color-swatch{border:0;border-radius:5.5px}
  .twk-swatch::-moz-color-swatch{border:0;border-radius:5.5px}

  .twk-chips{display:flex;gap:6px}
  .twk-chip{position:relative;appearance:none;flex:1;min-width:0;height:46px;
    padding:0;border:0;border-radius:6px;overflow:hidden;cursor:default;
    box-shadow:0 0 0 .5px rgba(0,0,0,.12),0 1px 2px rgba(0,0,0,.06);
    transition:transform .12s cubic-bezier(.3,.7,.4,1),box-shadow .12s}
  .twk-chip:hover{transform:translateY(-1px);
    box-shadow:0 0 0 .5px rgba(0,0,0,.18),0 4px 10px rgba(0,0,0,.12)}
  .twk-chip[data-on="1"]{box-shadow:0 0 0 1.5px rgba(0,0,0,.85),
    0 2px 6px rgba(0,0,0,.15)}
  .twk-chip>span{position:absolute;top:0;bottom:0;right:0;width:34%;
    display:flex;flex-direction:column;box-shadow:-1px 0 0 rgba(0,0,0,.1)}
  .twk-chip>span>i{flex:1;box-shadow:0 -1px 0 rgba(0,0,0,.1)}
  .twk-chip>span>i:first-child{box-shadow:none}
  .twk-chip svg{position:absolute;top:6px;left:6px;width:13px;height:13px;
    filter:drop-shadow(0 1px 1px rgba(0,0,0,.3))}
`;

// ── useTweaks ───────────────────────────────────────────────────────────────
// Single source of truth for tweak values. setTweak persists via the host
// (__edit_mode_set_keys → host rewrites the EDITMODE block on disk).
function useTweaks(defaults) {
  const [values, setValues] = React.useState(defaults);
  // Accepts either setTweak('key', value) or setTweak({ key: value, ... }) so a
  // useState-style call doesn't write a "[object Object]" key into the persisted
  // JSON block.
  const setTweak = React.useCallback((keyOrEdits, val) => {
    const edits = typeof keyOrEdits === 'object' && keyOrEdits !== null ? keyOrEdits : {
      [keyOrEdits]: val
    };
    setValues(prev => ({
      ...prev,
      ...edits
    }));
    window.parent.postMessage({
      type: '__edit_mode_set_keys',
      edits
    }, '*');
    // Same-window signal so in-page listeners (deck-stage rail thumbnails)
    // can react — the parent message only reaches the host, not peers.
    window.dispatchEvent(new CustomEvent('tweakchange', {
      detail: edits
    }));
  }, []);
  return [values, setTweak];
}

// ── TweaksPanel ─────────────────────────────────────────────────────────────
// Floating shell. Registers the protocol listener BEFORE announcing
// availability — if the announce ran first, the host's activate could land
// before our handler exists and the toolbar toggle would silently no-op.
// The close button posts __edit_mode_dismissed so the host's toolbar toggle
// flips off in lockstep; the host echoes __deactivate_edit_mode back which
// is what actually hides the panel.
function TweaksPanel({
  title = 'Tweaks',
  children
}) {
  const [open, setOpen] = React.useState(false);
  const dragRef = React.useRef(null);
  const offsetRef = React.useRef({
    x: 16,
    y: 16
  });
  const PAD = 16;
  const clampToViewport = React.useCallback(() => {
    const panel = dragRef.current;
    if (!panel) return;
    const w = panel.offsetWidth,
      h = panel.offsetHeight;
    const maxRight = Math.max(PAD, window.innerWidth - w - PAD);
    const maxBottom = Math.max(PAD, window.innerHeight - h - PAD);
    offsetRef.current = {
      x: Math.min(maxRight, Math.max(PAD, offsetRef.current.x)),
      y: Math.min(maxBottom, Math.max(PAD, offsetRef.current.y))
    };
    panel.style.right = offsetRef.current.x + 'px';
    panel.style.bottom = offsetRef.current.y + 'px';
  }, []);
  React.useEffect(() => {
    if (!open) return;
    clampToViewport();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', clampToViewport);
      return () => window.removeEventListener('resize', clampToViewport);
    }
    const ro = new ResizeObserver(clampToViewport);
    ro.observe(document.documentElement);
    return () => ro.disconnect();
  }, [open, clampToViewport]);
  React.useEffect(() => {
    const onMsg = e => {
      const t = e?.data?.type;
      if (t === '__activate_edit_mode') setOpen(true);else if (t === '__deactivate_edit_mode') setOpen(false);
    };
    window.addEventListener('message', onMsg);
    window.parent.postMessage({
      type: '__edit_mode_available'
    }, '*');
    return () => window.removeEventListener('message', onMsg);
  }, []);
  const dismiss = () => {
    setOpen(false);
    window.parent.postMessage({
      type: '__edit_mode_dismissed'
    }, '*');
  };
  const onDragStart = e => {
    const panel = dragRef.current;
    if (!panel) return;
    const r = panel.getBoundingClientRect();
    const sx = e.clientX,
      sy = e.clientY;
    const startRight = window.innerWidth - r.right;
    const startBottom = window.innerHeight - r.bottom;
    const move = ev => {
      offsetRef.current = {
        x: startRight - (ev.clientX - sx),
        y: startBottom - (ev.clientY - sy)
      };
      clampToViewport();
    };
    const up = () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };
  if (!open) return null;
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("style", null, __TWEAKS_STYLE), /*#__PURE__*/React.createElement("div", {
    ref: dragRef,
    className: "twk-panel",
    "data-omelette-chrome": "",
    style: {
      right: offsetRef.current.x,
      bottom: offsetRef.current.y
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-hd",
    onMouseDown: onDragStart
  }, /*#__PURE__*/React.createElement("b", null, title), /*#__PURE__*/React.createElement("button", {
    className: "twk-x",
    "aria-label": "Close tweaks",
    onMouseDown: e => e.stopPropagation(),
    onClick: dismiss
  }, "\u2715")), /*#__PURE__*/React.createElement("div", {
    className: "twk-body"
  }, children)));
}

// ── Layout helpers ──────────────────────────────────────────────────────────

function TweakSection({
  label,
  children
}) {
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "twk-sect"
  }, label), children);
}
function TweakRow({
  label,
  value,
  children,
  inline = false
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: inline ? 'twk-row twk-row-h' : 'twk-row'
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-lbl"
  }, /*#__PURE__*/React.createElement("span", null, label), value != null && /*#__PURE__*/React.createElement("span", {
    className: "twk-val"
  }, value)), children);
}

// ── Controls ────────────────────────────────────────────────────────────────

function TweakSlider({
  label,
  value,
  min = 0,
  max = 100,
  step = 1,
  unit = '',
  onChange
}) {
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label,
    value: `${value}${unit}`
  }, /*#__PURE__*/React.createElement("input", {
    type: "range",
    className: "twk-slider",
    min: min,
    max: max,
    step: step,
    value: value,
    onChange: e => onChange(Number(e.target.value))
  }));
}
function TweakToggle({
  label,
  value,
  onChange
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "twk-row twk-row-h"
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-lbl"
  }, /*#__PURE__*/React.createElement("span", null, label)), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "twk-toggle",
    "data-on": value ? '1' : '0',
    role: "switch",
    "aria-checked": !!value,
    onClick: () => onChange(!value)
  }, /*#__PURE__*/React.createElement("i", null)));
}
function TweakRadio({
  label,
  value,
  options,
  onChange
}) {
  const trackRef = React.useRef(null);
  const [dragging, setDragging] = React.useState(false);
  // The active value is read by pointer-move handlers attached for the lifetime
  // of a drag — ref it so a stale closure doesn't fire onChange for every move.
  const valueRef = React.useRef(value);
  valueRef.current = value;

  // Segments wrap mid-word once per-segment width runs out. The track is
  // ~248px (280 panel − 28 body pad − 4 seg pad), each button loses 12px
  // to its own padding, and 11.5px system-ui averages ~6.3px/char — so 2
  // options fit ~16 chars each, 3 fit ~10. Past that (or >3 options), fall
  // back to a dropdown rather than wrap.
  const labelLen = o => String(typeof o === 'object' ? o.label : o).length;
  const maxLen = options.reduce((m, o) => Math.max(m, labelLen(o)), 0);
  const fitsAsSegments = maxLen <= ({
    2: 16,
    3: 10
  }[options.length] ?? 0);
  if (!fitsAsSegments) {
    // <select> emits strings — map back to the original option value so the
    // fallback stays type-preserving (numbers, booleans) like the segment path.
    const resolve = s => {
      const m = options.find(o => String(typeof o === 'object' ? o.value : o) === s);
      return m === undefined ? s : typeof m === 'object' ? m.value : m;
    };
    return /*#__PURE__*/React.createElement(TweakSelect, {
      label: label,
      value: value,
      options: options,
      onChange: s => onChange(resolve(s))
    });
  }
  const opts = options.map(o => typeof o === 'object' ? o : {
    value: o,
    label: o
  });
  const idx = Math.max(0, opts.findIndex(o => o.value === value));
  const n = opts.length;
  const segAt = clientX => {
    const r = trackRef.current.getBoundingClientRect();
    const inner = r.width - 4;
    const i = Math.floor((clientX - r.left - 2) / inner * n);
    return opts[Math.max(0, Math.min(n - 1, i))].value;
  };
  const onPointerDown = e => {
    setDragging(true);
    const v0 = segAt(e.clientX);
    if (v0 !== valueRef.current) onChange(v0);
    const move = ev => {
      if (!trackRef.current) return;
      const v = segAt(ev.clientX);
      if (v !== valueRef.current) onChange(v);
    };
    const up = () => {
      setDragging(false);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label
  }, /*#__PURE__*/React.createElement("div", {
    ref: trackRef,
    role: "radiogroup",
    onPointerDown: onPointerDown,
    className: dragging ? 'twk-seg dragging' : 'twk-seg'
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-seg-thumb",
    style: {
      left: `calc(2px + ${idx} * (100% - 4px) / ${n})`,
      width: `calc((100% - 4px) / ${n})`
    }
  }), opts.map(o => /*#__PURE__*/React.createElement("button", {
    key: o.value,
    type: "button",
    role: "radio",
    "aria-checked": o.value === value
  }, o.label))));
}
function TweakSelect({
  label,
  value,
  options,
  onChange
}) {
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label
  }, /*#__PURE__*/React.createElement("select", {
    className: "twk-field",
    value: value,
    onChange: e => onChange(e.target.value)
  }, options.map(o => {
    const v = typeof o === 'object' ? o.value : o;
    const l = typeof o === 'object' ? o.label : o;
    return /*#__PURE__*/React.createElement("option", {
      key: v,
      value: v
    }, l);
  })));
}
function TweakText({
  label,
  value,
  placeholder,
  onChange
}) {
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label
  }, /*#__PURE__*/React.createElement("input", {
    className: "twk-field",
    type: "text",
    value: value,
    placeholder: placeholder,
    onChange: e => onChange(e.target.value)
  }));
}
function TweakNumber({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  onChange
}) {
  const clamp = n => {
    if (min != null && n < min) return min;
    if (max != null && n > max) return max;
    return n;
  };
  const startRef = React.useRef({
    x: 0,
    val: 0
  });
  const onScrubStart = e => {
    e.preventDefault();
    startRef.current = {
      x: e.clientX,
      val: value
    };
    const decimals = (String(step).split('.')[1] || '').length;
    const move = ev => {
      const dx = ev.clientX - startRef.current.x;
      const raw = startRef.current.val + dx * step;
      const snapped = Math.round(raw / step) * step;
      onChange(clamp(Number(snapped.toFixed(decimals))));
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "twk-num"
  }, /*#__PURE__*/React.createElement("span", {
    className: "twk-num-lbl",
    onPointerDown: onScrubStart
  }, label), /*#__PURE__*/React.createElement("input", {
    type: "number",
    value: value,
    min: min,
    max: max,
    step: step,
    onChange: e => onChange(clamp(Number(e.target.value)))
  }), unit && /*#__PURE__*/React.createElement("span", {
    className: "twk-num-unit"
  }, unit));
}

// Relative-luminance contrast pick — checkmarks drawn over a swatch need to
// read on both #111 and #fafafa without per-option configuration. Hex input
// only (#rgb / #rrggbb); named or rgb()/hsl() colors fall through to "light".
function __twkIsLight(hex) {
  const h = String(hex).replace('#', '');
  const x = h.length === 3 ? h.replace(/./g, c => c + c) : h.padEnd(6, '0');
  const n = parseInt(x.slice(0, 6), 16);
  if (Number.isNaN(n)) return true;
  const r = n >> 16 & 255,
    g = n >> 8 & 255,
    b = n & 255;
  return r * 299 + g * 587 + b * 114 > 148000;
}
const __TwkCheck = ({
  light
}) => /*#__PURE__*/React.createElement("svg", {
  viewBox: "0 0 14 14",
  "aria-hidden": "true"
}, /*#__PURE__*/React.createElement("path", {
  d: "M3 7.2 5.8 10 11 4.2",
  fill: "none",
  strokeWidth: "2.2",
  strokeLinecap: "round",
  strokeLinejoin: "round",
  stroke: light ? 'rgba(0,0,0,.78)' : '#fff'
}));

// TweakColor — curated color/palette picker. Each option is either a single
// hex string or an array of 1-5 hex strings; the card adapts — a lone color
// renders solid, a palette renders colors[0] as the hero (left ~2/3) with the
// rest stacked in a sharp column on the right. onChange emits the
// option in the shape it was passed (string stays string, array stays array).
// Without options it falls back to the native color input for back-compat.
function TweakColor({
  label,
  value,
  options,
  onChange
}) {
  if (!options || !options.length) {
    return /*#__PURE__*/React.createElement("div", {
      className: "twk-row twk-row-h"
    }, /*#__PURE__*/React.createElement("div", {
      className: "twk-lbl"
    }, /*#__PURE__*/React.createElement("span", null, label)), /*#__PURE__*/React.createElement("input", {
      type: "color",
      className: "twk-swatch",
      value: value,
      onChange: e => onChange(e.target.value)
    }));
  }
  // Native <input type=color> emits lowercase hex per the HTML spec, so
  // compare case-insensitively. String() guards JSON.stringify(undefined),
  // which returns the primitive undefined (no .toLowerCase).
  const key = o => String(JSON.stringify(o)).toLowerCase();
  const cur = key(value);
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-chips",
    role: "radiogroup"
  }, options.map((o, i) => {
    const colors = Array.isArray(o) ? o : [o];
    const [hero, ...rest] = colors;
    const sup = rest.slice(0, 4);
    const on = key(o) === cur;
    return /*#__PURE__*/React.createElement("button", {
      key: i,
      type: "button",
      className: "twk-chip",
      role: "radio",
      "aria-checked": on,
      "data-on": on ? '1' : '0',
      "aria-label": colors.join(', '),
      title: colors.join(' · '),
      style: {
        background: hero
      },
      onClick: () => onChange(o)
    }, sup.length > 0 && /*#__PURE__*/React.createElement("span", null, sup.map((c, j) => /*#__PURE__*/React.createElement("i", {
      key: j,
      style: {
        background: c
      }
    }))), on && /*#__PURE__*/React.createElement(__TwkCheck, {
      light: __twkIsLight(hero)
    }));
  })));
}
function TweakButton({
  label,
  onClick,
  secondary = false
}) {
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: secondary ? 'twk-btn secondary' : 'twk-btn',
    onClick: onClick
  }, label);
}
Object.assign(window, {
  useTweaks,
  TweaksPanel,
  TweakSection,
  TweakRow,
  TweakSlider,
  TweakToggle,
  TweakRadio,
  TweakSelect,
  TweakText,
  TweakNumber,
  TweakColor,
  TweakButton
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/pos-app/tweaks-panel.jsx", error: String((e && e.message) || e) }); }

// waiter-app/android-frame.jsx
try { (() => {
// @ds-adherence-ignore -- omelette starter scaffold (raw elements/hex/px by design)

/* BEGIN USAGE */
// Android.jsx — Simplified Android (Material 3) device frame
// Status bar + top app bar + content + gesture nav + keyboard.
// Based on Figma M3 spec. No dependencies, no image assets.
// Exports (to window): AndroidDevice, AndroidStatusBar, AndroidAppBar, AndroidListItem, AndroidNavBar, AndroidKeyboard
//
// Usage — wrap your screen content in <AndroidDevice> to get the bezel, status
// bar and gesture nav (props: title, large, keyboard, dark):
//
//   <AndroidDevice title="Inbox" large>
//     ...your screen content...
//   </AndroidDevice>
//   <AndroidDevice title="Compose" keyboard>…</AndroidDevice>
/* END USAGE */

const MD_C = {
  surface: '#f4fbf8',
  surfaceVariant: '#dae5e1',
  inverseOnSurface: '#ecf2ef',
  secondaryContainer: '#cde8e1',
  primaryFixedDim: '#83d5c6',
  onSurface: '#171d1b',
  onSurfaceVar: '#49454f',
  onPrimaryContainer: '#00201c',
  primary: '#006a60',
  frameBorder: 'rgba(116,119,117,0.5)'
};

// ─────────────────────────────────────────────────────────────
// Status bar (time left, wifi/cell/battery right)
// ─────────────────────────────────────────────────────────────
function AndroidStatusBar({
  dark = false
}) {
  const c = dark ? '#fff' : MD_C.onSurface;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: 40,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 16px',
      position: 'relative',
      fontFamily: 'Roboto, system-ui, sans-serif'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 128,
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      fontWeight: 400,
      letterSpacing: 0.25,
      lineHeight: '20px',
      color: c
    }
  }, "9:30")), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: '50%',
      top: 8,
      transform: 'translateX(-50%)',
      width: 24,
      height: 24,
      borderRadius: 100,
      background: '#2e2e2e'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      paddingRight: 2
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "16",
    height: "16",
    viewBox: "0 0 16 16",
    style: {
      marginRight: -2
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M8 13.3L.67 5.97a10.37 10.37 0 0114.66 0L8 13.3z",
    fill: c
  })), /*#__PURE__*/React.createElement("svg", {
    width: "16",
    height: "16",
    viewBox: "0 0 16 16",
    style: {
      marginRight: -2
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M14.67 14.67V1.33L1.33 14.67h13.34z",
    fill: c
  }))), /*#__PURE__*/React.createElement("svg", {
    width: "16",
    height: "16",
    viewBox: "0 0 16 16"
  }, /*#__PURE__*/React.createElement("rect", {
    x: "3.75",
    y: "2",
    width: "8.5",
    height: "13",
    rx: "1.5",
    fill: c
  }), /*#__PURE__*/React.createElement("rect", {
    x: "5.5",
    y: "0.9",
    width: "5",
    height: "2",
    rx: "0.5",
    fill: c
  }))));
}

// ─────────────────────────────────────────────────────────────
// Top app bar (Material 3 small/medium)
// ─────────────────────────────────────────────────────────────
function AndroidAppBar({
  title = 'Title',
  large = false
}) {
  const iconDot = /*#__PURE__*/React.createElement("div", {
    style: {
      width: 48,
      height: 48,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 22,
      height: 22,
      borderRadius: '50%',
      background: MD_C.onSurfaceVar,
      opacity: 0.3
    }
  }));
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: MD_C.surface,
      padding: '4px 4px 0'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: 56,
      display: 'flex',
      alignItems: 'center',
      gap: 4
    }
  }, iconDot, !large && /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      fontSize: 22,
      fontWeight: 400,
      color: MD_C.onSurface,
      fontFamily: 'Roboto, system-ui, sans-serif'
    }
  }, title), large && /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }), iconDot), large && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '16px 16px 20px',
      fontSize: 28,
      fontWeight: 400,
      color: MD_C.onSurface,
      fontFamily: 'Roboto, system-ui, sans-serif'
    }
  }, title));
}

// ─────────────────────────────────────────────────────────────
// List item (Material 3)
// ─────────────────────────────────────────────────────────────
function AndroidListItem({
  headline,
  supporting,
  leading
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      padding: '12px 16px',
      minHeight: 56,
      boxSizing: 'border-box',
      fontFamily: 'Roboto, system-ui, sans-serif'
    }
  }, leading && /*#__PURE__*/React.createElement("div", {
    style: {
      width: 40,
      height: 40,
      borderRadius: '50%',
      background: MD_C.primary,
      color: '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 18,
      fontWeight: 500,
      flexShrink: 0
    }
  }, leading), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 16,
      color: MD_C.onSurface,
      lineHeight: '24px'
    }
  }, headline), supporting && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      color: MD_C.onSurfaceVar,
      lineHeight: '20px'
    }
  }, supporting)));
}

// ─────────────────────────────────────────────────────────────
// Gesture nav bar (pill)
// ─────────────────────────────────────────────────────────────
function AndroidNavBar({
  dark = false
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: 24,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 108,
      height: 4,
      borderRadius: 2,
      background: dark ? '#fff' : MD_C.onSurface,
      opacity: 0.4
    }
  }));
}

// ─────────────────────────────────────────────────────────────
// Device frame — wraps everything
// ─────────────────────────────────────────────────────────────
function AndroidDevice({
  children,
  width = 412,
  height = 892,
  dark = false,
  title,
  large = false,
  keyboard = false
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width,
      height,
      borderRadius: 18,
      overflow: 'hidden',
      background: dark ? '#1d1b20' : MD_C.surface,
      border: `8px solid ${MD_C.frameBorder}`,
      boxShadow: '0 30px 80px rgba(0,0,0,0.25)',
      display: 'flex',
      flexDirection: 'column',
      boxSizing: 'border-box'
    }
  }, /*#__PURE__*/React.createElement(AndroidStatusBar, {
    dark: dark
  }), title !== undefined && /*#__PURE__*/React.createElement(AndroidAppBar, {
    title: title,
    large: large
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflow: 'auto'
    }
  }, children), keyboard && /*#__PURE__*/React.createElement(AndroidKeyboard, null), /*#__PURE__*/React.createElement(AndroidNavBar, {
    dark: dark
  }));
}

// ─────────────────────────────────────────────────────────────
// Keyboard — Gboard (Material 3)
// ─────────────────────────────────────────────────────────────
function AndroidKeyboard() {
  let _k = 0;
  const key = (l, {
    flex = 1,
    bg = MD_C.surface,
    r = 6,
    minW,
    fs = 21
  } = {}) => /*#__PURE__*/React.createElement("div", {
    key: _k++,
    style: {
      height: 46,
      borderRadius: r,
      flex,
      minWidth: minW,
      background: bg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Roboto, system-ui',
      fontSize: fs,
      color: MD_C.onPrimaryContainer
    }
  }, l);
  const row = (keys, style = {}) => /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6,
      justifyContent: 'center',
      ...style
    }
  }, keys.map(l => key(l)));
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: MD_C.inverseOnSurface,
      padding: '0 8px 8px',
      display: 'flex',
      flexDirection: 'column',
      gap: 4
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: 44
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }
  }, row(['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p']), row(['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'], {
    padding: '0 20px'
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6
    }
  }, key('', {
    bg: MD_C.surfaceVariant
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6,
      flex: 7,
      minWidth: 274
    }
  }, ['z', 'x', 'c', 'v', 'b', 'n', 'm'].map(l => key(l))), key('', {
    bg: MD_C.surfaceVariant
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6
    }
  }, key('?123', {
    bg: MD_C.secondaryContainer,
    r: 100,
    minW: 58,
    fs: 14
  }), key(',', {
    bg: MD_C.surfaceVariant
  }), key('', {
    flex: 3,
    minW: 154
  }), key('.', {
    bg: MD_C.surfaceVariant
  }), key('', {
    bg: MD_C.primaryFixedDim,
    r: 100,
    minW: 58
  }))));
}
Object.assign(window, {
  AndroidDevice,
  AndroidStatusBar,
  AndroidAppBar,
  AndroidListItem,
  AndroidNavBar,
  AndroidKeyboard
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "waiter-app/android-frame.jsx", error: String((e && e.message) || e) }); }

// waiter-app/app.jsx
try { (() => {
// ============================================================
// Waiter App — shell: state, routing, actions, tweaks, frame
// ============================================================
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "brand": "#0f5da4",
  "scheme": "classic",
  "size": "medium",
  "lang": "en"
} /*EDITMODE-END*/;
const {
  useState,
  useEffect,
  useRef
} = React;
const W = window.WD;
const {
  tt
} = window;
const {
  useTweaks,
  TweaksPanel,
  TweakSection,
  TweakRadio,
  TweakColor
} = window;
const {
  StatusRow,
  BottomNav,
  Toast
} = window;
const {
  HomeScreen,
  TablesScreen,
  TableDetailScreen,
  OrderMenuScreen,
  OrdersScreen,
  TicketDetailScreen,
  NotificationsScreen,
  CartSheet,
  LockScreen
} = window;
const PH_W = 392,
  PH_H = 826;
function App() {
  const [tw, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const lang = tw.lang;
  const brand = W.BRANDS.find(b => b.hex === tw.brand) || W.BRANDS[0];
  const scheme = W.SCHEMES[tw.scheme] || W.SCHEMES.classic;

  // ── data state ──
  const [tables, setTables] = useState(() => W.tablesForSize(tw.size).map(t => ({
    ...t
  })));
  const [tickets, setTickets] = useState(() => W.TICKETS.map(t => ({
    ...t,
    items: t.items.map(i => ({
      ...i
    }))
  })));
  const [notifs, setNotifs] = useState(() => W.NOTIFS.map(n => ({
    ...n
  })));
  const [cart, setCart] = useState({
    tableId: null,
    items: []
  });
  const [reviewOpen, setReviewOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [locked, setLocked] = useState(true);
  const [staff, setStaff] = useState(W.STAFF[0]);
  const [screen, setScreen] = useState({
    name: 'home',
    params: {}
  });
  const histRef = useRef([{
    name: 'home',
    params: {}
  }]);
  const toastTimer = useRef(null);
  const seqRef = useRef(300);

  // regenerate tables when venue size changes
  const sizeRef = useRef(tw.size);
  useEffect(() => {
    if (sizeRef.current !== tw.size) {
      sizeRef.current = tw.size;
      setTables(W.tablesForSize(tw.size).map(t => ({
        ...t
      })));
    }
  }, [tw.size]);

  // ── helpers ──
  const t = key => tt(W.STR[key], lang);
  const ttl = obj => tt(obj, lang);
  const setLang = l => setTweak('lang', l);
  const showToast = msg => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2400);
  };

  // ── navigation ──
  const go = (name, params = {}) => {
    histRef.current.push({
      name,
      params
    });
    setScreen({
      name,
      params
    });
  };
  const back = () => {
    if (histRef.current.length > 1) histRef.current.pop();
    setScreen({
      ...histRef.current[histRef.current.length - 1]
    });
  };
  const setTab = id => {
    histRef.current = [{
      name: id,
      params: {}
    }];
    setScreen({
      name: id,
      params: {}
    });
  };

  // visible notifs (only those whose table exists at current size)
  const visNotifs = notifs.filter(n => tables.some(x => x.id === n.tableId));
  const alertCount = visNotifs.filter(n => !n.read).length;

  // ── actions ──
  const actions = {
    setTableStatus(id, status) {
      setTables(prev => prev.map(x => {
        if (x.id !== id) return x;
        if (status === 'clean') return {
          ...x,
          status,
          guests: 0,
          mins: 0,
          flag: null
        };
        if (status === 'dirty') return {
          ...x,
          status,
          guests: 0,
          mins: 0,
          flag: null
        };
        if (status === 'occupied') return {
          ...x,
          status,
          guests: x.guests || 2,
          mins: x.mins || 1
        };
        return {
          ...x,
          status
        };
      }));
      showToast(t('tableLabel') + ' ' + (tables.find(x => x.id === id) ? W.tableLabel(tables.find(x => x.id === id)) : '') + ' · ' + ttl(W.STATUS[status]));
    },
    startOrder(tableId) {
      setCart({
        tableId,
        items: []
      });
      setReviewOpen(false);
      go('menu', {
        id: tableId
      });
    },
    addToCart(id) {
      setCart(c => {
        const f = c.items.find(it => it.id === id);
        if (f) return {
          ...c,
          items: c.items.map(it => it.id === id ? {
            ...it,
            qty: it.qty + 1
          } : it)
        };
        return {
          ...c,
          items: [...c.items, {
            id,
            qty: 1
          }]
        };
      });
    },
    setQty(id, q) {
      setCart(c => q <= 0 ? {
        ...c,
        items: c.items.filter(it => it.id !== id)
      } : {
        ...c,
        items: c.items.map(it => it.id === id ? {
          ...it,
          qty: q
        } : it)
      });
    },
    openReview() {
      setReviewOpen(true);
    },
    closeReview() {
      setReviewOpen(false);
    },
    sendOrder(tableId) {
      const id = 'K-' + seqRef.current++;
      const items = cart.items.map(i => ({
        ...i
      }));
      setTickets(prev => [{
        id,
        tableId,
        status: 'preparing',
        mins: 0,
        items
      }, ...prev]);
      setTables(prev => prev.map(x => x.id === tableId ? {
        ...x,
        status: 'occupied',
        flag: null,
        guests: x.guests || 2,
        mins: x.mins || 1
      } : x));
      setCart({
        tableId: null,
        items: []
      });
      setReviewOpen(false);
      showToast(t('sent') + ' · ' + items.reduce((s, i) => s + i.qty, 0) + ' ' + t('items'));
      back();
      // simulate kitchen finishing
      setTimeout(() => {
        setTickets(prev => prev.map(tk => tk.id === id ? {
          ...tk,
          status: 'ready'
        } : tk));
        setTables(prev => prev.map(x => x.id === tableId ? {
          ...x,
          flag: 'ready'
        } : x));
        setNotifs(prev => [{
          id: 'n' + seqRef.current++,
          kind: 'ready',
          tableId,
          ticket: id,
          mins: 0,
          read: false
        }, ...prev]);
      }, 7000);
    },
    serveTicket(ticketId) {
      let tableId = null;
      setTickets(prev => prev.map(tk => {
        if (tk.id === ticketId) {
          tableId = tk.tableId;
          return {
            ...tk,
            status: 'served'
          };
        }
        return tk;
      }));
      setTables(prev => prev.map(x => x.flag === 'ready' && (tableId === null || x.id === tableId) ? {
        ...x,
        flag: null
      } : x));
      setNotifs(prev => prev.map(n => n.ticket === ticketId ? {
        ...n,
        read: true
      } : n));
      showToast(t('served'));
    },
    resolveNotif(id) {
      setNotifs(prev => prev.map(n => n.id === id ? {
        ...n,
        read: true
      } : n));
      setTables(prev => prev.map(x => {
        const n = notifs.find(nn => nn.id === id);
        if (n && x.id === n.tableId && (n.kind === 'called' || n.kind === 'bill')) return {
          ...x,
          flag: null
        };
        return x;
      }));
    },
    markAllRead() {
      setNotifs(prev => prev.map(n => ({
        ...n,
        read: true
      })));
    },
    unlock(s) {
      setStaff(s);
      histRef.current = [{
        name: 'home',
        params: {}
      }];
      setScreen({
        name: 'home',
        params: {}
      });
      setLocked(false);
      showToast(t('welcomeBack') + ', ' + s.name.split(' ')[0]);
    },
    lock() {
      setLocked(true);
    }
  };
  const ctx = {
    lang,
    setLang,
    t,
    ttl,
    brand,
    scheme,
    tables,
    tickets,
    notifs: visNotifs,
    cart,
    go,
    back,
    setTab,
    actions,
    screen,
    staff
  };

  // ── which screen + chrome ──
  const SCREENS = {
    home: HomeScreen,
    tables: TablesScreen,
    table: TableDetailScreen,
    menu: OrderMenuScreen,
    orders: OrdersScreen,
    ticket: TicketDetailScreen,
    alerts: NotificationsScreen
  };
  const Cur = SCREENS[screen.name] || HomeScreen;
  const darkStatus = locked || ['home', 'table', 'menu'].includes(screen.name);
  const statusBg = darkStatus ? `linear-gradient(135deg, ${brand.dd}, ${brand.d})` : '#fff';
  const showNav = !locked && !['menu'].includes(screen.name);
  const tableForReview = tables.find(x => x.id === cart.tableId);

  // active tab highlight
  const activeTab = ['home', 'tables', 'orders', 'alerts'].includes(screen.name) ? screen.name : screen.name === 'table' ? 'tables' : screen.name === 'menu' ? 'tables' : screen.name === 'ticket' ? 'orders' : 'home';

  // ── scale to fit ──
  const stageRef = useRef(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const fit = () => {
      const el = stageRef.current;
      if (!el) return;
      const pad = 28;
      const s = Math.min((el.clientWidth - pad) / PH_W, (el.clientHeight - pad) / PH_H, 1.15);
      setScale(s > 0 ? s : 1);
    };
    fit();
    const ro = new ResizeObserver(fit);
    if (stageRef.current) ro.observe(stageRef.current);
    window.addEventListener('resize', fit);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', fit);
    };
  }, []);
  return /*#__PURE__*/React.createElement("div", {
    ref: stageRef,
    style: {
      position: 'fixed',
      inset: 0,
      display: 'grid',
      placeItems: 'center',
      background: 'radial-gradient(circle at 50% 0%, #e9eef4 0%, #dde4ec 60%, #d3dbe5 100%)',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: PH_W,
      height: PH_H,
      transform: `scale(${scale})`,
      transformOrigin: 'center center',
      borderRadius: 46,
      background: '#0c1118',
      padding: 9,
      boxShadow: '0 50px 90px -30px rgba(20,34,48,.55), 0 8px 24px rgba(20,34,48,.2)',
      flex: 'none'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: '100%',
      height: '100%',
      borderRadius: 38,
      overflow: 'hidden',
      background: '#fff',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: statusBg,
      flex: 'none'
    }
  }, /*#__PURE__*/React.createElement(StatusRow, {
    dark: darkStatus
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      position: 'relative',
      overflow: 'hidden',
      minHeight: 0
    }
  }, locked ? /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0
    }
  }, /*#__PURE__*/React.createElement(LockScreen, {
    ctx: ctx
  })) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    key: screen.name + JSON.stringify(screen.params),
    className: "wa-scroll",
    style: {
      position: 'absolute',
      inset: 0,
      overflowY: 'auto',
      WebkitOverflowScrolling: 'touch'
    }
  }, /*#__PURE__*/React.createElement(Cur, {
    ctx: ctx
  })), /*#__PURE__*/React.createElement(Toast, {
    toast: toast
  }), reviewOpen && screen.name === 'menu' && /*#__PURE__*/React.createElement(CartSheet, {
    ctx: ctx,
    table: tableForReview,
    onClose: actions.closeReview
  }))), showNav && /*#__PURE__*/React.createElement(BottomNav, {
    tab: activeTab,
    setTab: setTab,
    brand: brand,
    alertCount: alertCount,
    t: t
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 'none',
      height: 20,
      display: 'grid',
      placeItems: 'center',
      background: locked ? brand.hex : showNav ? '#fff' : 'var(--bg)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 120,
      height: 4,
      borderRadius: 2,
      background: locked ? '#fff' : 'var(--ink-3)',
      opacity: .4
    }
  })))), /*#__PURE__*/React.createElement(TweaksPanel, null, /*#__PURE__*/React.createElement(TweakSection, {
    label: lang === 'sw' ? 'Lugha' : 'Language'
  }), /*#__PURE__*/React.createElement(TweakRadio, {
    label: lang === 'sw' ? 'Lugha' : 'Language',
    value: lang === 'sw' ? 'Swahili' : 'English',
    options: ['English', 'Swahili'],
    onChange: v => setLang(v === 'Swahili' ? 'sw' : 'en')
  }), /*#__PURE__*/React.createElement(TweakSection, {
    label: lang === 'sw' ? 'Mwonekano' : 'Appearance'
  }), /*#__PURE__*/React.createElement(TweakColor, {
    label: lang === 'sw' ? 'Rangi ya brand' : 'Brand color',
    value: tw.brand,
    options: W.BRANDS.map(b => b.hex),
    onChange: v => setTweak('brand', v)
  }), /*#__PURE__*/React.createElement(TweakRadio, {
    label: lang === 'sw' ? 'Rangi za hali' : 'Status colors',
    value: tw.scheme.charAt(0).toUpperCase() + tw.scheme.slice(1),
    options: ['Classic', 'Traffic', 'Cool'],
    onChange: v => setTweak('scheme', v.toLowerCase())
  }), /*#__PURE__*/React.createElement(TweakSection, {
    label: lang === 'sw' ? 'Ukubwa wa eneo' : 'Venue size'
  }), /*#__PURE__*/React.createElement(TweakRadio, {
    label: lang === 'sw' ? 'Idadi ya meza' : 'Tables',
    value: tw.size.charAt(0).toUpperCase() + tw.size.slice(1),
    options: ['Small', 'Medium', 'Large'],
    onChange: v => setTweak('size', v.toLowerCase())
  })));
}

// Mount only on the waiter app's own page — guard so this file (which the DS
// compiler also bundles into _ds_bundle.js) does not try to mount or read
// window.WD on other pages that load the shared bundle.
if (window.WD && document.getElementById('root') && !window.__waiterMounted) {
  window.__waiterMounted = true;
  ReactDOM.createRoot(document.getElementById('root')).render(/*#__PURE__*/React.createElement(App, null));
}
})(); } catch (e) { __ds_ns.__errors.push({ path: "waiter-app/app.jsx", error: String((e && e.message) || e) }); }

// waiter-app/data.js
try { (() => {
// ============================================================
// BiasharaPOS — Waiter App · data model + i18n
// Venue: Kilimani Grill & Bar (Dar es Salaam) — grill house, restaurant + bar
// Exposes window.WD
// ============================================================

// ---- brand palette (concrete hexes for inline styles) ----
const C = {
  blue: '#0f5da4',
  blueD: '#0c4a85',
  blueDD: '#0a3a6b',
  blue100: '#cfe1f4',
  blue50: '#e8f1fa',
  green: '#239b46',
  greenD: '#1b7c34',
  greenDD: '#145f28',
  green100: '#cce9d4',
  green50: '#e8f6ec',
  gold: '#e7a52c',
  goldL: '#f4b53e',
  gold50: '#fdf3e1',
  cyan: '#2faee4',
  amber: '#ba7517',
  red: '#d85a30',
  redD: '#b8431f',
  red50: '#fef2f2',
  ink: '#13202c',
  ink2: '#45525e',
  ink3: '#7a8590',
  bg: '#f6f8fb',
  surface: '#ffffff',
  tint: '#eef4f6',
  line: '#e4e8ee',
  line2: '#d4dae2'
};

// ---- venue + waiter ----
const VENUE = {
  en: 'Kilimani Grill & Bar',
  sw: 'Kilimani Grill & Bar',
  loc: 'Masaki · Dar es Salaam'
};
const SHIFT = {
  en: 'Evening shift',
  sw: 'Zamu ya jioni'
};
// shared wall-mounted tablet — staff tap their name then enter a 4-digit PIN
const STAFF = [{
  id: 'amani',
  name: 'Amani Mushi',
  initials: 'AM',
  pin: '1234',
  role: {
    en: 'Waiter',
    sw: 'Mhudumu'
  },
  shift: SHIFT
}, {
  id: 'neema',
  name: 'Neema Joseph',
  initials: 'NJ',
  pin: '1234',
  role: {
    en: 'Waiter',
    sw: 'Mhudumu'
  },
  shift: SHIFT
}, {
  id: 'baraka',
  name: 'Baraka Said',
  initials: 'BS',
  pin: '1234',
  role: {
    en: 'Bar',
    sw: 'Baa'
  },
  shift: SHIFT
}, {
  id: 'zawadi',
  name: 'Zawadi Mollel',
  initials: 'ZM',
  pin: '1234',
  role: {
    en: 'Waiter',
    sw: 'Mhudumu'
  },
  shift: SHIFT
}];
const WAITER = STAFF[0];

// ---- money ----
function fmtTZS(n) {
  return 'TZS ' + n.toLocaleString('en-US');
}

// ---- menu (grill house + bar, bilingual) ----
const CATS = [{
  id: 'grill',
  en: 'Grill',
  sw: 'Choma'
}, {
  id: 'mains',
  en: 'Mains',
  sw: 'Vyakula'
}, {
  id: 'sides',
  en: 'Sides',
  sw: 'Nyongeza'
}, {
  id: 'soft',
  en: 'Drinks',
  sw: 'Vinywaji'
}, {
  id: 'bar',
  en: 'Bar',
  sw: 'Baa'
}];
const MENU = [
// grill
{
  id: 'm1',
  cat: 'grill',
  en: 'Nyama Choma 1kg',
  sw: 'Nyama Choma kg 1',
  price: 18000,
  note: {
    en: 'Grilled beef',
    sw: 'Ng\u2019ombe'
  }
}, {
  id: 'm2',
  cat: 'grill',
  en: 'Mishkaki (5 sticks)',
  sw: 'Mishkaki (vijiti 5)',
  price: 12000,
  note: {
    en: 'Beef skewers',
    sw: 'Vijiti vya nyama'
  }
}, {
  id: 'm3',
  cat: 'grill',
  en: 'Kuku Choma \u00bd',
  sw: 'Kuku Choma \u00bd',
  price: 14000,
  note: {
    en: 'Grilled chicken',
    sw: 'Kuku'
  }
}, {
  id: 'm4',
  cat: 'grill',
  en: 'Mbuzi Choma 1kg',
  sw: 'Mbuzi Choma kg 1',
  price: 22000,
  note: {
    en: 'Grilled goat',
    sw: 'Mbuzi'
  }
},
// mains
{
  id: 'm5',
  cat: 'mains',
  en: 'Samaki wa Kupaka',
  sw: 'Samaki wa Kupaka',
  price: 16000,
  note: {
    en: 'Coconut fish',
    sw: 'Samaki nazi'
  }
}, {
  id: 'm6',
  cat: 'mains',
  en: 'Pilau ya Nyama',
  sw: 'Pilau ya Nyama',
  price: 9000,
  note: {
    en: 'Spiced rice',
    sw: 'Wali wa viungo'
  }
}, {
  id: 'm7',
  cat: 'mains',
  en: 'Chips Mayai',
  sw: 'Chips Mayai',
  price: 8000,
  note: {
    en: 'Chip omelette',
    sw: ''
  }
}, {
  id: 'm8',
  cat: 'mains',
  en: 'Wali Maharage',
  sw: 'Wali Maharage',
  price: 7000,
  note: {
    en: 'Rice & beans',
    sw: ''
  }
},
// sides
{
  id: 'm9',
  cat: 'sides',
  en: 'Ugali',
  sw: 'Ugali',
  price: 2000,
  note: {
    en: '',
    sw: ''
  }
}, {
  id: 'm10',
  cat: 'sides',
  en: 'Chips',
  sw: 'Chipsi',
  price: 4000,
  note: {
    en: 'Fries',
    sw: ''
  }
}, {
  id: 'm11',
  cat: 'sides',
  en: 'Mchicha',
  sw: 'Mchicha',
  price: 4000,
  note: {
    en: 'Greens',
    sw: ''
  }
}, {
  id: 'm12',
  cat: 'sides',
  en: 'Kachumbari',
  sw: 'Kachumbari',
  price: 3500,
  note: {
    en: 'Tomato salad',
    sw: ''
  }
},
// soft drinks
{
  id: 'm13',
  cat: 'soft',
  en: 'Soda 500ml',
  sw: 'Soda 500ml',
  price: 2000,
  note: {
    en: '',
    sw: ''
  }
}, {
  id: 'm14',
  cat: 'soft',
  en: 'Maji 500ml',
  sw: 'Maji 500ml',
  price: 1500,
  note: {
    en: 'Water',
    sw: ''
  }
}, {
  id: 'm15',
  cat: 'soft',
  en: 'Juisi ya Embe',
  sw: 'Juisi ya Embe',
  price: 5000,
  note: {
    en: 'Mango juice',
    sw: ''
  }
}, {
  id: 'm16',
  cat: 'soft',
  en: 'Tangawizi',
  sw: 'Tangawizi',
  price: 2500,
  note: {
    en: 'Ginger ale',
    sw: ''
  }
},
// bar
{
  id: 'm17',
  cat: 'bar',
  en: 'Serengeti Lager',
  sw: 'Serengeti Lager',
  price: 5000,
  note: {
    en: '500ml',
    sw: ''
  }
}, {
  id: 'm18',
  cat: 'bar',
  en: 'Kilimanjaro Lager',
  sw: 'Kilimanjaro Lager',
  price: 5000,
  note: {
    en: '500ml',
    sw: ''
  }
}, {
  id: 'm19',
  cat: 'bar',
  en: 'Konyagi (tot)',
  sw: 'Konyagi (toti)',
  price: 4000,
  note: {
    en: '',
    sw: ''
  }
}, {
  id: 'm20',
  cat: 'bar',
  en: 'Red Wine (glass)',
  sw: 'Mvinyo (glasi)',
  price: 12000,
  note: {
    en: '',
    sw: ''
  }
}];

// ---- tables (author 22; venue size slices this) ----
// status: 'clean' | 'occupied' | 'dirty'   ·   flag: null|'called'|'bill'|'ready'
const TABLES = [{
  id: 'T1',
  n: 1,
  seats: 2,
  zone: 'terrace',
  status: 'occupied',
  mine: true,
  guests: 2,
  mins: 34,
  flag: null,
  total: 0,
  ticket: null
}, {
  id: 'T2',
  n: 2,
  seats: 4,
  zone: 'terrace',
  status: 'occupied',
  mine: true,
  guests: 4,
  mins: 52,
  flag: 'bill',
  total: 0,
  ticket: 'K-235'
}, {
  id: 'T3',
  n: 3,
  seats: 2,
  zone: 'terrace',
  status: 'clean',
  mine: false,
  guests: 0,
  mins: 0,
  flag: null,
  total: 0,
  ticket: null
}, {
  id: 'T4',
  n: 4,
  seats: 6,
  zone: 'terrace',
  status: 'occupied',
  mine: true,
  guests: 5,
  mins: 18,
  flag: 'ready',
  total: 0,
  ticket: 'K-241'
}, {
  id: 'T5',
  n: 5,
  seats: 4,
  zone: 'indoor',
  status: 'dirty',
  mine: true,
  guests: 0,
  mins: 0,
  flag: null,
  total: 0,
  ticket: null
}, {
  id: 'T6',
  n: 6,
  seats: 4,
  zone: 'indoor',
  status: 'clean',
  mine: false,
  guests: 0,
  mins: 0,
  flag: null,
  total: 0,
  ticket: null
}, {
  id: 'T7',
  n: 7,
  seats: 2,
  zone: 'indoor',
  status: 'occupied',
  mine: true,
  guests: 2,
  mins: 11,
  flag: 'called',
  total: 0,
  ticket: 'K-238'
}, {
  id: 'T8',
  n: 8,
  seats: 8,
  zone: 'indoor',
  status: 'occupied',
  mine: false,
  guests: 7,
  mins: 41,
  flag: null,
  total: 0,
  ticket: null
}, {
  id: 'T9',
  n: 9,
  seats: 4,
  zone: 'terrace',
  status: 'clean',
  mine: true,
  guests: 0,
  mins: 0,
  flag: null,
  total: 0,
  ticket: null
}, {
  id: 'T10',
  n: 10,
  seats: 2,
  zone: 'indoor',
  status: 'dirty',
  mine: false,
  guests: 0,
  mins: 0,
  flag: null,
  total: 0,
  ticket: null
}, {
  id: 'T11',
  n: 11,
  seats: 4,
  zone: 'indoor',
  status: 'clean',
  mine: false,
  guests: 0,
  mins: 0,
  flag: null,
  total: 0,
  ticket: null
}, {
  id: 'T12',
  n: 12,
  seats: 6,
  zone: 'terrace',
  status: 'occupied',
  mine: false,
  guests: 4,
  mins: 23,
  flag: null,
  total: 0,
  ticket: null
}, {
  id: 'B1',
  n: 1,
  seats: 2,
  zone: 'bar',
  status: 'occupied',
  mine: true,
  guests: 2,
  mins: 8,
  flag: null,
  total: 0,
  ticket: null
}, {
  id: 'B2',
  n: 2,
  seats: 2,
  zone: 'bar',
  status: 'clean',
  mine: false,
  guests: 0,
  mins: 0,
  flag: null,
  total: 0,
  ticket: null
}, {
  id: 'T13',
  n: 13,
  seats: 4,
  zone: 'indoor',
  status: 'clean',
  mine: false,
  guests: 0,
  mins: 0,
  flag: null,
  total: 0,
  ticket: null
}, {
  id: 'T14',
  n: 14,
  seats: 4,
  zone: 'terrace',
  status: 'dirty',
  mine: false,
  guests: 0,
  mins: 0,
  flag: null,
  total: 0,
  ticket: null
}, {
  id: 'T15',
  n: 15,
  seats: 2,
  zone: 'indoor',
  status: 'clean',
  mine: false,
  guests: 0,
  mins: 0,
  flag: null,
  total: 0,
  ticket: null
}, {
  id: 'T16',
  n: 16,
  seats: 8,
  zone: 'terrace',
  status: 'occupied',
  mine: false,
  guests: 6,
  mins: 29,
  flag: null,
  total: 0,
  ticket: null
}, {
  id: 'B3',
  n: 3,
  seats: 2,
  zone: 'bar',
  status: 'occupied',
  mine: false,
  guests: 1,
  mins: 15,
  flag: null,
  total: 0,
  ticket: null
}, {
  id: 'B4',
  n: 4,
  seats: 2,
  zone: 'bar',
  status: 'dirty',
  mine: false,
  guests: 0,
  mins: 0,
  flag: null,
  total: 0,
  ticket: null
}, {
  id: 'T17',
  n: 17,
  seats: 4,
  zone: 'indoor',
  status: 'clean',
  mine: false,
  guests: 0,
  mins: 0,
  flag: null,
  total: 0,
  ticket: null
}, {
  id: 'T18',
  n: 18,
  seats: 6,
  zone: 'terrace',
  status: 'clean',
  mine: false,
  guests: 0,
  mins: 0,
  flag: null,
  total: 0,
  ticket: null
}];
const ZONES = {
  terrace: {
    en: 'Terrace',
    sw: 'Ukumbi wa nje'
  },
  indoor: {
    en: 'Indoor',
    sw: 'Ndani'
  },
  bar: {
    en: 'Bar',
    sw: 'Baa'
  }
};
function tableLabel(t) {
  return (t.zone === 'bar' ? 'B' : 'T') + t.n;
}

// venue size -> table count
const SIZE_COUNT = {
  small: 8,
  medium: 14,
  large: 22
};
function tablesForSize(size) {
  return TABLES.slice(0, SIZE_COUNT[size] || 14);
}

// ---- seed kitchen tickets (orders this waiter has sent) ----
// status: 'preparing' | 'ready' | 'served'
const TICKETS = [{
  id: 'K-241',
  tableId: 'T4',
  status: 'ready',
  mins: 18,
  items: [{
    id: 'm1',
    qty: 2
  }, {
    id: 'm9',
    qty: 3
  }, {
    id: 'm17',
    qty: 4
  }, {
    id: 'm12',
    qty: 1
  }]
}, {
  id: 'K-238',
  tableId: 'T7',
  status: 'preparing',
  mins: 11,
  items: [{
    id: 'm3',
    qty: 1
  }, {
    id: 'm7',
    qty: 1
  }, {
    id: 'm13',
    qty: 2
  }]
}, {
  id: 'K-235',
  tableId: 'T2',
  status: 'served',
  mins: 52,
  items: [{
    id: 'm2',
    qty: 3
  }, {
    id: 'm12',
    qty: 1
  }, {
    id: 'm6',
    qty: 2
  }, {
    id: 'm18',
    qty: 3
  }]
}];

// ---- seed notifications ----
// kind: 'ready' | 'called' | 'bill' | 'assigned' | 'delay'
const NOTIFS = [{
  id: 'n1',
  kind: 'ready',
  tableId: 'T4',
  ticket: 'K-241',
  mins: 1,
  read: false
}, {
  id: 'n2',
  kind: 'called',
  tableId: 'T7',
  ticket: null,
  mins: 3,
  read: false
}, {
  id: 'n3',
  kind: 'bill',
  tableId: 'T2',
  ticket: 'K-235',
  mins: 6,
  read: false
}, {
  id: 'n4',
  kind: 'assigned',
  tableId: 'T9',
  ticket: null,
  mins: 14,
  read: true
}, {
  id: 'n5',
  kind: 'delay',
  tableId: 'T7',
  ticket: 'K-238',
  mins: 22,
  read: true
}];

// ---- status color schemes ----
// each: { clean:{...}, occupied:{...}, dirty:{...} }  with {dot,bg,fg}
const SCHEMES = {
  classic: {
    label: {
      en: 'Classic (brand)',
      sw: 'Asili (brand)'
    },
    clean: {
      dot: C.green,
      bg: C.green50,
      fg: C.greenD
    },
    occupied: {
      dot: C.blue,
      bg: C.blue50,
      fg: C.blueD
    },
    dirty: {
      dot: C.gold,
      bg: C.gold50,
      fg: C.amber
    }
  },
  traffic: {
    label: {
      en: 'Traffic light',
      sw: 'Taa za barabarani'
    },
    clean: {
      dot: C.green,
      bg: C.green50,
      fg: C.greenD
    },
    occupied: {
      dot: C.red,
      bg: C.red50,
      fg: C.redD
    },
    dirty: {
      dot: C.gold,
      bg: C.gold50,
      fg: C.amber
    }
  },
  cool: {
    label: {
      en: 'Cool / muted',
      sw: 'Baridi / nyepesi'
    },
    clean: {
      dot: C.green,
      bg: C.green50,
      fg: C.greenD
    },
    occupied: {
      dot: C.blue,
      bg: C.blue50,
      fg: C.blueD
    },
    dirty: {
      dot: C.ink3,
      bg: '#eef1f5',
      fg: C.ink2
    }
  }
};

// ---- brand color options (tweak) ----
const BRANDS = [{
  id: 'blue',
  hex: C.blue,
  d: C.blueD,
  dd: C.blueDD,
  soft: C.blue50,
  name: 'Azure'
}, {
  id: 'green',
  hex: C.green,
  d: C.greenD,
  dd: C.greenDD,
  soft: C.green50,
  name: 'Emerald'
}, {
  id: 'plum',
  hex: '#7a3b62',
  d: '#653050',
  dd: '#4f2640',
  soft: '#f4eaf0',
  name: 'Plum'
}, {
  id: 'slate',
  hex: '#3a4a5c',
  d: '#2c3947',
  dd: '#212b35',
  soft: '#eef1f5',
  name: 'Slate'
}];

// ---- status labels ----
const STATUS = {
  clean: {
    en: 'Clean',
    sw: 'Safi',
    verbEn: 'Available',
    verbSw: 'Wazi'
  },
  occupied: {
    en: 'Occupied',
    sw: 'Imekaliwa',
    verbEn: 'Seated',
    verbSw: 'Wamekaa'
  },
  dirty: {
    en: 'Dirty',
    sw: 'Chafu',
    verbEn: 'Needs bussing',
    verbSw: 'Inahitaji kusafishwa'
  }
};
const FLAGS = {
  called: {
    en: 'Called you',
    sw: 'Wamekuita',
    dot: C.gold
  },
  bill: {
    en: 'Wants bill',
    sw: 'Wanataka bili',
    dot: C.red
  },
  ready: {
    en: 'Food ready',
    sw: 'Chakula tayari',
    dot: C.green
  }
};

// ---- i18n strings ----
const STR = {
  // nav
  home: {
    en: 'Home',
    sw: 'Mwanzo'
  },
  tables: {
    en: 'Tables',
    sw: 'Meza'
  },
  orders: {
    en: 'Orders',
    sw: 'Oda'
  },
  alerts: {
    en: 'Alerts',
    sw: 'Arifa'
  },
  // home
  goodEvening: {
    en: 'Good evening',
    sw: 'Habari za jioni'
  },
  myTables: {
    en: 'My tables',
    sw: 'Meza zangu'
  },
  openOrders: {
    en: 'Open orders',
    sw: 'Oda wazi'
  },
  toServe: {
    en: 'To serve',
    sw: 'Za kupeleka'
  },
  sales: {
    en: 'My sales',
    sw: 'Mauzo yangu'
  },
  needsAttention: {
    en: 'Needs your attention',
    sw: 'Inahitaji uangalizi'
  },
  quickActions: {
    en: 'Quick actions',
    sw: 'Vitendo vya haraka'
  },
  newOrder: {
    en: 'New order',
    sw: 'Oda mpya'
  },
  viewTables: {
    en: 'View tables',
    sw: 'Ona meza'
  },
  recentActivity: {
    en: 'Recent activity',
    sw: 'Matukio ya hivi karibuni'
  },
  // tables
  allTables: {
    en: 'All tables',
    sw: 'Meza zote'
  },
  mineOnly: {
    en: 'Mine',
    sw: 'Zangu'
  },
  seats: {
    en: 'seats',
    sw: 'viti'
  },
  guests: {
    en: 'guests',
    sw: 'wageni'
  },
  forMin: {
    en: 'min',
    sw: 'dak'
  },
  // table detail
  tableLabel: {
    en: 'Table',
    sw: 'Meza'
  },
  status: {
    en: 'Status',
    sw: 'Hali'
  },
  changeStatus: {
    en: 'Change status',
    sw: 'Badilisha hali'
  },
  markClean: {
    en: 'Mark clean',
    sw: 'Weka safi'
  },
  markDirty: {
    en: 'Mark dirty',
    sw: 'Weka chafu'
  },
  seatGuests: {
    en: 'Seat guests',
    sw: 'Kalisha wageni'
  },
  openOrder: {
    en: 'Open order',
    sw: 'Oda iliyo wazi'
  },
  addOrder: {
    en: 'Take order',
    sw: 'Chukua oda'
  },
  addItems: {
    en: 'Add items',
    sw: 'Ongeza vitu'
  },
  viewBill: {
    en: 'View bill',
    sw: 'Ona bili'
  },
  noOrderYet: {
    en: 'No order yet',
    sw: 'Hakuna oda bado'
  },
  assignedToYou: {
    en: 'Assigned to you',
    sw: 'Umepewa wewe'
  },
  // order / menu
  menu: {
    en: 'Menu',
    sw: 'Menyu'
  },
  searchMenu: {
    en: 'Search dishes\u2026',
    sw: 'Tafuta vyakula\u2026'
  },
  cart: {
    en: 'Order',
    sw: 'Oda'
  },
  items: {
    en: 'items',
    sw: 'vitu'
  },
  subtotal: {
    en: 'Subtotal',
    sw: 'Jumla ndogo'
  },
  vat: {
    en: 'VAT 18%',
    sw: 'VAT 18%'
  },
  total: {
    en: 'Total',
    sw: 'Jumla'
  },
  sendToKitchen: {
    en: 'Send to kitchen',
    sw: 'Peleka jikoni'
  },
  addNote: {
    en: 'Add note for kitchen',
    sw: 'Ongeza maelezo jikoni'
  },
  emptyCart: {
    en: 'Tap dishes to add them',
    sw: 'Gusa vyakula kuviongeza'
  },
  sent: {
    en: 'Sent to kitchen',
    sw: 'Imepelekwa jikoni'
  },
  // orders / tickets
  kitchenOrders: {
    en: 'Kitchen orders',
    sw: 'Oda za jikoni'
  },
  preparing: {
    en: 'Preparing',
    sw: 'Inaandaliwa'
  },
  ready: {
    en: 'Ready',
    sw: 'Tayari'
  },
  served: {
    en: 'Served',
    sw: 'Imepelekwa'
  },
  ticket: {
    en: 'Ticket',
    sw: 'Tiketi'
  },
  markServed: {
    en: 'Mark served',
    sw: 'Weka imepelekwa'
  },
  pickUp: {
    en: 'Pick up',
    sw: 'Chukua'
  },
  sentAgo: {
    en: 'sent',
    sw: 'imetumwa'
  },
  // alerts
  notifications: {
    en: 'Notifications',
    sw: 'Arifa'
  },
  markAllRead: {
    en: 'Mark all read',
    sw: 'Soma zote'
  },
  allCaughtUp: {
    en: 'All caught up',
    sw: 'Umemaliza zote'
  },
  goToTable: {
    en: 'Go to table',
    sw: 'Nenda mezani'
  },
  // misc
  ago: {
    en: 'ago',
    sw: 'iliyopita'
  },
  now: {
    en: 'now',
    sw: 'sasa'
  },
  back: {
    en: 'Back',
    sw: 'Rudi'
  },
  online: {
    en: 'Online',
    sw: 'Mtandaoni'
  },
  // lock screen
  selectStaff: {
    en: 'Tap your name to sign in',
    sw: 'Gusa jina lako kuingia'
  },
  enterPin: {
    en: 'Enter your 4-digit PIN',
    sw: 'Weka PIN yako ya tarakimu 4'
  },
  wrongPin: {
    en: 'Wrong PIN — try again',
    sw: 'PIN si sahihi — jaribu tena'
  },
  demoPin: {
    en: 'Demo PIN',
    sw: 'PIN ya majaribio'
  },
  signOut: {
    en: 'Sign out',
    sw: 'Toka'
  },
  welcomeBack: {
    en: 'Welcome',
    sw: 'Karibu'
  }
};

// notif copy
function notifCopy(kind) {
  return {
    ready: {
      en: 'Order ready for pickup',
      sw: 'Oda tayari kuchukuliwa',
      icon: 'checkCircle'
    },
    called: {
      en: 'Guest called you',
      sw: 'Mgeni amekuita',
      icon: 'bell'
    },
    bill: {
      en: 'Bill requested',
      sw: 'Bili imeombwa',
      icon: 'report'
    },
    assigned: {
      en: 'New table assigned',
      sw: 'Umepewa meza mpya',
      icon: 'plus'
    },
    delay: {
      en: 'Kitchen running late',
      sw: 'Jikoni kunachelewa',
      icon: 'shifts'
    }
  }[kind];
}
window.WD = {
  C,
  VENUE,
  WAITER,
  fmtTZS,
  CATS,
  MENU,
  TABLES,
  ZONES,
  tableLabel,
  tablesForSize,
  SIZE_COUNT,
  TICKETS,
  NOTIFS,
  SCHEMES,
  BRANDS,
  STATUS,
  FLAGS,
  STR,
  notifCopy,
  STAFF
};
})(); } catch (e) { __ds_ns.__errors.push({ path: "waiter-app/data.js", error: String((e && e.message) || e) }); }

// waiter-app/screens-core.jsx
try { (() => {
// ============================================================
// Waiter App — core screens: Home, Tables, TableDetail
// ============================================================
const {
  useState,
  useEffect,
  useRef
} = React;
const {
  Icon
} = window.BiasharaPOSDesignSystem_62a86f;
const {
  tt,
  ago,
  BrandHeader,
  PlainHeader,
  LangToggle
} = window;
const W = window.WD;
const MENU_BY = Object.fromEntries(W.MENU.map(m => [m.id, m]));
function ticketTotal(tk) {
  return tk.items.reduce((s, it) => s + (MENU_BY[it.id] ? MENU_BY[it.id].price * it.qty : 0), 0);
}
function tableTickets(tickets, tableId) {
  return tickets.filter(tk => tk.tableId === tableId);
}

// soft card
function Panel({
  children,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: '#fff',
      border: '1px solid var(--line)',
      borderRadius: 16,
      boxShadow: '0 1px 2px rgba(18,32,25,.04)',
      ...style
    }
  }, children);
}

// section eyebrow
function Eyebrow({
  children,
  right
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      margin: '0 2px 9px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 800,
      letterSpacing: '.085em',
      textTransform: 'uppercase',
      color: 'var(--ink-3)',
      whiteSpace: 'nowrap'
    }
  }, children), right);
}

// ── HOME ────────────────────────────────────────────────────
function HomeScreen({
  ctx
}) {
  const {
    t,
    ttl,
    lang,
    brand,
    scheme,
    tables,
    tickets,
    notifs,
    go,
    setTab,
    actions,
    staff
  } = ctx;
  const mine = tables.filter(x => x.mine);
  const myOpen = mine.filter(x => x.status === 'occupied');
  const openTickets = tickets.filter(tk => tk.status !== 'served');
  const readyTickets = tickets.filter(tk => tk.status === 'ready');
  const mySales = tickets.reduce((s, tk) => s + ticketTotal(tk), 0);

  // attention items: ready food, called, bill
  const attention = [];
  readyTickets.forEach(tk => attention.push({
    kind: 'ready',
    table: tables.find(x => x.id === tk.tableId),
    ticket: tk
  }));
  tables.forEach(x => {
    if (x.flag === 'called') attention.push({
      kind: 'called',
      table: x
    });
    if (x.flag === 'bill') attention.push({
      kind: 'bill',
      table: x
    });
  });
  const stat = (val, label, color) => /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'rgba(255,255,255,.14)',
      borderRadius: 14,
      padding: '12px 13px',
      flex: 1,
      backdropFilter: 'blur(4px)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 26,
      fontWeight: 800,
      letterSpacing: '-.03em',
      lineHeight: 1,
      color: color || '#fff'
    }
  }, val), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11.5,
      fontWeight: 600,
      color: 'rgba(255,255,255,.82)',
      marginTop: 5,
      letterSpacing: '-.01em'
    }
  }, label));
  return /*#__PURE__*/React.createElement(Screen, null, /*#__PURE__*/React.createElement(BrandHeader, {
    brand: brand
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 14,
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 40,
      height: 40,
      borderRadius: 12,
      background: 'rgba(255,255,255,.16)',
      display: 'grid',
      placeItems: 'center',
      fontWeight: 800,
      fontSize: 15,
      letterSpacing: '.02em'
    }
  }, staff.initials), /*#__PURE__*/React.createElement("div", {
    style: {
      lineHeight: 1.25
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 700
    }
  }, ttl(W.VENUE)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      opacity: .82,
      fontWeight: 600
    }
  }, W.VENUE.loc))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(LangToggle, {
    lang: lang,
    setLang: ctx.setLang,
    onBrand: true
  }), /*#__PURE__*/React.createElement("button", {
    onClick: actions.lock,
    "aria-label": t('signOut'),
    style: {
      width: 36,
      height: 36,
      borderRadius: '50%',
      border: 'none',
      background: 'rgba(255,255,255,.16)',
      color: '#fff',
      cursor: 'pointer',
      display: 'grid',
      placeItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "logout",
    size: 18
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 600,
      opacity: .9
    }
  }, t('goodEvening'), ","), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      gap: 10,
      marginTop: 2
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 27,
      fontWeight: 800,
      letterSpacing: '-.025em',
      lineHeight: 1.05
    }
  }, staff.name.split(' ')[0]), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      background: 'rgba(255,255,255,.16)',
      padding: '5px 11px',
      borderRadius: 999,
      fontSize: 11.5,
      fontWeight: 700
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 7,
      height: 7,
      borderRadius: '50%',
      background: '#5ee08a'
    }
  }), " ", ttl(staff.shift))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 9,
      marginTop: 16
    }
  }, stat(myOpen.length + '/' + mine.length, t('myTables')), stat(openTickets.length, t('openOrders')), stat(readyTickets.length, t('toServe'), readyTickets.length ? '#9ff0bd' : '#fff'))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '16px 14px 20px'
    }
  }, /*#__PURE__*/React.createElement(Panel, {
    style: {
      padding: '13px 15px',
      marginBottom: 18,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 800,
      letterSpacing: '.08em',
      textTransform: 'uppercase',
      color: 'var(--ink-3)'
    }
  }, t('sales')), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 22,
      fontWeight: 800,
      letterSpacing: '-.03em',
      color: 'var(--green-d)',
      marginTop: 3
    }
  }, W.fmtTZS(mySales))), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 42,
      height: 42,
      borderRadius: 12,
      background: 'var(--green-50)',
      color: 'var(--green-d)',
      display: 'grid',
      placeItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "analytics",
    size: 22
  }))), attention.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement(Eyebrow, null, t('needsAttention')), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 9
    }
  }, attention.map((a, i) => /*#__PURE__*/React.createElement(AttentionCard, {
    key: i,
    a: a,
    ctx: ctx
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement(Eyebrow, null, t('quickActions')), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(QuickAction, {
    icon: "sale",
    label: t('newOrder'),
    brand: brand,
    primary: true,
    onClick: () => setTab('tables')
  }), /*#__PURE__*/React.createElement(QuickAction, {
    icon: "store",
    label: t('viewTables'),
    brand: brand,
    onClick: () => setTab('tables')
  }))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Eyebrow, {
    right: /*#__PURE__*/React.createElement("button", {
      onClick: () => setTab('alerts'),
      style: linkBtn(brand)
    }, t('alerts'))
  }, t('recentActivity')), /*#__PURE__*/React.createElement(Panel, null, notifs.slice(0, 4).map((n, i) => {
    const cp = W.notifCopy(n.kind);
    const tb = tables.find(x => x.id === n.tableId);
    return /*#__PURE__*/React.createElement("div", {
      key: n.id,
      onClick: () => tb && go('table', {
        id: tb.id
      }),
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 11,
        padding: '11px 14px',
        borderTop: i ? '1px solid var(--line)' : 'none',
        cursor: 'pointer'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: 34,
        height: 34,
        borderRadius: 10,
        background: notifTint(n.kind).bg,
        color: notifTint(n.kind).fg,
        display: 'grid',
        placeItems: 'center',
        flex: 'none'
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: cp.icon,
      size: 18
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13.5,
        fontWeight: 700,
        color: 'var(--ink)'
      }
    }, ttl(cp)), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: 'var(--ink-3)',
        fontWeight: 600
      }
    }, t('tableLabel'), " ", tb ? W.tableLabel(tb) : '', " \xB7 ", ago(n.mins, t))), !n.read && /*#__PURE__*/React.createElement("span", {
      style: {
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: brand.hex,
        flex: 'none'
      }
    }));
  })))));
}
function AttentionCard({
  a,
  ctx
}) {
  const {
    t,
    ttl,
    go,
    actions
  } = ctx;
  const tint = notifTint(a.kind);
  const cp = W.notifCopy(a.kind);
  return /*#__PURE__*/React.createElement("div", {
    onClick: () => go('table', {
      id: a.table.id
    }),
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      background: '#fff',
      cursor: 'pointer',
      border: '1px solid var(--line)',
      borderLeft: `3px solid ${tint.fg}`,
      borderRadius: 14,
      padding: '12px 14px',
      boxShadow: '0 1px 2px rgba(18,32,25,.04)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 40,
      height: 40,
      borderRadius: 11,
      background: tint.bg,
      color: tint.fg,
      display: 'grid',
      placeItems: 'center',
      flex: 'none'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: cp.icon,
    size: 20
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 800,
      color: 'var(--ink)',
      letterSpacing: '-.01em'
    }
  }, ttl(cp)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: 'var(--ink-3)',
      fontWeight: 600
    }
  }, t('tableLabel'), " ", W.tableLabel(a.table), " \xB7 ", ttl(W.ZONES[a.table.zone]))), a.kind === 'ready' ? /*#__PURE__*/React.createElement("button", {
    onClick: e => {
      e.stopPropagation();
      actions.serveTicket(a.ticket.id);
    },
    style: pillBtn(tint.fg)
  }, t('pickUp')) : /*#__PURE__*/React.createElement(Icon, {
    name: "chevronRight",
    size: 18,
    style: {
      color: 'var(--ink-3)'
    }
  }));
}
function QuickAction({
  icon,
  label,
  brand,
  primary,
  onClick
}) {
  return /*#__PURE__*/React.createElement("button", {
    onClick: onClick,
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      alignItems: 'flex-start',
      textAlign: 'left',
      padding: '15px 15px 16px',
      borderRadius: 16,
      cursor: 'pointer',
      fontFamily: 'var(--font-sans)',
      border: primary ? 'none' : '1px solid var(--line)',
      background: primary ? `linear-gradient(140deg, var(--green) 0%, var(--green-dd) 100%)` : '#fff',
      color: primary ? '#fff' : 'var(--ink)',
      boxShadow: primary ? '0 10px 22px -10px rgba(35,155,70,.6)' : '0 1px 2px rgba(18,32,25,.04)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 38,
      height: 38,
      borderRadius: 11,
      display: 'grid',
      placeItems: 'center',
      background: primary ? 'rgba(255,255,255,.2)' : brand.soft,
      color: primary ? '#fff' : brand.hex
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: icon,
    size: 21
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 15,
      fontWeight: 800,
      letterSpacing: '-.01em'
    }
  }, label));
}

// ── TABLES (grouped by status) ──────────────────────────────
function TablesScreen({
  ctx
}) {
  const {
    t,
    ttl,
    lang,
    brand,
    scheme,
    tables,
    go,
    setTab
  } = ctx;
  const [filter, setFilter] = useState('all');
  const list = filter === 'mine' ? tables.filter(x => x.mine) : tables;
  const groups = [{
    key: 'occupied',
    items: list.filter(x => x.status === 'occupied')
  }, {
    key: 'dirty',
    items: list.filter(x => x.status === 'dirty')
  }, {
    key: 'clean',
    items: list.filter(x => x.status === 'clean')
  }];
  const count = s => tables.filter(x => x.status === s).length;
  return /*#__PURE__*/React.createElement(Screen, null, /*#__PURE__*/React.createElement(PlainHeader, {
    title: t('tables'),
    sub: ttl(W.VENUE),
    right: /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'inline-flex',
        padding: 3,
        borderRadius: 999,
        background: 'var(--bg)',
        border: '1px solid var(--line)',
        gap: 2
      }
    }, [['all', t('allTables')], ['mine', t('mineOnly')]].map(([k, lbl]) => /*#__PURE__*/React.createElement("button", {
      key: k,
      onClick: () => setFilter(k),
      style: {
        border: 'none',
        cursor: 'pointer',
        fontFamily: 'var(--font-sans)',
        fontWeight: 800,
        fontSize: 11.5,
        padding: '6px 12px',
        borderRadius: 999,
        background: filter === k ? brand.hex : 'transparent',
        color: filter === k ? '#fff' : 'var(--ink-3)',
        transition: 'all .15s var(--ease)'
      }
    }, lbl)))
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      padding: '12px 14px 4px',
      background: 'var(--bg)'
    }
  }, ['occupied', 'dirty', 'clean'].map(s => /*#__PURE__*/React.createElement("div", {
    key: s,
    style: {
      flex: 1,
      background: '#fff',
      border: '1px solid var(--line)',
      borderRadius: 12,
      padding: '9px 11px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 8,
      height: 8,
      borderRadius: '50%',
      background: scheme[s].dot
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 21,
      fontWeight: 800,
      letterSpacing: '-.03em',
      color: 'var(--ink)'
    }
  }, count(s))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      color: 'var(--ink-3)',
      marginTop: 1
    }
  }, ttl(W.STATUS[s]))))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '8px 14px 20px',
      background: 'var(--bg)'
    }
  }, groups.map(g => g.items.length > 0 && /*#__PURE__*/React.createElement("div", {
    key: g.key,
    style: {
      marginTop: 14
    }
  }, /*#__PURE__*/React.createElement(Eyebrow, {
    right: /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12,
        fontWeight: 800,
        color: 'var(--ink-3)'
      }
    }, g.items.length)
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 7
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 8,
      height: 8,
      borderRadius: '50%',
      background: scheme[g.key].dot
    }
  }), ttl(W.STATUS[g.key]))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }
  }, g.items.map(x => /*#__PURE__*/React.createElement(TableRow, {
    key: x.id,
    x: x,
    ctx: ctx
  })))))));
}
function TableRow({
  x,
  ctx
}) {
  const {
    t,
    ttl,
    scheme,
    go,
    tickets
  } = ctx;
  const flag = x.flag ? W.FLAGS[x.flag] : null;
  const occ = x.status === 'occupied';
  return /*#__PURE__*/React.createElement("button", {
    onClick: () => go('table', {
      id: x.id
    }),
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      width: '100%',
      textAlign: 'left',
      background: '#fff',
      border: '1px solid var(--line)',
      borderRadius: 14,
      padding: '11px 13px',
      cursor: 'pointer',
      fontFamily: 'var(--font-sans)',
      boxShadow: '0 1px 2px rgba(18,32,25,.04)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 46,
      height: 46,
      borderRadius: 12,
      flex: 'none',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: scheme[x.status].bg,
      color: scheme[x.status].fg,
      fontWeight: 800,
      lineHeight: 1
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 9,
      fontWeight: 800,
      opacity: .7,
      letterSpacing: '.04em'
    }
  }, x.zone === 'bar' ? 'BAR' : t('tableLabel').toUpperCase()), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 18,
      letterSpacing: '-.03em',
      marginTop: 1
    }
  }, x.n)), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 15,
      fontWeight: 800,
      color: 'var(--ink)',
      letterSpacing: '-.01em',
      whiteSpace: 'nowrap'
    }
  }, t('tableLabel'), " ", W.tableLabel(x)), x.mine && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 9.5,
      fontWeight: 800,
      letterSpacing: '.05em',
      color: 'var(--blue-d)',
      background: 'var(--blue-50)',
      padding: '2px 6px',
      borderRadius: 5
    }
  }, ttl(W.STR.mineOnly).toUpperCase())), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: 'var(--ink-3)',
      fontWeight: 600,
      marginTop: 2
    }
  }, ttl(W.ZONES[x.zone]), " \xB7 ", occ ? `${x.guests} ${t('guests')} · ${x.mins} ${t('forMin')}` : `${x.seats} ${t('seats')}`)), flag && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      background: '#fff',
      border: `1.5px solid ${flag.dot}`,
      color: flag.dot,
      fontSize: 11,
      fontWeight: 800,
      padding: '3px 9px',
      borderRadius: 999,
      whiteSpace: 'nowrap'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 6,
      height: 6,
      borderRadius: '50%',
      background: flag.dot
    }
  }), ttl(flag)), /*#__PURE__*/React.createElement(Icon, {
    name: "chevronRight",
    size: 18,
    style: {
      color: 'var(--ink-3)',
      flex: 'none'
    }
  }));
}

// helpers
function notifTint(kind) {
  return {
    ready: {
      bg: 'var(--green-50)',
      fg: 'var(--green-d)'
    },
    called: {
      bg: 'var(--gold-50)',
      fg: 'var(--amber)'
    },
    bill: {
      bg: 'var(--red-50)',
      fg: 'var(--red)'
    },
    assigned: {
      bg: 'var(--blue-50)',
      fg: 'var(--blue-d)'
    },
    delay: {
      bg: 'var(--gold-50)',
      fg: 'var(--amber)'
    }
  }[kind];
}
function linkBtn(brand) {
  return {
    border: 'none',
    background: 'none',
    color: brand.hex,
    fontFamily: 'var(--font-sans)',
    fontWeight: 800,
    fontSize: 12,
    cursor: 'pointer',
    letterSpacing: '.02em',
    whiteSpace: 'nowrap'
  };
}
function pillBtn(color) {
  return {
    border: 'none',
    background: color,
    color: '#fff',
    fontFamily: 'var(--font-sans)',
    fontWeight: 800,
    fontSize: 12.5,
    padding: '8px 14px',
    borderRadius: 999,
    cursor: 'pointer',
    flex: 'none',
    whiteSpace: 'nowrap'
  };
}

// generic full-height scroll screen wrapper
function Screen({
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: '100%',
      background: 'var(--bg)',
      display: 'flex',
      flexDirection: 'column'
    }
  }, children);
}

// ── LOCK / PIN SIGN-IN (shared wall-mounted tablet) ─────────
function LockScreen({
  ctx
}) {
  const {
    t,
    ttl,
    brand,
    actions
  } = ctx;
  const staffList = W.STAFF;
  const [sel, setSel] = useState(staffList[0]);
  const [pin, setPin] = useState('');
  const [err, setErr] = useState(false);
  const pick = s => {
    setSel(s);
    setPin('');
    setErr(false);
  };
  const press = k => {
    setErr(false);
    if (k === 'del') {
      setPin(p => p.slice(0, -1));
      return;
    }
    setPin(p => {
      if (p.length >= 4) return p;
      const np = p + k;
      if (np.length === 4) {
        setTimeout(() => {
          if (np === sel.pin) actions.unlock(sel);else {
            setErr(true);
            setPin('');
          }
        }, 180);
      }
      return np;
    });
  };
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      overflowY: 'auto',
      background: `linear-gradient(160deg, ${brand.dd} 0%, ${brand.d} 46%, ${brand.hex} 100%)`,
      color: '#fff',
      display: 'flex',
      flexDirection: 'column',
      padding: '6px 22px 22px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      paddingTop: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 22,
      fontWeight: 800,
      letterSpacing: '-.02em'
    }
  }, "Biashara", /*#__PURE__*/React.createElement("span", {
    style: {
      color: '#f4b53e'
    }
  }, "POS")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 600,
      opacity: .82,
      marginTop: 3
    }
  }, ttl(W.VENUE))), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      margin: '14px 0 2px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 42,
      fontWeight: 800,
      letterSpacing: '-.03em',
      lineHeight: 1
    }
  }, "20:41")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10.5,
      fontWeight: 800,
      letterSpacing: '.1em',
      textTransform: 'uppercase',
      opacity: .72,
      textAlign: 'center',
      marginBottom: 11
    }
  }, t('selectStaff')), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      justifyContent: 'center'
    }
  }, staffList.map(s => {
    const on = s.id === sel.id;
    return /*#__PURE__*/React.createElement("button", {
      key: s.id,
      onClick: () => pick(s),
      style: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        border: 'none',
        background: 'none',
        cursor: 'pointer',
        width: 60
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 48,
        height: 48,
        borderRadius: '50%',
        display: 'grid',
        placeItems: 'center',
        fontFamily: 'var(--font-sans)',
        fontWeight: 800,
        fontSize: 15,
        color: on ? brand.d : '#fff',
        background: on ? '#fff' : 'rgba(255,255,255,.15)',
        boxShadow: on ? '0 0 0 3px rgba(255,255,255,.5)' : 'none',
        transition: 'all .15s var(--ease)'
      }
    }, s.initials), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 10.5,
        fontWeight: on ? 800 : 600,
        opacity: on ? 1 : .8,
        whiteSpace: 'nowrap'
      }
    }, s.name.split(' ')[0]));
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      marginTop: 20
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14.5,
      fontWeight: 700,
      color: err ? '#ffd9cb' : '#fff'
    }
  }, err ? t('wrongPin') : t('enterPin')), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 16,
      justifyContent: 'center',
      marginTop: 14,
      animation: err ? 'wa-shake .4s var(--ease)' : 'none'
    }
  }, [0, 1, 2, 3].map(i => /*#__PURE__*/React.createElement("span", {
    key: i,
    style: {
      width: 14,
      height: 14,
      borderRadius: '50%',
      background: i < pin.length ? '#fff' : 'rgba(255,255,255,.22)',
      border: '1.5px solid rgba(255,255,255,.6)',
      transition: 'background .12s'
    }
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3,1fr)',
      gap: 11,
      maxWidth: 276,
      width: '100%',
      margin: '20px auto 0'
    }
  }, keys.map((k, i) => k === '' ? /*#__PURE__*/React.createElement("div", {
    key: i
  }) : /*#__PURE__*/React.createElement("button", {
    key: i,
    onClick: () => press(k),
    style: {
      height: 58,
      borderRadius: 16,
      border: 'none',
      cursor: 'pointer',
      fontFamily: 'var(--font-sans)',
      fontSize: k === 'del' ? 22 : 25,
      fontWeight: 700,
      color: '#fff',
      background: 'rgba(255,255,255,.14)',
      display: 'grid',
      placeItems: 'center',
      transition: 'background .12s'
    }
  }, k === 'del' ? '\u232B' : k))), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      marginTop: 14,
      fontSize: 11.5,
      fontWeight: 600,
      opacity: .6
    }
  }, t('demoPin'), " \xB7 1 2 3 4"));
}
Object.assign(window, {
  HomeScreen,
  TablesScreen,
  TableRow,
  Panel,
  Eyebrow,
  Screen,
  LockScreen,
  notifTint,
  linkBtn,
  pillBtn,
  ticketTotal,
  tableTickets,
  MENU_BY
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "waiter-app/screens-core.jsx", error: String((e && e.message) || e) }); }

// waiter-app/screens-order.jsx
try { (() => {
// ============================================================
// Waiter App — TableDetail, OrderMenu, Orders(tickets), Notifications
// ============================================================
const {
  useState,
  useEffect,
  useRef
} = React;
const {
  Icon
} = window.BiasharaPOSDesignSystem_62a86f;
const {
  tt,
  ago,
  BrandHeader,
  PlainHeader
} = window;
const {
  Screen,
  Panel,
  Eyebrow,
  MENU_BY,
  ticketTotal,
  tableTickets,
  notifTint,
  linkBtn,
  pillBtn
} = window;
const W = window.WD;

// kitchen progress steps
const TK_STEPS = ['sent', 'preparing', 'ready', 'served'];
function tkIndex(status) {
  return status === 'preparing' ? 1 : status === 'ready' ? 2 : status === 'served' ? 3 : 0;
}
function ProgressRail({
  status,
  scheme,
  ctx,
  compact
}) {
  const {
    t
  } = ctx;
  const cur = tkIndex(status);
  const labels = {
    sent: ctx.t('sent') ? 'Sent' : 'Sent',
    preparing: t('preparing'),
    ready: t('ready'),
    served: t('served')
  };
  const labelMap = {
    sent: {
      en: 'Sent',
      sw: 'Imetumwa'
    },
    preparing: W.STR.preparing,
    ready: W.STR.ready,
    served: W.STR.served
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 0
    }
  }, TK_STEPS.map((st, i) => {
    const done = i <= cur;
    const active = i === cur;
    const col = st === 'ready' ? 'var(--green)' : st === 'served' ? 'var(--ink-3)' : 'var(--blue)';
    return /*#__PURE__*/React.createElement(React.Fragment, {
      key: st
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 5,
        flex: 'none'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: compact ? 16 : 22,
        height: compact ? 16 : 22,
        borderRadius: '50%',
        display: 'grid',
        placeItems: 'center',
        background: done ? col : '#fff',
        border: done ? 'none' : '2px solid var(--line-2)',
        boxShadow: active ? `0 0 0 4px ${col}22` : 'none'
      }
    }, done && /*#__PURE__*/React.createElement(Icon, {
      name: "check",
      size: compact ? 10 : 13,
      style: {
        color: '#fff'
      },
      strokeWidth: 2.6
    })), !compact && /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 10.5,
        fontWeight: done ? 800 : 600,
        color: done ? 'var(--ink)' : 'var(--ink-3)'
      }
    }, ctx.ttl(labelMap[st]))), i < 3 && /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        height: 2.5,
        background: i < cur ? col : 'var(--line-2)',
        margin: compact ? '0 4px' : '0 5px',
        marginBottom: compact ? 0 : 18,
        borderRadius: 2
      }
    }));
  }));
}

// ── TABLE DETAIL ────────────────────────────────────────────
function TableDetailScreen({
  ctx
}) {
  const {
    t,
    ttl,
    brand,
    scheme,
    tables,
    tickets,
    go,
    back,
    actions
  } = ctx;
  const x = tables.find(tb => tb.id === ctx.screen.params.id);
  if (!x) return /*#__PURE__*/React.createElement(Screen, null);
  const tks = tableTickets(tickets, x.id);
  const flag = x.flag ? W.FLAGS[x.flag] : null;
  const occ = x.status === 'occupied';
  const total = tks.reduce((s, tk) => s + ticketTotal(tk), 0);
  return /*#__PURE__*/React.createElement(Screen, null, /*#__PURE__*/React.createElement(BrandHeader, {
    brand: brand,
    onBack: back,
    backLabel: t('tables')
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      fontWeight: 700,
      opacity: .85,
      letterSpacing: '.02em'
    }
  }, ttl(W.ZONES[x.zone])), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 30,
      fontWeight: 800,
      letterSpacing: '-.025em',
      lineHeight: 1.05,
      marginTop: 2,
      whiteSpace: 'nowrap'
    }
  }, t('tableLabel'), " ", W.tableLabel(x)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 600,
      opacity: .9,
      marginTop: 4
    }
  }, occ ? `${x.guests} ${t('guests')} · ${x.mins} ${t('forMin')}` : `${x.seats} ${t('seats')}`)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-end',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      background: 'rgba(255,255,255,.18)',
      color: '#fff',
      fontWeight: 800,
      fontSize: 12.5,
      padding: '5px 12px 5px 10px',
      borderRadius: 999
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 7,
      height: 7,
      borderRadius: '50%',
      background: scheme[x.status].dot
    }
  }), ttl(W.STATUS[x.status])), x.mine && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10.5,
      fontWeight: 800,
      letterSpacing: '.04em',
      opacity: .9
    }
  }, ttl(W.STR.assignedToYou).toUpperCase())))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '16px 14px 24px'
    }
  }, flag && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      background: '#fff',
      border: `1px solid var(--line)`,
      borderLeft: `3px solid ${flag.dot}`,
      borderRadius: 13,
      padding: '11px 13px',
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 9,
      height: 9,
      borderRadius: '50%',
      background: flag.dot,
      flex: 'none'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13.5,
      fontWeight: 800,
      color: 'var(--ink)'
    }
  }, ttl(flag))), /*#__PURE__*/React.createElement(Eyebrow, null, t('changeStatus')), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 1fr',
      gap: 8,
      marginBottom: 20
    }
  }, ['occupied', 'dirty', 'clean'].map(s => {
    const on = x.status === s;
    return /*#__PURE__*/React.createElement("button", {
      key: s,
      onClick: () => actions.setTableStatus(x.id, s),
      style: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 7,
        padding: '13px 6px',
        borderRadius: 14,
        cursor: 'pointer',
        fontFamily: 'var(--font-sans)',
        border: on ? `2px solid ${scheme[s].dot}` : '1.5px solid var(--line)',
        background: on ? scheme[s].bg : '#fff'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 26,
        height: 26,
        borderRadius: '50%',
        background: on ? scheme[s].dot : 'var(--bg)',
        border: on ? 'none' : `2px solid var(--line-2)`,
        display: 'grid',
        placeItems: 'center'
      }
    }, on && /*#__PURE__*/React.createElement(Icon, {
      name: "check",
      size: 15,
      style: {
        color: '#fff'
      },
      strokeWidth: 2.6
    })), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12.5,
        fontWeight: 800,
        color: on ? scheme[s].fg : 'var(--ink-2)'
      }
    }, ttl(W.STATUS[s])));
  })), /*#__PURE__*/React.createElement(Eyebrow, {
    right: tks.length > 0 ? /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12.5,
        fontWeight: 800,
        color: 'var(--green-d)'
      }
    }, W.fmtTZS(total)) : null
  }, t('openOrder')), tks.length === 0 ? /*#__PURE__*/React.createElement(Panel, {
    style: {
      padding: '22px 16px',
      textAlign: 'center',
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 44,
      height: 44,
      borderRadius: 12,
      background: 'var(--bg)',
      color: 'var(--ink-3)',
      display: 'grid',
      placeItems: 'center',
      margin: '0 auto 10px'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "sale",
    size: 22
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13.5,
      fontWeight: 700,
      color: 'var(--ink-2)'
    }
  }, t('noOrderYet'))) : /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      marginBottom: 16
    }
  }, tks.map(tk => /*#__PURE__*/React.createElement(TicketCardMini, {
    key: tk.id,
    tk: tk,
    ctx: ctx,
    onOpen: () => go('ticket', {
      id: tk.id
    })
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 9
    }
  }, /*#__PURE__*/React.createElement(BigBtn, {
    primary: true,
    brand: brand,
    icon: "plus",
    label: tks.length ? t('addItems') : t('addOrder'),
    onClick: () => actions.startOrder(x.id)
  }), tks.length > 0 && /*#__PURE__*/React.createElement(BigBtn, {
    brand: brand,
    icon: "report",
    label: t('viewBill'),
    onClick: () => go('ticket', {
      id: tks[0].id
    })
  }), x.status === 'clean' && /*#__PURE__*/React.createElement(BigBtn, {
    brand: brand,
    icon: "users",
    label: t('seatGuests'),
    onClick: () => actions.setTableStatus(x.id, 'occupied')
  }))));
}
function TicketCardMini({
  tk,
  ctx,
  onOpen
}) {
  const {
    t,
    ttl,
    scheme
  } = ctx;
  const items = tk.items.slice(0, 3).map(it => `${it.qty}× ${ttl(MENU_BY[it.id])}`).join(' · ');
  const more = tk.items.length > 3 ? ` +${tk.items.length - 3}` : '';
  const stCol = tk.status === 'ready' ? 'var(--green)' : tk.status === 'served' ? 'var(--ink-3)' : 'var(--blue)';
  return /*#__PURE__*/React.createElement("div", {
    onClick: onOpen,
    style: {
      background: '#fff',
      border: '1px solid var(--line)',
      borderRadius: 15,
      padding: '13px 14px',
      cursor: 'pointer',
      boxShadow: '0 1px 2px rgba(18,32,25,.04)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 12,
      fontWeight: 700,
      color: 'var(--ink-3)'
    }
  }, "#", tk.id), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      color: stCol,
      fontWeight: 800,
      fontSize: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 7,
      height: 7,
      borderRadius: '50%',
      background: stCol
    }
  }), ttl(tkLabel(tk.status)))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: 'var(--ink-2)',
      fontWeight: 600,
      lineHeight: 1.45,
      marginBottom: 11
    }
  }, items, more), /*#__PURE__*/React.createElement(ProgressRail, {
    status: tk.status,
    scheme: scheme,
    ctx: ctx,
    compact: true
  }));
}
function tkLabel(s) {
  return s === 'preparing' ? W.STR.preparing : s === 'ready' ? W.STR.ready : W.STR.served;
}
function BigBtn({
  primary,
  brand,
  icon,
  label,
  onClick
}) {
  return /*#__PURE__*/React.createElement("button", {
    onClick: onClick,
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 9,
      width: '100%',
      padding: '14px',
      borderRadius: 13,
      cursor: 'pointer',
      fontFamily: 'var(--font-sans)',
      fontSize: 15,
      fontWeight: 800,
      border: primary ? 'none' : '1.5px solid var(--line-2)',
      background: primary ? 'linear-gradient(140deg, var(--green) 0%, var(--green-dd) 100%)' : '#fff',
      color: primary ? '#fff' : 'var(--ink)',
      boxShadow: primary ? '0 10px 20px -10px rgba(35,155,70,.55)' : 'none'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: icon,
    size: 19
  }), " ", label);
}

// ── ORDER MENU (take order) ─────────────────────────────────
function OrderMenuScreen({
  ctx
}) {
  const {
    t,
    ttl,
    brand,
    tables,
    cart,
    back,
    actions
  } = ctx;
  const x = tables.find(tb => tb.id === ctx.screen.params.id);
  const [cat, setCat] = useState('grill');
  const [q, setQ] = useState('');
  const items = cart.items;
  const count = items.reduce((s, it) => s + it.qty, 0);
  const sub = items.reduce((s, it) => s + MENU_BY[it.id].price * it.qty, 0);
  const filtered = W.MENU.filter(m => {
    if (q) return (m.en + m.sw).toLowerCase().includes(q.toLowerCase());
    return m.cat === cat;
  });
  const qtyOf = id => {
    const f = items.find(it => it.id === id);
    return f ? f.qty : 0;
  };
  return /*#__PURE__*/React.createElement(Screen, null, /*#__PURE__*/React.createElement(BrandHeader, {
    brand: brand,
    onBack: back,
    backLabel: x ? `${t('tableLabel')} ${W.tableLabel(x)}` : t('back')
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      fontWeight: 700,
      opacity: .85
    }
  }, t('addOrder')), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 24,
      fontWeight: 800,
      letterSpacing: '-.025em',
      marginTop: 2,
      whiteSpace: 'nowrap'
    }
  }, x ? `${t('tableLabel')} ${W.tableLabel(x)}` : '', " ", /*#__PURE__*/React.createElement("span", {
    style: {
      opacity: .7,
      fontWeight: 700,
      fontSize: 15
    }
  }, "\xB7 ", x ? ttl(W.ZONES[x.zone]) : '')), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 9,
      background: 'rgba(255,255,255,.16)',
      borderRadius: 12,
      padding: '10px 13px',
      marginTop: 14
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "search",
    size: 18,
    style: {
      color: 'rgba(255,255,255,.85)'
    }
  }), /*#__PURE__*/React.createElement("input", {
    value: q,
    onChange: e => setQ(e.target.value),
    placeholder: t('searchMenu'),
    style: {
      border: 'none',
      outline: 'none',
      background: 'transparent',
      color: '#fff',
      fontFamily: 'var(--font-sans)',
      fontSize: 14,
      fontWeight: 600,
      flex: 1,
      minWidth: 0
    }
  }))), !q && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 7,
      padding: '12px 14px',
      overflowX: 'auto',
      background: '#fff',
      borderBottom: '1px solid var(--line)'
    }
  }, W.CATS.map(c => {
    const on = cat === c.id;
    return /*#__PURE__*/React.createElement("button", {
      key: c.id,
      onClick: () => setCat(c.id),
      style: {
        flex: 'none',
        border: 'none',
        cursor: 'pointer',
        fontFamily: 'var(--font-sans)',
        fontWeight: 800,
        fontSize: 13,
        padding: '8px 15px',
        borderRadius: 999,
        background: on ? brand.hex : 'var(--bg)',
        color: on ? '#fff' : 'var(--ink-2)',
        transition: 'all .15s var(--ease)'
      }
    }, ttl(c));
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      background: 'var(--bg)',
      padding: '12px 14px',
      paddingBottom: count > 0 ? 92 : 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }
  }, filtered.map(m => {
    const n = qtyOf(m.id);
    return /*#__PURE__*/React.createElement("div", {
      key: m.id,
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        background: '#fff',
        border: '1px solid var(--line)',
        borderRadius: 14,
        padding: '11px 13px',
        boxShadow: '0 1px 2px rgba(18,32,25,.04)'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 14.5,
        fontWeight: 800,
        color: 'var(--ink)',
        letterSpacing: '-.01em'
      }
    }, ttl(m)), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12.5,
        color: 'var(--ink-3)',
        fontWeight: 600,
        marginTop: 2
      }
    }, m.note && ttl(m.note) ? /*#__PURE__*/React.createElement("span", null, ttl(m.note), " \xB7 ") : null, /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--green-d)',
        fontWeight: 800
      }
    }, W.fmtTZS(m.price)))), n === 0 ? /*#__PURE__*/React.createElement("button", {
      onClick: () => actions.addToCart(m.id),
      style: {
        width: 36,
        height: 36,
        borderRadius: 11,
        border: `1.5px solid ${brand.hex}`,
        background: brand.soft,
        color: brand.hex,
        cursor: 'pointer',
        display: 'grid',
        placeItems: 'center',
        flex: 'none'
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "plus",
      size: 19,
      strokeWidth: 2.2
    })) : /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 9,
        flex: 'none'
      }
    }, /*#__PURE__*/React.createElement(Stepper, {
      id: m.id,
      qty: n,
      actions: actions,
      brand: brand
    })));
  }))), count > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'sticky',
      bottom: 0,
      padding: '10px 12px 12px',
      zIndex: 30,
      background: 'linear-gradient(to top, var(--bg) 62%, transparent)'
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => actions.openReview(),
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      width: '100%',
      padding: '12px 14px',
      borderRadius: 16,
      cursor: 'pointer',
      border: 'none',
      fontFamily: 'var(--font-sans)',
      background: 'linear-gradient(135deg, var(--green) 0%, var(--green-dd) 100%)',
      color: '#fff',
      boxShadow: '0 14px 30px -10px rgba(35,155,70,.7)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 30,
      height: 30,
      borderRadius: 9,
      background: 'rgba(255,255,255,.22)',
      display: 'grid',
      placeItems: 'center',
      fontWeight: 800,
      fontSize: 14
    }
  }, count), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      textAlign: 'left',
      fontSize: 15,
      fontWeight: 800
    }
  }, t('cart'), " \xB7 ", W.fmtTZS(sub)), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      fontSize: 14,
      fontWeight: 800
    }
  }, t('sendToKitchen').split(' ')[0], " ", /*#__PURE__*/React.createElement(Icon, {
    name: "chevronRight",
    size: 18
  })))));
}
function Stepper({
  id,
  qty,
  actions,
  brand
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 4,
      background: brand.soft,
      borderRadius: 11,
      padding: 3
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => actions.setQty(id, qty - 1),
    style: stepBtn(brand)
  }, "\u2212"), /*#__PURE__*/React.createElement("span", {
    style: {
      minWidth: 20,
      textAlign: 'center',
      fontSize: 15,
      fontWeight: 800,
      color: brand.hex
    }
  }, qty), /*#__PURE__*/React.createElement("button", {
    onClick: () => actions.setQty(id, qty + 1),
    style: stepBtn(brand)
  }, "+"));
}
function stepBtn(brand) {
  return {
    width: 30,
    height: 30,
    borderRadius: 9,
    border: 'none',
    background: '#fff',
    color: brand.hex,
    fontSize: 19,
    fontWeight: 700,
    cursor: 'pointer',
    lineHeight: 1,
    display: 'grid',
    placeItems: 'center',
    boxShadow: '0 1px 2px rgba(18,32,25,.1)'
  };
}

// cart review bottom sheet
function CartSheet({
  ctx,
  table,
  onClose
}) {
  const {
    t,
    ttl,
    brand,
    cart,
    actions
  } = ctx;
  const items = cart.items;
  const sub = items.reduce((s, it) => s + MENU_BY[it.id].price * it.qty, 0);
  const vat = Math.round(sub * 0.18);
  return /*#__PURE__*/React.createElement("div", {
    onClick: onClose,
    style: {
      position: 'absolute',
      inset: 0,
      background: 'rgba(11,20,30,.5)',
      zIndex: 50,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-end'
    }
  }, /*#__PURE__*/React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      background: 'var(--bg)',
      borderRadius: '22px 22px 0 0',
      maxHeight: '86%',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '0 -10px 40px rgba(0,0,0,.3)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '12px 18px 8px',
      flex: 'none'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 38,
      height: 4,
      borderRadius: 2,
      background: 'var(--line-2)',
      margin: '0 auto 12px'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 19,
      fontWeight: 800,
      letterSpacing: '-.02em'
    }
  }, t('cart'), " \xB7 ", t('tableLabel'), " ", table ? W.tableLabel(table) : ''), /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    style: {
      border: 'none',
      background: 'var(--surface)',
      width: 30,
      height: 30,
      borderRadius: '50%',
      cursor: 'pointer',
      color: 'var(--ink-3)',
      fontSize: 17,
      boxShadow: '0 1px 2px rgba(0,0,0,.08)'
    }
  }, "\u2715"))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflowY: 'auto',
      padding: '6px 14px 4px'
    }
  }, items.map(it => {
    const m = MENU_BY[it.id];
    return /*#__PURE__*/React.createElement("div", {
      key: it.id,
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 11,
        background: '#fff',
        border: '1px solid var(--line)',
        borderRadius: 13,
        padding: '10px 12px',
        marginBottom: 8
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 14,
        fontWeight: 800,
        color: 'var(--ink)'
      }
    }, ttl(m)), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12.5,
        color: 'var(--green-d)',
        fontWeight: 800,
        marginTop: 2
      }
    }, W.fmtTZS(m.price * it.qty))), /*#__PURE__*/React.createElement(Stepper, {
      id: it.id,
      qty: it.qty,
      actions: actions,
      brand: brand
    }));
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 'none',
      background: '#fff',
      borderTop: '1px solid var(--line)',
      padding: '14px 18px 18px'
    }
  }, /*#__PURE__*/React.createElement(Row, {
    label: t('subtotal'),
    val: W.fmtTZS(sub)
  }), /*#__PURE__*/React.createElement(Row, {
    label: t('vat'),
    val: W.fmtTZS(vat),
    muted: true
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      margin: '8px 0 14px'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 15,
      fontWeight: 800
    }
  }, t('total')), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 22,
      fontWeight: 800,
      color: 'var(--green-d)',
      letterSpacing: '-.02em'
    }
  }, W.fmtTZS(sub + vat))), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      actions.sendOrder(table.id);
      onClose();
    },
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 9,
      width: '100%',
      padding: '15px',
      border: 'none',
      borderRadius: 13,
      cursor: 'pointer',
      fontFamily: 'var(--font-sans)',
      fontSize: 16,
      fontWeight: 800,
      background: 'linear-gradient(135deg, var(--green) 0%, var(--green-dd) 100%)',
      color: '#fff',
      boxShadow: '0 12px 24px -10px rgba(35,155,70,.6)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "checkCircle",
    size: 20
  }), " ", t('sendToKitchen')))));
}
function Row({
  label,
  val,
  muted
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: 13.5,
      color: muted ? 'var(--ink-3)' : 'var(--ink-2)',
      fontWeight: 600,
      marginBottom: 6
    }
  }, /*#__PURE__*/React.createElement("span", null, label), /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 700
    }
  }, val));
}

// ── ORDERS (kitchen tickets) ────────────────────────────────
function OrdersScreen({
  ctx
}) {
  const {
    t,
    ttl,
    brand,
    scheme,
    tickets,
    tables,
    go
  } = ctx;
  const [f, setF] = useState('all');
  const order = {
    ready: 0,
    preparing: 1,
    served: 2
  };
  const list = (f === 'all' ? tickets : tickets.filter(tk => tk.status === f)).slice().sort((a, b) => order[a.status] - order[b.status]);
  const cnt = s => tickets.filter(tk => tk.status === s).length;
  return /*#__PURE__*/React.createElement(Screen, null, /*#__PURE__*/React.createElement(PlainHeader, {
    title: t('kitchenOrders'),
    sub: `${tickets.length} ${ttl({
      en: 'active',
      sw: 'hai'
    })}`
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 7,
      padding: '12px 14px',
      background: 'var(--bg)',
      overflowX: 'auto'
    }
  }, [['all', ttl({
    en: 'All',
    sw: 'Zote'
  }), tickets.length], ['preparing', t('preparing'), cnt('preparing')], ['ready', t('ready'), cnt('ready')], ['served', t('served'), cnt('served')]].map(([k, lbl, c]) => /*#__PURE__*/React.createElement("button", {
    key: k,
    onClick: () => setF(k),
    style: {
      flex: 'none',
      border: 'none',
      cursor: 'pointer',
      fontFamily: 'var(--font-sans)',
      fontWeight: 800,
      fontSize: 12.5,
      padding: '8px 13px',
      borderRadius: 999,
      background: f === k ? brand.hex : '#fff',
      color: f === k ? '#fff' : 'var(--ink-2)',
      boxShadow: f === k ? 'none' : '0 1px 2px rgba(18,32,25,.05)',
      display: 'inline-flex',
      alignItems: 'center',
      gap: 7
    }
  }, lbl, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      opacity: .8
    }
  }, c)))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      background: 'var(--bg)',
      padding: '4px 14px 24px',
      display: 'flex',
      flexDirection: 'column',
      gap: 11
    }
  }, list.length === 0 && /*#__PURE__*/React.createElement(EmptyState, {
    icon: "report",
    text: t('allCaughtUp')
  }), list.map(tk => /*#__PURE__*/React.createElement(TicketCard, {
    key: tk.id,
    tk: tk,
    ctx: ctx
  }))));
}
function TicketCard({
  tk,
  ctx
}) {
  const {
    t,
    ttl,
    scheme,
    tables,
    go,
    actions
  } = ctx;
  const tb = tables.find(x => x.id === tk.tableId);
  const stCol = tk.status === 'ready' ? 'var(--green)' : tk.status === 'served' ? 'var(--ink-3)' : 'var(--blue)';
  const stBg = tk.status === 'ready' ? 'var(--green-50)' : tk.status === 'served' ? '#eef1f5' : 'var(--blue-50)';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: '#fff',
      border: '1px solid var(--line)',
      borderRadius: 16,
      overflow: 'hidden',
      boxShadow: '0 1px 2px rgba(18,32,25,.04)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    onClick: () => go('ticket', {
      id: tk.id
    }),
    style: {
      padding: '13px 14px 14px',
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 11
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 40,
      height: 40,
      borderRadius: 11,
      background: scheme.occupied.bg,
      color: scheme.occupied.fg,
      display: 'grid',
      placeItems: 'center',
      fontWeight: 800,
      fontSize: 15,
      letterSpacing: '-.02em'
    }
  }, W.tableLabel(tb)), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14.5,
      fontWeight: 800,
      color: 'var(--ink)'
    }
  }, t('tableLabel'), " ", W.tableLabel(tb)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 11.5,
      color: 'var(--ink-3)',
      fontWeight: 600
    }
  }, "#", tk.id, " \xB7 ", ago(tk.mins, t)))), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      background: stBg,
      color: stCol,
      fontWeight: 800,
      fontSize: 12,
      padding: '5px 11px 5px 9px',
      borderRadius: 999
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 7,
      height: 7,
      borderRadius: '50%',
      background: stCol
    }
  }), ttl(tkLabel(tk.status)))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: 'var(--ink-2)',
      fontWeight: 600,
      lineHeight: 1.5,
      marginBottom: 12
    }
  }, tk.items.map(it => `${it.qty}× ${ttl(MENU_BY[it.id])}`).join(' · ')), /*#__PURE__*/React.createElement(ProgressRail, {
    status: tk.status,
    scheme: scheme,
    ctx: ctx
  })), (tk.status === 'ready' || tk.status === 'preparing') && /*#__PURE__*/React.createElement("button", {
    onClick: () => actions.serveTicket(tk.id),
    style: {
      width: '100%',
      border: 'none',
      borderTop: '1px solid var(--line)',
      cursor: 'pointer',
      fontFamily: 'var(--font-sans)',
      padding: '12px',
      fontSize: 14,
      fontWeight: 800,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      background: tk.status === 'ready' ? 'var(--green-50)' : '#fff',
      color: tk.status === 'ready' ? 'var(--green-d)' : 'var(--ink-2)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "checkCircle",
    size: 18
  }), " ", tk.status === 'ready' ? t('pickUp') : t('markServed')));
}

// ── TICKET DETAIL ───────────────────────────────────────────
function TicketDetailScreen({
  ctx
}) {
  const {
    t,
    ttl,
    brand,
    scheme,
    tickets,
    tables,
    back,
    actions
  } = ctx;
  const tk = tickets.find(x => x.id === ctx.screen.params.id);
  if (!tk) return /*#__PURE__*/React.createElement(Screen, null);
  const tb = tables.find(x => x.id === tk.tableId);
  const sub = ticketTotal(tk);
  const vat = Math.round(sub * 0.18);
  return /*#__PURE__*/React.createElement(Screen, null, /*#__PURE__*/React.createElement(PlainHeader, {
    onBack: back,
    backLabel: t('orders'),
    title: `${t('tableLabel')} ${W.tableLabel(tb)}`,
    sub: `#${tk.id} · ${ago(tk.mins, t)}`,
    right: /*#__PURE__*/React.createElement("span", {
      style: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        background: tk.status === 'ready' ? 'var(--green-50)' : tk.status === 'served' ? '#eef1f5' : 'var(--blue-50)',
        color: tk.status === 'ready' ? 'var(--green-d)' : tk.status === 'served' ? 'var(--ink-2)' : 'var(--blue-d)',
        fontWeight: 800,
        fontSize: 12.5,
        padding: '5px 11px 5px 9px',
        borderRadius: 999
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 7,
        height: 7,
        borderRadius: '50%',
        background: tk.status === 'ready' ? 'var(--green)' : tk.status === 'served' ? 'var(--ink-3)' : 'var(--blue)'
      }
    }), ttl(tkLabel(tk.status)))
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      background: 'var(--bg)',
      padding: '16px 14px 24px'
    }
  }, /*#__PURE__*/React.createElement(Panel, {
    style: {
      padding: '16px 16px 8px',
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement(ProgressRail, {
    status: tk.status,
    scheme: scheme,
    ctx: ctx
  })), /*#__PURE__*/React.createElement(Eyebrow, null, t('ticket'), " #", tk.id), /*#__PURE__*/React.createElement(Panel, {
    style: {
      overflow: 'hidden',
      marginBottom: 16
    }
  }, tk.items.map((it, i) => {
    const m = MENU_BY[it.id];
    return /*#__PURE__*/React.createElement("div", {
      key: it.id,
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 14px',
        borderTop: i ? '1px solid var(--line)' : 'none'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 26,
        height: 26,
        borderRadius: 8,
        background: brand.soft,
        color: brand.hex,
        display: 'grid',
        placeItems: 'center',
        fontWeight: 800,
        fontSize: 13,
        flex: 'none'
      }
    }, it.qty), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 14,
        fontWeight: 700,
        color: 'var(--ink)'
      }
    }, ttl(m)), m.note && ttl(m.note) ? /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11.5,
        color: 'var(--ink-3)',
        fontWeight: 600
      }
    }, ttl(m.note)) : null), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13.5,
        fontWeight: 800,
        color: 'var(--ink)'
      }
    }, W.fmtTZS(m.price * it.qty)));
  })), /*#__PURE__*/React.createElement(Panel, {
    style: {
      padding: '14px 16px',
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement(Row, {
    label: t('subtotal'),
    val: W.fmtTZS(sub)
  }), /*#__PURE__*/React.createElement(Row, {
    label: t('vat'),
    val: W.fmtTZS(vat),
    muted: true
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      marginTop: 6,
      paddingTop: 10,
      borderTop: '1px dashed var(--line)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 15,
      fontWeight: 800
    }
  }, t('total')), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 21,
      fontWeight: 800,
      color: 'var(--green-d)',
      letterSpacing: '-.02em'
    }
  }, W.fmtTZS(sub + vat)))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 9
    }
  }, tk.status !== 'served' && /*#__PURE__*/React.createElement(BigBtn, {
    primary: true,
    brand: brand,
    icon: "checkCircle",
    label: tk.status === 'ready' ? t('pickUp') : t('markServed'),
    onClick: () => {
      actions.serveTicket(tk.id);
      back();
    }
  }), /*#__PURE__*/React.createElement(BigBtn, {
    brand: brand,
    icon: "plus",
    label: t('addItems'),
    onClick: () => actions.startOrder(tk.tableId)
  }))));
}

// ── NOTIFICATIONS ───────────────────────────────────────────
function NotificationsScreen({
  ctx
}) {
  const {
    t,
    ttl,
    brand,
    notifs,
    tables,
    go,
    actions
  } = ctx;
  const unread = notifs.filter(n => !n.read);
  const read = notifs.filter(n => n.read);
  return /*#__PURE__*/React.createElement(Screen, null, /*#__PURE__*/React.createElement(PlainHeader, {
    title: t('notifications'),
    sub: `${unread.length} ${ttl({
      en: 'new',
      sw: 'mpya'
    })}`,
    right: unread.length > 0 ? /*#__PURE__*/React.createElement("button", {
      onClick: actions.markAllRead,
      style: linkBtn(brand)
    }, t('markAllRead')) : null
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      background: 'var(--bg)',
      padding: '14px 14px 24px'
    }
  }, notifs.length === 0 && /*#__PURE__*/React.createElement(EmptyState, {
    icon: "bell",
    text: t('allCaughtUp')
  }), unread.length > 0 && /*#__PURE__*/React.createElement(Eyebrow, null, ttl({
    en: 'New',
    sw: 'Mpya'
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 9,
      marginBottom: read.length ? 18 : 0
    }
  }, unread.map(n => /*#__PURE__*/React.createElement(NotifCard, {
    key: n.id,
    n: n,
    ctx: ctx
  }))), read.length > 0 && /*#__PURE__*/React.createElement(Eyebrow, null, ttl({
    en: 'Earlier',
    sw: 'Awali'
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 9
    }
  }, read.map(n => /*#__PURE__*/React.createElement(NotifCard, {
    key: n.id,
    n: n,
    ctx: ctx
  })))));
}
function NotifCard({
  n,
  ctx
}) {
  const {
    t,
    ttl,
    brand,
    tables,
    go,
    actions
  } = ctx;
  const cp = W.notifCopy(n.kind);
  const tint = notifTint(n.kind);
  const tb = tables.find(x => x.id === n.tableId);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      background: '#fff',
      borderRadius: 15,
      padding: '13px 14px',
      border: '1px solid var(--line)',
      borderLeft: `3px solid ${tint.fg}`,
      opacity: n.read ? .82 : 1,
      boxShadow: '0 1px 2px rgba(18,32,25,.04)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 42,
      height: 42,
      borderRadius: 12,
      background: tint.bg,
      color: tint.fg,
      display: 'grid',
      placeItems: 'center',
      flex: 'none',
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: cp.icon,
    size: 21
  }), !n.read && /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      top: -2,
      right: -2,
      width: 10,
      height: 10,
      borderRadius: '50%',
      background: brand.hex,
      border: '2px solid #fff'
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 800,
      color: 'var(--ink)',
      letterSpacing: '-.01em',
      lineHeight: 1.25
    }
  }, ttl(cp)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: 'var(--ink-3)',
      fontWeight: 600,
      marginTop: 3,
      lineHeight: 1.3
    }
  }, t('tableLabel'), " ", tb ? W.tableLabel(tb) : '', " \xB7 ", tb ? ttl(W.ZONES[tb.zone]) : '', " \xB7 ", ago(n.mins, t))), n.kind === 'ready' ? /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      actions.resolveNotif(n.id);
      if (n.ticket) actions.serveTicket(n.ticket);
    },
    style: pillBtn('var(--green)')
  }, t('pickUp')) : /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      actions.resolveNotif(n.id);
      go('table', {
        id: n.tableId
      });
    },
    "aria-label": t('goToTable'),
    style: {
      width: 38,
      height: 38,
      borderRadius: '50%',
      border: '1.5px solid var(--line)',
      background: '#fff',
      color: brand.hex,
      cursor: 'pointer',
      display: 'grid',
      placeItems: 'center',
      flex: 'none'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "chevronRight",
    size: 19
  })));
}
function EmptyState({
  icon,
  text
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      padding: '54px 20px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 56,
      height: 56,
      borderRadius: 16,
      background: 'var(--green-50)',
      color: 'var(--green-d)',
      display: 'grid',
      placeItems: 'center',
      margin: '0 auto 12px'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "checkCircle",
    size: 28
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14.5,
      fontWeight: 800,
      color: 'var(--ink-2)'
    }
  }, text));
}
Object.assign(window, {
  TableDetailScreen,
  OrderMenuScreen,
  OrdersScreen,
  TicketDetailScreen,
  NotificationsScreen,
  ProgressRail,
  tkLabel,
  BigBtn,
  EmptyState,
  CartSheet
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "waiter-app/screens-order.jsx", error: String((e && e.message) || e) }); }

// waiter-app/tweaks-panel.jsx
try { (() => {
// @ds-adherence-ignore -- omelette starter scaffold (raw elements/hex/px by design)

/* BEGIN USAGE */
// tweaks-panel.jsx
// Reusable Tweaks shell + form-control helpers.
// Exports (to window): useTweaks, TweaksPanel, TweakSection, TweakRow, TweakSlider,
//   TweakToggle, TweakRadio, TweakSelect, TweakText, TweakNumber, TweakColor, TweakButton.
//
// Owns the host protocol (listens for __activate_edit_mode / __deactivate_edit_mode,
// posts __edit_mode_available / __edit_mode_set_keys / __edit_mode_dismissed) so
// individual prototypes don't re-roll it. Ships a consistent set of controls so you
// don't hand-draw <input type="range">, segmented radios, steppers, etc.
//
// Usage (in an HTML file that loads React + Babel):
//
//   const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
//     "primaryColor": "#D97757",
//     "palette": ["#D97757", "#29261b", "#f6f4ef"],
//     "fontSize": 16,
//     "density": "regular",
//     "dark": false
//   }/*EDITMODE-END*/;
//
//   function App() {
//     const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
//     return (
//       <div style={{ fontSize: t.fontSize, color: t.primaryColor }}>
//         Hello
//         <TweaksPanel>
//           <TweakSection label="Typography" />
//           <TweakSlider label="Font size" value={t.fontSize} min={10} max={32} unit="px"
//                        onChange={(v) => setTweak('fontSize', v)} />
//           <TweakRadio  label="Density" value={t.density}
//                        options={['compact', 'regular', 'comfy']}
//                        onChange={(v) => setTweak('density', v)} />
//           <TweakSection label="Theme" />
//           <TweakColor  label="Primary" value={t.primaryColor}
//                        options={['#D97757', '#2A6FDB', '#1F8A5B', '#7A5AE0']}
//                        onChange={(v) => setTweak('primaryColor', v)} />
//           <TweakColor  label="Palette" value={t.palette}
//                        options={[['#D97757', '#29261b', '#f6f4ef'],
//                                  ['#475569', '#0f172a', '#f1f5f9']]}
//                        onChange={(v) => setTweak('palette', v)} />
//           <TweakToggle label="Dark mode" value={t.dark}
//                        onChange={(v) => setTweak('dark', v)} />
//         </TweaksPanel>
//       </div>
//     );
//   }
//
// TweakRadio is the segmented control for 2–3 short options (auto-falls-back to
// TweakSelect past ~16/~10 chars per label); reach for TweakSelect directly when
// options are many or long. For color tweaks always curate 3-4 options rather than
// a free picker; an option can also be a whole 2–5 color palette (the stored value
// is the array). The Tweak* controls are a floor, not a ceiling — build custom
// controls inside the panel if a tweak calls for UI they don't cover.
/* END USAGE */
// ─────────────────────────────────────────────────────────────────────────────

const __TWEAKS_STYLE = `
  .twk-panel{position:fixed;right:16px;bottom:16px;z-index:2147483646;width:280px;
    max-height:calc(100vh - 32px);display:flex;flex-direction:column;
    transform:scale(var(--dc-inv-zoom,1));transform-origin:bottom right;
    background:rgba(250,249,247,.78);color:#29261b;
    -webkit-backdrop-filter:blur(24px) saturate(160%);backdrop-filter:blur(24px) saturate(160%);
    border:.5px solid rgba(255,255,255,.6);border-radius:14px;
    box-shadow:0 1px 0 rgba(255,255,255,.5) inset,0 12px 40px rgba(0,0,0,.18);
    font:11.5px/1.4 ui-sans-serif,system-ui,-apple-system,sans-serif;overflow:hidden}
  .twk-hd{display:flex;align-items:center;justify-content:space-between;
    padding:10px 8px 10px 14px;cursor:move;user-select:none}
  .twk-hd b{font-size:12px;font-weight:600;letter-spacing:.01em}
  .twk-x{appearance:none;border:0;background:transparent;color:rgba(41,38,27,.55);
    width:22px;height:22px;border-radius:6px;cursor:default;font-size:13px;line-height:1}
  .twk-x:hover{background:rgba(0,0,0,.06);color:#29261b}
  .twk-body{padding:2px 14px 14px;display:flex;flex-direction:column;gap:10px;
    overflow-y:auto;overflow-x:hidden;min-height:0;
    scrollbar-width:thin;scrollbar-color:rgba(0,0,0,.15) transparent}
  .twk-body::-webkit-scrollbar{width:8px}
  .twk-body::-webkit-scrollbar-track{background:transparent;margin:2px}
  .twk-body::-webkit-scrollbar-thumb{background:rgba(0,0,0,.15);border-radius:4px;
    border:2px solid transparent;background-clip:content-box}
  .twk-body::-webkit-scrollbar-thumb:hover{background:rgba(0,0,0,.25);
    border:2px solid transparent;background-clip:content-box}
  .twk-row{display:flex;flex-direction:column;gap:5px}
  .twk-row-h{flex-direction:row;align-items:center;justify-content:space-between;gap:10px}
  .twk-lbl{display:flex;justify-content:space-between;align-items:baseline;
    color:rgba(41,38,27,.72)}
  .twk-lbl>span:first-child{font-weight:500}
  .twk-val{color:rgba(41,38,27,.5);font-variant-numeric:tabular-nums}

  .twk-sect{font-size:10px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;
    color:rgba(41,38,27,.45);padding:10px 0 0}
  .twk-sect:first-child{padding-top:0}

  .twk-field{appearance:none;box-sizing:border-box;width:100%;min-width:0;height:26px;padding:0 8px;
    border:.5px solid rgba(0,0,0,.1);border-radius:7px;
    background:rgba(255,255,255,.6);color:inherit;font:inherit;outline:none}
  .twk-field:focus{border-color:rgba(0,0,0,.25);background:rgba(255,255,255,.85)}
  select.twk-field{padding-right:22px;
    background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'><path fill='rgba(0,0,0,.5)' d='M0 0h10L5 6z'/></svg>");
    background-repeat:no-repeat;background-position:right 8px center}

  .twk-slider{appearance:none;-webkit-appearance:none;width:100%;height:4px;margin:6px 0;
    border-radius:999px;background:rgba(0,0,0,.12);outline:none}
  .twk-slider::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;
    width:14px;height:14px;border-radius:50%;background:#fff;
    border:.5px solid rgba(0,0,0,.12);box-shadow:0 1px 3px rgba(0,0,0,.2);cursor:default}
  .twk-slider::-moz-range-thumb{width:14px;height:14px;border-radius:50%;
    background:#fff;border:.5px solid rgba(0,0,0,.12);box-shadow:0 1px 3px rgba(0,0,0,.2);cursor:default}

  .twk-seg{position:relative;display:flex;padding:2px;border-radius:8px;
    background:rgba(0,0,0,.06);user-select:none}
  .twk-seg-thumb{position:absolute;top:2px;bottom:2px;border-radius:6px;
    background:rgba(255,255,255,.9);box-shadow:0 1px 2px rgba(0,0,0,.12);
    transition:left .15s cubic-bezier(.3,.7,.4,1),width .15s}
  .twk-seg.dragging .twk-seg-thumb{transition:none}
  .twk-seg button{appearance:none;position:relative;z-index:1;flex:1;border:0;
    background:transparent;color:inherit;font:inherit;font-weight:500;min-height:22px;
    border-radius:6px;cursor:default;padding:4px 6px;line-height:1.2;
    overflow-wrap:anywhere}

  .twk-toggle{position:relative;width:32px;height:18px;border:0;border-radius:999px;
    background:rgba(0,0,0,.15);transition:background .15s;cursor:default;padding:0}
  .twk-toggle[data-on="1"]{background:#34c759}
  .twk-toggle i{position:absolute;top:2px;left:2px;width:14px;height:14px;border-radius:50%;
    background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.25);transition:transform .15s}
  .twk-toggle[data-on="1"] i{transform:translateX(14px)}

  .twk-num{display:flex;align-items:center;box-sizing:border-box;min-width:0;height:26px;padding:0 0 0 8px;
    border:.5px solid rgba(0,0,0,.1);border-radius:7px;background:rgba(255,255,255,.6)}
  .twk-num-lbl{font-weight:500;color:rgba(41,38,27,.6);cursor:ew-resize;
    user-select:none;padding-right:8px}
  .twk-num input{flex:1;min-width:0;height:100%;border:0;background:transparent;
    font:inherit;font-variant-numeric:tabular-nums;text-align:right;padding:0 8px 0 0;
    outline:none;color:inherit;-moz-appearance:textfield}
  .twk-num input::-webkit-inner-spin-button,.twk-num input::-webkit-outer-spin-button{
    -webkit-appearance:none;margin:0}
  .twk-num-unit{padding-right:8px;color:rgba(41,38,27,.45)}

  .twk-btn{appearance:none;height:26px;padding:0 12px;border:0;border-radius:7px;
    background:rgba(0,0,0,.78);color:#fff;font:inherit;font-weight:500;cursor:default}
  .twk-btn:hover{background:rgba(0,0,0,.88)}
  .twk-btn.secondary{background:rgba(0,0,0,.06);color:inherit}
  .twk-btn.secondary:hover{background:rgba(0,0,0,.1)}

  .twk-swatch{appearance:none;-webkit-appearance:none;width:56px;height:22px;
    border:.5px solid rgba(0,0,0,.1);border-radius:6px;padding:0;cursor:default;
    background:transparent;flex-shrink:0}
  .twk-swatch::-webkit-color-swatch-wrapper{padding:0}
  .twk-swatch::-webkit-color-swatch{border:0;border-radius:5.5px}
  .twk-swatch::-moz-color-swatch{border:0;border-radius:5.5px}

  .twk-chips{display:flex;gap:6px}
  .twk-chip{position:relative;appearance:none;flex:1;min-width:0;height:46px;
    padding:0;border:0;border-radius:6px;overflow:hidden;cursor:default;
    box-shadow:0 0 0 .5px rgba(0,0,0,.12),0 1px 2px rgba(0,0,0,.06);
    transition:transform .12s cubic-bezier(.3,.7,.4,1),box-shadow .12s}
  .twk-chip:hover{transform:translateY(-1px);
    box-shadow:0 0 0 .5px rgba(0,0,0,.18),0 4px 10px rgba(0,0,0,.12)}
  .twk-chip[data-on="1"]{box-shadow:0 0 0 1.5px rgba(0,0,0,.85),
    0 2px 6px rgba(0,0,0,.15)}
  .twk-chip>span{position:absolute;top:0;bottom:0;right:0;width:34%;
    display:flex;flex-direction:column;box-shadow:-1px 0 0 rgba(0,0,0,.1)}
  .twk-chip>span>i{flex:1;box-shadow:0 -1px 0 rgba(0,0,0,.1)}
  .twk-chip>span>i:first-child{box-shadow:none}
  .twk-chip svg{position:absolute;top:6px;left:6px;width:13px;height:13px;
    filter:drop-shadow(0 1px 1px rgba(0,0,0,.3))}
`;

// ── useTweaks ───────────────────────────────────────────────────────────────
// Single source of truth for tweak values. setTweak persists via the host
// (__edit_mode_set_keys → host rewrites the EDITMODE block on disk).
function useTweaks(defaults) {
  const [values, setValues] = React.useState(defaults);
  // Accepts either setTweak('key', value) or setTweak({ key: value, ... }) so a
  // useState-style call doesn't write a "[object Object]" key into the persisted
  // JSON block.
  const setTweak = React.useCallback((keyOrEdits, val) => {
    const edits = typeof keyOrEdits === 'object' && keyOrEdits !== null ? keyOrEdits : {
      [keyOrEdits]: val
    };
    setValues(prev => ({
      ...prev,
      ...edits
    }));
    window.parent.postMessage({
      type: '__edit_mode_set_keys',
      edits
    }, '*');
    // Same-window signal so in-page listeners (deck-stage rail thumbnails)
    // can react — the parent message only reaches the host, not peers.
    window.dispatchEvent(new CustomEvent('tweakchange', {
      detail: edits
    }));
  }, []);
  return [values, setTweak];
}

// ── TweaksPanel ─────────────────────────────────────────────────────────────
// Floating shell. Registers the protocol listener BEFORE announcing
// availability — if the announce ran first, the host's activate could land
// before our handler exists and the toolbar toggle would silently no-op.
// The close button posts __edit_mode_dismissed so the host's toolbar toggle
// flips off in lockstep; the host echoes __deactivate_edit_mode back which
// is what actually hides the panel.
function TweaksPanel({
  title = 'Tweaks',
  children
}) {
  const [open, setOpen] = React.useState(false);
  const dragRef = React.useRef(null);
  const offsetRef = React.useRef({
    x: 16,
    y: 16
  });
  const PAD = 16;
  const clampToViewport = React.useCallback(() => {
    const panel = dragRef.current;
    if (!panel) return;
    const w = panel.offsetWidth,
      h = panel.offsetHeight;
    const maxRight = Math.max(PAD, window.innerWidth - w - PAD);
    const maxBottom = Math.max(PAD, window.innerHeight - h - PAD);
    offsetRef.current = {
      x: Math.min(maxRight, Math.max(PAD, offsetRef.current.x)),
      y: Math.min(maxBottom, Math.max(PAD, offsetRef.current.y))
    };
    panel.style.right = offsetRef.current.x + 'px';
    panel.style.bottom = offsetRef.current.y + 'px';
  }, []);
  React.useEffect(() => {
    if (!open) return;
    clampToViewport();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', clampToViewport);
      return () => window.removeEventListener('resize', clampToViewport);
    }
    const ro = new ResizeObserver(clampToViewport);
    ro.observe(document.documentElement);
    return () => ro.disconnect();
  }, [open, clampToViewport]);
  React.useEffect(() => {
    const onMsg = e => {
      const t = e?.data?.type;
      if (t === '__activate_edit_mode') setOpen(true);else if (t === '__deactivate_edit_mode') setOpen(false);
    };
    window.addEventListener('message', onMsg);
    window.parent.postMessage({
      type: '__edit_mode_available'
    }, '*');
    return () => window.removeEventListener('message', onMsg);
  }, []);
  const dismiss = () => {
    setOpen(false);
    window.parent.postMessage({
      type: '__edit_mode_dismissed'
    }, '*');
  };
  const onDragStart = e => {
    const panel = dragRef.current;
    if (!panel) return;
    const r = panel.getBoundingClientRect();
    const sx = e.clientX,
      sy = e.clientY;
    const startRight = window.innerWidth - r.right;
    const startBottom = window.innerHeight - r.bottom;
    const move = ev => {
      offsetRef.current = {
        x: startRight - (ev.clientX - sx),
        y: startBottom - (ev.clientY - sy)
      };
      clampToViewport();
    };
    const up = () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };
  if (!open) return null;
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("style", null, __TWEAKS_STYLE), /*#__PURE__*/React.createElement("div", {
    ref: dragRef,
    className: "twk-panel",
    "data-omelette-chrome": "",
    style: {
      right: offsetRef.current.x,
      bottom: offsetRef.current.y
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-hd",
    onMouseDown: onDragStart
  }, /*#__PURE__*/React.createElement("b", null, title), /*#__PURE__*/React.createElement("button", {
    className: "twk-x",
    "aria-label": "Close tweaks",
    onMouseDown: e => e.stopPropagation(),
    onClick: dismiss
  }, "\u2715")), /*#__PURE__*/React.createElement("div", {
    className: "twk-body"
  }, children)));
}

// ── Layout helpers ──────────────────────────────────────────────────────────

function TweakSection({
  label,
  children
}) {
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "twk-sect"
  }, label), children);
}
function TweakRow({
  label,
  value,
  children,
  inline = false
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: inline ? 'twk-row twk-row-h' : 'twk-row'
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-lbl"
  }, /*#__PURE__*/React.createElement("span", null, label), value != null && /*#__PURE__*/React.createElement("span", {
    className: "twk-val"
  }, value)), children);
}

// ── Controls ────────────────────────────────────────────────────────────────

function TweakSlider({
  label,
  value,
  min = 0,
  max = 100,
  step = 1,
  unit = '',
  onChange
}) {
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label,
    value: `${value}${unit}`
  }, /*#__PURE__*/React.createElement("input", {
    type: "range",
    className: "twk-slider",
    min: min,
    max: max,
    step: step,
    value: value,
    onChange: e => onChange(Number(e.target.value))
  }));
}
function TweakToggle({
  label,
  value,
  onChange
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "twk-row twk-row-h"
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-lbl"
  }, /*#__PURE__*/React.createElement("span", null, label)), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "twk-toggle",
    "data-on": value ? '1' : '0',
    role: "switch",
    "aria-checked": !!value,
    onClick: () => onChange(!value)
  }, /*#__PURE__*/React.createElement("i", null)));
}
function TweakRadio({
  label,
  value,
  options,
  onChange
}) {
  const trackRef = React.useRef(null);
  const [dragging, setDragging] = React.useState(false);
  // The active value is read by pointer-move handlers attached for the lifetime
  // of a drag — ref it so a stale closure doesn't fire onChange for every move.
  const valueRef = React.useRef(value);
  valueRef.current = value;

  // Segments wrap mid-word once per-segment width runs out. The track is
  // ~248px (280 panel − 28 body pad − 4 seg pad), each button loses 12px
  // to its own padding, and 11.5px system-ui averages ~6.3px/char — so 2
  // options fit ~16 chars each, 3 fit ~10. Past that (or >3 options), fall
  // back to a dropdown rather than wrap.
  const labelLen = o => String(typeof o === 'object' ? o.label : o).length;
  const maxLen = options.reduce((m, o) => Math.max(m, labelLen(o)), 0);
  const fitsAsSegments = maxLen <= ({
    2: 16,
    3: 10
  }[options.length] ?? 0);
  if (!fitsAsSegments) {
    // <select> emits strings — map back to the original option value so the
    // fallback stays type-preserving (numbers, booleans) like the segment path.
    const resolve = s => {
      const m = options.find(o => String(typeof o === 'object' ? o.value : o) === s);
      return m === undefined ? s : typeof m === 'object' ? m.value : m;
    };
    return /*#__PURE__*/React.createElement(TweakSelect, {
      label: label,
      value: value,
      options: options,
      onChange: s => onChange(resolve(s))
    });
  }
  const opts = options.map(o => typeof o === 'object' ? o : {
    value: o,
    label: o
  });
  const idx = Math.max(0, opts.findIndex(o => o.value === value));
  const n = opts.length;
  const segAt = clientX => {
    const r = trackRef.current.getBoundingClientRect();
    const inner = r.width - 4;
    const i = Math.floor((clientX - r.left - 2) / inner * n);
    return opts[Math.max(0, Math.min(n - 1, i))].value;
  };
  const onPointerDown = e => {
    setDragging(true);
    const v0 = segAt(e.clientX);
    if (v0 !== valueRef.current) onChange(v0);
    const move = ev => {
      if (!trackRef.current) return;
      const v = segAt(ev.clientX);
      if (v !== valueRef.current) onChange(v);
    };
    const up = () => {
      setDragging(false);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label
  }, /*#__PURE__*/React.createElement("div", {
    ref: trackRef,
    role: "radiogroup",
    onPointerDown: onPointerDown,
    className: dragging ? 'twk-seg dragging' : 'twk-seg'
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-seg-thumb",
    style: {
      left: `calc(2px + ${idx} * (100% - 4px) / ${n})`,
      width: `calc((100% - 4px) / ${n})`
    }
  }), opts.map(o => /*#__PURE__*/React.createElement("button", {
    key: o.value,
    type: "button",
    role: "radio",
    "aria-checked": o.value === value
  }, o.label))));
}
function TweakSelect({
  label,
  value,
  options,
  onChange
}) {
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label
  }, /*#__PURE__*/React.createElement("select", {
    className: "twk-field",
    value: value,
    onChange: e => onChange(e.target.value)
  }, options.map(o => {
    const v = typeof o === 'object' ? o.value : o;
    const l = typeof o === 'object' ? o.label : o;
    return /*#__PURE__*/React.createElement("option", {
      key: v,
      value: v
    }, l);
  })));
}
function TweakText({
  label,
  value,
  placeholder,
  onChange
}) {
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label
  }, /*#__PURE__*/React.createElement("input", {
    className: "twk-field",
    type: "text",
    value: value,
    placeholder: placeholder,
    onChange: e => onChange(e.target.value)
  }));
}
function TweakNumber({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  onChange
}) {
  const clamp = n => {
    if (min != null && n < min) return min;
    if (max != null && n > max) return max;
    return n;
  };
  const startRef = React.useRef({
    x: 0,
    val: 0
  });
  const onScrubStart = e => {
    e.preventDefault();
    startRef.current = {
      x: e.clientX,
      val: value
    };
    const decimals = (String(step).split('.')[1] || '').length;
    const move = ev => {
      const dx = ev.clientX - startRef.current.x;
      const raw = startRef.current.val + dx * step;
      const snapped = Math.round(raw / step) * step;
      onChange(clamp(Number(snapped.toFixed(decimals))));
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "twk-num"
  }, /*#__PURE__*/React.createElement("span", {
    className: "twk-num-lbl",
    onPointerDown: onScrubStart
  }, label), /*#__PURE__*/React.createElement("input", {
    type: "number",
    value: value,
    min: min,
    max: max,
    step: step,
    onChange: e => onChange(clamp(Number(e.target.value)))
  }), unit && /*#__PURE__*/React.createElement("span", {
    className: "twk-num-unit"
  }, unit));
}

// Relative-luminance contrast pick — checkmarks drawn over a swatch need to
// read on both #111 and #fafafa without per-option configuration. Hex input
// only (#rgb / #rrggbb); named or rgb()/hsl() colors fall through to "light".
function __twkIsLight(hex) {
  const h = String(hex).replace('#', '');
  const x = h.length === 3 ? h.replace(/./g, c => c + c) : h.padEnd(6, '0');
  const n = parseInt(x.slice(0, 6), 16);
  if (Number.isNaN(n)) return true;
  const r = n >> 16 & 255,
    g = n >> 8 & 255,
    b = n & 255;
  return r * 299 + g * 587 + b * 114 > 148000;
}
const __TwkCheck = ({
  light
}) => /*#__PURE__*/React.createElement("svg", {
  viewBox: "0 0 14 14",
  "aria-hidden": "true"
}, /*#__PURE__*/React.createElement("path", {
  d: "M3 7.2 5.8 10 11 4.2",
  fill: "none",
  strokeWidth: "2.2",
  strokeLinecap: "round",
  strokeLinejoin: "round",
  stroke: light ? 'rgba(0,0,0,.78)' : '#fff'
}));

// TweakColor — curated color/palette picker. Each option is either a single
// hex string or an array of 1-5 hex strings; the card adapts — a lone color
// renders solid, a palette renders colors[0] as the hero (left ~2/3) with the
// rest stacked in a sharp column on the right. onChange emits the
// option in the shape it was passed (string stays string, array stays array).
// Without options it falls back to the native color input for back-compat.
function TweakColor({
  label,
  value,
  options,
  onChange
}) {
  if (!options || !options.length) {
    return /*#__PURE__*/React.createElement("div", {
      className: "twk-row twk-row-h"
    }, /*#__PURE__*/React.createElement("div", {
      className: "twk-lbl"
    }, /*#__PURE__*/React.createElement("span", null, label)), /*#__PURE__*/React.createElement("input", {
      type: "color",
      className: "twk-swatch",
      value: value,
      onChange: e => onChange(e.target.value)
    }));
  }
  // Native <input type=color> emits lowercase hex per the HTML spec, so
  // compare case-insensitively. String() guards JSON.stringify(undefined),
  // which returns the primitive undefined (no .toLowerCase).
  const key = o => String(JSON.stringify(o)).toLowerCase();
  const cur = key(value);
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-chips",
    role: "radiogroup"
  }, options.map((o, i) => {
    const colors = Array.isArray(o) ? o : [o];
    const [hero, ...rest] = colors;
    const sup = rest.slice(0, 4);
    const on = key(o) === cur;
    return /*#__PURE__*/React.createElement("button", {
      key: i,
      type: "button",
      className: "twk-chip",
      role: "radio",
      "aria-checked": on,
      "data-on": on ? '1' : '0',
      "aria-label": colors.join(', '),
      title: colors.join(' · '),
      style: {
        background: hero
      },
      onClick: () => onChange(o)
    }, sup.length > 0 && /*#__PURE__*/React.createElement("span", null, sup.map((c, j) => /*#__PURE__*/React.createElement("i", {
      key: j,
      style: {
        background: c
      }
    }))), on && /*#__PURE__*/React.createElement(__TwkCheck, {
      light: __twkIsLight(hero)
    }));
  })));
}
function TweakButton({
  label,
  onClick,
  secondary = false
}) {
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: secondary ? 'twk-btn secondary' : 'twk-btn',
    onClick: onClick
  }, label);
}
Object.assign(window, {
  useTweaks,
  TweaksPanel,
  TweakSection,
  TweakRow,
  TweakSlider,
  TweakToggle,
  TweakRadio,
  TweakSelect,
  TweakText,
  TweakNumber,
  TweakColor,
  TweakButton
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "waiter-app/tweaks-panel.jsx", error: String((e && e.message) || e) }); }

// waiter-app/ui.jsx
try { (() => {
// ============================================================
// Waiter App — shared UI primitives (window globals)
// ============================================================
const {
  useState,
  useEffect,
  useRef
} = React;
const NS = window.BiasharaPOSDesignSystem_62a86f;
const {
  Icon
} = NS;

// bilingual text helper
function tt(obj, lang) {
  if (!obj) return '';
  return obj[lang] != null && obj[lang] !== '' ? obj[lang] : obj.en;
}

// ── faux Android status bar strip ───────────────────────────
function StatusRow({
  dark
}) {
  const c = dark ? 'rgba(255,255,255,.95)' : '#13202c';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: 34,
      flex: 'none',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 20px 0 22px',
      fontFamily: 'var(--font-sans)',
      position: 'relative',
      zIndex: 5
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13.5,
      fontWeight: 700,
      letterSpacing: '.02em',
      color: c
    }
  }, "20:41"), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: '50%',
      top: 9,
      transform: 'translateX(-50%)',
      width: 16,
      height: 16,
      borderRadius: 100,
      background: '#0c0c0e'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      color: c
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10.5,
      fontWeight: 800,
      letterSpacing: '.04em',
      marginRight: 1
    }
  }, "4G"), /*#__PURE__*/React.createElement("svg", {
    width: "16",
    height: "12",
    viewBox: "0 0 16 12",
    fill: "none"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M1 11h2V7H1v4zm4 0h2V4.5H5V11zm4 0h2V2H9v9zm4 0h2V0h-2v11z",
    fill: c
  })), /*#__PURE__*/React.createElement("svg", {
    width: "15",
    height: "12",
    viewBox: "0 0 17 13",
    fill: "none"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M8.5 3.2c2 0 3.8.8 5.1 2l1.2-1.3A9 9 0 0 0 2.2 3.9L3.4 5.2A7 7 0 0 1 8.5 3.2z",
    fill: c
  }), /*#__PURE__*/React.createElement("path", {
    d: "M8.5 6.6c1.1 0 2 .4 2.7 1.1l1.2-1.3a6 6 0 0 0-7.8 0l1.2 1.3c.7-.7 1.6-1.1 2.7-1.1z",
    fill: c
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "8.5",
    cy: "10",
    r: "1.4",
    fill: c
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 22,
      height: 11,
      borderRadius: 3,
      border: `1.5px solid ${c}`,
      padding: 1.5,
      opacity: .9
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: '72%',
      height: '100%',
      borderRadius: 1,
      background: c
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 1.5,
      height: 4,
      background: c,
      borderRadius: 1
    }
  }))));
}

// ── bottom tab nav ──────────────────────────────────────────
function BottomNav({
  tab,
  setTab,
  brand,
  alertCount,
  t
}) {
  const items = [{
    id: 'home',
    icon: 'dashboard',
    label: t('home')
  }, {
    id: 'tables',
    icon: 'store',
    label: t('tables')
  }, {
    id: 'orders',
    icon: 'report',
    label: t('orders')
  }, {
    id: 'alerts',
    icon: 'bell',
    label: t('alerts')
  }];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 'none',
      display: 'flex',
      background: '#fff',
      borderTop: '1px solid var(--line)',
      padding: '7px 8px 9px',
      boxShadow: '0 -6px 20px -14px rgba(18,32,25,.25)'
    }
  }, items.map(it => {
    const on = tab === it.id;
    return /*#__PURE__*/React.createElement("button", {
      key: it.id,
      onClick: () => setTab(it.id),
      style: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        border: 'none',
        background: 'none',
        cursor: 'pointer',
        padding: '4px 0',
        fontFamily: 'var(--font-sans)'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'relative'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: 56,
        height: 30,
        borderRadius: 999,
        display: 'grid',
        placeItems: 'center',
        background: on ? brand.soft : 'transparent',
        transition: 'background .18s var(--ease)',
        color: on ? brand.hex : 'var(--ink-3)'
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: it.icon,
      size: 21,
      strokeWidth: on ? 2.1 : 1.9
    })), it.id === 'alerts' && alertCount > 0 && /*#__PURE__*/React.createElement("span", {
      style: {
        position: 'absolute',
        top: -2,
        right: 4,
        minWidth: 16,
        height: 16,
        padding: '0 4px',
        borderRadius: 999,
        background: 'var(--red)',
        color: '#fff',
        fontSize: 10,
        fontWeight: 800,
        display: 'grid',
        placeItems: 'center',
        border: '2px solid #fff'
      }
    }, alertCount)), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        fontWeight: on ? 800 : 600,
        color: on ? brand.hex : 'var(--ink-3)',
        letterSpacing: '-.01em'
      }
    }, it.label));
  }));
}

// ── brand header (gradient, with optional back) ─────────────
function BrandHeader({
  brand,
  children,
  onBack,
  backLabel
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 'none',
      position: 'sticky',
      top: 0,
      zIndex: 4,
      background: `linear-gradient(135deg, ${brand.dd} 0%, ${brand.d} 48%, ${brand.hex} 100%)`,
      color: '#fff',
      padding: '0 18px 18px'
    }
  }, onBack && /*#__PURE__*/React.createElement("button", {
    onClick: onBack,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      background: 'rgba(255,255,255,.16)',
      border: 'none',
      color: '#fff',
      fontFamily: 'var(--font-sans)',
      fontSize: 13,
      fontWeight: 700,
      padding: '7px 13px 7px 9px',
      borderRadius: 999,
      cursor: 'pointer',
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "chevronRight",
    size: 16,
    style: {
      transform: 'rotate(180deg)'
    }
  }), " ", backLabel), children);
}

// ── plain white sticky header (back / title / right) ────────
function PlainHeader({
  title,
  sub,
  right,
  onBack,
  backLabel
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 'none',
      position: 'sticky',
      top: 0,
      zIndex: 4,
      background: '#fff',
      borderBottom: '1px solid var(--line)',
      padding: '12px 16px 13px'
    }
  }, onBack && /*#__PURE__*/React.createElement("button", {
    onClick: onBack,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      background: 'none',
      border: 'none',
      color: 'var(--ink-3)',
      fontFamily: 'var(--font-sans)',
      fontSize: 13,
      fontWeight: 700,
      padding: '0 0 8px',
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "chevronRight",
    size: 15,
    style: {
      transform: 'rotate(180deg)'
    }
  }), " ", backLabel), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 21,
      fontWeight: 800,
      letterSpacing: '-.022em',
      color: 'var(--ink)',
      lineHeight: 1.1
    }
  }, title), sub && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: 'var(--ink-3)',
      fontWeight: 600,
      marginTop: 2
    }
  }, sub)), right));
}

// ── status pill / dot ───────────────────────────────────────
function StatusPill({
  status,
  scheme,
  label,
  size = 'md'
}) {
  const s = scheme[status];
  const sm = size === 'sm';
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: sm ? 5 : 6,
      background: s.bg,
      color: s.fg,
      fontWeight: 800,
      fontSize: sm ? 11 : 12,
      padding: sm ? '3px 9px 3px 8px' : '4px 11px 4px 9px',
      borderRadius: 999,
      letterSpacing: '-.01em',
      whiteSpace: 'nowrap'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: sm ? 6 : 7,
      height: sm ? 6 : 7,
      borderRadius: '50%',
      background: s.dot,
      flex: 'none'
    }
  }), label);
}

// ── EN/SW segmented toggle ──────────────────────────────────
function LangToggle({
  lang,
  setLang,
  onBrand
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'inline-flex',
      padding: 3,
      borderRadius: 999,
      gap: 2,
      background: onBrand ? 'rgba(255,255,255,.18)' : 'var(--bg)',
      border: onBrand ? 'none' : '1px solid var(--line)'
    }
  }, ['en', 'sw'].map(l => {
    const on = lang === l;
    return /*#__PURE__*/React.createElement("button", {
      key: l,
      onClick: () => setLang(l),
      style: {
        border: 'none',
        cursor: 'pointer',
        fontFamily: 'var(--font-sans)',
        fontWeight: 800,
        fontSize: 11.5,
        letterSpacing: '.04em',
        padding: '5px 11px',
        borderRadius: 999,
        background: on ? '#fff' : 'transparent',
        color: on ? onBrand ? 'var(--blue-d)' : 'var(--ink)' : onBrand ? 'rgba(255,255,255,.85)' : 'var(--ink-3)',
        transition: 'all .15s var(--ease)'
      }
    }, l.toUpperCase());
  }));
}

// ── toast ───────────────────────────────────────────────────
function Toast({
  toast
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      bottom: 86,
      left: '50%',
      transform: `translateX(-50%) translateY(${toast ? 0 : 14}px)`,
      background: 'var(--ink)',
      color: '#fff',
      padding: '11px 18px',
      borderRadius: 12,
      fontSize: 13.5,
      fontWeight: 700,
      boxShadow: '0 16px 36px -12px rgba(0,0,0,.5)',
      opacity: toast ? 1 : 0,
      pointerEvents: 'none',
      transition: 'all .28s var(--ease)',
      zIndex: 40,
      display: 'flex',
      alignItems: 'center',
      gap: 9,
      maxWidth: 320,
      textAlign: 'left'
    }
  }, toast && /*#__PURE__*/React.createElement(Icon, {
    name: "checkCircle",
    size: 18,
    style: {
      color: '#5ee08a',
      flex: 'none'
    }
  }), /*#__PURE__*/React.createElement("span", null, toast));
}

// time-ago helper
function ago(mins, t) {
  if (mins < 1) return t('now');
  return mins + ' ' + (mins === 1 ? 'min' : 'min') + ' ' + t('ago');
}
Object.assign(window, {
  tt,
  StatusRow,
  BottomNav,
  BrandHeader,
  PlainHeader,
  StatusPill,
  LangToggle,
  Toast,
  ago
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "waiter-app/ui.jsx", error: String((e && e.message) || e) }); }

__ds_ns.MetricCard = __ds_scope.MetricCard;

__ds_ns.ProductTile = __ds_scope.ProductTile;

__ds_ns.Tabs = __ds_scope.Tabs;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.Switch = __ds_scope.Switch;

__ds_ns.Icon = __ds_scope.Icon;

})();
