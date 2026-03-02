import { makeGenericAPIRouteHandler } from '@keystatic/core/api/generic';
import { config as config$1, collection, fields } from '@keystatic/core';
export { renderers } from '../../../renderers.mjs';

var setCookie = {exports: {}};

var hasRequiredSetCookie;

function requireSetCookie () {
	if (hasRequiredSetCookie) return setCookie.exports;
	hasRequiredSetCookie = 1;

	var defaultParseOptions = {
	  decodeValues: true,
	  map: false,
	  silent: false,
	};

	function isForbiddenKey(key) {
	  return typeof key !== "string" || key in {};
	}

	function createNullObj() {
	  return Object.create(null);
	}

	function isNonEmptyString(str) {
	  return typeof str === "string" && !!str.trim();
	}

	function parseString(setCookieValue, options) {
	  var parts = setCookieValue.split(";").filter(isNonEmptyString);

	  var nameValuePairStr = parts.shift();
	  var parsed = parseNameValuePair(nameValuePairStr);
	  var name = parsed.name;
	  var value = parsed.value;

	  options = options
	    ? Object.assign({}, defaultParseOptions, options)
	    : defaultParseOptions;

	  if (isForbiddenKey(name)) {
	    return null;
	  }

	  try {
	    value = options.decodeValues ? decodeURIComponent(value) : value; // decode cookie value
	  } catch (e) {
	    console.error(
	      "set-cookie-parser: failed to decode cookie value. Set options.decodeValues=false to disable decoding.",
	      e
	    );
	  }

	  var cookie = createNullObj();
	  cookie.name = name;
	  cookie.value = value;

	  parts.forEach(function (part) {
	    var sides = part.split("=");
	    var key = sides.shift().trimLeft().toLowerCase();
	    if (isForbiddenKey(key)) {
	      return;
	    }
	    var value = sides.join("=");
	    if (key === "expires") {
	      cookie.expires = new Date(value);
	    } else if (key === "max-age") {
	      var n = parseInt(value, 10);
	      if (!Number.isNaN(n)) cookie.maxAge = n;
	    } else if (key === "secure") {
	      cookie.secure = true;
	    } else if (key === "httponly") {
	      cookie.httpOnly = true;
	    } else if (key === "samesite") {
	      cookie.sameSite = value;
	    } else if (key === "partitioned") {
	      cookie.partitioned = true;
	    } else if (key) {
	      cookie[key] = value;
	    }
	  });

	  return cookie;
	}

	function parseNameValuePair(nameValuePairStr) {
	  // Parses name-value-pair according to rfc6265bis draft

	  var name = "";
	  var value = "";
	  var nameValueArr = nameValuePairStr.split("=");
	  if (nameValueArr.length > 1) {
	    name = nameValueArr.shift();
	    value = nameValueArr.join("="); // everything after the first =, joined by a "=" if there was more than one part
	  } else {
	    value = nameValuePairStr;
	  }

	  return { name: name, value: value };
	}

	function parse(input, options) {
	  options = options
	    ? Object.assign({}, defaultParseOptions, options)
	    : defaultParseOptions;

	  if (!input) {
	    if (!options.map) {
	      return [];
	    } else {
	      return createNullObj();
	    }
	  }

	  if (input.headers) {
	    if (typeof input.headers.getSetCookie === "function") {
	      // for fetch responses - they combine headers of the same type in the headers array,
	      // but getSetCookie returns an uncombined array
	      input = input.headers.getSetCookie();
	    } else if (input.headers["set-cookie"]) {
	      // fast-path for node.js (which automatically normalizes header names to lower-case)
	      input = input.headers["set-cookie"];
	    } else {
	      // slow-path for other environments - see #25
	      var sch =
	        input.headers[
	          Object.keys(input.headers).find(function (key) {
	            return key.toLowerCase() === "set-cookie";
	          })
	        ];
	      // warn if called on a request-like object with a cookie header rather than a set-cookie header - see #34, 36
	      if (!sch && input.headers.cookie && !options.silent) {
	        console.warn(
	          "Warning: set-cookie-parser appears to have been called on a request object. It is designed to parse Set-Cookie headers from responses, not Cookie headers from requests. Set the option {silent: true} to suppress this warning."
	        );
	      }
	      input = sch;
	    }
	  }
	  if (!Array.isArray(input)) {
	    input = [input];
	  }

	  if (!options.map) {
	    return input
	      .filter(isNonEmptyString)
	      .map(function (str) {
	        return parseString(str, options);
	      })
	      .filter(Boolean);
	  } else {
	    var cookies = createNullObj();
	    return input.filter(isNonEmptyString).reduce(function (cookies, str) {
	      var cookie = parseString(str, options);
	      if (cookie && !isForbiddenKey(cookie.name)) {
	        cookies[cookie.name] = cookie;
	      }
	      return cookies;
	    }, cookies);
	  }
	}

	/*
	  Set-Cookie header field-values are sometimes comma joined in one string. This splits them without choking on commas
	  that are within a single set-cookie field-value, such as in the Expires portion.

	  This is uncommon, but explicitly allowed - see https://tools.ietf.org/html/rfc2616#section-4.2
	  Node.js does this for every header *except* set-cookie - see https://github.com/nodejs/node/blob/d5e363b77ebaf1caf67cd7528224b651c86815c1/lib/_http_incoming.js#L128
	  React Native's fetch does this for *every* header, including set-cookie.

	  Based on: https://github.com/google/j2objc/commit/16820fdbc8f76ca0c33472810ce0cb03d20efe25
	  Credits to: https://github.com/tomball for original and https://github.com/chrusart for JavaScript implementation
	*/
	function splitCookiesString(cookiesString) {
	  if (Array.isArray(cookiesString)) {
	    return cookiesString;
	  }
	  if (typeof cookiesString !== "string") {
	    return [];
	  }

	  var cookiesStrings = [];
	  var pos = 0;
	  var start;
	  var ch;
	  var lastComma;
	  var nextStart;
	  var cookiesSeparatorFound;

	  function skipWhitespace() {
	    while (pos < cookiesString.length && /\s/.test(cookiesString.charAt(pos))) {
	      pos += 1;
	    }
	    return pos < cookiesString.length;
	  }

	  function notSpecialChar() {
	    ch = cookiesString.charAt(pos);

	    return ch !== "=" && ch !== ";" && ch !== ",";
	  }

	  while (pos < cookiesString.length) {
	    start = pos;
	    cookiesSeparatorFound = false;

	    while (skipWhitespace()) {
	      ch = cookiesString.charAt(pos);
	      if (ch === ",") {
	        // ',' is a cookie separator if we have later first '=', not ';' or ','
	        lastComma = pos;
	        pos += 1;

	        skipWhitespace();
	        nextStart = pos;

	        while (pos < cookiesString.length && notSpecialChar()) {
	          pos += 1;
	        }

	        // currently special character
	        if (pos < cookiesString.length && cookiesString.charAt(pos) === "=") {
	          // we found cookies separator
	          cookiesSeparatorFound = true;
	          // pos is inside the next cookie, so back up and return it.
	          pos = nextStart;
	          cookiesStrings.push(cookiesString.substring(start, lastComma));
	          start = pos;
	        } else {
	          // in param ',' or param separator ';',
	          // we continue from that comma
	          pos = lastComma + 1;
	        }
	      } else {
	        pos += 1;
	      }
	    }

	    if (!cookiesSeparatorFound || pos >= cookiesString.length) {
	      cookiesStrings.push(cookiesString.substring(start, cookiesString.length));
	    }
	  }

	  return cookiesStrings;
	}

	setCookie.exports = parse;
	setCookie.exports.parse = parse;
	setCookie.exports.parseString = parseString;
	setCookie.exports.splitCookiesString = splitCookiesString;
	return setCookie.exports;
}

var setCookieExports = /*@__PURE__*/ requireSetCookie();

function makeHandler(_config) {
  return async function keystaticAPIRoute(context) {
    var _context$locals, _ref, _config$clientId, _ref2, _config$clientSecret, _ref3, _config$secret;
    const envVarsForCf = (_context$locals = context.locals) === null || _context$locals === void 0 || (_context$locals = _context$locals.runtime) === null || _context$locals === void 0 ? void 0 : _context$locals.env;
    const handler = makeGenericAPIRouteHandler({
      ..._config,
      clientId: (_ref = (_config$clientId = _config.clientId) !== null && _config$clientId !== void 0 ? _config$clientId : envVarsForCf === null || envVarsForCf === void 0 ? void 0 : envVarsForCf.KEYSTATIC_GITHUB_CLIENT_ID) !== null && _ref !== void 0 ? _ref : tryOrUndefined(() => {
        return "Iv23liMIgc557nhlcJru";
      }),
      clientSecret: (_ref2 = (_config$clientSecret = _config.clientSecret) !== null && _config$clientSecret !== void 0 ? _config$clientSecret : envVarsForCf === null || envVarsForCf === void 0 ? void 0 : envVarsForCf.KEYSTATIC_GITHUB_CLIENT_SECRET) !== null && _ref2 !== void 0 ? _ref2 : tryOrUndefined(() => {
        return "84ca8f29c32b8b0aeaff58d990d9f29251f109ed";
      }),
      secret: (_ref3 = (_config$secret = _config.secret) !== null && _config$secret !== void 0 ? _config$secret : envVarsForCf === null || envVarsForCf === void 0 ? void 0 : envVarsForCf.KEYSTATIC_SECRET) !== null && _ref3 !== void 0 ? _ref3 : tryOrUndefined(() => {
        return "kei93kfls820485kg4tgdsdfr47";
      })
    }, {
      slugEnvName: "PUBLIC_KEYSTATIC_GITHUB_APP_SLUG"
    });
    const {
      body,
      headers,
      status
    } = await handler(context.request);
    let headersInADifferentStructure = /* @__PURE__ */ new Map();
    if (headers) {
      if (Array.isArray(headers)) {
        for (const [key, value] of headers) {
          if (!headersInADifferentStructure.has(key.toLowerCase())) {
            headersInADifferentStructure.set(key.toLowerCase(), []);
          }
          headersInADifferentStructure.get(key.toLowerCase()).push(value);
        }
      } else if (typeof headers.entries === "function") {
        for (const [key, value] of headers.entries()) {
          headersInADifferentStructure.set(key.toLowerCase(), [value]);
        }
        if ("getSetCookie" in headers && typeof headers.getSetCookie === "function") {
          const setCookieHeaders2 = headers.getSetCookie();
          if (setCookieHeaders2 !== null && setCookieHeaders2 !== void 0 && setCookieHeaders2.length) {
            headersInADifferentStructure.set("set-cookie", setCookieHeaders2);
          }
        }
      } else {
        for (const [key, value] of Object.entries(headers)) {
          headersInADifferentStructure.set(key.toLowerCase(), [value]);
        }
      }
    }
    const setCookieHeaders = headersInADifferentStructure.get("set-cookie");
    headersInADifferentStructure.delete("set-cookie");
    if (setCookieHeaders) {
      for (const setCookieValue of setCookieHeaders) {
        var _options$sameSite;
        const {
          name,
          value,
          ...options
        } = setCookieExports.parseString(setCookieValue);
        const sameSite = (_options$sameSite = options.sameSite) === null || _options$sameSite === void 0 ? void 0 : _options$sameSite.toLowerCase();
        context.cookies.set(name, value, {
          domain: options.domain,
          expires: options.expires,
          httpOnly: options.httpOnly,
          maxAge: options.maxAge,
          path: options.path,
          sameSite: sameSite === "lax" || sameSite === "strict" || sameSite === "none" ? sameSite : void 0
        });
      }
    }
    return new Response(body, {
      status,
      headers: [...headersInADifferentStructure.entries()].flatMap(([key, val]) => val.map((x) => [key, x]))
    });
  };
}
function tryOrUndefined(fn) {
  try {
    return fn();
  } catch {
    return void 0;
  }
}

const config = config$1({
  storage: process.env.NODE_ENV === "production" ? {
    kind: "github",
    repo: process.env.PUBLIC_GITHUB_REPO || "wunluv/eosclub"
  } : {
    kind: "local"
  },
  collections: {
    pages: collection({
      label: "Pages",
      path: "src/content/pages/**",
      format: {
        data: "yaml",
        contentField: "content"
      },
      schema: {
        title: fields.text({ label: "Page Title" }),
        seoDescription: fields.text({ label: "SEO Description" }),
        ogImage: fields.image({
          label: "OG Image",
          directory: "public/assets",
          publicPath: "/assets/"
        }),
        translationSlug: fields.text({ label: "Translation Slug" }),
        content: fields.markdoc({ label: "Content", extension: "md" }),
        blocks: fields.blocks(
          {
            HeroBlock: {
              label: "Hero Block",
              schema: fields.object({
                name: fields.text({ label: "Section Name (internal reference)" }),
                headline: fields.text({ label: "Headline" }),
                variant: fields.select({
                  label: "Hero Layout Variant",
                  options: [
                    { value: "split-grid", label: "Split + Image Grid (Home)" },
                    { value: "cover", label: "Cover / Background Image" },
                    { value: "minimal", label: "Minimal (Text Only)" }
                  ],
                  defaultValue: "split-grid"
                }),
                subheadline: fields.text({ label: "Subheadline" }),
                subBodyText: fields.text({ label: "Sub-body Text" }),
                backgroundImage: fields.image({
                  label: "Background Image",
                  directory: "public/assets",
                  publicPath: "/assets/"
                }),
                logoOverlay: fields.image({
                  label: "Logo Overlay (Centered)",
                  directory: "public/assets",
                  publicPath: "/assets/"
                }),
                ctaLabel: fields.text({ label: "CTA Label" }),
                ctaUrl: fields.text({ label: "CTA URL" })
              })
            },
            ContentBlock: {
              label: "Content Block",
              schema: fields.object({
                name: fields.text({ label: "Section Name (internal reference)" }),
                body: fields.text({ label: "Body Content", multiline: true }),
                fullBleed: fields.checkbox({ label: "Full Bleed Layout" }),
                backgroundImage: fields.image({
                  label: "Background Image",
                  directory: "public/assets",
                  publicPath: "/assets/"
                })
              })
            },
            BookingBlock: {
              label: "Booking Block",
              schema: fields.object({
                name: fields.text({ label: "Section Name (internal reference)" }),
                enabled: fields.checkbox({ label: "Enabled" }),
                bookingUrl: fields.text({ label: "bsport Booking URL" }),
                label: fields.text({ label: "Section Label" })
              })
            },
            FeatureGridBlock: {
              label: "Feature Grid Block",
              schema: fields.object({
                name: fields.text({ label: "Section Name (internal reference)" }),
                items: fields.array(
                  fields.object({
                    icon: fields.text({ label: "Feather Icon Name" }),
                    title: fields.text({ label: "Title" }),
                    description: fields.text({ label: "Description" })
                  }),
                  {
                    label: "Features",
                    itemLabel: (props) => props.fields.title.value || "New Feature"
                  }
                )
              })
            },
            FullBleedBlock: {
              label: "Full Bleed Image Section",
              schema: fields.object({
                name: fields.text({ label: "Section Name (internal reference)" }),
                image: fields.image({
                  label: "Background Image",
                  directory: "public/assets",
                  publicPath: "/assets/"
                }),
                altText: fields.text({ label: "Alt Text" }),
                minHeight: fields.text({ label: "Min Height (Tailwind class, e.g. min-h-[50vh])" }),
                overlayOpacity: fields.text({ label: "Overlay Opacity (Tailwind class, e.g. opacity-50)" }),
                headline: fields.text({ label: "Headline (optional overlay text)" }),
                subtext: fields.text({ label: "Subtext (optional overlay text)" })
              })
            },
            InteractiveListBlock: {
              label: "Interactive List with Image Hover",
              schema: fields.object({
                name: fields.text({ label: "Section Name (internal reference)" }),
                title: fields.text({ label: "Section Title" }),
                items: fields.array(
                  fields.object({
                    label: fields.text({ label: "Label" }),
                    description: fields.text({ label: "Description" }),
                    image: fields.image({
                      label: "Hover Image",
                      directory: "public/assets",
                      publicPath: "/assets/"
                    }),
                    imageAlt: fields.text({ label: "Image Alt Text" })
                  }),
                  {
                    label: "List Items",
                    itemLabel: (props) => props.fields.label.value || "New Item"
                  }
                )
              })
            },
            FaqBlock: {
              label: "FAQ Accordion",
              schema: fields.object({
                name: fields.text({ label: "Section Name (internal reference)" }),
                title: fields.text({ label: "Section Title" }),
                questions: fields.array(
                  fields.object({
                    question: fields.text({ label: "Question" }),
                    answer: fields.text({ label: "Answer", multiline: true })
                  }),
                  {
                    label: "Questions",
                    itemLabel: (props) => props.fields.question.value || "New Question"
                  }
                )
              })
            },
            BsportCalendar: {
              label: "bsport: Calendar",
              schema: fields.object({
                name: fields.text({ label: "Section Name (internal reference)" }),
                elementId: fields.text({ label: "Unique Element ID" })
              })
            },
            BsportPasses: {
              label: "bsport: Passes",
              schema: fields.object({
                name: fields.text({ label: "Section Name (internal reference)" }),
                elementId: fields.text({ label: "Unique Element ID" })
              })
            },
            BsportSubscription: {
              label: "bsport: Subscriptions",
              schema: fields.object({
                name: fields.text({ label: "Section Name (internal reference)" }),
                elementId: fields.text({ label: "Unique Element ID" })
              })
            }
          },
          { label: "Content Blocks" }
        )
      }
    })
  }
});

const all = makeHandler({ config });
const ALL = all;

const prerender = false;

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  ALL,
  all,
  prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
