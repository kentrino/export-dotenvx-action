import { createRequire } from "node:module";
import * as os$1 from "os";
import os, { EOL } from "os";
import * as crypto from "crypto";
import * as fs from "fs";
import { constants, promises } from "fs";
import "path";
import * as events from "events";
import { Buffer as Buffer$1 } from "node:buffer";
import "child_process";
import "timers";
import { readFile } from "node:fs/promises";
import path from "node:path";
var __commonJSMin = (cb, mod) => () => (mod || (cb((mod = { exports: {} }).exports, mod), cb = null), mod.exports);
var __require = /* #__PURE__ */ (() => createRequire(import.meta.url))();
//#endregion
//#region node_modules/.pnpm/@actions+core@3.0.1/node_modules/@actions/core/lib/utils.js
/**
* Sanitizes an input into a string so it can be passed into issueCommand safely
* @param input input to sanitize into a string
*/
function toCommandValue(input) {
	if (input === null || input === void 0) return "";
	else if (typeof input === "string" || input instanceof String) return input;
	return JSON.stringify(input);
}
/**
*
* @param annotationProperties
* @returns The command properties to send with the actual annotation command
* See IssueCommandProperties: https://github.com/actions/runner/blob/main/src/Runner.Worker/ActionCommandManager.cs#L646
*/
function toCommandProperties(annotationProperties) {
	if (!Object.keys(annotationProperties).length) return {};
	return {
		title: annotationProperties.title,
		file: annotationProperties.file,
		line: annotationProperties.startLine,
		endLine: annotationProperties.endLine,
		col: annotationProperties.startColumn,
		endColumn: annotationProperties.endColumn
	};
}
//#endregion
//#region node_modules/.pnpm/@actions+core@3.0.1/node_modules/@actions/core/lib/command.js
/**
* Issues a command to the GitHub Actions runner
*
* @param command - The command name to issue
* @param properties - Additional properties for the command (key-value pairs)
* @param message - The message to include with the command
* @remarks
* This function outputs a specially formatted string to stdout that the Actions
* runner interprets as a command. These commands can control workflow behavior,
* set outputs, create annotations, mask values, and more.
*
* Command Format:
*   ::name key=value,key=value::message
*
* @example
* ```typescript
* // Issue a warning annotation
* issueCommand('warning', {}, 'This is a warning message');
* // Output: ::warning::This is a warning message
*
* // Set an environment variable
* issueCommand('set-env', { name: 'MY_VAR' }, 'some value');
* // Output: ::set-env name=MY_VAR::some value
*
* // Add a secret mask
* issueCommand('add-mask', {}, 'secretValue123');
* // Output: ::add-mask::secretValue123
* ```
*
* @internal
* This is an internal utility function that powers the public API functions
* such as setSecret, warning, error, and exportVariable.
*/
function issueCommand(command, properties, message) {
	const cmd = new Command(command, properties, message);
	process.stdout.write(cmd.toString() + os$1.EOL);
}
const CMD_STRING = "::";
var Command = class {
	constructor(command, properties, message) {
		if (!command) command = "missing.command";
		this.command = command;
		this.properties = properties;
		this.message = message;
	}
	toString() {
		let cmdStr = CMD_STRING + this.command;
		if (this.properties && Object.keys(this.properties).length > 0) {
			cmdStr += " ";
			let first = true;
			for (const key in this.properties) if (this.properties.hasOwnProperty(key)) {
				const val = this.properties[key];
				if (val) {
					if (first) first = false;
					else cmdStr += ",";
					cmdStr += `${key}=${escapeProperty(val)}`;
				}
			}
		}
		cmdStr += `${CMD_STRING}${escapeData(this.message)}`;
		return cmdStr;
	}
};
function escapeData(s) {
	return toCommandValue(s).replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A");
}
function escapeProperty(s) {
	return toCommandValue(s).replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A").replace(/:/g, "%3A").replace(/,/g, "%2C");
}
//#endregion
//#region node_modules/.pnpm/@actions+core@3.0.1/node_modules/@actions/core/lib/file-command.js
function issueFileCommand(command, message) {
	const filePath = process.env[`GITHUB_${command}`];
	if (!filePath) throw new Error(`Unable to find environment variable for file command ${command}`);
	if (!fs.existsSync(filePath)) throw new Error(`Missing file at path: ${filePath}`);
	fs.appendFileSync(filePath, `${toCommandValue(message)}${os$1.EOL}`, { encoding: "utf8" });
}
function prepareKeyValueMessage(key, value) {
	const delimiter = `ghadelimiter_${crypto.randomUUID()}`;
	const convertedValue = toCommandValue(value);
	if (key.includes(delimiter)) throw new Error(`Unexpected input: name should not contain the delimiter "${delimiter}"`);
	if (convertedValue.includes(delimiter)) throw new Error(`Unexpected input: value should not contain the delimiter "${delimiter}"`);
	return `${key}<<${delimiter}${os$1.EOL}${convertedValue}${os$1.EOL}${delimiter}`;
}
//#endregion
//#region node_modules/.pnpm/tunnel@0.0.6/node_modules/tunnel/lib/tunnel.js
var require_tunnel$1 = /* @__PURE__ */ __commonJSMin(((exports) => {
	__require("net");
	__require("tls");
	var http$1 = __require("http");
	__require("https");
	var events$1 = __require("events");
	__require("assert");
	var util$2 = __require("util");
	function TunnelingAgent(options) {
		var self = this;
		self.options = options || {};
		self.proxyOptions = self.options.proxy || {};
		self.maxSockets = self.options.maxSockets || http$1.Agent.defaultMaxSockets;
		self.requests = [];
		self.sockets = [];
		self.on("free", function onFree(socket, host, port, localAddress) {
			var options = toOptions(host, port, localAddress);
			for (var i = 0, len = self.requests.length; i < len; ++i) {
				var pending = self.requests[i];
				if (pending.host === options.host && pending.port === options.port) {
					self.requests.splice(i, 1);
					pending.request.onSocket(socket);
					return;
				}
			}
			socket.destroy();
			self.removeSocket(socket);
		});
	}
	util$2.inherits(TunnelingAgent, events$1.EventEmitter);
	TunnelingAgent.prototype.addRequest = function addRequest(req, host, port, localAddress) {
		var self = this;
		var options = mergeOptions({ request: req }, self.options, toOptions(host, port, localAddress));
		if (self.sockets.length >= this.maxSockets) {
			self.requests.push(options);
			return;
		}
		self.createSocket(options, function(socket) {
			socket.on("free", onFree);
			socket.on("close", onCloseOrRemove);
			socket.on("agentRemove", onCloseOrRemove);
			req.onSocket(socket);
			function onFree() {
				self.emit("free", socket, options);
			}
			function onCloseOrRemove(err) {
				self.removeSocket(socket);
				socket.removeListener("free", onFree);
				socket.removeListener("close", onCloseOrRemove);
				socket.removeListener("agentRemove", onCloseOrRemove);
			}
		});
	};
	TunnelingAgent.prototype.createSocket = function createSocket(options, cb) {
		var self = this;
		var placeholder = {};
		self.sockets.push(placeholder);
		var connectOptions = mergeOptions({}, self.proxyOptions, {
			method: "CONNECT",
			path: options.host + ":" + options.port,
			agent: false,
			headers: { host: options.host + ":" + options.port }
		});
		if (options.localAddress) connectOptions.localAddress = options.localAddress;
		if (connectOptions.proxyAuth) {
			connectOptions.headers = connectOptions.headers || {};
			connectOptions.headers["Proxy-Authorization"] = "Basic " + new Buffer(connectOptions.proxyAuth).toString("base64");
		}
		debug("making CONNECT request");
		var connectReq = self.request(connectOptions);
		connectReq.useChunkedEncodingByDefault = false;
		connectReq.once("response", onResponse);
		connectReq.once("upgrade", onUpgrade);
		connectReq.once("connect", onConnect);
		connectReq.once("error", onError);
		connectReq.end();
		function onResponse(res) {
			res.upgrade = true;
		}
		function onUpgrade(res, socket, head) {
			process.nextTick(function() {
				onConnect(res, socket, head);
			});
		}
		function onConnect(res, socket, head) {
			connectReq.removeAllListeners();
			socket.removeAllListeners();
			if (res.statusCode !== 200) {
				debug("tunneling socket could not be established, statusCode=%d", res.statusCode);
				socket.destroy();
				var error = /* @__PURE__ */ new Error("tunneling socket could not be established, statusCode=" + res.statusCode);
				error.code = "ECONNRESET";
				options.request.emit("error", error);
				self.removeSocket(placeholder);
				return;
			}
			if (head.length > 0) {
				debug("got illegal response body from proxy");
				socket.destroy();
				var error = /* @__PURE__ */ new Error("got illegal response body from proxy");
				error.code = "ECONNRESET";
				options.request.emit("error", error);
				self.removeSocket(placeholder);
				return;
			}
			debug("tunneling connection has established");
			self.sockets[self.sockets.indexOf(placeholder)] = socket;
			return cb(socket);
		}
		function onError(cause) {
			connectReq.removeAllListeners();
			debug("tunneling socket could not be established, cause=%s\n", cause.message, cause.stack);
			var error = /* @__PURE__ */ new Error("tunneling socket could not be established, cause=" + cause.message);
			error.code = "ECONNRESET";
			options.request.emit("error", error);
			self.removeSocket(placeholder);
		}
	};
	TunnelingAgent.prototype.removeSocket = function removeSocket(socket) {
		var pos = this.sockets.indexOf(socket);
		if (pos === -1) return;
		this.sockets.splice(pos, 1);
		var pending = this.requests.shift();
		if (pending) this.createSocket(pending, function(socket) {
			pending.request.onSocket(socket);
		});
	};
	function toOptions(host, port, localAddress) {
		if (typeof host === "string") return {
			host,
			port,
			localAddress
		};
		return host;
	}
	function mergeOptions(target) {
		for (var i = 1, len = arguments.length; i < len; ++i) {
			var overrides = arguments[i];
			if (typeof overrides === "object") {
				var keys = Object.keys(overrides);
				for (var j = 0, keyLen = keys.length; j < keyLen; ++j) {
					var k = keys[j];
					if (overrides[k] !== void 0) target[k] = overrides[k];
				}
			}
		}
		return target;
	}
	var debug;
	if (process.env.NODE_DEBUG && /\btunnel\b/.test(process.env.NODE_DEBUG)) debug = function() {
		var args = Array.prototype.slice.call(arguments);
		if (typeof args[0] === "string") args[0] = "TUNNEL: " + args[0];
		else args.unshift("TUNNEL:");
		console.error.apply(console, args);
	};
	else debug = function() {};
}));
//#endregion
//#region node_modules/.pnpm/tunnel@0.0.6/node_modules/tunnel/index.js
var require_tunnel = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = require_tunnel$1();
}));
//#endregion
//#region node_modules/.pnpm/undici@6.28.0/node_modules/undici/lib/core/symbols.js
var require_symbols$4 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = {
		kClose: Symbol("close"),
		kDestroy: Symbol("destroy"),
		kDispatch: Symbol("dispatch"),
		kUrl: Symbol("url"),
		kWriting: Symbol("writing"),
		kResuming: Symbol("resuming"),
		kQueue: Symbol("queue"),
		kConnect: Symbol("connect"),
		kConnecting: Symbol("connecting"),
		kKeepAliveDefaultTimeout: Symbol("default keep alive timeout"),
		kKeepAliveMaxTimeout: Symbol("max keep alive timeout"),
		kKeepAliveTimeoutThreshold: Symbol("keep alive timeout threshold"),
		kKeepAliveTimeoutValue: Symbol("keep alive timeout"),
		kKeepAlive: Symbol("keep alive"),
		kHeadersTimeout: Symbol("headers timeout"),
		kBodyTimeout: Symbol("body timeout"),
		kServerName: Symbol("server name"),
		kLocalAddress: Symbol("local address"),
		kHost: Symbol("host"),
		kNoRef: Symbol("no ref"),
		kBodyUsed: Symbol("used"),
		kBody: Symbol("abstracted request body"),
		kRunning: Symbol("running"),
		kBlocking: Symbol("blocking"),
		kPending: Symbol("pending"),
		kSize: Symbol("size"),
		kBusy: Symbol("busy"),
		kQueued: Symbol("queued"),
		kFree: Symbol("free"),
		kConnected: Symbol("connected"),
		kClosed: Symbol("closed"),
		kNeedDrain: Symbol("need drain"),
		kReset: Symbol("reset"),
		kDestroyed: Symbol.for("nodejs.stream.destroyed"),
		kResume: Symbol("resume"),
		kOnError: Symbol("on error"),
		kMaxHeadersSize: Symbol("max headers size"),
		kRunningIdx: Symbol("running index"),
		kPendingIdx: Symbol("pending index"),
		kError: Symbol("error"),
		kClients: Symbol("clients"),
		kClient: Symbol("client"),
		kParser: Symbol("parser"),
		kOnDestroyed: Symbol("destroy callbacks"),
		kPipelining: Symbol("pipelining"),
		kSocket: Symbol("socket"),
		kHostHeader: Symbol("host header"),
		kConnector: Symbol("connector"),
		kStrictContentLength: Symbol("strict content length"),
		kMaxRedirections: Symbol("maxRedirections"),
		kMaxRequests: Symbol("maxRequestsPerClient"),
		kProxy: Symbol("proxy agent options"),
		kCounter: Symbol("socket request counter"),
		kInterceptors: Symbol("dispatch interceptors"),
		kMaxResponseSize: Symbol("max response size"),
		kHTTP2Session: Symbol("http2Session"),
		kHTTP2SessionState: Symbol("http2Session state"),
		kRetryHandlerDefaultRetry: Symbol("retry agent default retry"),
		kConstruct: Symbol("constructable"),
		kListeners: Symbol("listeners"),
		kHTTPContext: Symbol("http context"),
		kMaxConcurrentStreams: Symbol("max concurrent streams"),
		kNoProxyAgent: Symbol("no proxy agent"),
		kHttpProxyAgent: Symbol("http proxy agent"),
		kHttpsProxyAgent: Symbol("https proxy agent")
	};
}));
//#endregion
//#region node_modules/.pnpm/undici@6.28.0/node_modules/undici/lib/core/errors.js
var require_errors = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const kUndiciError = Symbol.for("undici.error.UND_ERR");
	var UndiciError = class extends Error {
		constructor(message) {
			super(message);
			this.name = "UndiciError";
			this.code = "UND_ERR";
		}
		static [Symbol.hasInstance](instance) {
			return instance && instance[kUndiciError] === true;
		}
		[kUndiciError] = true;
	};
	const kConnectTimeoutError = Symbol.for("undici.error.UND_ERR_CONNECT_TIMEOUT");
	var ConnectTimeoutError = class extends UndiciError {
		constructor(message) {
			super(message);
			this.name = "ConnectTimeoutError";
			this.message = message || "Connect Timeout Error";
			this.code = "UND_ERR_CONNECT_TIMEOUT";
		}
		static [Symbol.hasInstance](instance) {
			return instance && instance[kConnectTimeoutError] === true;
		}
		[kConnectTimeoutError] = true;
	};
	const kHeadersTimeoutError = Symbol.for("undici.error.UND_ERR_HEADERS_TIMEOUT");
	var HeadersTimeoutError = class extends UndiciError {
		constructor(message) {
			super(message);
			this.name = "HeadersTimeoutError";
			this.message = message || "Headers Timeout Error";
			this.code = "UND_ERR_HEADERS_TIMEOUT";
		}
		static [Symbol.hasInstance](instance) {
			return instance && instance[kHeadersTimeoutError] === true;
		}
		[kHeadersTimeoutError] = true;
	};
	const kHeadersOverflowError = Symbol.for("undici.error.UND_ERR_HEADERS_OVERFLOW");
	var HeadersOverflowError = class extends UndiciError {
		constructor(message) {
			super(message);
			this.name = "HeadersOverflowError";
			this.message = message || "Headers Overflow Error";
			this.code = "UND_ERR_HEADERS_OVERFLOW";
		}
		static [Symbol.hasInstance](instance) {
			return instance && instance[kHeadersOverflowError] === true;
		}
		[kHeadersOverflowError] = true;
	};
	const kBodyTimeoutError = Symbol.for("undici.error.UND_ERR_BODY_TIMEOUT");
	var BodyTimeoutError = class extends UndiciError {
		constructor(message) {
			super(message);
			this.name = "BodyTimeoutError";
			this.message = message || "Body Timeout Error";
			this.code = "UND_ERR_BODY_TIMEOUT";
		}
		static [Symbol.hasInstance](instance) {
			return instance && instance[kBodyTimeoutError] === true;
		}
		[kBodyTimeoutError] = true;
	};
	const kResponseStatusCodeError = Symbol.for("undici.error.UND_ERR_RESPONSE_STATUS_CODE");
	var ResponseStatusCodeError = class extends UndiciError {
		constructor(message, statusCode, headers, body) {
			super(message);
			this.name = "ResponseStatusCodeError";
			this.message = message || "Response Status Code Error";
			this.code = "UND_ERR_RESPONSE_STATUS_CODE";
			this.body = body;
			this.status = statusCode;
			this.statusCode = statusCode;
			this.headers = headers;
		}
		static [Symbol.hasInstance](instance) {
			return instance && instance[kResponseStatusCodeError] === true;
		}
		[kResponseStatusCodeError] = true;
	};
	const kInvalidArgumentError = Symbol.for("undici.error.UND_ERR_INVALID_ARG");
	var InvalidArgumentError = class extends UndiciError {
		constructor(message) {
			super(message);
			this.name = "InvalidArgumentError";
			this.message = message || "Invalid Argument Error";
			this.code = "UND_ERR_INVALID_ARG";
		}
		static [Symbol.hasInstance](instance) {
			return instance && instance[kInvalidArgumentError] === true;
		}
		[kInvalidArgumentError] = true;
	};
	const kInvalidReturnValueError = Symbol.for("undici.error.UND_ERR_INVALID_RETURN_VALUE");
	var InvalidReturnValueError = class extends UndiciError {
		constructor(message) {
			super(message);
			this.name = "InvalidReturnValueError";
			this.message = message || "Invalid Return Value Error";
			this.code = "UND_ERR_INVALID_RETURN_VALUE";
		}
		static [Symbol.hasInstance](instance) {
			return instance && instance[kInvalidReturnValueError] === true;
		}
		[kInvalidReturnValueError] = true;
	};
	const kAbortError = Symbol.for("undici.error.UND_ERR_ABORT");
	var AbortError = class extends UndiciError {
		constructor(message) {
			super(message);
			this.name = "AbortError";
			this.message = message || "The operation was aborted";
			this.code = "UND_ERR_ABORT";
		}
		static [Symbol.hasInstance](instance) {
			return instance && instance[kAbortError] === true;
		}
		[kAbortError] = true;
	};
	const kRequestAbortedError = Symbol.for("undici.error.UND_ERR_ABORTED");
	var RequestAbortedError = class extends AbortError {
		constructor(message) {
			super(message);
			this.name = "AbortError";
			this.message = message || "Request aborted";
			this.code = "UND_ERR_ABORTED";
		}
		static [Symbol.hasInstance](instance) {
			return instance && instance[kRequestAbortedError] === true;
		}
		[kRequestAbortedError] = true;
	};
	const kInformationalError = Symbol.for("undici.error.UND_ERR_INFO");
	var InformationalError = class extends UndiciError {
		constructor(message) {
			super(message);
			this.name = "InformationalError";
			this.message = message || "Request information";
			this.code = "UND_ERR_INFO";
		}
		static [Symbol.hasInstance](instance) {
			return instance && instance[kInformationalError] === true;
		}
		[kInformationalError] = true;
	};
	const kRequestContentLengthMismatchError = Symbol.for("undici.error.UND_ERR_REQ_CONTENT_LENGTH_MISMATCH");
	var RequestContentLengthMismatchError = class extends UndiciError {
		constructor(message) {
			super(message);
			this.name = "RequestContentLengthMismatchError";
			this.message = message || "Request body length does not match content-length header";
			this.code = "UND_ERR_REQ_CONTENT_LENGTH_MISMATCH";
		}
		static [Symbol.hasInstance](instance) {
			return instance && instance[kRequestContentLengthMismatchError] === true;
		}
		[kRequestContentLengthMismatchError] = true;
	};
	const kResponseContentLengthMismatchError = Symbol.for("undici.error.UND_ERR_RES_CONTENT_LENGTH_MISMATCH");
	var ResponseContentLengthMismatchError = class extends UndiciError {
		constructor(message) {
			super(message);
			this.name = "ResponseContentLengthMismatchError";
			this.message = message || "Response body length does not match content-length header";
			this.code = "UND_ERR_RES_CONTENT_LENGTH_MISMATCH";
		}
		static [Symbol.hasInstance](instance) {
			return instance && instance[kResponseContentLengthMismatchError] === true;
		}
		[kResponseContentLengthMismatchError] = true;
	};
	const kClientDestroyedError = Symbol.for("undici.error.UND_ERR_DESTROYED");
	var ClientDestroyedError = class extends UndiciError {
		constructor(message) {
			super(message);
			this.name = "ClientDestroyedError";
			this.message = message || "The client is destroyed";
			this.code = "UND_ERR_DESTROYED";
		}
		static [Symbol.hasInstance](instance) {
			return instance && instance[kClientDestroyedError] === true;
		}
		[kClientDestroyedError] = true;
	};
	const kClientClosedError = Symbol.for("undici.error.UND_ERR_CLOSED");
	var ClientClosedError = class extends UndiciError {
		constructor(message) {
			super(message);
			this.name = "ClientClosedError";
			this.message = message || "The client is closed";
			this.code = "UND_ERR_CLOSED";
		}
		static [Symbol.hasInstance](instance) {
			return instance && instance[kClientClosedError] === true;
		}
		[kClientClosedError] = true;
	};
	const kSocketError = Symbol.for("undici.error.UND_ERR_SOCKET");
	var SocketError = class extends UndiciError {
		constructor(message, socket) {
			super(message);
			this.name = "SocketError";
			this.message = message || "Socket error";
			this.code = "UND_ERR_SOCKET";
			this.socket = socket;
		}
		static [Symbol.hasInstance](instance) {
			return instance && instance[kSocketError] === true;
		}
		[kSocketError] = true;
	};
	const kNotSupportedError = Symbol.for("undici.error.UND_ERR_NOT_SUPPORTED");
	var NotSupportedError = class extends UndiciError {
		constructor(message) {
			super(message);
			this.name = "NotSupportedError";
			this.message = message || "Not supported error";
			this.code = "UND_ERR_NOT_SUPPORTED";
		}
		static [Symbol.hasInstance](instance) {
			return instance && instance[kNotSupportedError] === true;
		}
		[kNotSupportedError] = true;
	};
	const kBalancedPoolMissingUpstreamError = Symbol.for("undici.error.UND_ERR_BPL_MISSING_UPSTREAM");
	var BalancedPoolMissingUpstreamError = class extends UndiciError {
		constructor(message) {
			super(message);
			this.name = "MissingUpstreamError";
			this.message = message || "No upstream has been added to the BalancedPool";
			this.code = "UND_ERR_BPL_MISSING_UPSTREAM";
		}
		static [Symbol.hasInstance](instance) {
			return instance && instance[kBalancedPoolMissingUpstreamError] === true;
		}
		[kBalancedPoolMissingUpstreamError] = true;
	};
	const kHTTPParserError = Symbol.for("undici.error.UND_ERR_HTTP_PARSER");
	var HTTPParserError = class extends Error {
		constructor(message, code, data) {
			super(message);
			this.name = "HTTPParserError";
			this.code = code ? `HPE_${code}` : void 0;
			this.data = data ? data.toString() : void 0;
		}
		static [Symbol.hasInstance](instance) {
			return instance && instance[kHTTPParserError] === true;
		}
		[kHTTPParserError] = true;
	};
	const kResponseExceededMaxSizeError = Symbol.for("undici.error.UND_ERR_RES_EXCEEDED_MAX_SIZE");
	var ResponseExceededMaxSizeError = class extends UndiciError {
		constructor(message) {
			super(message);
			this.name = "ResponseExceededMaxSizeError";
			this.message = message || "Response content exceeded max size";
			this.code = "UND_ERR_RES_EXCEEDED_MAX_SIZE";
		}
		static [Symbol.hasInstance](instance) {
			return instance && instance[kResponseExceededMaxSizeError] === true;
		}
		[kResponseExceededMaxSizeError] = true;
	};
	const kRequestRetryError = Symbol.for("undici.error.UND_ERR_REQ_RETRY");
	var RequestRetryError = class extends UndiciError {
		constructor(message, code, { headers, data }) {
			super(message);
			this.name = "RequestRetryError";
			this.message = message || "Request retry error";
			this.code = "UND_ERR_REQ_RETRY";
			this.statusCode = code;
			this.data = data;
			this.headers = headers;
		}
		static [Symbol.hasInstance](instance) {
			return instance && instance[kRequestRetryError] === true;
		}
		[kRequestRetryError] = true;
	};
	const kResponseError = Symbol.for("undici.error.UND_ERR_RESPONSE");
	var ResponseError = class extends UndiciError {
		constructor(message, code, { headers, data }) {
			super(message);
			this.name = "ResponseError";
			this.message = message || "Response error";
			this.code = "UND_ERR_RESPONSE";
			this.statusCode = code;
			this.data = data;
			this.headers = headers;
		}
		static [Symbol.hasInstance](instance) {
			return instance && instance[kResponseError] === true;
		}
		[kResponseError] = true;
	};
	const kSecureProxyConnectionError = Symbol.for("undici.error.UND_ERR_PRX_TLS");
	var SecureProxyConnectionError = class extends UndiciError {
		constructor(cause, message, options) {
			super(message, {
				cause,
				...options ?? {}
			});
			this.name = "SecureProxyConnectionError";
			this.message = message || "Secure Proxy Connection failed";
			this.code = "UND_ERR_PRX_TLS";
			this.cause = cause;
		}
		static [Symbol.hasInstance](instance) {
			return instance && instance[kSecureProxyConnectionError] === true;
		}
		[kSecureProxyConnectionError] = true;
	};
	const kMessageSizeExceededError = Symbol.for("undici.error.UND_ERR_WS_MESSAGE_SIZE_EXCEEDED");
	var MessageSizeExceededError = class extends UndiciError {
		constructor(message) {
			super(message);
			this.name = "MessageSizeExceededError";
			this.message = message || "Max decompressed message size exceeded";
			this.code = "UND_ERR_WS_MESSAGE_SIZE_EXCEEDED";
		}
		static [Symbol.hasInstance](instance) {
			return instance && instance[kMessageSizeExceededError] === true;
		}
		get [kMessageSizeExceededError]() {
			return true;
		}
	};
	module.exports = {
		AbortError,
		HTTPParserError,
		UndiciError,
		HeadersTimeoutError,
		HeadersOverflowError,
		BodyTimeoutError,
		RequestContentLengthMismatchError,
		ConnectTimeoutError,
		ResponseStatusCodeError,
		InvalidArgumentError,
		InvalidReturnValueError,
		RequestAbortedError,
		ClientDestroyedError,
		ClientClosedError,
		InformationalError,
		SocketError,
		NotSupportedError,
		ResponseContentLengthMismatchError,
		BalancedPoolMissingUpstreamError,
		ResponseExceededMaxSizeError,
		RequestRetryError,
		ResponseError,
		SecureProxyConnectionError,
		MessageSizeExceededError
	};
}));
//#endregion
//#region node_modules/.pnpm/undici@6.28.0/node_modules/undici/lib/core/constants.js
var require_constants$4 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/** @type {Record<string, string | undefined>} */
	const headerNameLowerCasedRecord = {};
	const wellknownHeaderNames = [
		"Accept",
		"Accept-Encoding",
		"Accept-Language",
		"Accept-Ranges",
		"Access-Control-Allow-Credentials",
		"Access-Control-Allow-Headers",
		"Access-Control-Allow-Methods",
		"Access-Control-Allow-Origin",
		"Access-Control-Expose-Headers",
		"Access-Control-Max-Age",
		"Access-Control-Request-Headers",
		"Access-Control-Request-Method",
		"Age",
		"Allow",
		"Alt-Svc",
		"Alt-Used",
		"Authorization",
		"Cache-Control",
		"Clear-Site-Data",
		"Connection",
		"Content-Disposition",
		"Content-Encoding",
		"Content-Language",
		"Content-Length",
		"Content-Location",
		"Content-Range",
		"Content-Security-Policy",
		"Content-Security-Policy-Report-Only",
		"Content-Type",
		"Cookie",
		"Cross-Origin-Embedder-Policy",
		"Cross-Origin-Opener-Policy",
		"Cross-Origin-Resource-Policy",
		"Date",
		"Device-Memory",
		"Downlink",
		"ECT",
		"ETag",
		"Expect",
		"Expect-CT",
		"Expires",
		"Forwarded",
		"From",
		"Host",
		"If-Match",
		"If-Modified-Since",
		"If-None-Match",
		"If-Range",
		"If-Unmodified-Since",
		"Keep-Alive",
		"Last-Modified",
		"Link",
		"Location",
		"Max-Forwards",
		"Origin",
		"Permissions-Policy",
		"Pragma",
		"Proxy-Authenticate",
		"Proxy-Authorization",
		"RTT",
		"Range",
		"Referer",
		"Referrer-Policy",
		"Refresh",
		"Retry-After",
		"Sec-WebSocket-Accept",
		"Sec-WebSocket-Extensions",
		"Sec-WebSocket-Key",
		"Sec-WebSocket-Protocol",
		"Sec-WebSocket-Version",
		"Server",
		"Server-Timing",
		"Service-Worker-Allowed",
		"Service-Worker-Navigation-Preload",
		"Set-Cookie",
		"SourceMap",
		"Strict-Transport-Security",
		"Supports-Loading-Mode",
		"TE",
		"Timing-Allow-Origin",
		"Trailer",
		"Transfer-Encoding",
		"Upgrade",
		"Upgrade-Insecure-Requests",
		"User-Agent",
		"Vary",
		"Via",
		"WWW-Authenticate",
		"X-Content-Type-Options",
		"X-DNS-Prefetch-Control",
		"X-Frame-Options",
		"X-Permitted-Cross-Domain-Policies",
		"X-Powered-By",
		"X-Requested-With",
		"X-XSS-Protection"
	];
	for (let i = 0; i < wellknownHeaderNames.length; ++i) {
		const key = wellknownHeaderNames[i];
		const lowerCasedKey = key.toLowerCase();
		headerNameLowerCasedRecord[key] = headerNameLowerCasedRecord[lowerCasedKey] = lowerCasedKey;
	}
	Object.setPrototypeOf(headerNameLowerCasedRecord, null);
	module.exports = {
		wellknownHeaderNames,
		headerNameLowerCasedRecord
	};
}));
//#endregion
//#region node_modules/.pnpm/undici@6.28.0/node_modules/undici/lib/core/tree.js
var require_tree = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const { wellknownHeaderNames, headerNameLowerCasedRecord } = require_constants$4();
	var TstNode = class TstNode {
		/** @type {any} */
		value = null;
		/** @type {null | TstNode} */
		left = null;
		/** @type {null | TstNode} */
		middle = null;
		/** @type {null | TstNode} */
		right = null;
		/** @type {number} */
		code;
		/**
		* @param {string} key
		* @param {any} value
		* @param {number} index
		*/
		constructor(key, value, index) {
			if (index === void 0 || index >= key.length) throw new TypeError("Unreachable");
			if ((this.code = key.charCodeAt(index)) > 127) throw new TypeError("key must be ascii string");
			if (key.length !== ++index) this.middle = new TstNode(key, value, index);
			else this.value = value;
		}
		/**
		* @param {string} key
		* @param {any} value
		*/
		add(key, value) {
			const length = key.length;
			if (length === 0) throw new TypeError("Unreachable");
			let index = 0;
			let node = this;
			while (true) {
				const code = key.charCodeAt(index);
				if (code > 127) throw new TypeError("key must be ascii string");
				if (node.code === code) if (length === ++index) {
					node.value = value;
					break;
				} else if (node.middle !== null) node = node.middle;
				else {
					node.middle = new TstNode(key, value, index);
					break;
				}
				else if (node.code < code) if (node.left !== null) node = node.left;
				else {
					node.left = new TstNode(key, value, index);
					break;
				}
				else if (node.right !== null) node = node.right;
				else {
					node.right = new TstNode(key, value, index);
					break;
				}
			}
		}
		/**
		* @param {Uint8Array} key
		* @return {TstNode | null}
		*/
		search(key) {
			const keylength = key.length;
			let index = 0;
			let node = this;
			while (node !== null && index < keylength) {
				let code = key[index];
				if (code <= 90 && code >= 65) code |= 32;
				while (node !== null) {
					if (code === node.code) {
						if (keylength === ++index) return node;
						node = node.middle;
						break;
					}
					node = node.code < code ? node.left : node.right;
				}
			}
			return null;
		}
	};
	var TernarySearchTree = class {
		/** @type {TstNode | null} */
		node = null;
		/**
		* @param {string} key
		* @param {any} value
		* */
		insert(key, value) {
			if (this.node === null) this.node = new TstNode(key, value, 0);
			else this.node.add(key, value);
		}
		/**
		* @param {Uint8Array} key
		* @return {any}
		*/
		lookup(key) {
			return this.node?.search(key)?.value ?? null;
		}
	};
	const tree = new TernarySearchTree();
	for (let i = 0; i < wellknownHeaderNames.length; ++i) {
		const key = headerNameLowerCasedRecord[wellknownHeaderNames[i]];
		tree.insert(key, key);
	}
	module.exports = {
		TernarySearchTree,
		tree
	};
}));
//#endregion
//#region node_modules/.pnpm/undici@6.28.0/node_modules/undici/lib/core/util.js
var require_util$7 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const assert$26 = __require("node:assert");
	const { kDestroyed, kBodyUsed, kListeners, kBody } = require_symbols$4();
	const { IncomingMessage } = __require("node:http");
	const stream = __require("node:stream");
	const net$2 = __require("node:net");
	const { Blob: Blob$3 } = __require("node:buffer");
	const nodeUtil$3 = __require("node:util");
	const { stringify } = __require("node:querystring");
	const { EventEmitter: EE$2 } = __require("node:events");
	const { InvalidArgumentError } = require_errors();
	const { headerNameLowerCasedRecord } = require_constants$4();
	const { tree } = require_tree();
	const [nodeMajor, nodeMinor] = process.versions.node.split(".").map((v) => Number(v));
	var BodyAsyncIterable = class {
		constructor(body) {
			this[kBody] = body;
			this[kBodyUsed] = false;
		}
		async *[Symbol.asyncIterator]() {
			assert$26(!this[kBodyUsed], "disturbed");
			this[kBodyUsed] = true;
			yield* this[kBody];
		}
	};
	function wrapRequestBody(body) {
		if (isStream(body)) {
			if (bodyLength(body) === 0) body.on("data", function() {
				assert$26(false);
			});
			if (typeof body.readableDidRead !== "boolean") {
				body[kBodyUsed] = false;
				EE$2.prototype.on.call(body, "data", function() {
					this[kBodyUsed] = true;
				});
			}
			return body;
		} else if (body && typeof body.pipeTo === "function") return new BodyAsyncIterable(body);
		else if (body && typeof body !== "string" && !ArrayBuffer.isView(body) && isIterable(body)) return new BodyAsyncIterable(body);
		else return body;
	}
	function nop() {}
	function isStream(obj) {
		return obj && typeof obj === "object" && typeof obj.pipe === "function" && typeof obj.on === "function";
	}
	function isBlobLike(object) {
		if (object === null) return false;
		else if (object instanceof Blob$3) return true;
		else if (typeof object !== "object") return false;
		else {
			const sTag = object[Symbol.toStringTag];
			return (sTag === "Blob" || sTag === "File") && ("stream" in object && typeof object.stream === "function" || "arrayBuffer" in object && typeof object.arrayBuffer === "function");
		}
	}
	function buildURL(url, queryParams) {
		if (url.includes("?") || url.includes("#")) throw new Error("Query params cannot be passed when url already contains \"?\" or \"#\".");
		const stringified = stringify(queryParams);
		if (stringified) url += "?" + stringified;
		return url;
	}
	function isValidPort(port) {
		const value = parseInt(port, 10);
		return value === Number(port) && value >= 0 && value <= 65535;
	}
	function isHttpOrHttpsPrefixed(value) {
		return value != null && value[0] === "h" && value[1] === "t" && value[2] === "t" && value[3] === "p" && (value[4] === ":" || value[4] === "s" && value[5] === ":");
	}
	function parseURL(url) {
		if (typeof url === "string") {
			url = new URL(url);
			if (!isHttpOrHttpsPrefixed(url.origin || url.protocol)) throw new InvalidArgumentError("Invalid URL protocol: the URL must start with `http:` or `https:`.");
			return url;
		}
		if (!url || typeof url !== "object") throw new InvalidArgumentError("Invalid URL: The URL argument must be a non-null object.");
		if (!(url instanceof URL)) {
			if (url.port != null && url.port !== "" && isValidPort(url.port) === false) throw new InvalidArgumentError("Invalid URL: port must be a valid integer or a string representation of an integer.");
			if (url.path != null && typeof url.path !== "string") throw new InvalidArgumentError("Invalid URL path: the path must be a string or null/undefined.");
			if (url.pathname != null && typeof url.pathname !== "string") throw new InvalidArgumentError("Invalid URL pathname: the pathname must be a string or null/undefined.");
			if (url.hostname != null && typeof url.hostname !== "string") throw new InvalidArgumentError("Invalid URL hostname: the hostname must be a string or null/undefined.");
			if (url.origin != null && typeof url.origin !== "string") throw new InvalidArgumentError("Invalid URL origin: the origin must be a string or null/undefined.");
			if (!isHttpOrHttpsPrefixed(url.origin || url.protocol)) throw new InvalidArgumentError("Invalid URL protocol: the URL must start with `http:` or `https:`.");
			const port = url.port != null ? url.port : url.protocol === "https:" ? 443 : 80;
			let origin = url.origin != null ? url.origin : `${url.protocol || ""}//${url.hostname || ""}:${port}`;
			let path = url.path != null ? url.path : `${url.pathname || ""}${url.search || ""}`;
			if (origin[origin.length - 1] === "/") origin = origin.slice(0, origin.length - 1);
			if (path && path[0] !== "/") path = `/${path}`;
			return new URL(`${origin}${path}`);
		}
		if (!isHttpOrHttpsPrefixed(url.origin || url.protocol)) throw new InvalidArgumentError("Invalid URL protocol: the URL must start with `http:` or `https:`.");
		return url;
	}
	function parseOrigin(url) {
		url = parseURL(url);
		if (url.pathname !== "/" || url.search || url.hash) throw new InvalidArgumentError("invalid url");
		return url;
	}
	function getHostname(host) {
		if (host[0] === "[") {
			const idx = host.indexOf("]");
			assert$26(idx !== -1);
			return host.substring(1, idx);
		}
		const idx = host.indexOf(":");
		if (idx === -1) return host;
		return host.substring(0, idx);
	}
	function getServerName(host) {
		if (!host) return null;
		assert$26(typeof host === "string");
		const servername = getHostname(host);
		if (net$2.isIP(servername)) return "";
		return servername;
	}
	function deepClone(obj) {
		return JSON.parse(JSON.stringify(obj));
	}
	function isAsyncIterable(obj) {
		return !!(obj != null && typeof obj[Symbol.asyncIterator] === "function");
	}
	function isIterable(obj) {
		return !!(obj != null && (typeof obj[Symbol.iterator] === "function" || typeof obj[Symbol.asyncIterator] === "function"));
	}
	function bodyLength(body) {
		if (body == null) return 0;
		else if (isStream(body)) {
			const state = body._readableState;
			return state && state.objectMode === false && state.ended === true && Number.isFinite(state.length) ? state.length : null;
		} else if (isBlobLike(body)) return body.size != null ? body.size : null;
		else if (isBuffer(body)) return body.byteLength;
		return null;
	}
	function isDestroyed(body) {
		return body && !!(body.destroyed || body[kDestroyed] || stream.isDestroyed?.(body));
	}
	function destroy(stream, err) {
		if (stream == null || !isStream(stream) || isDestroyed(stream)) return;
		if (typeof stream.destroy === "function") {
			if (Object.getPrototypeOf(stream).constructor === IncomingMessage) stream.socket = null;
			stream.destroy(err);
		} else if (err) queueMicrotask(() => {
			stream.emit("error", err);
		});
		if (stream.destroyed !== true) stream[kDestroyed] = true;
	}
	const KEEPALIVE_TIMEOUT_EXPR = /timeout=(\d+)/;
	function parseKeepAliveTimeout(val) {
		const m = val.toString().match(KEEPALIVE_TIMEOUT_EXPR);
		return m ? parseInt(m[1], 10) * 1e3 : null;
	}
	/**
	* Retrieves a header name and returns its lowercase value.
	* @param {string | Buffer} value Header name
	* @returns {string}
	*/
	function headerNameToString(value) {
		return typeof value === "string" ? headerNameLowerCasedRecord[value] ?? value.toLowerCase() : tree.lookup(value) ?? value.toString("latin1").toLowerCase();
	}
	/**
	* Receive the buffer as a string and return its lowercase value.
	* @param {Buffer} value Header name
	* @returns {string}
	*/
	function bufferToLowerCasedHeaderName(value) {
		return tree.lookup(value) ?? value.toString("latin1").toLowerCase();
	}
	/**
	* @param {Record<string, string | string[]> | (Buffer | string | (Buffer | string)[])[]} headers
	* @param {Record<string, string | string[]>} [obj]
	* @returns {Record<string, string | string[]>}
	*/
	function parseHeaders(headers, obj) {
		if (obj === void 0) obj = {};
		for (let i = 0; i < headers.length; i += 2) {
			const key = headerNameToString(headers[i]);
			let val = obj[key];
			if (val) {
				if (typeof val === "string") {
					val = [val];
					obj[key] = val;
				}
				val.push(headers[i + 1].toString("utf8"));
			} else {
				const headersValue = headers[i + 1];
				if (typeof headersValue === "string") obj[key] = headersValue;
				else obj[key] = Array.isArray(headersValue) ? headersValue.map((x) => x.toString("utf8")) : headersValue.toString("utf8");
			}
		}
		if ("content-length" in obj && "content-disposition" in obj) obj["content-disposition"] = Buffer.from(obj["content-disposition"]).toString("latin1");
		return obj;
	}
	function parseRawHeaders(headers) {
		const len = headers.length;
		const ret = new Array(len);
		let hasContentLength = false;
		let contentDispositionIdx = -1;
		let key;
		let val;
		let kLen = 0;
		for (let n = 0; n < headers.length; n += 2) {
			key = headers[n];
			val = headers[n + 1];
			typeof key !== "string" && (key = key.toString());
			typeof val !== "string" && (val = val.toString("utf8"));
			kLen = key.length;
			if (kLen === 14 && key[7] === "-" && (key === "content-length" || key.toLowerCase() === "content-length")) hasContentLength = true;
			else if (kLen === 19 && key[7] === "-" && (key === "content-disposition" || key.toLowerCase() === "content-disposition")) contentDispositionIdx = n + 1;
			ret[n] = key;
			ret[n + 1] = val;
		}
		if (hasContentLength && contentDispositionIdx !== -1) ret[contentDispositionIdx] = Buffer.from(ret[contentDispositionIdx]).toString("latin1");
		return ret;
	}
	function isBuffer(buffer) {
		return buffer instanceof Uint8Array || Buffer.isBuffer(buffer);
	}
	function validateHandler(handler, method, upgrade) {
		if (!handler || typeof handler !== "object") throw new InvalidArgumentError("handler must be an object");
		if (typeof handler.onConnect !== "function") throw new InvalidArgumentError("invalid onConnect method");
		if (typeof handler.onError !== "function") throw new InvalidArgumentError("invalid onError method");
		if (typeof handler.onBodySent !== "function" && handler.onBodySent !== void 0) throw new InvalidArgumentError("invalid onBodySent method");
		if (upgrade || method === "CONNECT") {
			if (typeof handler.onUpgrade !== "function") throw new InvalidArgumentError("invalid onUpgrade method");
		} else {
			if (typeof handler.onHeaders !== "function") throw new InvalidArgumentError("invalid onHeaders method");
			if (typeof handler.onData !== "function") throw new InvalidArgumentError("invalid onData method");
			if (typeof handler.onComplete !== "function") throw new InvalidArgumentError("invalid onComplete method");
		}
	}
	function isDisturbed(body) {
		return !!(body && (stream.isDisturbed(body) || body[kBodyUsed]));
	}
	function isErrored(body) {
		return !!(body && stream.isErrored(body));
	}
	function isReadable(body) {
		return !!(body && stream.isReadable(body));
	}
	function getSocketInfo(socket) {
		return {
			localAddress: socket.localAddress,
			localPort: socket.localPort,
			remoteAddress: socket.remoteAddress,
			remotePort: socket.remotePort,
			remoteFamily: socket.remoteFamily,
			timeout: socket.timeout,
			bytesWritten: socket.bytesWritten,
			bytesRead: socket.bytesRead
		};
	}
	/** @type {globalThis['ReadableStream']} */
	function ReadableStreamFrom(iterable) {
		let iterator;
		return new ReadableStream({
			async start() {
				iterator = iterable[Symbol.asyncIterator]();
			},
			async pull(controller) {
				const { done, value } = await iterator.next();
				if (done) queueMicrotask(() => {
					controller.close();
					controller.byobRequest?.respond(0);
				});
				else {
					const buf = Buffer.isBuffer(value) ? value : Buffer.from(value);
					if (buf.byteLength) controller.enqueue(new Uint8Array(buf));
				}
				return controller.desiredSize > 0;
			},
			async cancel(reason) {
				await iterator.return();
			},
			type: "bytes"
		});
	}
	function isFormDataLike(object) {
		return object && typeof object === "object" && typeof object.append === "function" && typeof object.delete === "function" && typeof object.get === "function" && typeof object.getAll === "function" && typeof object.has === "function" && typeof object.set === "function" && object[Symbol.toStringTag] === "FormData";
	}
	function addAbortListener(signal, listener) {
		if ("addEventListener" in signal) {
			signal.addEventListener("abort", listener, { once: true });
			return () => signal.removeEventListener("abort", listener);
		}
		signal.addListener("abort", listener);
		return () => signal.removeListener("abort", listener);
	}
	const hasToWellFormed = typeof String.prototype.toWellFormed === "function";
	const hasIsWellFormed = typeof String.prototype.isWellFormed === "function";
	/**
	* @param {string} val
	*/
	function toUSVString(val) {
		return hasToWellFormed ? `${val}`.toWellFormed() : nodeUtil$3.toUSVString(val);
	}
	/**
	* @param {string} val
	*/
	function isUSVString(val) {
		return hasIsWellFormed ? `${val}`.isWellFormed() : toUSVString(val) === `${val}`;
	}
	/**
	* @see https://tools.ietf.org/html/rfc7230#section-3.2.6
	* @param {number} c
	*/
	function isTokenCharCode(c) {
		switch (c) {
			case 34:
			case 40:
			case 41:
			case 44:
			case 47:
			case 58:
			case 59:
			case 60:
			case 61:
			case 62:
			case 63:
			case 64:
			case 91:
			case 92:
			case 93:
			case 123:
			case 125: return false;
			default: return c >= 33 && c <= 126;
		}
	}
	/**
	* @param {string} characters
	*/
	function isValidHTTPToken(characters) {
		if (characters.length === 0) return false;
		for (let i = 0; i < characters.length; ++i) if (!isTokenCharCode(characters.charCodeAt(i))) return false;
		return true;
	}
	/**
	* Matches if val contains an invalid field-vchar
	*  field-value    = *( field-content / obs-fold )
	*  field-content  = field-vchar [ 1*( SP / HTAB ) field-vchar ]
	*  field-vchar    = VCHAR / obs-text
	*/
	const headerCharRegex = /[^\t\x20-\x7e\x80-\xff]/;
	/**
	* @param {string} characters
	*/
	function isValidHeaderValue(characters) {
		return !headerCharRegex.test(characters);
	}
	function parseRangeHeader(range) {
		if (range == null || range === "") return {
			start: 0,
			end: null,
			size: null
		};
		const m = range ? range.match(/^bytes (\d+)-(\d+)\/(\d+)?$/) : null;
		return m ? {
			start: parseInt(m[1]),
			end: m[2] ? parseInt(m[2]) : null,
			size: m[3] ? parseInt(m[3]) : null
		} : null;
	}
	function addListener(obj, name, listener) {
		(obj[kListeners] ??= []).push([name, listener]);
		obj.on(name, listener);
		return obj;
	}
	function removeAllListeners(obj) {
		for (const [name, listener] of obj[kListeners] ?? []) obj.removeListener(name, listener);
		obj[kListeners] = null;
	}
	function errorRequest(client, request, err) {
		try {
			request.onError(err);
			assert$26(request.aborted);
		} catch (err) {
			client.emit("error", err);
		}
	}
	const kEnumerableProperty = Object.create(null);
	kEnumerableProperty.enumerable = true;
	const normalizedMethodRecordsBase = {
		delete: "DELETE",
		DELETE: "DELETE",
		get: "GET",
		GET: "GET",
		head: "HEAD",
		HEAD: "HEAD",
		options: "OPTIONS",
		OPTIONS: "OPTIONS",
		post: "POST",
		POST: "POST",
		put: "PUT",
		PUT: "PUT"
	};
	const normalizedMethodRecords = {
		...normalizedMethodRecordsBase,
		patch: "patch",
		PATCH: "PATCH"
	};
	Object.setPrototypeOf(normalizedMethodRecordsBase, null);
	Object.setPrototypeOf(normalizedMethodRecords, null);
	module.exports = {
		kEnumerableProperty,
		nop,
		isDisturbed,
		isErrored,
		isReadable,
		toUSVString,
		isUSVString,
		isBlobLike,
		parseOrigin,
		parseURL,
		getServerName,
		isStream,
		isIterable,
		isAsyncIterable,
		isDestroyed,
		headerNameToString,
		bufferToLowerCasedHeaderName,
		addListener,
		removeAllListeners,
		errorRequest,
		parseRawHeaders,
		parseHeaders,
		parseKeepAliveTimeout,
		destroy,
		bodyLength,
		deepClone,
		ReadableStreamFrom,
		isBuffer,
		validateHandler,
		getSocketInfo,
		isFormDataLike,
		buildURL,
		addAbortListener,
		isValidHTTPToken,
		isValidHeaderValue,
		isTokenCharCode,
		parseRangeHeader,
		normalizedMethodRecordsBase,
		normalizedMethodRecords,
		isValidPort,
		isHttpOrHttpsPrefixed,
		nodeMajor,
		nodeMinor,
		safeHTTPMethods: [
			"GET",
			"HEAD",
			"OPTIONS",
			"TRACE"
		],
		wrapRequestBody
	};
}));
//#endregion
//#region node_modules/.pnpm/undici@6.28.0/node_modules/undici/lib/core/diagnostics.js
var require_diagnostics = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const diagnosticsChannel = __require("node:diagnostics_channel");
	const util$1 = __require("node:util");
	const undiciDebugLog = util$1.debuglog("undici");
	const fetchDebuglog = util$1.debuglog("fetch");
	const websocketDebuglog = util$1.debuglog("websocket");
	let isClientSet = false;
	const channels = {
		beforeConnect: diagnosticsChannel.channel("undici:client:beforeConnect"),
		connected: diagnosticsChannel.channel("undici:client:connected"),
		connectError: diagnosticsChannel.channel("undici:client:connectError"),
		sendHeaders: diagnosticsChannel.channel("undici:client:sendHeaders"),
		create: diagnosticsChannel.channel("undici:request:create"),
		bodySent: diagnosticsChannel.channel("undici:request:bodySent"),
		headers: diagnosticsChannel.channel("undici:request:headers"),
		trailers: diagnosticsChannel.channel("undici:request:trailers"),
		error: diagnosticsChannel.channel("undici:request:error"),
		open: diagnosticsChannel.channel("undici:websocket:open"),
		close: diagnosticsChannel.channel("undici:websocket:close"),
		socketError: diagnosticsChannel.channel("undici:websocket:socket_error"),
		ping: diagnosticsChannel.channel("undici:websocket:ping"),
		pong: diagnosticsChannel.channel("undici:websocket:pong")
	};
	if (undiciDebugLog.enabled || fetchDebuglog.enabled) {
		const debuglog = fetchDebuglog.enabled ? fetchDebuglog : undiciDebugLog;
		diagnosticsChannel.channel("undici:client:beforeConnect").subscribe((evt) => {
			const { connectParams: { version, protocol, port, host } } = evt;
			debuglog("connecting to %s using %s%s", `${host}${port ? `:${port}` : ""}`, protocol, version);
		});
		diagnosticsChannel.channel("undici:client:connected").subscribe((evt) => {
			const { connectParams: { version, protocol, port, host } } = evt;
			debuglog("connected to %s using %s%s", `${host}${port ? `:${port}` : ""}`, protocol, version);
		});
		diagnosticsChannel.channel("undici:client:connectError").subscribe((evt) => {
			const { connectParams: { version, protocol, port, host }, error } = evt;
			debuglog("connection to %s using %s%s errored - %s", `${host}${port ? `:${port}` : ""}`, protocol, version, error.message);
		});
		diagnosticsChannel.channel("undici:client:sendHeaders").subscribe((evt) => {
			const { request: { method, path, origin } } = evt;
			debuglog("sending request to %s %s/%s", method, origin, path);
		});
		diagnosticsChannel.channel("undici:request:headers").subscribe((evt) => {
			const { request: { method, path, origin }, response: { statusCode } } = evt;
			debuglog("received response to %s %s/%s - HTTP %d", method, origin, path, statusCode);
		});
		diagnosticsChannel.channel("undici:request:trailers").subscribe((evt) => {
			const { request: { method, path, origin } } = evt;
			debuglog("trailers received from %s %s/%s", method, origin, path);
		});
		diagnosticsChannel.channel("undici:request:error").subscribe((evt) => {
			const { request: { method, path, origin }, error } = evt;
			debuglog("request to %s %s/%s errored - %s", method, origin, path, error.message);
		});
		isClientSet = true;
	}
	if (websocketDebuglog.enabled) {
		if (!isClientSet) {
			const debuglog = undiciDebugLog.enabled ? undiciDebugLog : websocketDebuglog;
			diagnosticsChannel.channel("undici:client:beforeConnect").subscribe((evt) => {
				const { connectParams: { version, protocol, port, host } } = evt;
				debuglog("connecting to %s%s using %s%s", host, port ? `:${port}` : "", protocol, version);
			});
			diagnosticsChannel.channel("undici:client:connected").subscribe((evt) => {
				const { connectParams: { version, protocol, port, host } } = evt;
				debuglog("connected to %s%s using %s%s", host, port ? `:${port}` : "", protocol, version);
			});
			diagnosticsChannel.channel("undici:client:connectError").subscribe((evt) => {
				const { connectParams: { version, protocol, port, host }, error } = evt;
				debuglog("connection to %s%s using %s%s errored - %s", host, port ? `:${port}` : "", protocol, version, error.message);
			});
			diagnosticsChannel.channel("undici:client:sendHeaders").subscribe((evt) => {
				const { request: { method, path, origin } } = evt;
				debuglog("sending request to %s %s/%s", method, origin, path);
			});
		}
		diagnosticsChannel.channel("undici:websocket:open").subscribe((evt) => {
			const { address: { address, port } } = evt;
			websocketDebuglog("connection opened %s%s", address, port ? `:${port}` : "");
		});
		diagnosticsChannel.channel("undici:websocket:close").subscribe((evt) => {
			const { websocket, code, reason } = evt;
			websocketDebuglog("closed connection to %s - %s %s", websocket.url, code, reason);
		});
		diagnosticsChannel.channel("undici:websocket:socket_error").subscribe((err) => {
			websocketDebuglog("connection errored - %s", err.message);
		});
		diagnosticsChannel.channel("undici:websocket:ping").subscribe((evt) => {
			websocketDebuglog("ping received");
		});
		diagnosticsChannel.channel("undici:websocket:pong").subscribe((evt) => {
			websocketDebuglog("pong received");
		});
	}
	module.exports = { channels };
}));
//#endregion
//#region node_modules/.pnpm/undici@6.28.0/node_modules/undici/lib/core/request.js
var require_request$1 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const { InvalidArgumentError, NotSupportedError } = require_errors();
	const assert$25 = __require("node:assert");
	const { isValidHTTPToken, isValidHeaderValue, isStream, destroy, isBuffer, isFormDataLike, isIterable, isBlobLike, buildURL, validateHandler, getServerName, normalizedMethodRecords } = require_util$7();
	const { channels } = require_diagnostics();
	const { headerNameLowerCasedRecord } = require_constants$4();
	const invalidPathRegex = /[^\u0021-\u00ff]/;
	const kHandler = Symbol("handler");
	var Request = class {
		constructor(origin, { path, method, body, headers, query, idempotent, blocking, upgrade, headersTimeout, bodyTimeout, reset, throwOnError, expectContinue, servername }, handler) {
			if (typeof path !== "string") throw new InvalidArgumentError("path must be a string");
			else if (path[0] !== "/" && !(path.startsWith("http://") || path.startsWith("https://")) && method !== "CONNECT") throw new InvalidArgumentError("path must be an absolute URL or start with a slash");
			else if (invalidPathRegex.test(path)) throw new InvalidArgumentError("invalid request path");
			if (typeof method !== "string") throw new InvalidArgumentError("method must be a string");
			else if (normalizedMethodRecords[method] === void 0 && !isValidHTTPToken(method)) throw new InvalidArgumentError("invalid request method");
			if (upgrade && typeof upgrade !== "string") throw new InvalidArgumentError("upgrade must be a string");
			if (upgrade && !isValidHeaderValue(upgrade)) throw new InvalidArgumentError("invalid upgrade header");
			if (headersTimeout != null && (!Number.isFinite(headersTimeout) || headersTimeout < 0)) throw new InvalidArgumentError("invalid headersTimeout");
			if (bodyTimeout != null && (!Number.isFinite(bodyTimeout) || bodyTimeout < 0)) throw new InvalidArgumentError("invalid bodyTimeout");
			if (reset != null && typeof reset !== "boolean") throw new InvalidArgumentError("invalid reset");
			if (expectContinue != null && typeof expectContinue !== "boolean") throw new InvalidArgumentError("invalid expectContinue");
			this.headersTimeout = headersTimeout;
			this.bodyTimeout = bodyTimeout;
			this.throwOnError = throwOnError === true;
			this.method = method;
			this.abort = null;
			if (body == null) this.body = null;
			else if (isStream(body)) {
				this.body = body;
				const rState = this.body._readableState;
				if (!rState || !rState.autoDestroy) {
					this.endHandler = function autoDestroy() {
						destroy(this);
					};
					this.body.on("end", this.endHandler);
				}
				this.errorHandler = (err) => {
					if (this.abort) this.abort(err);
					else this.error = err;
				};
				this.body.on("error", this.errorHandler);
			} else if (isBuffer(body)) this.body = body.byteLength ? body : null;
			else if (ArrayBuffer.isView(body)) this.body = body.buffer.byteLength ? Buffer.from(body.buffer, body.byteOffset, body.byteLength) : null;
			else if (body instanceof ArrayBuffer) this.body = body.byteLength ? Buffer.from(body) : null;
			else if (typeof body === "string") this.body = body.length ? Buffer.from(body) : null;
			else if (isFormDataLike(body) || isIterable(body) || isBlobLike(body)) this.body = body;
			else throw new InvalidArgumentError("body must be a string, a Buffer, a Readable stream, an iterable, or an async iterable");
			this.completed = false;
			this.aborted = false;
			this.upgrade = upgrade || null;
			this.path = query ? buildURL(path, query) : path;
			this.origin = origin;
			this.idempotent = idempotent == null ? method === "HEAD" || method === "GET" : idempotent;
			this.blocking = blocking == null ? false : blocking;
			this.reset = reset == null ? null : reset;
			this.host = null;
			this.contentLength = null;
			this.contentType = null;
			this.headers = [];
			this.expectContinue = expectContinue != null ? expectContinue : false;
			if (Array.isArray(headers)) {
				if (headers.length % 2 !== 0) throw new InvalidArgumentError("headers array must be even");
				for (let i = 0; i < headers.length; i += 2) processHeader(this, headers[i], headers[i + 1]);
			} else if (headers && typeof headers === "object") if (headers[Symbol.iterator]) for (const header of headers) {
				if (!Array.isArray(header) || header.length !== 2) throw new InvalidArgumentError("headers must be in key-value pair format");
				processHeader(this, header[0], header[1]);
			}
			else {
				const keys = Object.keys(headers);
				for (let i = 0; i < keys.length; ++i) processHeader(this, keys[i], headers[keys[i]]);
			}
			else if (headers != null) throw new InvalidArgumentError("headers must be an object or an array");
			validateHandler(handler, method, upgrade);
			this.servername = servername || getServerName(this.host);
			this[kHandler] = handler;
			if (channels.create.hasSubscribers) channels.create.publish({ request: this });
		}
		onBodySent(chunk) {
			if (this[kHandler].onBodySent) try {
				return this[kHandler].onBodySent(chunk);
			} catch (err) {
				this.abort(err);
			}
		}
		onRequestSent() {
			if (channels.bodySent.hasSubscribers) channels.bodySent.publish({ request: this });
			if (this[kHandler].onRequestSent) try {
				return this[kHandler].onRequestSent();
			} catch (err) {
				this.abort(err);
			}
		}
		onConnect(abort) {
			assert$25(!this.aborted);
			assert$25(!this.completed);
			if (this.error) abort(this.error);
			else {
				this.abort = abort;
				return this[kHandler].onConnect(abort);
			}
		}
		onResponseStarted() {
			return this[kHandler].onResponseStarted?.();
		}
		onHeaders(statusCode, headers, resume, statusText) {
			assert$25(!this.aborted);
			assert$25(!this.completed);
			if (channels.headers.hasSubscribers) channels.headers.publish({
				request: this,
				response: {
					statusCode,
					headers,
					statusText
				}
			});
			try {
				return this[kHandler].onHeaders(statusCode, headers, resume, statusText);
			} catch (err) {
				this.abort(err);
			}
		}
		onData(chunk) {
			assert$25(!this.aborted);
			assert$25(!this.completed);
			try {
				return this[kHandler].onData(chunk);
			} catch (err) {
				this.abort(err);
				return false;
			}
		}
		onUpgrade(statusCode, headers, socket) {
			assert$25(!this.aborted);
			assert$25(!this.completed);
			return this[kHandler].onUpgrade(statusCode, headers, socket);
		}
		onComplete(trailers) {
			this.onFinally();
			assert$25(!this.aborted);
			this.completed = true;
			if (channels.trailers.hasSubscribers) channels.trailers.publish({
				request: this,
				trailers
			});
			try {
				return this[kHandler].onComplete(trailers);
			} catch (err) {
				this.onError(err);
			}
		}
		onError(error) {
			this.onFinally();
			if (channels.error.hasSubscribers) channels.error.publish({
				request: this,
				error
			});
			if (this.aborted) return;
			this.aborted = true;
			return this[kHandler].onError(error);
		}
		onFinally() {
			if (this.errorHandler) {
				this.body.off("error", this.errorHandler);
				this.errorHandler = null;
			}
			if (this.endHandler) {
				this.body.off("end", this.endHandler);
				this.endHandler = null;
			}
		}
		addHeader(key, value) {
			processHeader(this, key, value);
			return this;
		}
	};
	function processHeader(request, key, val) {
		if (val && typeof val === "object" && !Array.isArray(val)) throw new InvalidArgumentError(`invalid ${key} header`);
		else if (val === void 0) return;
		let headerName = headerNameLowerCasedRecord[key];
		if (headerName === void 0) {
			headerName = key.toLowerCase();
			if (headerNameLowerCasedRecord[headerName] === void 0 && !isValidHTTPToken(headerName)) throw new InvalidArgumentError("invalid header key");
		}
		if (Array.isArray(val)) {
			const arr = [];
			for (let i = 0; i < val.length; i++) if (typeof val[i] === "string") {
				if (!isValidHeaderValue(val[i])) throw new InvalidArgumentError(`invalid ${key} header`);
				arr.push(val[i]);
			} else if (val[i] === null) arr.push("");
			else if (typeof val[i] === "object") throw new InvalidArgumentError(`invalid ${key} header`);
			else {
				const str = `${val[i]}`;
				if (!isValidHeaderValue(str)) throw new InvalidArgumentError(`invalid ${key} header`);
				arr.push(str);
			}
			val = arr;
		} else if (typeof val === "string") {
			if (!isValidHeaderValue(val)) throw new InvalidArgumentError(`invalid ${key} header`);
		} else if (val === null) val = "";
		else {
			val = `${val}`;
			if (!isValidHeaderValue(val)) throw new InvalidArgumentError(`invalid ${key} header`);
		}
		if (headerName === "host") {
			if (request.host !== null) throw new InvalidArgumentError("duplicate host header");
			if (typeof val !== "string") throw new InvalidArgumentError("invalid host header");
			request.host = val;
		} else if (headerName === "content-length") {
			if (request.contentLength !== null) throw new InvalidArgumentError("duplicate content-length header");
			request.contentLength = parseInt(val, 10);
			if (!Number.isFinite(request.contentLength)) throw new InvalidArgumentError("invalid content-length header");
		} else if (request.contentType === null && headerName === "content-type") {
			request.contentType = val;
			request.headers.push(key, val);
		} else if (headerName === "transfer-encoding" || headerName === "keep-alive" || headerName === "upgrade") throw new InvalidArgumentError(`invalid ${headerName} header`);
		else if (headerName === "connection") {
			const value = typeof val === "string" ? val.toLowerCase() : null;
			if (value !== "close" && value !== "keep-alive") throw new InvalidArgumentError("invalid connection header");
			if (value === "close") request.reset = true;
		} else if (headerName === "expect") throw new NotSupportedError("expect header not supported");
		else request.headers.push(key, val);
	}
	module.exports = Request;
}));
//#endregion
//#region node_modules/.pnpm/undici@6.28.0/node_modules/undici/lib/dispatcher/dispatcher.js
var require_dispatcher = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const EventEmitter = __require("node:events");
	var Dispatcher = class extends EventEmitter {
		dispatch() {
			throw new Error("not implemented");
		}
		close() {
			throw new Error("not implemented");
		}
		destroy() {
			throw new Error("not implemented");
		}
		compose(...args) {
			const interceptors = Array.isArray(args[0]) ? args[0] : args;
			let dispatch = this.dispatch.bind(this);
			for (const interceptor of interceptors) {
				if (interceptor == null) continue;
				if (typeof interceptor !== "function") throw new TypeError(`invalid interceptor, expected function received ${typeof interceptor}`);
				dispatch = interceptor(dispatch);
				if (dispatch == null || typeof dispatch !== "function" || dispatch.length !== 2) throw new TypeError("invalid interceptor");
			}
			return new ComposedDispatcher(this, dispatch);
		}
	};
	var ComposedDispatcher = class extends Dispatcher {
		#dispatcher = null;
		#dispatch = null;
		constructor(dispatcher, dispatch) {
			super();
			this.#dispatcher = dispatcher;
			this.#dispatch = dispatch;
		}
		dispatch(...args) {
			this.#dispatch(...args);
		}
		close(...args) {
			return this.#dispatcher.close(...args);
		}
		destroy(...args) {
			return this.#dispatcher.destroy(...args);
		}
	};
	module.exports = Dispatcher;
}));
//#endregion
//#region node_modules/.pnpm/undici@6.28.0/node_modules/undici/lib/dispatcher/dispatcher-base.js
var require_dispatcher_base = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const Dispatcher = require_dispatcher();
	const { ClientDestroyedError, ClientClosedError, InvalidArgumentError } = require_errors();
	const { kDestroy, kClose, kClosed, kDestroyed, kDispatch, kInterceptors } = require_symbols$4();
	const kOnDestroyed = Symbol("onDestroyed");
	const kOnClosed = Symbol("onClosed");
	const kInterceptedDispatch = Symbol("Intercepted Dispatch");
	const kWebSocketOptions = Symbol("webSocketOptions");
	var DispatcherBase = class extends Dispatcher {
		constructor(opts) {
			super();
			this[kDestroyed] = false;
			this[kOnDestroyed] = null;
			this[kClosed] = false;
			this[kOnClosed] = [];
			this[kWebSocketOptions] = opts?.webSocket ?? {};
		}
		get webSocketOptions() {
			return {
				maxFragments: this[kWebSocketOptions].maxFragments ?? 131072,
				maxPayloadSize: this[kWebSocketOptions].maxPayloadSize ?? 134217728
			};
		}
		get destroyed() {
			return this[kDestroyed];
		}
		get closed() {
			return this[kClosed];
		}
		get interceptors() {
			return this[kInterceptors];
		}
		set interceptors(newInterceptors) {
			if (newInterceptors) {
				for (let i = newInterceptors.length - 1; i >= 0; i--) if (typeof this[kInterceptors][i] !== "function") throw new InvalidArgumentError("interceptor must be an function");
			}
			this[kInterceptors] = newInterceptors;
		}
		close(callback) {
			if (callback === void 0) return new Promise((resolve, reject) => {
				this.close((err, data) => {
					return err ? reject(err) : resolve(data);
				});
			});
			if (typeof callback !== "function") throw new InvalidArgumentError("invalid callback");
			if (this[kDestroyed]) {
				queueMicrotask(() => callback(new ClientDestroyedError(), null));
				return;
			}
			if (this[kClosed]) {
				if (this[kOnClosed]) this[kOnClosed].push(callback);
				else queueMicrotask(() => callback(null, null));
				return;
			}
			this[kClosed] = true;
			this[kOnClosed].push(callback);
			const onClosed = () => {
				const callbacks = this[kOnClosed];
				this[kOnClosed] = null;
				for (let i = 0; i < callbacks.length; i++) callbacks[i](null, null);
			};
			this[kClose]().then(() => this.destroy()).then(() => {
				queueMicrotask(onClosed);
			});
		}
		destroy(err, callback) {
			if (typeof err === "function") {
				callback = err;
				err = null;
			}
			if (callback === void 0) return new Promise((resolve, reject) => {
				this.destroy(err, (err, data) => {
					return err ? /* istanbul ignore next: should never error */ reject(err) : resolve(data);
				});
			});
			if (typeof callback !== "function") throw new InvalidArgumentError("invalid callback");
			if (this[kDestroyed]) {
				if (this[kOnDestroyed]) this[kOnDestroyed].push(callback);
				else queueMicrotask(() => callback(null, null));
				return;
			}
			if (!err) err = new ClientDestroyedError();
			this[kDestroyed] = true;
			this[kOnDestroyed] = this[kOnDestroyed] || [];
			this[kOnDestroyed].push(callback);
			const onDestroyed = () => {
				const callbacks = this[kOnDestroyed];
				this[kOnDestroyed] = null;
				for (let i = 0; i < callbacks.length; i++) callbacks[i](null, null);
			};
			this[kDestroy](err).then(() => {
				queueMicrotask(onDestroyed);
			});
		}
		[kInterceptedDispatch](opts, handler) {
			if (!this[kInterceptors] || this[kInterceptors].length === 0) {
				this[kInterceptedDispatch] = this[kDispatch];
				return this[kDispatch](opts, handler);
			}
			let dispatch = this[kDispatch].bind(this);
			for (let i = this[kInterceptors].length - 1; i >= 0; i--) dispatch = this[kInterceptors][i](dispatch);
			this[kInterceptedDispatch] = dispatch;
			return dispatch(opts, handler);
		}
		dispatch(opts, handler) {
			if (!handler || typeof handler !== "object") throw new InvalidArgumentError("handler must be an object");
			try {
				if (!opts || typeof opts !== "object") throw new InvalidArgumentError("opts must be an object.");
				if (this[kDestroyed] || this[kOnDestroyed]) throw new ClientDestroyedError();
				if (this[kClosed]) throw new ClientClosedError();
				return this[kInterceptedDispatch](opts, handler);
			} catch (err) {
				if (typeof handler.onError !== "function") throw new InvalidArgumentError("invalid onError method");
				handler.onError(err);
				return false;
			}
		}
	};
	module.exports = DispatcherBase;
}));
//#endregion
//#region node_modules/.pnpm/undici@6.28.0/node_modules/undici/lib/util/timers.js
var require_timers = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* This module offers an optimized timer implementation designed for scenarios
	* where high precision is not critical.
	*
	* The timer achieves faster performance by using a low-resolution approach,
	* with an accuracy target of within 500ms. This makes it particularly useful
	* for timers with delays of 1 second or more, where exact timing is less
	* crucial.
	*
	* It's important to note that Node.js timers are inherently imprecise, as
	* delays can occur due to the event loop being blocked by other operations.
	* Consequently, timers may trigger later than their scheduled time.
	*/
	/**
	* The fastNow variable contains the internal fast timer clock value.
	*
	* @type {number}
	*/
	let fastNow = 0;
	/**
	* RESOLUTION_MS represents the target resolution time in milliseconds.
	*
	* @type {number}
	* @default 1000
	*/
	const RESOLUTION_MS = 1e3;
	/**
	* TICK_MS defines the desired interval in milliseconds between each tick.
	* The target value is set to half the resolution time, minus 1 ms, to account
	* for potential event loop overhead.
	*
	* @type {number}
	* @default 499
	*/
	const TICK_MS = 499;
	/**
	* fastNowTimeout is a Node.js timer used to manage and process
	* the FastTimers stored in the `fastTimers` array.
	*
	* @type {NodeJS.Timeout}
	*/
	let fastNowTimeout;
	/**
	* The kFastTimer symbol is used to identify FastTimer instances.
	*
	* @type {Symbol}
	*/
	const kFastTimer = Symbol("kFastTimer");
	/**
	* The fastTimers array contains all active FastTimers.
	*
	* @type {FastTimer[]}
	*/
	const fastTimers = [];
	/**
	* These constants represent the various states of a FastTimer.
	*/
	/**
	* The `NOT_IN_LIST` constant indicates that the FastTimer is not included
	* in the `fastTimers` array. Timers with this status will not be processed
	* during the next tick by the `onTick` function.
	*
	* A FastTimer can be re-added to the `fastTimers` array by invoking the
	* `refresh` method on the FastTimer instance.
	*
	* @type {-2}
	*/
	const NOT_IN_LIST = -2;
	/**
	* The `TO_BE_CLEARED` constant indicates that the FastTimer is scheduled
	* for removal from the `fastTimers` array. A FastTimer in this state will
	* be removed in the next tick by the `onTick` function and will no longer
	* be processed.
	*
	* This status is also set when the `clear` method is called on the FastTimer instance.
	*
	* @type {-1}
	*/
	const TO_BE_CLEARED = -1;
	/**
	* The `PENDING` constant signifies that the FastTimer is awaiting processing
	* in the next tick by the `onTick` function. Timers with this status will have
	* their `_idleStart` value set and their status updated to `ACTIVE` in the next tick.
	*
	* @type {0}
	*/
	const PENDING = 0;
	/**
	* The `ACTIVE` constant indicates that the FastTimer is active and waiting
	* for its timer to expire. During the next tick, the `onTick` function will
	* check if the timer has expired, and if so, it will execute the associated callback.
	*
	* @type {1}
	*/
	const ACTIVE = 1;
	/**
	* The onTick function processes the fastTimers array.
	*
	* @returns {void}
	*/
	function onTick() {
		/**
		* Increment the fastNow value by the TICK_MS value, despite the actual time
		* that has passed since the last tick. This approach ensures independence
		* from the system clock and delays caused by a blocked event loop.
		*
		* @type {number}
		*/
		fastNow += TICK_MS;
		/**
		* The `idx` variable is used to iterate over the `fastTimers` array.
		* Expired timers are removed by replacing them with the last element in the array.
		* Consequently, `idx` is only incremented when the current element is not removed.
		*
		* @type {number}
		*/
		let idx = 0;
		/**
		* The len variable will contain the length of the fastTimers array
		* and will be decremented when a FastTimer should be removed from the
		* fastTimers array.
		*
		* @type {number}
		*/
		let len = fastTimers.length;
		while (idx < len) {
			/**
			* @type {FastTimer}
			*/
			const timer = fastTimers[idx];
			if (timer._state === PENDING) {
				timer._idleStart = fastNow - TICK_MS;
				timer._state = ACTIVE;
			} else if (timer._state === ACTIVE && fastNow >= timer._idleStart + timer._idleTimeout) {
				timer._state = TO_BE_CLEARED;
				timer._idleStart = -1;
				timer._onTimeout(timer._timerArg);
			}
			if (timer._state === TO_BE_CLEARED) {
				timer._state = NOT_IN_LIST;
				if (--len !== 0) fastTimers[idx] = fastTimers[len];
			} else ++idx;
		}
		fastTimers.length = len;
		if (fastTimers.length !== 0) refreshTimeout();
	}
	function refreshTimeout() {
		if (fastNowTimeout) fastNowTimeout.refresh();
		else {
			clearTimeout(fastNowTimeout);
			fastNowTimeout = setTimeout(onTick, TICK_MS);
			if (fastNowTimeout.unref) fastNowTimeout.unref();
		}
	}
	/**
	* The `FastTimer` class is a data structure designed to store and manage
	* timer information.
	*/
	var FastTimer = class {
		[kFastTimer] = true;
		/**
		* The state of the timer, which can be one of the following:
		* - NOT_IN_LIST (-2)
		* - TO_BE_CLEARED (-1)
		* - PENDING (0)
		* - ACTIVE (1)
		*
		* @type {-2|-1|0|1}
		* @private
		*/
		_state = NOT_IN_LIST;
		/**
		* The number of milliseconds to wait before calling the callback.
		*
		* @type {number}
		* @private
		*/
		_idleTimeout = -1;
		/**
		* The time in milliseconds when the timer was started. This value is used to
		* calculate when the timer should expire.
		*
		* @type {number}
		* @default -1
		* @private
		*/
		_idleStart = -1;
		/**
		* The function to be executed when the timer expires.
		* @type {Function}
		* @private
		*/
		_onTimeout;
		/**
		* The argument to be passed to the callback when the timer expires.
		*
		* @type {*}
		* @private
		*/
		_timerArg;
		/**
		* @constructor
		* @param {Function} callback A function to be executed after the timer
		* expires.
		* @param {number} delay The time, in milliseconds that the timer should wait
		* before the specified function or code is executed.
		* @param {*} arg
		*/
		constructor(callback, delay, arg) {
			this._onTimeout = callback;
			this._idleTimeout = delay;
			this._timerArg = arg;
			this.refresh();
		}
		/**
		* Sets the timer's start time to the current time, and reschedules the timer
		* to call its callback at the previously specified duration adjusted to the
		* current time.
		* Using this on a timer that has already called its callback will reactivate
		* the timer.
		*
		* @returns {void}
		*/
		refresh() {
			if (this._state === NOT_IN_LIST) fastTimers.push(this);
			if (!fastNowTimeout || fastTimers.length === 1) refreshTimeout();
			this._state = PENDING;
		}
		/**
		* The `clear` method cancels the timer, preventing it from executing.
		*
		* @returns {void}
		* @private
		*/
		clear() {
			this._state = TO_BE_CLEARED;
			this._idleStart = -1;
		}
	};
	/**
	* This module exports a setTimeout and clearTimeout function that can be
	* used as a drop-in replacement for the native functions.
	*/
	module.exports = {
		/**
		* The setTimeout() method sets a timer which executes a function once the
		* timer expires.
		* @param {Function} callback A function to be executed after the timer
		* expires.
		* @param {number} delay The time, in milliseconds that the timer should
		* wait before the specified function or code is executed.
		* @param {*} [arg] An optional argument to be passed to the callback function
		* when the timer expires.
		* @returns {NodeJS.Timeout|FastTimer}
		*/
		setTimeout(callback, delay, arg) {
			return delay <= RESOLUTION_MS ? setTimeout(callback, delay, arg) : new FastTimer(callback, delay, arg);
		},
		/**
		* The clearTimeout method cancels an instantiated Timer previously created
		* by calling setTimeout.
		*
		* @param {NodeJS.Timeout|FastTimer} timeout
		*/
		clearTimeout(timeout) {
			if (timeout[kFastTimer])
 /**
			* @type {FastTimer}
			*/
			timeout.clear();
			else clearTimeout(timeout);
		},
		/**
		* The setFastTimeout() method sets a fastTimer which executes a function once
		* the timer expires.
		* @param {Function} callback A function to be executed after the timer
		* expires.
		* @param {number} delay The time, in milliseconds that the timer should
		* wait before the specified function or code is executed.
		* @param {*} [arg] An optional argument to be passed to the callback function
		* when the timer expires.
		* @returns {FastTimer}
		*/
		setFastTimeout(callback, delay, arg) {
			return new FastTimer(callback, delay, arg);
		},
		/**
		* The clearTimeout method cancels an instantiated FastTimer previously
		* created by calling setFastTimeout.
		*
		* @param {FastTimer} timeout
		*/
		clearFastTimeout(timeout) {
			timeout.clear();
		},
		/**
		* The now method returns the value of the internal fast timer clock.
		*
		* @returns {number}
		*/
		now() {
			return fastNow;
		},
		/**
		* Trigger the onTick function to process the fastTimers array.
		* Exported for testing purposes only.
		* Marking as deprecated to discourage any use outside of testing.
		* @deprecated
		* @param {number} [delay=0] The delay in milliseconds to add to the now value.
		*/
		tick(delay = 0) {
			fastNow += delay - RESOLUTION_MS + 1;
			onTick();
			onTick();
		},
		/**
		* Reset FastTimers.
		* Exported for testing purposes only.
		* Marking as deprecated to discourage any use outside of testing.
		* @deprecated
		*/
		reset() {
			fastNow = 0;
			fastTimers.length = 0;
			clearTimeout(fastNowTimeout);
			fastNowTimeout = null;
		},
		/**
		* Exporting for testing purposes only.
		* Marking as deprecated to discourage any use outside of testing.
		* @deprecated
		*/
		kFastTimer
	};
}));
//#endregion
//#region node_modules/.pnpm/undici@6.28.0/node_modules/undici/lib/core/connect.js
var require_connect = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const net$1 = __require("node:net");
	const assert$24 = __require("node:assert");
	const util = require_util$7();
	const { InvalidArgumentError, ConnectTimeoutError } = require_errors();
	const timers = require_timers();
	function noop() {}
	let tls;
	let SessionCache;
	if (global.FinalizationRegistry && !(process.env.NODE_V8_COVERAGE || process.env.UNDICI_NO_FG)) SessionCache = class WeakSessionCache {
		constructor(maxCachedSessions) {
			this._maxCachedSessions = maxCachedSessions;
			this._sessionCache = /* @__PURE__ */ new Map();
			this._sessionRegistry = new global.FinalizationRegistry((key) => {
				if (this._sessionCache.size < this._maxCachedSessions) return;
				const ref = this._sessionCache.get(key);
				if (ref !== void 0 && ref.deref() === void 0) this._sessionCache.delete(key);
			});
		}
		get(sessionKey) {
			const ref = this._sessionCache.get(sessionKey);
			return ref ? ref.deref() : null;
		}
		set(sessionKey, session) {
			if (this._maxCachedSessions === 0) return;
			this._sessionCache.set(sessionKey, new WeakRef(session));
			this._sessionRegistry.register(session, sessionKey);
		}
	};
	else SessionCache = class SimpleSessionCache {
		constructor(maxCachedSessions) {
			this._maxCachedSessions = maxCachedSessions;
			this._sessionCache = /* @__PURE__ */ new Map();
		}
		get(sessionKey) {
			return this._sessionCache.get(sessionKey);
		}
		set(sessionKey, session) {
			if (this._maxCachedSessions === 0) return;
			if (this._sessionCache.size >= this._maxCachedSessions) {
				const { value: oldestKey } = this._sessionCache.keys().next();
				this._sessionCache.delete(oldestKey);
			}
			this._sessionCache.set(sessionKey, session);
		}
	};
	function buildConnector({ allowH2, maxCachedSessions, socketPath, timeout, session: customSession, ...opts }) {
		if (maxCachedSessions != null && (!Number.isInteger(maxCachedSessions) || maxCachedSessions < 0)) throw new InvalidArgumentError("maxCachedSessions must be a positive integer or zero");
		const options = {
			path: socketPath,
			...opts
		};
		const sessionCache = new SessionCache(maxCachedSessions == null ? 100 : maxCachedSessions);
		timeout = timeout == null ? 1e4 : timeout;
		allowH2 = allowH2 != null ? allowH2 : false;
		return function connect({ hostname, host, protocol, port, servername, localAddress, httpSocket }, callback) {
			let socket;
			if (protocol === "https:") {
				if (!tls) tls = __require("node:tls");
				servername = servername || options.servername || util.getServerName(host) || null;
				const sessionKey = servername || hostname;
				assert$24(sessionKey);
				const session = customSession || sessionCache.get(sessionKey) || null;
				port = port || 443;
				socket = tls.connect({
					highWaterMark: 16384,
					...options,
					servername,
					session,
					localAddress,
					ALPNProtocols: allowH2 ? ["http/1.1", "h2"] : ["http/1.1"],
					socket: httpSocket,
					port,
					host: hostname
				});
				socket.on("session", function(session) {
					sessionCache.set(sessionKey, session);
				});
			} else {
				assert$24(!httpSocket, "httpSocket can only be sent on TLS update");
				port = port || 80;
				socket = net$1.connect({
					highWaterMark: 65536,
					...options,
					localAddress,
					port,
					host: hostname
				});
			}
			if (options.keepAlive == null || options.keepAlive) {
				const keepAliveInitialDelay = options.keepAliveInitialDelay === void 0 ? 6e4 : options.keepAliveInitialDelay;
				socket.setKeepAlive(true, keepAliveInitialDelay);
			}
			const clearConnectTimeout = setupConnectTimeout(new WeakRef(socket), {
				timeout,
				hostname,
				port
			});
			socket.setNoDelay(true).once(protocol === "https:" ? "secureConnect" : "connect", function() {
				queueMicrotask(clearConnectTimeout);
				if (callback) {
					const cb = callback;
					callback = null;
					cb(null, this);
				}
			}).on("error", function(err) {
				queueMicrotask(clearConnectTimeout);
				if (callback) {
					const cb = callback;
					callback = null;
					cb(err);
				}
			});
			return socket;
		};
	}
	/**
	* @param {WeakRef<net.Socket>} socketWeakRef
	* @param {object} opts
	* @param {number} opts.timeout
	* @param {string} opts.hostname
	* @param {number} opts.port
	* @returns {() => void}
	*/
	const setupConnectTimeout = process.platform === "win32" ? (socketWeakRef, opts) => {
		if (!opts.timeout) return noop;
		let s1 = null;
		let s2 = null;
		const fastTimer = timers.setFastTimeout(() => {
			s1 = setImmediate(() => {
				s2 = setImmediate(() => onConnectTimeout(socketWeakRef.deref(), opts));
			});
		}, opts.timeout);
		return () => {
			timers.clearFastTimeout(fastTimer);
			clearImmediate(s1);
			clearImmediate(s2);
		};
	} : (socketWeakRef, opts) => {
		if (!opts.timeout) return noop;
		let s1 = null;
		const fastTimer = timers.setFastTimeout(() => {
			s1 = setImmediate(() => {
				onConnectTimeout(socketWeakRef.deref(), opts);
			});
		}, opts.timeout);
		return () => {
			timers.clearFastTimeout(fastTimer);
			clearImmediate(s1);
		};
	};
	/**
	* @param {net.Socket} socket
	* @param {object} opts
	* @param {number} opts.timeout
	* @param {string} opts.hostname
	* @param {number} opts.port
	*/
	function onConnectTimeout(socket, opts) {
		if (socket == null) return;
		let message = "Connect Timeout Error";
		if (Array.isArray(socket.autoSelectFamilyAttemptedAddresses)) message += ` (attempted addresses: ${socket.autoSelectFamilyAttemptedAddresses.join(", ")},`;
		else message += ` (attempted address: ${opts.hostname}:${opts.port},`;
		message += ` timeout: ${opts.timeout}ms)`;
		util.destroy(socket, new ConnectTimeoutError(message));
	}
	module.exports = buildConnector;
}));
//#endregion
//#region node_modules/.pnpm/undici@6.28.0/node_modules/undici/lib/llhttp/utils.js
var require_utils$4 = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.enumToMap = void 0;
	function enumToMap(obj) {
		const res = {};
		Object.keys(obj).forEach((key) => {
			const value = obj[key];
			if (typeof value === "number") res[key] = value;
		});
		return res;
	}
	exports.enumToMap = enumToMap;
}));
//#endregion
//#region node_modules/.pnpm/undici@6.28.0/node_modules/undici/lib/llhttp/constants.js
var require_constants$3 = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.SPECIAL_HEADERS = exports.HEADER_STATE = exports.MINOR = exports.MAJOR = exports.CONNECTION_TOKEN_CHARS = exports.HEADER_CHARS = exports.TOKEN = exports.STRICT_TOKEN = exports.HEX = exports.URL_CHAR = exports.STRICT_URL_CHAR = exports.USERINFO_CHARS = exports.MARK = exports.ALPHANUM = exports.NUM = exports.HEX_MAP = exports.NUM_MAP = exports.ALPHA = exports.FINISH = exports.H_METHOD_MAP = exports.METHOD_MAP = exports.METHODS_RTSP = exports.METHODS_ICE = exports.METHODS_HTTP = exports.METHODS = exports.LENIENT_FLAGS = exports.FLAGS = exports.TYPE = exports.ERROR = void 0;
	const utils_1 = require_utils$4();
	(function(ERROR) {
		ERROR[ERROR["OK"] = 0] = "OK";
		ERROR[ERROR["INTERNAL"] = 1] = "INTERNAL";
		ERROR[ERROR["STRICT"] = 2] = "STRICT";
		ERROR[ERROR["LF_EXPECTED"] = 3] = "LF_EXPECTED";
		ERROR[ERROR["UNEXPECTED_CONTENT_LENGTH"] = 4] = "UNEXPECTED_CONTENT_LENGTH";
		ERROR[ERROR["CLOSED_CONNECTION"] = 5] = "CLOSED_CONNECTION";
		ERROR[ERROR["INVALID_METHOD"] = 6] = "INVALID_METHOD";
		ERROR[ERROR["INVALID_URL"] = 7] = "INVALID_URL";
		ERROR[ERROR["INVALID_CONSTANT"] = 8] = "INVALID_CONSTANT";
		ERROR[ERROR["INVALID_VERSION"] = 9] = "INVALID_VERSION";
		ERROR[ERROR["INVALID_HEADER_TOKEN"] = 10] = "INVALID_HEADER_TOKEN";
		ERROR[ERROR["INVALID_CONTENT_LENGTH"] = 11] = "INVALID_CONTENT_LENGTH";
		ERROR[ERROR["INVALID_CHUNK_SIZE"] = 12] = "INVALID_CHUNK_SIZE";
		ERROR[ERROR["INVALID_STATUS"] = 13] = "INVALID_STATUS";
		ERROR[ERROR["INVALID_EOF_STATE"] = 14] = "INVALID_EOF_STATE";
		ERROR[ERROR["INVALID_TRANSFER_ENCODING"] = 15] = "INVALID_TRANSFER_ENCODING";
		ERROR[ERROR["CB_MESSAGE_BEGIN"] = 16] = "CB_MESSAGE_BEGIN";
		ERROR[ERROR["CB_HEADERS_COMPLETE"] = 17] = "CB_HEADERS_COMPLETE";
		ERROR[ERROR["CB_MESSAGE_COMPLETE"] = 18] = "CB_MESSAGE_COMPLETE";
		ERROR[ERROR["CB_CHUNK_HEADER"] = 19] = "CB_CHUNK_HEADER";
		ERROR[ERROR["CB_CHUNK_COMPLETE"] = 20] = "CB_CHUNK_COMPLETE";
		ERROR[ERROR["PAUSED"] = 21] = "PAUSED";
		ERROR[ERROR["PAUSED_UPGRADE"] = 22] = "PAUSED_UPGRADE";
		ERROR[ERROR["PAUSED_H2_UPGRADE"] = 23] = "PAUSED_H2_UPGRADE";
		ERROR[ERROR["USER"] = 24] = "USER";
	})(exports.ERROR || (exports.ERROR = {}));
	(function(TYPE) {
		TYPE[TYPE["BOTH"] = 0] = "BOTH";
		TYPE[TYPE["REQUEST"] = 1] = "REQUEST";
		TYPE[TYPE["RESPONSE"] = 2] = "RESPONSE";
	})(exports.TYPE || (exports.TYPE = {}));
	(function(FLAGS) {
		FLAGS[FLAGS["CONNECTION_KEEP_ALIVE"] = 1] = "CONNECTION_KEEP_ALIVE";
		FLAGS[FLAGS["CONNECTION_CLOSE"] = 2] = "CONNECTION_CLOSE";
		FLAGS[FLAGS["CONNECTION_UPGRADE"] = 4] = "CONNECTION_UPGRADE";
		FLAGS[FLAGS["CHUNKED"] = 8] = "CHUNKED";
		FLAGS[FLAGS["UPGRADE"] = 16] = "UPGRADE";
		FLAGS[FLAGS["CONTENT_LENGTH"] = 32] = "CONTENT_LENGTH";
		FLAGS[FLAGS["SKIPBODY"] = 64] = "SKIPBODY";
		FLAGS[FLAGS["TRAILING"] = 128] = "TRAILING";
		FLAGS[FLAGS["TRANSFER_ENCODING"] = 512] = "TRANSFER_ENCODING";
	})(exports.FLAGS || (exports.FLAGS = {}));
	(function(LENIENT_FLAGS) {
		LENIENT_FLAGS[LENIENT_FLAGS["HEADERS"] = 1] = "HEADERS";
		LENIENT_FLAGS[LENIENT_FLAGS["CHUNKED_LENGTH"] = 2] = "CHUNKED_LENGTH";
		LENIENT_FLAGS[LENIENT_FLAGS["KEEP_ALIVE"] = 4] = "KEEP_ALIVE";
	})(exports.LENIENT_FLAGS || (exports.LENIENT_FLAGS = {}));
	var METHODS;
	(function(METHODS) {
		METHODS[METHODS["DELETE"] = 0] = "DELETE";
		METHODS[METHODS["GET"] = 1] = "GET";
		METHODS[METHODS["HEAD"] = 2] = "HEAD";
		METHODS[METHODS["POST"] = 3] = "POST";
		METHODS[METHODS["PUT"] = 4] = "PUT";
		METHODS[METHODS["CONNECT"] = 5] = "CONNECT";
		METHODS[METHODS["OPTIONS"] = 6] = "OPTIONS";
		METHODS[METHODS["TRACE"] = 7] = "TRACE";
		METHODS[METHODS["COPY"] = 8] = "COPY";
		METHODS[METHODS["LOCK"] = 9] = "LOCK";
		METHODS[METHODS["MKCOL"] = 10] = "MKCOL";
		METHODS[METHODS["MOVE"] = 11] = "MOVE";
		METHODS[METHODS["PROPFIND"] = 12] = "PROPFIND";
		METHODS[METHODS["PROPPATCH"] = 13] = "PROPPATCH";
		METHODS[METHODS["SEARCH"] = 14] = "SEARCH";
		METHODS[METHODS["UNLOCK"] = 15] = "UNLOCK";
		METHODS[METHODS["BIND"] = 16] = "BIND";
		METHODS[METHODS["REBIND"] = 17] = "REBIND";
		METHODS[METHODS["UNBIND"] = 18] = "UNBIND";
		METHODS[METHODS["ACL"] = 19] = "ACL";
		METHODS[METHODS["REPORT"] = 20] = "REPORT";
		METHODS[METHODS["MKACTIVITY"] = 21] = "MKACTIVITY";
		METHODS[METHODS["CHECKOUT"] = 22] = "CHECKOUT";
		METHODS[METHODS["MERGE"] = 23] = "MERGE";
		METHODS[METHODS["M-SEARCH"] = 24] = "M-SEARCH";
		METHODS[METHODS["NOTIFY"] = 25] = "NOTIFY";
		METHODS[METHODS["SUBSCRIBE"] = 26] = "SUBSCRIBE";
		METHODS[METHODS["UNSUBSCRIBE"] = 27] = "UNSUBSCRIBE";
		METHODS[METHODS["PATCH"] = 28] = "PATCH";
		METHODS[METHODS["PURGE"] = 29] = "PURGE";
		METHODS[METHODS["MKCALENDAR"] = 30] = "MKCALENDAR";
		METHODS[METHODS["LINK"] = 31] = "LINK";
		METHODS[METHODS["UNLINK"] = 32] = "UNLINK";
		METHODS[METHODS["SOURCE"] = 33] = "SOURCE";
		METHODS[METHODS["PRI"] = 34] = "PRI";
		METHODS[METHODS["DESCRIBE"] = 35] = "DESCRIBE";
		METHODS[METHODS["ANNOUNCE"] = 36] = "ANNOUNCE";
		METHODS[METHODS["SETUP"] = 37] = "SETUP";
		METHODS[METHODS["PLAY"] = 38] = "PLAY";
		METHODS[METHODS["PAUSE"] = 39] = "PAUSE";
		METHODS[METHODS["TEARDOWN"] = 40] = "TEARDOWN";
		METHODS[METHODS["GET_PARAMETER"] = 41] = "GET_PARAMETER";
		METHODS[METHODS["SET_PARAMETER"] = 42] = "SET_PARAMETER";
		METHODS[METHODS["REDIRECT"] = 43] = "REDIRECT";
		METHODS[METHODS["RECORD"] = 44] = "RECORD";
		METHODS[METHODS["FLUSH"] = 45] = "FLUSH";
	})(METHODS = exports.METHODS || (exports.METHODS = {}));
	exports.METHODS_HTTP = [
		METHODS.DELETE,
		METHODS.GET,
		METHODS.HEAD,
		METHODS.POST,
		METHODS.PUT,
		METHODS.CONNECT,
		METHODS.OPTIONS,
		METHODS.TRACE,
		METHODS.COPY,
		METHODS.LOCK,
		METHODS.MKCOL,
		METHODS.MOVE,
		METHODS.PROPFIND,
		METHODS.PROPPATCH,
		METHODS.SEARCH,
		METHODS.UNLOCK,
		METHODS.BIND,
		METHODS.REBIND,
		METHODS.UNBIND,
		METHODS.ACL,
		METHODS.REPORT,
		METHODS.MKACTIVITY,
		METHODS.CHECKOUT,
		METHODS.MERGE,
		METHODS["M-SEARCH"],
		METHODS.NOTIFY,
		METHODS.SUBSCRIBE,
		METHODS.UNSUBSCRIBE,
		METHODS.PATCH,
		METHODS.PURGE,
		METHODS.MKCALENDAR,
		METHODS.LINK,
		METHODS.UNLINK,
		METHODS.PRI,
		METHODS.SOURCE
	];
	exports.METHODS_ICE = [METHODS.SOURCE];
	exports.METHODS_RTSP = [
		METHODS.OPTIONS,
		METHODS.DESCRIBE,
		METHODS.ANNOUNCE,
		METHODS.SETUP,
		METHODS.PLAY,
		METHODS.PAUSE,
		METHODS.TEARDOWN,
		METHODS.GET_PARAMETER,
		METHODS.SET_PARAMETER,
		METHODS.REDIRECT,
		METHODS.RECORD,
		METHODS.FLUSH,
		METHODS.GET,
		METHODS.POST
	];
	exports.METHOD_MAP = utils_1.enumToMap(METHODS);
	exports.H_METHOD_MAP = {};
	Object.keys(exports.METHOD_MAP).forEach((key) => {
		if (/^H/.test(key)) exports.H_METHOD_MAP[key] = exports.METHOD_MAP[key];
	});
	(function(FINISH) {
		FINISH[FINISH["SAFE"] = 0] = "SAFE";
		FINISH[FINISH["SAFE_WITH_CB"] = 1] = "SAFE_WITH_CB";
		FINISH[FINISH["UNSAFE"] = 2] = "UNSAFE";
	})(exports.FINISH || (exports.FINISH = {}));
	exports.ALPHA = [];
	for (let i = "A".charCodeAt(0); i <= "Z".charCodeAt(0); i++) {
		exports.ALPHA.push(String.fromCharCode(i));
		exports.ALPHA.push(String.fromCharCode(i + 32));
	}
	exports.NUM_MAP = {
		0: 0,
		1: 1,
		2: 2,
		3: 3,
		4: 4,
		5: 5,
		6: 6,
		7: 7,
		8: 8,
		9: 9
	};
	exports.HEX_MAP = {
		0: 0,
		1: 1,
		2: 2,
		3: 3,
		4: 4,
		5: 5,
		6: 6,
		7: 7,
		8: 8,
		9: 9,
		A: 10,
		B: 11,
		C: 12,
		D: 13,
		E: 14,
		F: 15,
		a: 10,
		b: 11,
		c: 12,
		d: 13,
		e: 14,
		f: 15
	};
	exports.NUM = [
		"0",
		"1",
		"2",
		"3",
		"4",
		"5",
		"6",
		"7",
		"8",
		"9"
	];
	exports.ALPHANUM = exports.ALPHA.concat(exports.NUM);
	exports.MARK = [
		"-",
		"_",
		".",
		"!",
		"~",
		"*",
		"'",
		"(",
		")"
	];
	exports.USERINFO_CHARS = exports.ALPHANUM.concat(exports.MARK).concat([
		"%",
		";",
		":",
		"&",
		"=",
		"+",
		"$",
		","
	]);
	exports.STRICT_URL_CHAR = [
		"!",
		"\"",
		"$",
		"%",
		"&",
		"'",
		"(",
		")",
		"*",
		"+",
		",",
		"-",
		".",
		"/",
		":",
		";",
		"<",
		"=",
		">",
		"@",
		"[",
		"\\",
		"]",
		"^",
		"_",
		"`",
		"{",
		"|",
		"}",
		"~"
	].concat(exports.ALPHANUM);
	exports.URL_CHAR = exports.STRICT_URL_CHAR.concat(["	", "\f"]);
	for (let i = 128; i <= 255; i++) exports.URL_CHAR.push(i);
	exports.HEX = exports.NUM.concat([
		"a",
		"b",
		"c",
		"d",
		"e",
		"f",
		"A",
		"B",
		"C",
		"D",
		"E",
		"F"
	]);
	exports.STRICT_TOKEN = [
		"!",
		"#",
		"$",
		"%",
		"&",
		"'",
		"*",
		"+",
		"-",
		".",
		"^",
		"_",
		"`",
		"|",
		"~"
	].concat(exports.ALPHANUM);
	exports.TOKEN = exports.STRICT_TOKEN.concat([" "]);
	exports.HEADER_CHARS = ["	"];
	for (let i = 32; i <= 255; i++) if (i !== 127) exports.HEADER_CHARS.push(i);
	exports.CONNECTION_TOKEN_CHARS = exports.HEADER_CHARS.filter((c) => c !== 44);
	exports.MAJOR = exports.NUM_MAP;
	exports.MINOR = exports.MAJOR;
	var HEADER_STATE;
	(function(HEADER_STATE) {
		HEADER_STATE[HEADER_STATE["GENERAL"] = 0] = "GENERAL";
		HEADER_STATE[HEADER_STATE["CONNECTION"] = 1] = "CONNECTION";
		HEADER_STATE[HEADER_STATE["CONTENT_LENGTH"] = 2] = "CONTENT_LENGTH";
		HEADER_STATE[HEADER_STATE["TRANSFER_ENCODING"] = 3] = "TRANSFER_ENCODING";
		HEADER_STATE[HEADER_STATE["UPGRADE"] = 4] = "UPGRADE";
		HEADER_STATE[HEADER_STATE["CONNECTION_KEEP_ALIVE"] = 5] = "CONNECTION_KEEP_ALIVE";
		HEADER_STATE[HEADER_STATE["CONNECTION_CLOSE"] = 6] = "CONNECTION_CLOSE";
		HEADER_STATE[HEADER_STATE["CONNECTION_UPGRADE"] = 7] = "CONNECTION_UPGRADE";
		HEADER_STATE[HEADER_STATE["TRANSFER_ENCODING_CHUNKED"] = 8] = "TRANSFER_ENCODING_CHUNKED";
	})(HEADER_STATE = exports.HEADER_STATE || (exports.HEADER_STATE = {}));
	exports.SPECIAL_HEADERS = {
		"connection": HEADER_STATE.CONNECTION,
		"content-length": HEADER_STATE.CONTENT_LENGTH,
		"proxy-connection": HEADER_STATE.CONNECTION,
		"transfer-encoding": HEADER_STATE.TRANSFER_ENCODING,
		"upgrade": HEADER_STATE.UPGRADE
	};
}));
//#endregion
//#region node_modules/.pnpm/undici@6.28.0/node_modules/undici/lib/llhttp/llhttp-wasm.js
var require_llhttp_wasm = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const { Buffer: Buffer$3 } = __require("node:buffer");
	module.exports = Buffer$3.from("AGFzbQEAAAABJwdgAX8Bf2ADf39/AX9gAX8AYAJ/fwBgBH9/f38Bf2AAAGADf39/AALLAQgDZW52GHdhc21fb25faGVhZGVyc19jb21wbGV0ZQAEA2VudhV3YXNtX29uX21lc3NhZ2VfYmVnaW4AAANlbnYLd2FzbV9vbl91cmwAAQNlbnYOd2FzbV9vbl9zdGF0dXMAAQNlbnYUd2FzbV9vbl9oZWFkZXJfZmllbGQAAQNlbnYUd2FzbV9vbl9oZWFkZXJfdmFsdWUAAQNlbnYMd2FzbV9vbl9ib2R5AAEDZW52GHdhc21fb25fbWVzc2FnZV9jb21wbGV0ZQAAAy0sBQYAAAIAAAAAAAACAQIAAgICAAADAAAAAAMDAwMBAQEBAQEBAQEAAAIAAAAEBQFwARISBQMBAAIGCAF/AUGA1AQLB9EFIgZtZW1vcnkCAAtfaW5pdGlhbGl6ZQAIGV9faW5kaXJlY3RfZnVuY3Rpb25fdGFibGUBAAtsbGh0dHBfaW5pdAAJGGxsaHR0cF9zaG91bGRfa2VlcF9hbGl2ZQAvDGxsaHR0cF9hbGxvYwALBm1hbGxvYwAxC2xsaHR0cF9mcmVlAAwEZnJlZQAMD2xsaHR0cF9nZXRfdHlwZQANFWxsaHR0cF9nZXRfaHR0cF9tYWpvcgAOFWxsaHR0cF9nZXRfaHR0cF9taW5vcgAPEWxsaHR0cF9nZXRfbWV0aG9kABAWbGxodHRwX2dldF9zdGF0dXNfY29kZQAREmxsaHR0cF9nZXRfdXBncmFkZQASDGxsaHR0cF9yZXNldAATDmxsaHR0cF9leGVjdXRlABQUbGxodHRwX3NldHRpbmdzX2luaXQAFQ1sbGh0dHBfZmluaXNoABYMbGxodHRwX3BhdXNlABcNbGxodHRwX3Jlc3VtZQAYG2xsaHR0cF9yZXN1bWVfYWZ0ZXJfdXBncmFkZQAZEGxsaHR0cF9nZXRfZXJybm8AGhdsbGh0dHBfZ2V0X2Vycm9yX3JlYXNvbgAbF2xsaHR0cF9zZXRfZXJyb3JfcmVhc29uABwUbGxodHRwX2dldF9lcnJvcl9wb3MAHRFsbGh0dHBfZXJybm9fbmFtZQAeEmxsaHR0cF9tZXRob2RfbmFtZQAfEmxsaHR0cF9zdGF0dXNfbmFtZQAgGmxsaHR0cF9zZXRfbGVu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PgtBhwEMPQtBiAEMPAtBiQEMOwtBigEMOgtBiwEMOQtBjAEMOAtBjQEMNwtBjgEMNgtBjwEMNQtBkAEMNAtBkQEMMwtBkgEMMgtBkwEMMQtBlAEMMAtBlQEMLwtBlgEMLgtBlwEMLQtBmAEMLAtBmQEMKwtBmgEMKgtBmwEMKQtBnAEMKAtBnQEMJwtBngEMJgtBnwEMJQtBoAEMJAtBoQEMIwtBogEMIgtBowEMIQtBpAEMIAtBpQEMHwtBpgEMHgtBpwEMHQtBqAEMHAtBqQEMGwtBqgEMGgtBqwEMGQtBrAEMGAtBrQEMFwtBrgEMFgtBAQwVC0GvAQwUC0GwAQwTC0GxAQwSC0GzAQwRC0GyAQwQC0G0AQwPC0G1AQwOC0G2AQwNC0G3AQwMC0G4AQwLC0G5AQwKC0G6AQwJC0G7AQwIC0HGAQwHC0G8AQwGC0G9AQwFC0G+AQwEC0G/AQwDC0HAAQwCC0HCAQwBC0HBAQshAwNAAkACQAJAAkACQAJAAkACQAJAIAICfwJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJ/AkACQAJAAkACQAJAAkACQAJAAkACQAJAAkAgAgJ/AkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACfwJAAkACfwJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACfwJAAkACQAJAAn8CQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQCADDsYBAAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHyAhIyUmKCorLC8wMTIzNDU2Nzk6Ozw9lANAQkRFRklLTk9QUVJTVFVWWFpbXF1eX2BhYmNkZWZnaGpsb3Bxc3V2eHl6e3x/gAGBAYIBgwGEAYUBhgGHAYgBiQGKAYsBjAGNAY4BjwGQAZEBkgGTAZQBlQGWAZcBmAGZAZoBmwGcAZ0BngGfAaABoQGiAaMBpAGlAaYBpwGoAakBqgGrAawBrQGuAa8BsAGxAbIBswG0AbUBtgG3AbgBuQG6AbsBvAG9Ab4BvwHAAcEBwgHDAcQBxQHGAccByAHJAcsBzAHNAc4BzwGKA4kDiAOHA4QDgwOAA/sC+gL5AvgC9wL0AvMC8gLLAsECsALZAQsgASAERw3wAkHdASEDDLMDCyABIARHDcgBQcMBIQMMsgMLIAEgBEcNe0H3ACEDDLEDCyABIARHDXBB7wAhAwywAwsgASAERw1pQeoAIQMMrwMLIAEgBEcNZUHoACEDDK4DCyABIARHDWJB5gAhAwytAwsgASAERw0aQRghAwysAwsgASAERw0VQRIhAwyrAwsgASAERw1CQcUAIQMMqgMLIAEgBEcNNEE/IQMMqQMLIAEgBEcNMkE8IQMMqAMLIAEgBEcNK0ExIQMMpwMLIAItAC5BAUYNnwMMwQILQQAhAAJAAkACQCACLQAqRQ0AIAItACtFDQAgAi8BMCIDQQJxRQ0BDAILIAIvATAiA0EBcUUNAQtBASEAIAItAChBAUYNACACLwEyIgVB5ABrQeQASQ0AIAVBzAFGDQAgBUGwAkYNACADQcAAcQ0AQQAhACADQYgEcUGABEYNACADQShxQQBHIQALIAJBADsBMCACQQA6AC8gAEUN3wIgAkIANwMgDOACC0EAIQACQCACKAI4IgNFDQAgAygCLCIDRQ0AIAIgAxEAACEACyAARQ3MASAAQRVHDd0CIAJBBDYCHCACIAE2AhQgAkGwGDYCECACQRU2AgxBACEDDKQDCyABIARGBEBBBiEDDKQDCyABQQFqIQFBACEAAkAgAigCOCIDRQ0AIAMoAlQiA0UNACACIAMRAAAhAAsgAA3ZAgwcCyACQgA3AyBBEiEDDIkDCyABIARHDRZBHSEDDKEDCyABIARHBEAgAUEBaiEBQRAhAwyIAwtBByEDDKADCyACIAIpAyAiCiAEIAFrrSILfSIMQgAgCiAMWhs3AyAgCiALWA3UAkEIIQMMnwMLIAEgBEcEQCACQQk2AgggAiABNgIEQRQhAwyGAwtBCSEDDJ4DCyACKQMgQgBSDccBIAIgAi8BMEGAAXI7ATAMQgsgASAERw0/QdAAIQMMnAMLIAEgBEYEQEELIQMMnAMLIAFBAWohAUEAIQACQCACKAI4IgNFDQAgAygCUCIDRQ0AIAIgAxEAACEACyAADc8CDMYBC0EAIQACQCACKAI4IgNFDQAgAygCSCIDRQ0AIAIgAxEAACEACyAARQ3GASAAQRVHDc0CIAJBCzYCHCACIAE2AhQgAkGCGTYCECACQRU2AgxBACEDDJoDC0EAIQACQCACKAI4IgNFDQAgAygCSCIDRQ0AIAIgAxEAACEACyAARQ0MIABBFUcNygIgAkEaNgIcIAIgATYCFCACQYIZNgIQIAJBFTYCDEEAIQMMmQMLQQAhAAJAIAIoAjgiA0UNACADKAJMIgNFDQAgAiADEQAAIQALIABFDcQBIABBFUcNxwIgAkELNgIcIAIgATYCFCACQZEXNgIQIAJBFTYCDEEAIQMMmAMLIAEgBEYEQEEPIQMMmAMLIAEtAAAiAEE7Rg0HIABBDUcNxAIgAUEBaiEBDMMBC0EAIQACQCACKAI4IgNFDQAgAygCTCIDRQ0AIAIgAxEAACEACyAARQ3DASAAQRVHDcICIAJBDzYCHCACIAE2AhQgAkGRFzYCECACQRU2AgxBACEDDJYDCwNAIAEtAABB8DVqLQAAIgBBAUcEQCAAQQJHDcECIAIoAgQhAEEAIQMgAkEANgIEIAIgACABQQFqIgEQLSIADcICDMUBCyAEIAFBAWoiAUcNAAtBEiEDDJUDC0EAIQACQCACKAI4IgNFDQAgAygCTCIDRQ0AIAIgAxEAACEACyAARQ3FASAAQRVHDb0CIAJBGzYCHCACIAE2AhQgAkGRFzYCECACQRU2AgxBACEDDJQDCyABIARGBEBBFiEDDJQDCyACQQo2AgggAiABNgIEQQAhAAJAIAIoAjgiA0UNACADKAJIIgNFDQAgAiADEQAAIQALIABFDcIBIABBFUcNuQIgAkEVNgIcIAIgATYCFCACQYIZNgIQIAJBFTYCDEEAIQMMkwMLIAEgBEcEQANAIAEtAABB8DdqLQAAIgBBAkcEQAJAIABBAWsOBMQCvQIAvgK9AgsgAUEBaiEBQQghAwz8AgsgBCABQQFqIgFHDQALQRUhAwyTAwtBFSEDDJIDCwNAIAEtAABB8DlqLQAAIgBBAkcEQCAAQQFrDgTFArcCwwK4ArcCCyAEIAFBAWoiAUcNAAtBGCEDDJEDCyABIARHBEAgAkELNgIIIAIgATYCBEEHIQMM+AILQRkhAwyQAwsgAUEBaiEBDAILIAEgBEYEQEEaIQMMjwMLAkAgAS0AAEENaw4UtQG/Ab8BvwG/Ab8BvwG/Ab8BvwG/Ab8BvwG/Ab8BvwG/Ab8BvwEAvwELQQAhAyACQQA2AhwgAkGvCzYCECACQQI2AgwgAiABQQFqNgIUDI4DCyABIARGBEBBGyEDDI4DCyABLQAAIgBBO0cEQCAAQQ1HDbECIAFBAWohAQy6AQsgAUEBaiEBC0EiIQMM8wILIAEgBEYEQEEcIQMMjAMLQgAhCgJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkAgAS0AAEEwaw43wQLAAgABAgMEBQYH0AHQAdAB0AHQAdAB0AEICQoLDA3QAdAB0AHQAdAB0AHQAdAB0AHQAdAB0AHQAdAB0AHQAdAB0AHQAdAB0AHQAdAB0AHQAdABDg8QERIT0AELQgIhCgzAAgtCAyEKDL8CC0IEIQoMvgILQgUhCgy9AgtCBiEKDLwCC0IHIQoMuwILQgghCgy6AgtCCSEKDLkCC0IKIQoMuAILQgshCgy3AgtCDCEKDLYCC0INIQoMtQILQg4hCgy0AgtCDyEKDLMCC0IKIQoMsgILQgshCgyxAgtCDCEKDLACC0INIQoMrwILQg4hCgyuAgtCDyEKDK0CC0IAIQoCQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAIAEtAABBMGsON8ACvwIAAQIDBAUGB74CvgK+Ar4CvgK+Ar4CCAkKCwwNvgK+Ar4CvgK+Ar4CvgK+Ar4CvgK+Ar4CvgK+Ar4CvgK+Ar4CvgK+Ar4CvgK+Ar4CvgK+Ag4PEBESE74CC0ICIQoMvwILQgMhCgy+AgtCBCEKDL0CC0IFIQoMvAILQgYhCgy7AgtCByEKDLoCC0IIIQoMuQILQgkhCgy4AgtCCiEKDLcCC0ILIQoMtgILQgwhCgy1AgtCDSEKDLQCC0IOIQoMswILQg8hCgyyAgtCCiEKDLECC0ILIQoMsAILQgwhCgyvAgtCDSEKDK4CC0IOIQoMrQILQg8hCgysAgsgAiACKQMgIgogBCABa60iC30iDEIAIAogDFobNwMgIAogC1gNpwJBHyEDDIkDCyABIARHBEAgAkEJNgIIIAIgATYCBEElIQMM8AILQSAhAwyIAwtBASEFIAIvATAiA0EIcUUEQCACKQMgQgBSIQULAkAgAi0ALgRAQQEhACACLQApQQVGDQEgA0HAAHFFIAVxRQ0BC0EAIQAgA0HAAHENAEECIQAgA0EIcQ0AIANBgARxBEACQCACLQAoQQFHDQAgAi0ALUEKcQ0AQQUhAAwCC0EEIQAMAQsgA0EgcUUEQAJAIAItAChBAUYNACACLwEyIgBB5ABrQeQASQ0AIABBzAFGDQAgAEGwAkYNAEEEIQAgA0EocUUNAiADQYgEcUGABEYNAgtBACEADAELQQBBAyACKQMgUBshAAsgAEEBaw4FvgIAsAEBpAKhAgtBESEDDO0CCyACQQE6AC8MhAMLIAEgBEcNnQJBJCEDDIQDCyABIARHDRxBxgAhAwyDAwtBACEAAkAgAigCOCIDRQ0AIAMoAkQiA0UNACACIAMRAAAhAAsgAEUNJyAAQRVHDZgCIAJB0AA2AhwgAiABNgIUIAJBkRg2AhAgAkEVNgIMQQAhAwyCAwsgASAERgRAQSghAwyCAwtBACEDIAJBADYCBCACQQw2AgggAiABIAEQKiIARQ2UAiACQSc2AhwgAiABNgIUIAIgADYCDAyBAwsgASAERgRAQSkhAwyBAwsgAS0AACIAQSBGDRMgAEEJRw2VAiABQQFqIQEMFAsgASAERwRAIAFBAWohAQwWC0EqIQMM/wILIAEgBEYEQEErIQMM/wILIAEtAAAiAEEJRyAAQSBHcQ2QAiACLQAsQQhHDd0CIAJBADoALAzdAgsgASAERgRAQSwhAwz+AgsgAS0AAEEKRw2OAiABQQFqIQEMsAELIAEgBEcNigJBLyEDDPwCCwNAIAEtAAAiAEEgRwRAIABBCmsOBIQCiAKIAoQChgILIAQgAUEBaiIBRw0AC0ExIQMM+wILQTIhAyABIARGDfoCIAIoAgAiACAEIAFraiEHIAEgAGtBA2ohBgJAA0AgAEHwO2otAAAgAS0AACIFQSByIAUgBUHBAGtB/wFxQRpJG0H/AXFHDQEgAEEDRgRAQQYhAQziAgsgAEEBaiEAIAQgAUEBaiIBRw0ACyACIAc2AgAM+wILIAJBADYCAAyGAgtBMyEDIAQgASIARg35AiAEIAFrIAIoAgAiAWohByAAIAFrQQhqIQYCQANAIAFB9DtqLQAAIAAtAAAiBUEgciAFIAVBwQBrQf8BcUEaSRtB/wFxRw0BIAFBCEYEQEEFIQEM4QILIAFBAWohASAEIABBAWoiAEcNAAsgAiAHNgIADPoCCyACQQA2AgAgACEBDIUCC0E0IQMgBCABIgBGDfgCIAQgAWsgAigCACIBaiEHIAAgAWtBBWohBgJAA0AgAUHQwgBqLQAAIAAtAAAiBUEgciAFIAVBwQBrQf8BcUEaSRtB/wFxRw0BIAFBBUYEQEEHIQEM4AILIAFBAWohASAEIABBAWoiAEcNAAsgAiAHNgIADPkCCyACQQA2AgAgACEBDIQCCyABIARHBEADQCABLQAAQYA+ai0AACIAQQFHBEAgAEECRg0JDIECCyAEIAFBAWoiAUcNAAtBMCEDDPgCC0EwIQMM9wILIAEgBEcEQANAIAEtAAAiAEEgRwRAIABBCmsOBP8B/gH+Af8B/gELIAQgAUEBaiIBRw0AC0E4IQMM9wILQTghAwz2AgsDQCABLQAAIgBBIEcgAEEJR3EN9gEgBCABQQFqIgFHDQALQTwhAwz1AgsDQCABLQAAIgBBIEcEQAJAIABBCmsOBPkBBAT5AQALIABBLEYN9QEMAwsgBCABQQFqIgFHDQALQT8hAwz0AgtBwAAhAyABIARGDfMCIAIoAgAiACAEIAFraiEFIAEgAGtBBmohBgJAA0AgAEGAQGstAAAgAS0AAEEgckcNASAAQQZGDdsCIABBAWohACAEIAFBAWoiAUcNAAsgAiAFNgIADPQCCyACQQA2AgALQTYhAwzZAgsgASAERgRAQcEAIQMM8gILIAJBDDYCCCACIAE2AgQgAi0ALEEBaw4E+wHuAewB6wHUAgsgAUEBaiEBDPoBCyABIARHBEADQAJAIAEtAAAiAEEgciAAIABBwQBrQf8BcUEaSRtB/wFxIgBBCUYNACAAQSBGDQACQAJAAkACQCAAQeMAaw4TAAMDAwMDAwMBAwMDAwMDAwMDAgMLIAFBAWohAUExIQMM3AILIAFBAWohAUEyIQMM2wILIAFBAWohAUEzIQMM2gILDP4BCyAEIAFBAWoiAUcNAAtBNSEDDPACC0E1IQMM7wILIAEgBEcEQANAIAEtAABBgDxqLQAAQQFHDfcBIAQgAUEBaiIBRw0AC0E9IQMM7wILQT0hAwzuAgtBACEAAkAgAigCOCIDRQ0AIAMoAkAiA0UNACACIAMRAAAhAAsgAEUNASAAQRVHDeYBIAJBwgA2AhwgAiABNgIUIAJB4xg2AhAgAkEVNgIMQQAhAwztAgsgAUEBaiEBC0E8IQMM0gILIAEgBEYEQEHCACEDDOsCCwJAA0ACQCABLQAAQQlrDhgAAswCzALRAswCzALMAswCzALMAswCzALMAswCzALMAswCzALMAswCzALMAgDMAgsgBCABQQFqIgFHDQALQcIAIQMM6wILIAFBAWohASACLQAtQQFxRQ3+AQtBLCEDDNACCyABIARHDd4BQcQAIQMM6AILA0AgAS0AAEGQwABqLQAAQQFHDZwBIAQgAUEBaiIBRw0AC0HFACEDDOcCCyABLQAAIgBBIEYN/gEgAEE6Rw3AAiACKAIEIQBBACEDIAJBADYCBCACIAAgARApIgAN3gEM3QELQccAIQMgBCABIgBGDeUCIAQgAWsgAigCACIBaiEHIAAgAWtBBWohBgNAIAFBkMIAai0AACAALQAAIgVBIHIgBSAFQcEAa0H/AXFBGkkbQf8BcUcNvwIgAUEFRg3CAiABQQFqIQEgBCAAQQFqIgBHDQALIAIgBzYCAAzlAgtByAAhAyAEIAEiAEYN5AIgBCABayACKAIAIgFqIQcgACABa0EJaiEGA0AgAUGWwgBqLQAAIAAtAAAiBUEgciAFIAVBwQBrQf8BcUEaSRtB/wFxRw2+AkECIAFBCUYNwgIaIAFBAWohASAEIABBAWoiAEcNAAsgAiAHNgIADOQCCyABIARGBEBByQAhAwzkAgsCQAJAIAEtAAAiAEEgciAAIABBwQBrQf8BcUEaSRtB/wFxQe4Aaw4HAL8CvwK/Ar8CvwIBvwILIAFBAWohAUE+IQMMywILIAFBAWohAUE/IQMMygILQcoAIQMgBCABIgBGDeICIAQgAWsgAigCACIBaiEGIAAgAWtBAWohBwNAIAFBoMIAai0AACAALQAAIgVBIHIgBSAFQcEAa0H/AXFBGkkbQf8BcUcNvAIgAUEBRg2+AiABQQFqIQEgBCAAQQFqIgBHDQALIAIgBjYCAAziAgtBywAhAyAEIAEiAEYN4QIgBCABayACKAIAIgFqIQcgACABa0EOaiEGA0AgAUGiwgBqLQAAIAAtAAAiBUEgciAFIAVBwQBrQf8BcUEaSRtB/wFxRw27AiABQQ5GDb4CIAFBAWohASAEIABBAWoiAEcNAAsgAiAHNgIADOECC0HMACEDIAQgASIARg3gAiAEIAFrIAIoAgAiAWohByAAIAFrQQ9qIQYDQCABQcDCAGotAAAgAC0AACIFQSByIAUgBUHBAGtB/wFxQRpJG0H/AXFHDboCQQMgAUEPRg2+AhogAUEBaiEBIAQgAEEBaiIARw0ACyACIAc2AgAM4AILQc0AIQMgBCABIgBGDd8CIAQgAWsgAigCACIBaiEHIAAgAWtBBWohBgNAIAFB0MIAai0AACAALQAAIgVBIHIgBSAFQcEAa0H/AXFBGkkbQf8BcUcNuQJBBCABQQVGDb0CGiABQQFqIQEgBCAAQQFqIgBHDQALIAIgBzYCAAzfAgsgASAERgRAQc4AIQMM3wILAkACQAJAAkAgAS0AACIAQSByIAAgAEHBAGtB/wFxQRpJG0H/AXFB4wBrDhMAvAK8ArwCvAK8ArwCvAK8ArwCvAK8ArwCAbwCvAK8AgIDvAILIAFBAWohAUHBACEDDMgCCyABQQFqIQFBwgAhAwzHAgsgAUEBaiEBQcMAIQMMxgILIAFBAWohAUHEACEDDMUCCyABIARHBEAgAkENNgIIIAIgATYCBEHFACEDDMUCC0HPACEDDN0CCwJAAkAgAS0AAEEKaw4EAZABkAEAkAELIAFBAWohAQtBKCEDDMMCCyABIARGBEBB0QAhAwzcAgsgAS0AAEEgRw0AIAFBAWohASACLQAtQQFxRQ3QAQtBFyEDDMECCyABIARHDcsBQdIAIQMM2QILQdMAIQMgASAERg3YAiACKAIAIgAgBCABa2ohBiABIABrQQFqIQUDQCABLQAAIABB1sIAai0AAEcNxwEgAEEBRg3KASAAQQFqIQAgBCABQQFqIgFHDQALIAIgBjYCAAzYAgsgASAERgRAQdUAIQMM2AILIAEtAABBCkcNwgEgAUEBaiEBDMoBCyABIARGBEBB1gAhAwzXAgsCQAJAIAEtAABBCmsOBADDAcMBAcMBCyABQQFqIQEMygELIAFBAWohAUHKACEDDL0CC0EAIQACQCACKAI4IgNFDQAgAygCPCIDRQ0AIAIgAxEAACEACyAADb8BQc0AIQMMvAILIAItAClBIkYNzwIMiQELIAQgASIFRgRAQdsAIQMM1AILQQAhAEEBIQFBASEGQQAhAwJAAn8CQAJAAkACQAJAAkACQCAFLQAAQTBrDgrFAcQBAAECAwQFBgjDAQtBAgwGC0EDDAULQQQMBAtBBQwDC0EGDAILQQcMAQtBCAshA0EAIQFBACEGDL0BC0EJIQNBASEAQQAhAUEAIQYMvAELIAEgBEYEQEHdACEDDNMCCyABLQAAQS5HDbgBIAFBAWohAQyIAQsgASAERw22AUHfACEDDNECCyABIARHBEAgAkEONgIIIAIgATYCBEHQACEDDLgCC0HgACEDDNACC0HhACEDIAEgBEYNzwIgAigCACIAIAQgAWtqIQUgASAAa0EDaiEGA0AgAS0AACAAQeLCAGotAABHDbEBIABBA0YNswEgAEEBaiEAIAQgAUEBaiIBRw0ACyACIAU2AgAMzwILQeIAIQMgASAERg3OAiACKAIAIgAgBCABa2ohBSABIABrQQJqIQYDQCABLQAAIABB5sIAai0AAEcNsAEgAEECRg2vASAAQQFqIQAgBCABQQFqIgFHDQALIAIgBTYCAAzOAgtB4wAhAyABIARGDc0CIAIoAgAiACAEIAFraiEFIAEgAGtBA2ohBgNAIAEtAAAgAEHpwgBqLQAARw2vASAAQQNGDa0BIABBAWohACAEIAFBAWoiAUcNAAsgAiAFNgIADM0CCyABIARGBEBB5QAhAwzNAgsgAUEBaiEBQQAhAAJAIAIoAjgiA0UNACADKAIwIgNFDQAgAiADEQAAIQALIAANqgFB1gAhAwyzAgsgASAERwRAA0AgAS0AACIAQSBHBEACQAJAAkAgAEHIAGsOCwABswGzAbMBswGzAbMBswGzAQKzAQsgAUEBaiEBQdIAIQMMtwILIAFBAWohAUHTACEDDLYCCyABQQFqIQFB1AAhAwy1AgsgBCABQQFqIgFHDQALQeQAIQMMzAILQeQAIQMMywILA0AgAS0AAEHwwgBqLQAAIgBBAUcEQCAAQQJrDgOnAaYBpQGkAQsgBCABQQFqIgFHDQALQeYAIQMMygILIAFBAWogASAERw0CGkHnACEDDMkCCwNAIAEtAABB8MQAai0AACIAQQFHBEACQCAAQQJrDgSiAaEBoAEAnwELQdcAIQMMsQILIAQgAUEBaiIBRw0AC0HoACEDDMgCCyABIARGBEBB6QAhAwzIAgsCQCABLQAAIgBBCmsOGrcBmwGbAbQBmwGbAZsBmwGbAZsBmwGbAZsBmwGbAZsBmwGbAZsBmwGbAZsBpAGbAZsBAJkBCyABQQFqCyEBQQYhAwytAgsDQCABLQAAQfDGAGotAABBAUcNfSAEIAFBAWoiAUcNAAtB6gAhAwzFAgsgAUEBaiABIARHDQIaQesAIQMMxAILIAEgBEYEQEHsACEDDMQCCyABQQFqDAELIAEgBEYEQEHtACEDDMMCCyABQQFqCyEBQQQhAwyoAgsgASAERgRAQe4AIQMMwQILAkACQAJAIAEtAABB8MgAai0AAEEBaw4HkAGPAY4BAHwBAo0BCyABQQFqIQEMCwsgAUEBagyTAQtBACEDIAJBADYCHCACQZsSNgIQIAJBBzYCDCACIAFBAWo2AhQMwAILAkADQCABLQAAQfDIAGotAAAiAEEERwRAAkACQCAAQQFrDgeUAZMBkgGNAQAEAY0BC0HaACEDDKoCCyABQQFqIQFB3AAhAwypAgsgBCABQQFqIgFHDQALQe8AIQMMwAILIAFBAWoMkQELIAQgASIARgRAQfAAIQMMvwILIAAtAABBL0cNASAAQQFqIQEMBwsgBCABIgBGBEBB8QAhAwy+AgsgAC0AACIBQS9GBEAgAEEBaiEBQd0AIQMMpQILIAFBCmsiA0EWSw0AIAAhAUEBIAN0QYmAgAJxDfkBC0EAIQMgAkEANgIcIAIgADYCFCACQYwcNgIQIAJBBzYCDAy8AgsgASAERwRAIAFBAWohAUHeACEDDKMCC0HyACEDDLsCCyABIARGBEBB9AAhAwy7AgsCQCABLQAAQfDMAGotAABBAWsOA/cBcwCCAQtB4QAhAwyhAgsgASAERwRAA0AgAS0AAEHwygBqLQAAIgBBA0cEQAJAIABBAWsOAvkBAIUBC0HfACEDDKMCCyAEIAFBAWoiAUcNAAtB8wAhAwy6AgtB8wAhAwy5AgsgASAERwRAIAJBDzYCCCACIAE2AgRB4AAhAwygAgtB9QAhAwy4AgsgASAERgRAQfYAIQMMuAILIAJBDzYCCCACIAE2AgQLQQMhAwydAgsDQCABLQAAQSBHDY4CIAQgAUEBaiIBRw0AC0H3ACEDDLUCCyABIARGBEBB+AAhAwy1AgsgAS0AAEEgRw16IAFBAWohAQxbC0EAIQACQCACKAI4IgNFDQAgAygCOCIDRQ0AIAIgAxEAACEACyAADXgMgAILIAEgBEYEQEH6ACEDDLMCCyABLQAAQcwARw10IAFBAWohAUETDHYLQfsAIQMgASAERg2xAiACKAIAIgAgBCABa2ohBSABIABrQQVqIQYDQCABLQAAIABB8M4Aai0AAEcNcyAAQQVGDXUgAEEBaiEAIAQgAUEBaiIBRw0ACyACIAU2AgAMsQILIAEgBEYEQEH8ACEDDLECCwJAAkAgAS0AAEHDAGsODAB0dHR0dHR0dHR0AXQLIAFBAWohAUHmACEDDJgCCyABQQFqIQFB5wAhAwyXAgtB/QAhAyABIARGDa8CIAIoAgAiACAEIAFraiEFIAEgAGtBAmohBgJAA0AgAS0AACAAQe3PAGotAABHDXIgAEECRg0BIABBAWohACAEIAFBAWoiAUcNAAsgAiAFNgIADLACCyACQQA2AgAgBkEBaiEBQRAMcwtB/gAhAyABIARGDa4CIAIoAgAiACAEIAFraiEFIAEgAGtBBWohBgJAA0AgAS0AACAAQfbOAGotAABHDXEgAEEFRg0BIABBAWohACAEIAFBAWoiAUcNAAsgAiAFNgIADK8CCyACQQA2AgAgBkEBaiEBQRYMcgtB/wAhAyABIARGDa0CIAIoAgAiACAEIAFraiEFIAEgAGtBA2ohBgJAA0AgAS0AACAAQfzOAGotAABHDXAgAEEDRg0BIABBAWohACAEIAFBAWoiAUcNAAsgAiAFNgIADK4CCyACQQA2AgAgBkEBaiEBQQUMcQsgASAERgRAQYABIQMMrQILIAEtAABB2QBHDW4gAUEBaiEBQQgMcAsgASAERgRAQYEBIQMMrAILAkACQCABLQAAQc4Aaw4DAG8BbwsgAUEBaiEBQesAIQMMkwILIAFBAWohAUHsACEDDJICCyABIARGBEBBggEhAwyrAgsCQAJAIAEtAABByABrDggAbm5ubm5uAW4LIAFBAWohAUHqACEDDJICCyABQQFqIQFB7QAhAwyRAgtBgwEhAyABIARGDakCIAIoAgAiACAEIAFraiEFIAEgAGtBAmohBgJAA0AgAS0AACAAQYDPAGotAABHDWwgAEECRg0BIABBAWohACAEIAFBAWoiAUcNAAsgAiAFNgIADKoCCyACQQA2AgAgBkEBaiEBQQAMbQtBhAEhAyABIARGDagCIAIoAgAiACAEIAFraiEFIAEgAGtBBGohBgJAA0AgAS0AACAAQYPPAGotAABHDWsgAEEERg0BIABBAWohACAEIAFBAWoiAUcNAAsgAiAFNgIADKkCCyACQQA2AgAgBkEBaiEBQSMMbAsgASAERgRAQYUBIQMMqAILAkACQCABLQAAQcwAaw4IAGtra2trawFrCyABQQFqIQFB7wAhAwyPAgsgAUEBaiEBQfAAIQMMjgILIAEgBEYEQEGGASEDDKcCCyABLQAAQcUARw1oIAFBAWohAQxgC0GHASEDIAEgBEYNpQIgAigCACIAIAQgAWtqIQUgASAAa0EDaiEGAkADQCABLQAAIABBiM8Aai0AAEcNaCAAQQNGDQEgAEEBaiEAIAQgAUEBaiIBRw0ACyACIAU2AgAMpgILIAJBADYCACAGQQFqIQFBLQxpC0GIASEDIAEgBEYNpAIgAigCACIAIAQgAWtqIQUgASAAa0EIaiEGAkADQCABLQAAIABB0M8Aai0AAEcNZyAAQQhGDQEgAEEBaiEAIAQgAUEBaiIBRw0ACyACIAU2AgAMpQILIAJBADYCACAGQQFqIQFBKQxoCyABIARGBEBBiQEhAwykAgtBASABLQAAQd8ARw1nGiABQQFqIQEMXgtBigEhAyABIARGDaICIAIoAgAiACAEIAFraiEFIAEgAGtBAWohBgNAIAEtAAAgAEGMzwBqLQAARw1kIABBAUYN+gEgAEEBaiEAIAQgAUEBaiIBRw0ACyACIAU2AgAMogILQYsBIQMgASAERg2hAiACKAIAIgAgBCABa2ohBSABIABrQQJqIQYCQANAIAEtAAAgAEGOzwBqLQAARw1kIABBAkYNASAAQQFqIQAgBCABQQFqIgFHDQALIAIgBTYCAAyiAgsgAkEANgIAIAZBAWohAUECDGULQYwBIQMgASAERg2gAiACKAIAIgAgBCABa2ohBSABIABrQQFqIQYCQANAIAEtAAAgAEHwzwBqLQAARw1jIABBAUYNASAAQQFqIQAgBCABQQFqIgFHDQALIAIgBTYCAAyhAgsgAkEANgIAIAZBAWohAUEfDGQLQY0BIQMgASAERg2fAiACKAIAIgAgBCABa2ohBSABIABrQQFqIQYCQANAIAEtAAAgAEHyzwBqLQAARw1iIABBAUYNASAAQQFqIQAgBCABQQFqIgFHDQALIAIgBTYCAAygAgsgAkEANgIAIAZBAWohAUEJDGMLIAEgBEYEQEGOASEDDJ8CCwJAAkAgAS0AAEHJAGsOBwBiYmJiYgFiCyABQQFqIQFB+AAhAwyGAgsgAUEBaiEBQfkAIQMMhQILQY8BIQMgASAERg2dAiACKAIAIgAgBCABa2ohBSABIABrQQVqIQYCQANAIAEtAAAgAEGRzwBqLQAARw1gIABBBUYNASAAQQFqIQAgBCABQQFqIgFHDQALIAIgBTYCAAyeAgsgAkEANgIAIAZBAWohAUEYDGELQZABIQMgASAERg2cAiACKAIAIgAgBCABa2ohBSABIABrQQJqIQYCQANAIAEtAAAgAEGXzwBqLQAARw1fIABBAkYNASAAQQFqIQAgBCABQQFqIgFHDQALIAIgBTYCAAydAgsgAkEANgIAIAZBAWohAUEXDGALQZEBIQMgASAERg2bAiACKAIAIgAgBCABa2ohBSABIABrQQZqIQYCQANAIAEtAAAgAEGazwBqLQAARw1eIABBBkYNASAAQQFqIQAgBCABQQFqIgFHDQALIAIgBTYCAAycAgsgAkEANgIAIAZBAWohAUEV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JSIARQ0RIAJB5QA2AhwgAiABNgIUIAIgADYCDEEAIQMMtAELIAIoAgQhACACQQA2AgQgAiAAIAEQJSIARQ0gIAJB0wA2AhwgAiABNgIUIAIgADYCDEEAIQMMswELIAIoAgQhACACQQA2AgQgAiAAIAEQJSIARQ0iIAJB0gA2AhwgAiABNgIUIAIgADYCDEEAIQMMsgELIAIoAgQhACACQQA2AgQgAiAAIAEQJSIARQ0OIAJB5QA2AhwgAiABNgIUIAIgADYCDEEAIQMMsQELIAIoAgQhACACQQA2AgQgAiAAIAEQJSIARQ0dIAJB0wA2AhwgAiABNgIUIAIgADYCDEEAIQMMsAELIAIoAgQhACACQQA2AgQgAiAAIAEQJSIARQ0fIAJB0gA2AhwgAiABNgIUIAIgADYCDEEAIQMMrwELIABBP0cNASABQQFqCyEBQQUhAwyUAQtBACEDIAJBADYCHCACIAE2AhQgAkH9EjYCECACQQc2AgwMrAELIAJBADYCHCACIAE2AhQgAkHcCDYCECACQQc2AgxBACEDDKsBCyACKAIEIQAgAkEANgIEIAIgACABECUiAEUNByACQeUANgIcIAIgATYCFCACIAA2AgxBACEDDKoBCyACKAIEIQAgAkEANgIEIAIgACABECUiAEUNFiACQdMANgIcIAIgATYCFCACIAA2AgxBACEDDKkBCyACKAIEIQAgAkEANgIEIAIgACABECUiAEUNGCACQdIANgIcIAIgATYCFCACIAA2AgxBACEDDKgBCyACQQA2AhwgAiABNgIUIAJBxgo2AhAgAkEHNgIMQQAhAwynAQsgAigCBCEAIAJBADYCBCACIAAgARAlIgBFDQMgAkHlADYCHCACIAE2AhQgAiAANgIMQQAhAwymAQsgAigCBCEAIAJBADYCBCACIAAgARAlIgBFDRIgAkHTADYCHCACIAE2AhQgAiAANgIMQQAhAwylAQsgAigCBCEAIAJBADYCBCACIAAgARAlIgBFDRQgAkHSADYCHCACIAE2AhQgAiAANgIMQQAhAwykAQsgAigCBCEAIAJBADYCBCACIAAgARAlIgBFDQAgAkHlADYCHCACIAE2AhQgAiAANgIMQQAhAwyjAQtB1QAhAwyJAQsgAEEVRwRAIAJBADYCHCACIAE2AhQgAkG5DTYCECACQRo2AgxB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AkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAIABB5ABrDvQDY2IAAWFhYWFhYQIDBAVhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhBgcICQoLDA0OD2FhYWFhEGFhYWFhYWFhYWFhEWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYRITFBUWFxgZGhthYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhHB0eHyAhIiMkJSYnKCkqKywtLi8wMTIzNDU2YTc4OTphYWFhYWFhYTthYWE8YWFhYT0+P2FhYWFhYWFhQGFhQWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYUJDREVGR0hJSktMTU5PUFFSU2FhYWFhYWFhVFVWV1hZWlthXF1hYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFeYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhX2BhC0HhJw8LQaQhDwtByywPC0H+MQ8LQcAkDwtBqyQPC0GNKA8LQeImDwtBgDAPC0G5Lw8LQdckDwtB7x8PC0HhHw8LQfofDwtB8iAPC0GoLw8LQa4yDwtBiDAPC0HsJw8LQYIiDwtBjh0PC0HQLg8LQcojDwtBxTIPC0HfHA8LQdIcDwtBxCAPC0HXIA8LQaIfDwtB7S4PC0GrMA8LQdQlDwtBzC4PC0H6Lg8LQfwrDwtB0jAPC0HxHQ8LQbsgDwtB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CABB3AgLii1JbnZhbGlkIGNoYXIgaW4gdXJsIHF1ZXJ5AFNwYW4gY2FsbGJhY2sgZXJyb3IgaW4gb25fYm9keQBDb250ZW50LUxlbmd0aCBvdmVyZmxvdwBDaHVuayBzaXplIG92ZXJmbG93AFJlc3BvbnNlIG92ZXJmbG93AEludmFsaWQgbWV0aG9kIGZvciBIVFRQL3gueCByZXF1ZXN0AEludmFsaWQgbWV0aG9kIGZvciBSVFNQL3gueCByZXF1ZXN0AEV4cGVjdGVkIFNPVVJDRSBtZXRob2QgZm9yIElDRS94LnggcmVxdWVzdABJbnZhbGlkIGNoYXIgaW4gdXJsIGZyYWdtZW50IHN0YXJ0AEV4cGVjdGVkIGRvdABTcGFuIGNhbGxiYWNrIGVycm9yIGluIG9uX3N0YXR1cwBJbnZhbGlkIHJlc3BvbnNlIHN0YXR1cwBJbnZhbGlkIGNoYXJhY3RlciBpbiBjaHVuayBleHRlbnNpb25zAFVzZXIgY2FsbGJhY2sgZXJyb3IAYG9uX3Jlc2V0YCBjYWxsYmFjayBlcnJvcgBgb25fY2h1bmtfaGVhZGVyYCBjYWxsYmFjayBlcnJvcgBgb25fbWVzc2FnZV9iZWdpbmAgY2FsbGJhY2sgZXJyb3IAYG9uX2NodW5rX2V4dGVuc2lvbl92YWx1ZWAgY2FsbGJhY2sgZXJyb3IAYG9uX3N0YXR1c19jb21wbGV0ZWAgY2FsbGJhY2sgZXJyb3IAYG9uX3ZlcnNpb25fY29tcGxldGVgIGNhbGxiYWNrIGVycm9yAGBvbl91cmxfY29tcGxldGVgIGNhbGxiYWNrIGVycm9yAGBvbl9jaHVua19jb21wbGV0ZWAgY2FsbGJhY2sgZXJyb3IAYG9uX2hlYWRlcl92YWx1ZV9jb21wbGV0ZWAgY2FsbGJhY2sgZXJyb3IAYG9uX21lc3NhZ2VfY29tcGxldGVgIGNhbGxiYWNrIGVycm9yAGBvbl9tZXRob2RfY29tcGxldGVgIGNhbGxiYWNrIGVycm9yAGBvbl9oZWFkZXJfZmllbGRfY29tcGxldGVgIGNhbGxiYWNrIGVycm9yAGBvbl9jaHVua19leHRlbnNpb25fbmFtZWAgY2FsbGJhY2sgZXJyb3IAVW5leHBlY3RlZCBjaGFyIGluIHVybCBzZXJ2ZXIASW52YWxpZCBoZWFkZXIgdmFsdWUgY2hhcgBJbnZhbGlkIGhlYWRlciBmaWVsZCBjaGFyAFNwYW4gY2FsbGJhY2sgZXJyb3IgaW4gb25fdmVyc2lvbgBJbnZhbGlkIG1pbm9yIHZlcnNpb24ASW52YWxpZCBtYWpvciB2ZXJzaW9uAEV4cGVjdGVkIHNwYWNlIGFmdGVyIHZlcnNpb24ARXhwZWN0ZWQgQ1JMRiBhZnRlciB2ZXJzaW9uAEludmFsaWQgSFRUUCB2ZXJzaW9uAEludmFsaWQgaGVhZGVyIHRva2VuAFNwYW4gY2FsbGJhY2sgZXJyb3IgaW4gb25fdXJsAEludmFsaWQgY2hhcmFjdGVycyBpbiB1cmwAVW5leHBlY3RlZCBzdGFydCBjaGFyIGluIHVybABEb3VibGUgQCBpbiB1cmwARW1wdHkgQ29udGVudC1MZW5ndGgASW52YWxpZCBjaGFyYWN0ZXIgaW4gQ29udGVudC1MZW5ndGgARHVwbGljYXRlIENvbnRlbnQtTGVuZ3RoAEludmFsaWQgY2hhciBpbiB1cmwgcGF0aABDb250ZW50LUxlbmd0aCBjYW4ndCBiZSBwcmVzZW50IHdpdGggVHJhbnNmZXItRW5jb2RpbmcASW52YWxpZCBjaGFyYWN0ZXIgaW4gY2h1bmsgc2l6ZQBTcGFuIGNhbGxiYWNrIGVycm9yIGluIG9uX2hlYWRlcl92YWx1ZQBTcGFuIGNhbGxiYWNrIGVycm9yIGluIG9uX2NodW5rX2V4dGVuc2lvbl92YWx1ZQBJbnZhbGlkIGNoYXJhY3RlciBpbiBjaHVuayBleHRlbnNpb25zIHZhbHVlAE1pc3NpbmcgZXhwZWN0ZWQgTEYgYWZ0ZXIgaGVhZGVyIHZhbHVlAEludmFsaWQgYFRyYW5zZmVyLUVuY29kaW5nYCBoZWFkZXIgdmFsdWUASW52YWxpZCBjaGFyYWN0ZXIgaW4gY2h1bmsgZXh0ZW5zaW9ucyBxdW90ZSB2YWx1ZQBJbnZhbGlkIGNoYXJhY3RlciBpbiBjaHVuayBleHRlbnNpb25zIHF1b3RlZCB2YWx1ZQBQYXVzZWQgYnkgb25faGVhZGVyc19jb21wbGV0ZQBJbnZhbGlkIEVPRiBzdGF0ZQBvbl9yZXNldCBwYXVzZQBvbl9jaHVua19oZWFkZXIgcGF1c2UAb25fbWVzc2FnZV9iZWdpbiBwYXVzZQBvbl9jaHVua19leHRlbnNpb25fdmFsdWUgcGF1c2UAb25fc3RhdHVzX2NvbXBsZXRlIHBhdXNlAG9uX3ZlcnNpb25fY29tcGxldGUgcGF1c2UAb25fdXJsX2NvbXBsZXRlIHBhdXNlAG9uX2NodW5rX2NvbXBsZXRlIHBhdXNlAG9uX2hlYWRlcl92YWx1ZV9jb21wbGV0ZSBwYXVzZQBvbl9tZXNzYWdlX2NvbXBsZXRlIHBhdXNlAG9uX21ldGhvZF9jb21wbGV0ZSBwYXVzZQBvbl9oZWFkZXJfZmllbGRfY29tcGxldGUgcGF1c2UAb25fY2h1bmtfZXh0ZW5zaW9uX25hbWUgcGF1c2UAVW5leHBlY3RlZCBzcGFjZSBhZnRlciBzdGFydCBsaW5lAFNwYW4gY2FsbGJhY2sgZXJyb3IgaW4gb25fY2h1bmtfZXh0ZW5zaW9uX25hbWUASW52YWxpZCBjaGFyYWN0ZXIgaW4gY2h1bmsgZXh0ZW5zaW9ucyBuYW1lAFBhdXNlIG9uIENPTk5FQ1QvVXBncmFkZQBQYXVzZSBvbiBQUkkvVXBncmFkZQBFeHBlY3RlZCBIVFRQLzIgQ29ubmVjdGlvbiBQcmVmYWNlAFNwYW4gY2FsbGJhY2sgZXJyb3IgaW4gb25fbWV0aG9kAEV4cGVjdGVkIHNwYWNlIGFmdGVyIG1ldGhvZABTcGFuIGNhbGxiYWNrIGVycm9yIGluIG9uX2hlYWRlcl9maWVsZABQYXVzZWQASW52YWxpZCB3b3JkIGVuY291bnRlcmVkAEludmFsaWQgbWV0aG9kIGVuY291bnRlcmVkAFVuZXhwZWN0ZWQgY2hhciBpbiB1cmwgc2NoZW1hAFJlcXVlc3QgaGFzIGludmFsaWQgYFRyYW5zZmVyLUVuY29kaW5nYABTV0lUQ0hfUFJPWFkAVVNFX1BST1hZAE1LQUNUSVZJVFkAVU5QUk9DRVNTQUJMRV9FTlRJVFkAQ09QWQBNT1ZFRF9QRVJNQU5FTlRMWQBUT09fRUFSTFkATk9USUZZAEZBSUxFRF9ERVBFTkRFTkNZAEJBRF9HQVRFV0FZAFBMQVkAUFVUAENIRUNLT1VUAEdBVEVXQVlfVElNRU9VVABSRVFVRVNUX1RJTUVPVVQATkVUV09SS19DT05ORUNUX1RJTUVPVVQAQ09OTkVDVElPTl9USU1FT1VUAExPR0lOX1RJTUVPVVQATkVUV09SS19SRUFEX1RJTUVPVVQAUE9TVABNSVNESVJFQ1RFRF9SRVFVRVNUAENMSUVOVF9DTE9TRURfUkVRVUVTVABDTElFTlRfQ0xPU0VEX0xPQURfQkFMQU5DRURfUkVRVUVTVABCQURfUkVRVUVTVABIVFRQX1JFUVVFU1RfU0VOVF9UT19IVFRQU19QT1JUAFJFUE9SVABJTV9BX1RFQVBPVABSRVNFVF9DT05URU5UAE5PX0NPTlRFTlQAUEFSVElBTF9DT05URU5UAEhQRV9JTlZBTElEX0NPTlNUQU5UAEhQRV9DQl9SRVNFVABHRVQASFBFX1NUUklDVABDT05GTElDVABURU1QT1JBUllfUkVESVJFQ1QAUEVSTUFORU5UX1JFRElSRUNUAENPTk5FQ1QATVVMVElfU1RBVFVTAEhQRV9JTlZBTElEX1NUQVRVUwBUT09fTUFOWV9SRVFVRVNUUwBFQVJMWV9ISU5UUwBVTkFWQUlMQUJMRV9GT1JfTEVHQUxfUkVBU09OUwBPUFRJT05TAFNXSVRDSElOR19QUk9UT0NPTFMAVkFSSUFOVF9BTFNPX05FR09USUFURVMATVVMVElQTEVfQ0hPSUNFUwBJTlRFUk5BTF9TRVJWRVJfRVJST1IAV0VCX1NFUlZFUl9VTktOT1dOX0VSUk9SAFJBSUxHVU5fRVJST1IASURFTlRJVFlfUFJPVklERVJfQVVUSEVOVElDQVRJT05fRVJST1IAU1NMX0NFUlRJRklDQVRFX0VSUk9SAElOVkFMSURfWF9GT1JXQVJERURfRk9SAFNFVF9QQVJBTUVURVIAR0VUX1BBUkFNRVRFUgBIUEVfVVNFUgBTRUVfT1RIRVIASFBFX0NCX0NIVU5LX0hFQURFUgBNS0NBTEVOREFSAFNFVFVQAFdFQl9TRVJWRVJfSVNfRE9XTgBURUFSRE9XTgBIUEVfQ0xPU0VEX0NPTk5FQ1RJT04ASEVVUklTVElDX0VYUElSQVRJT04ARElTQ09OTkVDVEVEX09QRVJBVElPTgBOT05fQVVUSE9SSVRBVElWRV9JTkZPUk1BVElPTgBIUEVfSU5WQUxJRF9WRVJTSU9OAEhQRV9DQl9NRVNTQUdFX0JFR0lOAFNJVEVfSVNfRlJPWkVOAEhQRV9JTlZBTElEX0hFQURFUl9UT0tFTgBJTlZBTElEX1RPS0VOAEZPUkJJRERFTgBFTkhBTkNFX1lPVVJfQ0FMTQBIUEVfSU5WQUxJRF9VUkwAQkxPQ0tFRF9CWV9QQVJFTlRBTF9DT05UUk9MAE1LQ09MAEFDTABIUEVfSU5URVJOQUwAUkVRVUVTVF9IRUFERVJfRklFTERTX1RPT19MQVJHRV9VTk9GRklDSUFMAEhQRV9PSwBVTkxJTksAVU5MT0NLAFBSSQBSRVRSWV9XSVRIAEhQRV9JTlZBTElEX0NPTlRFTlRfTEVOR1RIAEhQRV9VTkVYUEVDVEVEX0NPTlRFTlRfTEVOR1RIAEZMVVNIAFBST1BQQVRDSABNLVNFQVJDSABVUklfVE9PX0xPTkcAUFJPQ0VTU0lORwBNSVNDRUxMQU5FT1VTX1BFUlNJU1RFTlRfV0FSTklORwBNSVNDRUxMQU5FT1VTX1dBUk5JTkcASFBFX0lOVkFMSURfVFJBTlNGRVJfRU5DT0RJTkcARXhwZWN0ZWQgQ1JMRgBIUEVfSU5WQUxJRF9DSFVOS19TSVpFAE1PVkUAQ09OVElOVUUASFBFX0NCX1NUQVRVU19DT01QTEVURQBIUEVfQ0JfSEVBREVSU19DT01QTEVURQBIUEVfQ0JfVkVSU0lPTl9DT01QTEVURQBIUEVfQ0JfVVJMX0NPTVBMRVRFAEhQRV9DQl9DSFVOS19DT01QTEVURQBIUEVfQ0JfSEVBREVSX1ZBTFVFX0NPTVBMRVRFAEhQRV9DQl9DSFVOS19FWFRFTlNJT05fVkFMVUVfQ09NUExFVEUASFBFX0NCX0NIVU5LX0VYVEVOU0lPTl9OQU1FX0NPTVBMRVRFAEhQRV9DQl9NRVNTQUdFX0NPTVBMRVRFAEhQRV9DQl9NRVRIT0RfQ09NUExFVEUASFBFX0NCX0hFQURFUl9GSUVMRF9DT01QTEVURQBERUxFVEUASFBFX0lOVkFMSURfRU9GX1NUQVRFAElOVkFMSURfU1NMX0NFUlRJRklDQVRFAFBBVVNFAE5PX1JFU1BPTlNFAFVOU1VQUE9SVEVEX01FRElBX1RZUEUAR09ORQBOT1RfQUNDRVBUQUJMRQBTRVJWSUNFX1VOQVZBSUxBQkxFAFJBTkdFX05PVF9TQVRJU0ZJQUJMRQBPUklHSU5fSVNfVU5SRUFDSEFCTEUAUkVTUE9OU0VfSVNfU1RBTEUAUFVSR0UATUVSR0UAUkVRVUVTVF9IRUFERVJfRklFTERTX1RPT19MQVJHRQBSRVFVRVNUX0hFQURFUl9UT09fTEFSR0UAUEFZTE9BRF9UT09fTEFSR0UASU5TVUZGSUNJRU5UX1NUT1JBR0UASFBFX1BBVVNFRF9VUEdSQURFAEhQRV9QQVVTRURfSDJfVVBHUkFERQBTT1VSQ0UAQU5OT1VOQ0UAVFJBQ0UASFBFX1VORVhQRUNURURfU1BBQ0UAREVTQ1JJQkUAVU5TVUJTQ1JJQkUAUkVDT1JEAEhQRV9JTlZBTElEX01FVEhPRABOT1RfRk9VTkQAUFJPUEZJTkQAVU5CSU5EAFJFQklORABVTkFVVEhPUklaRUQATUVUSE9EX05PVF9BTExPV0VEAEhUVFBfVkVSU0lPTl9OT1RfU1VQUE9SVEVEAEFMUkVBRFlfUkVQT1JURUQAQUNDRVBURUQATk9UX0lNUExFTUVOVEVEAExPT1BfREVURUNURUQASFBFX0NSX0VYUEVDVEVEAEhQRV9MRl9FWFBFQ1RFRABDUkVBVEVEAElNX1VTRUQASFBFX1BBVVNFRABUSU1FT1VUX09DQ1VSRUQAUEFZTUVOVF9SRVFVSVJFRABQUkVDT05ESVRJT05fUkVRVUlSRUQAUFJPWFlfQVVUSEVOVElDQVRJT05fUkVRVUlSRUQATkVUV09SS19BVVRIRU5USUNBVElPTl9SRVFVSVJFRABMRU5HVEhfUkVRVUlSRUQAU1NMX0NFUlRJRklDQVRFX1JFUVVJUkVEAFVQR1JBREVfUkVRVUlSRUQAUEFHRV9FWFBJUkVEAFBSRUNPTkRJVElPTl9GQUlMRUQARVhQRUNUQVRJT05fRkFJTEVEAFJFVkFMSURBVElPTl9GQUlMRUQAU1NMX0hBTkRTSEFLRV9GQUlMRUQATE9DS0VEAFRSQU5TRk9STUFUSU9OX0FQUExJRUQATk9UX01PRElGSUVEAE5PVF9FWFRFTkRFRABCQU5EV0lEVEhfTElNSVRfRVhDRUVERUQAU0lURV9JU19PVkVSTE9BREVEAEhFQUQARXhwZWN0ZWQgSFRUUC8AAF4TAAAmEwAAMBAAAPAXAACdEwAAFRIAADkXAADwEgAAChAAAHUSAACtEgAAghMAAE8UAAB/EAAAoBUAACMUAACJEgAAixQAAE0VAADUEQAAzxQAABAYAADJFgAA3BYAAMERAADgFwAAuxQAAHQUAAB8FQAA5RQAAAgXAAAfEAAAZRUAAKMUAAAoFQAAAhUAAJkVAAAsEAAAixkAAE8PAADUDgAAahAAAM4QAAACFwAAiQ4AAG4TAAAcEwAAZhQAAFYXAADBEwAAzRMAAGwTAABoFwAAZhcAAF8XAAAiEwAAzg8AAGkOAADYDgAAYxYAAMsTAACqDgAAKBcAACYXAADFEwAAXRYAAOgRAABnEwAAZRMAAPIWAABzEwAAHRcAAPkWAADzEQAAzw4AAM4VAAAMEgAAsxEAAKURAABhEAAAMhcAALsTAEH5NQsBAQBBkDYL4AEBAQIBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEAAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQBB/TcLAQEAQZE4C14CAwICAgICAAACAgACAgACAgICAgICAgICAAQAAAAAAAICAgICAgICAgICAgICAgICAgICAgICAgICAAAAAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAAgACAEH9OQsBAQBBkToLXgIAAgICAgIAAAICAAICAAICAgICAgICAgIAAwAEAAAAAgICAgICAgICAgICAgICAgICAgICAgICAgIAAAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgACAAIAQfA7Cw1sb3NlZWVwLWFsaXZlAEGJPAsBAQBBoDwL4AEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQABAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQBBiT4LAQEAQaA+C+cBAQEBAQEBAQEBAQEBAgEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEAAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQFjaHVua2VkAEGwwAALXwEBAAEBAQEBAAABAQABAQABAQEBAQEBAQEBAAAAAAAAAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAAAAAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEAAQABAEGQwgALIWVjdGlvbmVudC1sZW5ndGhvbnJveHktY29ubmVjdGlvbgBBwMIACy1yYW5zZmVyLWVuY29kaW5ncGdyYWRlDQoNCg0KU00NCg0KVFRQL0NFL1RTUC8AQfnCAAsFAQIAAQMAQZDDAAvgAQQBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAEH5xAALBQECAAEDAEGQxQAL4AEEAQEFAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQABAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQBB+cYACwQBAAABAEGRxwAL3wEBAQABAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEAAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAEH6yAALBAEAAAIAQZDJAAtfAwQAAAQEBAQEBAQEBAQEBQQEBAQEBAQEBAQEBAAEAAYHBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEAAQABAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAAAAAQAQfrKAAsEAQAAAQBBkMsACwEBAEGqywALQQIAAAAAAAADAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwAAAAAAAAMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAEH6zAALBAEAAAEAQZDNAAsBAQBBms0ACwYCAAAAAAIAQbHNAAs6AwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMAAAAAAAADAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwBB8M4AC5YBTk9VTkNFRUNLT1VUTkVDVEVURUNSSUJFTFVTSEVURUFEU0VBUkNIUkdFQ1RJVklUWUxFTkRBUlZFT1RJRllQVElPTlNDSFNFQVlTVEFUQ0hHRU9SRElSRUNUT1JUUkNIUEFSQU1FVEVSVVJDRUJTQ1JJQkVBUkRPV05BQ0VJTkROS0NLVUJTQ1JJQkVIVFRQL0FEVFAv", "base64");
}));
//#endregion
//#region node_modules/.pnpm/undici@6.28.0/node_modules/undici/lib/llhttp/llhttp_simd-wasm.js
var require_llhttp_simd_wasm = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const { Buffer: Buffer$2 } = __require("node:buffer");
	module.exports = Buffer$2.from("AGFzbQEAAAABJwdgAX8Bf2ADf39/AX9gAX8AYAJ/fwBgBH9/f38Bf2AAAGADf39/AALLAQgDZW52GHdhc21fb25faGVhZGVyc19jb21wbGV0ZQAEA2VudhV3YXNtX29uX21lc3NhZ2VfYmVnaW4AAANlbnYLd2FzbV9vbl91cmwAAQNlbnYOd2FzbV9vbl9zdGF0dXMAAQNlbnYUd2FzbV9vbl9oZWFkZXJfZmllbGQAAQNlbnYUd2FzbV9vbl9oZWFkZXJfdmFsdWUAAQNlbnYMd2FzbV9vbl9ib2R5AAEDZW52GHdhc21fb25fbWVzc2FnZV9jb21wbGV0ZQAAAy0sBQYAAAIAAAAAAAACAQIAAgICAAADAAAAAAMDAwMBAQEBAQEBAQEAAAIAAAAEBQFwARISBQMBAAIGCAF/AUGA1AQLB9EFIgZtZW1vcnkCAAtfaW5pdGlhbGl6ZQAIGV9faW5kaXJlY3RfZnVuY3Rpb25fdGFibGUBAAtsbGh0dHBfaW5pdAAJGGxsaHR0cF9zaG91bGRfa2VlcF9hbGl2ZQAvDGxsaHR0cF9hbGxvYwALBm1hbGxvYwAxC2xsaHR0cF9mcmVlAAwEZnJlZQAMD2xsaHR0cF9nZXRfdHlwZQANFWxsaHR0cF9nZXRfaHR0cF9tYWpvcgAOFWxsaHR0cF9nZXRfaHR0cF9taW5vcgAPEWxsaHR0cF9nZXRfbWV0aG9kABAWbGxodHRwX2dldF9zdGF0dXNfY29kZQAREmxsaHR0cF9nZXRfdXBncmFkZQASDGxsaHR0cF9yZXNldAATDmxsaHR0cF9leGVjdXRlABQUbGxodHRwX3NldHRpbmdzX2luaXQAFQ1sbGh0dHBfZmluaXNoABYMbGxodHRwX3BhdXNlABcNbGxodHRwX3Jlc3VtZQAYG2xsaHR0cF9yZXN1bWVfYWZ0ZXJfdXBncmFkZQAZEGxsaHR0cF9nZXRfZXJybm8AGhdsbGh0dHBfZ2V0X2Vycm9yX3JlYXNvbgAbF2xsaHR0cF9zZXRfZXJyb3JfcmVhc29uABwUbGxodHRwX2dldF9lcnJvcl9wb3MAHRFsbGh0dHBfZXJybm9fbmFtZQAeEmxsaHR0cF9tZXRob2RfbmFtZQAfEmxsaHR0cF9zdGF0dXNfbmFtZQAgGmxsaHR0cF9zZXRfbGVu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PgtBhwEMPQtBiAEMPAtBiQEMOwtBigEMOgtBiwEMOQtBjAEMOAtBjQEMNwtBjgEMNgtBjwEMNQtBkAEMNAtBkQEMMwtBkgEMMgtBkwEMMQtBlAEMMAtBlQEMLwtBlgEMLgtBlwEMLQtBmAEMLAtBmQEMKwtBmgEMKgtBmwEMKQtBnAEMKAtBnQEMJwtBngEMJgtBnwEMJQtBoAEMJAtBoQEMIwtBogEMIgtBowEMIQtBpAEMIAtBpQEMHwtBpgEMHgtBpwEMHQtBqAEMHAtBqQEMGwtBqgEMGgtBqwEMGQtBrAEMGAtBrQEMFwtBrgEMFgtBAQwVC0GvAQwUC0GwAQwTC0GxAQwSC0GzAQwRC0GyAQwQC0G0AQwPC0G1AQwOC0G2AQwNC0G3AQwMC0G4AQwLC0G5AQwKC0G6AQwJC0G7AQwIC0HGAQwHC0G8AQwGC0G9AQwFC0G+AQwEC0G/AQwDC0HAAQwCC0HCAQwBC0HBAQshAwNAAkACQAJAAkACQAJAAkACQAJAIAICfwJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJ/AkACQAJAAkACQAJAAkACQAJAAkACQAJAAkAgAgJ/AkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACfwJAAkACfwJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkAC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iQEhAwykAgtBASABLQAAQd8ARw1nGiABQQFqIQEMXgtBigEhAyABIARGDaICIAIoAgAiACAEIAFraiEFIAEgAGtBAWohBgNAIAEtAAAgAEGMzwBqLQAARw1kIABBAUYN+gEgAEEBaiEAIAQgAUEBaiIBRw0ACyACIAU2AgAMogILQYsBIQMgASAERg2hAiACKAIAIgAgBCABa2ohBSABIABrQQJqIQYCQANAIAEtAAAgAEGOzwBqLQAARw1kIABBAkYNASAAQQFqIQAgBCABQQFqIgFHDQALIAIgBTYCAAyiAgsgAkEANgIAIAZBAWohAUECDGULQYwBIQMgASAERg2gAiACKAIAIgAgBCABa2ohBSABIABrQQFqIQYCQANAIAEtAAAgAEHwzwBqLQAARw1jIABBAUYNASAAQQFqIQAgBCABQQFqIgFHDQALIAIgBTYCAAyhAgsgAkEANgIAIAZBAWohAUEfDGQLQY0BIQMgASAERg2fAiACKAIAIgAgBCABa2ohBSABIABrQQFqIQYCQANAIAEtAAAgAEHyzwBqLQAARw1iIABBAUYNASAAQQFqIQAgBCABQQFqIgFHDQALIAIgBTYCAAygAgsgAkEANgIAIAZBAWohAUEJDGMLIAEgBEYEQEGOASEDDJ8CCwJAAkAgAS0AAEHJAGsOBwBiYmJiYgFiCyABQQFqIQFB+AAhAwyGAgsgAUEBaiEBQfkAIQMMhQILQY8BIQMgASAERg2dAiACKAIAIgAgBCABa2ohBSABIABrQQVqIQYCQANAIAEtAAAgAEGRzwBqLQAARw1gIABBBUYNASAAQQFqIQAgBCABQQFqIgFHDQALIAIgBTYCAAyeAgsgAkEANgIAIAZBAWohAUEYDGELQZABIQMgASAERg2cAiACKAIAIgAgBCABa2ohBSABIABrQQJqIQYCQANAIAEtAAAgAEGXzwBqLQAARw1fIABBAkYNASAAQQFqIQAgBCABQQFqIgFHDQALIAIgBTYCAAydAgsgAkEANgIAIAZBAWohAUEXDGALQZEBIQMgASAERg2bAiACKAIAIgAgBCABa2ohBSABIABrQQZqIQYCQANAIAEtAAAgAEGazwBqLQAARw1eIABBBkYNASAAQQFqIQAgBCABQQFqIgFHDQALIAIgBTYCAAycAgsgAkEANgIAIAZBAWohAUEV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JSIARQ0RIAJB5QA2AhwgAiABNgIUIAIgADYCDEEAIQMMtAELIAIoAgQhACACQQA2AgQgAiAAIAEQJSIARQ0gIAJB0wA2AhwgAiABNgIUIAIgADYCDEEAIQMMswELIAIoAgQhACACQQA2AgQgAiAAIAEQJSIARQ0iIAJB0gA2AhwgAiABNgIUIAIgADYCDEEAIQMMsgELIAIoAgQhACACQQA2AgQgAiAAIAEQJSIARQ0OIAJB5QA2AhwgAiABNgIUIAIgADYCDEEAIQMMsQELIAIoAgQhACACQQA2AgQgAiAAIAEQJSIARQ0dIAJB0wA2AhwgAiABNgIUIAIgADYCDEEAIQMMsAELIAIoAgQhACACQQA2AgQgAiAAIAEQJSIARQ0fIAJB0gA2AhwgAiABNgIUIAIgADYCDEEAIQMMrwELIABBP0cNASABQQFqCyEBQQUhAwyUAQtBACEDIAJBADYCHCACIAE2AhQgAkH9EjYCECACQQc2AgwMrAELIAJBADYCHCACIAE2AhQgAkHcCDYCECACQQc2AgxBACEDDKsBCyACKAIEIQAgAkEANgIEIAIgACABECUiAEUNByACQeUANgIcIAIgATYCFCACIAA2AgxBACEDDKoBCyACKAIEIQAgAkEANgIEIAIgACABECUiAEUNFiACQdMANgIcIAIgATYCFCACIAA2AgxBACEDDKkBCyACKAIEIQAgAkEANgIEIAIgACABECUiAEUNGCACQdIANgIcIAIgATYCFCACIAA2AgxBACEDDKgBCyACQQA2AhwgAiABNgIUIAJBxgo2AhAgAkEHNgIMQQAhAwynAQsgAigCBCEAIAJBADYCBCACIAAgARAlIgBFDQMgAkHlADYCHCACIAE2AhQgAiAANgIMQQAhAwymAQsgAigCBCEAIAJBADYCBCACIAAgARAlIgBFDRIgAkHTADYCHCACIAE2AhQgAiAANgIMQQAhAwylAQsgAigCBCEAIAJBADYCBCACIAAgARAlIgBFDRQgAkHSADYCHCACIAE2AhQgAiAANgIMQQAhAwykAQsgAigCBCEAIAJBADYCBCACIAAgARAlIgBFDQAgAkHlADYCHCACIAE2AhQgAiAANgIMQQAhAwyjAQtB1QAhAwyJAQsgAEEVRwRAIAJBADYCHCACIAE2AhQgAkG5DTYCECACQRo2AgxB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AkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAIABB5ABrDvQDY2IAAWFhYWFhYQIDBAVhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhBgcICQoLDA0OD2FhYWFhEGFhYWFhYWFhYWFhEWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYRITFBUWFxgZGhthYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhHB0eHyAhIiMkJSYnKCkqKywtLi8wMTIzNDU2YTc4OTphYWFhYWFhYTthYWE8YWFhYT0+P2FhYWFhYWFhQGFhQWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYUJDREVGR0hJSktMTU5PUFFSU2FhYWFhYWFhVFVWV1hZWlthXF1hYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFeYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhX2BhC0HhJw8LQaQhDwtByywPC0H+MQ8LQcAkDwtBqyQPC0GNKA8LQeImDwtBgDAPC0G5Lw8LQdckDwtB7x8PC0HhHw8LQfofDwtB8iAPC0GoLw8LQa4yDwtBiDAPC0HsJw8LQYIiDwtBjh0PC0HQLg8LQcojDwtBxTIPC0HfHA8LQdIcDwtBxCAPC0HXIA8LQaIfDwtB7S4PC0GrMA8LQdQlDwtBzC4PC0H6Lg8LQfwrDwtB0jAPC0HxHQ8LQbsgDwtB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AAADAEGUCAsFBAAAAAUAQaQICwkGAAAABwAAAAgAQdwIC4otSW52YWxpZCBjaGFyIGluIHVybCBxdWVyeQBTcGFuIGNhbGxiYWNrIGVycm9yIGluIG9uX2JvZHkAQ29udGVudC1MZW5ndGggb3ZlcmZsb3cAQ2h1bmsgc2l6ZSBvdmVyZmxvdwBSZXNwb25zZSBvdmVyZmxvdwBJbnZhbGlkIG1ldGhvZCBmb3IgSFRUUC94LnggcmVxdWVzdABJbnZhbGlkIG1ldGhvZCBmb3IgUlRTUC94LnggcmVxdWVzdABFeHBlY3RlZCBTT1VSQ0UgbWV0aG9kIGZvciBJQ0UveC54IHJlcXVlc3QASW52YWxpZCBjaGFyIGluIHVybCBmcmFnbWVudCBzdGFydABFeHBlY3RlZCBkb3QAU3BhbiBjYWxsYmFjayBlcnJvciBpbiBvbl9zdGF0dXMASW52YWxpZCByZXNwb25zZSBzdGF0dXMASW52YWxpZCBjaGFyYWN0ZXIgaW4gY2h1bmsgZXh0ZW5zaW9ucwBVc2VyIGNhbGxiYWNrIGVycm9yAGBvbl9yZXNldGAgY2FsbGJhY2sgZXJyb3IAYG9uX2NodW5rX2hlYWRlcmAgY2FsbGJhY2sgZXJyb3IAYG9uX21lc3NhZ2VfYmVnaW5gIGNhbGxiYWNrIGVycm9yAGBvbl9jaHVua19leHRlbnNpb25fdmFsdWVgIGNhbGxiYWNrIGVycm9yAGBvbl9zdGF0dXNfY29tcGxldGVgIGNhbGxiYWNrIGVycm9yAGBvbl92ZXJzaW9uX2NvbXBsZXRlYCBjYWxsYmFjayBlcnJvcgBgb25fdXJsX2NvbXBsZXRlYCBjYWxsYmFjayBlcnJvcgBgb25fY2h1bmtfY29tcGxldGVgIGNhbGxiYWNrIGVycm9yAGBvbl9oZWFkZXJfdmFsdWVfY29tcGxldGVgIGNhbGxiYWNrIGVycm9yAGBvbl9tZXNzYWdlX2NvbXBsZXRlYCBjYWxsYmFjayBlcnJvcgBgb25fbWV0aG9kX2NvbXBsZXRlYCBjYWxsYmFjayBlcnJvcgBgb25faGVhZGVyX2ZpZWxkX2NvbXBsZXRlYCBjYWxsYmFjayBlcnJvcgBgb25fY2h1bmtfZXh0ZW5zaW9uX25hbWVgIGNhbGxiYWNrIGVycm9yAFVuZXhwZWN0ZWQgY2hhciBpbiB1cmwgc2VydmVyAEludmFsaWQgaGVhZGVyIHZhbHVlIGNoYXIASW52YWxpZCBoZWFkZXIgZmllbGQgY2hhcgBTcGFuIGNhbGxiYWNrIGVycm9yIGluIG9uX3ZlcnNpb24ASW52YWxpZCBtaW5vciB2ZXJzaW9uAEludmFsaWQgbWFqb3IgdmVyc2lvbgBFeHBlY3RlZCBzcGFjZSBhZnRlciB2ZXJzaW9uAEV4cGVjdGVkIENSTEYgYWZ0ZXIgdmVyc2lvbgBJbnZhbGlkIEhUVFAgdmVyc2lvbgBJbnZhbGlkIGhlYWRlciB0b2tlbgBTcGFuIGNhbGxiYWNrIGVycm9yIGluIG9uX3VybABJbnZhbGlkIGNoYXJhY3RlcnMgaW4gdXJsAFVuZXhwZWN0ZWQgc3RhcnQgY2hhciBpbiB1cmwARG91YmxlIEAgaW4gdXJsAEVtcHR5IENvbnRlbnQtTGVuZ3RoAEludmFsaWQgY2hhcmFjdGVyIGluIENvbnRlbnQtTGVuZ3RoAER1cGxpY2F0ZSBDb250ZW50LUxlbmd0aABJbnZhbGlkIGNoYXIgaW4gdXJsIHBhdGgAQ29udGVudC1MZW5ndGggY2FuJ3QgYmUgcHJlc2VudCB3aXRoIFRyYW5zZmVyLUVuY29kaW5nAEludmFsaWQgY2hhcmFjdGVyIGluIGNodW5rIHNpemUAU3BhbiBjYWxsYmFjayBlcnJvciBpbiBvbl9oZWFkZXJfdmFsdWUAU3BhbiBjYWxsYmFjayBlcnJvciBpbiBvbl9jaHVua19leHRlbnNpb25fdmFsdWUASW52YWxpZCBjaGFyYWN0ZXIgaW4gY2h1bmsgZXh0ZW5zaW9ucyB2YWx1ZQBNaXNzaW5nIGV4cGVjdGVkIExGIGFmdGVyIGhlYWRlciB2YWx1ZQBJbnZhbGlkIGBUcmFuc2Zlci1FbmNvZGluZ2AgaGVhZGVyIHZhbHVlAEludmFsaWQgY2hhcmFjdGVyIGluIGNodW5rIGV4dGVuc2lvbnMgcXVvdGUgdmFsdWUASW52YWxpZCBjaGFyYWN0ZXIgaW4gY2h1bmsgZXh0ZW5zaW9ucyBxdW90ZWQgdmFsdWUAUGF1c2VkIGJ5IG9uX2hlYWRlcnNfY29tcGxldGUASW52YWxpZCBFT0Ygc3RhdGUAb25fcmVzZXQgcGF1c2UAb25fY2h1bmtfaGVhZGVyIHBhdXNlAG9uX21lc3NhZ2VfYmVnaW4gcGF1c2UAb25fY2h1bmtfZXh0ZW5zaW9uX3ZhbHVlIHBhdXNlAG9uX3N0YXR1c19jb21wbGV0ZSBwYXVzZQBvbl92ZXJzaW9uX2NvbXBsZXRlIHBhdXNlAG9uX3VybF9jb21wbGV0ZSBwYXVzZQBvbl9jaHVua19jb21wbGV0ZSBwYXVzZQBvbl9oZWFkZXJfdmFsdWVfY29tcGxldGUgcGF1c2UAb25fbWVzc2FnZV9jb21wbGV0ZSBwYXVzZQBvbl9tZXRob2RfY29tcGxldGUgcGF1c2UAb25faGVhZGVyX2ZpZWxkX2NvbXBsZXRlIHBhdXNlAG9uX2NodW5rX2V4dGVuc2lvbl9uYW1lIHBhdXNlAFVuZXhwZWN0ZWQgc3BhY2UgYWZ0ZXIgc3RhcnQgbGluZQBTcGFuIGNhbGxiYWNrIGVycm9yIGluIG9uX2NodW5rX2V4dGVuc2lvbl9uYW1lAEludmFsaWQgY2hhcmFjdGVyIGluIGNodW5rIGV4dGVuc2lvbnMgbmFtZQBQYXVzZSBvbiBDT05ORUNUL1VwZ3JhZGUAUGF1c2Ugb24gUFJJL1VwZ3JhZGUARXhwZWN0ZWQgSFRUUC8yIENvbm5lY3Rpb24gUHJlZmFjZQBTcGFuIGNhbGxiYWNrIGVycm9yIGluIG9uX21ldGhvZABFeHBlY3RlZCBzcGFjZSBhZnRlciBtZXRob2QAU3BhbiBjYWxsYmFjayBlcnJvciBpbiBvbl9oZWFkZXJfZmllbGQAUGF1c2VkAEludmFsaWQgd29yZCBlbmNvdW50ZXJlZABJbnZhbGlkIG1ldGhvZCBlbmNvdW50ZXJlZABVbmV4cGVjdGVkIGNoYXIgaW4gdXJsIHNjaGVtYQBSZXF1ZXN0IGhhcyBpbnZhbGlkIGBUcmFuc2Zlci1FbmNvZGluZ2AAU1dJVENIX1BST1hZAFVTRV9QUk9YWQBNS0FDVElWSVRZAFVOUFJPQ0VTU0FCTEVfRU5USVRZAENPUFkATU9WRURfUEVSTUFORU5UTFkAVE9PX0VBUkxZAE5PVElGWQBGQUlMRURfREVQRU5ERU5DWQBCQURfR0FURVdBWQBQTEFZAFBVVABDSEVDS09VVABHQVRFV0FZX1RJTUVPVVQAUkVRVUVTVF9USU1FT1VUAE5FVFdPUktfQ09OTkVDVF9USU1FT1VUAENPTk5FQ1RJT05fVElNRU9VVABMT0dJTl9USU1FT1VUAE5FVFdPUktfUkVBRF9USU1FT1VUAFBPU1QATUlTRElSRUNURURfUkVRVUVTVABDTElFTlRfQ0xPU0VEX1JFUVVFU1QAQ0xJRU5UX0NMT1NFRF9MT0FEX0JBTEFOQ0VEX1JFUVVFU1QAQkFEX1JFUVVFU1QASFRUUF9SRVFVRVNUX1NFTlRfVE9fSFRUUFNfUE9SVABSRVBPUlQASU1fQV9URUFQT1QAUkVTRVRfQ09OVEVOVABOT19DT05URU5UAFBBUlRJQUxfQ09OVEVOVABIUEVfSU5WQUxJRF9DT05TVEFOVABIUEVfQ0JfUkVTRVQAR0VUAEhQRV9TVFJJQ1QAQ09ORkxJQ1QAVEVNUE9SQVJZX1JFRElSRUNUAFBFUk1BTkVOVF9SRURJUkVDVABDT05ORUNUAE1VTFRJX1NUQVRVUwBIUEVfSU5WQUxJRF9TVEFUVVMAVE9PX01BTllfUkVRVUVTVFMARUFSTFlfSElOVFMAVU5BVkFJTEFCTEVfRk9SX0xFR0FMX1JFQVNPTlMAT1BUSU9OUwBTV0lUQ0hJTkdfUFJPVE9DT0xTAFZBUklBTlRfQUxTT19ORUdPVElBVEVTAE1VTFRJUExFX0NIT0lDRVMASU5URVJOQUxfU0VSVkVSX0VSUk9SAFdFQl9TRVJWRVJfVU5LTk9XTl9FUlJPUgBSQUlMR1VOX0VSUk9SAElERU5USVRZX1BST1ZJREVSX0FVVEhFTlRJQ0FUSU9OX0VSUk9SAFNTTF9DRVJUSUZJQ0FURV9FUlJPUgBJTlZBTElEX1hfRk9SV0FSREVEX0ZPUgBTRVRfUEFSQU1FVEVSAEdFVF9QQVJBTUVURVIASFBFX1VTRVIAU0VFX09USEVSAEhQRV9DQl9DSFVOS19IRUFERVIATUtDQUxFTkRBUgBTRVRVUABXRUJfU0VSVkVSX0lTX0RPV04AVEVBUkRPV04ASFBFX0NMT1NFRF9DT05ORUNUSU9OAEhFVVJJU1RJQ19FWFBJUkFUSU9OAERJU0NPTk5FQ1RFRF9PUEVSQVRJT04ATk9OX0FVVEhPUklUQVRJVkVfSU5GT1JNQVRJT04ASFBFX0lOVkFMSURfVkVSU0lPTgBIUEVfQ0JfTUVTU0FHRV9CRUdJTgBTSVRFX0lTX0ZST1pFTgBIUEVfSU5WQUxJRF9IRUFERVJfVE9LRU4ASU5WQUxJRF9UT0tFTgBGT1JCSURERU4ARU5IQU5DRV9ZT1VSX0NBTE0ASFBFX0lOVkFMSURfVVJMAEJMT0NLRURfQllfUEFSRU5UQUxfQ09OVFJPTABNS0NPTABBQ0wASFBFX0lOVEVSTkFMAFJFUVVFU1RfSEVBREVSX0ZJRUxEU19UT09fTEFSR0VfVU5PRkZJQ0lBTABIUEVfT0sAVU5MSU5LAFVOTE9DSwBQUkkAUkVUUllfV0lUSABIUEVfSU5WQUxJRF9DT05URU5UX0xFTkdUSABIUEVfVU5FWFBFQ1RFRF9DT05URU5UX0xFTkdUSABGTFVTSABQUk9QUEFUQ0gATS1TRUFSQ0gAVVJJX1RPT19MT05HAFBST0NFU1NJTkcATUlTQ0VMTEFORU9VU19QRVJTSVNURU5UX1dBUk5JTkcATUlTQ0VMTEFORU9VU19XQVJOSU5HAEhQRV9JTlZBTElEX1RSQU5TRkVSX0VOQ09ESU5HAEV4cGVjdGVkIENSTEYASFBFX0lOVkFMSURfQ0hVTktfU0laRQBNT1ZFAENPTlRJTlVFAEhQRV9DQl9TVEFUVVNfQ09NUExFVEUASFBFX0NCX0hFQURFUlNfQ09NUExFVEUASFBFX0NCX1ZFUlNJT05fQ09NUExFVEUASFBFX0NCX1VSTF9DT01QTEVURQBIUEVfQ0JfQ0hVTktfQ09NUExFVEUASFBFX0NCX0hFQURFUl9WQUxVRV9DT01QTEVURQBIUEVfQ0JfQ0hVTktfRVhURU5TSU9OX1ZBTFVFX0NPTVBMRVRFAEhQRV9DQl9DSFVOS19FWFRFTlNJT05fTkFNRV9DT01QTEVURQBIUEVfQ0JfTUVTU0FHRV9DT01QTEVURQBIUEVfQ0JfTUVUSE9EX0NPTVBMRVRFAEhQRV9DQl9IRUFERVJfRklFTERfQ09NUExFVEUAREVMRVRFAEhQRV9JTlZBTElEX0VPRl9TVEFURQBJTlZBTElEX1NTTF9DRVJUSUZJQ0FURQBQQVVTRQBOT19SRVNQT05TRQBVTlNVUFBPUlRFRF9NRURJQV9UWVBFAEdPTkUATk9UX0FDQ0VQVEFCTEUAU0VSVklDRV9VTkFWQUlMQUJMRQBSQU5HRV9OT1RfU0FUSVNGSUFCTEUAT1JJR0lOX0lTX1VOUkVBQ0hBQkxFAFJFU1BPTlNFX0lTX1NUQUxFAFBVUkdFAE1FUkdFAFJFUVVFU1RfSEVBREVSX0ZJRUxEU19UT09fTEFSR0UAUkVRVUVTVF9IRUFERVJfVE9PX0xBUkdFAFBBWUxPQURfVE9PX0xBUkdFAElOU1VGRklDSUVOVF9TVE9SQUdFAEhQRV9QQVVTRURfVVBHUkFERQBIUEVfUEFVU0VEX0gyX1VQR1JBREUAU09VUkNFAEFOTk9VTkNFAFRSQUNFAEhQRV9VTkVYUEVDVEVEX1NQQUNFAERFU0NSSUJFAFVOU1VCU0NSSUJFAFJFQ09SRABIUEVfSU5WQUxJRF9NRVRIT0QATk9UX0ZPVU5EAFBST1BGSU5EAFVOQklORABSRUJJTkQAVU5BVVRIT1JJWkVEAE1FVEhPRF9OT1RfQUxMT1dFRABIVFRQX1ZFUlNJT05fTk9UX1NVUFBPUlRFRABBTFJFQURZX1JFUE9SVEVEAEFDQ0VQVEVEAE5PVF9JTVBMRU1FTlRFRABMT09QX0RFVEVDVEVEAEhQRV9DUl9FWFBFQ1RFRABIUEVfTEZfRVhQRUNURUQAQ1JFQVRFRABJTV9VU0VEAEhQRV9QQVVTRUQAVElNRU9VVF9PQ0NVUkVEAFBBWU1FTlRfUkVRVUlSRUQAUFJFQ09ORElUSU9OX1JFUVVJUkVEAFBST1hZX0FVVEhFTlRJQ0FUSU9OX1JFUVVJUkVEAE5FVFdPUktfQVVUSEVOVElDQVRJT05fUkVRVUlSRUQATEVOR1RIX1JFUVVJUkVEAFNTTF9DRVJUSUZJQ0FURV9SRVFVSVJFRABVUEdSQURFX1JFUVVJUkVEAFBBR0VfRVhQSVJFRABQUkVDT05ESVRJT05fRkFJTEVEAEVYUEVDVEFUSU9OX0ZBSUxFRABSRVZBTElEQVRJT05fRkFJTEVEAFNTTF9IQU5EU0hBS0VfRkFJTEVEAExPQ0tFRABUUkFOU0ZPUk1BVElPTl9BUFBMSUVEAE5PVF9NT0RJRklFRABOT1RfRVhURU5ERUQAQkFORFdJRFRIX0xJTUlUX0VYQ0VFREVEAFNJVEVfSVNfT1ZFUkxPQURFRABIRUFEAEV4cGVjdGVkIEhUVFAvAABeEwAAJhMAADAQAADwFwAAnRMAABUSAAA5FwAA8BIAAAoQAAB1EgAArRIAAIITAABPFAAAfxAAAKAVAAAjFAAAiRIAAIsUAABNFQAA1BEAAM8UAAAQGAAAyRYAANwWAADBEQAA4BcAALsUAAB0FAAAfBUAAOUUAAAIFwAAHxAAAGUVAACjFAAAKBUAAAIVAACZFQAALBAAAIsZAABPDwAA1A4AAGoQAADOEAAAAhcAAIkOAABuEwAAHBMAAGYUAABWFwAAwRMAAM0TAABsEwAAaBcAAGYXAABfFwAAIhMAAM4PAABpDgAA2A4AAGMWAADLEwAAqg4AACgXAAAmFwAAxRMAAF0WAADoEQAAZxMAAGUTAADyFgAAcxMAAB0XAAD5FgAA8xEAAM8OAADOFQAADBIAALMRAAClEQAAYRAAADIXAAC7EwBB+TULAQEAQZA2C+ABAQECAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEAQf03CwEBAEGROAteAgMCAgICAgAAAgIAAgIAAgICAgICAgICAgAEAAAAAAACAgICAgICAgICAgICAgICAgICAgICAgICAgAAAAICAgICAgICAgICAgICAgICAgICAgICAgICAgICAAIAAgBB/TkLAQEAQZE6C14CAAICAgICAAACAgACAgACAgICAgICAgICAAMABAAAAAICAgICAgICAgICAgICAgICAgICAgICAgICAAAAAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAAgACAEHwOwsNbG9zZWVlcC1hbGl2ZQBBiTwLAQEAQaA8C+ABAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEAAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEAQYk+CwEBAEGgPgvnAQEBAQEBAQEBAQEBAQIBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBY2h1bmtlZABBsMAAC18BAQABAQEBAQAAAQEAAQEAAQEBAQEBAQEBAQAAAAAAAAABAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQAAAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAAEAAQBBkMIACyFlY3Rpb25lbnQtbGVuZ3Rob25yb3h5LWNvbm5lY3Rpb24AQcDCAAstcmFuc2Zlci1lbmNvZGluZ3BncmFkZQ0KDQoNClNNDQoNClRUUC9DRS9UU1AvAEH5wgALBQECAAEDAEGQwwAL4AEEAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQABAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQBB+cQACwUBAgABAwBBkMUAC+ABBAEBBQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEAAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEAQfnGAAsEAQAAAQBBkccAC98BAQEAAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQABAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQBB+sgACwQBAAACAEGQyQALXwMEAAAEBAQEBAQEBAQEBAUEBAQEBAQEBAQEBAQABAAGBwQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAAEAAQABAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQAAAAEAEH6ygALBAEAAAEAQZDLAAsBAQBBqssAC0ECAAAAAAAAAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMAAAAAAAADAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwBB+swACwQBAAABAEGQzQALAQEAQZrNAAsGAgAAAAACAEGxzQALOgMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAAAAAAAAAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMAQfDOAAuWAU5PVU5DRUVDS09VVE5FQ1RFVEVDUklCRUxVU0hFVEVBRFNFQVJDSFJHRUNUSVZJVFlMRU5EQVJWRU9USUZZUFRJT05TQ0hTRUFZU1RBVENIR0VPUkRJUkVDVE9SVFJDSFBBUkFNRVRFUlVSQ0VCU0NSSUJFQVJET1dOQUNFSU5ETktDS1VCU0NSSUJFSFRUUC9BRFRQLw==", "base64");
}));
//#endregion
//#region node_modules/.pnpm/undici@6.28.0/node_modules/undici/lib/web/fetch/constants.js
var require_constants$2 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const corsSafeListedMethods = [
		"GET",
		"HEAD",
		"POST"
	];
	const corsSafeListedMethodsSet = new Set(corsSafeListedMethods);
	const nullBodyStatus = [
		101,
		204,
		205,
		304
	];
	const redirectStatus = [
		301,
		302,
		303,
		307,
		308
	];
	const redirectStatusSet = new Set(redirectStatus);
	/**
	* @see https://fetch.spec.whatwg.org/#block-bad-port
	*/
	const badPorts = [
		"1",
		"7",
		"9",
		"11",
		"13",
		"15",
		"17",
		"19",
		"20",
		"21",
		"22",
		"23",
		"25",
		"37",
		"42",
		"43",
		"53",
		"69",
		"77",
		"79",
		"87",
		"95",
		"101",
		"102",
		"103",
		"104",
		"109",
		"110",
		"111",
		"113",
		"115",
		"117",
		"119",
		"123",
		"135",
		"137",
		"139",
		"143",
		"161",
		"179",
		"389",
		"427",
		"465",
		"512",
		"513",
		"514",
		"515",
		"526",
		"530",
		"531",
		"532",
		"540",
		"548",
		"554",
		"556",
		"563",
		"587",
		"601",
		"636",
		"989",
		"990",
		"993",
		"995",
		"1719",
		"1720",
		"1723",
		"2049",
		"3659",
		"4045",
		"4190",
		"5060",
		"5061",
		"6000",
		"6566",
		"6665",
		"6666",
		"6667",
		"6668",
		"6669",
		"6679",
		"6697",
		"10080"
	];
	const badPortsSet = new Set(badPorts);
	/**
	* @see https://w3c.github.io/webappsec-referrer-policy/#referrer-policies
	*/
	const referrerPolicy = [
		"",
		"no-referrer",
		"no-referrer-when-downgrade",
		"same-origin",
		"origin",
		"strict-origin",
		"origin-when-cross-origin",
		"strict-origin-when-cross-origin",
		"unsafe-url"
	];
	const referrerPolicySet = new Set(referrerPolicy);
	const requestRedirect = [
		"follow",
		"manual",
		"error"
	];
	const safeMethods = [
		"GET",
		"HEAD",
		"OPTIONS",
		"TRACE"
	];
	const safeMethodsSet = new Set(safeMethods);
	const requestMode = [
		"navigate",
		"same-origin",
		"no-cors",
		"cors"
	];
	const requestCredentials = [
		"omit",
		"same-origin",
		"include"
	];
	const requestCache = [
		"default",
		"no-store",
		"reload",
		"no-cache",
		"force-cache",
		"only-if-cached"
	];
	/**
	* @see https://fetch.spec.whatwg.org/#request-body-header-name
	*/
	const requestBodyHeader = [
		"content-encoding",
		"content-language",
		"content-location",
		"content-type",
		"content-length"
	];
	/**
	* @see https://fetch.spec.whatwg.org/#enumdef-requestduplex
	*/
	const requestDuplex = ["half"];
	/**
	* @see http://fetch.spec.whatwg.org/#forbidden-method
	*/
	const forbiddenMethods = [
		"CONNECT",
		"TRACE",
		"TRACK"
	];
	const forbiddenMethodsSet = new Set(forbiddenMethods);
	const subresource = [
		"audio",
		"audioworklet",
		"font",
		"image",
		"manifest",
		"paintworklet",
		"script",
		"style",
		"track",
		"video",
		"xslt",
		""
	];
	module.exports = {
		subresource,
		forbiddenMethods,
		requestBodyHeader,
		referrerPolicy,
		requestRedirect,
		requestMode,
		requestCredentials,
		requestCache,
		redirectStatus,
		corsSafeListedMethods,
		nullBodyStatus,
		safeMethods,
		badPorts,
		requestDuplex,
		subresourceSet: new Set(subresource),
		badPortsSet,
		redirectStatusSet,
		corsSafeListedMethodsSet,
		safeMethodsSet,
		forbiddenMethodsSet,
		referrerPolicySet
	};
}));
//#endregion
//#region node_modules/.pnpm/undici@6.28.0/node_modules/undici/lib/web/fetch/global.js
var require_global$1 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const globalOrigin = Symbol.for("undici.globalOrigin.1");
	function getGlobalOrigin() {
		return globalThis[globalOrigin];
	}
	function setGlobalOrigin(newOrigin) {
		if (newOrigin === void 0) {
			Object.defineProperty(globalThis, globalOrigin, {
				value: void 0,
				writable: true,
				enumerable: false,
				configurable: false
			});
			return;
		}
		const parsedURL = new URL(newOrigin);
		if (parsedURL.protocol !== "http:" && parsedURL.protocol !== "https:") throw new TypeError(`Only http & https urls are allowed, received ${parsedURL.protocol}`);
		Object.defineProperty(globalThis, globalOrigin, {
			value: parsedURL,
			writable: true,
			enumerable: false,
			configurable: false
		});
	}
	module.exports = {
		getGlobalOrigin,
		setGlobalOrigin
	};
}));
//#endregion
//#region node_modules/.pnpm/undici@6.28.0/node_modules/undici/lib/web/fetch/data-url.js
var require_data_url = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const assert$23 = __require("node:assert");
	const encoder = new TextEncoder();
	/**
	* @see https://mimesniff.spec.whatwg.org/#http-token-code-point
	*/
	const HTTP_TOKEN_CODEPOINTS = /^[!#$%&'*+\-.^_|~A-Za-z0-9]+$/;
	const HTTP_WHITESPACE_REGEX = /[\u000A\u000D\u0009\u0020]/;
	const ASCII_WHITESPACE_REPLACE_REGEX = /[\u0009\u000A\u000C\u000D\u0020]/g;
	/**
	* @see https://mimesniff.spec.whatwg.org/#http-quoted-string-token-code-point
	*/
	const HTTP_QUOTED_STRING_TOKENS = /^[\u0009\u0020-\u007E\u0080-\u00FF]+$/;
	/** @param {URL} dataURL */
	function dataURLProcessor(dataURL) {
		assert$23(dataURL.protocol === "data:");
		let input = URLSerializer(dataURL, true);
		input = input.slice(5);
		const position = { position: 0 };
		let mimeType = collectASequenceOfCodePointsFast(",", input, position);
		const mimeTypeLength = mimeType.length;
		mimeType = removeASCIIWhitespace(mimeType, true, true);
		if (position.position >= input.length) return "failure";
		position.position++;
		let body = stringPercentDecode(input.slice(mimeTypeLength + 1));
		if (/;(\u0020){0,}base64$/i.test(mimeType)) {
			body = forgivingBase64(isomorphicDecode(body));
			if (body === "failure") return "failure";
			mimeType = mimeType.slice(0, -6);
			mimeType = mimeType.replace(/(\u0020)+$/, "");
			mimeType = mimeType.slice(0, -1);
		}
		if (mimeType.startsWith(";")) mimeType = "text/plain" + mimeType;
		let mimeTypeRecord = parseMIMEType(mimeType);
		if (mimeTypeRecord === "failure") mimeTypeRecord = parseMIMEType("text/plain;charset=US-ASCII");
		return {
			mimeType: mimeTypeRecord,
			body
		};
	}
	/**
	* @param {URL} url
	* @param {boolean} excludeFragment
	*/
	function URLSerializer(url, excludeFragment = false) {
		if (!excludeFragment) return url.href;
		const href = url.href;
		const hashLength = url.hash.length;
		const serialized = hashLength === 0 ? href : href.substring(0, href.length - hashLength);
		if (!hashLength && href.endsWith("#")) return serialized.slice(0, -1);
		return serialized;
	}
	/**
	* @param {(char: string) => boolean} condition
	* @param {string} input
	* @param {{ position: number }} position
	*/
	function collectASequenceOfCodePoints(condition, input, position) {
		let result = "";
		while (position.position < input.length && condition(input[position.position])) {
			result += input[position.position];
			position.position++;
		}
		return result;
	}
	/**
	* A faster collectASequenceOfCodePoints that only works when comparing a single character.
	* @param {string} char
	* @param {string} input
	* @param {{ position: number }} position
	*/
	function collectASequenceOfCodePointsFast(char, input, position) {
		const idx = input.indexOf(char, position.position);
		const start = position.position;
		if (idx === -1) {
			position.position = input.length;
			return input.slice(start);
		}
		position.position = idx;
		return input.slice(start, position.position);
	}
	/** @param {string} input */
	function stringPercentDecode(input) {
		return percentDecode(encoder.encode(input));
	}
	/**
	* @param {number} byte
	*/
	function isHexCharByte(byte) {
		return byte >= 48 && byte <= 57 || byte >= 65 && byte <= 70 || byte >= 97 && byte <= 102;
	}
	/**
	* @param {number} byte
	*/
	function hexByteToNumber(byte) {
		return byte >= 48 && byte <= 57 ? byte - 48 : (byte & 223) - 55;
	}
	/** @param {Uint8Array} input */
	function percentDecode(input) {
		const length = input.length;
		/** @type {Uint8Array} */
		const output = new Uint8Array(length);
		let j = 0;
		for (let i = 0; i < length; ++i) {
			const byte = input[i];
			if (byte !== 37) output[j++] = byte;
			else if (byte === 37 && !(isHexCharByte(input[i + 1]) && isHexCharByte(input[i + 2]))) output[j++] = 37;
			else {
				output[j++] = hexByteToNumber(input[i + 1]) << 4 | hexByteToNumber(input[i + 2]);
				i += 2;
			}
		}
		return length === j ? output : output.subarray(0, j);
	}
	/** @param {string} input */
	function parseMIMEType(input) {
		input = removeHTTPWhitespace(input, true, true);
		const position = { position: 0 };
		const type = collectASequenceOfCodePointsFast("/", input, position);
		if (type.length === 0 || !HTTP_TOKEN_CODEPOINTS.test(type)) return "failure";
		if (position.position > input.length) return "failure";
		position.position++;
		let subtype = collectASequenceOfCodePointsFast(";", input, position);
		subtype = removeHTTPWhitespace(subtype, false, true);
		if (subtype.length === 0 || !HTTP_TOKEN_CODEPOINTS.test(subtype)) return "failure";
		const typeLowercase = type.toLowerCase();
		const subtypeLowercase = subtype.toLowerCase();
		const mimeType = {
			type: typeLowercase,
			subtype: subtypeLowercase,
			/** @type {Map<string, string>} */
			parameters: /* @__PURE__ */ new Map(),
			essence: `${typeLowercase}/${subtypeLowercase}`
		};
		while (position.position < input.length) {
			position.position++;
			collectASequenceOfCodePoints((char) => HTTP_WHITESPACE_REGEX.test(char), input, position);
			let parameterName = collectASequenceOfCodePoints((char) => char !== ";" && char !== "=", input, position);
			parameterName = parameterName.toLowerCase();
			if (position.position < input.length) {
				if (input[position.position] === ";") continue;
				position.position++;
			}
			if (position.position > input.length) break;
			let parameterValue = null;
			if (input[position.position] === "\"") {
				parameterValue = collectAnHTTPQuotedString(input, position, true);
				collectASequenceOfCodePointsFast(";", input, position);
			} else {
				parameterValue = collectASequenceOfCodePointsFast(";", input, position);
				parameterValue = removeHTTPWhitespace(parameterValue, false, true);
				if (parameterValue.length === 0) continue;
			}
			if (parameterName.length !== 0 && HTTP_TOKEN_CODEPOINTS.test(parameterName) && (parameterValue.length === 0 || HTTP_QUOTED_STRING_TOKENS.test(parameterValue)) && !mimeType.parameters.has(parameterName)) mimeType.parameters.set(parameterName, parameterValue);
		}
		return mimeType;
	}
	/** @param {string} data */
	function forgivingBase64(data) {
		data = data.replace(ASCII_WHITESPACE_REPLACE_REGEX, "");
		let dataLength = data.length;
		if (dataLength % 4 === 0) {
			if (data.charCodeAt(dataLength - 1) === 61) {
				--dataLength;
				if (data.charCodeAt(dataLength - 1) === 61) --dataLength;
			}
		}
		if (dataLength % 4 === 1) return "failure";
		if (/[^+/0-9A-Za-z]/.test(data.length === dataLength ? data : data.substring(0, dataLength))) return "failure";
		const buffer = Buffer.from(data, "base64");
		return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
	}
	/**
	* @param {string} input
	* @param {{ position: number }} position
	* @param {boolean?} extractValue
	*/
	function collectAnHTTPQuotedString(input, position, extractValue) {
		const positionStart = position.position;
		let value = "";
		assert$23(input[position.position] === "\"");
		position.position++;
		while (true) {
			value += collectASequenceOfCodePoints((char) => char !== "\"" && char !== "\\", input, position);
			if (position.position >= input.length) break;
			const quoteOrBackslash = input[position.position];
			position.position++;
			if (quoteOrBackslash === "\\") {
				if (position.position >= input.length) {
					value += "\\";
					break;
				}
				value += input[position.position];
				position.position++;
			} else {
				assert$23(quoteOrBackslash === "\"");
				break;
			}
		}
		if (extractValue) return value;
		return input.slice(positionStart, position.position);
	}
	/**
	* @see https://mimesniff.spec.whatwg.org/#serialize-a-mime-type
	*/
	function serializeAMimeType(mimeType) {
		assert$23(mimeType !== "failure");
		const { parameters, essence } = mimeType;
		let serialization = essence;
		for (let [name, value] of parameters.entries()) {
			serialization += ";";
			serialization += name;
			serialization += "=";
			if (!HTTP_TOKEN_CODEPOINTS.test(value)) {
				value = value.replace(/(\\|")/g, "\\$1");
				value = "\"" + value;
				value += "\"";
			}
			serialization += value;
		}
		return serialization;
	}
	/**
	* @see https://fetch.spec.whatwg.org/#http-whitespace
	* @param {number} char
	*/
	function isHTTPWhiteSpace(char) {
		return char === 13 || char === 10 || char === 9 || char === 32;
	}
	/**
	* @see https://fetch.spec.whatwg.org/#http-whitespace
	* @param {string} str
	* @param {boolean} [leading=true]
	* @param {boolean} [trailing=true]
	*/
	function removeHTTPWhitespace(str, leading = true, trailing = true) {
		return removeChars(str, leading, trailing, isHTTPWhiteSpace);
	}
	/**
	* @see https://infra.spec.whatwg.org/#ascii-whitespace
	* @param {number} char
	*/
	function isASCIIWhitespace(char) {
		return char === 13 || char === 10 || char === 9 || char === 12 || char === 32;
	}
	/**
	* @see https://infra.spec.whatwg.org/#strip-leading-and-trailing-ascii-whitespace
	* @param {string} str
	* @param {boolean} [leading=true]
	* @param {boolean} [trailing=true]
	*/
	function removeASCIIWhitespace(str, leading = true, trailing = true) {
		return removeChars(str, leading, trailing, isASCIIWhitespace);
	}
	/**
	* @param {string} str
	* @param {boolean} leading
	* @param {boolean} trailing
	* @param {(charCode: number) => boolean} predicate
	* @returns
	*/
	function removeChars(str, leading, trailing, predicate) {
		let lead = 0;
		let trail = str.length - 1;
		if (leading) while (lead < str.length && predicate(str.charCodeAt(lead))) lead++;
		if (trailing) while (trail > 0 && predicate(str.charCodeAt(trail))) trail--;
		return lead === 0 && trail === str.length - 1 ? str : str.slice(lead, trail + 1);
	}
	/**
	* @see https://infra.spec.whatwg.org/#isomorphic-decode
	* @param {Uint8Array} input
	* @returns {string}
	*/
	function isomorphicDecode(input) {
		const length = input.length;
		if (65535 > length) return String.fromCharCode.apply(null, input);
		let result = "";
		let i = 0;
		let addition = 65535;
		while (i < length) {
			if (i + addition > length) addition = length - i;
			result += String.fromCharCode.apply(null, input.subarray(i, i += addition));
		}
		return result;
	}
	/**
	* @see https://mimesniff.spec.whatwg.org/#minimize-a-supported-mime-type
	* @param {Exclude<ReturnType<typeof parseMIMEType>, 'failure'>} mimeType
	*/
	function minimizeSupportedMimeType(mimeType) {
		switch (mimeType.essence) {
			case "application/ecmascript":
			case "application/javascript":
			case "application/x-ecmascript":
			case "application/x-javascript":
			case "text/ecmascript":
			case "text/javascript":
			case "text/javascript1.0":
			case "text/javascript1.1":
			case "text/javascript1.2":
			case "text/javascript1.3":
			case "text/javascript1.4":
			case "text/javascript1.5":
			case "text/jscript":
			case "text/livescript":
			case "text/x-ecmascript":
			case "text/x-javascript": return "text/javascript";
			case "application/json":
			case "text/json": return "application/json";
			case "image/svg+xml": return "image/svg+xml";
			case "text/xml":
			case "application/xml": return "application/xml";
		}
		if (mimeType.subtype.endsWith("+json")) return "application/json";
		if (mimeType.subtype.endsWith("+xml")) return "application/xml";
		return "";
	}
	module.exports = {
		dataURLProcessor,
		URLSerializer,
		collectASequenceOfCodePoints,
		collectASequenceOfCodePointsFast,
		stringPercentDecode,
		parseMIMEType,
		collectAnHTTPQuotedString,
		serializeAMimeType,
		removeChars,
		removeHTTPWhitespace,
		minimizeSupportedMimeType,
		HTTP_TOKEN_CODEPOINTS,
		isomorphicDecode
	};
}));
//#endregion
//#region node_modules/.pnpm/undici@6.28.0/node_modules/undici/lib/web/fetch/webidl.js
var require_webidl = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const { types: types$3, inspect } = __require("node:util");
	const { markAsUncloneable } = __require("node:worker_threads");
	const { toUSVString } = require_util$7();
	/** @type {import('../../../types/webidl').Webidl} */
	const webidl = {};
	webidl.converters = {};
	webidl.util = {};
	webidl.errors = {};
	webidl.errors.exception = function(message) {
		return /* @__PURE__ */ new TypeError(`${message.header}: ${message.message}`);
	};
	webidl.errors.conversionFailed = function(context) {
		const plural = context.types.length === 1 ? "" : " one of";
		const message = `${context.argument} could not be converted to${plural}: ${context.types.join(", ")}.`;
		return webidl.errors.exception({
			header: context.prefix,
			message
		});
	};
	webidl.errors.invalidArgument = function(context) {
		return webidl.errors.exception({
			header: context.prefix,
			message: `"${context.value}" is an invalid ${context.type}.`
		});
	};
	webidl.brandCheck = function(V, I, opts) {
		if (opts?.strict !== false) {
			if (!(V instanceof I)) {
				const err = /* @__PURE__ */ new TypeError("Illegal invocation");
				err.code = "ERR_INVALID_THIS";
				throw err;
			}
		} else if (V?.[Symbol.toStringTag] !== I.prototype[Symbol.toStringTag]) {
			const err = /* @__PURE__ */ new TypeError("Illegal invocation");
			err.code = "ERR_INVALID_THIS";
			throw err;
		}
	};
	webidl.argumentLengthCheck = function({ length }, min, ctx) {
		if (length < min) throw webidl.errors.exception({
			message: `${min} argument${min !== 1 ? "s" : ""} required, but${length ? " only" : ""} ${length} found.`,
			header: ctx
		});
	};
	webidl.illegalConstructor = function() {
		throw webidl.errors.exception({
			header: "TypeError",
			message: "Illegal constructor"
		});
	};
	webidl.util.Type = function(V) {
		switch (typeof V) {
			case "undefined": return "Undefined";
			case "boolean": return "Boolean";
			case "string": return "String";
			case "symbol": return "Symbol";
			case "number": return "Number";
			case "bigint": return "BigInt";
			case "function":
			case "object":
				if (V === null) return "Null";
				return "Object";
		}
	};
	webidl.util.markAsUncloneable = markAsUncloneable || (() => {});
	webidl.util.ConvertToInt = function(V, bitLength, signedness, opts) {
		let upperBound;
		let lowerBound;
		if (bitLength === 64) {
			upperBound = Math.pow(2, 53) - 1;
			if (signedness === "unsigned") lowerBound = 0;
			else lowerBound = Math.pow(-2, 53) + 1;
		} else if (signedness === "unsigned") {
			lowerBound = 0;
			upperBound = Math.pow(2, bitLength) - 1;
		} else {
			lowerBound = Math.pow(-2, bitLength) - 1;
			upperBound = Math.pow(2, bitLength - 1) - 1;
		}
		let x = Number(V);
		if (x === 0) x = 0;
		if (opts?.enforceRange === true) {
			if (Number.isNaN(x) || x === Number.POSITIVE_INFINITY || x === Number.NEGATIVE_INFINITY) throw webidl.errors.exception({
				header: "Integer conversion",
				message: `Could not convert ${webidl.util.Stringify(V)} to an integer.`
			});
			x = webidl.util.IntegerPart(x);
			if (x < lowerBound || x > upperBound) throw webidl.errors.exception({
				header: "Integer conversion",
				message: `Value must be between ${lowerBound}-${upperBound}, got ${x}.`
			});
			return x;
		}
		if (!Number.isNaN(x) && opts?.clamp === true) {
			x = Math.min(Math.max(x, lowerBound), upperBound);
			if (Math.floor(x) % 2 === 0) x = Math.floor(x);
			else x = Math.ceil(x);
			return x;
		}
		if (Number.isNaN(x) || x === 0 && Object.is(0, x) || x === Number.POSITIVE_INFINITY || x === Number.NEGATIVE_INFINITY) return 0;
		x = webidl.util.IntegerPart(x);
		x = x % Math.pow(2, bitLength);
		if (signedness === "signed" && x >= Math.pow(2, bitLength) - 1) return x - Math.pow(2, bitLength);
		return x;
	};
	webidl.util.IntegerPart = function(n) {
		const r = Math.floor(Math.abs(n));
		if (n < 0) return -1 * r;
		return r;
	};
	webidl.util.Stringify = function(V) {
		switch (webidl.util.Type(V)) {
			case "Symbol": return `Symbol(${V.description})`;
			case "Object": return inspect(V);
			case "String": return `"${V}"`;
			default: return `${V}`;
		}
	};
	webidl.sequenceConverter = function(converter) {
		return (V, prefix, argument, Iterable) => {
			if (webidl.util.Type(V) !== "Object") throw webidl.errors.exception({
				header: prefix,
				message: `${argument} (${webidl.util.Stringify(V)}) is not iterable.`
			});
			/** @type {Generator} */
			const method = typeof Iterable === "function" ? Iterable() : V?.[Symbol.iterator]?.();
			const seq = [];
			let index = 0;
			if (method === void 0 || typeof method.next !== "function") throw webidl.errors.exception({
				header: prefix,
				message: `${argument} is not iterable.`
			});
			while (true) {
				const { done, value } = method.next();
				if (done) break;
				seq.push(converter(value, prefix, `${argument}[${index++}]`));
			}
			return seq;
		};
	};
	webidl.recordConverter = function(keyConverter, valueConverter) {
		return (O, prefix, argument) => {
			if (webidl.util.Type(O) !== "Object") throw webidl.errors.exception({
				header: prefix,
				message: `${argument} ("${webidl.util.Type(O)}") is not an Object.`
			});
			const result = {};
			if (!types$3.isProxy(O)) {
				const keys = [...Object.getOwnPropertyNames(O), ...Object.getOwnPropertySymbols(O)];
				for (const key of keys) {
					const typedKey = keyConverter(key, prefix, argument);
					result[typedKey] = valueConverter(O[key], prefix, argument);
				}
				return result;
			}
			const keys = Reflect.ownKeys(O);
			for (const key of keys) if (Reflect.getOwnPropertyDescriptor(O, key)?.enumerable) {
				const typedKey = keyConverter(key, prefix, argument);
				result[typedKey] = valueConverter(O[key], prefix, argument);
			}
			return result;
		};
	};
	webidl.interfaceConverter = function(i) {
		return (V, prefix, argument, opts) => {
			if (opts?.strict !== false && !(V instanceof i)) throw webidl.errors.exception({
				header: prefix,
				message: `Expected ${argument} ("${webidl.util.Stringify(V)}") to be an instance of ${i.name}.`
			});
			return V;
		};
	};
	webidl.dictionaryConverter = function(converters) {
		return (dictionary, prefix, argument) => {
			const type = webidl.util.Type(dictionary);
			const dict = {};
			if (type === "Null" || type === "Undefined") return dict;
			else if (type !== "Object") throw webidl.errors.exception({
				header: prefix,
				message: `Expected ${dictionary} to be one of: Null, Undefined, Object.`
			});
			for (const options of converters) {
				const { key, defaultValue, required, converter } = options;
				if (required === true) {
					if (!Object.hasOwn(dictionary, key)) throw webidl.errors.exception({
						header: prefix,
						message: `Missing required key "${key}".`
					});
				}
				let value = dictionary[key];
				const hasDefault = Object.hasOwn(options, "defaultValue");
				if (hasDefault && value !== null) value ??= defaultValue();
				if (required || hasDefault || value !== void 0) {
					value = converter(value, prefix, `${argument}.${key}`);
					if (options.allowedValues && !options.allowedValues.includes(value)) throw webidl.errors.exception({
						header: prefix,
						message: `${value} is not an accepted type. Expected one of ${options.allowedValues.join(", ")}.`
					});
					dict[key] = value;
				}
			}
			return dict;
		};
	};
	webidl.nullableConverter = function(converter) {
		return (V, prefix, argument) => {
			if (V === null) return V;
			return converter(V, prefix, argument);
		};
	};
	webidl.converters.DOMString = function(V, prefix, argument, opts) {
		if (V === null && opts?.legacyNullToEmptyString) return "";
		if (typeof V === "symbol") throw webidl.errors.exception({
			header: prefix,
			message: `${argument} is a symbol, which cannot be converted to a DOMString.`
		});
		return String(V);
	};
	webidl.converters.ByteString = function(V, prefix, argument) {
		const x = webidl.converters.DOMString(V, prefix, argument);
		for (let index = 0; index < x.length; index++) if (x.charCodeAt(index) > 255) throw new TypeError(`Cannot convert argument to a ByteString because the character at index ${index} has a value of ${x.charCodeAt(index)} which is greater than 255.`);
		return x;
	};
	webidl.converters.USVString = toUSVString;
	webidl.converters.boolean = function(V) {
		return Boolean(V);
	};
	webidl.converters.any = function(V) {
		return V;
	};
	webidl.converters["long long"] = function(V, prefix, argument) {
		return webidl.util.ConvertToInt(V, 64, "signed", void 0, prefix, argument);
	};
	webidl.converters["unsigned long long"] = function(V, prefix, argument) {
		return webidl.util.ConvertToInt(V, 64, "unsigned", void 0, prefix, argument);
	};
	webidl.converters["unsigned long"] = function(V, prefix, argument) {
		return webidl.util.ConvertToInt(V, 32, "unsigned", void 0, prefix, argument);
	};
	webidl.converters["unsigned short"] = function(V, prefix, argument, opts) {
		return webidl.util.ConvertToInt(V, 16, "unsigned", opts, prefix, argument);
	};
	webidl.converters.ArrayBuffer = function(V, prefix, argument, opts) {
		if (webidl.util.Type(V) !== "Object" || !types$3.isAnyArrayBuffer(V)) throw webidl.errors.conversionFailed({
			prefix,
			argument: `${argument} ("${webidl.util.Stringify(V)}")`,
			types: ["ArrayBuffer"]
		});
		if (opts?.allowShared === false && types$3.isSharedArrayBuffer(V)) throw webidl.errors.exception({
			header: "ArrayBuffer",
			message: "SharedArrayBuffer is not allowed."
		});
		if (V.resizable || V.growable) throw webidl.errors.exception({
			header: "ArrayBuffer",
			message: "Received a resizable ArrayBuffer."
		});
		return V;
	};
	webidl.converters.TypedArray = function(V, T, prefix, name, opts) {
		if (webidl.util.Type(V) !== "Object" || !types$3.isTypedArray(V) || V.constructor.name !== T.name) throw webidl.errors.conversionFailed({
			prefix,
			argument: `${name} ("${webidl.util.Stringify(V)}")`,
			types: [T.name]
		});
		if (opts?.allowShared === false && types$3.isSharedArrayBuffer(V.buffer)) throw webidl.errors.exception({
			header: "ArrayBuffer",
			message: "SharedArrayBuffer is not allowed."
		});
		if (V.buffer.resizable || V.buffer.growable) throw webidl.errors.exception({
			header: "ArrayBuffer",
			message: "Received a resizable ArrayBuffer."
		});
		return V;
	};
	webidl.converters.DataView = function(V, prefix, name, opts) {
		if (webidl.util.Type(V) !== "Object" || !types$3.isDataView(V)) throw webidl.errors.exception({
			header: prefix,
			message: `${name} is not a DataView.`
		});
		if (opts?.allowShared === false && types$3.isSharedArrayBuffer(V.buffer)) throw webidl.errors.exception({
			header: "ArrayBuffer",
			message: "SharedArrayBuffer is not allowed."
		});
		if (V.buffer.resizable || V.buffer.growable) throw webidl.errors.exception({
			header: "ArrayBuffer",
			message: "Received a resizable ArrayBuffer."
		});
		return V;
	};
	webidl.converters.BufferSource = function(V, prefix, name, opts) {
		if (types$3.isAnyArrayBuffer(V)) return webidl.converters.ArrayBuffer(V, prefix, name, {
			...opts,
			allowShared: false
		});
		if (types$3.isTypedArray(V)) return webidl.converters.TypedArray(V, V.constructor, prefix, name, {
			...opts,
			allowShared: false
		});
		if (types$3.isDataView(V)) return webidl.converters.DataView(V, prefix, name, {
			...opts,
			allowShared: false
		});
		throw webidl.errors.conversionFailed({
			prefix,
			argument: `${name} ("${webidl.util.Stringify(V)}")`,
			types: ["BufferSource"]
		});
	};
	webidl.converters["sequence<ByteString>"] = webidl.sequenceConverter(webidl.converters.ByteString);
	webidl.converters["sequence<sequence<ByteString>>"] = webidl.sequenceConverter(webidl.converters["sequence<ByteString>"]);
	webidl.converters["record<ByteString, ByteString>"] = webidl.recordConverter(webidl.converters.ByteString, webidl.converters.ByteString);
	module.exports = { webidl };
}));
//#endregion
//#region node_modules/.pnpm/undici@6.28.0/node_modules/undici/lib/web/fetch/util.js
var require_util$6 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const { Transform: Transform$2 } = __require("node:stream");
	const zlib$1 = __require("node:zlib");
	const { redirectStatusSet, referrerPolicySet: referrerPolicyTokens, badPortsSet } = require_constants$2();
	const { getGlobalOrigin } = require_global$1();
	const { collectASequenceOfCodePoints, collectAnHTTPQuotedString, removeChars, parseMIMEType } = require_data_url();
	const { performance: performance$1 } = __require("node:perf_hooks");
	const { isBlobLike, ReadableStreamFrom, isValidHTTPToken, normalizedMethodRecordsBase } = require_util$7();
	const assert$22 = __require("node:assert");
	const { isUint8Array } = __require("node:util/types");
	const { webidl } = require_webidl();
	let supportedHashes = [];
	/** @type {import('crypto')} */
	let crypto;
	try {
		crypto = __require("node:crypto");
		const possibleRelevantHashes = [
			"sha256",
			"sha384",
			"sha512"
		];
		supportedHashes = crypto.getHashes().filter((hash) => possibleRelevantHashes.includes(hash));
	} catch {}
	function responseURL(response) {
		const urlList = response.urlList;
		const length = urlList.length;
		return length === 0 ? null : urlList[length - 1].toString();
	}
	function responseLocationURL(response, requestFragment) {
		if (!redirectStatusSet.has(response.status)) return null;
		let location = response.headersList.get("location", true);
		if (location !== null && isValidHeaderValue(location)) {
			if (!isValidEncodedURL(location)) location = normalizeBinaryStringToUtf8(location);
			location = new URL(location, responseURL(response));
		}
		if (location && !location.hash) location.hash = requestFragment;
		return location;
	}
	/**
	* @see https://www.rfc-editor.org/rfc/rfc1738#section-2.2
	* @param {string} url
	* @returns {boolean}
	*/
	function isValidEncodedURL(url) {
		for (let i = 0; i < url.length; ++i) {
			const code = url.charCodeAt(i);
			if (code > 126 || code < 32) return false;
		}
		return true;
	}
	/**
	* If string contains non-ASCII characters, assumes it's UTF-8 encoded and decodes it.
	* Since UTF-8 is a superset of ASCII, this will work for ASCII strings as well.
	* @param {string} value
	* @returns {string}
	*/
	function normalizeBinaryStringToUtf8(value) {
		return Buffer.from(value, "binary").toString("utf8");
	}
	/** @returns {URL} */
	function requestCurrentURL(request) {
		return request.urlList[request.urlList.length - 1];
	}
	function requestBadPort(request) {
		const url = requestCurrentURL(request);
		if (urlIsHttpHttpsScheme(url) && badPortsSet.has(url.port)) return "blocked";
		return "allowed";
	}
	function isErrorLike(object) {
		return object instanceof Error || object?.constructor?.name === "Error" || object?.constructor?.name === "DOMException";
	}
	function isValidReasonPhrase(statusText) {
		for (let i = 0; i < statusText.length; ++i) {
			const c = statusText.charCodeAt(i);
			if (!(c === 9 || c >= 32 && c <= 126 || c >= 128 && c <= 255)) return false;
		}
		return true;
	}
	/**
	* @see https://fetch.spec.whatwg.org/#header-name
	* @param {string} potentialValue
	*/
	const isValidHeaderName = isValidHTTPToken;
	/**
	* @see https://fetch.spec.whatwg.org/#header-value
	* @param {string} potentialValue
	*/
	function isValidHeaderValue(potentialValue) {
		return (potentialValue[0] === "	" || potentialValue[0] === " " || potentialValue[potentialValue.length - 1] === "	" || potentialValue[potentialValue.length - 1] === " " || potentialValue.includes("\n") || potentialValue.includes("\r") || potentialValue.includes("\0")) === false;
	}
	function setRequestReferrerPolicyOnRedirect(request, actualResponse) {
		const { headersList } = actualResponse;
		const policyHeader = (headersList.get("referrer-policy", true) ?? "").split(",");
		let policy = "";
		if (policyHeader.length > 0) for (let i = policyHeader.length; i !== 0; i--) {
			const token = policyHeader[i - 1].trim();
			if (referrerPolicyTokens.has(token)) {
				policy = token;
				break;
			}
		}
		if (policy !== "") request.referrerPolicy = policy;
	}
	function crossOriginResourcePolicyCheck() {
		return "allowed";
	}
	function corsCheck() {
		return "success";
	}
	function TAOCheck() {
		return "success";
	}
	function appendFetchMetadata(httpRequest) {
		let header = null;
		header = httpRequest.mode;
		httpRequest.headersList.set("sec-fetch-mode", header, true);
	}
	function appendRequestOriginHeader(request) {
		let serializedOrigin = request.origin;
		if (serializedOrigin === "client" || serializedOrigin === void 0) return;
		if (request.responseTainting === "cors" || request.mode === "websocket") request.headersList.append("origin", serializedOrigin, true);
		else if (request.method !== "GET" && request.method !== "HEAD") {
			switch (request.referrerPolicy) {
				case "no-referrer":
					serializedOrigin = null;
					break;
				case "no-referrer-when-downgrade":
				case "strict-origin":
				case "strict-origin-when-cross-origin":
					if (request.origin && urlHasHttpsScheme(request.origin) && !urlHasHttpsScheme(requestCurrentURL(request))) serializedOrigin = null;
					break;
				case "same-origin": if (!sameOrigin(request, requestCurrentURL(request))) serializedOrigin = null;
			}
			request.headersList.append("origin", serializedOrigin, true);
		}
	}
	function coarsenTime(timestamp, crossOriginIsolatedCapability) {
		return timestamp;
	}
	function clampAndCoarsenConnectionTimingInfo(connectionTimingInfo, defaultStartTime, crossOriginIsolatedCapability) {
		if (!connectionTimingInfo?.startTime || connectionTimingInfo.startTime < defaultStartTime) return {
			domainLookupStartTime: defaultStartTime,
			domainLookupEndTime: defaultStartTime,
			connectionStartTime: defaultStartTime,
			connectionEndTime: defaultStartTime,
			secureConnectionStartTime: defaultStartTime,
			ALPNNegotiatedProtocol: connectionTimingInfo?.ALPNNegotiatedProtocol
		};
		return {
			domainLookupStartTime: coarsenTime(connectionTimingInfo.domainLookupStartTime, crossOriginIsolatedCapability),
			domainLookupEndTime: coarsenTime(connectionTimingInfo.domainLookupEndTime, crossOriginIsolatedCapability),
			connectionStartTime: coarsenTime(connectionTimingInfo.connectionStartTime, crossOriginIsolatedCapability),
			connectionEndTime: coarsenTime(connectionTimingInfo.connectionEndTime, crossOriginIsolatedCapability),
			secureConnectionStartTime: coarsenTime(connectionTimingInfo.secureConnectionStartTime, crossOriginIsolatedCapability),
			ALPNNegotiatedProtocol: connectionTimingInfo.ALPNNegotiatedProtocol
		};
	}
	function coarsenedSharedCurrentTime(crossOriginIsolatedCapability) {
		return coarsenTime(performance$1.now(), crossOriginIsolatedCapability);
	}
	function createOpaqueTimingInfo(timingInfo) {
		return {
			startTime: timingInfo.startTime ?? 0,
			redirectStartTime: 0,
			redirectEndTime: 0,
			postRedirectStartTime: timingInfo.startTime ?? 0,
			finalServiceWorkerStartTime: 0,
			finalNetworkResponseStartTime: 0,
			finalNetworkRequestStartTime: 0,
			endTime: 0,
			encodedBodySize: 0,
			decodedBodySize: 0,
			finalConnectionTimingInfo: null
		};
	}
	function makePolicyContainer() {
		return { referrerPolicy: "strict-origin-when-cross-origin" };
	}
	function clonePolicyContainer(policyContainer) {
		return { referrerPolicy: policyContainer.referrerPolicy };
	}
	function determineRequestsReferrer(request) {
		const policy = request.referrerPolicy;
		assert$22(policy);
		let referrerSource = null;
		if (request.referrer === "client") {
			const globalOrigin = getGlobalOrigin();
			if (!globalOrigin || globalOrigin.origin === "null") return "no-referrer";
			referrerSource = new URL(globalOrigin);
		} else if (request.referrer instanceof URL) referrerSource = request.referrer;
		let referrerURL = stripURLForReferrer(referrerSource);
		const referrerOrigin = stripURLForReferrer(referrerSource, true);
		if (referrerURL.toString().length > 4096) referrerURL = referrerOrigin;
		const areSameOrigin = sameOrigin(request, referrerURL);
		const isNonPotentiallyTrustWorthy = isURLPotentiallyTrustworthy(referrerURL) && !isURLPotentiallyTrustworthy(request.url);
		switch (policy) {
			case "origin": return referrerOrigin != null ? referrerOrigin : stripURLForReferrer(referrerSource, true);
			case "unsafe-url": return referrerURL;
			case "same-origin": return areSameOrigin ? referrerOrigin : "no-referrer";
			case "origin-when-cross-origin": return areSameOrigin ? referrerURL : referrerOrigin;
			case "strict-origin-when-cross-origin": {
				const currentURL = requestCurrentURL(request);
				if (sameOrigin(referrerURL, currentURL)) return referrerURL;
				if (isURLPotentiallyTrustworthy(referrerURL) && !isURLPotentiallyTrustworthy(currentURL)) return "no-referrer";
				return referrerOrigin;
			}
			/**
			* 1. If referrerURL is a potentially trustworthy URL and
			* request’s current URL is not a potentially trustworthy URL,
			* then return no referrer.
			* 2. Return referrerOrigin
			*/
			default: return isNonPotentiallyTrustWorthy ? "no-referrer" : referrerOrigin;
		}
	}
	/**
	* @see https://w3c.github.io/webappsec-referrer-policy/#strip-url
	* @param {URL} url
	* @param {boolean|undefined} originOnly
	*/
	function stripURLForReferrer(url, originOnly) {
		assert$22(url instanceof URL);
		url = new URL(url);
		if (url.protocol === "file:" || url.protocol === "about:" || url.protocol === "blank:") return "no-referrer";
		url.username = "";
		url.password = "";
		url.hash = "";
		if (originOnly) {
			url.pathname = "";
			url.search = "";
		}
		return url;
	}
	function isURLPotentiallyTrustworthy(url) {
		if (!(url instanceof URL)) return false;
		if (url.href === "about:blank" || url.href === "about:srcdoc") return true;
		if (url.protocol === "data:") return true;
		if (url.protocol === "file:") return true;
		return isOriginPotentiallyTrustworthy(url.origin);
		function isOriginPotentiallyTrustworthy(origin) {
			if (origin == null || origin === "null") return false;
			const originAsURL = new URL(origin);
			if (originAsURL.protocol === "https:" || originAsURL.protocol === "wss:") return true;
			if (/^127(?:\.[0-9]+){0,2}\.[0-9]+$|^\[(?:0*:)*?:?0*1\]$/.test(originAsURL.hostname) || originAsURL.hostname === "localhost" || originAsURL.hostname.includes("localhost.") || originAsURL.hostname.endsWith(".localhost")) return true;
			return false;
		}
	}
	/**
	* @see https://w3c.github.io/webappsec-subresource-integrity/#does-response-match-metadatalist
	* @param {Uint8Array} bytes
	* @param {string} metadataList
	*/
	function bytesMatch(bytes, metadataList) {
		/* istanbul ignore if: only if node is built with --without-ssl */
		if (crypto === void 0) return true;
		const parsedMetadata = parseMetadata(metadataList);
		if (parsedMetadata === "no metadata") return true;
		if (parsedMetadata.length === 0) return true;
		const metadata = filterMetadataListByAlgorithm(parsedMetadata, getStrongestMetadata(parsedMetadata));
		for (const item of metadata) {
			const algorithm = item.algo;
			const expectedValue = item.hash;
			let actualValue = crypto.createHash(algorithm).update(bytes).digest("base64");
			if (actualValue[actualValue.length - 1] === "=") if (actualValue[actualValue.length - 2] === "=") actualValue = actualValue.slice(0, -2);
			else actualValue = actualValue.slice(0, -1);
			if (compareBase64Mixed(actualValue, expectedValue)) return true;
		}
		return false;
	}
	const parseHashWithOptions = /(?<algo>sha256|sha384|sha512)-((?<hash>[A-Za-z0-9+/]+|[A-Za-z0-9_-]+)={0,2}(?:\s|$)( +[!-~]*)?)?/i;
	/**
	* @see https://w3c.github.io/webappsec-subresource-integrity/#parse-metadata
	* @param {string} metadata
	*/
	function parseMetadata(metadata) {
		/** @type {{ algo: string, hash: string }[]} */
		const result = [];
		let empty = true;
		for (const token of metadata.split(" ")) {
			empty = false;
			const parsedToken = parseHashWithOptions.exec(token);
			if (parsedToken === null || parsedToken.groups === void 0 || parsedToken.groups.algo === void 0) continue;
			const algorithm = parsedToken.groups.algo.toLowerCase();
			if (supportedHashes.includes(algorithm)) result.push(parsedToken.groups);
		}
		if (empty === true) return "no metadata";
		return result;
	}
	/**
	* @param {{ algo: 'sha256' | 'sha384' | 'sha512' }[]} metadataList
	*/
	function getStrongestMetadata(metadataList) {
		let algorithm = metadataList[0].algo;
		if (algorithm[3] === "5") return algorithm;
		for (let i = 1; i < metadataList.length; ++i) {
			const metadata = metadataList[i];
			if (metadata.algo[3] === "5") {
				algorithm = "sha512";
				break;
			} else if (algorithm[3] === "3") continue;
			else if (metadata.algo[3] === "3") algorithm = "sha384";
		}
		return algorithm;
	}
	function filterMetadataListByAlgorithm(metadataList, algorithm) {
		if (metadataList.length === 1) return metadataList;
		let pos = 0;
		for (let i = 0; i < metadataList.length; ++i) if (metadataList[i].algo === algorithm) metadataList[pos++] = metadataList[i];
		metadataList.length = pos;
		return metadataList;
	}
	/**
	* Compares two base64 strings, allowing for base64url
	* in the second string.
	*
	* @param {string} actualValue always base64
	* @param {string} expectedValue base64 or base64url
	* @returns {boolean}
	*/
	function compareBase64Mixed(actualValue, expectedValue) {
		if (actualValue.length !== expectedValue.length) return false;
		for (let i = 0; i < actualValue.length; ++i) if (actualValue[i] !== expectedValue[i]) {
			if (actualValue[i] === "+" && expectedValue[i] === "-" || actualValue[i] === "/" && expectedValue[i] === "_") continue;
			return false;
		}
		return true;
	}
	function tryUpgradeRequestToAPotentiallyTrustworthyURL(request) {}
	/**
	* @link {https://html.spec.whatwg.org/multipage/origin.html#same-origin}
	* @param {URL} A
	* @param {URL} B
	*/
	function sameOrigin(A, B) {
		if (A.origin === B.origin && A.origin === "null") return true;
		if (A.protocol === B.protocol && A.hostname === B.hostname && A.port === B.port) return true;
		return false;
	}
	function createDeferredPromise() {
		let res;
		let rej;
		return {
			promise: new Promise((resolve, reject) => {
				res = resolve;
				rej = reject;
			}),
			resolve: res,
			reject: rej
		};
	}
	function isAborted(fetchParams) {
		return fetchParams.controller.state === "aborted";
	}
	function isCancelled(fetchParams) {
		return fetchParams.controller.state === "aborted" || fetchParams.controller.state === "terminated";
	}
	/**
	* @see https://fetch.spec.whatwg.org/#concept-method-normalize
	* @param {string} method
	*/
	function normalizeMethod(method) {
		return normalizedMethodRecordsBase[method.toLowerCase()] ?? method;
	}
	function serializeJavascriptValueToJSONString(value) {
		const result = JSON.stringify(value);
		if (result === void 0) throw new TypeError("Value is not JSON serializable");
		assert$22(typeof result === "string");
		return result;
	}
	const esIteratorPrototype = Object.getPrototypeOf(Object.getPrototypeOf([][Symbol.iterator]()));
	/**
	* @see https://webidl.spec.whatwg.org/#dfn-iterator-prototype-object
	* @param {string} name name of the instance
	* @param {symbol} kInternalIterator
	* @param {string | number} [keyIndex]
	* @param {string | number} [valueIndex]
	*/
	function createIterator(name, kInternalIterator, keyIndex = 0, valueIndex = 1) {
		class FastIterableIterator {
			/** @type {any} */
			#target;
			/** @type {'key' | 'value' | 'key+value'} */
			#kind;
			/** @type {number} */
			#index;
			/**
			* @see https://webidl.spec.whatwg.org/#dfn-default-iterator-object
			* @param {unknown} target
			* @param {'key' | 'value' | 'key+value'} kind
			*/
			constructor(target, kind) {
				this.#target = target;
				this.#kind = kind;
				this.#index = 0;
			}
			next() {
				if (typeof this !== "object" || this === null || !(#target in this)) throw new TypeError(`'next' called on an object that does not implement interface ${name} Iterator.`);
				const index = this.#index;
				const values = this.#target[kInternalIterator];
				if (index >= values.length) return {
					value: void 0,
					done: true
				};
				const { [keyIndex]: key, [valueIndex]: value } = values[index];
				this.#index = index + 1;
				let result;
				switch (this.#kind) {
					case "key":
						result = key;
						break;
					case "value":
						result = value;
						break;
					case "key+value": result = [key, value];
				}
				return {
					value: result,
					done: false
				};
			}
		}
		delete FastIterableIterator.prototype.constructor;
		Object.setPrototypeOf(FastIterableIterator.prototype, esIteratorPrototype);
		Object.defineProperties(FastIterableIterator.prototype, {
			[Symbol.toStringTag]: {
				writable: false,
				enumerable: false,
				configurable: true,
				value: `${name} Iterator`
			},
			next: {
				writable: true,
				enumerable: true,
				configurable: true
			}
		});
		/**
		* @param {unknown} target
		* @param {'key' | 'value' | 'key+value'} kind
		* @returns {IterableIterator<any>}
		*/
		return function(target, kind) {
			return new FastIterableIterator(target, kind);
		};
	}
	/**
	* @see https://webidl.spec.whatwg.org/#dfn-iterator-prototype-object
	* @param {string} name name of the instance
	* @param {any} object class
	* @param {symbol} kInternalIterator
	* @param {string | number} [keyIndex]
	* @param {string | number} [valueIndex]
	*/
	function iteratorMixin(name, object, kInternalIterator, keyIndex = 0, valueIndex = 1) {
		const makeIterator = createIterator(name, kInternalIterator, keyIndex, valueIndex);
		const properties = {
			keys: {
				writable: true,
				enumerable: true,
				configurable: true,
				value: function keys() {
					webidl.brandCheck(this, object);
					return makeIterator(this, "key");
				}
			},
			values: {
				writable: true,
				enumerable: true,
				configurable: true,
				value: function values() {
					webidl.brandCheck(this, object);
					return makeIterator(this, "value");
				}
			},
			entries: {
				writable: true,
				enumerable: true,
				configurable: true,
				value: function entries() {
					webidl.brandCheck(this, object);
					return makeIterator(this, "key+value");
				}
			},
			forEach: {
				writable: true,
				enumerable: true,
				configurable: true,
				value: function forEach(callbackfn, thisArg = globalThis) {
					webidl.brandCheck(this, object);
					webidl.argumentLengthCheck(arguments, 1, `${name}.forEach`);
					if (typeof callbackfn !== "function") throw new TypeError(`Failed to execute 'forEach' on '${name}': parameter 1 is not of type 'Function'.`);
					for (const { 0: key, 1: value } of makeIterator(this, "key+value")) callbackfn.call(thisArg, value, key, this);
				}
			}
		};
		return Object.defineProperties(object.prototype, {
			...properties,
			[Symbol.iterator]: {
				writable: true,
				enumerable: false,
				configurable: true,
				value: properties.entries.value
			}
		});
	}
	/**
	* @see https://fetch.spec.whatwg.org/#body-fully-read
	*/
	async function fullyReadBody(body, processBody, processBodyError) {
		const successSteps = processBody;
		const errorSteps = processBodyError;
		let reader;
		try {
			reader = body.stream.getReader();
		} catch (e) {
			errorSteps(e);
			return;
		}
		try {
			successSteps(await readAllBytes(reader));
		} catch (e) {
			errorSteps(e);
		}
	}
	function isReadableStreamLike(stream) {
		return stream instanceof ReadableStream || stream[Symbol.toStringTag] === "ReadableStream" && typeof stream.tee === "function";
	}
	/**
	* @param {ReadableStreamController<Uint8Array>} controller
	*/
	function readableStreamClose(controller) {
		try {
			controller.close();
			controller.byobRequest?.respond(0);
		} catch (err) {
			if (!err.message.includes("Controller is already closed") && !err.message.includes("ReadableStream is already closed")) throw err;
		}
	}
	const invalidIsomorphicEncodeValueRegex = /[^\x00-\xFF]/;
	/**
	* @see https://infra.spec.whatwg.org/#isomorphic-encode
	* @param {string} input
	*/
	function isomorphicEncode(input) {
		assert$22(!invalidIsomorphicEncodeValueRegex.test(input));
		return input;
	}
	/**
	* @see https://streams.spec.whatwg.org/#readablestreamdefaultreader-read-all-bytes
	* @see https://streams.spec.whatwg.org/#read-loop
	* @param {ReadableStreamDefaultReader} reader
	*/
	async function readAllBytes(reader) {
		const bytes = [];
		let byteLength = 0;
		while (true) {
			const { done, value: chunk } = await reader.read();
			if (done) return Buffer.concat(bytes, byteLength);
			if (!isUint8Array(chunk)) throw new TypeError("Received non-Uint8Array chunk");
			bytes.push(chunk);
			byteLength += chunk.length;
		}
	}
	/**
	* @see https://fetch.spec.whatwg.org/#is-local
	* @param {URL} url
	*/
	function urlIsLocal(url) {
		assert$22("protocol" in url);
		const protocol = url.protocol;
		return protocol === "about:" || protocol === "blob:" || protocol === "data:";
	}
	/**
	* @param {string|URL} url
	* @returns {boolean}
	*/
	function urlHasHttpsScheme(url) {
		return typeof url === "string" && url[5] === ":" && url[0] === "h" && url[1] === "t" && url[2] === "t" && url[3] === "p" && url[4] === "s" || url.protocol === "https:";
	}
	/**
	* @see https://fetch.spec.whatwg.org/#http-scheme
	* @param {URL} url
	*/
	function urlIsHttpHttpsScheme(url) {
		assert$22("protocol" in url);
		const protocol = url.protocol;
		return protocol === "http:" || protocol === "https:";
	}
	/**
	* @see https://fetch.spec.whatwg.org/#simple-range-header-value
	* @param {string} value
	* @param {boolean} allowWhitespace
	*/
	function simpleRangeHeaderValue(value, allowWhitespace) {
		const data = value;
		if (!data.startsWith("bytes")) return "failure";
		const position = { position: 5 };
		if (allowWhitespace) collectASequenceOfCodePoints((char) => char === "	" || char === " ", data, position);
		if (data.charCodeAt(position.position) !== 61) return "failure";
		position.position++;
		if (allowWhitespace) collectASequenceOfCodePoints((char) => char === "	" || char === " ", data, position);
		const rangeStart = collectASequenceOfCodePoints((char) => {
			const code = char.charCodeAt(0);
			return code >= 48 && code <= 57;
		}, data, position);
		const rangeStartValue = rangeStart.length ? Number(rangeStart) : null;
		if (allowWhitespace) collectASequenceOfCodePoints((char) => char === "	" || char === " ", data, position);
		if (data.charCodeAt(position.position) !== 45) return "failure";
		position.position++;
		if (allowWhitespace) collectASequenceOfCodePoints((char) => char === "	" || char === " ", data, position);
		const rangeEnd = collectASequenceOfCodePoints((char) => {
			const code = char.charCodeAt(0);
			return code >= 48 && code <= 57;
		}, data, position);
		const rangeEndValue = rangeEnd.length ? Number(rangeEnd) : null;
		if (position.position < data.length) return "failure";
		if (rangeEndValue === null && rangeStartValue === null) return "failure";
		if (rangeStartValue > rangeEndValue) return "failure";
		return {
			rangeStartValue,
			rangeEndValue
		};
	}
	/**
	* @see https://fetch.spec.whatwg.org/#build-a-content-range
	* @param {number} rangeStart
	* @param {number} rangeEnd
	* @param {number} fullLength
	*/
	function buildContentRange(rangeStart, rangeEnd, fullLength) {
		let contentRange = "bytes ";
		contentRange += isomorphicEncode(`${rangeStart}`);
		contentRange += "-";
		contentRange += isomorphicEncode(`${rangeEnd}`);
		contentRange += "/";
		contentRange += isomorphicEncode(`${fullLength}`);
		return contentRange;
	}
	var InflateStream = class extends Transform$2 {
		#zlibOptions;
		/** @param {zlib.ZlibOptions} [zlibOptions] */
		constructor(zlibOptions) {
			super();
			this.#zlibOptions = zlibOptions;
		}
		_transform(chunk, encoding, callback) {
			if (!this._inflateStream) {
				if (chunk.length === 0) {
					callback();
					return;
				}
				this._inflateStream = (chunk[0] & 15) === 8 ? zlib$1.createInflate(this.#zlibOptions) : zlib$1.createInflateRaw(this.#zlibOptions);
				this._inflateStream.on("data", this.push.bind(this));
				this._inflateStream.on("end", () => this.push(null));
				this._inflateStream.on("error", (err) => this.destroy(err));
			}
			this._inflateStream.write(chunk, encoding, callback);
		}
		_final(callback) {
			if (this._inflateStream) {
				this._inflateStream.end();
				this._inflateStream = null;
			}
			callback();
		}
	};
	/**
	* @param {zlib.ZlibOptions} [zlibOptions]
	* @returns {InflateStream}
	*/
	function createInflate(zlibOptions) {
		return new InflateStream(zlibOptions);
	}
	/**
	* @see https://fetch.spec.whatwg.org/#concept-header-extract-mime-type
	* @param {import('./headers').HeadersList} headers
	*/
	function extractMimeType(headers) {
		let charset = null;
		let essence = null;
		let mimeType = null;
		const values = getDecodeSplit("content-type", headers);
		if (values === null) return "failure";
		for (const value of values) {
			const temporaryMimeType = parseMIMEType(value);
			if (temporaryMimeType === "failure" || temporaryMimeType.essence === "*/*") continue;
			mimeType = temporaryMimeType;
			if (mimeType.essence !== essence) {
				charset = null;
				if (mimeType.parameters.has("charset")) charset = mimeType.parameters.get("charset");
				essence = mimeType.essence;
			} else if (!mimeType.parameters.has("charset") && charset !== null) mimeType.parameters.set("charset", charset);
		}
		if (mimeType == null) return "failure";
		return mimeType;
	}
	/**
	* @see https://fetch.spec.whatwg.org/#header-value-get-decode-and-split
	* @param {string|null} value
	*/
	function gettingDecodingSplitting(value) {
		const input = value;
		const position = { position: 0 };
		const values = [];
		let temporaryValue = "";
		while (position.position < input.length) {
			temporaryValue += collectASequenceOfCodePoints((char) => char !== "\"" && char !== ",", input, position);
			if (position.position < input.length) if (input.charCodeAt(position.position) === 34) {
				temporaryValue += collectAnHTTPQuotedString(input, position);
				if (position.position < input.length) continue;
			} else {
				assert$22(input.charCodeAt(position.position) === 44);
				position.position++;
			}
			temporaryValue = removeChars(temporaryValue, true, true, (char) => char === 9 || char === 32);
			values.push(temporaryValue);
			temporaryValue = "";
		}
		return values;
	}
	/**
	* @see https://fetch.spec.whatwg.org/#concept-header-list-get-decode-split
	* @param {string} name lowercase header name
	* @param {import('./headers').HeadersList} list
	*/
	function getDecodeSplit(name, list) {
		const value = list.get(name, true);
		if (value === null) return null;
		return gettingDecodingSplitting(value);
	}
	const textDecoder = new TextDecoder();
	/**
	* @see https://encoding.spec.whatwg.org/#utf-8-decode
	* @param {Buffer} buffer
	*/
	function utf8DecodeBytes(buffer) {
		if (buffer.length === 0) return "";
		if (buffer[0] === 239 && buffer[1] === 187 && buffer[2] === 191) buffer = buffer.subarray(3);
		return textDecoder.decode(buffer);
	}
	var EnvironmentSettingsObjectBase = class {
		get baseUrl() {
			return getGlobalOrigin();
		}
		get origin() {
			return this.baseUrl?.origin;
		}
		policyContainer = makePolicyContainer();
	};
	var EnvironmentSettingsObject = class {
		settingsObject = new EnvironmentSettingsObjectBase();
	};
	module.exports = {
		isAborted,
		isCancelled,
		isValidEncodedURL,
		createDeferredPromise,
		ReadableStreamFrom,
		tryUpgradeRequestToAPotentiallyTrustworthyURL,
		clampAndCoarsenConnectionTimingInfo,
		coarsenedSharedCurrentTime,
		determineRequestsReferrer,
		makePolicyContainer,
		clonePolicyContainer,
		appendFetchMetadata,
		appendRequestOriginHeader,
		TAOCheck,
		corsCheck,
		crossOriginResourcePolicyCheck,
		createOpaqueTimingInfo,
		setRequestReferrerPolicyOnRedirect,
		isValidHTTPToken,
		requestBadPort,
		requestCurrentURL,
		responseURL,
		responseLocationURL,
		isBlobLike,
		isURLPotentiallyTrustworthy,
		isValidReasonPhrase,
		sameOrigin,
		normalizeMethod,
		serializeJavascriptValueToJSONString,
		iteratorMixin,
		createIterator,
		isValidHeaderName,
		isValidHeaderValue,
		isErrorLike,
		fullyReadBody,
		bytesMatch,
		isReadableStreamLike,
		readableStreamClose,
		isomorphicEncode,
		urlIsLocal,
		urlHasHttpsScheme,
		urlIsHttpHttpsScheme,
		readAllBytes,
		simpleRangeHeaderValue,
		buildContentRange,
		parseMetadata,
		createInflate,
		extractMimeType,
		getDecodeSplit,
		utf8DecodeBytes,
		environmentSettingsObject: new EnvironmentSettingsObject()
	};
}));
//#endregion
//#region node_modules/.pnpm/undici@6.28.0/node_modules/undici/lib/web/fetch/symbols.js
var require_symbols$3 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = {
		kUrl: Symbol("url"),
		kHeaders: Symbol("headers"),
		kSignal: Symbol("signal"),
		kState: Symbol("state"),
		kDispatcher: Symbol("dispatcher")
	};
}));
//#endregion
//#region node_modules/.pnpm/undici@6.28.0/node_modules/undici/lib/web/fetch/file.js
var require_file = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const { Blob: Blob$2, File } = __require("node:buffer");
	const { kState } = require_symbols$3();
	const { webidl } = require_webidl();
	var FileLike = class FileLike {
		constructor(blobLike, fileName, options = {}) {
			const n = fileName;
			const t = options.type;
			const d = options.lastModified ?? Date.now();
			this[kState] = {
				blobLike,
				name: n,
				type: t,
				lastModified: d
			};
		}
		stream(...args) {
			webidl.brandCheck(this, FileLike);
			return this[kState].blobLike.stream(...args);
		}
		arrayBuffer(...args) {
			webidl.brandCheck(this, FileLike);
			return this[kState].blobLike.arrayBuffer(...args);
		}
		slice(...args) {
			webidl.brandCheck(this, FileLike);
			return this[kState].blobLike.slice(...args);
		}
		text(...args) {
			webidl.brandCheck(this, FileLike);
			return this[kState].blobLike.text(...args);
		}
		get size() {
			webidl.brandCheck(this, FileLike);
			return this[kState].blobLike.size;
		}
		get type() {
			webidl.brandCheck(this, FileLike);
			return this[kState].blobLike.type;
		}
		get name() {
			webidl.brandCheck(this, FileLike);
			return this[kState].name;
		}
		get lastModified() {
			webidl.brandCheck(this, FileLike);
			return this[kState].lastModified;
		}
		get [Symbol.toStringTag]() {
			return "File";
		}
	};
	webidl.converters.Blob = webidl.interfaceConverter(Blob$2);
	function isFileLike(object) {
		return object instanceof File || object && (typeof object.stream === "function" || typeof object.arrayBuffer === "function") && object[Symbol.toStringTag] === "File";
	}
	module.exports = {
		FileLike,
		isFileLike
	};
}));
//#endregion
//#region node_modules/.pnpm/undici@6.28.0/node_modules/undici/lib/web/fetch/formdata.js
var require_formdata = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const { isBlobLike, iteratorMixin } = require_util$6();
	const { kState } = require_symbols$3();
	const { kEnumerableProperty } = require_util$7();
	const { FileLike, isFileLike } = require_file();
	const { webidl } = require_webidl();
	const { File: NativeFile } = __require("node:buffer");
	const nodeUtil$2 = __require("node:util");
	/** @type {globalThis['File']} */
	const File = globalThis.File ?? NativeFile;
	var FormData = class FormData {
		constructor(form) {
			webidl.util.markAsUncloneable(this);
			if (form !== void 0) throw webidl.errors.conversionFailed({
				prefix: "FormData constructor",
				argument: "Argument 1",
				types: ["undefined"]
			});
			this[kState] = [];
		}
		append(name, value, filename = void 0) {
			webidl.brandCheck(this, FormData);
			const prefix = "FormData.append";
			webidl.argumentLengthCheck(arguments, 2, prefix);
			if (arguments.length === 3 && !isBlobLike(value)) throw new TypeError("Failed to execute 'append' on 'FormData': parameter 2 is not of type 'Blob'");
			name = webidl.converters.USVString(name, prefix, "name");
			value = isBlobLike(value) ? webidl.converters.Blob(value, prefix, "value", { strict: false }) : webidl.converters.USVString(value, prefix, "value");
			filename = arguments.length === 3 ? webidl.converters.USVString(filename, prefix, "filename") : void 0;
			const entry = makeEntry(name, value, filename);
			this[kState].push(entry);
		}
		delete(name) {
			webidl.brandCheck(this, FormData);
			const prefix = "FormData.delete";
			webidl.argumentLengthCheck(arguments, 1, prefix);
			name = webidl.converters.USVString(name, prefix, "name");
			this[kState] = this[kState].filter((entry) => entry.name !== name);
		}
		get(name) {
			webidl.brandCheck(this, FormData);
			const prefix = "FormData.get";
			webidl.argumentLengthCheck(arguments, 1, prefix);
			name = webidl.converters.USVString(name, prefix, "name");
			const idx = this[kState].findIndex((entry) => entry.name === name);
			if (idx === -1) return null;
			return this[kState][idx].value;
		}
		getAll(name) {
			webidl.brandCheck(this, FormData);
			const prefix = "FormData.getAll";
			webidl.argumentLengthCheck(arguments, 1, prefix);
			name = webidl.converters.USVString(name, prefix, "name");
			return this[kState].filter((entry) => entry.name === name).map((entry) => entry.value);
		}
		has(name) {
			webidl.brandCheck(this, FormData);
			const prefix = "FormData.has";
			webidl.argumentLengthCheck(arguments, 1, prefix);
			name = webidl.converters.USVString(name, prefix, "name");
			return this[kState].findIndex((entry) => entry.name === name) !== -1;
		}
		set(name, value, filename = void 0) {
			webidl.brandCheck(this, FormData);
			const prefix = "FormData.set";
			webidl.argumentLengthCheck(arguments, 2, prefix);
			if (arguments.length === 3 && !isBlobLike(value)) throw new TypeError("Failed to execute 'set' on 'FormData': parameter 2 is not of type 'Blob'");
			name = webidl.converters.USVString(name, prefix, "name");
			value = isBlobLike(value) ? webidl.converters.Blob(value, prefix, "name", { strict: false }) : webidl.converters.USVString(value, prefix, "name");
			filename = arguments.length === 3 ? webidl.converters.USVString(filename, prefix, "name") : void 0;
			const entry = makeEntry(name, value, filename);
			const idx = this[kState].findIndex((entry) => entry.name === name);
			if (idx !== -1) this[kState] = [
				...this[kState].slice(0, idx),
				entry,
				...this[kState].slice(idx + 1).filter((entry) => entry.name !== name)
			];
			else this[kState].push(entry);
		}
		[nodeUtil$2.inspect.custom](depth, options) {
			const state = this[kState].reduce((a, b) => {
				if (a[b.name]) if (Array.isArray(a[b.name])) a[b.name].push(b.value);
				else a[b.name] = [a[b.name], b.value];
				else a[b.name] = b.value;
				return a;
			}, { __proto__: null });
			options.depth ??= depth;
			options.colors ??= true;
			const output = nodeUtil$2.formatWithOptions(options, state);
			return `FormData ${output.slice(output.indexOf("]") + 2)}`;
		}
	};
	iteratorMixin("FormData", FormData, kState, "name", "value");
	Object.defineProperties(FormData.prototype, {
		append: kEnumerableProperty,
		delete: kEnumerableProperty,
		get: kEnumerableProperty,
		getAll: kEnumerableProperty,
		has: kEnumerableProperty,
		set: kEnumerableProperty,
		[Symbol.toStringTag]: {
			value: "FormData",
			configurable: true
		}
	});
	/**
	* @see https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#create-an-entry
	* @param {string} name
	* @param {string|Blob} value
	* @param {?string} filename
	* @returns
	*/
	function makeEntry(name, value, filename) {
		if (typeof value === "string") {} else {
			if (!isFileLike(value)) value = value instanceof Blob ? new File([value], "blob", { type: value.type }) : new FileLike(value, "blob", { type: value.type });
			if (filename !== void 0) {
				/** @type {FilePropertyBag} */
				const options = {
					type: value.type,
					lastModified: value.lastModified
				};
				value = value instanceof NativeFile ? new File([value], filename, options) : new FileLike(value, filename, options);
			}
		}
		return {
			name,
			value
		};
	}
	module.exports = {
		FormData,
		makeEntry
	};
}));
//#endregion
//#region node_modules/.pnpm/undici@6.28.0/node_modules/undici/lib/web/fetch/formdata-parser.js
var require_formdata_parser = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const { isUSVString, bufferToLowerCasedHeaderName } = require_util$7();
	const { utf8DecodeBytes } = require_util$6();
	const { HTTP_TOKEN_CODEPOINTS, isomorphicDecode } = require_data_url();
	const { isFileLike } = require_file();
	const { makeEntry } = require_formdata();
	const assert$21 = __require("node:assert");
	const { File: NodeFile } = __require("node:buffer");
	const File = globalThis.File ?? NodeFile;
	const formDataNameBuffer = Buffer.from("form-data; name=\"");
	const filenameBuffer = Buffer.from("; filename");
	const dd = Buffer.from("--");
	const ddcrlf = Buffer.from("--\r\n");
	/**
	* @param {string} chars
	*/
	function isAsciiString(chars) {
		for (let i = 0; i < chars.length; ++i) if ((chars.charCodeAt(i) & -128) !== 0) return false;
		return true;
	}
	/**
	* @see https://andreubotella.github.io/multipart-form-data/#multipart-form-data-boundary
	* @param {string} boundary
	*/
	function validateBoundary(boundary) {
		const length = boundary.length;
		if (length < 27 || length > 70) return false;
		for (let i = 0; i < length; ++i) {
			const cp = boundary.charCodeAt(i);
			if (!(cp >= 48 && cp <= 57 || cp >= 65 && cp <= 90 || cp >= 97 && cp <= 122 || cp === 39 || cp === 45 || cp === 95)) return false;
		}
		return true;
	}
	/**
	* @see https://andreubotella.github.io/multipart-form-data/#multipart-form-data-parser
	* @param {Buffer} input
	* @param {ReturnType<import('./data-url')['parseMIMEType']>} mimeType
	*/
	function multipartFormDataParser(input, mimeType) {
		assert$21(mimeType !== "failure" && mimeType.essence === "multipart/form-data");
		const boundaryString = mimeType.parameters.get("boundary");
		if (boundaryString === void 0) return "failure";
		const boundary = Buffer.from(`--${boundaryString}`, "utf8");
		const entryList = [];
		const position = { position: 0 };
		while (input[position.position] === 13 && input[position.position + 1] === 10) position.position += 2;
		let trailing = input.length;
		while (input[trailing - 1] === 10 && input[trailing - 2] === 13) trailing -= 2;
		if (trailing !== input.length) input = input.subarray(0, trailing);
		while (true) {
			if (input.subarray(position.position, position.position + boundary.length).equals(boundary)) position.position += boundary.length;
			else return "failure";
			if (position.position === input.length - 2 && bufferStartsWith(input, dd, position) || position.position === input.length - 4 && bufferStartsWith(input, ddcrlf, position)) return entryList;
			if (input[position.position] !== 13 || input[position.position + 1] !== 10) return "failure";
			position.position += 2;
			const result = parseMultipartFormDataHeaders(input, position);
			if (result === "failure") return "failure";
			let { name, filename, contentType, encoding } = result;
			position.position += 2;
			let body;
			{
				const boundaryIndex = input.indexOf(boundary.subarray(2), position.position);
				if (boundaryIndex === -1) return "failure";
				body = input.subarray(position.position, boundaryIndex - 4);
				position.position += body.length;
				if (encoding === "base64") body = Buffer.from(body.toString(), "base64");
			}
			if (input[position.position] !== 13 || input[position.position + 1] !== 10) return "failure";
			else position.position += 2;
			let value;
			if (filename !== null) {
				contentType ??= "text/plain";
				if (!isAsciiString(contentType)) contentType = "";
				value = new File([body], filename, { type: contentType });
			} else value = utf8DecodeBytes(Buffer.from(body));
			assert$21(isUSVString(name));
			assert$21(typeof value === "string" && isUSVString(value) || isFileLike(value));
			entryList.push(makeEntry(name, value, filename));
		}
	}
	/**
	* @see https://andreubotella.github.io/multipart-form-data/#parse-multipart-form-data-headers
	* @param {Buffer} input
	* @param {{ position: number }} position
	*/
	function parseMultipartFormDataHeaders(input, position) {
		let name = null;
		let filename = null;
		let contentType = null;
		let encoding = null;
		while (true) {
			if (input[position.position] === 13 && input[position.position + 1] === 10) {
				if (name === null) return "failure";
				return {
					name,
					filename,
					contentType,
					encoding
				};
			}
			let headerName = collectASequenceOfBytes((char) => char !== 10 && char !== 13 && char !== 58, input, position);
			headerName = removeChars(headerName, true, true, (char) => char === 9 || char === 32);
			if (!HTTP_TOKEN_CODEPOINTS.test(headerName.toString())) return "failure";
			if (input[position.position] !== 58) return "failure";
			position.position++;
			collectASequenceOfBytes((char) => char === 32 || char === 9, input, position);
			switch (bufferToLowerCasedHeaderName(headerName)) {
				case "content-disposition":
					name = filename = null;
					if (!bufferStartsWith(input, formDataNameBuffer, position)) return "failure";
					position.position += 17;
					name = parseMultipartFormDataName(input, position);
					if (name === null) return "failure";
					if (bufferStartsWith(input, filenameBuffer, position)) {
						let check = position.position + filenameBuffer.length;
						if (input[check] === 42) {
							position.position += 1;
							check += 1;
						}
						if (input[check] !== 61 || input[check + 1] !== 34) return "failure";
						position.position += 12;
						filename = parseMultipartFormDataName(input, position);
						if (filename === null) return "failure";
					}
					break;
				case "content-type": {
					let headerValue = collectASequenceOfBytes((char) => char !== 10 && char !== 13, input, position);
					headerValue = removeChars(headerValue, false, true, (char) => char === 9 || char === 32);
					contentType = isomorphicDecode(headerValue);
					break;
				}
				case "content-transfer-encoding": {
					let headerValue = collectASequenceOfBytes((char) => char !== 10 && char !== 13, input, position);
					headerValue = removeChars(headerValue, false, true, (char) => char === 9 || char === 32);
					encoding = isomorphicDecode(headerValue);
					break;
				}
				default: collectASequenceOfBytes((char) => char !== 10 && char !== 13, input, position);
			}
			if (input[position.position] !== 13 && input[position.position + 1] !== 10) return "failure";
			else position.position += 2;
		}
	}
	/**
	* @see https://andreubotella.github.io/multipart-form-data/#parse-a-multipart-form-data-name
	* @param {Buffer} input
	* @param {{ position: number }} position
	*/
	function parseMultipartFormDataName(input, position) {
		assert$21(input[position.position - 1] === 34);
		/** @type {string | Buffer} */
		let name = collectASequenceOfBytes((char) => char !== 10 && char !== 13 && char !== 34, input, position);
		if (input[position.position] !== 34) return null;
		else position.position++;
		name = new TextDecoder().decode(name).replace(/%0A/gi, "\n").replace(/%0D/gi, "\r").replace(/%22/g, "\"");
		return name;
	}
	/**
	* @param {(char: number) => boolean} condition
	* @param {Buffer} input
	* @param {{ position: number }} position
	*/
	function collectASequenceOfBytes(condition, input, position) {
		let start = position.position;
		while (start < input.length && condition(input[start])) ++start;
		return input.subarray(position.position, position.position = start);
	}
	/**
	* @param {Buffer} buf
	* @param {boolean} leading
	* @param {boolean} trailing
	* @param {(charCode: number) => boolean} predicate
	* @returns {Buffer}
	*/
	function removeChars(buf, leading, trailing, predicate) {
		let lead = 0;
		let trail = buf.length - 1;
		if (leading) while (lead < buf.length && predicate(buf[lead])) lead++;
		if (trailing) while (trail > 0 && predicate(buf[trail])) trail--;
		return lead === 0 && trail === buf.length - 1 ? buf : buf.subarray(lead, trail + 1);
	}
	/**
	* Checks if {@param buffer} starts with {@param start}
	* @param {Buffer} buffer
	* @param {Buffer} start
	* @param {{ position: number }} position
	*/
	function bufferStartsWith(buffer, start, position) {
		if (buffer.length < start.length) return false;
		for (let i = 0; i < start.length; i++) if (start[i] !== buffer[position.position + i]) return false;
		return true;
	}
	module.exports = {
		multipartFormDataParser,
		validateBoundary
	};
}));
//#endregion
//#region node_modules/.pnpm/undici@6.28.0/node_modules/undici/lib/web/fetch/body.js
var require_body = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const util = require_util$7();
	const { ReadableStreamFrom, isBlobLike, isReadableStreamLike, readableStreamClose, createDeferredPromise, fullyReadBody, extractMimeType, utf8DecodeBytes } = require_util$6();
	const { FormData } = require_formdata();
	const { kState } = require_symbols$3();
	const { webidl } = require_webidl();
	const { Blob: Blob$1 } = __require("node:buffer");
	const assert$20 = __require("node:assert");
	const { isErrored, isDisturbed } = __require("node:stream");
	const { isArrayBuffer } = __require("node:util/types");
	const { serializeAMimeType } = require_data_url();
	const { multipartFormDataParser } = require_formdata_parser();
	let random;
	try {
		const crypto = __require("node:crypto");
		random = (max) => crypto.randomInt(0, max);
	} catch {
		random = (max) => Math.floor(Math.random(max));
	}
	const textEncoder = new TextEncoder();
	function noop() {}
	const hasFinalizationRegistry = globalThis.FinalizationRegistry && process.version.indexOf("v18") !== 0;
	let streamRegistry;
	if (hasFinalizationRegistry) streamRegistry = new FinalizationRegistry((weakRef) => {
		const stream = weakRef.deref();
		if (stream && !stream.locked && !isDisturbed(stream) && !isErrored(stream)) stream.cancel("Response object has been garbage collected").catch(noop);
	});
	function extractBody(object, keepalive = false) {
		let stream = null;
		if (object instanceof ReadableStream) stream = object;
		else if (isBlobLike(object)) stream = object.stream();
		else stream = new ReadableStream({
			async pull(controller) {
				const buffer = typeof source === "string" ? textEncoder.encode(source) : source;
				if (buffer.byteLength) controller.enqueue(buffer);
				queueMicrotask(() => readableStreamClose(controller));
			},
			start() {},
			type: "bytes"
		});
		assert$20(isReadableStreamLike(stream));
		let action = null;
		let source = null;
		let length = null;
		let type = null;
		if (typeof object === "string") {
			source = object;
			type = "text/plain;charset=UTF-8";
		} else if (object instanceof URLSearchParams) {
			source = object.toString();
			type = "application/x-www-form-urlencoded;charset=UTF-8";
		} else if (isArrayBuffer(object)) source = new Uint8Array(object.slice());
		else if (ArrayBuffer.isView(object)) source = new Uint8Array(object.buffer.slice(object.byteOffset, object.byteOffset + object.byteLength));
		else if (util.isFormDataLike(object)) {
			const boundary = `----formdata-undici-0${`${random(1e11)}`.padStart(11, "0")}`;
			const prefix = `--${boundary}\r\nContent-Disposition: form-data`;
			/*! formdata-polyfill. MIT License. Jimmy Wärting <https://jimmy.warting.se/opensource> */
			const escape = (str) => str.replace(/\n/g, "%0A").replace(/\r/g, "%0D").replace(/"/g, "%22");
			const normalizeLinefeeds = (value) => value.replace(/\r?\n|\r/g, "\r\n");
			const blobParts = [];
			const rn = new Uint8Array([13, 10]);
			length = 0;
			let hasUnknownSizeValue = false;
			for (const [name, value] of object) if (typeof value === "string") {
				const chunk = textEncoder.encode(prefix + `; name="${escape(normalizeLinefeeds(name))}"\r\n\r\n${normalizeLinefeeds(value)}\r\n`);
				blobParts.push(chunk);
				length += chunk.byteLength;
			} else {
				const chunk = textEncoder.encode(`${prefix}; name="${escape(normalizeLinefeeds(name))}"` + (value.name ? `; filename="${escape(value.name)}"` : "") + `\r
Content-Type: ${value.type || "application/octet-stream"}\r\n\r\n`);
				blobParts.push(chunk, value, rn);
				if (typeof value.size === "number") length += chunk.byteLength + value.size + rn.byteLength;
				else hasUnknownSizeValue = true;
			}
			const chunk = textEncoder.encode(`--${boundary}--\r\n`);
			blobParts.push(chunk);
			length += chunk.byteLength;
			if (hasUnknownSizeValue) length = null;
			source = object;
			action = async function* () {
				for (const part of blobParts) if (part.stream) yield* part.stream();
				else yield part;
			};
			type = `multipart/form-data; boundary=${boundary}`;
		} else if (isBlobLike(object)) {
			source = object;
			length = object.size;
			if (object.type) type = object.type;
		} else if (typeof object[Symbol.asyncIterator] === "function") {
			if (keepalive) throw new TypeError("keepalive");
			if (util.isDisturbed(object) || object.locked) throw new TypeError("Response body object should not be disturbed or locked");
			stream = object instanceof ReadableStream ? object : ReadableStreamFrom(object);
		}
		if (typeof source === "string" || util.isBuffer(source)) length = Buffer.byteLength(source);
		if (action != null) {
			let iterator;
			stream = new ReadableStream({
				async start() {
					iterator = action(object)[Symbol.asyncIterator]();
				},
				async pull(controller) {
					const { value, done } = await iterator.next();
					if (done) queueMicrotask(() => {
						controller.close();
						controller.byobRequest?.respond(0);
					});
					else if (!isErrored(stream)) {
						const buffer = new Uint8Array(value);
						if (buffer.byteLength) controller.enqueue(buffer);
					}
					return controller.desiredSize > 0;
				},
				async cancel(reason) {
					await iterator.return();
				},
				type: "bytes"
			});
		}
		return [{
			stream,
			source,
			length
		}, type];
	}
	function safelyExtractBody(object, keepalive = false) {
		if (object instanceof ReadableStream) {
			// istanbul ignore next
			assert$20(!util.isDisturbed(object), "The body has already been consumed.");
			// istanbul ignore next
			assert$20(!object.locked, "The stream is locked.");
		}
		return extractBody(object, keepalive);
	}
	function cloneBody(instance, body) {
		const [out1, out2] = body.stream.tee();
		body.stream = out1;
		return {
			stream: out2,
			length: body.length,
			source: body.source
		};
	}
	function throwIfAborted(state) {
		if (state.aborted) throw new DOMException("The operation was aborted.", "AbortError");
	}
	function bodyMixinMethods(instance) {
		return {
			blob() {
				return consumeBody(this, (bytes) => {
					let mimeType = bodyMimeType(this);
					if (mimeType === null) mimeType = "";
					else if (mimeType) mimeType = serializeAMimeType(mimeType);
					return new Blob$1([bytes], { type: mimeType });
				}, instance);
			},
			arrayBuffer() {
				return consumeBody(this, (bytes) => {
					return new Uint8Array(bytes).buffer;
				}, instance);
			},
			text() {
				return consumeBody(this, utf8DecodeBytes, instance);
			},
			json() {
				return consumeBody(this, parseJSONFromBytes, instance);
			},
			formData() {
				return consumeBody(this, (value) => {
					const mimeType = bodyMimeType(this);
					if (mimeType !== null) switch (mimeType.essence) {
						case "multipart/form-data": {
							const parsed = multipartFormDataParser(value, mimeType);
							if (parsed === "failure") throw new TypeError("Failed to parse body as FormData.");
							const fd = new FormData();
							fd[kState] = parsed;
							return fd;
						}
						case "application/x-www-form-urlencoded": {
							const entries = new URLSearchParams(value.toString());
							const fd = new FormData();
							for (const [name, value] of entries) fd.append(name, value);
							return fd;
						}
					}
					throw new TypeError("Content-Type was not one of \"multipart/form-data\" or \"application/x-www-form-urlencoded\".");
				}, instance);
			},
			bytes() {
				return consumeBody(this, (bytes) => {
					return new Uint8Array(bytes);
				}, instance);
			}
		};
	}
	function mixinBody(prototype) {
		Object.assign(prototype.prototype, bodyMixinMethods(prototype));
	}
	/**
	* @see https://fetch.spec.whatwg.org/#concept-body-consume-body
	* @param {Response|Request} object
	* @param {(value: unknown) => unknown} convertBytesToJSValue
	* @param {Response|Request} instance
	*/
	async function consumeBody(object, convertBytesToJSValue, instance) {
		webidl.brandCheck(object, instance);
		if (bodyUnusable(object)) throw new TypeError("Body is unusable: Body has already been read");
		throwIfAborted(object[kState]);
		const promise = createDeferredPromise();
		const errorSteps = (error) => promise.reject(error);
		const successSteps = (data) => {
			try {
				promise.resolve(convertBytesToJSValue(data));
			} catch (e) {
				errorSteps(e);
			}
		};
		if (object[kState].body == null) {
			successSteps(Buffer.allocUnsafe(0));
			return promise.promise;
		}
		await fullyReadBody(object[kState].body, successSteps, errorSteps);
		return promise.promise;
	}
	function bodyUnusable(object) {
		const body = object[kState].body;
		return body != null && (body.stream.locked || util.isDisturbed(body.stream));
	}
	/**
	* @see https://infra.spec.whatwg.org/#parse-json-bytes-to-a-javascript-value
	* @param {Uint8Array} bytes
	*/
	function parseJSONFromBytes(bytes) {
		return JSON.parse(utf8DecodeBytes(bytes));
	}
	/**
	* @see https://fetch.spec.whatwg.org/#concept-body-mime-type
	* @param {import('./response').Response|import('./request').Request} requestOrResponse
	*/
	function bodyMimeType(requestOrResponse) {
		/** @type {import('./headers').HeadersList} */
		const headers = requestOrResponse[kState].headersList;
		const mimeType = extractMimeType(headers);
		if (mimeType === "failure") return null;
		return mimeType;
	}
	module.exports = {
		extractBody,
		safelyExtractBody,
		cloneBody,
		mixinBody,
		streamRegistry,
		hasFinalizationRegistry,
		bodyUnusable
	};
}));
//#endregion
//#region node_modules/.pnpm/undici@6.28.0/node_modules/undici/lib/dispatcher/client-h1.js
var require_client_h1 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const assert$19 = __require("node:assert");
	const util = require_util$7();
	const { channels } = require_diagnostics();
	const timers = require_timers();
	const { RequestContentLengthMismatchError, ResponseContentLengthMismatchError, RequestAbortedError, InvalidArgumentError, HeadersTimeoutError, HeadersOverflowError, SocketError, InformationalError, BodyTimeoutError, HTTPParserError, ResponseExceededMaxSizeError } = require_errors();
	const { kUrl, kReset, kClient, kParser, kBlocking, kRunning, kPending, kSize, kWriting, kQueue, kNoRef, kKeepAliveDefaultTimeout, kHostHeader, kPendingIdx, kRunningIdx, kError, kPipelining, kSocket, kKeepAliveTimeoutValue, kMaxHeadersSize, kKeepAliveMaxTimeout, kKeepAliveTimeoutThreshold, kHeadersTimeout, kBodyTimeout, kStrictContentLength, kMaxRequests, kCounter, kMaxResponseSize, kOnError, kResume, kHTTPContext } = require_symbols$4();
	const constants = require_constants$3();
	const EMPTY_BUF = Buffer.alloc(0);
	const FastBuffer = Buffer[Symbol.species];
	const addListener = util.addListener;
	const removeAllListeners = util.removeAllListeners;
	const kIdleSocketValidation = Symbol("kIdleSocketValidation");
	const kIdleSocketValidationTimeout = Symbol("kIdleSocketValidationTimeout");
	const kSocketUsed = Symbol("kSocketUsed");
	let extractBody;
	async function lazyllhttp() {
		const llhttpWasmData = process.env.JEST_WORKER_ID ? require_llhttp_wasm() : void 0;
		let mod;
		try {
			mod = await WebAssembly.compile(require_llhttp_simd_wasm());
		} catch (e) {
			/* istanbul ignore next */
			mod = await WebAssembly.compile(llhttpWasmData || require_llhttp_wasm());
		}
		return await WebAssembly.instantiate(mod, { env: {
			wasm_on_url: (p, at, len) => {
				/* istanbul ignore next */
				return 0;
			},
			wasm_on_status: (p, at, len) => {
				assert$19(currentParser.ptr === p);
				const start = at - currentBufferPtr + currentBufferRef.byteOffset;
				return currentParser.onStatus(new FastBuffer(currentBufferRef.buffer, start, len)) || 0;
			},
			wasm_on_message_begin: (p) => {
				assert$19(currentParser.ptr === p);
				return currentParser.onMessageBegin() || 0;
			},
			wasm_on_header_field: (p, at, len) => {
				assert$19(currentParser.ptr === p);
				const start = at - currentBufferPtr + currentBufferRef.byteOffset;
				return currentParser.onHeaderField(new FastBuffer(currentBufferRef.buffer, start, len)) || 0;
			},
			wasm_on_header_value: (p, at, len) => {
				assert$19(currentParser.ptr === p);
				const start = at - currentBufferPtr + currentBufferRef.byteOffset;
				return currentParser.onHeaderValue(new FastBuffer(currentBufferRef.buffer, start, len)) || 0;
			},
			wasm_on_headers_complete: (p, statusCode, upgrade, shouldKeepAlive) => {
				assert$19(currentParser.ptr === p);
				return currentParser.onHeadersComplete(statusCode, Boolean(upgrade), Boolean(shouldKeepAlive)) || 0;
			},
			wasm_on_body: (p, at, len) => {
				assert$19(currentParser.ptr === p);
				const start = at - currentBufferPtr + currentBufferRef.byteOffset;
				return currentParser.onBody(new FastBuffer(currentBufferRef.buffer, start, len)) || 0;
			},
			wasm_on_message_complete: (p) => {
				assert$19(currentParser.ptr === p);
				return currentParser.onMessageComplete() || 0;
			}
		} });
	}
	let llhttpInstance = null;
	let llhttpPromise = lazyllhttp();
	llhttpPromise.catch();
	let currentParser = null;
	let currentBufferRef = null;
	let currentBufferSize = 0;
	let currentBufferPtr = null;
	const USE_FAST_TIMER = 1;
	const TIMEOUT_HEADERS = 3;
	const TIMEOUT_BODY = 5;
	const TIMEOUT_KEEP_ALIVE = 8;
	var Parser = class {
		constructor(client, socket, { exports: exports$2 }) {
			assert$19(Number.isFinite(client[kMaxHeadersSize]) && client[kMaxHeadersSize] > 0);
			this.llhttp = exports$2;
			this.ptr = this.llhttp.llhttp_alloc(constants.TYPE.RESPONSE);
			this.client = client;
			this.socket = socket;
			this.timeout = null;
			this.timeoutValue = null;
			this.timeoutType = null;
			this.statusCode = null;
			this.statusText = "";
			this.upgrade = false;
			this.headers = [];
			this.headersSize = 0;
			this.headersMaxSize = client[kMaxHeadersSize];
			this.shouldKeepAlive = false;
			this.paused = false;
			this.resume = this.resume.bind(this);
			this.bytesRead = 0;
			this.keepAlive = "";
			this.contentLength = "";
			this.connection = "";
			this.maxResponseSize = client[kMaxResponseSize];
		}
		setTimeout(delay, type) {
			if (delay !== this.timeoutValue || type & USE_FAST_TIMER ^ this.timeoutType & USE_FAST_TIMER) {
				if (this.timeout) {
					timers.clearTimeout(this.timeout);
					this.timeout = null;
				}
				if (delay) if (type & USE_FAST_TIMER) this.timeout = timers.setFastTimeout(onParserTimeout, delay, new WeakRef(this));
				else {
					this.timeout = setTimeout(onParserTimeout, delay, new WeakRef(this));
					this.timeout.unref();
				}
				this.timeoutValue = delay;
			} else if (this.timeout) {
				// istanbul ignore else: only for jest
				if (this.timeout.refresh) this.timeout.refresh();
			}
			this.timeoutType = type;
		}
		resume() {
			if (this.socket.destroyed || !this.paused) return;
			assert$19(this.ptr != null);
			assert$19(currentParser == null);
			this.llhttp.llhttp_resume(this.ptr);
			assert$19(this.timeoutType === TIMEOUT_BODY);
			if (this.timeout) {
				// istanbul ignore else: only for jest
				if (this.timeout.refresh) this.timeout.refresh();
			}
			this.paused = false;
			this.execute(this.socket.read() || EMPTY_BUF);
			this.readMore();
		}
		readMore() {
			while (!this.paused && this.ptr) {
				const chunk = this.socket.read();
				if (chunk === null) break;
				this.execute(chunk);
			}
		}
		execute(data) {
			assert$19(this.ptr != null);
			assert$19(currentParser == null);
			assert$19(!this.paused);
			const { socket, llhttp } = this;
			if (data.length > currentBufferSize) {
				if (currentBufferPtr) llhttp.free(currentBufferPtr);
				currentBufferSize = Math.ceil(data.length / 4096) * 4096;
				currentBufferPtr = llhttp.malloc(currentBufferSize);
			}
			new Uint8Array(llhttp.memory.buffer, currentBufferPtr, currentBufferSize).set(data);
			try {
				let ret;
				try {
					currentBufferRef = data;
					currentParser = this;
					ret = llhttp.llhttp_execute(this.ptr, currentBufferPtr, data.length);
				} catch (err) {
					/* istanbul ignore next: difficult to make a test case for */
					throw err;
				} finally {
					currentParser = null;
					currentBufferRef = null;
				}
				const offset = llhttp.llhttp_get_error_pos(this.ptr) - currentBufferPtr;
				if (ret !== constants.ERROR.OK) {
					const body = data.subarray(offset);
					if (ret === constants.ERROR.PAUSED_UPGRADE) this.onUpgrade(body);
					else if (ret === constants.ERROR.PAUSED) {
						this.paused = true;
						socket.unshift(body);
					} else throw this.createError(ret, body);
				}
			} catch (err) {
				util.destroy(socket, err);
			}
		}
		finish() {
			assert$19(currentParser === null);
			assert$19(this.ptr != null);
			assert$19(!this.paused);
			const { llhttp } = this;
			let ret;
			try {
				currentParser = this;
				ret = llhttp.llhttp_finish(this.ptr);
			} finally {
				currentParser = null;
			}
			if (ret === constants.ERROR.OK) return null;
			if (ret === constants.ERROR.PAUSED || ret === constants.ERROR.PAUSED_UPGRADE) {
				this.paused = true;
				return null;
			}
			return this.createError(ret, EMPTY_BUF);
		}
		createError(ret, data) {
			const { llhttp, contentLength, bytesRead } = this;
			if (contentLength && bytesRead !== parseInt(contentLength, 10)) return new ResponseContentLengthMismatchError();
			const ptr = llhttp.llhttp_get_error_reason(this.ptr);
			let message = "";
			if (ptr) {
				const len = new Uint8Array(llhttp.memory.buffer, ptr).indexOf(0);
				message = "Response does not match the HTTP/1.1 protocol (" + Buffer.from(llhttp.memory.buffer, ptr, len).toString() + ")";
			}
			return new HTTPParserError(message, constants.ERROR[ret], data);
		}
		destroy() {
			assert$19(this.ptr != null);
			assert$19(currentParser == null);
			this.llhttp.llhttp_free(this.ptr);
			this.ptr = null;
			this.timeout && timers.clearTimeout(this.timeout);
			this.timeout = null;
			this.timeoutValue = null;
			this.timeoutType = null;
			this.paused = false;
		}
		onStatus(buf) {
			this.statusText = buf.toString();
		}
		onMessageBegin() {
			const { socket, client } = this;
			/* istanbul ignore next: difficult to make a test case for */
			if (socket.destroyed) return -1;
			if (client[kRunning] === 0) {
				util.destroy(socket, new SocketError("bad response", util.getSocketInfo(socket)));
				return -1;
			}
			const request = client[kQueue][client[kRunningIdx]];
			if (!request) return -1;
			request.onResponseStarted();
		}
		onHeaderField(buf) {
			const len = this.headers.length;
			if ((len & 1) === 0) this.headers.push(buf);
			else this.headers[len - 1] = Buffer.concat([this.headers[len - 1], buf]);
			this.trackHeader(buf.length);
		}
		onHeaderValue(buf) {
			let len = this.headers.length;
			if ((len & 1) === 1) {
				this.headers.push(buf);
				len += 1;
			} else this.headers[len - 1] = Buffer.concat([this.headers[len - 1], buf]);
			const key = this.headers[len - 2];
			if (key.length === 10) {
				const headerName = util.bufferToLowerCasedHeaderName(key);
				if (headerName === "keep-alive") this.keepAlive += buf.toString();
				else if (headerName === "connection") this.connection += buf.toString();
			} else if (key.length === 14 && util.bufferToLowerCasedHeaderName(key) === "content-length") this.contentLength += buf.toString();
			this.trackHeader(buf.length);
		}
		trackHeader(len) {
			this.headersSize += len;
			if (this.headersSize >= this.headersMaxSize) util.destroy(this.socket, new HeadersOverflowError());
		}
		onUpgrade(head) {
			const { upgrade, client, socket, headers, statusCode } = this;
			assert$19(upgrade);
			assert$19(client[kSocket] === socket);
			assert$19(!socket.destroyed);
			assert$19(!this.paused);
			assert$19((headers.length & 1) === 0);
			const request = client[kQueue][client[kRunningIdx]];
			assert$19(request);
			assert$19(request.upgrade || request.method === "CONNECT");
			this.statusCode = null;
			this.statusText = "";
			this.shouldKeepAlive = null;
			this.headers = [];
			this.headersSize = 0;
			socket.unshift(head);
			socket[kParser].destroy();
			socket[kParser] = null;
			socket[kClient] = null;
			socket[kError] = null;
			removeAllListeners(socket);
			client[kSocket] = null;
			client[kHTTPContext] = null;
			client[kQueue][client[kRunningIdx]++] = null;
			client.emit("disconnect", client[kUrl], [client], new InformationalError("upgrade"));
			try {
				request.onUpgrade(statusCode, headers, socket);
			} catch (err) {
				util.destroy(socket, err);
			}
			client[kResume]();
		}
		onHeadersComplete(statusCode, upgrade, shouldKeepAlive) {
			const { client, socket, headers, statusText } = this;
			/* istanbul ignore next: difficult to make a test case for */
			if (socket.destroyed) return -1;
			if (client[kRunning] === 0) {
				util.destroy(socket, new SocketError("bad response", util.getSocketInfo(socket)));
				return -1;
			}
			const request = client[kQueue][client[kRunningIdx]];
			/* istanbul ignore next: difficult to make a test case for */
			if (!request) return -1;
			assert$19(!this.upgrade);
			assert$19(this.statusCode < 200);
			if (statusCode === 100) {
				util.destroy(socket, new SocketError("bad response", util.getSocketInfo(socket)));
				return -1;
			}
			if (upgrade && !request.upgrade) {
				util.destroy(socket, new SocketError("bad upgrade", util.getSocketInfo(socket)));
				return -1;
			}
			assert$19(this.timeoutType === TIMEOUT_HEADERS);
			this.statusCode = statusCode;
			this.shouldKeepAlive = shouldKeepAlive || request.method === "HEAD" && !socket[kReset] && this.connection.toLowerCase() === "keep-alive";
			if (this.statusCode >= 200) {
				const bodyTimeout = request.bodyTimeout != null ? request.bodyTimeout : client[kBodyTimeout];
				this.setTimeout(bodyTimeout, TIMEOUT_BODY);
			} else if (this.timeout) {
				// istanbul ignore else: only for jest
				if (this.timeout.refresh) this.timeout.refresh();
			}
			if (request.method === "CONNECT") {
				assert$19(client[kRunning] === 1);
				this.upgrade = true;
				return 2;
			}
			if (upgrade) {
				assert$19(client[kRunning] === 1);
				this.upgrade = true;
				return 2;
			}
			assert$19((this.headers.length & 1) === 0);
			this.headers = [];
			this.headersSize = 0;
			if (this.shouldKeepAlive && client[kPipelining]) {
				const keepAliveTimeout = this.keepAlive ? util.parseKeepAliveTimeout(this.keepAlive) : null;
				if (keepAliveTimeout != null) {
					const timeout = Math.min(keepAliveTimeout - client[kKeepAliveTimeoutThreshold], client[kKeepAliveMaxTimeout]);
					if (timeout <= 0) socket[kReset] = true;
					else client[kKeepAliveTimeoutValue] = timeout;
				} else client[kKeepAliveTimeoutValue] = client[kKeepAliveDefaultTimeout];
			} else socket[kReset] = true;
			const pause = request.onHeaders(statusCode, headers, this.resume, statusText) === false;
			if (request.aborted) return -1;
			if (request.method === "HEAD") return 1;
			if (statusCode < 200) return 1;
			if (socket[kBlocking]) {
				socket[kBlocking] = false;
				client[kResume]();
			}
			return pause ? constants.ERROR.PAUSED : 0;
		}
		onBody(buf) {
			const { client, socket, statusCode, maxResponseSize } = this;
			if (socket.destroyed) return -1;
			const request = client[kQueue][client[kRunningIdx]];
			assert$19(request);
			assert$19(this.timeoutType === TIMEOUT_BODY);
			if (this.timeout) {
				// istanbul ignore else: only for jest
				if (this.timeout.refresh) this.timeout.refresh();
			}
			assert$19(statusCode >= 200);
			if (maxResponseSize > -1 && this.bytesRead + buf.length > maxResponseSize) {
				util.destroy(socket, new ResponseExceededMaxSizeError());
				return -1;
			}
			this.bytesRead += buf.length;
			if (request.onData(buf) === false) return constants.ERROR.PAUSED;
		}
		onMessageComplete() {
			const { client, socket, statusCode, upgrade, headers, contentLength, bytesRead, shouldKeepAlive } = this;
			if (socket.destroyed && (!statusCode || shouldKeepAlive)) return -1;
			if (upgrade) return;
			assert$19(statusCode >= 100);
			assert$19((this.headers.length & 1) === 0);
			const request = client[kQueue][client[kRunningIdx]];
			assert$19(request);
			this.statusCode = null;
			this.statusText = "";
			this.bytesRead = 0;
			this.contentLength = "";
			this.keepAlive = "";
			this.connection = "";
			this.headers = [];
			this.headersSize = 0;
			if (statusCode < 200) return;
			/* istanbul ignore next: should be handled by llhttp? */
			if (request.method !== "HEAD" && contentLength && bytesRead !== parseInt(contentLength, 10)) {
				util.destroy(socket, new ResponseContentLengthMismatchError());
				return -1;
			}
			request.onComplete(headers);
			client[kQueue][client[kRunningIdx]++] = null;
			socket[kSocketUsed] = true;
			if (socket[kWriting]) {
				assert$19(client[kRunning] === 0);
				util.destroy(socket, new InformationalError("reset"));
				return constants.ERROR.PAUSED;
			} else if (!shouldKeepAlive) {
				util.destroy(socket, new InformationalError("reset"));
				return constants.ERROR.PAUSED;
			} else if (socket[kReset] && client[kRunning] === 0) {
				util.destroy(socket, new InformationalError("reset"));
				return constants.ERROR.PAUSED;
			} else if (client[kPipelining] == null || client[kPipelining] === 1) setImmediate(() => client[kResume]());
			else client[kResume]();
		}
	};
	function onParserTimeout(parser) {
		const { socket, timeoutType, client, paused } = parser.deref();
		/* istanbul ignore else */
		if (timeoutType === TIMEOUT_HEADERS) {
			if (!socket[kWriting] || socket.writableNeedDrain || client[kRunning] > 1) {
				assert$19(!paused, "cannot be paused while waiting for headers");
				util.destroy(socket, new HeadersTimeoutError());
			}
		} else if (timeoutType === TIMEOUT_BODY) {
			if (!paused) util.destroy(socket, new BodyTimeoutError());
		} else if (timeoutType === TIMEOUT_KEEP_ALIVE) {
			assert$19(client[kRunning] === 0 && client[kKeepAliveTimeoutValue]);
			util.destroy(socket, new InformationalError("socket idle timeout"));
		}
	}
	async function connectH1(client, socket) {
		client[kSocket] = socket;
		if (!llhttpInstance) {
			llhttpInstance = await llhttpPromise;
			llhttpPromise = null;
		}
		socket[kNoRef] = false;
		socket[kWriting] = false;
		socket[kReset] = false;
		socket[kBlocking] = false;
		socket[kIdleSocketValidation] = 0;
		socket[kIdleSocketValidationTimeout] = null;
		socket[kSocketUsed] = false;
		socket[kParser] = new Parser(client, socket, llhttpInstance);
		addListener(socket, "error", function(err) {
			assert$19(err.code !== "ERR_TLS_CERT_ALTNAME_INVALID");
			const parser = this[kParser];
			if (err.code === "ECONNRESET" && parser.statusCode && !parser.shouldKeepAlive) {
				const parserErr = parser.finish();
				if (parserErr) {
					this[kError] = parserErr;
					this[kClient][kOnError](parserErr);
				}
				return;
			}
			this[kError] = err;
			this[kClient][kOnError](err);
		});
		addListener(socket, "readable", function() {
			const parser = this[kParser];
			if (parser) parser.readMore();
		});
		addListener(socket, "end", function() {
			const parser = this[kParser];
			if (parser.statusCode && !parser.shouldKeepAlive) {
				const parserErr = parser.finish();
				if (parserErr) util.destroy(this, parserErr);
				return;
			}
			util.destroy(this, new SocketError("other side closed", util.getSocketInfo(this)));
		});
		addListener(socket, "close", function() {
			const client = this[kClient];
			const parser = this[kParser];
			clearIdleSocketValidation(this);
			if (parser) {
				if (!this[kError] && parser.statusCode && !parser.shouldKeepAlive) this[kError] = parser.finish() || this[kError];
				this[kParser].destroy();
				this[kParser] = null;
			}
			const err = this[kError] || new SocketError("closed", util.getSocketInfo(this));
			client[kSocket] = null;
			client[kHTTPContext] = null;
			if (client.destroyed) {
				assert$19(client[kPending] === 0);
				const requests = client[kQueue].splice(client[kRunningIdx]);
				for (let i = 0; i < requests.length; i++) {
					const request = requests[i];
					util.errorRequest(client, request, err);
				}
			} else if (client[kRunning] > 0 && err.code !== "UND_ERR_INFO") {
				const request = client[kQueue][client[kRunningIdx]];
				client[kQueue][client[kRunningIdx]++] = null;
				util.errorRequest(client, request, err);
			}
			client[kPendingIdx] = client[kRunningIdx];
			assert$19(client[kRunning] === 0);
			client.emit("disconnect", client[kUrl], [client], err);
			client[kResume]();
		});
		let closed = false;
		socket.on("close", () => {
			closed = true;
		});
		return {
			version: "h1",
			defaultPipelining: 1,
			write(...args) {
				return writeH1(client, ...args);
			},
			resume() {
				resumeH1(client);
			},
			destroy(err, callback) {
				if (closed) queueMicrotask(callback);
				else socket.destroy(err).on("close", callback);
			},
			get destroyed() {
				return socket.destroyed;
			},
			busy(request) {
				if (socket[kWriting] || socket[kReset] || socket[kBlocking] || socket[kIdleSocketValidation] === 1) return true;
				if (request) {
					if (client[kRunning] > 0 && !request.idempotent) return true;
					if (client[kRunning] > 0 && (request.upgrade || request.method === "CONNECT")) return true;
					if (client[kRunning] > 0 && util.bodyLength(request.body) !== 0 && (util.isStream(request.body) || util.isAsyncIterable(request.body) || util.isFormDataLike(request.body))) return true;
				}
				return false;
			}
		};
	}
	function clearIdleSocketValidation(socket) {
		if (socket[kIdleSocketValidationTimeout]) {
			clearTimeout(socket[kIdleSocketValidationTimeout]);
			socket[kIdleSocketValidationTimeout] = null;
		}
		socket[kIdleSocketValidation] = 0;
	}
	function scheduleIdleSocketValidation(client, socket) {
		socket[kIdleSocketValidation] = 1;
		socket[kIdleSocketValidationTimeout] = setTimeout(() => {
			socket[kIdleSocketValidationTimeout] = null;
			socket[kIdleSocketValidation] = 2;
			if (client[kSocket] === socket && !socket.destroyed) client[kResume]();
		}, 0);
		socket[kIdleSocketValidationTimeout].unref?.();
	}
	/**
	* @param {import('./client.js')} client
	*/
	function resumeH1(client) {
		const socket = client[kSocket];
		if (socket && !socket.destroyed) {
			if (client[kSize] === 0) {
				if (!socket[kNoRef] && socket.unref) {
					socket.unref();
					socket[kNoRef] = true;
				}
			} else if (socket[kNoRef] && socket.ref) {
				socket.ref();
				socket[kNoRef] = false;
			}
			if (client[kRunning] === 0 && client[kPending] > 0 && socket[kSocketUsed]) {
				if (socket[kIdleSocketValidation] === 0) {
					scheduleIdleSocketValidation(client, socket);
					socket[kParser].readMore();
					if (socket.destroyed) return;
					return;
				}
				if (socket[kIdleSocketValidation] === 1) {
					socket[kParser].readMore();
					if (socket.destroyed) return;
					return;
				}
			}
			if (client[kRunning] === 0) {
				socket[kParser].readMore();
				if (socket.destroyed) return;
			}
			if (client[kSize] === 0) {
				if (socket[kParser].timeoutType !== TIMEOUT_KEEP_ALIVE) socket[kParser].setTimeout(client[kKeepAliveTimeoutValue], TIMEOUT_KEEP_ALIVE);
			} else if (client[kRunning] > 0 && socket[kParser].statusCode < 200) {
				if (socket[kParser].timeoutType !== TIMEOUT_HEADERS) {
					const request = client[kQueue][client[kRunningIdx]];
					const headersTimeout = request.headersTimeout != null ? request.headersTimeout : client[kHeadersTimeout];
					socket[kParser].setTimeout(headersTimeout, TIMEOUT_HEADERS);
				}
			}
		}
	}
	function shouldSendContentLength(method) {
		return method !== "GET" && method !== "HEAD" && method !== "OPTIONS" && method !== "TRACE" && method !== "CONNECT";
	}
	function writeH1(client, request) {
		const { method, path, host, upgrade, blocking, reset } = request;
		let { body, headers, contentLength } = request;
		const expectsPayload = method === "PUT" || method === "POST" || method === "PATCH" || method === "QUERY" || method === "PROPFIND" || method === "PROPPATCH";
		if (util.isFormDataLike(body)) {
			if (!extractBody) extractBody = require_body().extractBody;
			const [bodyStream, contentType] = extractBody(body);
			if (request.contentType == null) headers.push("content-type", contentType);
			body = bodyStream.stream;
			contentLength = bodyStream.length;
		} else if (util.isBlobLike(body) && request.contentType == null) {
			const contentType = body.type;
			if (contentType) {
				const contentTypeValue = `${contentType}`;
				if (!util.isValidHeaderValue(contentTypeValue)) {
					util.errorRequest(client, request, new InvalidArgumentError("invalid content-type header"));
					return false;
				}
				headers.push("content-type", contentTypeValue);
			}
		}
		if (body && typeof body.read === "function") body.read(0);
		const bodyLength = util.bodyLength(body);
		contentLength = bodyLength ?? contentLength;
		if (contentLength === null) contentLength = request.contentLength;
		if (contentLength === 0 && !expectsPayload) contentLength = null;
		if (shouldSendContentLength(method) && contentLength > 0 && request.contentLength !== null && request.contentLength !== contentLength) {
			if (client[kStrictContentLength]) {
				util.errorRequest(client, request, new RequestContentLengthMismatchError());
				return false;
			}
			process.emitWarning(new RequestContentLengthMismatchError());
		}
		const socket = client[kSocket];
		clearIdleSocketValidation(socket);
		const abort = (err) => {
			if (request.aborted || request.completed) return;
			util.errorRequest(client, request, err || new RequestAbortedError());
			util.destroy(body);
			util.destroy(socket, new InformationalError("aborted"));
		};
		try {
			request.onConnect(abort);
		} catch (err) {
			util.errorRequest(client, request, err);
		}
		if (request.aborted) return false;
		if (method === "HEAD") socket[kReset] = true;
		if (upgrade || method === "CONNECT") socket[kReset] = true;
		if (reset != null) socket[kReset] = reset;
		if (client[kMaxRequests] && socket[kCounter]++ >= client[kMaxRequests]) socket[kReset] = true;
		if (blocking) socket[kBlocking] = true;
		let header = `${method} ${path} HTTP/1.1\r\n`;
		if (typeof host === "string") header += `host: ${host}\r\n`;
		else header += client[kHostHeader];
		if (upgrade) header += `connection: upgrade\r\nupgrade: ${upgrade}\r\n`;
		else if (client[kPipelining] && !socket[kReset]) header += "connection: keep-alive\r\n";
		else header += "connection: close\r\n";
		if (Array.isArray(headers)) for (let n = 0; n < headers.length; n += 2) {
			const key = headers[n + 0];
			const val = headers[n + 1];
			if (Array.isArray(val)) for (let i = 0; i < val.length; i++) header += `${key}: ${val[i]}\r\n`;
			else header += `${key}: ${val}\r\n`;
		}
		if (channels.sendHeaders.hasSubscribers) channels.sendHeaders.publish({
			request,
			headers: header,
			socket
		});
		/* istanbul ignore else: assertion */
		if (!body || bodyLength === 0) writeBuffer(abort, null, client, request, socket, contentLength, header, expectsPayload);
		else if (util.isBuffer(body)) writeBuffer(abort, body, client, request, socket, contentLength, header, expectsPayload);
		else if (util.isBlobLike(body)) if (typeof body.stream === "function") writeIterable(abort, body.stream(), client, request, socket, contentLength, header, expectsPayload);
		else writeBlob(abort, body, client, request, socket, contentLength, header, expectsPayload);
		else if (util.isStream(body)) writeStream(abort, body, client, request, socket, contentLength, header, expectsPayload);
		else if (util.isIterable(body)) writeIterable(abort, body, client, request, socket, contentLength, header, expectsPayload);
		else assert$19(false);
		return true;
	}
	function writeStream(abort, body, client, request, socket, contentLength, header, expectsPayload) {
		assert$19(contentLength !== 0 || client[kRunning] === 0, "stream body cannot be pipelined");
		let finished = false;
		const writer = new AsyncWriter({
			abort,
			socket,
			request,
			contentLength,
			client,
			expectsPayload,
			header
		});
		const onData = function(chunk) {
			if (finished) return;
			try {
				if (!writer.write(chunk) && this.pause) this.pause();
			} catch (err) {
				util.destroy(this, err);
			}
		};
		const onDrain = function() {
			if (finished) return;
			if (body.resume) body.resume();
		};
		const onClose = function() {
			queueMicrotask(() => {
				body.removeListener("error", onFinished);
			});
			if (!finished) {
				const err = new RequestAbortedError();
				queueMicrotask(() => onFinished(err));
			}
		};
		const onFinished = function(err) {
			if (finished) return;
			finished = true;
			assert$19(socket.destroyed || socket[kWriting] && client[kRunning] <= 1);
			socket.off("drain", onDrain).off("error", onFinished);
			body.removeListener("data", onData).removeListener("end", onFinished).removeListener("close", onClose);
			if (!err) try {
				writer.end();
			} catch (er) {
				err = er;
			}
			writer.destroy(err);
			if (err && (err.code !== "UND_ERR_INFO" || err.message !== "reset")) util.destroy(body, err);
			else util.destroy(body);
		};
		body.on("data", onData).on("end", onFinished).on("error", onFinished).on("close", onClose);
		if (body.resume) body.resume();
		socket.on("drain", onDrain).on("error", onFinished);
		if (body.errorEmitted ?? body.errored) setImmediate(() => onFinished(body.errored));
		else if (body.endEmitted ?? body.readableEnded) setImmediate(() => onFinished(null));
		if (body.closeEmitted ?? body.closed) setImmediate(onClose);
	}
	function writeBuffer(abort, body, client, request, socket, contentLength, header, expectsPayload) {
		try {
			if (!body) if (contentLength === 0) socket.write(`${header}content-length: 0\r\n\r\n`, "latin1");
			else {
				assert$19(contentLength === null, "no body must not have content length");
				socket.write(`${header}\r\n`, "latin1");
			}
			else if (util.isBuffer(body)) {
				assert$19(contentLength === body.byteLength, "buffer body must have content length");
				socket.cork();
				socket.write(`${header}content-length: ${contentLength}\r\n\r\n`, "latin1");
				socket.write(body);
				socket.uncork();
				request.onBodySent(body);
				if (!expectsPayload && request.reset !== false) socket[kReset] = true;
			}
			request.onRequestSent();
			client[kResume]();
		} catch (err) {
			abort(err);
		}
	}
	async function writeBlob(abort, body, client, request, socket, contentLength, header, expectsPayload) {
		assert$19(contentLength === body.size, "blob body must have content length");
		try {
			if (contentLength != null && contentLength !== body.size) throw new RequestContentLengthMismatchError();
			const buffer = Buffer.from(await body.arrayBuffer());
			socket.cork();
			socket.write(`${header}content-length: ${contentLength}\r\n\r\n`, "latin1");
			socket.write(buffer);
			socket.uncork();
			request.onBodySent(buffer);
			request.onRequestSent();
			if (!expectsPayload && request.reset !== false) socket[kReset] = true;
			client[kResume]();
		} catch (err) {
			abort(err);
		}
	}
	async function writeIterable(abort, body, client, request, socket, contentLength, header, expectsPayload) {
		assert$19(contentLength !== 0 || client[kRunning] === 0, "iterator body cannot be pipelined");
		let callback = null;
		function onDrain() {
			if (callback) {
				const cb = callback;
				callback = null;
				cb();
			}
		}
		const waitForDrain = () => new Promise((resolve, reject) => {
			assert$19(callback === null);
			if (socket[kError]) reject(socket[kError]);
			else callback = resolve;
		});
		socket.on("close", onDrain).on("drain", onDrain);
		const writer = new AsyncWriter({
			abort,
			socket,
			request,
			contentLength,
			client,
			expectsPayload,
			header
		});
		try {
			for await (const chunk of body) {
				if (socket[kError]) throw socket[kError];
				if (!writer.write(chunk)) await waitForDrain();
			}
			writer.end();
		} catch (err) {
			writer.destroy(err);
		} finally {
			socket.off("close", onDrain).off("drain", onDrain);
		}
	}
	var AsyncWriter = class {
		constructor({ abort, socket, request, contentLength, client, expectsPayload, header }) {
			this.socket = socket;
			this.request = request;
			this.contentLength = contentLength;
			this.client = client;
			this.bytesWritten = 0;
			this.expectsPayload = expectsPayload;
			this.header = header;
			this.abort = abort;
			socket[kWriting] = true;
		}
		write(chunk) {
			const { socket, request, contentLength, client, bytesWritten, expectsPayload, header } = this;
			if (socket[kError]) throw socket[kError];
			if (socket.destroyed) return false;
			const len = Buffer.byteLength(chunk);
			if (!len) return true;
			if (contentLength !== null && bytesWritten + len > contentLength) {
				if (client[kStrictContentLength]) throw new RequestContentLengthMismatchError();
				process.emitWarning(new RequestContentLengthMismatchError());
			}
			socket.cork();
			if (bytesWritten === 0) {
				if (!expectsPayload && request.reset !== false) socket[kReset] = true;
				if (contentLength === null) socket.write(`${header}transfer-encoding: chunked\r\n`, "latin1");
				else socket.write(`${header}content-length: ${contentLength}\r\n\r\n`, "latin1");
			}
			if (contentLength === null) socket.write(`\r\n${len.toString(16)}\r\n`, "latin1");
			this.bytesWritten += len;
			const ret = socket.write(chunk);
			socket.uncork();
			request.onBodySent(chunk);
			if (!ret) {
				if (socket[kParser].timeout && socket[kParser].timeoutType === TIMEOUT_HEADERS) {
					// istanbul ignore else: only for jest
					if (socket[kParser].timeout.refresh) socket[kParser].timeout.refresh();
				}
			}
			return ret;
		}
		end() {
			const { socket, contentLength, client, bytesWritten, expectsPayload, header, request } = this;
			request.onRequestSent();
			socket[kWriting] = false;
			if (socket[kError]) throw socket[kError];
			if (socket.destroyed) return;
			if (bytesWritten === 0) if (expectsPayload) socket.write(`${header}content-length: 0\r\n\r\n`, "latin1");
			else socket.write(`${header}\r\n`, "latin1");
			else if (contentLength === null) socket.write("\r\n0\r\n\r\n", "latin1");
			if (contentLength !== null && bytesWritten !== contentLength) if (client[kStrictContentLength]) throw new RequestContentLengthMismatchError();
			else process.emitWarning(new RequestContentLengthMismatchError());
			if (socket[kParser].timeout && socket[kParser].timeoutType === TIMEOUT_HEADERS) {
				// istanbul ignore else: only for jest
				if (socket[kParser].timeout.refresh) socket[kParser].timeout.refresh();
			}
			client[kResume]();
		}
		destroy(err) {
			const { socket, client, abort } = this;
			socket[kWriting] = false;
			if (err) {
				assert$19(client[kRunning] <= 1, "pipeline should only contain this request");
				abort(err);
			}
		}
	};
	module.exports = connectH1;
}));
//#endregion
//#region node_modules/.pnpm/undici@6.28.0/node_modules/undici/lib/dispatcher/client-h2.js
var require_client_h2 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const assert$18 = __require("node:assert");
	const { pipeline: pipeline$2 } = __require("node:stream");
	const util = require_util$7();
	const { RequestContentLengthMismatchError, RequestAbortedError, SocketError, InformationalError } = require_errors();
	const { kUrl, kReset, kClient, kRunning, kPending, kQueue, kPendingIdx, kRunningIdx, kError, kSocket, kStrictContentLength, kOnError, kMaxConcurrentStreams, kHTTP2Session, kResume, kSize, kHTTPContext } = require_symbols$4();
	const kOpenStreams = Symbol("open streams");
	let extractBody;
	let h2ExperimentalWarned = false;
	/** @type {import('http2')} */
	let http2;
	try {
		http2 = __require("node:http2");
	} catch {
		http2 = { constants: {} };
	}
	const { constants: { HTTP2_HEADER_AUTHORITY, HTTP2_HEADER_METHOD, HTTP2_HEADER_PATH, HTTP2_HEADER_SCHEME, HTTP2_HEADER_CONTENT_LENGTH, HTTP2_HEADER_EXPECT, HTTP2_HEADER_STATUS } } = http2;
	function parseH2Headers(headers) {
		const result = [];
		for (const [name, value] of Object.entries(headers)) if (Array.isArray(value)) for (const subvalue of value) result.push(Buffer.from(name), Buffer.from(subvalue));
		else result.push(Buffer.from(name), Buffer.from(value));
		return result;
	}
	async function connectH2(client, socket) {
		client[kSocket] = socket;
		if (!h2ExperimentalWarned) {
			h2ExperimentalWarned = true;
			process.emitWarning("H2 support is experimental, expect them to change at any time.", { code: "UNDICI-H2" });
		}
		const session = http2.connect(client[kUrl], {
			createConnection: () => socket,
			peerMaxConcurrentStreams: client[kMaxConcurrentStreams]
		});
		session[kOpenStreams] = 0;
		session[kClient] = client;
		session[kSocket] = socket;
		util.addListener(session, "error", onHttp2SessionError);
		util.addListener(session, "frameError", onHttp2FrameError);
		util.addListener(session, "end", onHttp2SessionEnd);
		util.addListener(session, "goaway", onHTTP2GoAway);
		util.addListener(session, "close", function() {
			const { [kClient]: client } = this;
			const { [kSocket]: socket } = client;
			const err = this[kSocket][kError] || this[kError] || new SocketError("closed", util.getSocketInfo(socket));
			client[kHTTP2Session] = null;
			if (client.destroyed) {
				assert$18(client[kPending] === 0);
				const requests = client[kQueue].splice(client[kRunningIdx]);
				for (let i = 0; i < requests.length; i++) {
					const request = requests[i];
					util.errorRequest(client, request, err);
				}
			}
		});
		session.unref();
		client[kHTTP2Session] = session;
		socket[kHTTP2Session] = session;
		util.addListener(socket, "error", function(err) {
			assert$18(err.code !== "ERR_TLS_CERT_ALTNAME_INVALID");
			this[kError] = err;
			this[kClient][kOnError](err);
		});
		util.addListener(socket, "end", function() {
			util.destroy(this, new SocketError("other side closed", util.getSocketInfo(this)));
		});
		util.addListener(socket, "close", function() {
			const err = this[kError] || new SocketError("closed", util.getSocketInfo(this));
			client[kSocket] = null;
			if (this[kHTTP2Session] != null) this[kHTTP2Session].destroy(err);
			client[kPendingIdx] = client[kRunningIdx];
			assert$18(client[kRunning] === 0);
			client.emit("disconnect", client[kUrl], [client], err);
			client[kResume]();
		});
		let closed = false;
		socket.on("close", () => {
			closed = true;
		});
		return {
			version: "h2",
			defaultPipelining: Infinity,
			write(...args) {
				return writeH2(client, ...args);
			},
			resume() {
				resumeH2(client);
			},
			destroy(err, callback) {
				if (closed) queueMicrotask(callback);
				else socket.destroy(err).on("close", callback);
			},
			get destroyed() {
				return socket.destroyed;
			},
			busy() {
				return false;
			}
		};
	}
	function resumeH2(client) {
		const socket = client[kSocket];
		if (socket?.destroyed === false) if (client[kSize] === 0 && client[kMaxConcurrentStreams] === 0) {
			socket.unref();
			client[kHTTP2Session].unref();
		} else {
			socket.ref();
			client[kHTTP2Session].ref();
		}
	}
	function onHttp2SessionError(err) {
		assert$18(err.code !== "ERR_TLS_CERT_ALTNAME_INVALID");
		this[kSocket][kError] = err;
		this[kClient][kOnError](err);
	}
	function onHttp2FrameError(type, code, id) {
		if (id === 0) {
			const err = new InformationalError(`HTTP/2: "frameError" received - type ${type}, code ${code}`);
			this[kSocket][kError] = err;
			this[kClient][kOnError](err);
		}
	}
	function onHttp2SessionEnd() {
		const err = new SocketError("other side closed", util.getSocketInfo(this[kSocket]));
		this.destroy(err);
		util.destroy(this[kSocket], err);
	}
	/**
	* This is the root cause of #3011
	* We need to handle GOAWAY frames properly, and trigger the session close
	* along with the socket right away
	*/
	function onHTTP2GoAway(code) {
		const err = this[kError] || new SocketError(`HTTP/2: "GOAWAY" frame received with code ${code}`, util.getSocketInfo(this));
		const client = this[kClient];
		client[kSocket] = null;
		client[kHTTPContext] = null;
		if (this[kHTTP2Session] != null) {
			this[kHTTP2Session].destroy(err);
			this[kHTTP2Session] = null;
		}
		util.destroy(this[kSocket], err);
		if (client[kRunningIdx] < client[kQueue].length) {
			const request = client[kQueue][client[kRunningIdx]];
			client[kQueue][client[kRunningIdx]++] = null;
			util.errorRequest(client, request, err);
			client[kPendingIdx] = client[kRunningIdx];
		}
		assert$18(client[kRunning] === 0);
		client.emit("disconnect", client[kUrl], [client], err);
		client[kResume]();
	}
	function shouldSendContentLength(method) {
		return method !== "GET" && method !== "HEAD" && method !== "OPTIONS" && method !== "TRACE" && method !== "CONNECT";
	}
	function writeH2(client, request) {
		const session = client[kHTTP2Session];
		const { method, path, host, upgrade, expectContinue, signal, headers: reqHeaders } = request;
		let { body } = request;
		if (upgrade) {
			util.errorRequest(client, request, /* @__PURE__ */ new Error("Upgrade not supported for H2"));
			return false;
		}
		const headers = {};
		for (let n = 0; n < reqHeaders.length; n += 2) {
			const key = reqHeaders[n + 0];
			const val = reqHeaders[n + 1];
			if (Array.isArray(val)) for (let i = 0; i < val.length; i++) if (headers[key]) headers[key] += `,${val[i]}`;
			else headers[key] = val[i];
			else headers[key] = val;
		}
		/** @type {import('node:http2').ClientHttp2Stream} */
		let stream;
		const { hostname, port } = client[kUrl];
		headers[HTTP2_HEADER_AUTHORITY] = host || `${hostname}${port ? `:${port}` : ""}`;
		headers[HTTP2_HEADER_METHOD] = method;
		const abort = (err) => {
			if (request.aborted || request.completed) return;
			err = err || new RequestAbortedError();
			util.errorRequest(client, request, err);
			if (stream != null) util.destroy(stream, err);
			util.destroy(body, err);
			client[kQueue][client[kRunningIdx]++] = null;
			client[kResume]();
		};
		try {
			request.onConnect(abort);
		} catch (err) {
			util.errorRequest(client, request, err);
		}
		if (request.aborted) return false;
		if (method === "CONNECT") {
			session.ref();
			stream = session.request(headers, {
				endStream: false,
				signal
			});
			if (stream.id && !stream.pending) {
				request.onUpgrade(null, null, stream);
				++session[kOpenStreams];
				client[kQueue][client[kRunningIdx]++] = null;
			} else stream.once("ready", () => {
				request.onUpgrade(null, null, stream);
				++session[kOpenStreams];
				client[kQueue][client[kRunningIdx]++] = null;
			});
			stream.once("close", () => {
				session[kOpenStreams] -= 1;
				if (session[kOpenStreams] === 0) session.unref();
			});
			return true;
		}
		headers[HTTP2_HEADER_PATH] = path;
		headers[HTTP2_HEADER_SCHEME] = "https";
		const expectsPayload = method === "PUT" || method === "POST" || method === "PATCH";
		if (body && typeof body.read === "function") body.read(0);
		let contentLength = util.bodyLength(body);
		if (util.isFormDataLike(body)) {
			extractBody ??= require_body().extractBody;
			const [bodyStream, contentType] = extractBody(body);
			headers["content-type"] = contentType;
			body = bodyStream.stream;
			contentLength = bodyStream.length;
		}
		if (contentLength == null) contentLength = request.contentLength;
		if (contentLength === 0 || !expectsPayload) contentLength = null;
		if (shouldSendContentLength(method) && contentLength > 0 && request.contentLength != null && request.contentLength !== contentLength) {
			if (client[kStrictContentLength]) {
				util.errorRequest(client, request, new RequestContentLengthMismatchError());
				return false;
			}
			process.emitWarning(new RequestContentLengthMismatchError());
		}
		if (contentLength != null) {
			assert$18(body, "no body must not have content length");
			headers[HTTP2_HEADER_CONTENT_LENGTH] = `${contentLength}`;
		}
		session.ref();
		const shouldEndStream = method === "GET" || method === "HEAD" || body === null;
		if (expectContinue) {
			headers[HTTP2_HEADER_EXPECT] = "100-continue";
			stream = session.request(headers, {
				endStream: shouldEndStream,
				signal
			});
			stream.once("continue", writeBodyH2);
		} else {
			stream = session.request(headers, {
				endStream: shouldEndStream,
				signal
			});
			writeBodyH2();
		}
		++session[kOpenStreams];
		stream.once("response", (headers) => {
			const { [HTTP2_HEADER_STATUS]: statusCode, ...realHeaders } = headers;
			request.onResponseStarted();
			if (request.aborted) {
				const err = new RequestAbortedError();
				util.errorRequest(client, request, err);
				util.destroy(stream, err);
				return;
			}
			if (request.onHeaders(Number(statusCode), parseH2Headers(realHeaders), stream.resume.bind(stream), "") === false) stream.pause();
			stream.on("data", (chunk) => {
				if (request.onData(chunk) === false) stream.pause();
			});
		});
		stream.once("end", () => {
			if (stream.state?.state == null || stream.state.state < 6) request.onComplete([]);
			if (session[kOpenStreams] === 0) session.unref();
			abort(new InformationalError("HTTP/2: stream half-closed (remote)"));
			client[kQueue][client[kRunningIdx]++] = null;
			client[kPendingIdx] = client[kRunningIdx];
			client[kResume]();
		});
		stream.once("close", () => {
			session[kOpenStreams] -= 1;
			if (session[kOpenStreams] === 0) session.unref();
		});
		stream.once("error", function(err) {
			abort(err);
		});
		stream.once("frameError", (type, code) => {
			abort(new InformationalError(`HTTP/2: "frameError" received - type ${type}, code ${code}`));
		});
		return true;
		function writeBodyH2() {
			/* istanbul ignore else: assertion */
			if (!body || contentLength === 0) writeBuffer(abort, stream, null, client, request, client[kSocket], contentLength, expectsPayload);
			else if (util.isBuffer(body)) writeBuffer(abort, stream, body, client, request, client[kSocket], contentLength, expectsPayload);
			else if (util.isBlobLike(body)) if (typeof body.stream === "function") writeIterable(abort, stream, body.stream(), client, request, client[kSocket], contentLength, expectsPayload);
			else writeBlob(abort, stream, body, client, request, client[kSocket], contentLength, expectsPayload);
			else if (util.isStream(body)) writeStream(abort, client[kSocket], expectsPayload, stream, body, client, request, contentLength);
			else if (util.isIterable(body)) writeIterable(abort, stream, body, client, request, client[kSocket], contentLength, expectsPayload);
			else assert$18(false);
		}
	}
	function writeBuffer(abort, h2stream, body, client, request, socket, contentLength, expectsPayload) {
		try {
			if (body != null && util.isBuffer(body)) {
				assert$18(contentLength === body.byteLength, "buffer body must have content length");
				h2stream.cork();
				h2stream.write(body);
				h2stream.uncork();
				h2stream.end();
				request.onBodySent(body);
			}
			if (!expectsPayload) socket[kReset] = true;
			request.onRequestSent();
			client[kResume]();
		} catch (error) {
			abort(error);
		}
	}
	function writeStream(abort, socket, expectsPayload, h2stream, body, client, request, contentLength) {
		assert$18(contentLength !== 0 || client[kRunning] === 0, "stream body cannot be pipelined");
		const pipe = pipeline$2(body, h2stream, (err) => {
			if (err) {
				util.destroy(pipe, err);
				abort(err);
			} else {
				util.removeAllListeners(pipe);
				request.onRequestSent();
				if (!expectsPayload) socket[kReset] = true;
				client[kResume]();
			}
		});
		util.addListener(pipe, "data", onPipeData);
		function onPipeData(chunk) {
			request.onBodySent(chunk);
		}
	}
	async function writeBlob(abort, h2stream, body, client, request, socket, contentLength, expectsPayload) {
		assert$18(contentLength === body.size, "blob body must have content length");
		try {
			if (contentLength != null && contentLength !== body.size) throw new RequestContentLengthMismatchError();
			const buffer = Buffer.from(await body.arrayBuffer());
			h2stream.cork();
			h2stream.write(buffer);
			h2stream.uncork();
			h2stream.end();
			request.onBodySent(buffer);
			request.onRequestSent();
			if (!expectsPayload) socket[kReset] = true;
			client[kResume]();
		} catch (err) {
			abort(err);
		}
	}
	async function writeIterable(abort, h2stream, body, client, request, socket, contentLength, expectsPayload) {
		assert$18(contentLength !== 0 || client[kRunning] === 0, "iterator body cannot be pipelined");
		let callback = null;
		function onDrain() {
			if (callback) {
				const cb = callback;
				callback = null;
				cb();
			}
		}
		const waitForDrain = () => new Promise((resolve, reject) => {
			assert$18(callback === null);
			if (socket[kError]) reject(socket[kError]);
			else callback = resolve;
		});
		h2stream.on("close", onDrain).on("drain", onDrain);
		try {
			for await (const chunk of body) {
				if (socket[kError]) throw socket[kError];
				const res = h2stream.write(chunk);
				request.onBodySent(chunk);
				if (!res) await waitForDrain();
			}
			h2stream.end();
			request.onRequestSent();
			if (!expectsPayload) socket[kReset] = true;
			client[kResume]();
		} catch (err) {
			abort(err);
		} finally {
			h2stream.off("close", onDrain).off("drain", onDrain);
		}
	}
	module.exports = connectH2;
}));
//#endregion
//#region node_modules/.pnpm/undici@6.28.0/node_modules/undici/lib/handler/redirect-handler.js
var require_redirect_handler = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const util = require_util$7();
	const { kBodyUsed } = require_symbols$4();
	const assert$17 = __require("node:assert");
	const { InvalidArgumentError } = require_errors();
	const EE$1 = __require("node:events");
	const redirectableStatusCodes = [
		300,
		301,
		302,
		303,
		307,
		308
	];
	const kBody = Symbol("body");
	var BodyAsyncIterable = class {
		constructor(body) {
			this[kBody] = body;
			this[kBodyUsed] = false;
		}
		async *[Symbol.asyncIterator]() {
			assert$17(!this[kBodyUsed], "disturbed");
			this[kBodyUsed] = true;
			yield* this[kBody];
		}
	};
	var RedirectHandler = class {
		constructor(dispatch, maxRedirections, opts, handler) {
			if (maxRedirections != null && (!Number.isInteger(maxRedirections) || maxRedirections < 0)) throw new InvalidArgumentError("maxRedirections must be a positive number");
			util.validateHandler(handler, opts.method, opts.upgrade);
			this.dispatch = dispatch;
			this.location = null;
			this.abort = null;
			this.opts = {
				...opts,
				maxRedirections: 0
			};
			this.maxRedirections = maxRedirections;
			this.handler = handler;
			this.history = [];
			this.redirectionLimitReached = false;
			if (util.isStream(this.opts.body)) {
				if (util.bodyLength(this.opts.body) === 0) this.opts.body.on("data", function() {
					assert$17(false);
				});
				if (typeof this.opts.body.readableDidRead !== "boolean") {
					this.opts.body[kBodyUsed] = false;
					EE$1.prototype.on.call(this.opts.body, "data", function() {
						this[kBodyUsed] = true;
					});
				}
			} else if (this.opts.body && typeof this.opts.body.pipeTo === "function") this.opts.body = new BodyAsyncIterable(this.opts.body);
			else if (this.opts.body && typeof this.opts.body !== "string" && !ArrayBuffer.isView(this.opts.body) && util.isIterable(this.opts.body)) this.opts.body = new BodyAsyncIterable(this.opts.body);
		}
		onConnect(abort) {
			this.abort = abort;
			this.handler.onConnect(abort, { history: this.history });
		}
		onUpgrade(statusCode, headers, socket) {
			this.handler.onUpgrade(statusCode, headers, socket);
		}
		onError(error) {
			this.handler.onError(error);
		}
		onHeaders(statusCode, headers, resume, statusText) {
			this.location = this.history.length >= this.maxRedirections || util.isDisturbed(this.opts.body) ? null : parseLocation(statusCode, headers);
			if (this.opts.throwOnMaxRedirect && this.history.length >= this.maxRedirections) {
				if (this.request) this.request.abort(/* @__PURE__ */ new Error("max redirects"));
				this.redirectionLimitReached = true;
				this.abort(/* @__PURE__ */ new Error("max redirects"));
				return;
			}
			if (this.opts.origin) this.history.push(new URL(this.opts.path, this.opts.origin));
			if (!this.location) return this.handler.onHeaders(statusCode, headers, resume, statusText);
			const { origin, pathname, search } = util.parseURL(new URL(this.location, this.opts.origin && new URL(this.opts.path, this.opts.origin)));
			const path = search ? `${pathname}${search}` : pathname;
			this.opts.headers = cleanRequestHeaders(this.opts.headers, statusCode === 303, this.opts.origin !== origin);
			this.opts.path = path;
			this.opts.origin = origin;
			this.opts.maxRedirections = 0;
			this.opts.query = null;
			if (statusCode === 303 && this.opts.method !== "HEAD") {
				this.opts.method = "GET";
				this.opts.body = null;
			}
		}
		onData(chunk) {
			if (this.location) {} else return this.handler.onData(chunk);
		}
		onComplete(trailers) {
			if (this.location) {
				this.location = null;
				this.abort = null;
				this.dispatch(this.opts, this);
			} else this.handler.onComplete(trailers);
		}
		onBodySent(chunk) {
			if (this.handler.onBodySent) this.handler.onBodySent(chunk);
		}
	};
	function parseLocation(statusCode, headers) {
		if (redirectableStatusCodes.indexOf(statusCode) === -1) return null;
		for (let i = 0; i < headers.length; i += 2) if (headers[i].length === 8 && util.headerNameToString(headers[i]) === "location") return headers[i + 1];
	}
	function shouldRemoveHeader(header, removeContent, unknownOrigin) {
		if (header.length === 4) return util.headerNameToString(header) === "host";
		if (removeContent && util.headerNameToString(header).startsWith("content-")) return true;
		if (unknownOrigin && (header.length === 13 || header.length === 6 || header.length === 19)) {
			const name = util.headerNameToString(header);
			return name === "authorization" || name === "cookie" || name === "proxy-authorization";
		}
		return false;
	}
	function cleanRequestHeaders(headers, removeContent, unknownOrigin) {
		const ret = [];
		if (Array.isArray(headers)) {
			for (let i = 0; i < headers.length; i += 2) if (!shouldRemoveHeader(headers[i], removeContent, unknownOrigin)) ret.push(headers[i], headers[i + 1]);
		} else if (headers && typeof headers === "object") {
			for (const key of Object.keys(headers)) if (!shouldRemoveHeader(key, removeContent, unknownOrigin)) ret.push(key, headers[key]);
		} else assert$17(headers == null, "headers must be an object or an array");
		return ret;
	}
	module.exports = RedirectHandler;
}));
//#endregion
//#region node_modules/.pnpm/undici@6.28.0/node_modules/undici/lib/interceptor/redirect-interceptor.js
var require_redirect_interceptor = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const RedirectHandler = require_redirect_handler();
	function createRedirectInterceptor({ maxRedirections: defaultMaxRedirections }) {
		return (dispatch) => {
			return function Intercept(opts, handler) {
				const { maxRedirections = defaultMaxRedirections } = opts;
				if (!maxRedirections) return dispatch(opts, handler);
				const redirectHandler = new RedirectHandler(dispatch, maxRedirections, opts, handler);
				opts = {
					...opts,
					maxRedirections: 0
				};
				return dispatch(opts, redirectHandler);
			};
		};
	}
	module.exports = createRedirectInterceptor;
}));
//#endregion
//#region node_modules/.pnpm/undici@6.28.0/node_modules/undici/lib/dispatcher/client.js
var require_client = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const assert$16 = __require("node:assert");
	const net = __require("node:net");
	const http = __require("node:http");
	const util = require_util$7();
	const { channels } = require_diagnostics();
	const Request = require_request$1();
	const DispatcherBase = require_dispatcher_base();
	const { InvalidArgumentError, InformationalError, ClientDestroyedError } = require_errors();
	const buildConnector = require_connect();
	const { kUrl, kServerName, kClient, kBusy, kConnect, kResuming, kRunning, kPending, kSize, kQueue, kConnected, kConnecting, kNeedDrain, kKeepAliveDefaultTimeout, kHostHeader, kPendingIdx, kRunningIdx, kError, kPipelining, kKeepAliveTimeoutValue, kMaxHeadersSize, kKeepAliveMaxTimeout, kKeepAliveTimeoutThreshold, kHeadersTimeout, kBodyTimeout, kStrictContentLength, kConnector, kMaxRedirections, kMaxRequests, kCounter, kClose, kDestroy, kDispatch, kInterceptors, kLocalAddress, kMaxResponseSize, kOnError, kHTTPContext, kMaxConcurrentStreams, kResume } = require_symbols$4();
	const connectH1 = require_client_h1();
	const connectH2 = require_client_h2();
	let deprecatedInterceptorWarned = false;
	const kClosedResolve = Symbol("kClosedResolve");
	const noop = () => {};
	function getPipelining(client) {
		return client[kPipelining] ?? client[kHTTPContext]?.defaultPipelining ?? 1;
	}
	/**
	* @type {import('../../types/client.js').default}
	*/
	var Client = class extends DispatcherBase {
		/**
		*
		* @param {string|URL} url
		* @param {import('../../types/client.js').Client.Options} options
		*/
		constructor(url, { interceptors, maxHeaderSize, headersTimeout, socketTimeout, requestTimeout, connectTimeout, bodyTimeout, idleTimeout, keepAlive, keepAliveTimeout, maxKeepAliveTimeout, keepAliveMaxTimeout, keepAliveTimeoutThreshold, socketPath, pipelining, tls, strictContentLength, maxCachedSessions, maxRedirections, connect, maxRequestsPerClient, localAddress, maxResponseSize, autoSelectFamily, autoSelectFamilyAttemptTimeout, maxConcurrentStreams, allowH2, webSocket } = {}) {
			super({ webSocket });
			if (keepAlive !== void 0) throw new InvalidArgumentError("unsupported keepAlive, use pipelining=0 instead");
			if (socketTimeout !== void 0) throw new InvalidArgumentError("unsupported socketTimeout, use headersTimeout & bodyTimeout instead");
			if (requestTimeout !== void 0) throw new InvalidArgumentError("unsupported requestTimeout, use headersTimeout & bodyTimeout instead");
			if (idleTimeout !== void 0) throw new InvalidArgumentError("unsupported idleTimeout, use keepAliveTimeout instead");
			if (maxKeepAliveTimeout !== void 0) throw new InvalidArgumentError("unsupported maxKeepAliveTimeout, use keepAliveMaxTimeout instead");
			if (maxHeaderSize != null && !Number.isFinite(maxHeaderSize)) throw new InvalidArgumentError("invalid maxHeaderSize");
			if (socketPath != null && typeof socketPath !== "string") throw new InvalidArgumentError("invalid socketPath");
			if (connectTimeout != null && (!Number.isFinite(connectTimeout) || connectTimeout < 0)) throw new InvalidArgumentError("invalid connectTimeout");
			if (keepAliveTimeout != null && (!Number.isFinite(keepAliveTimeout) || keepAliveTimeout <= 0)) throw new InvalidArgumentError("invalid keepAliveTimeout");
			if (keepAliveMaxTimeout != null && (!Number.isFinite(keepAliveMaxTimeout) || keepAliveMaxTimeout <= 0)) throw new InvalidArgumentError("invalid keepAliveMaxTimeout");
			if (keepAliveTimeoutThreshold != null && !Number.isFinite(keepAliveTimeoutThreshold)) throw new InvalidArgumentError("invalid keepAliveTimeoutThreshold");
			if (headersTimeout != null && (!Number.isInteger(headersTimeout) || headersTimeout < 0)) throw new InvalidArgumentError("headersTimeout must be a positive integer or zero");
			if (bodyTimeout != null && (!Number.isInteger(bodyTimeout) || bodyTimeout < 0)) throw new InvalidArgumentError("bodyTimeout must be a positive integer or zero");
			if (connect != null && typeof connect !== "function" && typeof connect !== "object") throw new InvalidArgumentError("connect must be a function or an object");
			if (maxRedirections != null && (!Number.isInteger(maxRedirections) || maxRedirections < 0)) throw new InvalidArgumentError("maxRedirections must be a positive number");
			if (maxRequestsPerClient != null && (!Number.isInteger(maxRequestsPerClient) || maxRequestsPerClient < 0)) throw new InvalidArgumentError("maxRequestsPerClient must be a positive number");
			if (localAddress != null && (typeof localAddress !== "string" || net.isIP(localAddress) === 0)) throw new InvalidArgumentError("localAddress must be valid string IP address");
			if (maxResponseSize != null && (!Number.isInteger(maxResponseSize) || maxResponseSize < -1)) throw new InvalidArgumentError("maxResponseSize must be a positive number");
			if (autoSelectFamilyAttemptTimeout != null && (!Number.isInteger(autoSelectFamilyAttemptTimeout) || autoSelectFamilyAttemptTimeout < -1)) throw new InvalidArgumentError("autoSelectFamilyAttemptTimeout must be a positive number");
			if (allowH2 != null && typeof allowH2 !== "boolean") throw new InvalidArgumentError("allowH2 must be a valid boolean value");
			if (maxConcurrentStreams != null && (typeof maxConcurrentStreams !== "number" || maxConcurrentStreams < 1)) throw new InvalidArgumentError("maxConcurrentStreams must be a positive integer, greater than 0");
			if (typeof connect !== "function") connect = buildConnector({
				...tls,
				maxCachedSessions,
				allowH2,
				socketPath,
				timeout: connectTimeout,
				...autoSelectFamily ? {
					autoSelectFamily,
					autoSelectFamilyAttemptTimeout
				} : void 0,
				...connect
			});
			if (interceptors?.Client && Array.isArray(interceptors.Client)) {
				this[kInterceptors] = interceptors.Client;
				if (!deprecatedInterceptorWarned) {
					deprecatedInterceptorWarned = true;
					process.emitWarning("Client.Options#interceptor is deprecated. Use Dispatcher#compose instead.", { code: "UNDICI-CLIENT-INTERCEPTOR-DEPRECATED" });
				}
			} else this[kInterceptors] = [createRedirectInterceptor({ maxRedirections })];
			this[kUrl] = util.parseOrigin(url);
			this[kConnector] = connect;
			this[kPipelining] = pipelining != null ? pipelining : 1;
			this[kMaxHeadersSize] = maxHeaderSize || http.maxHeaderSize;
			this[kKeepAliveDefaultTimeout] = keepAliveTimeout == null ? 4e3 : keepAliveTimeout;
			this[kKeepAliveMaxTimeout] = keepAliveMaxTimeout == null ? 6e5 : keepAliveMaxTimeout;
			this[kKeepAliveTimeoutThreshold] = keepAliveTimeoutThreshold == null ? 2e3 : keepAliveTimeoutThreshold;
			this[kKeepAliveTimeoutValue] = this[kKeepAliveDefaultTimeout];
			this[kServerName] = null;
			this[kLocalAddress] = localAddress != null ? localAddress : null;
			this[kResuming] = 0;
			this[kNeedDrain] = 0;
			this[kHostHeader] = `host: ${this[kUrl].hostname}${this[kUrl].port ? `:${this[kUrl].port}` : ""}\r\n`;
			this[kBodyTimeout] = bodyTimeout != null ? bodyTimeout : 3e5;
			this[kHeadersTimeout] = headersTimeout != null ? headersTimeout : 3e5;
			this[kStrictContentLength] = strictContentLength == null ? true : strictContentLength;
			this[kMaxRedirections] = maxRedirections;
			this[kMaxRequests] = maxRequestsPerClient;
			this[kClosedResolve] = null;
			this[kMaxResponseSize] = maxResponseSize > -1 ? maxResponseSize : -1;
			this[kMaxConcurrentStreams] = maxConcurrentStreams != null ? maxConcurrentStreams : 100;
			this[kHTTPContext] = null;
			this[kQueue] = [];
			this[kRunningIdx] = 0;
			this[kPendingIdx] = 0;
			this[kResume] = (sync) => resume(this, sync);
			this[kOnError] = (err) => onError(this, err);
		}
		get pipelining() {
			return this[kPipelining];
		}
		set pipelining(value) {
			this[kPipelining] = value;
			this[kResume](true);
		}
		get [kPending]() {
			return this[kQueue].length - this[kPendingIdx];
		}
		get [kRunning]() {
			return this[kPendingIdx] - this[kRunningIdx];
		}
		get [kSize]() {
			return this[kQueue].length - this[kRunningIdx];
		}
		get [kConnected]() {
			return !!this[kHTTPContext] && !this[kConnecting] && !this[kHTTPContext].destroyed;
		}
		get [kBusy]() {
			return Boolean(this[kHTTPContext]?.busy(null) || this[kSize] >= (getPipelining(this) || 1) || this[kPending] > 0);
		}
		/* istanbul ignore: only used for test */
		[kConnect](cb) {
			connect(this);
			this.once("connect", cb);
		}
		[kDispatch](opts, handler) {
			const origin = opts.origin || this[kUrl].origin;
			const request = new Request(origin, opts, handler);
			this[kQueue].push(request);
			if (this[kResuming]) {} else if (util.bodyLength(request.body) == null && util.isIterable(request.body)) {
				this[kResuming] = 1;
				queueMicrotask(() => resume(this));
			} else this[kResume](true);
			if (this[kResuming] && this[kNeedDrain] !== 2 && this[kBusy]) this[kNeedDrain] = 2;
			return this[kNeedDrain] < 2;
		}
		async [kClose]() {
			return new Promise((resolve) => {
				if (this[kSize]) this[kClosedResolve] = resolve;
				else resolve(null);
			});
		}
		async [kDestroy](err) {
			return new Promise((resolve) => {
				const requests = this[kQueue].splice(this[kPendingIdx]);
				for (let i = 0; i < requests.length; i++) {
					const request = requests[i];
					util.errorRequest(this, request, err);
				}
				const callback = () => {
					if (this[kClosedResolve]) {
						this[kClosedResolve]();
						this[kClosedResolve] = null;
					}
					resolve(null);
				};
				if (this[kHTTPContext]) {
					this[kHTTPContext].destroy(err, callback);
					this[kHTTPContext] = null;
				} else queueMicrotask(callback);
				this[kResume]();
			});
		}
	};
	const createRedirectInterceptor = require_redirect_interceptor();
	function onError(client, err) {
		if (client[kRunning] === 0 && err.code !== "UND_ERR_INFO" && err.code !== "UND_ERR_SOCKET") {
			assert$16(client[kPendingIdx] === client[kRunningIdx]);
			const requests = client[kQueue].splice(client[kRunningIdx]);
			for (let i = 0; i < requests.length; i++) {
				const request = requests[i];
				util.errorRequest(client, request, err);
			}
			assert$16(client[kSize] === 0);
		}
	}
	/**
	* @param {Client} client
	* @returns
	*/
	async function connect(client) {
		assert$16(!client[kConnecting]);
		assert$16(!client[kHTTPContext]);
		let { host, hostname, protocol, port } = client[kUrl];
		if (hostname[0] === "[") {
			const idx = hostname.indexOf("]");
			assert$16(idx !== -1);
			const ip = hostname.substring(1, idx);
			assert$16(net.isIP(ip));
			hostname = ip;
		}
		client[kConnecting] = true;
		if (channels.beforeConnect.hasSubscribers) channels.beforeConnect.publish({
			connectParams: {
				host,
				hostname,
				protocol,
				port,
				version: client[kHTTPContext]?.version,
				servername: client[kServerName],
				localAddress: client[kLocalAddress]
			},
			connector: client[kConnector]
		});
		try {
			const socket = await new Promise((resolve, reject) => {
				client[kConnector]({
					host,
					hostname,
					protocol,
					port,
					servername: client[kServerName],
					localAddress: client[kLocalAddress]
				}, (err, socket) => {
					if (err) reject(err);
					else resolve(socket);
				});
			});
			if (client.destroyed) {
				util.destroy(socket.on("error", noop), new ClientDestroyedError());
				return;
			}
			assert$16(socket);
			try {
				client[kHTTPContext] = socket.alpnProtocol === "h2" ? await connectH2(client, socket) : await connectH1(client, socket);
			} catch (err) {
				socket.destroy().on("error", noop);
				throw err;
			}
			client[kConnecting] = false;
			socket[kCounter] = 0;
			socket[kMaxRequests] = client[kMaxRequests];
			socket[kClient] = client;
			socket[kError] = null;
			if (channels.connected.hasSubscribers) channels.connected.publish({
				connectParams: {
					host,
					hostname,
					protocol,
					port,
					version: client[kHTTPContext]?.version,
					servername: client[kServerName],
					localAddress: client[kLocalAddress]
				},
				connector: client[kConnector],
				socket
			});
			client.emit("connect", client[kUrl], [client]);
		} catch (err) {
			if (client.destroyed) return;
			client[kConnecting] = false;
			if (channels.connectError.hasSubscribers) channels.connectError.publish({
				connectParams: {
					host,
					hostname,
					protocol,
					port,
					version: client[kHTTPContext]?.version,
					servername: client[kServerName],
					localAddress: client[kLocalAddress]
				},
				connector: client[kConnector],
				error: err
			});
			if (err.code === "ERR_TLS_CERT_ALTNAME_INVALID") {
				assert$16(client[kRunning] === 0);
				while (client[kPending] > 0 && client[kQueue][client[kPendingIdx]].servername === client[kServerName]) {
					const request = client[kQueue][client[kPendingIdx]++];
					util.errorRequest(client, request, err);
				}
			} else onError(client, err);
			client.emit("connectionError", client[kUrl], [client], err);
		}
		client[kResume]();
	}
	function emitDrain(client) {
		client[kNeedDrain] = 0;
		client.emit("drain", client[kUrl], [client]);
	}
	function resume(client, sync) {
		if (client[kResuming] === 2) return;
		client[kResuming] = 2;
		_resume(client, sync);
		client[kResuming] = 0;
		if (client[kRunningIdx] > 256) {
			client[kQueue].splice(0, client[kRunningIdx]);
			client[kPendingIdx] -= client[kRunningIdx];
			client[kRunningIdx] = 0;
		}
	}
	function _resume(client, sync) {
		while (true) {
			if (client.destroyed) {
				assert$16(client[kPending] === 0);
				return;
			}
			if (client[kClosedResolve] && !client[kSize]) {
				client[kClosedResolve]();
				client[kClosedResolve] = null;
				return;
			}
			if (client[kHTTPContext]) client[kHTTPContext].resume();
			if (client[kBusy]) client[kNeedDrain] = 2;
			else if (client[kNeedDrain] === 2) {
				if (sync) {
					client[kNeedDrain] = 1;
					queueMicrotask(() => emitDrain(client));
				} else emitDrain(client);
				continue;
			}
			if (client[kPending] === 0) return;
			if (client[kRunning] >= (getPipelining(client) || 1)) return;
			const request = client[kQueue][client[kPendingIdx]];
			if (client[kUrl].protocol === "https:" && client[kServerName] !== request.servername) {
				if (client[kRunning] > 0) return;
				client[kServerName] = request.servername;
				client[kHTTPContext]?.destroy(new InformationalError("servername changed"), () => {
					client[kHTTPContext] = null;
					resume(client);
				});
			}
			if (client[kConnecting]) return;
			if (!client[kHTTPContext]) {
				connect(client);
				return;
			}
			if (client[kHTTPContext].destroyed) return;
			if (client[kHTTPContext].busy(request)) return;
			if (!request.aborted && client[kHTTPContext].write(request)) client[kPendingIdx]++;
			else client[kQueue].splice(client[kPendingIdx], 1);
		}
	}
	module.exports = Client;
}));
//#endregion
//#region node_modules/.pnpm/undici@6.28.0/node_modules/undici/lib/dispatcher/fixed-queue.js
var require_fixed_queue = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const kSize = 2048;
	const kMask = 2047;
	var FixedCircularBuffer = class {
		constructor() {
			this.bottom = 0;
			this.top = 0;
			this.list = new Array(kSize);
			this.next = null;
		}
		isEmpty() {
			return this.top === this.bottom;
		}
		isFull() {
			return (this.top + 1 & kMask) === this.bottom;
		}
		push(data) {
			this.list[this.top] = data;
			this.top = this.top + 1 & kMask;
		}
		shift() {
			const nextItem = this.list[this.bottom];
			if (nextItem === void 0) return null;
			this.list[this.bottom] = void 0;
			this.bottom = this.bottom + 1 & kMask;
			return nextItem;
		}
	};
	module.exports = class FixedQueue {
		constructor() {
			this.head = this.tail = new FixedCircularBuffer();
		}
		isEmpty() {
			return this.head.isEmpty();
		}
		push(data) {
			if (this.head.isFull()) this.head = this.head.next = new FixedCircularBuffer();
			this.head.push(data);
		}
		shift() {
			const tail = this.tail;
			const next = tail.shift();
			if (tail.isEmpty() && tail.next !== null) this.tail = tail.next;
			return next;
		}
	};
}));
//#endregion
//#region node_modules/.pnpm/undici@6.28.0/node_modules/undici/lib/dispatcher/pool-stats.js
var require_pool_stats = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const { kFree, kConnected, kPending, kQueued, kRunning, kSize } = require_symbols$4();
	const kPool = Symbol("pool");
	var PoolStats = class {
		constructor(pool) {
			this[kPool] = pool;
		}
		get connected() {
			return this[kPool][kConnected];
		}
		get free() {
			return this[kPool][kFree];
		}
		get pending() {
			return this[kPool][kPending];
		}
		get queued() {
			return this[kPool][kQueued];
		}
		get running() {
			return this[kPool][kRunning];
		}
		get size() {
			return this[kPool][kSize];
		}
	};
	module.exports = PoolStats;
}));
//#endregion
//#region node_modules/.pnpm/undici@6.28.0/node_modules/undici/lib/dispatcher/pool-base.js
var require_pool_base = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const DispatcherBase = require_dispatcher_base();
	const FixedQueue = require_fixed_queue();
	const { kConnected, kSize, kRunning, kPending, kQueued, kBusy, kFree, kUrl, kClose, kDestroy, kDispatch } = require_symbols$4();
	const PoolStats = require_pool_stats();
	const kClients = Symbol("clients");
	const kNeedDrain = Symbol("needDrain");
	const kQueue = Symbol("queue");
	const kClosedResolve = Symbol("closed resolve");
	const kOnDrain = Symbol("onDrain");
	const kOnConnect = Symbol("onConnect");
	const kOnDisconnect = Symbol("onDisconnect");
	const kOnConnectionError = Symbol("onConnectionError");
	const kGetDispatcher = Symbol("get dispatcher");
	const kAddClient = Symbol("add client");
	const kRemoveClient = Symbol("remove client");
	const kStats = Symbol("stats");
	var PoolBase = class extends DispatcherBase {
		constructor(opts) {
			super(opts);
			this[kQueue] = new FixedQueue();
			this[kClients] = [];
			this[kQueued] = 0;
			const pool = this;
			this[kOnDrain] = function onDrain(origin, targets) {
				const queue = pool[kQueue];
				let needDrain = false;
				while (!needDrain) {
					const item = queue.shift();
					if (!item) break;
					pool[kQueued]--;
					needDrain = !this.dispatch(item.opts, item.handler);
				}
				this[kNeedDrain] = needDrain;
				if (!this[kNeedDrain] && pool[kNeedDrain]) {
					pool[kNeedDrain] = false;
					pool.emit("drain", origin, [pool, ...targets]);
				}
				if (pool[kClosedResolve] && queue.isEmpty()) Promise.all(pool[kClients].map((c) => c.close())).then(pool[kClosedResolve]);
			};
			this[kOnConnect] = (origin, targets) => {
				pool.emit("connect", origin, [pool, ...targets]);
			};
			this[kOnDisconnect] = (origin, targets, err) => {
				pool.emit("disconnect", origin, [pool, ...targets], err);
			};
			this[kOnConnectionError] = (origin, targets, err) => {
				pool.emit("connectionError", origin, [pool, ...targets], err);
			};
			this[kStats] = new PoolStats(this);
		}
		get [kBusy]() {
			return this[kNeedDrain];
		}
		get [kConnected]() {
			return this[kClients].filter((client) => client[kConnected]).length;
		}
		get [kFree]() {
			return this[kClients].filter((client) => client[kConnected] && !client[kNeedDrain]).length;
		}
		get [kPending]() {
			let ret = this[kQueued];
			for (const { [kPending]: pending } of this[kClients]) ret += pending;
			return ret;
		}
		get [kRunning]() {
			let ret = 0;
			for (const { [kRunning]: running } of this[kClients]) ret += running;
			return ret;
		}
		get [kSize]() {
			let ret = this[kQueued];
			for (const { [kSize]: size } of this[kClients]) ret += size;
			return ret;
		}
		get stats() {
			return this[kStats];
		}
		async [kClose]() {
			if (this[kQueue].isEmpty()) await Promise.all(this[kClients].map((c) => c.close()));
			else await new Promise((resolve) => {
				this[kClosedResolve] = resolve;
			});
		}
		async [kDestroy](err) {
			while (true) {
				const item = this[kQueue].shift();
				if (!item) break;
				item.handler.onError(err);
			}
			await Promise.all(this[kClients].map((c) => c.destroy(err)));
		}
		[kDispatch](opts, handler) {
			const dispatcher = this[kGetDispatcher]();
			if (!dispatcher) {
				this[kNeedDrain] = true;
				this[kQueue].push({
					opts,
					handler
				});
				this[kQueued]++;
			} else if (!dispatcher.dispatch(opts, handler)) {
				dispatcher[kNeedDrain] = true;
				this[kNeedDrain] = !this[kGetDispatcher]();
			}
			return !this[kNeedDrain];
		}
		[kAddClient](client) {
			client.on("drain", this[kOnDrain]).on("connect", this[kOnConnect]).on("disconnect", this[kOnDisconnect]).on("connectionError", this[kOnConnectionError]);
			this[kClients].push(client);
			if (this[kNeedDrain]) queueMicrotask(() => {
				if (this[kNeedDrain]) this[kOnDrain](client[kUrl], [this, client]);
			});
			return this;
		}
		[kRemoveClient](client) {
			client.close(() => {
				const idx = this[kClients].indexOf(client);
				if (idx !== -1) this[kClients].splice(idx, 1);
			});
			this[kNeedDrain] = this[kClients].some((dispatcher) => !dispatcher[kNeedDrain] && dispatcher.closed !== true && dispatcher.destroyed !== true);
		}
	};
	module.exports = {
		PoolBase,
		kClients,
		kNeedDrain,
		kAddClient,
		kRemoveClient,
		kGetDispatcher
	};
}));
//#endregion
//#region node_modules/.pnpm/undici@6.28.0/node_modules/undici/lib/dispatcher/pool.js
var require_pool = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const { PoolBase, kClients, kNeedDrain, kAddClient, kGetDispatcher } = require_pool_base();
	const Client = require_client();
	const { InvalidArgumentError } = require_errors();
	const util = require_util$7();
	const { kUrl, kInterceptors } = require_symbols$4();
	const buildConnector = require_connect();
	const kOptions = Symbol("options");
	const kConnections = Symbol("connections");
	const kFactory = Symbol("factory");
	function defaultFactory(origin, opts) {
		return new Client(origin, opts);
	}
	var Pool = class extends PoolBase {
		constructor(origin, { connections, factory = defaultFactory, connect, connectTimeout, tls, maxCachedSessions, socketPath, autoSelectFamily, autoSelectFamilyAttemptTimeout, allowH2, ...options } = {}) {
			if (connections != null && (!Number.isFinite(connections) || connections < 0)) throw new InvalidArgumentError("invalid connections");
			if (typeof factory !== "function") throw new InvalidArgumentError("factory must be a function.");
			if (connect != null && typeof connect !== "function" && typeof connect !== "object") throw new InvalidArgumentError("connect must be a function or an object");
			if (typeof connect !== "function") connect = buildConnector({
				...tls,
				maxCachedSessions,
				allowH2,
				socketPath,
				timeout: connectTimeout,
				...autoSelectFamily ? {
					autoSelectFamily,
					autoSelectFamilyAttemptTimeout
				} : void 0,
				...connect
			});
			super(options);
			this[kInterceptors] = options.interceptors?.Pool && Array.isArray(options.interceptors.Pool) ? options.interceptors.Pool : [];
			this[kConnections] = connections || null;
			this[kUrl] = util.parseOrigin(origin);
			this[kOptions] = {
				...util.deepClone(options),
				connect,
				allowH2
			};
			this[kOptions].interceptors = options.interceptors ? { ...options.interceptors } : void 0;
			this[kFactory] = factory;
			this.on("connectionError", (origin, targets, error) => {
				for (const target of targets) {
					const idx = this[kClients].indexOf(target);
					if (idx !== -1) this[kClients].splice(idx, 1);
				}
			});
		}
		[kGetDispatcher]() {
			for (const client of this[kClients]) if (!client[kNeedDrain]) return client;
			if (!this[kConnections] || this[kClients].length < this[kConnections]) {
				const dispatcher = this[kFactory](this[kUrl], this[kOptions]);
				this[kAddClient](dispatcher);
				return dispatcher;
			}
		}
	};
	module.exports = Pool;
}));
//#endregion
//#region node_modules/.pnpm/undici@6.28.0/node_modules/undici/lib/dispatcher/balanced-pool.js
var require_balanced_pool = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const { BalancedPoolMissingUpstreamError, InvalidArgumentError } = require_errors();
	const { PoolBase, kClients, kNeedDrain, kAddClient, kRemoveClient, kGetDispatcher } = require_pool_base();
	const Pool = require_pool();
	const { kUrl, kInterceptors } = require_symbols$4();
	const { parseOrigin } = require_util$7();
	const kFactory = Symbol("factory");
	const kOptions = Symbol("options");
	const kGreatestCommonDivisor = Symbol("kGreatestCommonDivisor");
	const kCurrentWeight = Symbol("kCurrentWeight");
	const kIndex = Symbol("kIndex");
	const kWeight = Symbol("kWeight");
	const kMaxWeightPerServer = Symbol("kMaxWeightPerServer");
	const kErrorPenalty = Symbol("kErrorPenalty");
	/**
	* Calculate the greatest common divisor of two numbers by
	* using the Euclidean algorithm.
	*
	* @param {number} a
	* @param {number} b
	* @returns {number}
	*/
	function getGreatestCommonDivisor(a, b) {
		if (a === 0) return b;
		while (b !== 0) {
			const t = b;
			b = a % b;
			a = t;
		}
		return a;
	}
	function defaultFactory(origin, opts) {
		return new Pool(origin, opts);
	}
	var BalancedPool = class extends PoolBase {
		constructor(upstreams = [], { factory = defaultFactory, ...opts } = {}) {
			super();
			this[kOptions] = opts;
			this[kIndex] = -1;
			this[kCurrentWeight] = 0;
			this[kMaxWeightPerServer] = this[kOptions].maxWeightPerServer || 100;
			this[kErrorPenalty] = this[kOptions].errorPenalty || 15;
			if (!Array.isArray(upstreams)) upstreams = [upstreams];
			if (typeof factory !== "function") throw new InvalidArgumentError("factory must be a function.");
			this[kInterceptors] = opts.interceptors?.BalancedPool && Array.isArray(opts.interceptors.BalancedPool) ? opts.interceptors.BalancedPool : [];
			this[kFactory] = factory;
			for (const upstream of upstreams) this.addUpstream(upstream);
			this._updateBalancedPoolStats();
		}
		addUpstream(upstream) {
			const upstreamOrigin = parseOrigin(upstream).origin;
			if (this[kClients].find((pool) => pool[kUrl].origin === upstreamOrigin && pool.closed !== true && pool.destroyed !== true)) return this;
			const pool = this[kFactory](upstreamOrigin, Object.assign({}, this[kOptions]));
			this[kAddClient](pool);
			pool.on("connect", () => {
				pool[kWeight] = Math.min(this[kMaxWeightPerServer], pool[kWeight] + this[kErrorPenalty]);
			});
			pool.on("connectionError", () => {
				pool[kWeight] = Math.max(1, pool[kWeight] - this[kErrorPenalty]);
				this._updateBalancedPoolStats();
			});
			pool.on("disconnect", (...args) => {
				const err = args[2];
				if (err && err.code === "UND_ERR_SOCKET") {
					pool[kWeight] = Math.max(1, pool[kWeight] - this[kErrorPenalty]);
					this._updateBalancedPoolStats();
				}
			});
			for (const client of this[kClients]) client[kWeight] = this[kMaxWeightPerServer];
			this._updateBalancedPoolStats();
			return this;
		}
		_updateBalancedPoolStats() {
			let result = 0;
			for (let i = 0; i < this[kClients].length; i++) result = getGreatestCommonDivisor(this[kClients][i][kWeight], result);
			this[kGreatestCommonDivisor] = result;
		}
		removeUpstream(upstream) {
			const upstreamOrigin = parseOrigin(upstream).origin;
			const pool = this[kClients].find((pool) => pool[kUrl].origin === upstreamOrigin && pool.closed !== true && pool.destroyed !== true);
			if (pool) this[kRemoveClient](pool);
			return this;
		}
		get upstreams() {
			return this[kClients].filter((dispatcher) => dispatcher.closed !== true && dispatcher.destroyed !== true).map((p) => p[kUrl].origin);
		}
		[kGetDispatcher]() {
			if (this[kClients].length === 0) throw new BalancedPoolMissingUpstreamError();
			if (!this[kClients].find((dispatcher) => !dispatcher[kNeedDrain] && dispatcher.closed !== true && dispatcher.destroyed !== true)) return;
			if (this[kClients].map((pool) => pool[kNeedDrain]).reduce((a, b) => a && b, true)) return;
			let counter = 0;
			let maxWeightIndex = this[kClients].findIndex((pool) => !pool[kNeedDrain]);
			while (counter++ < this[kClients].length) {
				this[kIndex] = (this[kIndex] + 1) % this[kClients].length;
				const pool = this[kClients][this[kIndex]];
				if (pool[kWeight] > this[kClients][maxWeightIndex][kWeight] && !pool[kNeedDrain]) maxWeightIndex = this[kIndex];
				if (this[kIndex] === 0) {
					this[kCurrentWeight] = this[kCurrentWeight] - this[kGreatestCommonDivisor];
					if (this[kCurrentWeight] <= 0) this[kCurrentWeight] = this[kMaxWeightPerServer];
				}
				if (pool[kWeight] >= this[kCurrentWeight] && !pool[kNeedDrain]) return pool;
			}
			this[kCurrentWeight] = this[kClients][maxWeightIndex][kWeight];
			this[kIndex] = maxWeightIndex;
			return this[kClients][maxWeightIndex];
		}
	};
	module.exports = BalancedPool;
}));
//#endregion
//#region node_modules/.pnpm/undici@6.28.0/node_modules/undici/lib/dispatcher/agent.js
var require_agent = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const { InvalidArgumentError } = require_errors();
	const { kClients, kRunning, kClose, kDestroy, kDispatch, kInterceptors } = require_symbols$4();
	const DispatcherBase = require_dispatcher_base();
	const Pool = require_pool();
	const Client = require_client();
	const util = require_util$7();
	const createRedirectInterceptor = require_redirect_interceptor();
	const kOnConnect = Symbol("onConnect");
	const kOnDisconnect = Symbol("onDisconnect");
	const kOnConnectionError = Symbol("onConnectionError");
	const kMaxRedirections = Symbol("maxRedirections");
	const kOnDrain = Symbol("onDrain");
	const kFactory = Symbol("factory");
	const kOptions = Symbol("options");
	function defaultFactory(origin, opts) {
		return opts && opts.connections === 1 ? new Client(origin, opts) : new Pool(origin, opts);
	}
	var Agent = class extends DispatcherBase {
		constructor({ factory = defaultFactory, maxRedirections = 0, connect, ...options } = {}) {
			if (typeof factory !== "function") throw new InvalidArgumentError("factory must be a function.");
			if (connect != null && typeof connect !== "function" && typeof connect !== "object") throw new InvalidArgumentError("connect must be a function or an object");
			if (!Number.isInteger(maxRedirections) || maxRedirections < 0) throw new InvalidArgumentError("maxRedirections must be a positive number");
			super(options);
			if (connect && typeof connect !== "function") connect = { ...connect };
			this[kInterceptors] = options.interceptors?.Agent && Array.isArray(options.interceptors.Agent) ? options.interceptors.Agent : [createRedirectInterceptor({ maxRedirections })];
			this[kOptions] = {
				...util.deepClone(options),
				connect
			};
			this[kOptions].interceptors = options.interceptors ? { ...options.interceptors } : void 0;
			this[kMaxRedirections] = maxRedirections;
			this[kFactory] = factory;
			this[kClients] = /* @__PURE__ */ new Map();
			this[kOnDrain] = (origin, targets) => {
				this.emit("drain", origin, [this, ...targets]);
			};
			this[kOnConnect] = (origin, targets) => {
				this.emit("connect", origin, [this, ...targets]);
			};
			this[kOnDisconnect] = (origin, targets, err) => {
				this.emit("disconnect", origin, [this, ...targets], err);
			};
			this[kOnConnectionError] = (origin, targets, err) => {
				this.emit("connectionError", origin, [this, ...targets], err);
			};
		}
		get [kRunning]() {
			let ret = 0;
			for (const client of this[kClients].values()) ret += client[kRunning];
			return ret;
		}
		[kDispatch](opts, handler) {
			let key;
			if (opts.origin && (typeof opts.origin === "string" || opts.origin instanceof URL)) key = String(opts.origin);
			else throw new InvalidArgumentError("opts.origin must be a non-empty string or URL.");
			let dispatcher = this[kClients].get(key);
			if (!dispatcher) {
				dispatcher = this[kFactory](opts.origin, this[kOptions]).on("drain", this[kOnDrain]).on("connect", this[kOnConnect]).on("disconnect", this[kOnDisconnect]).on("connectionError", this[kOnConnectionError]);
				this[kClients].set(key, dispatcher);
			}
			return dispatcher.dispatch(opts, handler);
		}
		async [kClose]() {
			const closePromises = [];
			for (const client of this[kClients].values()) closePromises.push(client.close());
			this[kClients].clear();
			await Promise.all(closePromises);
		}
		async [kDestroy](err) {
			const destroyPromises = [];
			for (const client of this[kClients].values()) destroyPromises.push(client.destroy(err));
			this[kClients].clear();
			await Promise.all(destroyPromises);
		}
	};
	module.exports = Agent;
}));
//#endregion
//#region node_modules/.pnpm/undici@6.28.0/node_modules/undici/lib/dispatcher/proxy-agent.js
var require_proxy_agent = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const { kProxy, kClose, kDestroy, kDispatch, kInterceptors } = require_symbols$4();
	const { URL: URL$1 } = __require("node:url");
	const Agent = require_agent();
	const Pool = require_pool();
	const DispatcherBase = require_dispatcher_base();
	const { InvalidArgumentError, RequestAbortedError, SecureProxyConnectionError } = require_errors();
	const buildConnector = require_connect();
	const Client = require_client();
	const kAgent = Symbol("proxy agent");
	const kClient = Symbol("proxy client");
	const kProxyHeaders = Symbol("proxy headers");
	const kRequestTls = Symbol("request tls settings");
	const kProxyTls = Symbol("proxy tls settings");
	const kConnectEndpoint = Symbol("connect endpoint function");
	const kTunnelProxy = Symbol("tunnel proxy");
	function defaultProtocolPort(protocol) {
		return protocol === "https:" ? 443 : 80;
	}
	function defaultFactory(origin, opts) {
		return new Pool(origin, opts);
	}
	const noop = () => {};
	function defaultAgentFactory(origin, opts) {
		if (opts.connections === 1) return new Client(origin, opts);
		return new Pool(origin, opts);
	}
	var Http1ProxyWrapper = class extends DispatcherBase {
		#client;
		constructor(proxyUrl, { headers = {}, connect, factory }) {
			super();
			if (!proxyUrl) throw new InvalidArgumentError("Proxy URL is mandatory");
			this[kProxyHeaders] = headers;
			if (factory) this.#client = factory(proxyUrl, { connect });
			else this.#client = new Client(proxyUrl, { connect });
		}
		[kDispatch](opts, handler) {
			const onHeaders = handler.onHeaders;
			handler.onHeaders = function(statusCode, data, resume) {
				if (statusCode === 407) {
					if (typeof handler.onError === "function") handler.onError(new InvalidArgumentError("Proxy Authentication Required (407)"));
					return;
				}
				if (onHeaders) onHeaders.call(this, statusCode, data, resume);
			};
			const { origin, path = "/", headers = {} } = opts;
			opts.path = origin + path;
			if (!("host" in headers) && !("Host" in headers)) {
				const { host } = new URL$1(origin);
				headers.host = host;
			}
			opts.headers = {
				...this[kProxyHeaders],
				...headers
			};
			return this.#client[kDispatch](opts, handler);
		}
		async [kClose]() {
			return this.#client.close();
		}
		async [kDestroy](err) {
			return this.#client.destroy(err);
		}
	};
	var ProxyAgent = class extends DispatcherBase {
		constructor(opts) {
			super();
			if (!opts || typeof opts === "object" && !(opts instanceof URL$1) && !opts.uri) throw new InvalidArgumentError("Proxy uri is mandatory");
			const { clientFactory = defaultFactory } = opts;
			if (typeof clientFactory !== "function") throw new InvalidArgumentError("Proxy opts.clientFactory must be a function.");
			const { proxyTunnel = true } = opts;
			const url = this.#getUrl(opts);
			const { href, origin, port, protocol, username, password, hostname: proxyHostname } = url;
			this[kProxy] = {
				uri: href,
				protocol
			};
			this[kInterceptors] = opts.interceptors?.ProxyAgent && Array.isArray(opts.interceptors.ProxyAgent) ? opts.interceptors.ProxyAgent : [];
			this[kRequestTls] = opts.requestTls;
			this[kProxyTls] = opts.proxyTls;
			this[kProxyHeaders] = opts.headers || {};
			this[kTunnelProxy] = proxyTunnel;
			if (opts.auth && opts.token) throw new InvalidArgumentError("opts.auth cannot be used in combination with opts.token");
			else if (opts.auth) this[kProxyHeaders]["proxy-authorization"] = `Basic ${opts.auth}`;
			else if (opts.token) this[kProxyHeaders]["proxy-authorization"] = opts.token;
			else if (username && password) this[kProxyHeaders]["proxy-authorization"] = `Basic ${Buffer.from(`${decodeURIComponent(username)}:${decodeURIComponent(password)}`).toString("base64")}`;
			const connect = buildConnector({ ...opts.proxyTls });
			this[kConnectEndpoint] = buildConnector({ ...opts.requestTls });
			const agentFactory = opts.factory || defaultAgentFactory;
			const factory = (origin, options) => {
				const { protocol } = new URL$1(origin);
				if (!this[kTunnelProxy] && protocol === "http:" && this[kProxy].protocol === "http:") return new Http1ProxyWrapper(this[kProxy].uri, {
					headers: this[kProxyHeaders],
					connect,
					factory: agentFactory
				});
				return agentFactory(origin, options);
			};
			this[kClient] = clientFactory(url, { connect });
			this[kAgent] = new Agent({
				...opts,
				factory,
				connect: async (opts, callback) => {
					let requestedPath = opts.host;
					if (!opts.port) requestedPath += `:${defaultProtocolPort(opts.protocol)}`;
					try {
						const { socket, statusCode } = await this[kClient].connect({
							origin,
							port,
							path: requestedPath,
							signal: opts.signal,
							headers: {
								...this[kProxyHeaders],
								host: opts.host
							},
							servername: this[kProxyTls]?.servername || proxyHostname
						});
						if (statusCode !== 200) {
							socket.on("error", noop).destroy();
							callback(new RequestAbortedError(`Proxy response (${statusCode}) !== 200 when HTTP Tunneling`));
						}
						if (opts.protocol !== "https:") {
							callback(null, socket);
							return;
						}
						let servername;
						if (this[kRequestTls]) servername = this[kRequestTls].servername;
						else servername = opts.servername;
						this[kConnectEndpoint]({
							...opts,
							servername,
							httpSocket: socket
						}, callback);
					} catch (err) {
						if (err.code === "ERR_TLS_CERT_ALTNAME_INVALID") callback(new SecureProxyConnectionError(err));
						else callback(err);
					}
				}
			});
		}
		dispatch(opts, handler) {
			const headers = buildHeaders(opts.headers);
			throwIfProxyAuthIsSent(headers);
			if (headers && !("host" in headers) && !("Host" in headers)) {
				const { host } = new URL$1(opts.origin);
				headers.host = host;
			}
			return this[kAgent].dispatch({
				...opts,
				headers
			}, handler);
		}
		/**
		* @param {import('../types/proxy-agent').ProxyAgent.Options | string | URL} opts
		* @returns {URL}
		*/
		#getUrl(opts) {
			if (typeof opts === "string") return new URL$1(opts);
			else if (opts instanceof URL$1) return opts;
			else return new URL$1(opts.uri);
		}
		async [kClose]() {
			await this[kAgent].close();
			await this[kClient].close();
		}
		async [kDestroy]() {
			await this[kAgent].destroy();
			await this[kClient].destroy();
		}
	};
	/**
	* @param {string[] | Record<string, string>} headers
	* @returns {Record<string, string>}
	*/
	function buildHeaders(headers) {
		if (Array.isArray(headers)) {
			/** @type {Record<string, string>} */
			const headersPair = {};
			for (let i = 0; i < headers.length; i += 2) headersPair[headers[i]] = headers[i + 1];
			return headersPair;
		}
		return headers;
	}
	/**
	* @param {Record<string, string>} headers
	*
	* Previous versions of ProxyAgent suggests the Proxy-Authorization in request headers
	* Nevertheless, it was changed and to avoid a security vulnerability by end users
	* this check was created.
	* It should be removed in the next major version for performance reasons
	*/
	function throwIfProxyAuthIsSent(headers) {
		if (headers && Object.keys(headers).find((key) => key.toLowerCase() === "proxy-authorization")) throw new InvalidArgumentError("Proxy-Authorization should be sent in ProxyAgent constructor");
	}
	module.exports = ProxyAgent;
}));
//#endregion
//#region node_modules/.pnpm/undici@6.28.0/node_modules/undici/lib/dispatcher/env-http-proxy-agent.js
var require_env_http_proxy_agent = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const DispatcherBase = require_dispatcher_base();
	const { kClose, kDestroy, kClosed, kDestroyed, kDispatch, kNoProxyAgent, kHttpProxyAgent, kHttpsProxyAgent } = require_symbols$4();
	const ProxyAgent = require_proxy_agent();
	const Agent = require_agent();
	const DEFAULT_PORTS = {
		"http:": 80,
		"https:": 443
	};
	let experimentalWarned = false;
	var EnvHttpProxyAgent = class extends DispatcherBase {
		#noProxyValue = null;
		#noProxyEntries = null;
		#opts = null;
		constructor(opts = {}) {
			super();
			this.#opts = opts;
			if (!experimentalWarned) {
				experimentalWarned = true;
				process.emitWarning("EnvHttpProxyAgent is experimental, expect them to change at any time.", { code: "UNDICI-EHPA" });
			}
			const { httpProxy, httpsProxy, noProxy, ...agentOpts } = opts;
			this[kNoProxyAgent] = new Agent(agentOpts);
			const HTTP_PROXY = httpProxy ?? process.env.http_proxy ?? process.env.HTTP_PROXY;
			if (HTTP_PROXY) this[kHttpProxyAgent] = new ProxyAgent({
				...agentOpts,
				uri: HTTP_PROXY
			});
			else this[kHttpProxyAgent] = this[kNoProxyAgent];
			const HTTPS_PROXY = httpsProxy ?? process.env.https_proxy ?? process.env.HTTPS_PROXY;
			if (HTTPS_PROXY) this[kHttpsProxyAgent] = new ProxyAgent({
				...agentOpts,
				uri: HTTPS_PROXY
			});
			else this[kHttpsProxyAgent] = this[kHttpProxyAgent];
			this.#parseNoProxy();
		}
		[kDispatch](opts, handler) {
			const url = new URL(opts.origin);
			return this.#getProxyAgentForUrl(url).dispatch(opts, handler);
		}
		async [kClose]() {
			await this[kNoProxyAgent].close();
			if (!this[kHttpProxyAgent][kClosed]) await this[kHttpProxyAgent].close();
			if (!this[kHttpsProxyAgent][kClosed]) await this[kHttpsProxyAgent].close();
		}
		async [kDestroy](err) {
			await this[kNoProxyAgent].destroy(err);
			if (!this[kHttpProxyAgent][kDestroyed]) await this[kHttpProxyAgent].destroy(err);
			if (!this[kHttpsProxyAgent][kDestroyed]) await this[kHttpsProxyAgent].destroy(err);
		}
		#getProxyAgentForUrl(url) {
			let { protocol, host: hostname, port } = url;
			hostname = hostname.replace(/:\d*$/, "").toLowerCase();
			port = Number.parseInt(port, 10) || DEFAULT_PORTS[protocol] || 0;
			if (!this.#shouldProxy(hostname, port)) return this[kNoProxyAgent];
			if (protocol === "https:") return this[kHttpsProxyAgent];
			return this[kHttpProxyAgent];
		}
		#shouldProxy(hostname, port) {
			if (this.#noProxyChanged) this.#parseNoProxy();
			if (this.#noProxyEntries.length === 0) return true;
			if (this.#noProxyValue === "*") return false;
			for (let i = 0; i < this.#noProxyEntries.length; i++) {
				const entry = this.#noProxyEntries[i];
				if (entry.port && entry.port !== port) continue;
				if (!/^[.*]/.test(entry.hostname)) {
					if (hostname === entry.hostname) return false;
				} else if (hostname.endsWith(entry.hostname.replace(/^\*/, ""))) return false;
			}
			return true;
		}
		#parseNoProxy() {
			const noProxyValue = this.#opts.noProxy ?? this.#noProxyEnv;
			const noProxySplit = noProxyValue.split(/[,\s]/);
			const noProxyEntries = [];
			for (let i = 0; i < noProxySplit.length; i++) {
				const entry = noProxySplit[i];
				if (!entry) continue;
				const parsed = entry.match(/^(.+):(\d+)$/);
				noProxyEntries.push({
					hostname: (parsed ? parsed[1] : entry).toLowerCase(),
					port: parsed ? Number.parseInt(parsed[2], 10) : 0
				});
			}
			this.#noProxyValue = noProxyValue;
			this.#noProxyEntries = noProxyEntries;
		}
		get #noProxyChanged() {
			if (this.#opts.noProxy !== void 0) return false;
			return this.#noProxyValue !== this.#noProxyEnv;
		}
		get #noProxyEnv() {
			return process.env.no_proxy ?? process.env.NO_PROXY ?? "";
		}
	};
	module.exports = EnvHttpProxyAgent;
}));
//#endregion
//#region node_modules/.pnpm/undici@6.28.0/node_modules/undici/lib/handler/retry-handler.js
var require_retry_handler = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const assert$15 = __require("node:assert");
	const { kRetryHandlerDefaultRetry } = require_symbols$4();
	const { RequestRetryError } = require_errors();
	const { isDisturbed, parseHeaders, parseRangeHeader, wrapRequestBody } = require_util$7();
	function calculateRetryAfterHeader(retryAfter) {
		const current = Date.now();
		return new Date(retryAfter).getTime() - current;
	}
	function validatePartialResponseContentLength(headers, range, statusCode, retryCount) {
		const contentLength = headers["content-length"];
		if (contentLength == null) return null;
		if (!Number.isFinite(range.start) || !Number.isFinite(range.end)) return null;
		const length = Number(contentLength);
		const expectedLength = range.end - range.start + 1;
		if (!Number.isFinite(length) || length !== expectedLength) return new RequestRetryError("Content-Length mismatch", statusCode, {
			headers,
			data: { count: retryCount }
		});
		return null;
	}
	module.exports = class RetryHandler {
		constructor(opts, handlers) {
			const { retryOptions, ...dispatchOpts } = opts;
			const { retry: retryFn, maxRetries, maxTimeout, minTimeout, timeoutFactor, methods, errorCodes, retryAfter, statusCodes } = retryOptions ?? {};
			this.dispatch = handlers.dispatch;
			this.handler = handlers.handler;
			this.opts = {
				...dispatchOpts,
				body: wrapRequestBody(opts.body)
			};
			this.abort = null;
			this.aborted = false;
			this.retryOpts = {
				retry: retryFn ?? RetryHandler[kRetryHandlerDefaultRetry],
				retryAfter: retryAfter ?? true,
				maxTimeout: maxTimeout ?? 3e4,
				minTimeout: minTimeout ?? 500,
				timeoutFactor: timeoutFactor ?? 2,
				maxRetries: maxRetries ?? 5,
				methods: methods ?? [
					"GET",
					"HEAD",
					"OPTIONS",
					"PUT",
					"DELETE",
					"TRACE"
				],
				statusCodes: statusCodes ?? [
					500,
					502,
					503,
					504,
					429
				],
				errorCodes: errorCodes ?? [
					"ECONNRESET",
					"ECONNREFUSED",
					"ENOTFOUND",
					"ENETDOWN",
					"ENETUNREACH",
					"EHOSTDOWN",
					"EHOSTUNREACH",
					"EPIPE",
					"UND_ERR_SOCKET"
				]
			};
			this.retryCount = 0;
			this.retryCountCheckpoint = 0;
			this.start = 0;
			this.end = null;
			this.etag = null;
			this.resume = null;
			this.handler.onConnect((reason) => {
				this.aborted = true;
				if (this.abort) this.abort(reason);
				else this.reason = reason;
			});
		}
		onRequestSent() {
			if (this.handler.onRequestSent) this.handler.onRequestSent();
		}
		onUpgrade(statusCode, headers, socket) {
			if (this.handler.onUpgrade) this.handler.onUpgrade(statusCode, headers, socket);
		}
		onConnect(abort) {
			if (this.aborted) abort(this.reason);
			else this.abort = abort;
		}
		onBodySent(chunk) {
			if (this.handler.onBodySent) return this.handler.onBodySent(chunk);
		}
		static [kRetryHandlerDefaultRetry](err, { state, opts }, cb) {
			const { statusCode, code, headers } = err;
			const { method, retryOptions } = opts;
			const { maxRetries, minTimeout, maxTimeout, timeoutFactor, statusCodes, errorCodes, methods } = retryOptions;
			const { counter } = state;
			if (code && code !== "UND_ERR_REQ_RETRY" && !errorCodes.includes(code)) {
				cb(err);
				return;
			}
			if (Array.isArray(methods) && !methods.includes(method)) {
				cb(err);
				return;
			}
			if (statusCode != null && Array.isArray(statusCodes) && !statusCodes.includes(statusCode)) {
				cb(err);
				return;
			}
			if (counter > maxRetries) {
				cb(err);
				return;
			}
			let retryAfterHeader = headers?.["retry-after"];
			if (retryAfterHeader) {
				retryAfterHeader = Number(retryAfterHeader);
				retryAfterHeader = Number.isNaN(retryAfterHeader) ? calculateRetryAfterHeader(retryAfterHeader) : retryAfterHeader * 1e3;
			}
			const retryTimeout = retryAfterHeader > 0 ? Math.min(retryAfterHeader, maxTimeout) : Math.min(minTimeout * timeoutFactor ** (counter - 1), maxTimeout);
			setTimeout(() => cb(null), retryTimeout);
		}
		onHeaders(statusCode, rawHeaders, resume, statusMessage) {
			const headers = parseHeaders(rawHeaders);
			this.retryCount += 1;
			if (statusCode >= 300) if (this.retryOpts.statusCodes.includes(statusCode) === false) return this.handler.onHeaders(statusCode, rawHeaders, resume, statusMessage);
			else {
				this.abort(new RequestRetryError("Request failed", statusCode, {
					headers,
					data: { count: this.retryCount }
				}));
				return false;
			}
			if (this.resume != null) {
				this.resume = null;
				if (statusCode !== 206 && (this.start > 0 || statusCode !== 200)) {
					this.abort(new RequestRetryError("server does not support the range header and the payload was partially consumed", statusCode, {
						headers,
						data: { count: this.retryCount }
					}));
					return false;
				}
				const contentRange = parseRangeHeader(headers["content-range"]);
				if (!contentRange) {
					this.abort(new RequestRetryError("Content-Range mismatch", statusCode, {
						headers,
						data: { count: this.retryCount }
					}));
					return false;
				}
				if (this.etag != null && this.etag !== headers.etag) {
					this.abort(new RequestRetryError("ETag mismatch", statusCode, {
						headers,
						data: { count: this.retryCount }
					}));
					return false;
				}
				const contentLengthError = validatePartialResponseContentLength(headers, contentRange, statusCode, this.retryCount);
				if (contentLengthError != null) {
					this.abort(contentLengthError);
					return false;
				}
				const { start, size, end = size - 1 } = contentRange;
				assert$15(this.start === start, "content-range mismatch");
				assert$15(this.end == null || this.end === end, "content-range mismatch");
				this.resume = resume;
				return true;
			}
			if (this.end == null) {
				if (statusCode === 206) {
					const range = parseRangeHeader(headers["content-range"]);
					if (range == null) return this.handler.onHeaders(statusCode, rawHeaders, resume, statusMessage);
					const contentLengthError = validatePartialResponseContentLength(headers, range, statusCode, this.retryCount);
					if (contentLengthError != null) {
						this.abort(contentLengthError);
						return false;
					}
					const { start, size, end = size - 1 } = range;
					assert$15(start != null && Number.isFinite(start), "content-range mismatch");
					assert$15(end != null && Number.isFinite(end), "invalid content-length");
					this.start = start;
					this.end = end;
				}
				if (this.end == null) {
					const contentLength = headers["content-length"];
					this.end = contentLength != null ? Number(contentLength) - 1 : null;
				}
				assert$15(Number.isFinite(this.start));
				assert$15(this.end == null || Number.isFinite(this.end), "invalid content-length");
				this.resume = resume;
				this.etag = headers.etag != null ? headers.etag : null;
				if (this.etag != null && this.etag.startsWith("W/")) this.etag = null;
				return this.handler.onHeaders(statusCode, rawHeaders, resume, statusMessage);
			}
			const err = new RequestRetryError("Request failed", statusCode, {
				headers,
				data: { count: this.retryCount }
			});
			this.abort(err);
			return false;
		}
		onData(chunk) {
			this.start += chunk.length;
			return this.handler.onData(chunk);
		}
		onComplete(rawTrailers) {
			this.retryCount = 0;
			return this.handler.onComplete(rawTrailers);
		}
		onError(err) {
			if (this.aborted || isDisturbed(this.opts.body)) return this.handler.onError(err);
			if (this.retryCount - this.retryCountCheckpoint > 0) this.retryCount = this.retryCountCheckpoint + (this.retryCount - this.retryCountCheckpoint);
			else this.retryCount += 1;
			this.retryOpts.retry(err, {
				state: { counter: this.retryCount },
				opts: {
					retryOptions: this.retryOpts,
					...this.opts
				}
			}, onRetry.bind(this));
			function onRetry(err) {
				if (err != null || this.aborted || isDisturbed(this.opts.body)) return this.handler.onError(err);
				if (this.start !== 0) {
					const headers = { range: `bytes=${this.start}-${this.end ?? ""}` };
					if (this.etag != null) headers["if-match"] = this.etag;
					this.opts = {
						...this.opts,
						headers: {
							...this.opts.headers,
							...headers
						}
					};
				}
				try {
					this.retryCountCheckpoint = this.retryCount;
					this.dispatch(this.opts, this);
				} catch (err) {
					this.handler.onError(err);
				}
			}
		}
	};
}));
//#endregion
//#region node_modules/.pnpm/undici@6.28.0/node_modules/undici/lib/dispatcher/retry-agent.js
var require_retry_agent = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const Dispatcher = require_dispatcher();
	const RetryHandler = require_retry_handler();
	var RetryAgent = class extends Dispatcher {
		#agent = null;
		#options = null;
		constructor(agent, options = {}) {
			super(options);
			this.#agent = agent;
			this.#options = options;
		}
		dispatch(opts, handler) {
			const retry = new RetryHandler({
				...opts,
				retryOptions: this.#options
			}, {
				dispatch: this.#agent.dispatch.bind(this.#agent),
				handler
			});
			return this.#agent.dispatch(opts, retry);
		}
		close() {
			return this.#agent.close();
		}
		destroy() {
			return this.#agent.destroy();
		}
	};
	module.exports = RetryAgent;
}));
//#endregion
//#region node_modules/.pnpm/undici@6.28.0/node_modules/undici/lib/api/readable.js
var require_readable = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const assert$14 = __require("node:assert");
	const { Readable: Readable$2 } = __require("node:stream");
	const { RequestAbortedError, NotSupportedError, InvalidArgumentError, AbortError } = require_errors();
	const util = require_util$7();
	const { ReadableStreamFrom } = require_util$7();
	const kConsume = Symbol("kConsume");
	const kReading = Symbol("kReading");
	const kBody = Symbol("kBody");
	const kAbort = Symbol("kAbort");
	const kContentType = Symbol("kContentType");
	const kContentLength = Symbol("kContentLength");
	const noop = () => {};
	var BodyReadable = class extends Readable$2 {
		constructor({ resume, abort, contentType = "", contentLength, highWaterMark = 65536 }) {
			super({
				autoDestroy: true,
				read: resume,
				highWaterMark
			});
			this._readableState.dataEmitted = false;
			this[kAbort] = abort;
			this[kConsume] = null;
			this[kBody] = null;
			this[kContentType] = contentType;
			this[kContentLength] = contentLength;
			this[kReading] = false;
		}
		destroy(err) {
			if (!err && !this._readableState.endEmitted) err = new RequestAbortedError();
			if (err) this[kAbort]();
			return super.destroy(err);
		}
		_destroy(err, callback) {
			if (!this[kReading]) setImmediate(() => {
				callback(err);
			});
			else callback(err);
		}
		on(ev, ...args) {
			if (ev === "data" || ev === "readable") this[kReading] = true;
			return super.on(ev, ...args);
		}
		addListener(ev, ...args) {
			return this.on(ev, ...args);
		}
		off(ev, ...args) {
			const ret = super.off(ev, ...args);
			if (ev === "data" || ev === "readable") this[kReading] = this.listenerCount("data") > 0 || this.listenerCount("readable") > 0;
			return ret;
		}
		removeListener(ev, ...args) {
			return this.off(ev, ...args);
		}
		push(chunk) {
			if (this[kConsume] && chunk !== null) {
				consumePush(this[kConsume], chunk);
				return this[kReading] ? super.push(chunk) : true;
			}
			return super.push(chunk);
		}
		async text() {
			return consume(this, "text");
		}
		async json() {
			return consume(this, "json");
		}
		async blob() {
			return consume(this, "blob");
		}
		async bytes() {
			return consume(this, "bytes");
		}
		async arrayBuffer() {
			return consume(this, "arrayBuffer");
		}
		async formData() {
			throw new NotSupportedError();
		}
		get bodyUsed() {
			return util.isDisturbed(this);
		}
		get body() {
			if (!this[kBody]) {
				this[kBody] = ReadableStreamFrom(this);
				if (this[kConsume]) {
					this[kBody].getReader();
					assert$14(this[kBody].locked);
				}
			}
			return this[kBody];
		}
		async dump(opts) {
			let limit = Number.isFinite(opts?.limit) ? opts.limit : 131072;
			const signal = opts?.signal;
			if (signal != null && (typeof signal !== "object" || !("aborted" in signal))) throw new InvalidArgumentError("signal must be an AbortSignal");
			signal?.throwIfAborted();
			if (this._readableState.closeEmitted) return null;
			return await new Promise((resolve, reject) => {
				if (this[kContentLength] > limit) this.destroy(new AbortError());
				const onAbort = () => {
					this.destroy(signal.reason ?? new AbortError());
				};
				signal?.addEventListener("abort", onAbort);
				this.on("close", function() {
					signal?.removeEventListener("abort", onAbort);
					if (signal?.aborted) reject(signal.reason ?? new AbortError());
					else resolve(null);
				}).on("error", noop).on("data", function(chunk) {
					limit -= chunk.length;
					if (limit <= 0) this.destroy();
				}).resume();
			});
		}
	};
	function isLocked(self) {
		return self[kBody] && self[kBody].locked === true || self[kConsume];
	}
	function isUnusable(self) {
		return util.isDisturbed(self) || isLocked(self);
	}
	async function consume(stream, type) {
		assert$14(!stream[kConsume]);
		return new Promise((resolve, reject) => {
			if (isUnusable(stream)) {
				const rState = stream._readableState;
				if (rState.destroyed && rState.closeEmitted === false) stream.on("error", (err) => {
					reject(err);
				}).on("close", () => {
					reject(/* @__PURE__ */ new TypeError("unusable"));
				});
				else reject(rState.errored ?? /* @__PURE__ */ new TypeError("unusable"));
			} else queueMicrotask(() => {
				stream[kConsume] = {
					type,
					stream,
					resolve,
					reject,
					length: 0,
					body: []
				};
				stream.on("error", function(err) {
					consumeFinish(this[kConsume], err);
				}).on("close", function() {
					if (this[kConsume].body !== null) consumeFinish(this[kConsume], new RequestAbortedError());
				});
				consumeStart(stream[kConsume]);
			});
		});
	}
	function consumeStart(consume) {
		if (consume.body === null) return;
		const { _readableState: state } = consume.stream;
		if (state.bufferIndex) {
			const start = state.bufferIndex;
			const end = state.buffer.length;
			for (let n = start; n < end; n++) consumePush(consume, state.buffer[n]);
		} else for (const chunk of state.buffer) consumePush(consume, chunk);
		if (state.endEmitted) consumeEnd(this[kConsume]);
		else consume.stream.on("end", function() {
			consumeEnd(this[kConsume]);
		});
		consume.stream.resume();
		while (consume.stream.read() != null);
	}
	/**
	* @param {Buffer[]} chunks
	* @param {number} length
	*/
	function chunksDecode(chunks, length) {
		if (chunks.length === 0 || length === 0) return "";
		const buffer = chunks.length === 1 ? chunks[0] : Buffer.concat(chunks, length);
		const bufferLength = buffer.length;
		const start = bufferLength > 2 && buffer[0] === 239 && buffer[1] === 187 && buffer[2] === 191 ? 3 : 0;
		return buffer.utf8Slice(start, bufferLength);
	}
	/**
	* @param {Buffer[]} chunks
	* @param {number} length
	* @returns {Uint8Array}
	*/
	function chunksConcat(chunks, length) {
		if (chunks.length === 0 || length === 0) return /* @__PURE__ */ new Uint8Array(0);
		if (chunks.length === 1) return new Uint8Array(chunks[0]);
		const buffer = new Uint8Array(Buffer.allocUnsafeSlow(length).buffer);
		let offset = 0;
		for (let i = 0; i < chunks.length; ++i) {
			const chunk = chunks[i];
			buffer.set(chunk, offset);
			offset += chunk.length;
		}
		return buffer;
	}
	function consumeEnd(consume) {
		const { type, body, resolve, stream, length } = consume;
		try {
			if (type === "text") resolve(chunksDecode(body, length));
			else if (type === "json") resolve(JSON.parse(chunksDecode(body, length)));
			else if (type === "arrayBuffer") resolve(chunksConcat(body, length).buffer);
			else if (type === "blob") resolve(new Blob(body, { type: stream[kContentType] }));
			else if (type === "bytes") resolve(chunksConcat(body, length));
			consumeFinish(consume);
		} catch (err) {
			stream.destroy(err);
		}
	}
	function consumePush(consume, chunk) {
		consume.length += chunk.length;
		consume.body.push(chunk);
	}
	function consumeFinish(consume, err) {
		if (consume.body === null) return;
		if (err) consume.reject(err);
		else consume.resolve();
		consume.type = null;
		consume.stream = null;
		consume.resolve = null;
		consume.reject = null;
		consume.length = 0;
		consume.body = null;
	}
	module.exports = {
		Readable: BodyReadable,
		chunksDecode
	};
}));
//#endregion
//#region node_modules/.pnpm/undici@6.28.0/node_modules/undici/lib/api/util.js
var require_util$5 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const assert$13 = __require("node:assert");
	const { ResponseStatusCodeError } = require_errors();
	const { chunksDecode } = require_readable();
	const CHUNK_LIMIT = 131072;
	async function getResolveErrorBodyCallback({ callback, body, contentType, statusCode, statusMessage, headers }) {
		assert$13(body);
		let chunks = [];
		let length = 0;
		try {
			for await (const chunk of body) {
				chunks.push(chunk);
				length += chunk.length;
				if (length > CHUNK_LIMIT) {
					chunks = [];
					length = 0;
					break;
				}
			}
		} catch {
			chunks = [];
			length = 0;
		}
		const message = `Response status code ${statusCode}${statusMessage ? `: ${statusMessage}` : ""}`;
		if (statusCode === 204 || !contentType || !length) {
			queueMicrotask(() => callback(new ResponseStatusCodeError(message, statusCode, headers)));
			return;
		}
		const stackTraceLimit = Error.stackTraceLimit;
		Error.stackTraceLimit = 0;
		let payload;
		try {
			if (isContentTypeApplicationJson(contentType)) payload = JSON.parse(chunksDecode(chunks, length));
			else if (isContentTypeText(contentType)) payload = chunksDecode(chunks, length);
		} catch {} finally {
			Error.stackTraceLimit = stackTraceLimit;
		}
		queueMicrotask(() => callback(new ResponseStatusCodeError(message, statusCode, headers, payload)));
	}
	const isContentTypeApplicationJson = (contentType) => {
		return contentType.length > 15 && contentType[11] === "/" && contentType[0] === "a" && contentType[1] === "p" && contentType[2] === "p" && contentType[3] === "l" && contentType[4] === "i" && contentType[5] === "c" && contentType[6] === "a" && contentType[7] === "t" && contentType[8] === "i" && contentType[9] === "o" && contentType[10] === "n" && contentType[12] === "j" && contentType[13] === "s" && contentType[14] === "o" && contentType[15] === "n";
	};
	const isContentTypeText = (contentType) => {
		return contentType.length > 4 && contentType[4] === "/" && contentType[0] === "t" && contentType[1] === "e" && contentType[2] === "x" && contentType[3] === "t";
	};
	module.exports = {
		getResolveErrorBodyCallback,
		isContentTypeApplicationJson,
		isContentTypeText
	};
}));
//#endregion
//#region node_modules/.pnpm/undici@6.28.0/node_modules/undici/lib/api/api-request.js
var require_api_request = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const assert$12 = __require("node:assert");
	const { Readable } = require_readable();
	const { InvalidArgumentError, RequestAbortedError } = require_errors();
	const util = require_util$7();
	const { getResolveErrorBodyCallback } = require_util$5();
	const { AsyncResource: AsyncResource$4 } = __require("node:async_hooks");
	var RequestHandler = class extends AsyncResource$4 {
		constructor(opts, callback) {
			if (!opts || typeof opts !== "object") throw new InvalidArgumentError("invalid opts");
			const { signal, method, opaque, body, onInfo, responseHeaders, throwOnError, highWaterMark } = opts;
			try {
				if (typeof callback !== "function") throw new InvalidArgumentError("invalid callback");
				if (highWaterMark && (typeof highWaterMark !== "number" || highWaterMark < 0)) throw new InvalidArgumentError("invalid highWaterMark");
				if (signal && typeof signal.on !== "function" && typeof signal.addEventListener !== "function") throw new InvalidArgumentError("signal must be an EventEmitter or EventTarget");
				if (method === "CONNECT") throw new InvalidArgumentError("invalid method");
				if (onInfo && typeof onInfo !== "function") throw new InvalidArgumentError("invalid onInfo callback");
				super("UNDICI_REQUEST");
			} catch (err) {
				if (util.isStream(body)) util.destroy(body.on("error", util.nop), err);
				throw err;
			}
			this.method = method;
			this.responseHeaders = responseHeaders || null;
			this.opaque = opaque || null;
			this.callback = callback;
			this.res = null;
			this.abort = null;
			this.body = body;
			this.trailers = {};
			this.context = null;
			this.onInfo = onInfo || null;
			this.throwOnError = throwOnError;
			this.highWaterMark = highWaterMark;
			this.signal = signal;
			this.reason = null;
			this.removeAbortListener = null;
			if (util.isStream(body)) body.on("error", (err) => {
				this.onError(err);
			});
			if (this.signal) if (this.signal.aborted) this.reason = this.signal.reason ?? new RequestAbortedError();
			else this.removeAbortListener = util.addAbortListener(this.signal, () => {
				this.reason = this.signal.reason ?? new RequestAbortedError();
				if (this.res) util.destroy(this.res.on("error", util.nop), this.reason);
				else if (this.abort) this.abort(this.reason);
				if (this.removeAbortListener) {
					this.res?.off("close", this.removeAbortListener);
					this.removeAbortListener();
					this.removeAbortListener = null;
				}
			});
		}
		onConnect(abort, context) {
			if (this.reason) {
				abort(this.reason);
				return;
			}
			assert$12(this.callback);
			this.abort = abort;
			this.context = context;
		}
		onHeaders(statusCode, rawHeaders, resume, statusMessage) {
			const { callback, opaque, abort, context, responseHeaders, highWaterMark } = this;
			const headers = responseHeaders === "raw" ? util.parseRawHeaders(rawHeaders) : util.parseHeaders(rawHeaders);
			if (statusCode < 200) {
				if (this.onInfo) this.onInfo({
					statusCode,
					headers
				});
				return;
			}
			const parsedHeaders = responseHeaders === "raw" ? util.parseHeaders(rawHeaders) : headers;
			const contentType = parsedHeaders["content-type"];
			const contentLength = parsedHeaders["content-length"];
			const res = new Readable({
				resume,
				abort,
				contentType,
				contentLength: this.method !== "HEAD" && contentLength ? Number(contentLength) : null,
				highWaterMark
			});
			if (this.removeAbortListener) res.on("close", this.removeAbortListener);
			this.callback = null;
			this.res = res;
			if (callback !== null) if (this.throwOnError && statusCode >= 400) this.runInAsyncScope(getResolveErrorBodyCallback, null, {
				callback,
				body: res,
				contentType,
				statusCode,
				statusMessage,
				headers
			});
			else this.runInAsyncScope(callback, null, null, {
				statusCode,
				headers,
				trailers: this.trailers,
				opaque,
				body: res,
				context
			});
		}
		onData(chunk) {
			return this.res.push(chunk);
		}
		onComplete(trailers) {
			util.parseHeaders(trailers, this.trailers);
			this.res.push(null);
		}
		onError(err) {
			const { res, callback, body, opaque } = this;
			if (callback) {
				this.callback = null;
				queueMicrotask(() => {
					this.runInAsyncScope(callback, null, err, { opaque });
				});
			}
			if (res) {
				this.res = null;
				queueMicrotask(() => {
					util.destroy(res, err);
				});
			}
			if (body) {
				this.body = null;
				util.destroy(body, err);
			}
			if (this.removeAbortListener) {
				res?.off("close", this.removeAbortListener);
				this.removeAbortListener();
				this.removeAbortListener = null;
			}
		}
	};
	function request(opts, callback) {
		if (callback === void 0) return new Promise((resolve, reject) => {
			request.call(this, opts, (err, data) => {
				return err ? reject(err) : resolve(data);
			});
		});
		try {
			this.dispatch(opts, new RequestHandler(opts, callback));
		} catch (err) {
			if (typeof callback !== "function") throw err;
			const opaque = opts?.opaque;
			queueMicrotask(() => callback(err, { opaque }));
		}
	}
	module.exports = request;
	module.exports.RequestHandler = RequestHandler;
}));
//#endregion
//#region node_modules/.pnpm/undici@6.28.0/node_modules/undici/lib/api/abort-signal.js
var require_abort_signal = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const { addAbortListener } = require_util$7();
	const { RequestAbortedError } = require_errors();
	const kListener = Symbol("kListener");
	const kSignal = Symbol("kSignal");
	function abort(self) {
		if (self.abort) self.abort(self[kSignal]?.reason);
		else self.reason = self[kSignal]?.reason ?? new RequestAbortedError();
		removeSignal(self);
	}
	function addSignal(self, signal) {
		self.reason = null;
		self[kSignal] = null;
		self[kListener] = null;
		if (!signal) return;
		if (signal.aborted) {
			abort(self);
			return;
		}
		self[kSignal] = signal;
		self[kListener] = () => {
			abort(self);
		};
		addAbortListener(self[kSignal], self[kListener]);
	}
	function removeSignal(self) {
		if (!self[kSignal]) return;
		if ("removeEventListener" in self[kSignal]) self[kSignal].removeEventListener("abort", self[kListener]);
		else self[kSignal].removeListener("abort", self[kListener]);
		self[kSignal] = null;
		self[kListener] = null;
	}
	module.exports = {
		addSignal,
		removeSignal
	};
}));
//#endregion
//#region node_modules/.pnpm/undici@6.28.0/node_modules/undici/lib/api/api-stream.js
var require_api_stream = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const assert$11 = __require("node:assert");
	const { finished: finished$1, PassThrough: PassThrough$1 } = __require("node:stream");
	const { InvalidArgumentError, InvalidReturnValueError } = require_errors();
	const util = require_util$7();
	const { getResolveErrorBodyCallback } = require_util$5();
	const { AsyncResource: AsyncResource$3 } = __require("node:async_hooks");
	const { addSignal, removeSignal } = require_abort_signal();
	var StreamHandler = class extends AsyncResource$3 {
		constructor(opts, factory, callback) {
			if (!opts || typeof opts !== "object") throw new InvalidArgumentError("invalid opts");
			const { signal, method, opaque, body, onInfo, responseHeaders, throwOnError } = opts;
			try {
				if (typeof callback !== "function") throw new InvalidArgumentError("invalid callback");
				if (typeof factory !== "function") throw new InvalidArgumentError("invalid factory");
				if (signal && typeof signal.on !== "function" && typeof signal.addEventListener !== "function") throw new InvalidArgumentError("signal must be an EventEmitter or EventTarget");
				if (method === "CONNECT") throw new InvalidArgumentError("invalid method");
				if (onInfo && typeof onInfo !== "function") throw new InvalidArgumentError("invalid onInfo callback");
				super("UNDICI_STREAM");
			} catch (err) {
				if (util.isStream(body)) util.destroy(body.on("error", util.nop), err);
				throw err;
			}
			this.responseHeaders = responseHeaders || null;
			this.opaque = opaque || null;
			this.factory = factory;
			this.callback = callback;
			this.res = null;
			this.abort = null;
			this.context = null;
			this.trailers = null;
			this.body = body;
			this.onInfo = onInfo || null;
			this.throwOnError = throwOnError || false;
			if (util.isStream(body)) body.on("error", (err) => {
				this.onError(err);
			});
			addSignal(this, signal);
		}
		onConnect(abort, context) {
			if (this.reason) {
				abort(this.reason);
				return;
			}
			assert$11(this.callback);
			this.abort = abort;
			this.context = context;
		}
		onHeaders(statusCode, rawHeaders, resume, statusMessage) {
			const { factory, opaque, context, callback, responseHeaders } = this;
			const headers = responseHeaders === "raw" ? util.parseRawHeaders(rawHeaders) : util.parseHeaders(rawHeaders);
			if (statusCode < 200) {
				if (this.onInfo) this.onInfo({
					statusCode,
					headers
				});
				return;
			}
			this.factory = null;
			let res;
			if (this.throwOnError && statusCode >= 400) {
				const contentType = (responseHeaders === "raw" ? util.parseHeaders(rawHeaders) : headers)["content-type"];
				res = new PassThrough$1();
				this.callback = null;
				this.runInAsyncScope(getResolveErrorBodyCallback, null, {
					callback,
					body: res,
					contentType,
					statusCode,
					statusMessage,
					headers
				});
			} else {
				if (factory === null) return;
				res = this.runInAsyncScope(factory, null, {
					statusCode,
					headers,
					opaque,
					context
				});
				if (!res || typeof res.write !== "function" || typeof res.end !== "function" || typeof res.on !== "function") throw new InvalidReturnValueError("expected Writable");
				finished$1(res, { readable: false }, (err) => {
					const { callback, res, opaque, trailers, abort } = this;
					this.res = null;
					if (err || !res.readable) util.destroy(res, err);
					this.callback = null;
					this.runInAsyncScope(callback, null, err || null, {
						opaque,
						trailers
					});
					if (err) abort();
				});
			}
			res.on("drain", resume);
			this.res = res;
			return (res.writableNeedDrain !== void 0 ? res.writableNeedDrain : res._writableState?.needDrain) !== true;
		}
		onData(chunk) {
			const { res } = this;
			return res ? res.write(chunk) : true;
		}
		onComplete(trailers) {
			const { res } = this;
			removeSignal(this);
			if (!res) return;
			this.trailers = util.parseHeaders(trailers);
			res.end();
		}
		onError(err) {
			const { res, callback, opaque, body } = this;
			removeSignal(this);
			this.factory = null;
			if (res) {
				this.res = null;
				util.destroy(res, err);
			} else if (callback) {
				this.callback = null;
				queueMicrotask(() => {
					this.runInAsyncScope(callback, null, err, { opaque });
				});
			}
			if (body) {
				this.body = null;
				util.destroy(body, err);
			}
		}
	};
	function stream(opts, factory, callback) {
		if (callback === void 0) return new Promise((resolve, reject) => {
			stream.call(this, opts, factory, (err, data) => {
				return err ? reject(err) : resolve(data);
			});
		});
		try {
			this.dispatch(opts, new StreamHandler(opts, factory, callback));
		} catch (err) {
			if (typeof callback !== "function") throw err;
			const opaque = opts?.opaque;
			queueMicrotask(() => callback(err, { opaque }));
		}
	}
	module.exports = stream;
}));
//#endregion
//#region node_modules/.pnpm/undici@6.28.0/node_modules/undici/lib/api/api-pipeline.js
var require_api_pipeline = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const { Readable: Readable$1, Duplex, PassThrough } = __require("node:stream");
	const { InvalidArgumentError, InvalidReturnValueError, RequestAbortedError } = require_errors();
	const util = require_util$7();
	const { AsyncResource: AsyncResource$2 } = __require("node:async_hooks");
	const { addSignal, removeSignal } = require_abort_signal();
	const assert$10 = __require("node:assert");
	const kResume = Symbol("resume");
	var PipelineRequest = class extends Readable$1 {
		constructor() {
			super({ autoDestroy: true });
			this[kResume] = null;
		}
		_read() {
			const { [kResume]: resume } = this;
			if (resume) {
				this[kResume] = null;
				resume();
			}
		}
		_destroy(err, callback) {
			this._read();
			callback(err);
		}
	};
	var PipelineResponse = class extends Readable$1 {
		constructor(resume) {
			super({ autoDestroy: true });
			this[kResume] = resume;
		}
		_read() {
			this[kResume]();
		}
		_destroy(err, callback) {
			if (!err && !this._readableState.endEmitted) err = new RequestAbortedError();
			callback(err);
		}
	};
	var PipelineHandler = class extends AsyncResource$2 {
		constructor(opts, handler) {
			if (!opts || typeof opts !== "object") throw new InvalidArgumentError("invalid opts");
			if (typeof handler !== "function") throw new InvalidArgumentError("invalid handler");
			const { signal, method, opaque, onInfo, responseHeaders } = opts;
			if (signal && typeof signal.on !== "function" && typeof signal.addEventListener !== "function") throw new InvalidArgumentError("signal must be an EventEmitter or EventTarget");
			if (method === "CONNECT") throw new InvalidArgumentError("invalid method");
			if (onInfo && typeof onInfo !== "function") throw new InvalidArgumentError("invalid onInfo callback");
			super("UNDICI_PIPELINE");
			this.opaque = opaque || null;
			this.responseHeaders = responseHeaders || null;
			this.handler = handler;
			this.abort = null;
			this.context = null;
			this.onInfo = onInfo || null;
			this.req = new PipelineRequest().on("error", util.nop);
			this.ret = new Duplex({
				readableObjectMode: opts.objectMode,
				autoDestroy: true,
				read: () => {
					const { body } = this;
					if (body?.resume) body.resume();
				},
				write: (chunk, encoding, callback) => {
					const { req } = this;
					if (req.push(chunk, encoding) || req._readableState.destroyed) callback();
					else req[kResume] = callback;
				},
				destroy: (err, callback) => {
					const { body, req, res, ret, abort } = this;
					if (!err && !ret._readableState.endEmitted) err = new RequestAbortedError();
					if (abort && err) abort();
					util.destroy(body, err);
					util.destroy(req, err);
					util.destroy(res, err);
					removeSignal(this);
					callback(err);
				}
			}).on("prefinish", () => {
				const { req } = this;
				req.push(null);
			});
			this.res = null;
			addSignal(this, signal);
		}
		onConnect(abort, context) {
			const { ret, res } = this;
			if (this.reason) {
				abort(this.reason);
				return;
			}
			assert$10(!res, "pipeline cannot be retried");
			assert$10(!ret.destroyed);
			this.abort = abort;
			this.context = context;
		}
		onHeaders(statusCode, rawHeaders, resume) {
			const { opaque, handler, context } = this;
			if (statusCode < 200) {
				if (this.onInfo) {
					const headers = this.responseHeaders === "raw" ? util.parseRawHeaders(rawHeaders) : util.parseHeaders(rawHeaders);
					this.onInfo({
						statusCode,
						headers
					});
				}
				return;
			}
			this.res = new PipelineResponse(resume);
			let body;
			try {
				this.handler = null;
				const headers = this.responseHeaders === "raw" ? util.parseRawHeaders(rawHeaders) : util.parseHeaders(rawHeaders);
				body = this.runInAsyncScope(handler, null, {
					statusCode,
					headers,
					opaque,
					body: this.res,
					context
				});
			} catch (err) {
				this.res.on("error", util.nop);
				throw err;
			}
			if (!body || typeof body.on !== "function") throw new InvalidReturnValueError("expected Readable");
			body.on("data", (chunk) => {
				const { ret, body } = this;
				if (!ret.push(chunk) && body.pause) body.pause();
			}).on("error", (err) => {
				const { ret } = this;
				util.destroy(ret, err);
			}).on("end", () => {
				const { ret } = this;
				ret.push(null);
			}).on("close", () => {
				const { ret } = this;
				if (!ret._readableState.ended) util.destroy(ret, new RequestAbortedError());
			});
			this.body = body;
		}
		onData(chunk) {
			const { res } = this;
			return res.push(chunk);
		}
		onComplete(trailers) {
			const { res } = this;
			res.push(null);
		}
		onError(err) {
			const { ret } = this;
			this.handler = null;
			util.destroy(ret, err);
		}
	};
	function pipeline(opts, handler) {
		try {
			const pipelineHandler = new PipelineHandler(opts, handler);
			this.dispatch({
				...opts,
				body: pipelineHandler.req
			}, pipelineHandler);
			return pipelineHandler.ret;
		} catch (err) {
			return new PassThrough().destroy(err);
		}
	}
	module.exports = pipeline;
}));
//#endregion
//#region node_modules/.pnpm/undici@6.28.0/node_modules/undici/lib/api/api-upgrade.js
var require_api_upgrade = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const { InvalidArgumentError, SocketError } = require_errors();
	const { AsyncResource: AsyncResource$1 } = __require("node:async_hooks");
	const util = require_util$7();
	const { addSignal, removeSignal } = require_abort_signal();
	const assert$9 = __require("node:assert");
	var UpgradeHandler = class extends AsyncResource$1 {
		constructor(opts, callback) {
			if (!opts || typeof opts !== "object") throw new InvalidArgumentError("invalid opts");
			if (typeof callback !== "function") throw new InvalidArgumentError("invalid callback");
			const { signal, opaque, responseHeaders } = opts;
			if (signal && typeof signal.on !== "function" && typeof signal.addEventListener !== "function") throw new InvalidArgumentError("signal must be an EventEmitter or EventTarget");
			super("UNDICI_UPGRADE");
			this.responseHeaders = responseHeaders || null;
			this.opaque = opaque || null;
			this.callback = callback;
			this.abort = null;
			this.context = null;
			addSignal(this, signal);
		}
		onConnect(abort, context) {
			if (this.reason) {
				abort(this.reason);
				return;
			}
			assert$9(this.callback);
			this.abort = abort;
			this.context = null;
		}
		onHeaders() {
			throw new SocketError("bad upgrade", null);
		}
		onUpgrade(statusCode, rawHeaders, socket) {
			assert$9(statusCode === 101);
			const { callback, opaque, context } = this;
			removeSignal(this);
			this.callback = null;
			const headers = this.responseHeaders === "raw" ? util.parseRawHeaders(rawHeaders) : util.parseHeaders(rawHeaders);
			this.runInAsyncScope(callback, null, null, {
				headers,
				socket,
				opaque,
				context
			});
		}
		onError(err) {
			const { callback, opaque } = this;
			removeSignal(this);
			if (callback) {
				this.callback = null;
				queueMicrotask(() => {
					this.runInAsyncScope(callback, null, err, { opaque });
				});
			}
		}
	};
	function upgrade(opts, callback) {
		if (callback === void 0) return new Promise((resolve, reject) => {
			upgrade.call(this, opts, (err, data) => {
				return err ? reject(err) : resolve(data);
			});
		});
		try {
			const upgradeHandler = new UpgradeHandler(opts, callback);
			this.dispatch({
				...opts,
				method: opts.method || "GET",
				upgrade: opts.protocol || "Websocket"
			}, upgradeHandler);
		} catch (err) {
			if (typeof callback !== "function") throw err;
			const opaque = opts?.opaque;
			queueMicrotask(() => callback(err, { opaque }));
		}
	}
	module.exports = upgrade;
}));
//#endregion
//#region node_modules/.pnpm/undici@6.28.0/node_modules/undici/lib/api/api-connect.js
var require_api_connect = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const assert$8 = __require("node:assert");
	const { AsyncResource } = __require("node:async_hooks");
	const { InvalidArgumentError, SocketError } = require_errors();
	const util = require_util$7();
	const { addSignal, removeSignal } = require_abort_signal();
	var ConnectHandler = class extends AsyncResource {
		constructor(opts, callback) {
			if (!opts || typeof opts !== "object") throw new InvalidArgumentError("invalid opts");
			if (typeof callback !== "function") throw new InvalidArgumentError("invalid callback");
			const { signal, opaque, responseHeaders } = opts;
			if (signal && typeof signal.on !== "function" && typeof signal.addEventListener !== "function") throw new InvalidArgumentError("signal must be an EventEmitter or EventTarget");
			super("UNDICI_CONNECT");
			this.opaque = opaque || null;
			this.responseHeaders = responseHeaders || null;
			this.callback = callback;
			this.abort = null;
			addSignal(this, signal);
		}
		onConnect(abort, context) {
			if (this.reason) {
				abort(this.reason);
				return;
			}
			assert$8(this.callback);
			this.abort = abort;
			this.context = context;
		}
		onHeaders() {
			throw new SocketError("bad connect", null);
		}
		onUpgrade(statusCode, rawHeaders, socket) {
			const { callback, opaque, context } = this;
			removeSignal(this);
			this.callback = null;
			let headers = rawHeaders;
			if (headers != null) headers = this.responseHeaders === "raw" ? util.parseRawHeaders(rawHeaders) : util.parseHeaders(rawHeaders);
			this.runInAsyncScope(callback, null, null, {
				statusCode,
				headers,
				socket,
				opaque,
				context
			});
		}
		onError(err) {
			const { callback, opaque } = this;
			removeSignal(this);
			if (callback) {
				this.callback = null;
				queueMicrotask(() => {
					this.runInAsyncScope(callback, null, err, { opaque });
				});
			}
		}
	};
	function connect(opts, callback) {
		if (callback === void 0) return new Promise((resolve, reject) => {
			connect.call(this, opts, (err, data) => {
				return err ? reject(err) : resolve(data);
			});
		});
		try {
			const connectHandler = new ConnectHandler(opts, callback);
			this.dispatch({
				...opts,
				method: "CONNECT"
			}, connectHandler);
		} catch (err) {
			if (typeof callback !== "function") throw err;
			const opaque = opts?.opaque;
			queueMicrotask(() => callback(err, { opaque }));
		}
	}
	module.exports = connect;
}));
//#endregion
//#region node_modules/.pnpm/undici@6.28.0/node_modules/undici/lib/api/index.js
var require_api = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports.request = require_api_request();
	module.exports.stream = require_api_stream();
	module.exports.pipeline = require_api_pipeline();
	module.exports.upgrade = require_api_upgrade();
	module.exports.connect = require_api_connect();
}));
//#endregion
//#region node_modules/.pnpm/undici@6.28.0/node_modules/undici/lib/mock/mock-errors.js
var require_mock_errors = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const { UndiciError } = require_errors();
	const kMockNotMatchedError = Symbol.for("undici.error.UND_MOCK_ERR_MOCK_NOT_MATCHED");
	module.exports = { MockNotMatchedError: class MockNotMatchedError extends UndiciError {
		constructor(message) {
			super(message);
			Error.captureStackTrace(this, MockNotMatchedError);
			this.name = "MockNotMatchedError";
			this.message = message || "The request does not match any registered mock dispatches";
			this.code = "UND_MOCK_ERR_MOCK_NOT_MATCHED";
		}
		static [Symbol.hasInstance](instance) {
			return instance && instance[kMockNotMatchedError] === true;
		}
		[kMockNotMatchedError] = true;
	} };
}));
//#endregion
//#region node_modules/.pnpm/undici@6.28.0/node_modules/undici/lib/mock/mock-symbols.js
var require_mock_symbols = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = {
		kAgent: Symbol("agent"),
		kOptions: Symbol("options"),
		kFactory: Symbol("factory"),
		kDispatches: Symbol("dispatches"),
		kDispatchKey: Symbol("dispatch key"),
		kDefaultHeaders: Symbol("default headers"),
		kDefaultTrailers: Symbol("default trailers"),
		kContentLength: Symbol("content length"),
		kMockAgent: Symbol("mock agent"),
		kMockAgentSet: Symbol("mock agent set"),
		kMockAgentGet: Symbol("mock agent get"),
		kMockDispatch: Symbol("mock dispatch"),
		kClose: Symbol("close"),
		kOriginalClose: Symbol("original agent close"),
		kOrigin: Symbol("origin"),
		kIsMockActive: Symbol("is mock active"),
		kNetConnect: Symbol("net connect"),
		kGetNetConnect: Symbol("get net connect"),
		kConnected: Symbol("connected")
	};
}));
//#endregion
//#region node_modules/.pnpm/undici@6.28.0/node_modules/undici/lib/mock/mock-utils.js
var require_mock_utils = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const { MockNotMatchedError } = require_mock_errors();
	const { kDispatches, kMockAgent, kOriginalDispatch, kOrigin, kGetNetConnect } = require_mock_symbols();
	const { buildURL } = require_util$7();
	const { STATUS_CODES: STATUS_CODES$1 } = __require("node:http");
	const { types: { isPromise } } = __require("node:util");
	function matchValue(match, value) {
		if (typeof match === "string") return match === value;
		if (match instanceof RegExp) return match.test(value);
		if (typeof match === "function") return match(value) === true;
		return false;
	}
	function lowerCaseEntries(headers) {
		return Object.fromEntries(Object.entries(headers).map(([headerName, headerValue]) => {
			return [headerName.toLocaleLowerCase(), headerValue];
		}));
	}
	/**
	* @param {import('../../index').Headers|string[]|Record<string, string>} headers
	* @param {string} key
	*/
	function getHeaderByName(headers, key) {
		if (Array.isArray(headers)) {
			for (let i = 0; i < headers.length; i += 2) if (headers[i].toLocaleLowerCase() === key.toLocaleLowerCase()) return headers[i + 1];
			return;
		} else if (typeof headers.get === "function") return headers.get(key);
		else return lowerCaseEntries(headers)[key.toLocaleLowerCase()];
	}
	/** @param {string[]} headers */
	function buildHeadersFromArray(headers) {
		const clone = headers.slice();
		const entries = [];
		for (let index = 0; index < clone.length; index += 2) entries.push([clone[index], clone[index + 1]]);
		return Object.fromEntries(entries);
	}
	function matchHeaders(mockDispatch, headers) {
		if (typeof mockDispatch.headers === "function") {
			if (Array.isArray(headers)) headers = buildHeadersFromArray(headers);
			return mockDispatch.headers(headers ? lowerCaseEntries(headers) : {});
		}
		if (typeof mockDispatch.headers === "undefined") return true;
		if (typeof headers !== "object" || typeof mockDispatch.headers !== "object") return false;
		for (const [matchHeaderName, matchHeaderValue] of Object.entries(mockDispatch.headers)) if (!matchValue(matchHeaderValue, getHeaderByName(headers, matchHeaderName))) return false;
		return true;
	}
	function safeUrl(path) {
		if (typeof path !== "string") return path;
		const pathSegments = path.split("?");
		if (pathSegments.length !== 2) return path;
		const qp = new URLSearchParams(pathSegments.pop());
		qp.sort();
		return [...pathSegments, qp.toString()].join("?");
	}
	function matchKey(mockDispatch, { path, method, body, headers }) {
		const pathMatch = matchValue(mockDispatch.path, path);
		const methodMatch = matchValue(mockDispatch.method, method);
		const bodyMatch = typeof mockDispatch.body !== "undefined" ? matchValue(mockDispatch.body, body) : true;
		const headersMatch = matchHeaders(mockDispatch, headers);
		return pathMatch && methodMatch && bodyMatch && headersMatch;
	}
	function getResponseData(data) {
		if (Buffer.isBuffer(data)) return data;
		else if (data instanceof Uint8Array) return data;
		else if (data instanceof ArrayBuffer) return data;
		else if (typeof data === "object") return JSON.stringify(data);
		else return data.toString();
	}
	function getMockDispatch(mockDispatches, key) {
		const basePath = key.query ? buildURL(key.path, key.query) : key.path;
		const resolvedPath = typeof basePath === "string" ? safeUrl(basePath) : basePath;
		let matchedMockDispatches = mockDispatches.filter(({ consumed }) => !consumed).filter(({ path }) => matchValue(safeUrl(path), resolvedPath));
		if (matchedMockDispatches.length === 0) throw new MockNotMatchedError(`Mock dispatch not matched for path '${resolvedPath}'`);
		matchedMockDispatches = matchedMockDispatches.filter(({ method }) => matchValue(method, key.method));
		if (matchedMockDispatches.length === 0) throw new MockNotMatchedError(`Mock dispatch not matched for method '${key.method}' on path '${resolvedPath}'`);
		matchedMockDispatches = matchedMockDispatches.filter(({ body }) => typeof body !== "undefined" ? matchValue(body, key.body) : true);
		if (matchedMockDispatches.length === 0) throw new MockNotMatchedError(`Mock dispatch not matched for body '${key.body}' on path '${resolvedPath}'`);
		matchedMockDispatches = matchedMockDispatches.filter((mockDispatch) => matchHeaders(mockDispatch, key.headers));
		if (matchedMockDispatches.length === 0) {
			const headers = typeof key.headers === "object" ? JSON.stringify(key.headers) : key.headers;
			throw new MockNotMatchedError(`Mock dispatch not matched for headers '${headers}' on path '${resolvedPath}'`);
		}
		return matchedMockDispatches[0];
	}
	function addMockDispatch(mockDispatches, key, data) {
		const baseData = {
			timesInvoked: 0,
			times: 1,
			persist: false,
			consumed: false
		};
		const replyData = typeof data === "function" ? { callback: data } : { ...data };
		const newMockDispatch = {
			...baseData,
			...key,
			pending: true,
			data: {
				error: null,
				...replyData
			}
		};
		mockDispatches.push(newMockDispatch);
		return newMockDispatch;
	}
	function deleteMockDispatch(mockDispatches, key) {
		const index = mockDispatches.findIndex((dispatch) => {
			if (!dispatch.consumed) return false;
			return matchKey(dispatch, key);
		});
		if (index !== -1) mockDispatches.splice(index, 1);
	}
	function buildKey(opts) {
		const { path, method, body, headers, query } = opts;
		return {
			path,
			method,
			body,
			headers,
			query
		};
	}
	function generateKeyValues(data) {
		const keys = Object.keys(data);
		const result = [];
		for (let i = 0; i < keys.length; ++i) {
			const key = keys[i];
			const value = data[key];
			const name = Buffer.from(`${key}`);
			if (Array.isArray(value)) for (let j = 0; j < value.length; ++j) result.push(name, Buffer.from(`${value[j]}`));
			else result.push(name, Buffer.from(`${value}`));
		}
		return result;
	}
	/**
	* @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Status
	* @param {number} statusCode
	*/
	function getStatusText(statusCode) {
		return STATUS_CODES$1[statusCode] || "unknown";
	}
	async function getResponse(body) {
		const buffers = [];
		for await (const data of body) buffers.push(data);
		return Buffer.concat(buffers).toString("utf8");
	}
	/**
	* Mock dispatch function used to simulate undici dispatches
	*/
	function mockDispatch(opts, handler) {
		const key = buildKey(opts);
		const mockDispatch = getMockDispatch(this[kDispatches], key);
		mockDispatch.timesInvoked++;
		if (mockDispatch.data.callback) mockDispatch.data = {
			...mockDispatch.data,
			...mockDispatch.data.callback(opts)
		};
		const { data: { statusCode, data, headers, trailers, error }, delay, persist } = mockDispatch;
		const { timesInvoked, times } = mockDispatch;
		mockDispatch.consumed = !persist && timesInvoked >= times;
		mockDispatch.pending = timesInvoked < times;
		if (error !== null) {
			deleteMockDispatch(this[kDispatches], key);
			handler.onError(error);
			return true;
		}
		if (typeof delay === "number" && delay > 0) setTimeout(() => {
			handleReply(this[kDispatches]);
		}, delay);
		else handleReply(this[kDispatches]);
		function handleReply(mockDispatches, _data = data) {
			const optsHeaders = Array.isArray(opts.headers) ? buildHeadersFromArray(opts.headers) : opts.headers;
			const body = typeof _data === "function" ? _data({
				...opts,
				headers: optsHeaders
			}) : _data;
			if (isPromise(body)) {
				body.then((newData) => handleReply(mockDispatches, newData));
				return;
			}
			const responseData = getResponseData(body);
			const responseHeaders = generateKeyValues(headers);
			const responseTrailers = generateKeyValues(trailers);
			handler.onConnect?.((err) => handler.onError(err), null);
			handler.onHeaders?.(statusCode, responseHeaders, resume, getStatusText(statusCode));
			handler.onData?.(Buffer.from(responseData));
			handler.onComplete?.(responseTrailers);
			deleteMockDispatch(mockDispatches, key);
		}
		function resume() {}
		return true;
	}
	function buildMockDispatch() {
		const agent = this[kMockAgent];
		const origin = this[kOrigin];
		const originalDispatch = this[kOriginalDispatch];
		return function dispatch(opts, handler) {
			if (agent.isMockActive) try {
				mockDispatch.call(this, opts, handler);
			} catch (error) {
				if (error instanceof MockNotMatchedError) {
					const netConnect = agent[kGetNetConnect]();
					if (netConnect === false) throw new MockNotMatchedError(`${error.message}: subsequent request to origin ${origin} was not allowed (net.connect disabled)`);
					if (checkNetConnect(netConnect, origin)) originalDispatch.call(this, opts, handler);
					else throw new MockNotMatchedError(`${error.message}: subsequent request to origin ${origin} was not allowed (net.connect is not enabled for this origin)`);
				} else throw error;
			}
			else originalDispatch.call(this, opts, handler);
		};
	}
	function checkNetConnect(netConnect, origin) {
		const url = new URL(origin);
		if (netConnect === true) return true;
		else if (Array.isArray(netConnect) && netConnect.some((matcher) => matchValue(matcher, url.host))) return true;
		return false;
	}
	function buildMockOptions(opts) {
		if (opts) {
			const { agent, ...mockOptions } = opts;
			return mockOptions;
		}
	}
	module.exports = {
		getResponseData,
		getMockDispatch,
		addMockDispatch,
		deleteMockDispatch,
		buildKey,
		generateKeyValues,
		matchValue,
		getResponse,
		getStatusText,
		mockDispatch,
		buildMockDispatch,
		checkNetConnect,
		buildMockOptions,
		getHeaderByName,
		buildHeadersFromArray
	};
}));
//#endregion
//#region node_modules/.pnpm/undici@6.28.0/node_modules/undici/lib/mock/mock-interceptor.js
var require_mock_interceptor = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const { getResponseData, buildKey, addMockDispatch } = require_mock_utils();
	const { kDispatches, kDispatchKey, kDefaultHeaders, kDefaultTrailers, kContentLength, kMockDispatch } = require_mock_symbols();
	const { InvalidArgumentError } = require_errors();
	const { buildURL } = require_util$7();
	/**
	* Defines the scope API for an interceptor reply
	*/
	var MockScope = class {
		constructor(mockDispatch) {
			this[kMockDispatch] = mockDispatch;
		}
		/**
		* Delay a reply by a set amount in ms.
		*/
		delay(waitInMs) {
			if (typeof waitInMs !== "number" || !Number.isInteger(waitInMs) || waitInMs <= 0) throw new InvalidArgumentError("waitInMs must be a valid integer > 0");
			this[kMockDispatch].delay = waitInMs;
			return this;
		}
		/**
		* For a defined reply, never mark as consumed.
		*/
		persist() {
			this[kMockDispatch].persist = true;
			return this;
		}
		/**
		* Allow one to define a reply for a set amount of matching requests.
		*/
		times(repeatTimes) {
			if (typeof repeatTimes !== "number" || !Number.isInteger(repeatTimes) || repeatTimes <= 0) throw new InvalidArgumentError("repeatTimes must be a valid integer > 0");
			this[kMockDispatch].times = repeatTimes;
			return this;
		}
	};
	/**
	* Defines an interceptor for a Mock
	*/
	var MockInterceptor = class {
		constructor(opts, mockDispatches) {
			if (typeof opts !== "object") throw new InvalidArgumentError("opts must be an object");
			if (typeof opts.path === "undefined") throw new InvalidArgumentError("opts.path must be defined");
			if (typeof opts.method === "undefined") opts.method = "GET";
			if (typeof opts.path === "string") if (opts.query) opts.path = buildURL(opts.path, opts.query);
			else {
				const parsedURL = new URL(opts.path, "data://");
				opts.path = parsedURL.pathname + parsedURL.search;
			}
			if (typeof opts.method === "string") opts.method = opts.method.toUpperCase();
			this[kDispatchKey] = buildKey(opts);
			this[kDispatches] = mockDispatches;
			this[kDefaultHeaders] = {};
			this[kDefaultTrailers] = {};
			this[kContentLength] = false;
		}
		createMockScopeDispatchData({ statusCode, data, responseOptions }) {
			const responseData = getResponseData(data);
			const contentLength = this[kContentLength] ? { "content-length": responseData.length } : {};
			return {
				statusCode,
				data,
				headers: {
					...this[kDefaultHeaders],
					...contentLength,
					...responseOptions.headers
				},
				trailers: {
					...this[kDefaultTrailers],
					...responseOptions.trailers
				}
			};
		}
		validateReplyParameters(replyParameters) {
			if (typeof replyParameters.statusCode === "undefined") throw new InvalidArgumentError("statusCode must be defined");
			if (typeof replyParameters.responseOptions !== "object" || replyParameters.responseOptions === null) throw new InvalidArgumentError("responseOptions must be an object");
		}
		/**
		* Mock an undici request with a defined reply.
		*/
		reply(replyOptionsCallbackOrStatusCode) {
			if (typeof replyOptionsCallbackOrStatusCode === "function") {
				const wrappedDefaultsCallback = (opts) => {
					const resolvedData = replyOptionsCallbackOrStatusCode(opts);
					if (typeof resolvedData !== "object" || resolvedData === null) throw new InvalidArgumentError("reply options callback must return an object");
					const replyParameters = {
						data: "",
						responseOptions: {},
						...resolvedData
					};
					this.validateReplyParameters(replyParameters);
					return { ...this.createMockScopeDispatchData(replyParameters) };
				};
				return new MockScope(addMockDispatch(this[kDispatches], this[kDispatchKey], wrappedDefaultsCallback));
			}
			const replyParameters = {
				statusCode: replyOptionsCallbackOrStatusCode,
				data: arguments[1] === void 0 ? "" : arguments[1],
				responseOptions: arguments[2] === void 0 ? {} : arguments[2]
			};
			this.validateReplyParameters(replyParameters);
			const dispatchData = this.createMockScopeDispatchData(replyParameters);
			return new MockScope(addMockDispatch(this[kDispatches], this[kDispatchKey], dispatchData));
		}
		/**
		* Mock an undici request with a defined error.
		*/
		replyWithError(error) {
			if (typeof error === "undefined") throw new InvalidArgumentError("error must be defined");
			return new MockScope(addMockDispatch(this[kDispatches], this[kDispatchKey], { error }));
		}
		/**
		* Set default reply headers on the interceptor for subsequent replies
		*/
		defaultReplyHeaders(headers) {
			if (typeof headers === "undefined") throw new InvalidArgumentError("headers must be defined");
			this[kDefaultHeaders] = headers;
			return this;
		}
		/**
		* Set default reply trailers on the interceptor for subsequent replies
		*/
		defaultReplyTrailers(trailers) {
			if (typeof trailers === "undefined") throw new InvalidArgumentError("trailers must be defined");
			this[kDefaultTrailers] = trailers;
			return this;
		}
		/**
		* Set reply content length header for replies on the interceptor
		*/
		replyContentLength() {
			this[kContentLength] = true;
			return this;
		}
	};
	module.exports.MockInterceptor = MockInterceptor;
	module.exports.MockScope = MockScope;
}));
//#endregion
//#region node_modules/.pnpm/undici@6.28.0/node_modules/undici/lib/mock/mock-client.js
var require_mock_client = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const { promisify: promisify$1 } = __require("node:util");
	const Client = require_client();
	const { buildMockDispatch } = require_mock_utils();
	const { kDispatches, kMockAgent, kClose, kOriginalClose, kOrigin, kOriginalDispatch, kConnected } = require_mock_symbols();
	const { MockInterceptor } = require_mock_interceptor();
	const Symbols = require_symbols$4();
	const { InvalidArgumentError } = require_errors();
	/**
	* MockClient provides an API that extends the Client to influence the mockDispatches.
	*/
	var MockClient = class extends Client {
		constructor(origin, opts) {
			super(origin, opts);
			if (!opts || !opts.agent || typeof opts.agent.dispatch !== "function") throw new InvalidArgumentError("Argument opts.agent must implement Agent");
			this[kMockAgent] = opts.agent;
			this[kOrigin] = origin;
			this[kDispatches] = [];
			this[kConnected] = 1;
			this[kOriginalDispatch] = this.dispatch;
			this[kOriginalClose] = this.close.bind(this);
			this.dispatch = buildMockDispatch.call(this);
			this.close = this[kClose];
		}
		get [Symbols.kConnected]() {
			return this[kConnected];
		}
		/**
		* Sets up the base interceptor for mocking replies from undici.
		*/
		intercept(opts) {
			return new MockInterceptor(opts, this[kDispatches]);
		}
		async [kClose]() {
			await promisify$1(this[kOriginalClose])();
			this[kConnected] = 0;
			this[kMockAgent][Symbols.kClients].delete(this[kOrigin]);
		}
	};
	module.exports = MockClient;
}));
//#endregion
//#region node_modules/.pnpm/undici@6.28.0/node_modules/undici/lib/mock/mock-pool.js
var require_mock_pool = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const { promisify } = __require("node:util");
	const Pool = require_pool();
	const { buildMockDispatch } = require_mock_utils();
	const { kDispatches, kMockAgent, kClose, kOriginalClose, kOrigin, kOriginalDispatch, kConnected } = require_mock_symbols();
	const { MockInterceptor } = require_mock_interceptor();
	const Symbols = require_symbols$4();
	const { InvalidArgumentError } = require_errors();
	/**
	* MockPool provides an API that extends the Pool to influence the mockDispatches.
	*/
	var MockPool = class extends Pool {
		constructor(origin, opts) {
			super(origin, opts);
			if (!opts || !opts.agent || typeof opts.agent.dispatch !== "function") throw new InvalidArgumentError("Argument opts.agent must implement Agent");
			this[kMockAgent] = opts.agent;
			this[kOrigin] = origin;
			this[kDispatches] = [];
			this[kConnected] = 1;
			this[kOriginalDispatch] = this.dispatch;
			this[kOriginalClose] = this.close.bind(this);
			this.dispatch = buildMockDispatch.call(this);
			this.close = this[kClose];
		}
		get [Symbols.kConnected]() {
			return this[kConnected];
		}
		/**
		* Sets up the base interceptor for mocking replies from undici.
		*/
		intercept(opts) {
			return new MockInterceptor(opts, this[kDispatches]);
		}
		async [kClose]() {
			await promisify(this[kOriginalClose])();
			this[kConnected] = 0;
			this[kMockAgent][Symbols.kClients].delete(this[kOrigin]);
		}
	};
	module.exports = MockPool;
}));
//#endregion
//#region node_modules/.pnpm/undici@6.28.0/node_modules/undici/lib/mock/pluralizer.js
var require_pluralizer = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const singulars = {
		pronoun: "it",
		is: "is",
		was: "was",
		this: "this"
	};
	const plurals = {
		pronoun: "they",
		is: "are",
		was: "were",
		this: "these"
	};
	module.exports = class Pluralizer {
		constructor(singular, plural) {
			this.singular = singular;
			this.plural = plural;
		}
		pluralize(count) {
			const one = count === 1;
			const keys = one ? singulars : plurals;
			const noun = one ? this.singular : this.plural;
			return {
				...keys,
				count,
				noun
			};
		}
	};
}));
//#endregion
//#region node_modules/.pnpm/undici@6.28.0/node_modules/undici/lib/mock/pending-interceptors-formatter.js
var require_pending_interceptors_formatter = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const { Transform: Transform$1 } = __require("node:stream");
	const { Console } = __require("node:console");
	const PERSISTENT = process.versions.icu ? "✅" : "Y ";
	const NOT_PERSISTENT = process.versions.icu ? "❌" : "N ";
	/**
	* Gets the output of `console.table(…)` as a string.
	*/
	module.exports = class PendingInterceptorsFormatter {
		constructor({ disableColors } = {}) {
			this.transform = new Transform$1({ transform(chunk, _enc, cb) {
				cb(null, chunk);
			} });
			this.logger = new Console({
				stdout: this.transform,
				inspectOptions: { colors: !disableColors && !process.env.CI }
			});
		}
		format(pendingInterceptors) {
			const withPrettyHeaders = pendingInterceptors.map(({ method, path, data: { statusCode }, persist, times, timesInvoked, origin }) => ({
				Method: method,
				Origin: origin,
				Path: path,
				"Status code": statusCode,
				Persistent: persist ? PERSISTENT : NOT_PERSISTENT,
				Invocations: timesInvoked,
				Remaining: persist ? Infinity : times - timesInvoked
			}));
			this.logger.table(withPrettyHeaders);
			return this.transform.read().toString();
		}
	};
}));
//#endregion
//#region node_modules/.pnpm/undici@6.28.0/node_modules/undici/lib/mock/mock-agent.js
var require_mock_agent = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const { kClients } = require_symbols$4();
	const Agent = require_agent();
	const { kAgent, kMockAgentSet, kMockAgentGet, kDispatches, kIsMockActive, kNetConnect, kGetNetConnect, kOptions, kFactory } = require_mock_symbols();
	const MockClient = require_mock_client();
	const MockPool = require_mock_pool();
	const { matchValue, buildMockOptions } = require_mock_utils();
	const { InvalidArgumentError, UndiciError } = require_errors();
	const Dispatcher = require_dispatcher();
	const Pluralizer = require_pluralizer();
	const PendingInterceptorsFormatter = require_pending_interceptors_formatter();
	var MockAgent = class extends Dispatcher {
		constructor(opts) {
			super(opts);
			this[kNetConnect] = true;
			this[kIsMockActive] = true;
			if (opts?.agent && typeof opts.agent.dispatch !== "function") throw new InvalidArgumentError("Argument opts.agent must implement Agent");
			const agent = opts?.agent ? opts.agent : new Agent(opts);
			this[kAgent] = agent;
			this[kClients] = agent[kClients];
			this[kOptions] = buildMockOptions(opts);
		}
		get(origin) {
			let dispatcher = this[kMockAgentGet](origin);
			if (!dispatcher) {
				dispatcher = this[kFactory](origin);
				this[kMockAgentSet](origin, dispatcher);
			}
			return dispatcher;
		}
		dispatch(opts, handler) {
			this.get(opts.origin);
			return this[kAgent].dispatch(opts, handler);
		}
		async close() {
			await this[kAgent].close();
			this[kClients].clear();
		}
		deactivate() {
			this[kIsMockActive] = false;
		}
		activate() {
			this[kIsMockActive] = true;
		}
		enableNetConnect(matcher) {
			if (typeof matcher === "string" || typeof matcher === "function" || matcher instanceof RegExp) if (Array.isArray(this[kNetConnect])) this[kNetConnect].push(matcher);
			else this[kNetConnect] = [matcher];
			else if (typeof matcher === "undefined") this[kNetConnect] = true;
			else throw new InvalidArgumentError("Unsupported matcher. Must be one of String|Function|RegExp.");
		}
		disableNetConnect() {
			this[kNetConnect] = false;
		}
		get isMockActive() {
			return this[kIsMockActive];
		}
		[kMockAgentSet](origin, dispatcher) {
			this[kClients].set(origin, dispatcher);
		}
		[kFactory](origin) {
			const mockOptions = Object.assign({ agent: this }, this[kOptions]);
			return this[kOptions] && this[kOptions].connections === 1 ? new MockClient(origin, mockOptions) : new MockPool(origin, mockOptions);
		}
		[kMockAgentGet](origin) {
			const client = this[kClients].get(origin);
			if (client) return client;
			if (typeof origin !== "string") {
				const dispatcher = this[kFactory]("http://localhost:9999");
				this[kMockAgentSet](origin, dispatcher);
				return dispatcher;
			}
			for (const [keyMatcher, nonExplicitDispatcher] of Array.from(this[kClients])) if (nonExplicitDispatcher && typeof keyMatcher !== "string" && matchValue(keyMatcher, origin)) {
				const dispatcher = this[kFactory](origin);
				this[kMockAgentSet](origin, dispatcher);
				dispatcher[kDispatches] = nonExplicitDispatcher[kDispatches];
				return dispatcher;
			}
		}
		[kGetNetConnect]() {
			return this[kNetConnect];
		}
		pendingInterceptors() {
			const mockAgentClients = this[kClients];
			return Array.from(mockAgentClients.entries()).flatMap(([origin, scope]) => scope[kDispatches].map((dispatch) => ({
				...dispatch,
				origin
			}))).filter(({ pending }) => pending);
		}
		assertNoPendingInterceptors({ pendingInterceptorsFormatter = new PendingInterceptorsFormatter() } = {}) {
			const pending = this.pendingInterceptors();
			if (pending.length === 0) return;
			const pluralizer = new Pluralizer("interceptor", "interceptors").pluralize(pending.length);
			throw new UndiciError(`
${pluralizer.count} ${pluralizer.noun} ${pluralizer.is} pending:

${pendingInterceptorsFormatter.format(pending)}
`.trim());
		}
	};
	module.exports = MockAgent;
}));
//#endregion
//#region node_modules/.pnpm/undici@6.28.0/node_modules/undici/lib/global.js
var require_global = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const globalDispatcher = Symbol.for("undici.globalDispatcher.1");
	const { InvalidArgumentError } = require_errors();
	const Agent = require_agent();
	if (getGlobalDispatcher() === void 0) setGlobalDispatcher(new Agent());
	function setGlobalDispatcher(agent) {
		if (!agent || typeof agent.dispatch !== "function") throw new InvalidArgumentError("Argument agent must implement Agent");
		Object.defineProperty(globalThis, globalDispatcher, {
			value: agent,
			writable: true,
			enumerable: false,
			configurable: false
		});
	}
	function getGlobalDispatcher() {
		return globalThis[globalDispatcher];
	}
	module.exports = {
		setGlobalDispatcher,
		getGlobalDispatcher
	};
}));
//#endregion
//#region node_modules/.pnpm/undici@6.28.0/node_modules/undici/lib/handler/decorator-handler.js
var require_decorator_handler = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = class DecoratorHandler {
		#handler;
		constructor(handler) {
			if (typeof handler !== "object" || handler === null) throw new TypeError("handler must be an object");
			this.#handler = handler;
		}
		onConnect(...args) {
			return this.#handler.onConnect?.(...args);
		}
		onError(...args) {
			return this.#handler.onError?.(...args);
		}
		onUpgrade(...args) {
			return this.#handler.onUpgrade?.(...args);
		}
		onResponseStarted(...args) {
			return this.#handler.onResponseStarted?.(...args);
		}
		onHeaders(...args) {
			return this.#handler.onHeaders?.(...args);
		}
		onData(...args) {
			return this.#handler.onData?.(...args);
		}
		onComplete(...args) {
			return this.#handler.onComplete?.(...args);
		}
		onBodySent(...args) {
			return this.#handler.onBodySent?.(...args);
		}
	};
}));
//#endregion
//#region node_modules/.pnpm/undici@6.28.0/node_modules/undici/lib/interceptor/redirect.js
var require_redirect = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const RedirectHandler = require_redirect_handler();
	module.exports = (opts) => {
		const globalMaxRedirections = opts?.maxRedirections;
		return (dispatch) => {
			return function redirectInterceptor(opts, handler) {
				const { maxRedirections = globalMaxRedirections, ...baseOpts } = opts;
				if (!maxRedirections) return dispatch(opts, handler);
				return dispatch(baseOpts, new RedirectHandler(dispatch, maxRedirections, opts, handler));
			};
		};
	};
}));
//#endregion
//#region node_modules/.pnpm/undici@6.28.0/node_modules/undici/lib/interceptor/retry.js
var require_retry = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const RetryHandler = require_retry_handler();
	module.exports = (globalOpts) => {
		return (dispatch) => {
			return function retryInterceptor(opts, handler) {
				return dispatch(opts, new RetryHandler({
					...opts,
					retryOptions: {
						...globalOpts,
						...opts.retryOptions
					}
				}, {
					handler,
					dispatch
				}));
			};
		};
	};
}));
//#endregion
//#region node_modules/.pnpm/undici@6.28.0/node_modules/undici/lib/interceptor/dump.js
var require_dump = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const util = require_util$7();
	const { InvalidArgumentError, RequestAbortedError } = require_errors();
	const DecoratorHandler = require_decorator_handler();
	var DumpHandler = class extends DecoratorHandler {
		#maxSize = 1048576;
		#abort = null;
		#dumped = false;
		#aborted = false;
		#size = 0;
		#reason = null;
		#handler = null;
		constructor({ maxSize }, handler) {
			super(handler);
			if (maxSize != null && (!Number.isFinite(maxSize) || maxSize < 1)) throw new InvalidArgumentError("maxSize must be a number greater than 0");
			this.#maxSize = maxSize ?? this.#maxSize;
			this.#handler = handler;
		}
		onConnect(abort) {
			this.#abort = abort;
			this.#handler.onConnect(this.#customAbort.bind(this));
		}
		#customAbort(reason) {
			this.#aborted = true;
			this.#reason = reason;
		}
		onHeaders(statusCode, rawHeaders, resume, statusMessage) {
			const contentLength = util.parseHeaders(rawHeaders)["content-length"];
			if (contentLength != null && contentLength > this.#maxSize) throw new RequestAbortedError(`Response size (${contentLength}) larger than maxSize (${this.#maxSize})`);
			if (this.#aborted) return true;
			return this.#handler.onHeaders(statusCode, rawHeaders, resume, statusMessage);
		}
		onError(err) {
			if (this.#dumped) return;
			err = this.#reason ?? err;
			this.#handler.onError(err);
		}
		onData(chunk) {
			this.#size = this.#size + chunk.length;
			if (this.#size >= this.#maxSize) {
				this.#dumped = true;
				if (this.#aborted) this.#handler.onError(this.#reason);
				else this.#handler.onComplete([]);
			}
			return true;
		}
		onComplete(trailers) {
			if (this.#dumped) return;
			if (this.#aborted) {
				this.#handler.onError(this.reason);
				return;
			}
			this.#handler.onComplete(trailers);
		}
	};
	function createDumpInterceptor({ maxSize: defaultMaxSize } = { maxSize: 1048576 }) {
		return (dispatch) => {
			return function Intercept(opts, handler) {
				const { dumpMaxSize = defaultMaxSize } = opts;
				return dispatch(opts, new DumpHandler({ maxSize: dumpMaxSize }, handler));
			};
		};
	}
	module.exports = createDumpInterceptor;
}));
//#endregion
//#region node_modules/.pnpm/undici@6.28.0/node_modules/undici/lib/interceptor/dns.js
var require_dns = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const { isIP } = __require("node:net");
	const { lookup } = __require("node:dns");
	const DecoratorHandler = require_decorator_handler();
	const { InvalidArgumentError, InformationalError } = require_errors();
	const maxInt = Math.pow(2, 31) - 1;
	var DNSInstance = class {
		#maxTTL = 0;
		#maxItems = 0;
		#records = /* @__PURE__ */ new Map();
		dualStack = true;
		affinity = null;
		lookup = null;
		pick = null;
		constructor(opts) {
			this.#maxTTL = opts.maxTTL;
			this.#maxItems = opts.maxItems;
			this.dualStack = opts.dualStack;
			this.affinity = opts.affinity;
			this.lookup = opts.lookup ?? this.#defaultLookup;
			this.pick = opts.pick ?? this.#defaultPick;
		}
		get full() {
			return this.#records.size === this.#maxItems;
		}
		runLookup(origin, opts, cb) {
			const ips = this.#records.get(origin.hostname);
			if (ips == null && this.full) {
				cb(null, origin.origin);
				return;
			}
			const newOpts = {
				affinity: this.affinity,
				dualStack: this.dualStack,
				lookup: this.lookup,
				pick: this.pick,
				...opts.dns,
				maxTTL: this.#maxTTL,
				maxItems: this.#maxItems
			};
			if (ips == null) this.lookup(origin, newOpts, (err, addresses) => {
				if (err || addresses == null || addresses.length === 0) {
					cb(err ?? new InformationalError("No DNS entries found"));
					return;
				}
				this.setRecords(origin, addresses);
				const records = this.#records.get(origin.hostname);
				const ip = this.pick(origin, records, newOpts.affinity);
				let port;
				if (typeof ip.port === "number") port = `:${ip.port}`;
				else if (origin.port !== "") port = `:${origin.port}`;
				else port = "";
				cb(null, `${origin.protocol}//${ip.family === 6 ? `[${ip.address}]` : ip.address}${port}`);
			});
			else {
				const ip = this.pick(origin, ips, newOpts.affinity);
				if (ip == null) {
					this.#records.delete(origin.hostname);
					this.runLookup(origin, opts, cb);
					return;
				}
				let port;
				if (typeof ip.port === "number") port = `:${ip.port}`;
				else if (origin.port !== "") port = `:${origin.port}`;
				else port = "";
				cb(null, `${origin.protocol}//${ip.family === 6 ? `[${ip.address}]` : ip.address}${port}`);
			}
		}
		#defaultLookup(origin, opts, cb) {
			lookup(origin.hostname, {
				all: true,
				family: this.dualStack === false ? this.affinity : 0,
				order: "ipv4first"
			}, (err, addresses) => {
				if (err) return cb(err);
				const results = /* @__PURE__ */ new Map();
				for (const addr of addresses) results.set(`${addr.address}:${addr.family}`, addr);
				cb(null, results.values());
			});
		}
		#defaultPick(origin, hostnameRecords, affinity) {
			let ip = null;
			const { records, offset } = hostnameRecords;
			let family;
			if (this.dualStack) {
				if (affinity == null) if (offset == null || offset === maxInt) {
					hostnameRecords.offset = 0;
					affinity = 4;
				} else {
					hostnameRecords.offset++;
					affinity = (hostnameRecords.offset & 1) === 1 ? 6 : 4;
				}
				if (records[affinity] != null && records[affinity].ips.length > 0) family = records[affinity];
				else family = records[affinity === 4 ? 6 : 4];
			} else family = records[affinity];
			if (family == null || family.ips.length === 0) return ip;
			if (family.offset == null || family.offset === maxInt) family.offset = 0;
			else family.offset++;
			const position = family.offset % family.ips.length;
			ip = family.ips[position] ?? null;
			if (ip == null) return ip;
			if (Date.now() - ip.timestamp > ip.ttl) {
				family.ips.splice(position, 1);
				return this.pick(origin, hostnameRecords, affinity);
			}
			return ip;
		}
		setRecords(origin, addresses) {
			const timestamp = Date.now();
			const records = { records: {
				4: null,
				6: null
			} };
			for (const record of addresses) {
				record.timestamp = timestamp;
				if (typeof record.ttl === "number") record.ttl = Math.min(record.ttl, this.#maxTTL);
				else record.ttl = this.#maxTTL;
				const familyRecords = records.records[record.family] ?? { ips: [] };
				familyRecords.ips.push(record);
				records.records[record.family] = familyRecords;
			}
			this.#records.set(origin.hostname, records);
		}
		getHandler(meta, opts) {
			return new DNSDispatchHandler(this, meta, opts);
		}
	};
	var DNSDispatchHandler = class extends DecoratorHandler {
		#state = null;
		#opts = null;
		#dispatch = null;
		#handler = null;
		#origin = null;
		constructor(state, { origin, handler, dispatch }, opts) {
			super(handler);
			this.#origin = origin;
			this.#handler = handler;
			this.#opts = { ...opts };
			this.#state = state;
			this.#dispatch = dispatch;
		}
		onError(err) {
			switch (err.code) {
				case "ETIMEDOUT":
				case "ECONNREFUSED":
					if (this.#state.dualStack) {
						this.#state.runLookup(this.#origin, this.#opts, (err, newOrigin) => {
							if (err) return this.#handler.onError(err);
							const dispatchOpts = {
								...this.#opts,
								origin: newOrigin
							};
							this.#dispatch(dispatchOpts, this);
						});
						return;
					}
					this.#handler.onError(err);
					return;
				case "ENOTFOUND": this.#state.deleteRecord(this.#origin);
				default: this.#handler.onError(err);
			}
		}
	};
	module.exports = (interceptorOpts) => {
		if (interceptorOpts?.maxTTL != null && (typeof interceptorOpts?.maxTTL !== "number" || interceptorOpts?.maxTTL < 0)) throw new InvalidArgumentError("Invalid maxTTL. Must be a positive number");
		if (interceptorOpts?.maxItems != null && (typeof interceptorOpts?.maxItems !== "number" || interceptorOpts?.maxItems < 1)) throw new InvalidArgumentError("Invalid maxItems. Must be a positive number and greater than zero");
		if (interceptorOpts?.affinity != null && interceptorOpts?.affinity !== 4 && interceptorOpts?.affinity !== 6) throw new InvalidArgumentError("Invalid affinity. Must be either 4 or 6");
		if (interceptorOpts?.dualStack != null && typeof interceptorOpts?.dualStack !== "boolean") throw new InvalidArgumentError("Invalid dualStack. Must be a boolean");
		if (interceptorOpts?.lookup != null && typeof interceptorOpts?.lookup !== "function") throw new InvalidArgumentError("Invalid lookup. Must be a function");
		if (interceptorOpts?.pick != null && typeof interceptorOpts?.pick !== "function") throw new InvalidArgumentError("Invalid pick. Must be a function");
		const dualStack = interceptorOpts?.dualStack ?? true;
		let affinity;
		if (dualStack) affinity = interceptorOpts?.affinity ?? null;
		else affinity = interceptorOpts?.affinity ?? 4;
		const instance = new DNSInstance({
			maxTTL: interceptorOpts?.maxTTL ?? 1e4,
			lookup: interceptorOpts?.lookup ?? null,
			pick: interceptorOpts?.pick ?? null,
			dualStack,
			affinity,
			maxItems: interceptorOpts?.maxItems ?? Infinity
		});
		return (dispatch) => {
			return function dnsInterceptor(origDispatchOpts, handler) {
				const origin = origDispatchOpts.origin.constructor === URL ? origDispatchOpts.origin : new URL(origDispatchOpts.origin);
				if (isIP(origin.hostname) !== 0) return dispatch(origDispatchOpts, handler);
				instance.runLookup(origin, origDispatchOpts, (err, newOrigin) => {
					if (err) return handler.onError(err);
					let dispatchOpts = null;
					dispatchOpts = {
						...origDispatchOpts,
						servername: origin.hostname,
						origin: newOrigin,
						headers: {
							host: origin.hostname,
							...origDispatchOpts.headers
						}
					};
					dispatch(dispatchOpts, instance.getHandler({
						origin,
						dispatch,
						handler
					}, origDispatchOpts));
				});
				return true;
			};
		};
	};
}));
//#endregion
//#region node_modules/.pnpm/undici@6.28.0/node_modules/undici/lib/web/fetch/headers.js
var require_headers = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const { kConstruct } = require_symbols$4();
	const { kEnumerableProperty } = require_util$7();
	const { iteratorMixin, isValidHeaderName, isValidHeaderValue } = require_util$6();
	const { webidl } = require_webidl();
	const assert$7 = __require("node:assert");
	const util = __require("node:util");
	const kHeadersMap = Symbol("headers map");
	const kHeadersSortedMap = Symbol("headers map sorted");
	/**
	* @param {number} code
	*/
	function isHTTPWhiteSpaceCharCode(code) {
		return code === 10 || code === 13 || code === 9 || code === 32;
	}
	/**
	* @see https://fetch.spec.whatwg.org/#concept-header-value-normalize
	* @param {string} potentialValue
	*/
	function headerValueNormalize(potentialValue) {
		let i = 0;
		let j = potentialValue.length;
		while (j > i && isHTTPWhiteSpaceCharCode(potentialValue.charCodeAt(j - 1))) --j;
		while (j > i && isHTTPWhiteSpaceCharCode(potentialValue.charCodeAt(i))) ++i;
		return i === 0 && j === potentialValue.length ? potentialValue : potentialValue.substring(i, j);
	}
	function fill(headers, object) {
		if (Array.isArray(object)) for (let i = 0; i < object.length; ++i) {
			const header = object[i];
			if (header.length !== 2) throw webidl.errors.exception({
				header: "Headers constructor",
				message: `expected name/value pair to be length 2, found ${header.length}.`
			});
			appendHeader(headers, header[0], header[1]);
		}
		else if (typeof object === "object" && object !== null) {
			const keys = Object.keys(object);
			for (let i = 0; i < keys.length; ++i) appendHeader(headers, keys[i], object[keys[i]]);
		} else throw webidl.errors.conversionFailed({
			prefix: "Headers constructor",
			argument: "Argument 1",
			types: ["sequence<sequence<ByteString>>", "record<ByteString, ByteString>"]
		});
	}
	/**
	* @see https://fetch.spec.whatwg.org/#concept-headers-append
	*/
	function appendHeader(headers, name, value) {
		value = headerValueNormalize(value);
		if (!isValidHeaderName(name)) throw webidl.errors.invalidArgument({
			prefix: "Headers.append",
			value: name,
			type: "header name"
		});
		else if (!isValidHeaderValue(value)) throw webidl.errors.invalidArgument({
			prefix: "Headers.append",
			value,
			type: "header value"
		});
		if (getHeadersGuard(headers) === "immutable") throw new TypeError("immutable");
		return getHeadersList(headers).append(name, value, false);
	}
	function compareHeaderName(a, b) {
		return a[0] < b[0] ? -1 : 1;
	}
	var HeadersList = class HeadersList {
		/** @type {[string, string][]|null} */
		cookies = null;
		constructor(init) {
			if (init instanceof HeadersList) {
				this[kHeadersMap] = new Map(init[kHeadersMap]);
				this[kHeadersSortedMap] = init[kHeadersSortedMap];
				this.cookies = init.cookies === null ? null : [...init.cookies];
			} else {
				this[kHeadersMap] = new Map(init);
				this[kHeadersSortedMap] = null;
			}
		}
		/**
		* @see https://fetch.spec.whatwg.org/#header-list-contains
		* @param {string} name
		* @param {boolean} isLowerCase
		*/
		contains(name, isLowerCase) {
			return this[kHeadersMap].has(isLowerCase ? name : name.toLowerCase());
		}
		clear() {
			this[kHeadersMap].clear();
			this[kHeadersSortedMap] = null;
			this.cookies = null;
		}
		/**
		* @see https://fetch.spec.whatwg.org/#concept-header-list-append
		* @param {string} name
		* @param {string} value
		* @param {boolean} isLowerCase
		*/
		append(name, value, isLowerCase) {
			this[kHeadersSortedMap] = null;
			const lowercaseName = isLowerCase ? name : name.toLowerCase();
			const exists = this[kHeadersMap].get(lowercaseName);
			if (exists) {
				const delimiter = lowercaseName === "cookie" ? "; " : ", ";
				this[kHeadersMap].set(lowercaseName, {
					name: exists.name,
					value: `${exists.value}${delimiter}${value}`
				});
			} else this[kHeadersMap].set(lowercaseName, {
				name,
				value
			});
			if (lowercaseName === "set-cookie") (this.cookies ??= []).push(value);
		}
		/**
		* @see https://fetch.spec.whatwg.org/#concept-header-list-set
		* @param {string} name
		* @param {string} value
		* @param {boolean} isLowerCase
		*/
		set(name, value, isLowerCase) {
			this[kHeadersSortedMap] = null;
			const lowercaseName = isLowerCase ? name : name.toLowerCase();
			if (lowercaseName === "set-cookie") this.cookies = [value];
			this[kHeadersMap].set(lowercaseName, {
				name,
				value
			});
		}
		/**
		* @see https://fetch.spec.whatwg.org/#concept-header-list-delete
		* @param {string} name
		* @param {boolean} isLowerCase
		*/
		delete(name, isLowerCase) {
			this[kHeadersSortedMap] = null;
			if (!isLowerCase) name = name.toLowerCase();
			if (name === "set-cookie") this.cookies = null;
			this[kHeadersMap].delete(name);
		}
		/**
		* @see https://fetch.spec.whatwg.org/#concept-header-list-get
		* @param {string} name
		* @param {boolean} isLowerCase
		* @returns {string | null}
		*/
		get(name, isLowerCase) {
			return this[kHeadersMap].get(isLowerCase ? name : name.toLowerCase())?.value ?? null;
		}
		*[Symbol.iterator]() {
			for (const { 0: name, 1: { value } } of this[kHeadersMap]) yield [name, value];
		}
		get entries() {
			const headers = {};
			if (this[kHeadersMap].size !== 0) for (const { name, value } of this[kHeadersMap].values()) headers[name] = value;
			return headers;
		}
		rawValues() {
			return this[kHeadersMap].values();
		}
		get entriesList() {
			const headers = [];
			if (this[kHeadersMap].size !== 0) for (const { 0: lowerName, 1: { name, value } } of this[kHeadersMap]) if (lowerName === "set-cookie") for (const cookie of this.cookies) headers.push([name, cookie]);
			else headers.push([name, value]);
			return headers;
		}
		toSortedArray() {
			const size = this[kHeadersMap].size;
			const array = new Array(size);
			if (size <= 32) {
				if (size === 0) return array;
				const iterator = this[kHeadersMap][Symbol.iterator]();
				const firstValue = iterator.next().value;
				array[0] = [firstValue[0], firstValue[1].value];
				assert$7(firstValue[1].value !== null);
				for (let i = 1, j = 0, right = 0, left = 0, pivot = 0, x, value; i < size; ++i) {
					value = iterator.next().value;
					x = array[i] = [value[0], value[1].value];
					assert$7(x[1] !== null);
					left = 0;
					right = i;
					while (left < right) {
						pivot = left + (right - left >> 1);
						if (array[pivot][0] <= x[0]) left = pivot + 1;
						else right = pivot;
					}
					if (i !== pivot) {
						j = i;
						while (j > left) array[j] = array[--j];
						array[left] = x;
					}
				}
				/* c8 ignore next 4 */
				if (!iterator.next().done) throw new TypeError("Unreachable");
				return array;
			} else {
				let i = 0;
				for (const { 0: name, 1: { value } } of this[kHeadersMap]) {
					array[i++] = [name, value];
					assert$7(value !== null);
				}
				return array.sort(compareHeaderName);
			}
		}
	};
	var Headers = class Headers {
		#guard;
		#headersList;
		constructor(init = void 0) {
			webidl.util.markAsUncloneable(this);
			if (init === kConstruct) return;
			this.#headersList = new HeadersList();
			this.#guard = "none";
			if (init !== void 0) {
				init = webidl.converters.HeadersInit(init, "Headers contructor", "init");
				fill(this, init);
			}
		}
		append(name, value) {
			webidl.brandCheck(this, Headers);
			webidl.argumentLengthCheck(arguments, 2, "Headers.append");
			const prefix = "Headers.append";
			name = webidl.converters.ByteString(name, prefix, "name");
			value = webidl.converters.ByteString(value, prefix, "value");
			return appendHeader(this, name, value);
		}
		delete(name) {
			webidl.brandCheck(this, Headers);
			webidl.argumentLengthCheck(arguments, 1, "Headers.delete");
			name = webidl.converters.ByteString(name, "Headers.delete", "name");
			if (!isValidHeaderName(name)) throw webidl.errors.invalidArgument({
				prefix: "Headers.delete",
				value: name,
				type: "header name"
			});
			if (this.#guard === "immutable") throw new TypeError("immutable");
			if (!this.#headersList.contains(name, false)) return;
			this.#headersList.delete(name, false);
		}
		get(name) {
			webidl.brandCheck(this, Headers);
			webidl.argumentLengthCheck(arguments, 1, "Headers.get");
			const prefix = "Headers.get";
			name = webidl.converters.ByteString(name, prefix, "name");
			if (!isValidHeaderName(name)) throw webidl.errors.invalidArgument({
				prefix,
				value: name,
				type: "header name"
			});
			return this.#headersList.get(name, false);
		}
		has(name) {
			webidl.brandCheck(this, Headers);
			webidl.argumentLengthCheck(arguments, 1, "Headers.has");
			const prefix = "Headers.has";
			name = webidl.converters.ByteString(name, prefix, "name");
			if (!isValidHeaderName(name)) throw webidl.errors.invalidArgument({
				prefix,
				value: name,
				type: "header name"
			});
			return this.#headersList.contains(name, false);
		}
		set(name, value) {
			webidl.brandCheck(this, Headers);
			webidl.argumentLengthCheck(arguments, 2, "Headers.set");
			const prefix = "Headers.set";
			name = webidl.converters.ByteString(name, prefix, "name");
			value = webidl.converters.ByteString(value, prefix, "value");
			value = headerValueNormalize(value);
			if (!isValidHeaderName(name)) throw webidl.errors.invalidArgument({
				prefix,
				value: name,
				type: "header name"
			});
			else if (!isValidHeaderValue(value)) throw webidl.errors.invalidArgument({
				prefix,
				value,
				type: "header value"
			});
			if (this.#guard === "immutable") throw new TypeError("immutable");
			this.#headersList.set(name, value, false);
		}
		getSetCookie() {
			webidl.brandCheck(this, Headers);
			const list = this.#headersList.cookies;
			if (list) return [...list];
			return [];
		}
		get [kHeadersSortedMap]() {
			if (this.#headersList[kHeadersSortedMap]) return this.#headersList[kHeadersSortedMap];
			const headers = [];
			const names = this.#headersList.toSortedArray();
			const cookies = this.#headersList.cookies;
			if (cookies === null || cookies.length === 1) return this.#headersList[kHeadersSortedMap] = names;
			for (let i = 0; i < names.length; ++i) {
				const { 0: name, 1: value } = names[i];
				if (name === "set-cookie") for (let j = 0; j < cookies.length; ++j) headers.push([name, cookies[j]]);
				else headers.push([name, value]);
			}
			return this.#headersList[kHeadersSortedMap] = headers;
		}
		[util.inspect.custom](depth, options) {
			options.depth ??= depth;
			return `Headers ${util.formatWithOptions(options, this.#headersList.entries)}`;
		}
		static getHeadersGuard(o) {
			return o.#guard;
		}
		static setHeadersGuard(o, guard) {
			o.#guard = guard;
		}
		static getHeadersList(o) {
			return o.#headersList;
		}
		static setHeadersList(o, list) {
			o.#headersList = list;
		}
	};
	const { getHeadersGuard, setHeadersGuard, getHeadersList, setHeadersList } = Headers;
	Reflect.deleteProperty(Headers, "getHeadersGuard");
	Reflect.deleteProperty(Headers, "setHeadersGuard");
	Reflect.deleteProperty(Headers, "getHeadersList");
	Reflect.deleteProperty(Headers, "setHeadersList");
	iteratorMixin("Headers", Headers, kHeadersSortedMap, 0, 1);
	Object.defineProperties(Headers.prototype, {
		append: kEnumerableProperty,
		delete: kEnumerableProperty,
		get: kEnumerableProperty,
		has: kEnumerableProperty,
		set: kEnumerableProperty,
		getSetCookie: kEnumerableProperty,
		[Symbol.toStringTag]: {
			value: "Headers",
			configurable: true
		},
		[util.inspect.custom]: { enumerable: false }
	});
	webidl.converters.HeadersInit = function(V, prefix, argument) {
		if (webidl.util.Type(V) === "Object") {
			const iterator = Reflect.get(V, Symbol.iterator);
			if (!util.types.isProxy(V) && iterator === Headers.prototype.entries) try {
				return getHeadersList(V).entriesList;
			} catch {}
			if (typeof iterator === "function") return webidl.converters["sequence<sequence<ByteString>>"](V, prefix, argument, iterator.bind(V));
			return webidl.converters["record<ByteString, ByteString>"](V, prefix, argument);
		}
		throw webidl.errors.conversionFailed({
			prefix: "Headers constructor",
			argument: "Argument 1",
			types: ["sequence<sequence<ByteString>>", "record<ByteString, ByteString>"]
		});
	};
	module.exports = {
		fill,
		compareHeaderName,
		Headers,
		HeadersList,
		getHeadersGuard,
		setHeadersGuard,
		setHeadersList,
		getHeadersList
	};
}));
//#endregion
//#region node_modules/.pnpm/undici@6.28.0/node_modules/undici/lib/web/fetch/response.js
var require_response = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const { Headers, HeadersList, fill, getHeadersGuard, setHeadersGuard, setHeadersList } = require_headers();
	const { extractBody, cloneBody, mixinBody, hasFinalizationRegistry, streamRegistry, bodyUnusable } = require_body();
	const util = require_util$7();
	const nodeUtil$1 = __require("node:util");
	const { kEnumerableProperty } = util;
	const { isValidReasonPhrase, isCancelled, isAborted, isBlobLike, serializeJavascriptValueToJSONString, isErrorLike, isomorphicEncode, environmentSettingsObject: relevantRealm } = require_util$6();
	const { redirectStatusSet, nullBodyStatus } = require_constants$2();
	const { kState, kHeaders } = require_symbols$3();
	const { webidl } = require_webidl();
	const { FormData } = require_formdata();
	const { URLSerializer } = require_data_url();
	const { kConstruct } = require_symbols$4();
	const assert$6 = __require("node:assert");
	const { types: types$2 } = __require("node:util");
	const textEncoder = new TextEncoder("utf-8");
	var Response = class Response {
		static error() {
			return fromInnerResponse(makeNetworkError(), "immutable");
		}
		static json(data, init = {}) {
			webidl.argumentLengthCheck(arguments, 1, "Response.json");
			if (init !== null) init = webidl.converters.ResponseInit(init);
			const bytes = textEncoder.encode(serializeJavascriptValueToJSONString(data));
			const body = extractBody(bytes);
			const responseObject = fromInnerResponse(makeResponse({}), "response");
			initializeResponse(responseObject, init, {
				body: body[0],
				type: "application/json"
			});
			return responseObject;
		}
		static redirect(url, status = 302) {
			webidl.argumentLengthCheck(arguments, 1, "Response.redirect");
			url = webidl.converters.USVString(url);
			status = webidl.converters["unsigned short"](status);
			let parsedURL;
			try {
				parsedURL = new URL(url, relevantRealm.settingsObject.baseUrl);
			} catch (err) {
				throw new TypeError(`Failed to parse URL from ${url}`, { cause: err });
			}
			if (!redirectStatusSet.has(status)) throw new RangeError(`Invalid status code ${status}`);
			const responseObject = fromInnerResponse(makeResponse({}), "immutable");
			responseObject[kState].status = status;
			const value = isomorphicEncode(URLSerializer(parsedURL));
			responseObject[kState].headersList.append("location", value, true);
			return responseObject;
		}
		constructor(body = null, init = {}) {
			webidl.util.markAsUncloneable(this);
			if (body === kConstruct) return;
			if (body !== null) body = webidl.converters.BodyInit(body);
			init = webidl.converters.ResponseInit(init);
			this[kState] = makeResponse({});
			this[kHeaders] = new Headers(kConstruct);
			setHeadersGuard(this[kHeaders], "response");
			setHeadersList(this[kHeaders], this[kState].headersList);
			let bodyWithType = null;
			if (body != null) {
				const [extractedBody, type] = extractBody(body);
				bodyWithType = {
					body: extractedBody,
					type
				};
			}
			initializeResponse(this, init, bodyWithType);
		}
		get type() {
			webidl.brandCheck(this, Response);
			return this[kState].type;
		}
		get url() {
			webidl.brandCheck(this, Response);
			const urlList = this[kState].urlList;
			const url = urlList[urlList.length - 1] ?? null;
			if (url === null) return "";
			return URLSerializer(url, true);
		}
		get redirected() {
			webidl.brandCheck(this, Response);
			return this[kState].urlList.length > 1;
		}
		get status() {
			webidl.brandCheck(this, Response);
			return this[kState].status;
		}
		get ok() {
			webidl.brandCheck(this, Response);
			return this[kState].status >= 200 && this[kState].status <= 299;
		}
		get statusText() {
			webidl.brandCheck(this, Response);
			return this[kState].statusText;
		}
		get headers() {
			webidl.brandCheck(this, Response);
			return this[kHeaders];
		}
		get body() {
			webidl.brandCheck(this, Response);
			return this[kState].body ? this[kState].body.stream : null;
		}
		get bodyUsed() {
			webidl.brandCheck(this, Response);
			return !!this[kState].body && util.isDisturbed(this[kState].body.stream);
		}
		clone() {
			webidl.brandCheck(this, Response);
			if (bodyUnusable(this)) throw webidl.errors.exception({
				header: "Response.clone",
				message: "Body has already been consumed."
			});
			const clonedResponse = cloneResponse(this[kState]);
			if (hasFinalizationRegistry && this[kState].body?.stream) streamRegistry.register(this, new WeakRef(this[kState].body.stream));
			return fromInnerResponse(clonedResponse, getHeadersGuard(this[kHeaders]));
		}
		[nodeUtil$1.inspect.custom](depth, options) {
			if (options.depth === null) options.depth = 2;
			options.colors ??= true;
			const properties = {
				status: this.status,
				statusText: this.statusText,
				headers: this.headers,
				body: this.body,
				bodyUsed: this.bodyUsed,
				ok: this.ok,
				redirected: this.redirected,
				type: this.type,
				url: this.url
			};
			return `Response ${nodeUtil$1.formatWithOptions(options, properties)}`;
		}
	};
	mixinBody(Response);
	Object.defineProperties(Response.prototype, {
		type: kEnumerableProperty,
		url: kEnumerableProperty,
		status: kEnumerableProperty,
		ok: kEnumerableProperty,
		redirected: kEnumerableProperty,
		statusText: kEnumerableProperty,
		headers: kEnumerableProperty,
		clone: kEnumerableProperty,
		body: kEnumerableProperty,
		bodyUsed: kEnumerableProperty,
		[Symbol.toStringTag]: {
			value: "Response",
			configurable: true
		}
	});
	Object.defineProperties(Response, {
		json: kEnumerableProperty,
		redirect: kEnumerableProperty,
		error: kEnumerableProperty
	});
	function cloneResponse(response) {
		if (response.internalResponse) return filterResponse(cloneResponse(response.internalResponse), response.type);
		const newResponse = makeResponse({
			...response,
			body: null
		});
		if (response.body != null) newResponse.body = cloneBody(newResponse, response.body);
		return newResponse;
	}
	function makeResponse(init) {
		return {
			aborted: false,
			rangeRequested: false,
			timingAllowPassed: false,
			requestIncludesCredentials: false,
			type: "default",
			status: 200,
			timingInfo: null,
			cacheState: "",
			statusText: "",
			...init,
			headersList: init?.headersList ? new HeadersList(init?.headersList) : new HeadersList(),
			urlList: init?.urlList ? [...init.urlList] : []
		};
	}
	function makeNetworkError(reason) {
		return makeResponse({
			type: "error",
			status: 0,
			error: isErrorLike(reason) ? reason : new Error(reason ? String(reason) : reason),
			aborted: reason && reason.name === "AbortError"
		});
	}
	function isNetworkError(response) {
		return response.type === "error" && response.status === 0;
	}
	function makeFilteredResponse(response, state) {
		state = {
			internalResponse: response,
			...state
		};
		return new Proxy(response, {
			get(target, p) {
				return p in state ? state[p] : target[p];
			},
			set(target, p, value) {
				assert$6(!(p in state));
				target[p] = value;
				return true;
			}
		});
	}
	function filterResponse(response, type) {
		if (type === "basic") return makeFilteredResponse(response, {
			type: "basic",
			headersList: response.headersList
		});
		else if (type === "cors") return makeFilteredResponse(response, {
			type: "cors",
			headersList: response.headersList
		});
		else if (type === "opaque") return makeFilteredResponse(response, {
			type: "opaque",
			urlList: Object.freeze([]),
			status: 0,
			statusText: "",
			body: null
		});
		else if (type === "opaqueredirect") return makeFilteredResponse(response, {
			type: "opaqueredirect",
			status: 0,
			statusText: "",
			headersList: [],
			body: null
		});
		else assert$6(false);
	}
	function makeAppropriateNetworkError(fetchParams, err = null) {
		assert$6(isCancelled(fetchParams));
		return isAborted(fetchParams) ? makeNetworkError(Object.assign(new DOMException("The operation was aborted.", "AbortError"), { cause: err })) : makeNetworkError(Object.assign(new DOMException("Request was cancelled."), { cause: err }));
	}
	function initializeResponse(response, init, body) {
		if (init.status !== null && (init.status < 200 || init.status > 599)) throw new RangeError("init[\"status\"] must be in the range of 200 to 599, inclusive.");
		if ("statusText" in init && init.statusText != null) {
			if (!isValidReasonPhrase(String(init.statusText))) throw new TypeError("Invalid statusText");
		}
		if ("status" in init && init.status != null) response[kState].status = init.status;
		if ("statusText" in init && init.statusText != null) response[kState].statusText = init.statusText;
		if ("headers" in init && init.headers != null) fill(response[kHeaders], init.headers);
		if (body) {
			if (nullBodyStatus.includes(response.status)) throw webidl.errors.exception({
				header: "Response constructor",
				message: `Invalid response status code ${response.status}`
			});
			response[kState].body = body.body;
			if (body.type != null && !response[kState].headersList.contains("content-type", true)) response[kState].headersList.append("content-type", body.type, true);
		}
	}
	/**
	* @see https://fetch.spec.whatwg.org/#response-create
	* @param {any} innerResponse
	* @param {'request' | 'immutable' | 'request-no-cors' | 'response' | 'none'} guard
	* @returns {Response}
	*/
	function fromInnerResponse(innerResponse, guard) {
		const response = new Response(kConstruct);
		response[kState] = innerResponse;
		response[kHeaders] = new Headers(kConstruct);
		setHeadersList(response[kHeaders], innerResponse.headersList);
		setHeadersGuard(response[kHeaders], guard);
		if (hasFinalizationRegistry && innerResponse.body?.stream) streamRegistry.register(response, new WeakRef(innerResponse.body.stream));
		return response;
	}
	webidl.converters.ReadableStream = webidl.interfaceConverter(ReadableStream);
	webidl.converters.FormData = webidl.interfaceConverter(FormData);
	webidl.converters.URLSearchParams = webidl.interfaceConverter(URLSearchParams);
	webidl.converters.XMLHttpRequestBodyInit = function(V, prefix, name) {
		if (typeof V === "string") return webidl.converters.USVString(V, prefix, name);
		if (isBlobLike(V)) return webidl.converters.Blob(V, prefix, name, { strict: false });
		if (ArrayBuffer.isView(V) || types$2.isArrayBuffer(V)) return webidl.converters.BufferSource(V, prefix, name);
		if (util.isFormDataLike(V)) return webidl.converters.FormData(V, prefix, name, { strict: false });
		if (V instanceof URLSearchParams) return webidl.converters.URLSearchParams(V, prefix, name);
		return webidl.converters.DOMString(V, prefix, name);
	};
	webidl.converters.BodyInit = function(V, prefix, argument) {
		if (V instanceof ReadableStream) return webidl.converters.ReadableStream(V, prefix, argument);
		if (V?.[Symbol.asyncIterator]) return V;
		return webidl.converters.XMLHttpRequestBodyInit(V, prefix, argument);
	};
	webidl.converters.ResponseInit = webidl.dictionaryConverter([
		{
			key: "status",
			converter: webidl.converters["unsigned short"],
			defaultValue: () => 200
		},
		{
			key: "statusText",
			converter: webidl.converters.ByteString,
			defaultValue: () => ""
		},
		{
			key: "headers",
			converter: webidl.converters.HeadersInit
		}
	]);
	module.exports = {
		isNetworkError,
		makeNetworkError,
		makeResponse,
		makeAppropriateNetworkError,
		filterResponse,
		Response,
		cloneResponse,
		fromInnerResponse
	};
}));
//#endregion
//#region node_modules/.pnpm/undici@6.28.0/node_modules/undici/lib/web/fetch/dispatcher-weakref.js
var require_dispatcher_weakref = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const { kConnected, kSize } = require_symbols$4();
	var CompatWeakRef = class {
		constructor(value) {
			this.value = value;
		}
		deref() {
			return this.value[kConnected] === 0 && this.value[kSize] === 0 ? void 0 : this.value;
		}
	};
	var CompatFinalizer = class {
		constructor(finalizer) {
			this.finalizer = finalizer;
		}
		register(dispatcher, key) {
			if (dispatcher.on) dispatcher.on("disconnect", () => {
				if (dispatcher[kConnected] === 0 && dispatcher[kSize] === 0) this.finalizer(key);
			});
		}
		unregister(key) {}
	};
	module.exports = function() {
		if (process.env.NODE_V8_COVERAGE && process.version.startsWith("v18")) {
			process._rawDebug("Using compatibility WeakRef and FinalizationRegistry");
			return {
				WeakRef: CompatWeakRef,
				FinalizationRegistry: CompatFinalizer
			};
		}
		return {
			WeakRef,
			FinalizationRegistry
		};
	};
}));
//#endregion
//#region node_modules/.pnpm/undici@6.28.0/node_modules/undici/lib/web/fetch/request.js
var require_request = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const { extractBody, mixinBody, cloneBody, bodyUnusable } = require_body();
	const { Headers, fill: fillHeaders, HeadersList, setHeadersGuard, getHeadersGuard, setHeadersList, getHeadersList } = require_headers();
	const { FinalizationRegistry } = require_dispatcher_weakref()();
	const util = require_util$7();
	const nodeUtil = __require("node:util");
	const { isValidHTTPToken, sameOrigin, environmentSettingsObject } = require_util$6();
	const { forbiddenMethodsSet, corsSafeListedMethodsSet, referrerPolicy, requestRedirect, requestMode, requestCredentials, requestCache, requestDuplex } = require_constants$2();
	const { kEnumerableProperty, normalizedMethodRecordsBase, normalizedMethodRecords } = util;
	const { kHeaders, kSignal, kState, kDispatcher } = require_symbols$3();
	const { webidl } = require_webidl();
	const { URLSerializer } = require_data_url();
	const { kConstruct } = require_symbols$4();
	const assert$5 = __require("node:assert");
	const { getMaxListeners, setMaxListeners, getEventListeners, defaultMaxListeners } = __require("node:events");
	const kAbortController = Symbol("abortController");
	const requestFinalizer = new FinalizationRegistry(({ signal, abort }) => {
		signal.removeEventListener("abort", abort);
	});
	const dependentControllerMap = /* @__PURE__ */ new WeakMap();
	function buildAbort(acRef) {
		return abort;
		function abort() {
			const ac = acRef.deref();
			if (ac !== void 0) {
				requestFinalizer.unregister(abort);
				this.removeEventListener("abort", abort);
				ac.abort(this.reason);
				const controllerList = dependentControllerMap.get(ac.signal);
				if (controllerList !== void 0) {
					if (controllerList.size !== 0) {
						for (const ref of controllerList) {
							const ctrl = ref.deref();
							if (ctrl !== void 0) ctrl.abort(this.reason);
						}
						controllerList.clear();
					}
					dependentControllerMap.delete(ac.signal);
				}
			}
		}
	}
	let patchMethodWarning = false;
	var Request = class Request {
		constructor(input, init = {}) {
			webidl.util.markAsUncloneable(this);
			if (input === kConstruct) return;
			const prefix = "Request constructor";
			webidl.argumentLengthCheck(arguments, 1, prefix);
			input = webidl.converters.RequestInfo(input, prefix, "input");
			init = webidl.converters.RequestInit(init, prefix, "init");
			let request = null;
			let fallbackMode = null;
			const baseUrl = environmentSettingsObject.settingsObject.baseUrl;
			let signal = null;
			if (typeof input === "string") {
				this[kDispatcher] = init.dispatcher;
				let parsedURL;
				try {
					parsedURL = new URL(input, baseUrl);
				} catch (err) {
					throw new TypeError("Failed to parse URL from " + input, { cause: err });
				}
				if (parsedURL.username || parsedURL.password) throw new TypeError("Request cannot be constructed from a URL that includes credentials: " + input);
				request = makeRequest({ urlList: [parsedURL] });
				fallbackMode = "cors";
			} else {
				this[kDispatcher] = init.dispatcher || input[kDispatcher];
				assert$5(input instanceof Request);
				request = input[kState];
				signal = input[kSignal];
			}
			const origin = environmentSettingsObject.settingsObject.origin;
			let window = "client";
			if (request.window?.constructor?.name === "EnvironmentSettingsObject" && sameOrigin(request.window, origin)) window = request.window;
			if (init.window != null) throw new TypeError(`'window' option '${window}' must be null`);
			if ("window" in init) window = "no-window";
			request = makeRequest({
				method: request.method,
				headersList: request.headersList,
				unsafeRequest: request.unsafeRequest,
				client: environmentSettingsObject.settingsObject,
				window,
				priority: request.priority,
				origin: request.origin,
				referrer: request.referrer,
				referrerPolicy: request.referrerPolicy,
				mode: request.mode,
				credentials: request.credentials,
				cache: request.cache,
				redirect: request.redirect,
				integrity: request.integrity,
				keepalive: request.keepalive,
				reloadNavigation: request.reloadNavigation,
				historyNavigation: request.historyNavigation,
				urlList: [...request.urlList]
			});
			const initHasKey = Object.keys(init).length !== 0;
			if (initHasKey) {
				if (request.mode === "navigate") request.mode = "same-origin";
				request.reloadNavigation = false;
				request.historyNavigation = false;
				request.origin = "client";
				request.referrer = "client";
				request.referrerPolicy = "";
				request.url = request.urlList[request.urlList.length - 1];
				request.urlList = [request.url];
			}
			if (init.referrer !== void 0) {
				const referrer = init.referrer;
				if (referrer === "") request.referrer = "no-referrer";
				else {
					let parsedReferrer;
					try {
						parsedReferrer = new URL(referrer, baseUrl);
					} catch (err) {
						throw new TypeError(`Referrer "${referrer}" is not a valid URL.`, { cause: err });
					}
					if (parsedReferrer.protocol === "about:" && parsedReferrer.hostname === "client" || origin && !sameOrigin(parsedReferrer, environmentSettingsObject.settingsObject.baseUrl)) request.referrer = "client";
					else request.referrer = parsedReferrer;
				}
			}
			if (init.referrerPolicy !== void 0) request.referrerPolicy = init.referrerPolicy;
			let mode;
			if (init.mode !== void 0) mode = init.mode;
			else mode = fallbackMode;
			if (mode === "navigate") throw webidl.errors.exception({
				header: "Request constructor",
				message: "invalid request mode navigate."
			});
			if (mode != null) request.mode = mode;
			if (init.credentials !== void 0) request.credentials = init.credentials;
			if (init.cache !== void 0) request.cache = init.cache;
			if (request.cache === "only-if-cached" && request.mode !== "same-origin") throw new TypeError("'only-if-cached' can be set only with 'same-origin' mode");
			if (init.redirect !== void 0) request.redirect = init.redirect;
			if (init.integrity != null) request.integrity = String(init.integrity);
			if (init.keepalive !== void 0) request.keepalive = Boolean(init.keepalive);
			if (init.method !== void 0) {
				let method = init.method;
				const mayBeNormalized = normalizedMethodRecords[method];
				if (mayBeNormalized !== void 0) request.method = mayBeNormalized;
				else {
					if (!isValidHTTPToken(method)) throw new TypeError(`'${method}' is not a valid HTTP method.`);
					const upperCase = method.toUpperCase();
					if (forbiddenMethodsSet.has(upperCase)) throw new TypeError(`'${method}' HTTP method is unsupported.`);
					method = normalizedMethodRecordsBase[upperCase] ?? method;
					request.method = method;
				}
				if (!patchMethodWarning && request.method === "patch") {
					process.emitWarning("Using `patch` is highly likely to result in a `405 Method Not Allowed`. `PATCH` is much more likely to succeed.", { code: "UNDICI-FETCH-patch" });
					patchMethodWarning = true;
				}
			}
			if (init.signal !== void 0) signal = init.signal;
			this[kState] = request;
			const ac = new AbortController();
			this[kSignal] = ac.signal;
			if (signal != null) {
				if (!signal || typeof signal.aborted !== "boolean" || typeof signal.addEventListener !== "function") throw new TypeError("Failed to construct 'Request': member signal is not of type AbortSignal.");
				if (signal.aborted) ac.abort(signal.reason);
				else {
					this[kAbortController] = ac;
					const abort = buildAbort(new WeakRef(ac));
					try {
						if (typeof getMaxListeners === "function" && getMaxListeners(signal) === defaultMaxListeners) setMaxListeners(1500, signal);
						else if (getEventListeners(signal, "abort").length >= defaultMaxListeners) setMaxListeners(1500, signal);
					} catch {}
					util.addAbortListener(signal, abort);
					requestFinalizer.register(ac, {
						signal,
						abort
					}, abort);
				}
			}
			this[kHeaders] = new Headers(kConstruct);
			setHeadersList(this[kHeaders], request.headersList);
			setHeadersGuard(this[kHeaders], "request");
			if (mode === "no-cors") {
				if (!corsSafeListedMethodsSet.has(request.method)) throw new TypeError(`'${request.method} is unsupported in no-cors mode.`);
				setHeadersGuard(this[kHeaders], "request-no-cors");
			}
			if (initHasKey) {
				/** @type {HeadersList} */
				const headersList = getHeadersList(this[kHeaders]);
				const headers = init.headers !== void 0 ? init.headers : new HeadersList(headersList);
				headersList.clear();
				if (headers instanceof HeadersList) {
					for (const { name, value } of headers.rawValues()) headersList.append(name, value, false);
					headersList.cookies = headers.cookies;
				} else fillHeaders(this[kHeaders], headers);
			}
			const inputBody = input instanceof Request ? input[kState].body : null;
			if ((init.body != null || inputBody != null) && (request.method === "GET" || request.method === "HEAD")) throw new TypeError("Request with GET/HEAD method cannot have body.");
			let initBody = null;
			if (init.body != null) {
				const [extractedBody, contentType] = extractBody(init.body, request.keepalive);
				initBody = extractedBody;
				if (contentType && !getHeadersList(this[kHeaders]).contains("content-type", true)) this[kHeaders].append("content-type", contentType);
			}
			const inputOrInitBody = initBody ?? inputBody;
			if (inputOrInitBody != null && inputOrInitBody.source == null) {
				if (initBody != null && init.duplex == null) throw new TypeError("RequestInit: duplex option is required when sending a body.");
				if (request.mode !== "same-origin" && request.mode !== "cors") throw new TypeError("If request is made from ReadableStream, mode should be \"same-origin\" or \"cors\"");
				request.useCORSPreflightFlag = true;
			}
			let finalBody = inputOrInitBody;
			if (initBody == null && inputBody != null) {
				if (bodyUnusable(input)) throw new TypeError("Cannot construct a Request with a Request object that has already been used.");
				const identityTransform = new TransformStream();
				inputBody.stream.pipeThrough(identityTransform);
				finalBody = {
					source: inputBody.source,
					length: inputBody.length,
					stream: identityTransform.readable
				};
			}
			this[kState].body = finalBody;
		}
		get method() {
			webidl.brandCheck(this, Request);
			return this[kState].method;
		}
		get url() {
			webidl.brandCheck(this, Request);
			return URLSerializer(this[kState].url);
		}
		get headers() {
			webidl.brandCheck(this, Request);
			return this[kHeaders];
		}
		get destination() {
			webidl.brandCheck(this, Request);
			return this[kState].destination;
		}
		get referrer() {
			webidl.brandCheck(this, Request);
			if (this[kState].referrer === "no-referrer") return "";
			if (this[kState].referrer === "client") return "about:client";
			return this[kState].referrer.toString();
		}
		get referrerPolicy() {
			webidl.brandCheck(this, Request);
			return this[kState].referrerPolicy;
		}
		get mode() {
			webidl.brandCheck(this, Request);
			return this[kState].mode;
		}
		get credentials() {
			return this[kState].credentials;
		}
		get cache() {
			webidl.brandCheck(this, Request);
			return this[kState].cache;
		}
		get redirect() {
			webidl.brandCheck(this, Request);
			return this[kState].redirect;
		}
		get integrity() {
			webidl.brandCheck(this, Request);
			return this[kState].integrity;
		}
		get keepalive() {
			webidl.brandCheck(this, Request);
			return this[kState].keepalive;
		}
		get isReloadNavigation() {
			webidl.brandCheck(this, Request);
			return this[kState].reloadNavigation;
		}
		get isHistoryNavigation() {
			webidl.brandCheck(this, Request);
			return this[kState].historyNavigation;
		}
		get signal() {
			webidl.brandCheck(this, Request);
			return this[kSignal];
		}
		get body() {
			webidl.brandCheck(this, Request);
			return this[kState].body ? this[kState].body.stream : null;
		}
		get bodyUsed() {
			webidl.brandCheck(this, Request);
			return !!this[kState].body && util.isDisturbed(this[kState].body.stream);
		}
		get duplex() {
			webidl.brandCheck(this, Request);
			return "half";
		}
		clone() {
			webidl.brandCheck(this, Request);
			if (bodyUnusable(this)) throw new TypeError("unusable");
			const clonedRequest = cloneRequest(this[kState]);
			const ac = new AbortController();
			if (this.signal.aborted) ac.abort(this.signal.reason);
			else {
				let list = dependentControllerMap.get(this.signal);
				if (list === void 0) {
					list = /* @__PURE__ */ new Set();
					dependentControllerMap.set(this.signal, list);
				}
				const acRef = new WeakRef(ac);
				list.add(acRef);
				util.addAbortListener(ac.signal, buildAbort(acRef));
			}
			return fromInnerRequest(clonedRequest, ac.signal, getHeadersGuard(this[kHeaders]));
		}
		[nodeUtil.inspect.custom](depth, options) {
			if (options.depth === null) options.depth = 2;
			options.colors ??= true;
			const properties = {
				method: this.method,
				url: this.url,
				headers: this.headers,
				destination: this.destination,
				referrer: this.referrer,
				referrerPolicy: this.referrerPolicy,
				mode: this.mode,
				credentials: this.credentials,
				cache: this.cache,
				redirect: this.redirect,
				integrity: this.integrity,
				keepalive: this.keepalive,
				isReloadNavigation: this.isReloadNavigation,
				isHistoryNavigation: this.isHistoryNavigation,
				signal: this.signal
			};
			return `Request ${nodeUtil.formatWithOptions(options, properties)}`;
		}
	};
	mixinBody(Request);
	function makeRequest(init) {
		return {
			method: init.method ?? "GET",
			localURLsOnly: init.localURLsOnly ?? false,
			unsafeRequest: init.unsafeRequest ?? false,
			body: init.body ?? null,
			client: init.client ?? null,
			reservedClient: init.reservedClient ?? null,
			replacesClientId: init.replacesClientId ?? "",
			window: init.window ?? "client",
			keepalive: init.keepalive ?? false,
			serviceWorkers: init.serviceWorkers ?? "all",
			initiator: init.initiator ?? "",
			destination: init.destination ?? "",
			priority: init.priority ?? null,
			origin: init.origin ?? "client",
			policyContainer: init.policyContainer ?? "client",
			referrer: init.referrer ?? "client",
			referrerPolicy: init.referrerPolicy ?? "",
			mode: init.mode ?? "no-cors",
			useCORSPreflightFlag: init.useCORSPreflightFlag ?? false,
			credentials: init.credentials ?? "same-origin",
			useCredentials: init.useCredentials ?? false,
			cache: init.cache ?? "default",
			redirect: init.redirect ?? "follow",
			integrity: init.integrity ?? "",
			cryptoGraphicsNonceMetadata: init.cryptoGraphicsNonceMetadata ?? "",
			parserMetadata: init.parserMetadata ?? "",
			reloadNavigation: init.reloadNavigation ?? false,
			historyNavigation: init.historyNavigation ?? false,
			userActivation: init.userActivation ?? false,
			taintedOrigin: init.taintedOrigin ?? false,
			redirectCount: init.redirectCount ?? 0,
			responseTainting: init.responseTainting ?? "basic",
			preventNoCacheCacheControlHeaderModification: init.preventNoCacheCacheControlHeaderModification ?? false,
			done: init.done ?? false,
			timingAllowFailed: init.timingAllowFailed ?? false,
			urlList: init.urlList,
			url: init.urlList[0],
			headersList: init.headersList ? new HeadersList(init.headersList) : new HeadersList()
		};
	}
	function cloneRequest(request) {
		const newRequest = makeRequest({
			...request,
			body: null
		});
		if (request.body != null) newRequest.body = cloneBody(newRequest, request.body);
		return newRequest;
	}
	/**
	* @see https://fetch.spec.whatwg.org/#request-create
	* @param {any} innerRequest
	* @param {AbortSignal} signal
	* @param {'request' | 'immutable' | 'request-no-cors' | 'response' | 'none'} guard
	* @returns {Request}
	*/
	function fromInnerRequest(innerRequest, signal, guard) {
		const request = new Request(kConstruct);
		request[kState] = innerRequest;
		request[kSignal] = signal;
		request[kHeaders] = new Headers(kConstruct);
		setHeadersList(request[kHeaders], innerRequest.headersList);
		setHeadersGuard(request[kHeaders], guard);
		return request;
	}
	Object.defineProperties(Request.prototype, {
		method: kEnumerableProperty,
		url: kEnumerableProperty,
		headers: kEnumerableProperty,
		redirect: kEnumerableProperty,
		clone: kEnumerableProperty,
		signal: kEnumerableProperty,
		duplex: kEnumerableProperty,
		destination: kEnumerableProperty,
		body: kEnumerableProperty,
		bodyUsed: kEnumerableProperty,
		isHistoryNavigation: kEnumerableProperty,
		isReloadNavigation: kEnumerableProperty,
		keepalive: kEnumerableProperty,
		integrity: kEnumerableProperty,
		cache: kEnumerableProperty,
		credentials: kEnumerableProperty,
		attribute: kEnumerableProperty,
		referrerPolicy: kEnumerableProperty,
		referrer: kEnumerableProperty,
		mode: kEnumerableProperty,
		[Symbol.toStringTag]: {
			value: "Request",
			configurable: true
		}
	});
	webidl.converters.Request = webidl.interfaceConverter(Request);
	webidl.converters.RequestInfo = function(V, prefix, argument) {
		if (typeof V === "string") return webidl.converters.USVString(V, prefix, argument);
		if (V instanceof Request) return webidl.converters.Request(V, prefix, argument);
		return webidl.converters.USVString(V, prefix, argument);
	};
	webidl.converters.AbortSignal = webidl.interfaceConverter(AbortSignal);
	webidl.converters.RequestInit = webidl.dictionaryConverter([
		{
			key: "method",
			converter: webidl.converters.ByteString
		},
		{
			key: "headers",
			converter: webidl.converters.HeadersInit
		},
		{
			key: "body",
			converter: webidl.nullableConverter(webidl.converters.BodyInit)
		},
		{
			key: "referrer",
			converter: webidl.converters.USVString
		},
		{
			key: "referrerPolicy",
			converter: webidl.converters.DOMString,
			allowedValues: referrerPolicy
		},
		{
			key: "mode",
			converter: webidl.converters.DOMString,
			allowedValues: requestMode
		},
		{
			key: "credentials",
			converter: webidl.converters.DOMString,
			allowedValues: requestCredentials
		},
		{
			key: "cache",
			converter: webidl.converters.DOMString,
			allowedValues: requestCache
		},
		{
			key: "redirect",
			converter: webidl.converters.DOMString,
			allowedValues: requestRedirect
		},
		{
			key: "integrity",
			converter: webidl.converters.DOMString
		},
		{
			key: "keepalive",
			converter: webidl.converters.boolean
		},
		{
			key: "signal",
			converter: webidl.nullableConverter((signal) => webidl.converters.AbortSignal(signal, "RequestInit", "signal", { strict: false }))
		},
		{
			key: "window",
			converter: webidl.converters.any
		},
		{
			key: "duplex",
			converter: webidl.converters.DOMString,
			allowedValues: requestDuplex
		},
		{
			key: "dispatcher",
			converter: webidl.converters.any
		}
	]);
	module.exports = {
		Request,
		makeRequest,
		fromInnerRequest,
		cloneRequest
	};
}));
//#endregion
//#region node_modules/.pnpm/undici@6.28.0/node_modules/undici/lib/web/fetch/index.js
var require_fetch = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const { makeNetworkError, makeAppropriateNetworkError, filterResponse, makeResponse, fromInnerResponse } = require_response();
	const { HeadersList } = require_headers();
	const { Request, cloneRequest } = require_request();
	const zlib = __require("node:zlib");
	const { bytesMatch, makePolicyContainer, clonePolicyContainer, requestBadPort, TAOCheck, appendRequestOriginHeader, responseLocationURL, requestCurrentURL, setRequestReferrerPolicyOnRedirect, tryUpgradeRequestToAPotentiallyTrustworthyURL, createOpaqueTimingInfo, appendFetchMetadata, corsCheck, crossOriginResourcePolicyCheck, determineRequestsReferrer, coarsenedSharedCurrentTime, createDeferredPromise, isBlobLike, sameOrigin, isCancelled, isAborted, isErrorLike, fullyReadBody, readableStreamClose, isomorphicEncode, urlIsLocal, urlIsHttpHttpsScheme, urlHasHttpsScheme, clampAndCoarsenConnectionTimingInfo, simpleRangeHeaderValue, buildContentRange, createInflate, extractMimeType } = require_util$6();
	const { kState, kDispatcher } = require_symbols$3();
	const assert$4 = __require("node:assert");
	const { safelyExtractBody, extractBody } = require_body();
	const { redirectStatusSet, nullBodyStatus, safeMethodsSet, requestBodyHeader, subresourceSet } = require_constants$2();
	const EE = __require("node:events");
	const { Readable, pipeline: pipeline$1, finished } = __require("node:stream");
	const { addAbortListener, isErrored, isReadable, bufferToLowerCasedHeaderName } = require_util$7();
	const { dataURLProcessor, serializeAMimeType, minimizeSupportedMimeType } = require_data_url();
	const { getGlobalDispatcher } = require_global();
	const { webidl } = require_webidl();
	const { STATUS_CODES } = __require("node:http");
	const GET_OR_HEAD = ["GET", "HEAD"];
	const defaultUserAgent = typeof __UNDICI_IS_NODE__ !== "undefined" || typeof esbuildDetection !== "undefined" ? "node" : "undici";
	/** @type {import('buffer').resolveObjectURL} */
	let resolveObjectURL;
	var Fetch = class extends EE {
		constructor(dispatcher) {
			super();
			this.dispatcher = dispatcher;
			this.connection = null;
			this.dump = false;
			this.state = "ongoing";
		}
		terminate(reason) {
			if (this.state !== "ongoing") return;
			this.state = "terminated";
			this.connection?.destroy(reason);
			this.emit("terminated", reason);
		}
		abort(error) {
			if (this.state !== "ongoing") return;
			this.state = "aborted";
			if (!error) error = new DOMException("The operation was aborted.", "AbortError");
			this.serializedAbortReason = error;
			this.connection?.destroy(error);
			this.emit("terminated", error);
		}
	};
	function handleFetchDone(response) {
		finalizeAndReportTiming(response, "fetch");
	}
	function fetch(input, init = void 0) {
		webidl.argumentLengthCheck(arguments, 1, "globalThis.fetch");
		let p = createDeferredPromise();
		let requestObject;
		try {
			requestObject = new Request(input, init);
		} catch (e) {
			p.reject(e);
			return p.promise;
		}
		const request = requestObject[kState];
		if (requestObject.signal.aborted) {
			abortFetch(p, request, null, requestObject.signal.reason);
			return p.promise;
		}
		if (request.client.globalObject?.constructor?.name === "ServiceWorkerGlobalScope") request.serviceWorkers = "none";
		let responseObject = null;
		let locallyAborted = false;
		let controller = null;
		addAbortListener(requestObject.signal, () => {
			locallyAborted = true;
			assert$4(controller != null);
			controller.abort(requestObject.signal.reason);
			const realResponse = responseObject?.deref();
			abortFetch(p, request, realResponse, requestObject.signal.reason);
		});
		const processResponse = (response) => {
			if (locallyAborted) return;
			if (response.aborted) {
				abortFetch(p, request, responseObject, controller.serializedAbortReason);
				return;
			}
			if (response.type === "error") {
				p.reject(new TypeError("fetch failed", { cause: response.error }));
				return;
			}
			responseObject = new WeakRef(fromInnerResponse(response, "immutable"));
			p.resolve(responseObject.deref());
			p = null;
		};
		controller = fetching({
			request,
			processResponseEndOfBody: handleFetchDone,
			processResponse,
			dispatcher: requestObject[kDispatcher]
		});
		return p.promise;
	}
	function finalizeAndReportTiming(response, initiatorType = "other") {
		if (response.type === "error" && response.aborted) return;
		if (!response.urlList?.length) return;
		const originalURL = response.urlList[0];
		let timingInfo = response.timingInfo;
		let cacheState = response.cacheState;
		if (!urlIsHttpHttpsScheme(originalURL)) return;
		if (timingInfo === null) return;
		if (!response.timingAllowPassed) {
			timingInfo = createOpaqueTimingInfo({ startTime: timingInfo.startTime });
			cacheState = "";
		}
		timingInfo.endTime = coarsenedSharedCurrentTime();
		response.timingInfo = timingInfo;
		markResourceTiming(timingInfo, originalURL.href, initiatorType, globalThis, cacheState);
	}
	const markResourceTiming = performance.markResourceTiming;
	function abortFetch(p, request, responseObject, error) {
		if (p) p.reject(error);
		if (request.body != null && isReadable(request.body?.stream)) request.body.stream.cancel(error).catch((err) => {
			if (err.code === "ERR_INVALID_STATE") return;
			throw err;
		});
		if (responseObject == null) return;
		const response = responseObject[kState];
		if (response.body != null && isReadable(response.body?.stream)) response.body.stream.cancel(error).catch((err) => {
			if (err.code === "ERR_INVALID_STATE") return;
			throw err;
		});
	}
	function fetching({ request, processRequestBodyChunkLength, processRequestEndOfBody, processResponse, processResponseEndOfBody, processResponseConsumeBody, useParallelQueue = false, dispatcher = getGlobalDispatcher() }) {
		assert$4(dispatcher);
		let taskDestination = null;
		let crossOriginIsolatedCapability = false;
		if (request.client != null) {
			taskDestination = request.client.globalObject;
			crossOriginIsolatedCapability = request.client.crossOriginIsolatedCapability;
		}
		const currentTime = coarsenedSharedCurrentTime(crossOriginIsolatedCapability);
		const timingInfo = createOpaqueTimingInfo({ startTime: currentTime });
		const fetchParams = {
			controller: new Fetch(dispatcher),
			request,
			timingInfo,
			processRequestBodyChunkLength,
			processRequestEndOfBody,
			processResponse,
			processResponseConsumeBody,
			processResponseEndOfBody,
			taskDestination,
			crossOriginIsolatedCapability
		};
		assert$4(!request.body || request.body.stream);
		if (request.window === "client") request.window = request.client?.globalObject?.constructor?.name === "Window" ? request.client : "no-window";
		if (request.origin === "client") request.origin = request.client.origin;
		if (request.policyContainer === "client") if (request.client != null) request.policyContainer = clonePolicyContainer(request.client.policyContainer);
		else request.policyContainer = makePolicyContainer();
		if (!request.headersList.contains("accept", true)) request.headersList.append("accept", "*/*", true);
		if (!request.headersList.contains("accept-language", true)) request.headersList.append("accept-language", "*", true);
		if (request.priority === null) {}
		if (subresourceSet.has(request.destination)) {}
		mainFetch(fetchParams).catch((err) => {
			fetchParams.controller.terminate(err);
		});
		return fetchParams.controller;
	}
	async function mainFetch(fetchParams, recursive = false) {
		const request = fetchParams.request;
		let response = null;
		if (request.localURLsOnly && !urlIsLocal(requestCurrentURL(request))) response = makeNetworkError("local URLs only");
		tryUpgradeRequestToAPotentiallyTrustworthyURL(request);
		if (requestBadPort(request) === "blocked") response = makeNetworkError("bad port");
		if (request.referrerPolicy === "") request.referrerPolicy = request.policyContainer.referrerPolicy;
		if (request.referrer !== "no-referrer") request.referrer = determineRequestsReferrer(request);
		if (response === null) response = await (async () => {
			const currentURL = requestCurrentURL(request);
			if (sameOrigin(currentURL, request.url) && request.responseTainting === "basic" || currentURL.protocol === "data:" || request.mode === "navigate" || request.mode === "websocket") {
				request.responseTainting = "basic";
				return await schemeFetch(fetchParams);
			}
			if (request.mode === "same-origin") return makeNetworkError("request mode cannot be \"same-origin\"");
			if (request.mode === "no-cors") {
				if (request.redirect !== "follow") return makeNetworkError("redirect mode cannot be \"follow\" for \"no-cors\" request");
				request.responseTainting = "opaque";
				return await schemeFetch(fetchParams);
			}
			if (!urlIsHttpHttpsScheme(requestCurrentURL(request))) return makeNetworkError("URL scheme must be a HTTP(S) scheme");
			request.responseTainting = "cors";
			return await httpFetch(fetchParams);
		})();
		if (recursive) return response;
		if (response.status !== 0 && !response.internalResponse) {
			if (request.responseTainting === "cors") {}
			if (request.responseTainting === "basic") response = filterResponse(response, "basic");
			else if (request.responseTainting === "cors") response = filterResponse(response, "cors");
			else if (request.responseTainting === "opaque") response = filterResponse(response, "opaque");
			else assert$4(false);
		}
		let internalResponse = response.status === 0 ? response : response.internalResponse;
		if (internalResponse.urlList.length === 0) internalResponse.urlList.push(...request.urlList);
		if (!request.timingAllowFailed) response.timingAllowPassed = true;
		if (response.type === "opaque" && internalResponse.status === 206 && internalResponse.rangeRequested && !request.headers.contains("range", true)) response = internalResponse = makeNetworkError();
		if (response.status !== 0 && (request.method === "HEAD" || request.method === "CONNECT" || nullBodyStatus.includes(internalResponse.status))) {
			internalResponse.body = null;
			fetchParams.controller.dump = true;
		}
		if (request.integrity) {
			const processBodyError = (reason) => fetchFinale(fetchParams, makeNetworkError(reason));
			if (request.responseTainting === "opaque" || response.body == null) {
				processBodyError(response.error);
				return;
			}
			const processBody = (bytes) => {
				if (!bytesMatch(bytes, request.integrity)) {
					processBodyError("integrity mismatch");
					return;
				}
				response.body = safelyExtractBody(bytes)[0];
				fetchFinale(fetchParams, response);
			};
			await fullyReadBody(response.body, processBody, processBodyError);
		} else fetchFinale(fetchParams, response);
	}
	function schemeFetch(fetchParams) {
		if (isCancelled(fetchParams) && fetchParams.request.redirectCount === 0) return Promise.resolve(makeAppropriateNetworkError(fetchParams));
		const { request } = fetchParams;
		const { protocol: scheme } = requestCurrentURL(request);
		switch (scheme) {
			case "about:": return Promise.resolve(makeNetworkError("about scheme is not supported"));
			case "blob:": {
				if (!resolveObjectURL) resolveObjectURL = __require("node:buffer").resolveObjectURL;
				const blobURLEntry = requestCurrentURL(request);
				if (blobURLEntry.search.length !== 0) return Promise.resolve(makeNetworkError("NetworkError when attempting to fetch resource."));
				const blob = resolveObjectURL(blobURLEntry.toString());
				if (request.method !== "GET" || !isBlobLike(blob)) return Promise.resolve(makeNetworkError("invalid method"));
				const response = makeResponse();
				const fullLength = blob.size;
				const serializedFullLength = isomorphicEncode(`${fullLength}`);
				const type = blob.type;
				if (!request.headersList.contains("range", true)) {
					const bodyWithType = extractBody(blob);
					response.statusText = "OK";
					response.body = bodyWithType[0];
					response.headersList.set("content-length", serializedFullLength, true);
					response.headersList.set("content-type", type, true);
				} else {
					response.rangeRequested = true;
					const rangeHeader = request.headersList.get("range", true);
					const rangeValue = simpleRangeHeaderValue(rangeHeader, true);
					if (rangeValue === "failure") return Promise.resolve(makeNetworkError("failed to fetch the data URL"));
					let { rangeStartValue: rangeStart, rangeEndValue: rangeEnd } = rangeValue;
					if (rangeStart === null) {
						rangeStart = fullLength - rangeEnd;
						rangeEnd = rangeStart + rangeEnd - 1;
					} else {
						if (rangeStart >= fullLength) return Promise.resolve(makeNetworkError("Range start is greater than the blob's size."));
						if (rangeEnd === null || rangeEnd >= fullLength) rangeEnd = fullLength - 1;
					}
					const slicedBlob = blob.slice(rangeStart, rangeEnd, type);
					response.body = extractBody(slicedBlob)[0];
					const serializedSlicedLength = isomorphicEncode(`${slicedBlob.size}`);
					const contentRange = buildContentRange(rangeStart, rangeEnd, fullLength);
					response.status = 206;
					response.statusText = "Partial Content";
					response.headersList.set("content-length", serializedSlicedLength, true);
					response.headersList.set("content-type", type, true);
					response.headersList.set("content-range", contentRange, true);
				}
				return Promise.resolve(response);
			}
			case "data:": {
				const currentURL = requestCurrentURL(request);
				const dataURLStruct = dataURLProcessor(currentURL);
				if (dataURLStruct === "failure") return Promise.resolve(makeNetworkError("failed to fetch the data URL"));
				const mimeType = serializeAMimeType(dataURLStruct.mimeType);
				return Promise.resolve(makeResponse({
					statusText: "OK",
					headersList: [["content-type", {
						name: "Content-Type",
						value: mimeType
					}]],
					body: safelyExtractBody(dataURLStruct.body)[0]
				}));
			}
			case "file:": return Promise.resolve(makeNetworkError("not implemented... yet..."));
			case "http:":
			case "https:": return httpFetch(fetchParams).catch((err) => makeNetworkError(err));
			default: return Promise.resolve(makeNetworkError("unknown scheme"));
		}
	}
	function finalizeResponse(fetchParams, response) {
		fetchParams.request.done = true;
		if (fetchParams.processResponseDone != null) queueMicrotask(() => fetchParams.processResponseDone(response));
	}
	function fetchFinale(fetchParams, response) {
		let timingInfo = fetchParams.timingInfo;
		const processResponseEndOfBody = () => {
			const unsafeEndTime = Date.now();
			if (fetchParams.request.destination === "document") fetchParams.controller.fullTimingInfo = timingInfo;
			fetchParams.controller.reportTimingSteps = () => {
				if (fetchParams.request.url.protocol !== "https:") return;
				timingInfo.endTime = unsafeEndTime;
				let cacheState = response.cacheState;
				const bodyInfo = response.bodyInfo;
				if (!response.timingAllowPassed) {
					timingInfo = createOpaqueTimingInfo(timingInfo);
					cacheState = "";
				}
				let responseStatus = 0;
				if (fetchParams.request.mode !== "navigator" || !response.hasCrossOriginRedirects) {
					responseStatus = response.status;
					const mimeType = extractMimeType(response.headersList);
					if (mimeType !== "failure") bodyInfo.contentType = minimizeSupportedMimeType(mimeType);
				}
				if (fetchParams.request.initiatorType != null) markResourceTiming(timingInfo, fetchParams.request.url.href, fetchParams.request.initiatorType, globalThis, cacheState, bodyInfo, responseStatus);
			};
			const processResponseEndOfBodyTask = () => {
				fetchParams.request.done = true;
				if (fetchParams.processResponseEndOfBody != null) queueMicrotask(() => fetchParams.processResponseEndOfBody(response));
				if (fetchParams.request.initiatorType != null) fetchParams.controller.reportTimingSteps();
			};
			queueMicrotask(() => processResponseEndOfBodyTask());
		};
		if (fetchParams.processResponse != null) queueMicrotask(() => {
			fetchParams.processResponse(response);
			fetchParams.processResponse = null;
		});
		const internalResponse = response.type === "error" ? response : response.internalResponse ?? response;
		if (internalResponse.body == null) processResponseEndOfBody();
		else finished(internalResponse.body.stream, () => {
			processResponseEndOfBody();
		});
	}
	async function httpFetch(fetchParams) {
		const request = fetchParams.request;
		let response = null;
		let actualResponse = null;
		const timingInfo = fetchParams.timingInfo;
		if (request.serviceWorkers === "all") {}
		if (response === null) {
			if (request.redirect === "follow") request.serviceWorkers = "none";
			actualResponse = response = await httpNetworkOrCacheFetch(fetchParams);
			if (request.responseTainting === "cors" && corsCheck(request, response) === "failure") return makeNetworkError("cors failure");
			if (TAOCheck(request, response) === "failure") request.timingAllowFailed = true;
		}
		if ((request.responseTainting === "opaque" || response.type === "opaque") && crossOriginResourcePolicyCheck(request.origin, request.client, request.destination, actualResponse) === "blocked") return makeNetworkError("blocked");
		if (redirectStatusSet.has(actualResponse.status)) {
			if (request.redirect !== "manual") fetchParams.controller.connection.destroy(void 0, false);
			if (request.redirect === "error") response = makeNetworkError("unexpected redirect");
			else if (request.redirect === "manual") response = actualResponse;
			else if (request.redirect === "follow") response = await httpRedirectFetch(fetchParams, response);
			else assert$4(false);
		}
		response.timingInfo = timingInfo;
		return response;
	}
	function httpRedirectFetch(fetchParams, response) {
		const request = fetchParams.request;
		const actualResponse = response.internalResponse ? response.internalResponse : response;
		let locationURL;
		try {
			locationURL = responseLocationURL(actualResponse, requestCurrentURL(request).hash);
			if (locationURL == null) return response;
		} catch (err) {
			return Promise.resolve(makeNetworkError(err));
		}
		if (!urlIsHttpHttpsScheme(locationURL)) return Promise.resolve(makeNetworkError("URL scheme must be a HTTP(S) scheme"));
		if (request.redirectCount === 20) return Promise.resolve(makeNetworkError("redirect count exceeded"));
		request.redirectCount += 1;
		if (request.mode === "cors" && (locationURL.username || locationURL.password) && !sameOrigin(request, locationURL)) return Promise.resolve(makeNetworkError("cross origin not allowed for request mode \"cors\""));
		if (request.responseTainting === "cors" && (locationURL.username || locationURL.password)) return Promise.resolve(makeNetworkError("URL cannot contain credentials for request mode \"cors\""));
		if (actualResponse.status !== 303 && request.body != null && request.body.source == null) return Promise.resolve(makeNetworkError());
		if ([301, 302].includes(actualResponse.status) && request.method === "POST" || actualResponse.status === 303 && !GET_OR_HEAD.includes(request.method)) {
			request.method = "GET";
			request.body = null;
			for (const headerName of requestBodyHeader) request.headersList.delete(headerName);
		}
		if (!sameOrigin(requestCurrentURL(request), locationURL)) {
			request.headersList.delete("authorization", true);
			request.headersList.delete("proxy-authorization", true);
			request.headersList.delete("cookie", true);
			request.headersList.delete("host", true);
		}
		if (request.body != null) {
			assert$4(request.body.source != null);
			request.body = safelyExtractBody(request.body.source)[0];
		}
		const timingInfo = fetchParams.timingInfo;
		timingInfo.redirectEndTime = timingInfo.postRedirectStartTime = coarsenedSharedCurrentTime(fetchParams.crossOriginIsolatedCapability);
		if (timingInfo.redirectStartTime === 0) timingInfo.redirectStartTime = timingInfo.startTime;
		request.urlList.push(locationURL);
		setRequestReferrerPolicyOnRedirect(request, actualResponse);
		return mainFetch(fetchParams, true);
	}
	async function httpNetworkOrCacheFetch(fetchParams, isAuthenticationFetch = false, isNewConnectionFetch = false) {
		const request = fetchParams.request;
		let httpFetchParams = null;
		let httpRequest = null;
		let response = null;
		if (request.window === "no-window" && request.redirect === "error") {
			httpFetchParams = fetchParams;
			httpRequest = request;
		} else {
			httpRequest = cloneRequest(request);
			httpFetchParams = { ...fetchParams };
			httpFetchParams.request = httpRequest;
		}
		const includeCredentials = request.credentials === "include" || request.credentials === "same-origin" && request.responseTainting === "basic";
		const contentLength = httpRequest.body ? httpRequest.body.length : null;
		let contentLengthHeaderValue = null;
		if (httpRequest.body == null && ["POST", "PUT"].includes(httpRequest.method)) contentLengthHeaderValue = "0";
		if (contentLength != null) contentLengthHeaderValue = isomorphicEncode(`${contentLength}`);
		if (contentLengthHeaderValue != null) httpRequest.headersList.append("content-length", contentLengthHeaderValue, true);
		if (contentLength != null && httpRequest.keepalive) {}
		if (httpRequest.referrer instanceof URL) httpRequest.headersList.append("referer", isomorphicEncode(httpRequest.referrer.href), true);
		appendRequestOriginHeader(httpRequest);
		appendFetchMetadata(httpRequest);
		if (!httpRequest.headersList.contains("user-agent", true)) httpRequest.headersList.append("user-agent", defaultUserAgent);
		if (httpRequest.cache === "default" && (httpRequest.headersList.contains("if-modified-since", true) || httpRequest.headersList.contains("if-none-match", true) || httpRequest.headersList.contains("if-unmodified-since", true) || httpRequest.headersList.contains("if-match", true) || httpRequest.headersList.contains("if-range", true))) httpRequest.cache = "no-store";
		if (httpRequest.cache === "no-cache" && !httpRequest.preventNoCacheCacheControlHeaderModification && !httpRequest.headersList.contains("cache-control", true)) httpRequest.headersList.append("cache-control", "max-age=0", true);
		if (httpRequest.cache === "no-store" || httpRequest.cache === "reload") {
			if (!httpRequest.headersList.contains("pragma", true)) httpRequest.headersList.append("pragma", "no-cache", true);
			if (!httpRequest.headersList.contains("cache-control", true)) httpRequest.headersList.append("cache-control", "no-cache", true);
		}
		if (httpRequest.headersList.contains("range", true)) httpRequest.headersList.append("accept-encoding", "identity", true);
		if (!httpRequest.headersList.contains("accept-encoding", true)) if (urlHasHttpsScheme(requestCurrentURL(httpRequest))) httpRequest.headersList.append("accept-encoding", "br, gzip, deflate", true);
		else httpRequest.headersList.append("accept-encoding", "gzip, deflate", true);
		httpRequest.headersList.delete("host", true);
		if (includeCredentials) {}
		httpRequest.cache = "no-store";
		if (httpRequest.cache !== "no-store" && httpRequest.cache !== "reload") {}
		if (response == null) {
			if (httpRequest.cache === "only-if-cached") return makeNetworkError("only if cached");
			const forwardResponse = await httpNetworkFetch(httpFetchParams, includeCredentials, isNewConnectionFetch);
			if (!safeMethodsSet.has(httpRequest.method) && forwardResponse.status >= 200 && forwardResponse.status <= 399) {}
			if (response == null) response = forwardResponse;
		}
		response.urlList = [...httpRequest.urlList];
		if (httpRequest.headersList.contains("range", true)) response.rangeRequested = true;
		response.requestIncludesCredentials = includeCredentials;
		if (response.status === 407) {
			if (request.window === "no-window") return makeNetworkError();
			if (isCancelled(fetchParams)) return makeAppropriateNetworkError(fetchParams);
			return makeNetworkError("proxy authentication required");
		}
		if (response.status === 421 && !isNewConnectionFetch && (request.body == null || request.body.source != null)) {
			if (isCancelled(fetchParams)) return makeAppropriateNetworkError(fetchParams);
			fetchParams.controller.connection.destroy();
			response = await httpNetworkOrCacheFetch(fetchParams, isAuthenticationFetch, true);
		}
		if (isAuthenticationFetch) {}
		return response;
	}
	async function httpNetworkFetch(fetchParams, includeCredentials = false, forceNewConnection = false) {
		assert$4(!fetchParams.controller.connection || fetchParams.controller.connection.destroyed);
		fetchParams.controller.connection = {
			abort: null,
			destroyed: false,
			destroy(err, abort = true) {
				if (!this.destroyed) {
					this.destroyed = true;
					if (abort) this.abort?.(err ?? new DOMException("The operation was aborted.", "AbortError"));
				}
			}
		};
		const request = fetchParams.request;
		let response = null;
		const timingInfo = fetchParams.timingInfo;
		request.cache = "no-store";
		if (request.mode === "websocket") {}
		let requestBody = null;
		if (request.body == null && fetchParams.processRequestEndOfBody) queueMicrotask(() => fetchParams.processRequestEndOfBody());
		else if (request.body != null) {
			const processBodyChunk = async function* (bytes) {
				if (isCancelled(fetchParams)) return;
				yield bytes;
				fetchParams.processRequestBodyChunkLength?.(bytes.byteLength);
			};
			const processEndOfBody = () => {
				if (isCancelled(fetchParams)) return;
				if (fetchParams.processRequestEndOfBody) fetchParams.processRequestEndOfBody();
			};
			const processBodyError = (e) => {
				if (isCancelled(fetchParams)) return;
				if (e.name === "AbortError") fetchParams.controller.abort();
				else fetchParams.controller.terminate(e);
			};
			requestBody = (async function* () {
				try {
					for await (const bytes of request.body.stream) yield* processBodyChunk(bytes);
					processEndOfBody();
				} catch (err) {
					processBodyError(err);
				}
			})();
		}
		try {
			const { body, status, statusText, headersList, socket } = await dispatch({ body: requestBody });
			if (socket) response = makeResponse({
				status,
				statusText,
				headersList,
				socket
			});
			else {
				const iterator = body[Symbol.asyncIterator]();
				fetchParams.controller.next = () => iterator.next();
				response = makeResponse({
					status,
					statusText,
					headersList
				});
			}
		} catch (err) {
			if (err.name === "AbortError") {
				fetchParams.controller.connection.destroy();
				return makeAppropriateNetworkError(fetchParams, err);
			}
			return makeNetworkError(err);
		}
		const pullAlgorithm = async () => {
			await fetchParams.controller.resume();
		};
		const cancelAlgorithm = (reason) => {
			if (!isCancelled(fetchParams)) fetchParams.controller.abort(reason);
		};
		const stream = new ReadableStream({
			async start(controller) {
				fetchParams.controller.controller = controller;
			},
			async pull(controller) {
				await pullAlgorithm(controller);
			},
			async cancel(reason) {
				await cancelAlgorithm(reason);
			},
			type: "bytes"
		});
		response.body = {
			stream,
			source: null,
			length: null
		};
		fetchParams.controller.onAborted = onAborted;
		fetchParams.controller.on("terminated", onAborted);
		fetchParams.controller.resume = async () => {
			while (true) {
				let bytes;
				let isFailure;
				try {
					const { done, value } = await fetchParams.controller.next();
					if (isAborted(fetchParams)) break;
					bytes = done ? void 0 : value;
				} catch (err) {
					if (fetchParams.controller.ended && !timingInfo.encodedBodySize) bytes = void 0;
					else {
						bytes = err;
						isFailure = true;
					}
				}
				if (bytes === void 0) {
					readableStreamClose(fetchParams.controller.controller);
					finalizeResponse(fetchParams, response);
					return;
				}
				timingInfo.decodedBodySize += bytes?.byteLength ?? 0;
				if (isFailure) {
					fetchParams.controller.terminate(bytes);
					return;
				}
				const buffer = new Uint8Array(bytes);
				if (buffer.byteLength) fetchParams.controller.controller.enqueue(buffer);
				if (isErrored(stream)) {
					fetchParams.controller.terminate();
					return;
				}
				if (fetchParams.controller.controller.desiredSize <= 0) return;
			}
		};
		function onAborted(reason) {
			if (isAborted(fetchParams)) {
				response.aborted = true;
				if (isReadable(stream)) fetchParams.controller.controller.error(fetchParams.controller.serializedAbortReason);
			} else if (isReadable(stream)) fetchParams.controller.controller.error(new TypeError("terminated", { cause: isErrorLike(reason) ? reason : void 0 }));
			fetchParams.controller.connection.destroy();
		}
		return response;
		function dispatch({ body }) {
			const url = requestCurrentURL(request);
			/** @type {import('../..').Agent} */
			const agent = fetchParams.controller.dispatcher;
			return new Promise((resolve, reject) => agent.dispatch({
				path: url.pathname + url.search,
				origin: url.origin,
				method: request.method,
				body: agent.isMockActive ? request.body && (request.body.source || request.body.stream) : body,
				headers: request.headersList.entries,
				maxRedirections: 0,
				upgrade: request.mode === "websocket" ? "websocket" : void 0
			}, {
				body: null,
				abort: null,
				onConnect(abort) {
					const { connection } = fetchParams.controller;
					timingInfo.finalConnectionTimingInfo = clampAndCoarsenConnectionTimingInfo(void 0, timingInfo.postRedirectStartTime, fetchParams.crossOriginIsolatedCapability);
					if (connection.destroyed) abort(new DOMException("The operation was aborted.", "AbortError"));
					else {
						fetchParams.controller.on("terminated", abort);
						this.abort = connection.abort = abort;
					}
					timingInfo.finalNetworkRequestStartTime = coarsenedSharedCurrentTime(fetchParams.crossOriginIsolatedCapability);
				},
				onResponseStarted() {
					timingInfo.finalNetworkResponseStartTime = coarsenedSharedCurrentTime(fetchParams.crossOriginIsolatedCapability);
				},
				onHeaders(status, rawHeaders, resume, statusText) {
					if (status < 200) return;
					let location = "";
					const headersList = new HeadersList();
					for (let i = 0; i < rawHeaders.length; i += 2) headersList.append(bufferToLowerCasedHeaderName(rawHeaders[i]), rawHeaders[i + 1].toString("latin1"), true);
					location = headersList.get("location", true);
					this.body = new Readable({ read: resume });
					const decoders = [];
					const willFollow = location && request.redirect === "follow" && redirectStatusSet.has(status);
					if (request.method !== "HEAD" && request.method !== "CONNECT" && !nullBodyStatus.includes(status) && !willFollow) {
						const contentEncoding = headersList.get("content-encoding", true);
						/** @type {string[]} */
						const codings = contentEncoding ? contentEncoding.toLowerCase().split(",") : [];
						const maxContentEncodings = 5;
						if (codings.length > maxContentEncodings) {
							reject(/* @__PURE__ */ new Error(`too many content-encodings in response: ${codings.length}, maximum allowed is ${maxContentEncodings}`));
							return true;
						}
						for (let i = codings.length - 1; i >= 0; --i) {
							const coding = codings[i].trim();
							if (coding === "x-gzip" || coding === "gzip") decoders.push(zlib.createGunzip({
								flush: zlib.constants.Z_SYNC_FLUSH,
								finishFlush: zlib.constants.Z_SYNC_FLUSH
							}));
							else if (coding === "deflate") decoders.push(createInflate({
								flush: zlib.constants.Z_SYNC_FLUSH,
								finishFlush: zlib.constants.Z_SYNC_FLUSH
							}));
							else if (coding === "br") decoders.push(zlib.createBrotliDecompress({
								flush: zlib.constants.BROTLI_OPERATION_FLUSH,
								finishFlush: zlib.constants.BROTLI_OPERATION_FLUSH
							}));
							else {
								decoders.length = 0;
								break;
							}
						}
					}
					const onError = this.onError.bind(this);
					resolve({
						status,
						statusText,
						headersList,
						body: decoders.length ? pipeline$1(this.body, ...decoders, (err) => {
							if (err) this.onError(err);
						}).on("error", onError) : this.body.on("error", onError)
					});
					return true;
				},
				onData(chunk) {
					if (fetchParams.controller.dump) return;
					const bytes = chunk;
					timingInfo.encodedBodySize += bytes.byteLength;
					return this.body.push(bytes);
				},
				onComplete() {
					if (this.abort) fetchParams.controller.off("terminated", this.abort);
					if (fetchParams.controller.onAborted) fetchParams.controller.off("terminated", fetchParams.controller.onAborted);
					fetchParams.controller.ended = true;
					this.body.push(null);
				},
				onError(error) {
					if (this.abort) fetchParams.controller.off("terminated", this.abort);
					this.body?.destroy(error);
					fetchParams.controller.terminate(error);
					reject(error);
				},
				onUpgrade(status, rawHeaders, socket) {
					if (status !== 101) return;
					const headersList = new HeadersList();
					for (let i = 0; i < rawHeaders.length; i += 2) headersList.append(bufferToLowerCasedHeaderName(rawHeaders[i]), rawHeaders[i + 1].toString("latin1"), true);
					resolve({
						status,
						statusText: STATUS_CODES[status],
						headersList,
						socket
					});
					return true;
				}
			}));
		}
	}
	module.exports = {
		fetch,
		Fetch,
		fetching,
		finalizeAndReportTiming
	};
}));
//#endregion
//#region node_modules/.pnpm/undici@6.28.0/node_modules/undici/lib/web/fileapi/symbols.js
var require_symbols$2 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = {
		kState: Symbol("FileReader state"),
		kResult: Symbol("FileReader result"),
		kError: Symbol("FileReader error"),
		kLastProgressEventFired: Symbol("FileReader last progress event fired timestamp"),
		kEvents: Symbol("FileReader events"),
		kAborted: Symbol("FileReader aborted")
	};
}));
//#endregion
//#region node_modules/.pnpm/undici@6.28.0/node_modules/undici/lib/web/fileapi/progressevent.js
var require_progressevent = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const { webidl } = require_webidl();
	const kState = Symbol("ProgressEvent state");
	/**
	* @see https://xhr.spec.whatwg.org/#progressevent
	*/
	var ProgressEvent = class ProgressEvent extends Event {
		constructor(type, eventInitDict = {}) {
			type = webidl.converters.DOMString(type, "ProgressEvent constructor", "type");
			eventInitDict = webidl.converters.ProgressEventInit(eventInitDict ?? {});
			super(type, eventInitDict);
			this[kState] = {
				lengthComputable: eventInitDict.lengthComputable,
				loaded: eventInitDict.loaded,
				total: eventInitDict.total
			};
		}
		get lengthComputable() {
			webidl.brandCheck(this, ProgressEvent);
			return this[kState].lengthComputable;
		}
		get loaded() {
			webidl.brandCheck(this, ProgressEvent);
			return this[kState].loaded;
		}
		get total() {
			webidl.brandCheck(this, ProgressEvent);
			return this[kState].total;
		}
	};
	webidl.converters.ProgressEventInit = webidl.dictionaryConverter([
		{
			key: "lengthComputable",
			converter: webidl.converters.boolean,
			defaultValue: () => false
		},
		{
			key: "loaded",
			converter: webidl.converters["unsigned long long"],
			defaultValue: () => 0
		},
		{
			key: "total",
			converter: webidl.converters["unsigned long long"],
			defaultValue: () => 0
		},
		{
			key: "bubbles",
			converter: webidl.converters.boolean,
			defaultValue: () => false
		},
		{
			key: "cancelable",
			converter: webidl.converters.boolean,
			defaultValue: () => false
		},
		{
			key: "composed",
			converter: webidl.converters.boolean,
			defaultValue: () => false
		}
	]);
	module.exports = { ProgressEvent };
}));
//#endregion
//#region node_modules/.pnpm/undici@6.28.0/node_modules/undici/lib/web/fileapi/encoding.js
var require_encoding = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* @see https://encoding.spec.whatwg.org/#concept-encoding-get
	* @param {string|undefined} label
	*/
	function getEncoding(label) {
		if (!label) return "failure";
		switch (label.trim().toLowerCase()) {
			case "unicode-1-1-utf-8":
			case "unicode11utf8":
			case "unicode20utf8":
			case "utf-8":
			case "utf8":
			case "x-unicode20utf8": return "UTF-8";
			case "866":
			case "cp866":
			case "csibm866":
			case "ibm866": return "IBM866";
			case "csisolatin2":
			case "iso-8859-2":
			case "iso-ir-101":
			case "iso8859-2":
			case "iso88592":
			case "iso_8859-2":
			case "iso_8859-2:1987":
			case "l2":
			case "latin2": return "ISO-8859-2";
			case "csisolatin3":
			case "iso-8859-3":
			case "iso-ir-109":
			case "iso8859-3":
			case "iso88593":
			case "iso_8859-3":
			case "iso_8859-3:1988":
			case "l3":
			case "latin3": return "ISO-8859-3";
			case "csisolatin4":
			case "iso-8859-4":
			case "iso-ir-110":
			case "iso8859-4":
			case "iso88594":
			case "iso_8859-4":
			case "iso_8859-4:1988":
			case "l4":
			case "latin4": return "ISO-8859-4";
			case "csisolatincyrillic":
			case "cyrillic":
			case "iso-8859-5":
			case "iso-ir-144":
			case "iso8859-5":
			case "iso88595":
			case "iso_8859-5":
			case "iso_8859-5:1988": return "ISO-8859-5";
			case "arabic":
			case "asmo-708":
			case "csiso88596e":
			case "csiso88596i":
			case "csisolatinarabic":
			case "ecma-114":
			case "iso-8859-6":
			case "iso-8859-6-e":
			case "iso-8859-6-i":
			case "iso-ir-127":
			case "iso8859-6":
			case "iso88596":
			case "iso_8859-6":
			case "iso_8859-6:1987": return "ISO-8859-6";
			case "csisolatingreek":
			case "ecma-118":
			case "elot_928":
			case "greek":
			case "greek8":
			case "iso-8859-7":
			case "iso-ir-126":
			case "iso8859-7":
			case "iso88597":
			case "iso_8859-7":
			case "iso_8859-7:1987":
			case "sun_eu_greek": return "ISO-8859-7";
			case "csiso88598e":
			case "csisolatinhebrew":
			case "hebrew":
			case "iso-8859-8":
			case "iso-8859-8-e":
			case "iso-ir-138":
			case "iso8859-8":
			case "iso88598":
			case "iso_8859-8":
			case "iso_8859-8:1988":
			case "visual": return "ISO-8859-8";
			case "csiso88598i":
			case "iso-8859-8-i":
			case "logical": return "ISO-8859-8-I";
			case "csisolatin6":
			case "iso-8859-10":
			case "iso-ir-157":
			case "iso8859-10":
			case "iso885910":
			case "l6":
			case "latin6": return "ISO-8859-10";
			case "iso-8859-13":
			case "iso8859-13":
			case "iso885913": return "ISO-8859-13";
			case "iso-8859-14":
			case "iso8859-14":
			case "iso885914": return "ISO-8859-14";
			case "csisolatin9":
			case "iso-8859-15":
			case "iso8859-15":
			case "iso885915":
			case "iso_8859-15":
			case "l9": return "ISO-8859-15";
			case "iso-8859-16": return "ISO-8859-16";
			case "cskoi8r":
			case "koi":
			case "koi8":
			case "koi8-r":
			case "koi8_r": return "KOI8-R";
			case "koi8-ru":
			case "koi8-u": return "KOI8-U";
			case "csmacintosh":
			case "mac":
			case "macintosh":
			case "x-mac-roman": return "macintosh";
			case "iso-8859-11":
			case "iso8859-11":
			case "iso885911":
			case "tis-620":
			case "windows-874": return "windows-874";
			case "cp1250":
			case "windows-1250":
			case "x-cp1250": return "windows-1250";
			case "cp1251":
			case "windows-1251":
			case "x-cp1251": return "windows-1251";
			case "ansi_x3.4-1968":
			case "ascii":
			case "cp1252":
			case "cp819":
			case "csisolatin1":
			case "ibm819":
			case "iso-8859-1":
			case "iso-ir-100":
			case "iso8859-1":
			case "iso88591":
			case "iso_8859-1":
			case "iso_8859-1:1987":
			case "l1":
			case "latin1":
			case "us-ascii":
			case "windows-1252":
			case "x-cp1252": return "windows-1252";
			case "cp1253":
			case "windows-1253":
			case "x-cp1253": return "windows-1253";
			case "cp1254":
			case "csisolatin5":
			case "iso-8859-9":
			case "iso-ir-148":
			case "iso8859-9":
			case "iso88599":
			case "iso_8859-9":
			case "iso_8859-9:1989":
			case "l5":
			case "latin5":
			case "windows-1254":
			case "x-cp1254": return "windows-1254";
			case "cp1255":
			case "windows-1255":
			case "x-cp1255": return "windows-1255";
			case "cp1256":
			case "windows-1256":
			case "x-cp1256": return "windows-1256";
			case "cp1257":
			case "windows-1257":
			case "x-cp1257": return "windows-1257";
			case "cp1258":
			case "windows-1258":
			case "x-cp1258": return "windows-1258";
			case "x-mac-cyrillic":
			case "x-mac-ukrainian": return "x-mac-cyrillic";
			case "chinese":
			case "csgb2312":
			case "csiso58gb231280":
			case "gb2312":
			case "gb_2312":
			case "gb_2312-80":
			case "gbk":
			case "iso-ir-58":
			case "x-gbk": return "GBK";
			case "gb18030": return "gb18030";
			case "big5":
			case "big5-hkscs":
			case "cn-big5":
			case "csbig5":
			case "x-x-big5": return "Big5";
			case "cseucpkdfmtjapanese":
			case "euc-jp":
			case "x-euc-jp": return "EUC-JP";
			case "csiso2022jp":
			case "iso-2022-jp": return "ISO-2022-JP";
			case "csshiftjis":
			case "ms932":
			case "ms_kanji":
			case "shift-jis":
			case "shift_jis":
			case "sjis":
			case "windows-31j":
			case "x-sjis": return "Shift_JIS";
			case "cseuckr":
			case "csksc56011987":
			case "euc-kr":
			case "iso-ir-149":
			case "korean":
			case "ks_c_5601-1987":
			case "ks_c_5601-1989":
			case "ksc5601":
			case "ksc_5601":
			case "windows-949": return "EUC-KR";
			case "csiso2022kr":
			case "hz-gb-2312":
			case "iso-2022-cn":
			case "iso-2022-cn-ext":
			case "iso-2022-kr":
			case "replacement": return "replacement";
			case "unicodefffe":
			case "utf-16be": return "UTF-16BE";
			case "csunicode":
			case "iso-10646-ucs-2":
			case "ucs-2":
			case "unicode":
			case "unicodefeff":
			case "utf-16":
			case "utf-16le": return "UTF-16LE";
			case "x-user-defined": return "x-user-defined";
			default: return "failure";
		}
	}
	module.exports = { getEncoding };
}));
//#endregion
//#region node_modules/.pnpm/undici@6.28.0/node_modules/undici/lib/web/fileapi/util.js
var require_util$4 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const { kState, kError, kResult, kAborted, kLastProgressEventFired } = require_symbols$2();
	const { ProgressEvent } = require_progressevent();
	const { getEncoding } = require_encoding();
	const { serializeAMimeType, parseMIMEType } = require_data_url();
	const { types: types$1 } = __require("node:util");
	const { StringDecoder } = __require("string_decoder");
	const { btoa } = __require("node:buffer");
	/** @type {PropertyDescriptor} */
	const staticPropertyDescriptors = {
		enumerable: true,
		writable: false,
		configurable: false
	};
	/**
	* @see https://w3c.github.io/FileAPI/#readOperation
	* @param {import('./filereader').FileReader} fr
	* @param {import('buffer').Blob} blob
	* @param {string} type
	* @param {string?} encodingName
	*/
	function readOperation(fr, blob, type, encodingName) {
		if (fr[kState] === "loading") throw new DOMException("Invalid state", "InvalidStateError");
		fr[kState] = "loading";
		fr[kResult] = null;
		fr[kError] = null;
		const reader = blob.stream().getReader();
		/** @type {Uint8Array[]} */
		const bytes = [];
		let chunkPromise = reader.read();
		let isFirstChunk = true;
		(async () => {
			while (!fr[kAborted]) try {
				const { done, value } = await chunkPromise;
				if (isFirstChunk && !fr[kAborted]) queueMicrotask(() => {
					fireAProgressEvent("loadstart", fr);
				});
				isFirstChunk = false;
				if (!done && types$1.isUint8Array(value)) {
					bytes.push(value);
					if ((fr[kLastProgressEventFired] === void 0 || Date.now() - fr[kLastProgressEventFired] >= 50) && !fr[kAborted]) {
						fr[kLastProgressEventFired] = Date.now();
						queueMicrotask(() => {
							fireAProgressEvent("progress", fr);
						});
					}
					chunkPromise = reader.read();
				} else if (done) {
					queueMicrotask(() => {
						fr[kState] = "done";
						try {
							const result = packageData(bytes, type, blob.type, encodingName);
							if (fr[kAborted]) return;
							fr[kResult] = result;
							fireAProgressEvent("load", fr);
						} catch (error) {
							fr[kError] = error;
							fireAProgressEvent("error", fr);
						}
						if (fr[kState] !== "loading") fireAProgressEvent("loadend", fr);
					});
					break;
				}
			} catch (error) {
				if (fr[kAborted]) return;
				queueMicrotask(() => {
					fr[kState] = "done";
					fr[kError] = error;
					fireAProgressEvent("error", fr);
					if (fr[kState] !== "loading") fireAProgressEvent("loadend", fr);
				});
				break;
			}
		})();
	}
	/**
	* @see https://w3c.github.io/FileAPI/#fire-a-progress-event
	* @see https://dom.spec.whatwg.org/#concept-event-fire
	* @param {string} e The name of the event
	* @param {import('./filereader').FileReader} reader
	*/
	function fireAProgressEvent(e, reader) {
		const event = new ProgressEvent(e, {
			bubbles: false,
			cancelable: false
		});
		reader.dispatchEvent(event);
	}
	/**
	* @see https://w3c.github.io/FileAPI/#blob-package-data
	* @param {Uint8Array[]} bytes
	* @param {string} type
	* @param {string?} mimeType
	* @param {string?} encodingName
	*/
	function packageData(bytes, type, mimeType, encodingName) {
		switch (type) {
			case "DataURL": {
				let dataURL = "data:";
				const parsed = parseMIMEType(mimeType || "application/octet-stream");
				if (parsed !== "failure") dataURL += serializeAMimeType(parsed);
				dataURL += ";base64,";
				const decoder = new StringDecoder("latin1");
				for (const chunk of bytes) dataURL += btoa(decoder.write(chunk));
				dataURL += btoa(decoder.end());
				return dataURL;
			}
			case "Text": {
				let encoding = "failure";
				if (encodingName) encoding = getEncoding(encodingName);
				if (encoding === "failure" && mimeType) {
					const type = parseMIMEType(mimeType);
					if (type !== "failure") encoding = getEncoding(type.parameters.get("charset"));
				}
				if (encoding === "failure") encoding = "UTF-8";
				return decode(bytes, encoding);
			}
			case "ArrayBuffer": return combineByteSequences(bytes).buffer;
			case "BinaryString": {
				let binaryString = "";
				const decoder = new StringDecoder("latin1");
				for (const chunk of bytes) binaryString += decoder.write(chunk);
				binaryString += decoder.end();
				return binaryString;
			}
		}
	}
	/**
	* @see https://encoding.spec.whatwg.org/#decode
	* @param {Uint8Array[]} ioQueue
	* @param {string} encoding
	*/
	function decode(ioQueue, encoding) {
		const bytes = combineByteSequences(ioQueue);
		const BOMEncoding = BOMSniffing(bytes);
		let slice = 0;
		if (BOMEncoding !== null) {
			encoding = BOMEncoding;
			slice = BOMEncoding === "UTF-8" ? 3 : 2;
		}
		const sliced = bytes.slice(slice);
		return new TextDecoder(encoding).decode(sliced);
	}
	/**
	* @see https://encoding.spec.whatwg.org/#bom-sniff
	* @param {Uint8Array} ioQueue
	*/
	function BOMSniffing(ioQueue) {
		const [a, b, c] = ioQueue;
		if (a === 239 && b === 187 && c === 191) return "UTF-8";
		else if (a === 254 && b === 255) return "UTF-16BE";
		else if (a === 255 && b === 254) return "UTF-16LE";
		return null;
	}
	/**
	* @param {Uint8Array[]} sequences
	*/
	function combineByteSequences(sequences) {
		const size = sequences.reduce((a, b) => {
			return a + b.byteLength;
		}, 0);
		let offset = 0;
		return sequences.reduce((a, b) => {
			a.set(b, offset);
			offset += b.byteLength;
			return a;
		}, new Uint8Array(size));
	}
	module.exports = {
		staticPropertyDescriptors,
		readOperation,
		fireAProgressEvent
	};
}));
//#endregion
//#region node_modules/.pnpm/undici@6.28.0/node_modules/undici/lib/web/fileapi/filereader.js
var require_filereader = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const { staticPropertyDescriptors, readOperation, fireAProgressEvent } = require_util$4();
	const { kState, kError, kResult, kEvents, kAborted } = require_symbols$2();
	const { webidl } = require_webidl();
	const { kEnumerableProperty } = require_util$7();
	var FileReader = class FileReader extends EventTarget {
		constructor() {
			super();
			this[kState] = "empty";
			this[kResult] = null;
			this[kError] = null;
			this[kEvents] = {
				loadend: null,
				error: null,
				abort: null,
				load: null,
				progress: null,
				loadstart: null
			};
		}
		/**
		* @see https://w3c.github.io/FileAPI/#dfn-readAsArrayBuffer
		* @param {import('buffer').Blob} blob
		*/
		readAsArrayBuffer(blob) {
			webidl.brandCheck(this, FileReader);
			webidl.argumentLengthCheck(arguments, 1, "FileReader.readAsArrayBuffer");
			blob = webidl.converters.Blob(blob, { strict: false });
			readOperation(this, blob, "ArrayBuffer");
		}
		/**
		* @see https://w3c.github.io/FileAPI/#readAsBinaryString
		* @param {import('buffer').Blob} blob
		*/
		readAsBinaryString(blob) {
			webidl.brandCheck(this, FileReader);
			webidl.argumentLengthCheck(arguments, 1, "FileReader.readAsBinaryString");
			blob = webidl.converters.Blob(blob, { strict: false });
			readOperation(this, blob, "BinaryString");
		}
		/**
		* @see https://w3c.github.io/FileAPI/#readAsDataText
		* @param {import('buffer').Blob} blob
		* @param {string?} encoding
		*/
		readAsText(blob, encoding = void 0) {
			webidl.brandCheck(this, FileReader);
			webidl.argumentLengthCheck(arguments, 1, "FileReader.readAsText");
			blob = webidl.converters.Blob(blob, { strict: false });
			if (encoding !== void 0) encoding = webidl.converters.DOMString(encoding, "FileReader.readAsText", "encoding");
			readOperation(this, blob, "Text", encoding);
		}
		/**
		* @see https://w3c.github.io/FileAPI/#dfn-readAsDataURL
		* @param {import('buffer').Blob} blob
		*/
		readAsDataURL(blob) {
			webidl.brandCheck(this, FileReader);
			webidl.argumentLengthCheck(arguments, 1, "FileReader.readAsDataURL");
			blob = webidl.converters.Blob(blob, { strict: false });
			readOperation(this, blob, "DataURL");
		}
		/**
		* @see https://w3c.github.io/FileAPI/#dfn-abort
		*/
		abort() {
			if (this[kState] === "empty" || this[kState] === "done") {
				this[kResult] = null;
				return;
			}
			if (this[kState] === "loading") {
				this[kState] = "done";
				this[kResult] = null;
			}
			this[kAborted] = true;
			fireAProgressEvent("abort", this);
			if (this[kState] !== "loading") fireAProgressEvent("loadend", this);
		}
		/**
		* @see https://w3c.github.io/FileAPI/#dom-filereader-readystate
		*/
		get readyState() {
			webidl.brandCheck(this, FileReader);
			switch (this[kState]) {
				case "empty": return this.EMPTY;
				case "loading": return this.LOADING;
				case "done": return this.DONE;
			}
		}
		/**
		* @see https://w3c.github.io/FileAPI/#dom-filereader-result
		*/
		get result() {
			webidl.brandCheck(this, FileReader);
			return this[kResult];
		}
		/**
		* @see https://w3c.github.io/FileAPI/#dom-filereader-error
		*/
		get error() {
			webidl.brandCheck(this, FileReader);
			return this[kError];
		}
		get onloadend() {
			webidl.brandCheck(this, FileReader);
			return this[kEvents].loadend;
		}
		set onloadend(fn) {
			webidl.brandCheck(this, FileReader);
			if (this[kEvents].loadend) this.removeEventListener("loadend", this[kEvents].loadend);
			if (typeof fn === "function") {
				this[kEvents].loadend = fn;
				this.addEventListener("loadend", fn);
			} else this[kEvents].loadend = null;
		}
		get onerror() {
			webidl.brandCheck(this, FileReader);
			return this[kEvents].error;
		}
		set onerror(fn) {
			webidl.brandCheck(this, FileReader);
			if (this[kEvents].error) this.removeEventListener("error", this[kEvents].error);
			if (typeof fn === "function") {
				this[kEvents].error = fn;
				this.addEventListener("error", fn);
			} else this[kEvents].error = null;
		}
		get onloadstart() {
			webidl.brandCheck(this, FileReader);
			return this[kEvents].loadstart;
		}
		set onloadstart(fn) {
			webidl.brandCheck(this, FileReader);
			if (this[kEvents].loadstart) this.removeEventListener("loadstart", this[kEvents].loadstart);
			if (typeof fn === "function") {
				this[kEvents].loadstart = fn;
				this.addEventListener("loadstart", fn);
			} else this[kEvents].loadstart = null;
		}
		get onprogress() {
			webidl.brandCheck(this, FileReader);
			return this[kEvents].progress;
		}
		set onprogress(fn) {
			webidl.brandCheck(this, FileReader);
			if (this[kEvents].progress) this.removeEventListener("progress", this[kEvents].progress);
			if (typeof fn === "function") {
				this[kEvents].progress = fn;
				this.addEventListener("progress", fn);
			} else this[kEvents].progress = null;
		}
		get onload() {
			webidl.brandCheck(this, FileReader);
			return this[kEvents].load;
		}
		set onload(fn) {
			webidl.brandCheck(this, FileReader);
			if (this[kEvents].load) this.removeEventListener("load", this[kEvents].load);
			if (typeof fn === "function") {
				this[kEvents].load = fn;
				this.addEventListener("load", fn);
			} else this[kEvents].load = null;
		}
		get onabort() {
			webidl.brandCheck(this, FileReader);
			return this[kEvents].abort;
		}
		set onabort(fn) {
			webidl.brandCheck(this, FileReader);
			if (this[kEvents].abort) this.removeEventListener("abort", this[kEvents].abort);
			if (typeof fn === "function") {
				this[kEvents].abort = fn;
				this.addEventListener("abort", fn);
			} else this[kEvents].abort = null;
		}
	};
	FileReader.EMPTY = FileReader.prototype.EMPTY = 0;
	FileReader.LOADING = FileReader.prototype.LOADING = 1;
	FileReader.DONE = FileReader.prototype.DONE = 2;
	Object.defineProperties(FileReader.prototype, {
		EMPTY: staticPropertyDescriptors,
		LOADING: staticPropertyDescriptors,
		DONE: staticPropertyDescriptors,
		readAsArrayBuffer: kEnumerableProperty,
		readAsBinaryString: kEnumerableProperty,
		readAsText: kEnumerableProperty,
		readAsDataURL: kEnumerableProperty,
		abort: kEnumerableProperty,
		readyState: kEnumerableProperty,
		result: kEnumerableProperty,
		error: kEnumerableProperty,
		onloadstart: kEnumerableProperty,
		onprogress: kEnumerableProperty,
		onload: kEnumerableProperty,
		onabort: kEnumerableProperty,
		onerror: kEnumerableProperty,
		onloadend: kEnumerableProperty,
		[Symbol.toStringTag]: {
			value: "FileReader",
			writable: false,
			enumerable: false,
			configurable: true
		}
	});
	Object.defineProperties(FileReader, {
		EMPTY: staticPropertyDescriptors,
		LOADING: staticPropertyDescriptors,
		DONE: staticPropertyDescriptors
	});
	module.exports = { FileReader };
}));
//#endregion
//#region node_modules/.pnpm/undici@6.28.0/node_modules/undici/lib/web/cache/symbols.js
var require_symbols$1 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = { kConstruct: require_symbols$4().kConstruct };
}));
//#endregion
//#region node_modules/.pnpm/undici@6.28.0/node_modules/undici/lib/web/cache/util.js
var require_util$3 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const assert$3 = __require("node:assert");
	const { URLSerializer } = require_data_url();
	const { isValidHeaderName } = require_util$6();
	/**
	* @see https://url.spec.whatwg.org/#concept-url-equals
	* @param {URL} A
	* @param {URL} B
	* @param {boolean | undefined} excludeFragment
	* @returns {boolean}
	*/
	function urlEquals(A, B, excludeFragment = false) {
		return URLSerializer(A, excludeFragment) === URLSerializer(B, excludeFragment);
	}
	/**
	* @see https://github.com/chromium/chromium/blob/694d20d134cb553d8d89e5500b9148012b1ba299/content/browser/cache_storage/cache_storage_cache.cc#L260-L262
	* @param {string} header
	*/
	function getFieldValues(header) {
		assert$3(header !== null);
		const values = [];
		for (let value of header.split(",")) {
			value = value.trim();
			if (isValidHeaderName(value)) values.push(value);
		}
		return values;
	}
	module.exports = {
		urlEquals,
		getFieldValues
	};
}));
//#endregion
//#region node_modules/.pnpm/undici@6.28.0/node_modules/undici/lib/web/cache/cache.js
var require_cache = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const { kConstruct } = require_symbols$1();
	const { urlEquals, getFieldValues } = require_util$3();
	const { kEnumerableProperty, isDisturbed } = require_util$7();
	const { webidl } = require_webidl();
	const { Response, cloneResponse, fromInnerResponse } = require_response();
	const { Request, fromInnerRequest } = require_request();
	const { kState } = require_symbols$3();
	const { fetching } = require_fetch();
	const { urlIsHttpHttpsScheme, createDeferredPromise, readAllBytes } = require_util$6();
	const assert$2 = __require("node:assert");
	/**
	* @see https://w3c.github.io/ServiceWorker/#dfn-cache-batch-operation
	* @typedef {Object} CacheBatchOperation
	* @property {'delete' | 'put'} type
	* @property {any} request
	* @property {any} response
	* @property {import('../../types/cache').CacheQueryOptions} options
	*/
	/**
	* @see https://w3c.github.io/ServiceWorker/#dfn-request-response-list
	* @typedef {[any, any][]} requestResponseList
	*/
	var Cache = class Cache {
		/**
		* @see https://w3c.github.io/ServiceWorker/#dfn-relevant-request-response-list
		* @type {requestResponseList}
		*/
		#relevantRequestResponseList;
		constructor() {
			if (arguments[0] !== kConstruct) webidl.illegalConstructor();
			webidl.util.markAsUncloneable(this);
			this.#relevantRequestResponseList = arguments[1];
		}
		async match(request, options = {}) {
			webidl.brandCheck(this, Cache);
			const prefix = "Cache.match";
			webidl.argumentLengthCheck(arguments, 1, prefix);
			request = webidl.converters.RequestInfo(request, prefix, "request");
			options = webidl.converters.CacheQueryOptions(options, prefix, "options");
			const p = this.#internalMatchAll(request, options, 1);
			if (p.length === 0) return;
			return p[0];
		}
		async matchAll(request = void 0, options = {}) {
			webidl.brandCheck(this, Cache);
			const prefix = "Cache.matchAll";
			if (request !== void 0) request = webidl.converters.RequestInfo(request, prefix, "request");
			options = webidl.converters.CacheQueryOptions(options, prefix, "options");
			return this.#internalMatchAll(request, options);
		}
		async add(request) {
			webidl.brandCheck(this, Cache);
			const prefix = "Cache.add";
			webidl.argumentLengthCheck(arguments, 1, prefix);
			request = webidl.converters.RequestInfo(request, prefix, "request");
			const requests = [request];
			return await this.addAll(requests);
		}
		async addAll(requests) {
			webidl.brandCheck(this, Cache);
			const prefix = "Cache.addAll";
			webidl.argumentLengthCheck(arguments, 1, prefix);
			const responsePromises = [];
			const requestList = [];
			for (let request of requests) {
				if (request === void 0) throw webidl.errors.conversionFailed({
					prefix,
					argument: "Argument 1",
					types: ["undefined is not allowed"]
				});
				request = webidl.converters.RequestInfo(request);
				if (typeof request === "string") continue;
				const r = request[kState];
				if (!urlIsHttpHttpsScheme(r.url) || r.method !== "GET") throw webidl.errors.exception({
					header: prefix,
					message: "Expected http/s scheme when method is not GET."
				});
			}
			/** @type {ReturnType<typeof fetching>[]} */
			const fetchControllers = [];
			for (const request of requests) {
				const r = new Request(request)[kState];
				if (!urlIsHttpHttpsScheme(r.url)) throw webidl.errors.exception({
					header: prefix,
					message: "Expected http/s scheme."
				});
				r.initiator = "fetch";
				r.destination = "subresource";
				requestList.push(r);
				const responsePromise = createDeferredPromise();
				fetchControllers.push(fetching({
					request: r,
					processResponse(response) {
						if (response.type === "error" || response.status === 206 || response.status < 200 || response.status > 299) responsePromise.reject(webidl.errors.exception({
							header: "Cache.addAll",
							message: "Received an invalid status code or the request failed."
						}));
						else if (response.headersList.contains("vary")) {
							const fieldValues = getFieldValues(response.headersList.get("vary"));
							for (const fieldValue of fieldValues) if (fieldValue === "*") {
								responsePromise.reject(webidl.errors.exception({
									header: "Cache.addAll",
									message: "invalid vary field value"
								}));
								for (const controller of fetchControllers) controller.abort();
								return;
							}
						}
					},
					processResponseEndOfBody(response) {
						if (response.aborted) {
							responsePromise.reject(new DOMException("aborted", "AbortError"));
							return;
						}
						responsePromise.resolve(response);
					}
				}));
				responsePromises.push(responsePromise.promise);
			}
			const responses = await Promise.all(responsePromises);
			const operations = [];
			let index = 0;
			for (const response of responses) {
				/** @type {CacheBatchOperation} */
				const operation = {
					type: "put",
					request: requestList[index],
					response
				};
				operations.push(operation);
				index++;
			}
			const cacheJobPromise = createDeferredPromise();
			let errorData = null;
			try {
				this.#batchCacheOperations(operations);
			} catch (e) {
				errorData = e;
			}
			queueMicrotask(() => {
				if (errorData === null) cacheJobPromise.resolve(void 0);
				else cacheJobPromise.reject(errorData);
			});
			return cacheJobPromise.promise;
		}
		async put(request, response) {
			webidl.brandCheck(this, Cache);
			const prefix = "Cache.put";
			webidl.argumentLengthCheck(arguments, 2, prefix);
			request = webidl.converters.RequestInfo(request, prefix, "request");
			response = webidl.converters.Response(response, prefix, "response");
			let innerRequest = null;
			if (request instanceof Request) innerRequest = request[kState];
			else innerRequest = new Request(request)[kState];
			if (!urlIsHttpHttpsScheme(innerRequest.url) || innerRequest.method !== "GET") throw webidl.errors.exception({
				header: prefix,
				message: "Expected an http/s scheme when method is not GET"
			});
			const innerResponse = response[kState];
			if (innerResponse.status === 206) throw webidl.errors.exception({
				header: prefix,
				message: "Got 206 status"
			});
			if (innerResponse.headersList.contains("vary")) {
				const fieldValues = getFieldValues(innerResponse.headersList.get("vary"));
				for (const fieldValue of fieldValues) if (fieldValue === "*") throw webidl.errors.exception({
					header: prefix,
					message: "Got * vary field value"
				});
			}
			if (innerResponse.body && (isDisturbed(innerResponse.body.stream) || innerResponse.body.stream.locked)) throw webidl.errors.exception({
				header: prefix,
				message: "Response body is locked or disturbed"
			});
			const clonedResponse = cloneResponse(innerResponse);
			const bodyReadPromise = createDeferredPromise();
			if (innerResponse.body != null) {
				const reader = innerResponse.body.stream.getReader();
				readAllBytes(reader).then(bodyReadPromise.resolve, bodyReadPromise.reject);
			} else bodyReadPromise.resolve(void 0);
			/** @type {CacheBatchOperation[]} */
			const operations = [];
			/** @type {CacheBatchOperation} */
			const operation = {
				type: "put",
				request: innerRequest,
				response: clonedResponse
			};
			operations.push(operation);
			const bytes = await bodyReadPromise.promise;
			if (clonedResponse.body != null) clonedResponse.body.source = bytes;
			const cacheJobPromise = createDeferredPromise();
			let errorData = null;
			try {
				this.#batchCacheOperations(operations);
			} catch (e) {
				errorData = e;
			}
			queueMicrotask(() => {
				if (errorData === null) cacheJobPromise.resolve();
				else cacheJobPromise.reject(errorData);
			});
			return cacheJobPromise.promise;
		}
		async delete(request, options = {}) {
			webidl.brandCheck(this, Cache);
			const prefix = "Cache.delete";
			webidl.argumentLengthCheck(arguments, 1, prefix);
			request = webidl.converters.RequestInfo(request, prefix, "request");
			options = webidl.converters.CacheQueryOptions(options, prefix, "options");
			/**
			* @type {Request}
			*/
			let r = null;
			if (request instanceof Request) {
				r = request[kState];
				if (r.method !== "GET" && !options.ignoreMethod) return false;
			} else {
				assert$2(typeof request === "string");
				r = new Request(request)[kState];
			}
			/** @type {CacheBatchOperation[]} */
			const operations = [];
			/** @type {CacheBatchOperation} */
			const operation = {
				type: "delete",
				request: r,
				options
			};
			operations.push(operation);
			const cacheJobPromise = createDeferredPromise();
			let errorData = null;
			let requestResponses;
			try {
				requestResponses = this.#batchCacheOperations(operations);
			} catch (e) {
				errorData = e;
			}
			queueMicrotask(() => {
				if (errorData === null) cacheJobPromise.resolve(!!requestResponses?.length);
				else cacheJobPromise.reject(errorData);
			});
			return cacheJobPromise.promise;
		}
		/**
		* @see https://w3c.github.io/ServiceWorker/#dom-cache-keys
		* @param {any} request
		* @param {import('../../types/cache').CacheQueryOptions} options
		* @returns {Promise<readonly Request[]>}
		*/
		async keys(request = void 0, options = {}) {
			webidl.brandCheck(this, Cache);
			const prefix = "Cache.keys";
			if (request !== void 0) request = webidl.converters.RequestInfo(request, prefix, "request");
			options = webidl.converters.CacheQueryOptions(options, prefix, "options");
			let r = null;
			if (request !== void 0) {
				if (request instanceof Request) {
					r = request[kState];
					if (r.method !== "GET" && !options.ignoreMethod) return [];
				} else if (typeof request === "string") r = new Request(request)[kState];
			}
			const promise = createDeferredPromise();
			const requests = [];
			if (request === void 0) for (const requestResponse of this.#relevantRequestResponseList) requests.push(requestResponse[0]);
			else {
				const requestResponses = this.#queryCache(r, options);
				for (const requestResponse of requestResponses) requests.push(requestResponse[0]);
			}
			queueMicrotask(() => {
				const requestList = [];
				for (const request of requests) {
					const requestObject = fromInnerRequest(request, new AbortController().signal, "immutable");
					requestList.push(requestObject);
				}
				promise.resolve(Object.freeze(requestList));
			});
			return promise.promise;
		}
		/**
		* @see https://w3c.github.io/ServiceWorker/#batch-cache-operations-algorithm
		* @param {CacheBatchOperation[]} operations
		* @returns {requestResponseList}
		*/
		#batchCacheOperations(operations) {
			const cache = this.#relevantRequestResponseList;
			const backupCache = [...cache];
			const addedItems = [];
			const resultList = [];
			try {
				for (const operation of operations) {
					if (operation.type !== "delete" && operation.type !== "put") throw webidl.errors.exception({
						header: "Cache.#batchCacheOperations",
						message: "operation type does not match \"delete\" or \"put\""
					});
					if (operation.type === "delete" && operation.response != null) throw webidl.errors.exception({
						header: "Cache.#batchCacheOperations",
						message: "delete operation should not have an associated response"
					});
					if (this.#queryCache(operation.request, operation.options, addedItems).length) throw new DOMException("???", "InvalidStateError");
					let requestResponses;
					if (operation.type === "delete") {
						requestResponses = this.#queryCache(operation.request, operation.options);
						if (requestResponses.length === 0) return [];
						for (const requestResponse of requestResponses) {
							const idx = cache.indexOf(requestResponse);
							assert$2(idx !== -1);
							cache.splice(idx, 1);
						}
					} else if (operation.type === "put") {
						if (operation.response == null) throw webidl.errors.exception({
							header: "Cache.#batchCacheOperations",
							message: "put operation should have an associated response"
						});
						const r = operation.request;
						if (!urlIsHttpHttpsScheme(r.url)) throw webidl.errors.exception({
							header: "Cache.#batchCacheOperations",
							message: "expected http or https scheme"
						});
						if (r.method !== "GET") throw webidl.errors.exception({
							header: "Cache.#batchCacheOperations",
							message: "not get method"
						});
						if (operation.options != null) throw webidl.errors.exception({
							header: "Cache.#batchCacheOperations",
							message: "options must not be defined"
						});
						requestResponses = this.#queryCache(operation.request);
						for (const requestResponse of requestResponses) {
							const idx = cache.indexOf(requestResponse);
							assert$2(idx !== -1);
							cache.splice(idx, 1);
						}
						cache.push([operation.request, operation.response]);
						addedItems.push([operation.request, operation.response]);
					}
					resultList.push([operation.request, operation.response]);
				}
				return resultList;
			} catch (e) {
				this.#relevantRequestResponseList.length = 0;
				this.#relevantRequestResponseList = backupCache;
				throw e;
			}
		}
		/**
		* @see https://w3c.github.io/ServiceWorker/#query-cache
		* @param {any} requestQuery
		* @param {import('../../types/cache').CacheQueryOptions} options
		* @param {requestResponseList} targetStorage
		* @returns {requestResponseList}
		*/
		#queryCache(requestQuery, options, targetStorage) {
			/** @type {requestResponseList} */
			const resultList = [];
			const storage = targetStorage ?? this.#relevantRequestResponseList;
			for (const requestResponse of storage) {
				const [cachedRequest, cachedResponse] = requestResponse;
				if (this.#requestMatchesCachedItem(requestQuery, cachedRequest, cachedResponse, options)) resultList.push(requestResponse);
			}
			return resultList;
		}
		/**
		* @see https://w3c.github.io/ServiceWorker/#request-matches-cached-item-algorithm
		* @param {any} requestQuery
		* @param {any} request
		* @param {any | null} response
		* @param {import('../../types/cache').CacheQueryOptions | undefined} options
		* @returns {boolean}
		*/
		#requestMatchesCachedItem(requestQuery, request, response = null, options) {
			const queryURL = new URL(requestQuery.url);
			const cachedURL = new URL(request.url);
			if (options?.ignoreSearch) {
				cachedURL.search = "";
				queryURL.search = "";
			}
			if (!urlEquals(queryURL, cachedURL, true)) return false;
			if (response == null || options?.ignoreVary || !response.headersList.contains("vary")) return true;
			const fieldValues = getFieldValues(response.headersList.get("vary"));
			for (const fieldValue of fieldValues) {
				if (fieldValue === "*") return false;
				if (request.headersList.get(fieldValue) !== requestQuery.headersList.get(fieldValue)) return false;
			}
			return true;
		}
		#internalMatchAll(request, options, maxResponses = Infinity) {
			let r = null;
			if (request !== void 0) {
				if (request instanceof Request) {
					r = request[kState];
					if (r.method !== "GET" && !options.ignoreMethod) return [];
				} else if (typeof request === "string") r = new Request(request)[kState];
			}
			const responses = [];
			if (request === void 0) for (const requestResponse of this.#relevantRequestResponseList) responses.push(requestResponse[1]);
			else {
				const requestResponses = this.#queryCache(r, options);
				for (const requestResponse of requestResponses) responses.push(requestResponse[1]);
			}
			const responseList = [];
			for (const response of responses) {
				const responseObject = fromInnerResponse(response, "immutable");
				responseList.push(responseObject.clone());
				if (responseList.length >= maxResponses) break;
			}
			return Object.freeze(responseList);
		}
	};
	Object.defineProperties(Cache.prototype, {
		[Symbol.toStringTag]: {
			value: "Cache",
			configurable: true
		},
		match: kEnumerableProperty,
		matchAll: kEnumerableProperty,
		add: kEnumerableProperty,
		addAll: kEnumerableProperty,
		put: kEnumerableProperty,
		delete: kEnumerableProperty,
		keys: kEnumerableProperty
	});
	const cacheQueryOptionConverters = [
		{
			key: "ignoreSearch",
			converter: webidl.converters.boolean,
			defaultValue: () => false
		},
		{
			key: "ignoreMethod",
			converter: webidl.converters.boolean,
			defaultValue: () => false
		},
		{
			key: "ignoreVary",
			converter: webidl.converters.boolean,
			defaultValue: () => false
		}
	];
	webidl.converters.CacheQueryOptions = webidl.dictionaryConverter(cacheQueryOptionConverters);
	webidl.converters.MultiCacheQueryOptions = webidl.dictionaryConverter([...cacheQueryOptionConverters, {
		key: "cacheName",
		converter: webidl.converters.DOMString
	}]);
	webidl.converters.Response = webidl.interfaceConverter(Response);
	webidl.converters["sequence<RequestInfo>"] = webidl.sequenceConverter(webidl.converters.RequestInfo);
	module.exports = { Cache };
}));
//#endregion
//#region node_modules/.pnpm/undici@6.28.0/node_modules/undici/lib/web/cache/cachestorage.js
var require_cachestorage = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const { kConstruct } = require_symbols$1();
	const { Cache } = require_cache();
	const { webidl } = require_webidl();
	const { kEnumerableProperty } = require_util$7();
	var CacheStorage = class CacheStorage {
		/**
		* @see https://w3c.github.io/ServiceWorker/#dfn-relevant-name-to-cache-map
		* @type {Map<string, import('./cache').requestResponseList}
		*/
		#caches = /* @__PURE__ */ new Map();
		constructor() {
			if (arguments[0] !== kConstruct) webidl.illegalConstructor();
			webidl.util.markAsUncloneable(this);
		}
		async match(request, options = {}) {
			webidl.brandCheck(this, CacheStorage);
			webidl.argumentLengthCheck(arguments, 1, "CacheStorage.match");
			request = webidl.converters.RequestInfo(request);
			options = webidl.converters.MultiCacheQueryOptions(options);
			if (options.cacheName != null) {
				if (this.#caches.has(options.cacheName)) {
					const cacheList = this.#caches.get(options.cacheName);
					return await new Cache(kConstruct, cacheList).match(request, options);
				}
			} else for (const cacheList of this.#caches.values()) {
				const response = await new Cache(kConstruct, cacheList).match(request, options);
				if (response !== void 0) return response;
			}
		}
		/**
		* @see https://w3c.github.io/ServiceWorker/#cache-storage-has
		* @param {string} cacheName
		* @returns {Promise<boolean>}
		*/
		async has(cacheName) {
			webidl.brandCheck(this, CacheStorage);
			const prefix = "CacheStorage.has";
			webidl.argumentLengthCheck(arguments, 1, prefix);
			cacheName = webidl.converters.DOMString(cacheName, prefix, "cacheName");
			return this.#caches.has(cacheName);
		}
		/**
		* @see https://w3c.github.io/ServiceWorker/#dom-cachestorage-open
		* @param {string} cacheName
		* @returns {Promise<Cache>}
		*/
		async open(cacheName) {
			webidl.brandCheck(this, CacheStorage);
			const prefix = "CacheStorage.open";
			webidl.argumentLengthCheck(arguments, 1, prefix);
			cacheName = webidl.converters.DOMString(cacheName, prefix, "cacheName");
			if (this.#caches.has(cacheName)) {
				const cache = this.#caches.get(cacheName);
				return new Cache(kConstruct, cache);
			}
			const cache = [];
			this.#caches.set(cacheName, cache);
			return new Cache(kConstruct, cache);
		}
		/**
		* @see https://w3c.github.io/ServiceWorker/#cache-storage-delete
		* @param {string} cacheName
		* @returns {Promise<boolean>}
		*/
		async delete(cacheName) {
			webidl.brandCheck(this, CacheStorage);
			const prefix = "CacheStorage.delete";
			webidl.argumentLengthCheck(arguments, 1, prefix);
			cacheName = webidl.converters.DOMString(cacheName, prefix, "cacheName");
			return this.#caches.delete(cacheName);
		}
		/**
		* @see https://w3c.github.io/ServiceWorker/#cache-storage-keys
		* @returns {Promise<string[]>}
		*/
		async keys() {
			webidl.brandCheck(this, CacheStorage);
			return [...this.#caches.keys()];
		}
	};
	Object.defineProperties(CacheStorage.prototype, {
		[Symbol.toStringTag]: {
			value: "CacheStorage",
			configurable: true
		},
		match: kEnumerableProperty,
		has: kEnumerableProperty,
		open: kEnumerableProperty,
		delete: kEnumerableProperty,
		keys: kEnumerableProperty
	});
	module.exports = { CacheStorage };
}));
//#endregion
//#region node_modules/.pnpm/undici@6.28.0/node_modules/undici/lib/web/cookies/constants.js
var require_constants$1 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = {
		maxAttributeValueSize: 1024,
		maxNameValuePairSize: 4096
	};
}));
//#endregion
//#region node_modules/.pnpm/undici@6.28.0/node_modules/undici/lib/web/cookies/util.js
var require_util$2 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* @param {string} value
	* @returns {boolean}
	*/
	function isCTLExcludingHtab(value) {
		for (let i = 0; i < value.length; ++i) {
			const code = value.charCodeAt(i);
			if (code >= 0 && code <= 8 || code >= 10 && code <= 31 || code === 127) return true;
		}
		return false;
	}
	/**
	CHAR           = <any US-ASCII character (octets 0 - 127)>
	token          = 1*<any CHAR except CTLs or separators>
	separators     = "(" | ")" | "<" | ">" | "@"
	| "," | ";" | ":" | "\" | <">
	| "/" | "[" | "]" | "?" | "="
	| "{" | "}" | SP | HT
	* @param {string} name
	*/
	function validateCookieName(name) {
		for (let i = 0; i < name.length; ++i) {
			const code = name.charCodeAt(i);
			if (code < 33 || code > 126 || code === 34 || code === 40 || code === 41 || code === 60 || code === 62 || code === 64 || code === 44 || code === 59 || code === 58 || code === 92 || code === 47 || code === 91 || code === 93 || code === 63 || code === 61 || code === 123 || code === 125) throw new Error("Invalid cookie name");
		}
	}
	/**
	cookie-value      = *cookie-octet / ( DQUOTE *cookie-octet DQUOTE )
	cookie-octet      = %x21 / %x23-2B / %x2D-3A / %x3C-5B / %x5D-7E
	; US-ASCII characters excluding CTLs,
	; whitespace DQUOTE, comma, semicolon,
	; and backslash
	* @param {string} value
	*/
	function validateCookieValue(value) {
		let len = value.length;
		let i = 0;
		if (value[0] === "\"") {
			if (len === 1 || value[len - 1] !== "\"") throw new Error("Invalid cookie value");
			--len;
			++i;
		}
		while (i < len) {
			const code = value.charCodeAt(i++);
			if (code < 33 || code > 126 || code === 34 || code === 44 || code === 59 || code === 92) throw new Error("Invalid cookie value");
		}
	}
	/**
	* path-value        = <any CHAR except CTLs or ";">
	* @param {string} path
	*/
	function validateCookiePath(path) {
		for (let i = 0; i < path.length; ++i) {
			const code = path.charCodeAt(i);
			if (code < 32 || code > 126 || code === 59) throw new Error("Invalid cookie path");
		}
	}
	/**
	* <let-dig> ::= <letter> | <digit>
	*
	* <letter> ::= any one of the 52 alphabetic characters A through Z in
	* upper case and a through z in lower case
	*
	* <digit> ::= any one of the ten digits 0 through 9r
	*
	* @see https://www.rfc-editor.org/rfc/rfc1034#section-3.5
	* @param {number} code
	*/
	function isLetterOrDigit(code) {
		return code >= 48 && code <= 57 || code >= 65 && code <= 90 || code >= 97 && code <= 122;
	}
	/**
	* Validates a cookie domain against the "preferred name syntax".
	*
	* <domain>      ::= <subdomain> | " "
	* <subdomain>   ::= <label> | <subdomain> "." <label>
	* <label>       ::= <let-dig> [ [ <ldh-str> ] <let-dig> ]
	* <ldh-str>     ::= <let-dig-hyp> | <let-dig-hyp> <ldh-str>
	* <let-dig-hyp> ::= <let-dig> | "-"
	*
	* @see https://www.rfc-editor.org/rfc/rfc1034#section-3.5
	* @see https://www.rfc-editor.org/rfc/rfc1123#section-2.1
	* @see https://www.rfc-editor.org/rfc/rfc1035#section-2.3.4
	* @param {string} domain
	*/
	function validateCookieDomain(domain) {
		if (domain === " ") return;
		if (domain.length > 255) throw new Error("Invalid cookie domain");
		let labelLength = 0;
		for (let i = 0; i < domain.length; ++i) {
			const code = domain.charCodeAt(i);
			if (code === 46) {
				if (labelLength === 0) throw new Error("Invalid cookie domain");
				if (domain.charCodeAt(i - 1) === 45) throw new Error("Invalid cookie domain");
				labelLength = 0;
				continue;
			}
			if (labelLength === 0 && !isLetterOrDigit(code)) throw new Error("Invalid cookie domain");
			if (!isLetterOrDigit(code) && code !== 45) throw new Error("Invalid cookie domain");
			if (++labelLength > 63) throw new Error("Invalid cookie domain");
		}
		if (labelLength === 0 || domain.charCodeAt(domain.length - 1) === 45) throw new Error("Invalid cookie domain");
	}
	const IMFDays = [
		"Sun",
		"Mon",
		"Tue",
		"Wed",
		"Thu",
		"Fri",
		"Sat"
	];
	const IMFMonths = [
		"Jan",
		"Feb",
		"Mar",
		"Apr",
		"May",
		"Jun",
		"Jul",
		"Aug",
		"Sep",
		"Oct",
		"Nov",
		"Dec"
	];
	const IMFPaddedNumbers = Array(61).fill(0).map((_, i) => i.toString().padStart(2, "0"));
	/**
	* @see https://www.rfc-editor.org/rfc/rfc7231#section-7.1.1.1
	* @param {number|Date} date
	IMF-fixdate  = day-name "," SP date1 SP time-of-day SP GMT
	; fixed length/zone/capitalization subset of the format
	; see Section 3.3 of [RFC5322]
	
	day-name     = %x4D.6F.6E ; "Mon", case-sensitive
	/ %x54.75.65 ; "Tue", case-sensitive
	/ %x57.65.64 ; "Wed", case-sensitive
	/ %x54.68.75 ; "Thu", case-sensitive
	/ %x46.72.69 ; "Fri", case-sensitive
	/ %x53.61.74 ; "Sat", case-sensitive
	/ %x53.75.6E ; "Sun", case-sensitive
	date1        = day SP month SP year
	; e.g., 02 Jun 1982
	
	day          = 2DIGIT
	month        = %x4A.61.6E ; "Jan", case-sensitive
	/ %x46.65.62 ; "Feb", case-sensitive
	/ %x4D.61.72 ; "Mar", case-sensitive
	/ %x41.70.72 ; "Apr", case-sensitive
	/ %x4D.61.79 ; "May", case-sensitive
	/ %x4A.75.6E ; "Jun", case-sensitive
	/ %x4A.75.6C ; "Jul", case-sensitive
	/ %x41.75.67 ; "Aug", case-sensitive
	/ %x53.65.70 ; "Sep", case-sensitive
	/ %x4F.63.74 ; "Oct", case-sensitive
	/ %x4E.6F.76 ; "Nov", case-sensitive
	/ %x44.65.63 ; "Dec", case-sensitive
	year         = 4DIGIT
	
	GMT          = %x47.4D.54 ; "GMT", case-sensitive
	
	time-of-day  = hour ":" minute ":" second
	; 00:00:00 - 23:59:60 (leap second)
	
	hour         = 2DIGIT
	minute       = 2DIGIT
	second       = 2DIGIT
	*/
	function toIMFDate(date) {
		if (typeof date === "number") date = new Date(date);
		return `${IMFDays[date.getUTCDay()]}, ${IMFPaddedNumbers[date.getUTCDate()]} ${IMFMonths[date.getUTCMonth()]} ${date.getUTCFullYear()} ${IMFPaddedNumbers[date.getUTCHours()]}:${IMFPaddedNumbers[date.getUTCMinutes()]}:${IMFPaddedNumbers[date.getUTCSeconds()]} GMT`;
	}
	/**
	max-age-av        = "Max-Age=" non-zero-digit *DIGIT
	; In practice, both expires-av and max-age-av
	; are limited to dates representable by the
	; user agent.
	* @param {number} maxAge
	*/
	function validateCookieMaxAge(maxAge) {
		if (maxAge < 0) throw new Error("Invalid cookie max-age");
	}
	/**
	* @see https://www.rfc-editor.org/rfc/rfc6265#section-4.1.1
	* @param {import('./index').Cookie} cookie
	*/
	function stringify(cookie) {
		if (cookie.name.length === 0) return null;
		validateCookieName(cookie.name);
		validateCookieValue(cookie.value);
		const out = [`${cookie.name}=${cookie.value}`];
		if (cookie.name.startsWith("__Secure-")) cookie.secure = true;
		if (cookie.name.startsWith("__Host-")) {
			cookie.secure = true;
			cookie.domain = null;
			cookie.path = "/";
		}
		if (cookie.secure) out.push("Secure");
		if (cookie.httpOnly) out.push("HttpOnly");
		if (typeof cookie.maxAge === "number") {
			validateCookieMaxAge(cookie.maxAge);
			out.push(`Max-Age=${cookie.maxAge}`);
		}
		if (cookie.domain) {
			validateCookieDomain(cookie.domain);
			out.push(`Domain=${cookie.domain}`);
		}
		if (cookie.path) {
			validateCookiePath(cookie.path);
			out.push(`Path=${cookie.path}`);
		}
		if (cookie.expires && cookie.expires.toString() !== "Invalid Date") out.push(`Expires=${toIMFDate(cookie.expires)}`);
		if (cookie.sameSite) out.push(`SameSite=${cookie.sameSite}`);
		for (const part of cookie.unparsed) {
			if (!part.includes("=")) throw new Error("Invalid unparsed");
			const [key, ...value] = part.split("=");
			const trimmedKey = key.trim();
			const joinedValue = value.join("=");
			validateCookieName(trimmedKey);
			validateCookieValue(joinedValue);
			out.push(`${trimmedKey}=${joinedValue}`);
		}
		return out.join("; ");
	}
	module.exports = {
		isCTLExcludingHtab,
		validateCookieName,
		validateCookiePath,
		validateCookieValue,
		toIMFDate,
		stringify
	};
}));
//#endregion
//#region node_modules/.pnpm/undici@6.28.0/node_modules/undici/lib/web/cookies/parse.js
var require_parse = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const { maxNameValuePairSize, maxAttributeValueSize } = require_constants$1();
	const { isCTLExcludingHtab } = require_util$2();
	const { collectASequenceOfCodePointsFast } = require_data_url();
	const assert$1 = __require("node:assert");
	/**
	* @description Parses the field-value attributes of a set-cookie header string.
	* @see https://datatracker.ietf.org/doc/html/draft-ietf-httpbis-rfc6265bis#section-5.4
	* @param {string} header
	* @returns if the header is invalid, null will be returned
	*/
	function parseSetCookie(header) {
		if (isCTLExcludingHtab(header)) return null;
		let nameValuePair = "";
		let unparsedAttributes = "";
		let name = "";
		let value = "";
		if (header.includes(";")) {
			const position = { position: 0 };
			nameValuePair = collectASequenceOfCodePointsFast(";", header, position);
			unparsedAttributes = header.slice(position.position);
		} else nameValuePair = header;
		if (!nameValuePair.includes("=")) value = nameValuePair;
		else {
			const position = { position: 0 };
			name = collectASequenceOfCodePointsFast("=", nameValuePair, position);
			value = nameValuePair.slice(position.position + 1);
		}
		name = name.trim();
		value = value.trim();
		if (name.length + value.length > maxNameValuePairSize) return null;
		return {
			name,
			value,
			...parseUnparsedAttributes(unparsedAttributes)
		};
	}
	/**
	* Parses the remaining attributes of a set-cookie header
	* @see https://datatracker.ietf.org/doc/html/draft-ietf-httpbis-rfc6265bis#section-5.4
	* @param {string} unparsedAttributes
	* @param {[Object.<string, unknown>]={}} cookieAttributeList
	*/
	function parseUnparsedAttributes(unparsedAttributes, cookieAttributeList = {}) {
		if (unparsedAttributes.length === 0) return cookieAttributeList;
		assert$1(unparsedAttributes[0] === ";");
		unparsedAttributes = unparsedAttributes.slice(1);
		let cookieAv = "";
		if (unparsedAttributes.includes(";")) {
			cookieAv = collectASequenceOfCodePointsFast(";", unparsedAttributes, { position: 0 });
			unparsedAttributes = unparsedAttributes.slice(cookieAv.length);
		} else {
			cookieAv = unparsedAttributes;
			unparsedAttributes = "";
		}
		let attributeName = "";
		let attributeValue = "";
		if (cookieAv.includes("=")) {
			const position = { position: 0 };
			attributeName = collectASequenceOfCodePointsFast("=", cookieAv, position);
			attributeValue = cookieAv.slice(position.position + 1);
		} else attributeName = cookieAv;
		attributeName = attributeName.trim();
		attributeValue = attributeValue.trim();
		if (attributeValue.length > maxAttributeValueSize) return parseUnparsedAttributes(unparsedAttributes, cookieAttributeList);
		const attributeNameLowercase = attributeName.toLowerCase();
		if (attributeNameLowercase === "expires") cookieAttributeList.expires = new Date(attributeValue);
		else if (attributeNameLowercase === "max-age") {
			const charCode = attributeValue.charCodeAt(0);
			if ((charCode < 48 || charCode > 57) && attributeValue[0] !== "-") return parseUnparsedAttributes(unparsedAttributes, cookieAttributeList);
			if (!/^\d+$/.test(attributeValue)) return parseUnparsedAttributes(unparsedAttributes, cookieAttributeList);
			cookieAttributeList.maxAge = Number(attributeValue);
		} else if (attributeNameLowercase === "domain") {
			let cookieDomain = attributeValue;
			if (cookieDomain[0] === ".") cookieDomain = cookieDomain.slice(1);
			cookieDomain = cookieDomain.toLowerCase();
			cookieAttributeList.domain = cookieDomain;
		} else if (attributeNameLowercase === "path") {
			let cookiePath = "";
			if (attributeValue.length === 0 || attributeValue[0] !== "/") cookiePath = "/";
			else cookiePath = attributeValue;
			cookieAttributeList.path = cookiePath;
		} else if (attributeNameLowercase === "secure") cookieAttributeList.secure = true;
		else if (attributeNameLowercase === "httponly") cookieAttributeList.httpOnly = true;
		else if (attributeNameLowercase === "samesite") {
			const attributeValueLowercase = attributeValue.toLowerCase();
			if (attributeValueLowercase === "none") cookieAttributeList.sameSite = "None";
			else if (attributeValueLowercase === "strict") cookieAttributeList.sameSite = "Strict";
			else if (attributeValueLowercase === "lax") cookieAttributeList.sameSite = "Lax";
		} else {
			cookieAttributeList.unparsed ??= [];
			cookieAttributeList.unparsed.push(`${attributeName}=${attributeValue}`);
		}
		return parseUnparsedAttributes(unparsedAttributes, cookieAttributeList);
	}
	module.exports = {
		parseSetCookie,
		parseUnparsedAttributes
	};
}));
//#endregion
//#region node_modules/.pnpm/undici@6.28.0/node_modules/undici/lib/web/cookies/index.js
var require_cookies = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const { parseSetCookie } = require_parse();
	const { stringify } = require_util$2();
	const { webidl } = require_webidl();
	const { Headers } = require_headers();
	/**
	* @typedef {Object} Cookie
	* @property {string} name
	* @property {string} value
	* @property {Date|number|undefined} expires
	* @property {number|undefined} maxAge
	* @property {string|undefined} domain
	* @property {string|undefined} path
	* @property {boolean|undefined} secure
	* @property {boolean|undefined} httpOnly
	* @property {'Strict'|'Lax'|'None'} sameSite
	* @property {string[]} unparsed
	*/
	/**
	* @param {Headers} headers
	* @returns {Record<string, string>}
	*/
	function getCookies(headers) {
		webidl.argumentLengthCheck(arguments, 1, "getCookies");
		webidl.brandCheck(headers, Headers, { strict: false });
		const cookie = headers.get("cookie");
		const out = {};
		if (!cookie) return out;
		for (const piece of cookie.split(";")) {
			const [name, ...value] = piece.split("=");
			out[name.trim()] = value.join("=");
		}
		return out;
	}
	/**
	* @param {Headers} headers
	* @param {string} name
	* @param {{ path?: string, domain?: string }|undefined} attributes
	* @returns {void}
	*/
	function deleteCookie(headers, name, attributes) {
		webidl.brandCheck(headers, Headers, { strict: false });
		const prefix = "deleteCookie";
		webidl.argumentLengthCheck(arguments, 2, prefix);
		name = webidl.converters.DOMString(name, prefix, "name");
		attributes = webidl.converters.DeleteCookieAttributes(attributes);
		setCookie(headers, {
			name,
			value: "",
			expires: /* @__PURE__ */ new Date(0),
			...attributes
		});
	}
	/**
	* @param {Headers} headers
	* @returns {Cookie[]}
	*/
	function getSetCookies(headers) {
		webidl.argumentLengthCheck(arguments, 1, "getSetCookies");
		webidl.brandCheck(headers, Headers, { strict: false });
		const cookies = headers.getSetCookie();
		if (!cookies) return [];
		return cookies.map((pair) => parseSetCookie(pair));
	}
	/**
	* @param {Headers} headers
	* @param {Cookie} cookie
	* @returns {void}
	*/
	function setCookie(headers, cookie) {
		webidl.argumentLengthCheck(arguments, 2, "setCookie");
		webidl.brandCheck(headers, Headers, { strict: false });
		cookie = webidl.converters.Cookie(cookie);
		const str = stringify(cookie);
		if (str) headers.append("Set-Cookie", str);
	}
	webidl.converters.DeleteCookieAttributes = webidl.dictionaryConverter([{
		converter: webidl.nullableConverter(webidl.converters.DOMString),
		key: "path",
		defaultValue: () => null
	}, {
		converter: webidl.nullableConverter(webidl.converters.DOMString),
		key: "domain",
		defaultValue: () => null
	}]);
	webidl.converters.Cookie = webidl.dictionaryConverter([
		{
			converter: webidl.converters.DOMString,
			key: "name"
		},
		{
			converter: webidl.converters.DOMString,
			key: "value"
		},
		{
			converter: webidl.nullableConverter((value) => {
				if (typeof value === "number") return webidl.converters["unsigned long long"](value);
				return new Date(value);
			}),
			key: "expires",
			defaultValue: () => null
		},
		{
			converter: webidl.nullableConverter(webidl.converters["long long"]),
			key: "maxAge",
			defaultValue: () => null
		},
		{
			converter: webidl.nullableConverter(webidl.converters.DOMString),
			key: "domain",
			defaultValue: () => null
		},
		{
			converter: webidl.nullableConverter(webidl.converters.DOMString),
			key: "path",
			defaultValue: () => null
		},
		{
			converter: webidl.nullableConverter(webidl.converters.boolean),
			key: "secure",
			defaultValue: () => null
		},
		{
			converter: webidl.nullableConverter(webidl.converters.boolean),
			key: "httpOnly",
			defaultValue: () => null
		},
		{
			converter: webidl.converters.USVString,
			key: "sameSite",
			allowedValues: [
				"Strict",
				"Lax",
				"None"
			]
		},
		{
			converter: webidl.sequenceConverter(webidl.converters.DOMString),
			key: "unparsed",
			defaultValue: () => new Array(0)
		}
	]);
	module.exports = {
		getCookies,
		deleteCookie,
		getSetCookies,
		setCookie
	};
}));
//#endregion
//#region node_modules/.pnpm/undici@6.28.0/node_modules/undici/lib/web/websocket/events.js
var require_events = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const { webidl } = require_webidl();
	const { kEnumerableProperty } = require_util$7();
	const { kConstruct } = require_symbols$4();
	const { MessagePort } = __require("node:worker_threads");
	/**
	* @see https://html.spec.whatwg.org/multipage/comms.html#messageevent
	*/
	var MessageEvent = class MessageEvent extends Event {
		#eventInit;
		constructor(type, eventInitDict = {}) {
			if (type === kConstruct) {
				super(arguments[1], arguments[2]);
				webidl.util.markAsUncloneable(this);
				return;
			}
			const prefix = "MessageEvent constructor";
			webidl.argumentLengthCheck(arguments, 1, prefix);
			type = webidl.converters.DOMString(type, prefix, "type");
			eventInitDict = webidl.converters.MessageEventInit(eventInitDict, prefix, "eventInitDict");
			super(type, eventInitDict);
			this.#eventInit = eventInitDict;
			webidl.util.markAsUncloneable(this);
		}
		get data() {
			webidl.brandCheck(this, MessageEvent);
			return this.#eventInit.data;
		}
		get origin() {
			webidl.brandCheck(this, MessageEvent);
			return this.#eventInit.origin;
		}
		get lastEventId() {
			webidl.brandCheck(this, MessageEvent);
			return this.#eventInit.lastEventId;
		}
		get source() {
			webidl.brandCheck(this, MessageEvent);
			return this.#eventInit.source;
		}
		get ports() {
			webidl.brandCheck(this, MessageEvent);
			if (!Object.isFrozen(this.#eventInit.ports)) Object.freeze(this.#eventInit.ports);
			return this.#eventInit.ports;
		}
		initMessageEvent(type, bubbles = false, cancelable = false, data = null, origin = "", lastEventId = "", source = null, ports = []) {
			webidl.brandCheck(this, MessageEvent);
			webidl.argumentLengthCheck(arguments, 1, "MessageEvent.initMessageEvent");
			return new MessageEvent(type, {
				bubbles,
				cancelable,
				data,
				origin,
				lastEventId,
				source,
				ports
			});
		}
		static createFastMessageEvent(type, init) {
			const messageEvent = new MessageEvent(kConstruct, type, init);
			messageEvent.#eventInit = init;
			messageEvent.#eventInit.data ??= null;
			messageEvent.#eventInit.origin ??= "";
			messageEvent.#eventInit.lastEventId ??= "";
			messageEvent.#eventInit.source ??= null;
			messageEvent.#eventInit.ports ??= [];
			return messageEvent;
		}
	};
	const { createFastMessageEvent } = MessageEvent;
	delete MessageEvent.createFastMessageEvent;
	/**
	* @see https://websockets.spec.whatwg.org/#the-closeevent-interface
	*/
	var CloseEvent = class CloseEvent extends Event {
		#eventInit;
		constructor(type, eventInitDict = {}) {
			const prefix = "CloseEvent constructor";
			webidl.argumentLengthCheck(arguments, 1, prefix);
			type = webidl.converters.DOMString(type, prefix, "type");
			eventInitDict = webidl.converters.CloseEventInit(eventInitDict);
			super(type, eventInitDict);
			this.#eventInit = eventInitDict;
			webidl.util.markAsUncloneable(this);
		}
		get wasClean() {
			webidl.brandCheck(this, CloseEvent);
			return this.#eventInit.wasClean;
		}
		get code() {
			webidl.brandCheck(this, CloseEvent);
			return this.#eventInit.code;
		}
		get reason() {
			webidl.brandCheck(this, CloseEvent);
			return this.#eventInit.reason;
		}
	};
	var ErrorEvent = class ErrorEvent extends Event {
		#eventInit;
		constructor(type, eventInitDict) {
			const prefix = "ErrorEvent constructor";
			webidl.argumentLengthCheck(arguments, 1, prefix);
			super(type, eventInitDict);
			webidl.util.markAsUncloneable(this);
			type = webidl.converters.DOMString(type, prefix, "type");
			eventInitDict = webidl.converters.ErrorEventInit(eventInitDict ?? {});
			this.#eventInit = eventInitDict;
		}
		get message() {
			webidl.brandCheck(this, ErrorEvent);
			return this.#eventInit.message;
		}
		get filename() {
			webidl.brandCheck(this, ErrorEvent);
			return this.#eventInit.filename;
		}
		get lineno() {
			webidl.brandCheck(this, ErrorEvent);
			return this.#eventInit.lineno;
		}
		get colno() {
			webidl.brandCheck(this, ErrorEvent);
			return this.#eventInit.colno;
		}
		get error() {
			webidl.brandCheck(this, ErrorEvent);
			return this.#eventInit.error;
		}
	};
	Object.defineProperties(MessageEvent.prototype, {
		[Symbol.toStringTag]: {
			value: "MessageEvent",
			configurable: true
		},
		data: kEnumerableProperty,
		origin: kEnumerableProperty,
		lastEventId: kEnumerableProperty,
		source: kEnumerableProperty,
		ports: kEnumerableProperty,
		initMessageEvent: kEnumerableProperty
	});
	Object.defineProperties(CloseEvent.prototype, {
		[Symbol.toStringTag]: {
			value: "CloseEvent",
			configurable: true
		},
		reason: kEnumerableProperty,
		code: kEnumerableProperty,
		wasClean: kEnumerableProperty
	});
	Object.defineProperties(ErrorEvent.prototype, {
		[Symbol.toStringTag]: {
			value: "ErrorEvent",
			configurable: true
		},
		message: kEnumerableProperty,
		filename: kEnumerableProperty,
		lineno: kEnumerableProperty,
		colno: kEnumerableProperty,
		error: kEnumerableProperty
	});
	webidl.converters.MessagePort = webidl.interfaceConverter(MessagePort);
	webidl.converters["sequence<MessagePort>"] = webidl.sequenceConverter(webidl.converters.MessagePort);
	const eventInit = [
		{
			key: "bubbles",
			converter: webidl.converters.boolean,
			defaultValue: () => false
		},
		{
			key: "cancelable",
			converter: webidl.converters.boolean,
			defaultValue: () => false
		},
		{
			key: "composed",
			converter: webidl.converters.boolean,
			defaultValue: () => false
		}
	];
	webidl.converters.MessageEventInit = webidl.dictionaryConverter([
		...eventInit,
		{
			key: "data",
			converter: webidl.converters.any,
			defaultValue: () => null
		},
		{
			key: "origin",
			converter: webidl.converters.USVString,
			defaultValue: () => ""
		},
		{
			key: "lastEventId",
			converter: webidl.converters.DOMString,
			defaultValue: () => ""
		},
		{
			key: "source",
			converter: webidl.nullableConverter(webidl.converters.MessagePort),
			defaultValue: () => null
		},
		{
			key: "ports",
			converter: webidl.converters["sequence<MessagePort>"],
			defaultValue: () => new Array(0)
		}
	]);
	webidl.converters.CloseEventInit = webidl.dictionaryConverter([
		...eventInit,
		{
			key: "wasClean",
			converter: webidl.converters.boolean,
			defaultValue: () => false
		},
		{
			key: "code",
			converter: webidl.converters["unsigned short"],
			defaultValue: () => 0
		},
		{
			key: "reason",
			converter: webidl.converters.USVString,
			defaultValue: () => ""
		}
	]);
	webidl.converters.ErrorEventInit = webidl.dictionaryConverter([
		...eventInit,
		{
			key: "message",
			converter: webidl.converters.DOMString,
			defaultValue: () => ""
		},
		{
			key: "filename",
			converter: webidl.converters.USVString,
			defaultValue: () => ""
		},
		{
			key: "lineno",
			converter: webidl.converters["unsigned long"],
			defaultValue: () => 0
		},
		{
			key: "colno",
			converter: webidl.converters["unsigned long"],
			defaultValue: () => 0
		},
		{
			key: "error",
			converter: webidl.converters.any
		}
	]);
	module.exports = {
		MessageEvent,
		CloseEvent,
		ErrorEvent,
		createFastMessageEvent
	};
}));
//#endregion
//#region node_modules/.pnpm/undici@6.28.0/node_modules/undici/lib/web/websocket/constants.js
var require_constants = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = {
		uid: "258EAFA5-E914-47DA-95CA-C5AB0DC85B11",
		sentCloseFrameState: {
			NOT_SENT: 0,
			PROCESSING: 1,
			SENT: 2
		},
		staticPropertyDescriptors: {
			enumerable: true,
			writable: false,
			configurable: false
		},
		states: {
			CONNECTING: 0,
			OPEN: 1,
			CLOSING: 2,
			CLOSED: 3
		},
		opcodes: {
			CONTINUATION: 0,
			TEXT: 1,
			BINARY: 2,
			CLOSE: 8,
			PING: 9,
			PONG: 10
		},
		maxUnsigned16Bit: 2 ** 16 - 1,
		parserStates: {
			INFO: 0,
			PAYLOADLENGTH_16: 2,
			PAYLOADLENGTH_64: 3,
			READ_DATA: 4
		},
		emptyBuffer: Buffer.allocUnsafe(0),
		sendHints: {
			string: 1,
			typedArray: 2,
			arrayBuffer: 3,
			blob: 4
		}
	};
}));
//#endregion
//#region node_modules/.pnpm/undici@6.28.0/node_modules/undici/lib/web/websocket/symbols.js
var require_symbols = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = {
		kWebSocketURL: Symbol("url"),
		kReadyState: Symbol("ready state"),
		kController: Symbol("controller"),
		kResponse: Symbol("response"),
		kBinaryType: Symbol("binary type"),
		kSentClose: Symbol("sent close"),
		kReceivedClose: Symbol("received close"),
		kByteParser: Symbol("byte parser")
	};
}));
//#endregion
//#region node_modules/.pnpm/undici@6.28.0/node_modules/undici/lib/web/websocket/util.js
var require_util$1 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const { kReadyState, kController, kResponse, kBinaryType, kWebSocketURL } = require_symbols();
	const { states, opcodes } = require_constants();
	const { ErrorEvent, createFastMessageEvent } = require_events();
	const { isUtf8 } = __require("node:buffer");
	const { collectASequenceOfCodePointsFast, removeHTTPWhitespace } = require_data_url();
	/**
	* @param {import('./websocket').WebSocket} ws
	* @returns {boolean}
	*/
	function isConnecting(ws) {
		return ws[kReadyState] === states.CONNECTING;
	}
	/**
	* @param {import('./websocket').WebSocket} ws
	* @returns {boolean}
	*/
	function isEstablished(ws) {
		return ws[kReadyState] === states.OPEN;
	}
	/**
	* @param {import('./websocket').WebSocket} ws
	* @returns {boolean}
	*/
	function isClosing(ws) {
		return ws[kReadyState] === states.CLOSING;
	}
	/**
	* @param {import('./websocket').WebSocket} ws
	* @returns {boolean}
	*/
	function isClosed(ws) {
		return ws[kReadyState] === states.CLOSED;
	}
	/**
	* @see https://dom.spec.whatwg.org/#concept-event-fire
	* @param {string} e
	* @param {EventTarget} target
	* @param {(...args: ConstructorParameters<typeof Event>) => Event} eventFactory
	* @param {EventInit | undefined} eventInitDict
	*/
	function fireEvent(e, target, eventFactory = (type, init) => new Event(type, init), eventInitDict = {}) {
		const event = eventFactory(e, eventInitDict);
		target.dispatchEvent(event);
	}
	/**
	* @see https://websockets.spec.whatwg.org/#feedback-from-the-protocol
	* @param {import('./websocket').WebSocket} ws
	* @param {number} type Opcode
	* @param {Buffer} data application data
	*/
	function websocketMessageReceived(ws, type, data) {
		if (ws[kReadyState] !== states.OPEN) return;
		let dataForEvent;
		if (type === opcodes.TEXT) try {
			dataForEvent = utf8Decode(data);
		} catch {
			failWebsocketConnection(ws, "Received invalid UTF-8 in text frame.");
			return;
		}
		else if (type === opcodes.BINARY) if (ws[kBinaryType] === "blob") dataForEvent = new Blob([data]);
		else dataForEvent = toArrayBuffer(data);
		fireEvent("message", ws, createFastMessageEvent, {
			origin: ws[kWebSocketURL].origin,
			data: dataForEvent
		});
	}
	function toArrayBuffer(buffer) {
		if (buffer.byteLength === buffer.buffer.byteLength) return buffer.buffer;
		return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
	}
	/**
	* @see https://datatracker.ietf.org/doc/html/rfc6455
	* @see https://datatracker.ietf.org/doc/html/rfc2616
	* @see https://bugs.chromium.org/p/chromium/issues/detail?id=398407
	* @param {string} protocol
	*/
	function isValidSubprotocol(protocol) {
		if (protocol.length === 0) return false;
		for (let i = 0; i < protocol.length; ++i) {
			const code = protocol.charCodeAt(i);
			if (code < 33 || code > 126 || code === 34 || code === 40 || code === 41 || code === 44 || code === 47 || code === 58 || code === 59 || code === 60 || code === 61 || code === 62 || code === 63 || code === 64 || code === 91 || code === 92 || code === 93 || code === 123 || code === 125) return false;
		}
		return true;
	}
	/**
	* @see https://datatracker.ietf.org/doc/html/rfc6455#section-7-4
	* @param {number} code
	*/
	function isValidStatusCode(code) {
		if (code >= 1e3 && code < 1015) return code !== 1004 && code !== 1005 && code !== 1006;
		return code >= 3e3 && code <= 4999;
	}
	/**
	* @param {import('./websocket').WebSocket} ws
	* @param {string|undefined} reason
	*/
	function failWebsocketConnection(ws, reason) {
		const { [kController]: controller, [kResponse]: response } = ws;
		controller.abort();
		if (response?.socket && !response.socket.destroyed) response.socket.destroy();
		if (reason) fireEvent("error", ws, (type, init) => new ErrorEvent(type, init), {
			error: new Error(reason),
			message: reason
		});
	}
	/**
	* @see https://datatracker.ietf.org/doc/html/rfc6455#section-5.5
	* @param {number} opcode
	*/
	function isControlFrame(opcode) {
		return opcode === opcodes.CLOSE || opcode === opcodes.PING || opcode === opcodes.PONG;
	}
	function isContinuationFrame(opcode) {
		return opcode === opcodes.CONTINUATION;
	}
	function isTextBinaryFrame(opcode) {
		return opcode === opcodes.TEXT || opcode === opcodes.BINARY;
	}
	function isValidOpcode(opcode) {
		return isTextBinaryFrame(opcode) || isContinuationFrame(opcode) || isControlFrame(opcode);
	}
	/**
	* Parses a Sec-WebSocket-Extensions header value.
	* @param {string} extensions
	* @returns {Map<string, string>}
	*/
	function parseExtensions(extensions) {
		const position = { position: 0 };
		const extensionList = /* @__PURE__ */ new Map();
		while (position.position < extensions.length) {
			const [name, value = ""] = collectASequenceOfCodePointsFast(";", extensions, position).split("=");
			extensionList.set(removeHTTPWhitespace(name, true, false), removeHTTPWhitespace(value, false, true));
			position.position++;
		}
		return extensionList;
	}
	/**
	* @see https://www.rfc-editor.org/rfc/rfc7692#section-7.1.2.2
	* @description "client-max-window-bits = 1*DIGIT"
	* @param {string} value
	*/
	function isValidClientWindowBits(value) {
		if (value.length === 0) return false;
		for (let i = 0; i < value.length; i++) {
			const byte = value.charCodeAt(i);
			if (byte < 48 || byte > 57) return false;
		}
		const num = Number.parseInt(value, 10);
		return num >= 8 && num <= 15;
	}
	const hasIntl = typeof process.versions.icu === "string";
	const fatalDecoder = hasIntl ? new TextDecoder("utf-8", { fatal: true }) : void 0;
	/**
	* Converts a Buffer to utf-8, even on platforms without icu.
	* @param {Buffer} buffer
	*/
	const utf8Decode = hasIntl ? fatalDecoder.decode.bind(fatalDecoder) : function(buffer) {
		if (isUtf8(buffer)) return buffer.toString("utf-8");
		throw new TypeError("Invalid utf-8 received.");
	};
	module.exports = {
		isConnecting,
		isEstablished,
		isClosing,
		isClosed,
		fireEvent,
		isValidSubprotocol,
		isValidStatusCode,
		failWebsocketConnection,
		websocketMessageReceived,
		utf8Decode,
		isControlFrame,
		isContinuationFrame,
		isTextBinaryFrame,
		isValidOpcode,
		parseExtensions,
		isValidClientWindowBits
	};
}));
//#endregion
//#region node_modules/.pnpm/undici@6.28.0/node_modules/undici/lib/web/websocket/frame.js
var require_frame = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const { maxUnsigned16Bit } = require_constants();
	const BUFFER_SIZE = 16386;
	/** @type {import('crypto')} */
	let crypto;
	let buffer = null;
	let bufIdx = BUFFER_SIZE;
	try {
		crypto = __require("node:crypto");
	} catch {
		crypto = { randomFillSync: function randomFillSync(buffer, _offset, _size) {
			for (let i = 0; i < buffer.length; ++i) buffer[i] = Math.random() * 255 | 0;
			return buffer;
		} };
	}
	function generateMask() {
		if (bufIdx === BUFFER_SIZE) {
			bufIdx = 0;
			crypto.randomFillSync(buffer ??= Buffer.allocUnsafe(BUFFER_SIZE), 0, BUFFER_SIZE);
		}
		return [
			buffer[bufIdx++],
			buffer[bufIdx++],
			buffer[bufIdx++],
			buffer[bufIdx++]
		];
	}
	var WebsocketFrameSend = class {
		/**
		* @param {Buffer|undefined} data
		*/
		constructor(data) {
			this.frameData = data;
		}
		createFrame(opcode) {
			const frameData = this.frameData;
			const maskKey = generateMask();
			const bodyLength = frameData?.byteLength ?? 0;
			/** @type {number} */
			let payloadLength = bodyLength;
			let offset = 6;
			if (bodyLength > maxUnsigned16Bit) {
				offset += 8;
				payloadLength = 127;
			} else if (bodyLength > 125) {
				offset += 2;
				payloadLength = 126;
			}
			const buffer = Buffer.allocUnsafe(bodyLength + offset);
			buffer[0] = buffer[1] = 0;
			buffer[0] |= 128;
			buffer[0] = (buffer[0] & 240) + opcode;
			/*! ws. MIT License. Einar Otto Stangvik <einaros@gmail.com> */
			buffer[offset - 4] = maskKey[0];
			buffer[offset - 3] = maskKey[1];
			buffer[offset - 2] = maskKey[2];
			buffer[offset - 1] = maskKey[3];
			buffer[1] = payloadLength;
			if (payloadLength === 126) buffer.writeUInt16BE(bodyLength, 2);
			else if (payloadLength === 127) {
				buffer[2] = buffer[3] = 0;
				buffer.writeUIntBE(bodyLength, 4, 6);
			}
			buffer[1] |= 128;
			for (let i = 0; i < bodyLength; ++i) buffer[offset + i] = frameData[i] ^ maskKey[i & 3];
			return buffer;
		}
	};
	module.exports = { WebsocketFrameSend };
}));
//#endregion
//#region node_modules/.pnpm/undici@6.28.0/node_modules/undici/lib/web/websocket/connection.js
var require_connection = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const { uid, states, sentCloseFrameState, emptyBuffer, opcodes } = require_constants();
	const { kReadyState, kSentClose, kByteParser, kReceivedClose, kResponse } = require_symbols();
	const { fireEvent, failWebsocketConnection, isClosing, isClosed, isEstablished, parseExtensions } = require_util$1();
	const { channels } = require_diagnostics();
	const { CloseEvent } = require_events();
	const { makeRequest } = require_request();
	const { fetching } = require_fetch();
	const { Headers, getHeadersList } = require_headers();
	const { getDecodeSplit } = require_util$6();
	const { WebsocketFrameSend } = require_frame();
	/** @type {import('crypto')} */
	let crypto;
	try {
		crypto = __require("node:crypto");
	} catch {}
	/**
	* @see https://websockets.spec.whatwg.org/#concept-websocket-establish
	* @param {URL} url
	* @param {string|string[]} protocols
	* @param {import('./websocket').WebSocket} ws
	* @param {(response: any, extensions: string[] | undefined) => void} onEstablish
	* @param {Partial<import('../../types/websocket').WebSocketInit>} options
	*/
	function establishWebSocketConnection(url, protocols, client, ws, onEstablish, options) {
		const requestURL = url;
		requestURL.protocol = url.protocol === "ws:" ? "http:" : "https:";
		const request = makeRequest({
			urlList: [requestURL],
			client,
			serviceWorkers: "none",
			referrer: "no-referrer",
			mode: "websocket",
			credentials: "include",
			cache: "no-store",
			redirect: "error"
		});
		if (options.headers) request.headersList = getHeadersList(new Headers(options.headers));
		const keyValue = crypto.randomBytes(16).toString("base64");
		request.headersList.append("sec-websocket-key", keyValue);
		request.headersList.append("sec-websocket-version", "13");
		for (const protocol of protocols) request.headersList.append("sec-websocket-protocol", protocol);
		request.headersList.append("sec-websocket-extensions", "permessage-deflate; client_max_window_bits");
		return fetching({
			request,
			useParallelQueue: true,
			dispatcher: options.dispatcher,
			processResponse(response) {
				if (response.type === "error" || response.status !== 101) {
					failWebsocketConnection(ws, "Received network error or non-101 status code.");
					return;
				}
				if (protocols.length !== 0 && !response.headersList.get("Sec-WebSocket-Protocol")) {
					failWebsocketConnection(ws, "Server did not respond with sent protocols.");
					return;
				}
				if (response.headersList.get("Upgrade")?.toLowerCase() !== "websocket") {
					failWebsocketConnection(ws, "Server did not set Upgrade header to \"websocket\".");
					return;
				}
				if (response.headersList.get("Connection")?.toLowerCase() !== "upgrade") {
					failWebsocketConnection(ws, "Server did not set Connection header to \"upgrade\".");
					return;
				}
				if (response.headersList.get("Sec-WebSocket-Accept") !== crypto.createHash("sha1").update(keyValue + uid).digest("base64")) {
					failWebsocketConnection(ws, "Incorrect hash received in Sec-WebSocket-Accept header.");
					return;
				}
				const secExtension = response.headersList.get("Sec-WebSocket-Extensions");
				let extensions;
				if (secExtension !== null) {
					extensions = parseExtensions(secExtension);
					if (!extensions.has("permessage-deflate")) {
						failWebsocketConnection(ws, "Sec-WebSocket-Extensions header does not match.");
						return;
					}
				}
				const secProtocol = response.headersList.get("Sec-WebSocket-Protocol");
				if (secProtocol !== null) {
					if (!getDecodeSplit("sec-websocket-protocol", request.headersList).includes(secProtocol)) {
						failWebsocketConnection(ws, "Protocol was not set in the opening handshake.");
						return;
					}
				}
				response.socket.on("data", onSocketData);
				response.socket.on("close", onSocketClose);
				response.socket.on("error", onSocketError);
				if (channels.open.hasSubscribers) channels.open.publish({
					address: response.socket.address(),
					protocol: secProtocol,
					extensions: secExtension
				});
				onEstablish(response, extensions);
			}
		});
	}
	function closeWebSocketConnection(ws, code, reason, reasonByteLength) {
		if (isClosing(ws) || isClosed(ws)) {} else if (!isEstablished(ws)) {
			failWebsocketConnection(ws, "Connection was closed before it was established.");
			ws[kReadyState] = states.CLOSING;
		} else if (ws[kSentClose] === sentCloseFrameState.NOT_SENT) {
			ws[kSentClose] = sentCloseFrameState.PROCESSING;
			const frame = new WebsocketFrameSend();
			if (code !== void 0 && reason === void 0) {
				frame.frameData = Buffer.allocUnsafe(2);
				frame.frameData.writeUInt16BE(code, 0);
			} else if (code !== void 0 && reason !== void 0) {
				frame.frameData = Buffer.allocUnsafe(2 + reasonByteLength);
				frame.frameData.writeUInt16BE(code, 0);
				frame.frameData.write(reason, 2, "utf-8");
			} else frame.frameData = emptyBuffer;
			ws[kResponse].socket.write(frame.createFrame(opcodes.CLOSE));
			ws[kSentClose] = sentCloseFrameState.SENT;
			ws[kReadyState] = states.CLOSING;
		} else ws[kReadyState] = states.CLOSING;
	}
	/**
	* @param {Buffer} chunk
	*/
	function onSocketData(chunk) {
		if (!this.ws[kByteParser].write(chunk)) this.pause();
	}
	/**
	* @see https://websockets.spec.whatwg.org/#feedback-from-the-protocol
	* @see https://datatracker.ietf.org/doc/html/rfc6455#section-7.1.4
	*/
	function onSocketClose() {
		const { ws } = this;
		const { [kResponse]: response } = ws;
		response.socket.off("data", onSocketData);
		response.socket.off("close", onSocketClose);
		response.socket.off("error", onSocketError);
		const wasClean = ws[kSentClose] === sentCloseFrameState.SENT && ws[kReceivedClose];
		let code = 1005;
		let reason = "";
		const result = ws[kByteParser].closingInfo;
		if (result && !result.error) {
			code = result.code ?? 1005;
			reason = result.reason;
		} else if (!ws[kReceivedClose]) code = 1006;
		ws[kReadyState] = states.CLOSED;
		fireEvent("close", ws, (type, init) => new CloseEvent(type, init), {
			wasClean,
			code,
			reason
		});
		if (channels.close.hasSubscribers) channels.close.publish({
			websocket: ws,
			code,
			reason
		});
	}
	function onSocketError(error) {
		const { ws } = this;
		ws[kReadyState] = states.CLOSING;
		if (channels.socketError.hasSubscribers) channels.socketError.publish(error);
		this.destroy();
	}
	module.exports = {
		establishWebSocketConnection,
		closeWebSocketConnection
	};
}));
//#endregion
//#region node_modules/.pnpm/undici@6.28.0/node_modules/undici/lib/web/websocket/permessage-deflate.js
var require_permessage_deflate = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const { createInflateRaw, Z_DEFAULT_WINDOWBITS } = __require("node:zlib");
	const { isValidClientWindowBits } = require_util$1();
	const { MessageSizeExceededError } = require_errors();
	const tail = Buffer.from([
		0,
		0,
		255,
		255
	]);
	const kBuffer = Symbol("kBuffer");
	const kLength = Symbol("kLength");
	var PerMessageDeflate = class {
		/** @type {import('node:zlib').InflateRaw} */
		#inflate;
		#options = {};
		#maxPayloadSize = 0;
		/**
		* @param {Map<string, string>} extensions
		*/
		constructor(extensions, options) {
			this.#options.serverNoContextTakeover = extensions.has("server_no_context_takeover");
			this.#options.serverMaxWindowBits = extensions.get("server_max_window_bits");
			this.#maxPayloadSize = options.maxPayloadSize;
		}
		/**
		* Decompress a compressed payload.
		* @param {Buffer} chunk Compressed data
		* @param {boolean} fin Final fragment flag
		* @param {Function} callback Callback function
		*/
		decompress(chunk, fin, callback) {
			if (!this.#inflate) {
				let windowBits = Z_DEFAULT_WINDOWBITS;
				if (this.#options.serverMaxWindowBits) {
					if (!isValidClientWindowBits(this.#options.serverMaxWindowBits)) {
						callback(/* @__PURE__ */ new Error("Invalid server_max_window_bits"));
						return;
					}
					windowBits = Number.parseInt(this.#options.serverMaxWindowBits);
				}
				try {
					this.#inflate = createInflateRaw({ windowBits });
				} catch (err) {
					callback(err);
					return;
				}
				this.#inflate[kBuffer] = [];
				this.#inflate[kLength] = 0;
				this.#inflate.on("data", (data) => {
					this.#inflate[kLength] += data.length;
					if (this.#maxPayloadSize > 0 && this.#inflate[kLength] > this.#maxPayloadSize) {
						callback(new MessageSizeExceededError());
						this.#inflate.removeAllListeners();
						this.#inflate = null;
						return;
					}
					this.#inflate[kBuffer].push(data);
				});
				this.#inflate.on("error", (err) => {
					this.#inflate = null;
					callback(err);
				});
			}
			this.#inflate.write(chunk);
			if (fin) this.#inflate.write(tail);
			this.#inflate.flush(() => {
				if (!this.#inflate) return;
				const full = Buffer.concat(this.#inflate[kBuffer], this.#inflate[kLength]);
				this.#inflate[kBuffer].length = 0;
				this.#inflate[kLength] = 0;
				callback(null, full);
			});
		}
	};
	module.exports = { PerMessageDeflate };
}));
//#endregion
//#region node_modules/.pnpm/undici@6.28.0/node_modules/undici/lib/web/websocket/receiver.js
var require_receiver = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const { Writable } = __require("node:stream");
	const assert = __require("node:assert");
	const { parserStates, opcodes, states, emptyBuffer, sentCloseFrameState } = require_constants();
	const { kReadyState, kSentClose, kResponse, kReceivedClose } = require_symbols();
	const { channels } = require_diagnostics();
	const { isValidStatusCode, isValidOpcode, failWebsocketConnection, websocketMessageReceived, utf8Decode, isControlFrame, isTextBinaryFrame, isContinuationFrame } = require_util$1();
	const { WebsocketFrameSend } = require_frame();
	const { closeWebSocketConnection } = require_connection();
	const { PerMessageDeflate } = require_permessage_deflate();
	const { MessageSizeExceededError } = require_errors();
	function failWebsocketConnectionWithCode(ws, code, reason) {
		closeWebSocketConnection(ws, code, reason, Buffer.byteLength(reason));
		failWebsocketConnection(ws, reason);
	}
	var ByteParser = class extends Writable {
		#buffers = [];
		#fragmentsBytes = 0;
		#byteOffset = 0;
		#loop = false;
		#state = parserStates.INFO;
		#info = {};
		#fragments = [];
		/** @type {Map<string, PerMessageDeflate>} */
		#extensions;
		/** @type {number} */
		#maxFragments;
		/** @type {number} */
		#maxPayloadSize;
		/**
		* @param {import('./websocket').WebSocket} ws
		* @param {Map<string, string>|null} extensions
		* @param {{ maxFragments?: number, maxPayloadSize?: number }} [options]
		*/
		constructor(ws, extensions, options = {}) {
			super();
			this.ws = ws;
			this.#extensions = extensions == null ? /* @__PURE__ */ new Map() : extensions;
			this.#maxFragments = options.maxFragments ?? 0;
			this.#maxPayloadSize = options.maxPayloadSize ?? 0;
			if (this.#extensions.has("permessage-deflate")) this.#extensions.set("permessage-deflate", new PerMessageDeflate(extensions, options));
		}
		/**
		* @param {Buffer} chunk
		* @param {() => void} callback
		*/
		_write(chunk, _, callback) {
			this.#buffers.push(chunk);
			this.#byteOffset += chunk.length;
			this.#loop = true;
			this.run(callback);
		}
		#validatePayloadLength() {
			if (this.#maxPayloadSize > 0 && !isControlFrame(this.#info.opcode) && this.#info.payloadLength + this.#fragmentsBytes > this.#maxPayloadSize) {
				failWebsocketConnectionWithCode(this.ws, 1009, "Payload size exceeds maximum allowed size");
				return false;
			}
			return true;
		}
		/**
		* Runs whenever a new chunk is received.
		* Callback is called whenever there are no more chunks buffering,
		* or not enough bytes are buffered to parse.
		*/
		run(callback) {
			while (this.#loop) if (this.#state === parserStates.INFO) {
				if (this.#byteOffset < 2) return callback();
				const buffer = this.consume(2);
				const fin = (buffer[0] & 128) !== 0;
				const opcode = buffer[0] & 15;
				const masked = (buffer[1] & 128) === 128;
				const fragmented = !fin && opcode !== opcodes.CONTINUATION;
				const payloadLength = buffer[1] & 127;
				const rsv1 = buffer[0] & 64;
				const rsv2 = buffer[0] & 32;
				const rsv3 = buffer[0] & 16;
				if (!isValidOpcode(opcode)) {
					failWebsocketConnection(this.ws, "Invalid opcode received");
					return callback();
				}
				if (masked) {
					failWebsocketConnection(this.ws, "Frame cannot be masked");
					return callback();
				}
				if (rsv1 !== 0 && !this.#extensions.has("permessage-deflate")) {
					failWebsocketConnection(this.ws, "Expected RSV1 to be clear.");
					return;
				}
				if (rsv2 !== 0 || rsv3 !== 0) {
					failWebsocketConnection(this.ws, "RSV1, RSV2, RSV3 must be clear");
					return;
				}
				if (fragmented && !isTextBinaryFrame(opcode)) {
					failWebsocketConnection(this.ws, "Invalid frame type was fragmented.");
					return;
				}
				if (isTextBinaryFrame(opcode) && this.#fragments.length > 0) {
					failWebsocketConnection(this.ws, "Expected continuation frame");
					return;
				}
				if (this.#info.fragmented && fragmented) {
					failWebsocketConnection(this.ws, "Fragmented frame exceeded 125 bytes.");
					return;
				}
				if ((payloadLength > 125 || fragmented) && isControlFrame(opcode)) {
					failWebsocketConnection(this.ws, "Control frame either too large or fragmented");
					return;
				}
				if (isContinuationFrame(opcode) && this.#fragments.length === 0 && !this.#info.compressed) {
					failWebsocketConnection(this.ws, "Unexpected continuation frame");
					return;
				}
				if (payloadLength <= 125) {
					this.#info.payloadLength = payloadLength;
					this.#state = parserStates.READ_DATA;
					if (!this.#validatePayloadLength()) return;
				} else if (payloadLength === 126) this.#state = parserStates.PAYLOADLENGTH_16;
				else if (payloadLength === 127) this.#state = parserStates.PAYLOADLENGTH_64;
				if (isTextBinaryFrame(opcode)) {
					this.#info.binaryType = opcode;
					this.#info.compressed = rsv1 !== 0;
				}
				this.#info.opcode = opcode;
				this.#info.masked = masked;
				this.#info.fin = fin;
				this.#info.fragmented = fragmented;
			} else if (this.#state === parserStates.PAYLOADLENGTH_16) {
				if (this.#byteOffset < 2) return callback();
				const buffer = this.consume(2);
				this.#info.payloadLength = buffer.readUInt16BE(0);
				this.#state = parserStates.READ_DATA;
				if (!this.#validatePayloadLength()) return;
			} else if (this.#state === parserStates.PAYLOADLENGTH_64) {
				if (this.#byteOffset < 8) return callback();
				const buffer = this.consume(8);
				const upper = buffer.readUInt32BE(0);
				const lower = buffer.readUInt32BE(4);
				if (upper !== 0 || lower > 2 ** 31 - 1) {
					failWebsocketConnection(this.ws, "Received payload length > 2^31 bytes.");
					return;
				}
				this.#info.payloadLength = lower;
				this.#state = parserStates.READ_DATA;
				if (!this.#validatePayloadLength()) return;
			} else if (this.#state === parserStates.READ_DATA) {
				if (this.#byteOffset < this.#info.payloadLength) return callback();
				const body = this.consume(this.#info.payloadLength);
				if (isControlFrame(this.#info.opcode)) {
					this.#loop = this.parseControlFrame(body);
					this.#state = parserStates.INFO;
				} else if (!this.#info.compressed) {
					if (!this.writeFragments(body)) return;
					if (this.#maxPayloadSize > 0 && this.#fragmentsBytes > this.#maxPayloadSize) {
						failWebsocketConnectionWithCode(this.ws, 1009, new MessageSizeExceededError().message);
						return;
					}
					if (!this.#info.fragmented && this.#info.fin) websocketMessageReceived(this.ws, this.#info.binaryType, this.consumeFragments());
					this.#state = parserStates.INFO;
				} else {
					this.#extensions.get("permessage-deflate").decompress(body, this.#info.fin, (error, data) => {
						if (error) {
							const code = error instanceof MessageSizeExceededError ? 1009 : 1007;
							failWebsocketConnectionWithCode(this.ws, code, error.message);
							return;
						}
						if (!this.writeFragments(data)) return;
						if (this.#maxPayloadSize > 0 && this.#fragmentsBytes > this.#maxPayloadSize) {
							failWebsocketConnectionWithCode(this.ws, 1009, new MessageSizeExceededError().message);
							return;
						}
						if (!this.#info.fin) {
							this.#state = parserStates.INFO;
							this.#loop = true;
							this.run(callback);
							return;
						}
						websocketMessageReceived(this.ws, this.#info.binaryType, this.consumeFragments());
						this.#loop = true;
						this.#state = parserStates.INFO;
						this.run(callback);
					});
					this.#loop = false;
					break;
				}
			}
		}
		/**
		* Take n bytes from the buffered Buffers
		* @param {number} n
		* @returns {Buffer}
		*/
		consume(n) {
			if (n > this.#byteOffset) throw new Error("Called consume() before buffers satiated.");
			else if (n === 0) return emptyBuffer;
			if (this.#buffers[0].length === n) {
				this.#byteOffset -= this.#buffers[0].length;
				return this.#buffers.shift();
			}
			const buffer = Buffer.allocUnsafe(n);
			let offset = 0;
			while (offset !== n) {
				const next = this.#buffers[0];
				const { length } = next;
				if (length + offset === n) {
					buffer.set(this.#buffers.shift(), offset);
					break;
				} else if (length + offset > n) {
					buffer.set(next.subarray(0, n - offset), offset);
					this.#buffers[0] = next.subarray(n - offset);
					break;
				} else {
					buffer.set(this.#buffers.shift(), offset);
					offset += next.length;
				}
			}
			this.#byteOffset -= n;
			return buffer;
		}
		writeFragments(fragment) {
			if (this.#maxFragments > 0 && this.#fragments.length === this.#maxFragments) {
				failWebsocketConnectionWithCode(this.ws, 1008, "Too many message fragments");
				return false;
			}
			this.#fragmentsBytes += fragment.length;
			this.#fragments.push(fragment);
			return true;
		}
		consumeFragments() {
			const fragments = this.#fragments;
			if (fragments.length === 1) {
				this.#fragmentsBytes = 0;
				return fragments.shift();
			}
			const output = Buffer.concat(fragments, this.#fragmentsBytes);
			this.#fragments = [];
			this.#fragmentsBytes = 0;
			return output;
		}
		parseCloseBody(data) {
			assert(data.length !== 1);
			/** @type {number|undefined} */
			let code;
			if (data.length >= 2) code = data.readUInt16BE(0);
			if (code !== void 0 && !isValidStatusCode(code)) return {
				code: 1002,
				reason: "Invalid status code",
				error: true
			};
			/** @type {Buffer} */
			let reason = data.subarray(2);
			if (reason[0] === 239 && reason[1] === 187 && reason[2] === 191) reason = reason.subarray(3);
			try {
				reason = utf8Decode(reason);
			} catch {
				return {
					code: 1007,
					reason: "Invalid UTF-8",
					error: true
				};
			}
			return {
				code,
				reason,
				error: false
			};
		}
		/**
		* Parses control frames.
		* @param {Buffer} body
		*/
		parseControlFrame(body) {
			const { opcode, payloadLength } = this.#info;
			if (opcode === opcodes.CLOSE) {
				if (payloadLength === 1) {
					failWebsocketConnection(this.ws, "Received close frame with a 1-byte body.");
					return false;
				}
				this.#info.closeInfo = this.parseCloseBody(body);
				if (this.#info.closeInfo.error) {
					const { code, reason } = this.#info.closeInfo;
					closeWebSocketConnection(this.ws, code, reason, reason.length);
					failWebsocketConnection(this.ws, reason);
					return false;
				}
				if (this.ws[kSentClose] !== sentCloseFrameState.SENT) {
					let body = emptyBuffer;
					if (this.#info.closeInfo.code) {
						body = Buffer.allocUnsafe(2);
						body.writeUInt16BE(this.#info.closeInfo.code, 0);
					}
					const closeFrame = new WebsocketFrameSend(body);
					this.ws[kResponse].socket.write(closeFrame.createFrame(opcodes.CLOSE), (err) => {
						if (!err) this.ws[kSentClose] = sentCloseFrameState.SENT;
					});
				}
				this.ws[kReadyState] = states.CLOSING;
				this.ws[kReceivedClose] = true;
				return false;
			} else if (opcode === opcodes.PING) {
				if (!this.ws[kReceivedClose]) {
					const frame = new WebsocketFrameSend(body);
					this.ws[kResponse].socket.write(frame.createFrame(opcodes.PONG));
					if (channels.ping.hasSubscribers) channels.ping.publish({ payload: body });
				}
			} else if (opcode === opcodes.PONG) {
				if (channels.pong.hasSubscribers) channels.pong.publish({ payload: body });
			}
			return true;
		}
		get closingInfo() {
			return this.#info.closeInfo;
		}
	};
	module.exports = { ByteParser };
}));
//#endregion
//#region node_modules/.pnpm/undici@6.28.0/node_modules/undici/lib/web/websocket/sender.js
var require_sender = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const { WebsocketFrameSend } = require_frame();
	const { opcodes, sendHints } = require_constants();
	const FixedQueue = require_fixed_queue();
	/** @type {typeof Uint8Array} */
	const FastBuffer = Buffer[Symbol.species];
	/**
	* @typedef {object} SendQueueNode
	* @property {Promise<void> | null} promise
	* @property {((...args: any[]) => any)} callback
	* @property {Buffer | null} frame
	*/
	var SendQueue = class {
		/**
		* @type {FixedQueue}
		*/
		#queue = new FixedQueue();
		/**
		* @type {boolean}
		*/
		#running = false;
		/** @type {import('node:net').Socket} */
		#socket;
		constructor(socket) {
			this.#socket = socket;
		}
		add(item, cb, hint) {
			if (hint !== sendHints.blob) {
				const frame = createFrame(item, hint);
				if (!this.#running) this.#socket.write(frame, cb);
				else {
					/** @type {SendQueueNode} */
					const node = {
						promise: null,
						callback: cb,
						frame
					};
					this.#queue.push(node);
				}
				return;
			}
			/** @type {SendQueueNode} */
			const node = {
				promise: item.arrayBuffer().then((ab) => {
					node.promise = null;
					node.frame = createFrame(ab, hint);
				}),
				callback: cb,
				frame: null
			};
			this.#queue.push(node);
			if (!this.#running) this.#run();
		}
		async #run() {
			this.#running = true;
			const queue = this.#queue;
			while (!queue.isEmpty()) {
				const node = queue.shift();
				if (node.promise !== null) await node.promise;
				this.#socket.write(node.frame, node.callback);
				node.callback = node.frame = null;
			}
			this.#running = false;
		}
	};
	function createFrame(data, hint) {
		return new WebsocketFrameSend(toBuffer(data, hint)).createFrame(hint === sendHints.string ? opcodes.TEXT : opcodes.BINARY);
	}
	function toBuffer(data, hint) {
		switch (hint) {
			case sendHints.string: return Buffer.from(data);
			case sendHints.arrayBuffer:
			case sendHints.blob: return new FastBuffer(data);
			case sendHints.typedArray: return new FastBuffer(data.buffer, data.byteOffset, data.byteLength);
		}
	}
	module.exports = { SendQueue };
}));
//#endregion
//#region node_modules/.pnpm/undici@6.28.0/node_modules/undici/lib/web/websocket/websocket.js
var require_websocket = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const { webidl } = require_webidl();
	const { URLSerializer } = require_data_url();
	const { environmentSettingsObject } = require_util$6();
	const { staticPropertyDescriptors, states, sentCloseFrameState, sendHints } = require_constants();
	const { kWebSocketURL, kReadyState, kController, kBinaryType, kResponse, kSentClose, kByteParser } = require_symbols();
	const { isConnecting, isEstablished, isClosing, isValidSubprotocol, fireEvent } = require_util$1();
	const { establishWebSocketConnection, closeWebSocketConnection } = require_connection();
	const { ByteParser } = require_receiver();
	const { kEnumerableProperty, isBlobLike } = require_util$7();
	const { getGlobalDispatcher } = require_global();
	const { types } = __require("node:util");
	const { ErrorEvent, CloseEvent } = require_events();
	const { SendQueue } = require_sender();
	var WebSocket = class WebSocket extends EventTarget {
		#events = {
			open: null,
			error: null,
			close: null,
			message: null
		};
		#bufferedAmount = 0;
		#protocol = "";
		#extensions = "";
		/** @type {SendQueue} */
		#sendQueue;
		/**
		* @param {string} url
		* @param {string|string[]} protocols
		*/
		constructor(url, protocols = []) {
			super();
			webidl.util.markAsUncloneable(this);
			const prefix = "WebSocket constructor";
			webidl.argumentLengthCheck(arguments, 1, prefix);
			const options = webidl.converters["DOMString or sequence<DOMString> or WebSocketInit"](protocols, prefix, "options");
			url = webidl.converters.USVString(url, prefix, "url");
			protocols = options.protocols;
			const baseURL = environmentSettingsObject.settingsObject.baseUrl;
			let urlRecord;
			try {
				urlRecord = new URL(url, baseURL);
			} catch (e) {
				throw new DOMException(e, "SyntaxError");
			}
			if (urlRecord.protocol === "http:") urlRecord.protocol = "ws:";
			else if (urlRecord.protocol === "https:") urlRecord.protocol = "wss:";
			if (urlRecord.protocol !== "ws:" && urlRecord.protocol !== "wss:") throw new DOMException(`Expected a ws: or wss: protocol, got ${urlRecord.protocol}`, "SyntaxError");
			if (urlRecord.hash || urlRecord.href.endsWith("#")) throw new DOMException("Got fragment", "SyntaxError");
			if (typeof protocols === "string") protocols = [protocols];
			if (protocols.length !== new Set(protocols.map((p) => p.toLowerCase())).size) throw new DOMException("Invalid Sec-WebSocket-Protocol value", "SyntaxError");
			if (protocols.length > 0 && !protocols.every((p) => isValidSubprotocol(p))) throw new DOMException("Invalid Sec-WebSocket-Protocol value", "SyntaxError");
			this[kWebSocketURL] = new URL(urlRecord.href);
			const client = environmentSettingsObject.settingsObject;
			this[kController] = establishWebSocketConnection(urlRecord, protocols, client, this, (response, extensions) => this.#onConnectionEstablished(response, extensions), options);
			this[kReadyState] = WebSocket.CONNECTING;
			this[kSentClose] = sentCloseFrameState.NOT_SENT;
			this[kBinaryType] = "blob";
		}
		/**
		* @see https://websockets.spec.whatwg.org/#dom-websocket-close
		* @param {number|undefined} code
		* @param {string|undefined} reason
		*/
		close(code = void 0, reason = void 0) {
			webidl.brandCheck(this, WebSocket);
			const prefix = "WebSocket.close";
			if (code !== void 0) code = webidl.converters["unsigned short"](code, prefix, "code", { clamp: true });
			if (reason !== void 0) reason = webidl.converters.USVString(reason, prefix, "reason");
			if (code !== void 0) {
				if (code !== 1e3 && (code < 3e3 || code > 4999)) throw new DOMException("invalid code", "InvalidAccessError");
			}
			let reasonByteLength = 0;
			if (reason !== void 0) {
				reasonByteLength = Buffer.byteLength(reason);
				if (reasonByteLength > 123) throw new DOMException(`Reason must be less than 123 bytes; received ${reasonByteLength}`, "SyntaxError");
			}
			closeWebSocketConnection(this, code, reason, reasonByteLength);
		}
		/**
		* @see https://websockets.spec.whatwg.org/#dom-websocket-send
		* @param {NodeJS.TypedArray|ArrayBuffer|Blob|string} data
		*/
		send(data) {
			webidl.brandCheck(this, WebSocket);
			const prefix = "WebSocket.send";
			webidl.argumentLengthCheck(arguments, 1, prefix);
			data = webidl.converters.WebSocketSendData(data, prefix, "data");
			if (isConnecting(this)) throw new DOMException("Sent before connected.", "InvalidStateError");
			if (!isEstablished(this) || isClosing(this)) return;
			if (typeof data === "string") {
				const length = Buffer.byteLength(data);
				this.#bufferedAmount += length;
				this.#sendQueue.add(data, () => {
					this.#bufferedAmount -= length;
				}, sendHints.string);
			} else if (types.isArrayBuffer(data)) {
				this.#bufferedAmount += data.byteLength;
				this.#sendQueue.add(data, () => {
					this.#bufferedAmount -= data.byteLength;
				}, sendHints.arrayBuffer);
			} else if (ArrayBuffer.isView(data)) {
				this.#bufferedAmount += data.byteLength;
				this.#sendQueue.add(data, () => {
					this.#bufferedAmount -= data.byteLength;
				}, sendHints.typedArray);
			} else if (isBlobLike(data)) {
				this.#bufferedAmount += data.size;
				this.#sendQueue.add(data, () => {
					this.#bufferedAmount -= data.size;
				}, sendHints.blob);
			}
		}
		get readyState() {
			webidl.brandCheck(this, WebSocket);
			return this[kReadyState];
		}
		get bufferedAmount() {
			webidl.brandCheck(this, WebSocket);
			return this.#bufferedAmount;
		}
		get url() {
			webidl.brandCheck(this, WebSocket);
			return URLSerializer(this[kWebSocketURL]);
		}
		get extensions() {
			webidl.brandCheck(this, WebSocket);
			return this.#extensions;
		}
		get protocol() {
			webidl.brandCheck(this, WebSocket);
			return this.#protocol;
		}
		get onopen() {
			webidl.brandCheck(this, WebSocket);
			return this.#events.open;
		}
		set onopen(fn) {
			webidl.brandCheck(this, WebSocket);
			if (this.#events.open) this.removeEventListener("open", this.#events.open);
			if (typeof fn === "function") {
				this.#events.open = fn;
				this.addEventListener("open", fn);
			} else this.#events.open = null;
		}
		get onerror() {
			webidl.brandCheck(this, WebSocket);
			return this.#events.error;
		}
		set onerror(fn) {
			webidl.brandCheck(this, WebSocket);
			if (this.#events.error) this.removeEventListener("error", this.#events.error);
			if (typeof fn === "function") {
				this.#events.error = fn;
				this.addEventListener("error", fn);
			} else this.#events.error = null;
		}
		get onclose() {
			webidl.brandCheck(this, WebSocket);
			return this.#events.close;
		}
		set onclose(fn) {
			webidl.brandCheck(this, WebSocket);
			if (this.#events.close) this.removeEventListener("close", this.#events.close);
			if (typeof fn === "function") {
				this.#events.close = fn;
				this.addEventListener("close", fn);
			} else this.#events.close = null;
		}
		get onmessage() {
			webidl.brandCheck(this, WebSocket);
			return this.#events.message;
		}
		set onmessage(fn) {
			webidl.brandCheck(this, WebSocket);
			if (this.#events.message) this.removeEventListener("message", this.#events.message);
			if (typeof fn === "function") {
				this.#events.message = fn;
				this.addEventListener("message", fn);
			} else this.#events.message = null;
		}
		get binaryType() {
			webidl.brandCheck(this, WebSocket);
			return this[kBinaryType];
		}
		set binaryType(type) {
			webidl.brandCheck(this, WebSocket);
			if (type !== "blob" && type !== "arraybuffer") this[kBinaryType] = "blob";
			else this[kBinaryType] = type;
		}
		/**
		* @see https://websockets.spec.whatwg.org/#feedback-from-the-protocol
		*/
		#onConnectionEstablished(response, parsedExtensions) {
			this[kResponse] = response;
			const webSocketOptions = this[kController]?.dispatcher?.webSocketOptions;
			const maxFragments = webSocketOptions?.maxFragments;
			const maxPayloadSize = webSocketOptions?.maxPayloadSize;
			const parser = new ByteParser(this, parsedExtensions, {
				maxFragments,
				maxPayloadSize
			});
			parser.on("drain", onParserDrain);
			parser.on("error", onParserError.bind(this));
			response.socket.ws = this;
			this[kByteParser] = parser;
			this.#sendQueue = new SendQueue(response.socket);
			this[kReadyState] = states.OPEN;
			const extensions = response.headersList.get("sec-websocket-extensions");
			if (extensions !== null) this.#extensions = extensions;
			const protocol = response.headersList.get("sec-websocket-protocol");
			if (protocol !== null) this.#protocol = protocol;
			fireEvent("open", this);
		}
	};
	WebSocket.CONNECTING = WebSocket.prototype.CONNECTING = states.CONNECTING;
	WebSocket.OPEN = WebSocket.prototype.OPEN = states.OPEN;
	WebSocket.CLOSING = WebSocket.prototype.CLOSING = states.CLOSING;
	WebSocket.CLOSED = WebSocket.prototype.CLOSED = states.CLOSED;
	Object.defineProperties(WebSocket.prototype, {
		CONNECTING: staticPropertyDescriptors,
		OPEN: staticPropertyDescriptors,
		CLOSING: staticPropertyDescriptors,
		CLOSED: staticPropertyDescriptors,
		url: kEnumerableProperty,
		readyState: kEnumerableProperty,
		bufferedAmount: kEnumerableProperty,
		onopen: kEnumerableProperty,
		onerror: kEnumerableProperty,
		onclose: kEnumerableProperty,
		close: kEnumerableProperty,
		onmessage: kEnumerableProperty,
		binaryType: kEnumerableProperty,
		send: kEnumerableProperty,
		extensions: kEnumerableProperty,
		protocol: kEnumerableProperty,
		[Symbol.toStringTag]: {
			value: "WebSocket",
			writable: false,
			enumerable: false,
			configurable: true
		}
	});
	Object.defineProperties(WebSocket, {
		CONNECTING: staticPropertyDescriptors,
		OPEN: staticPropertyDescriptors,
		CLOSING: staticPropertyDescriptors,
		CLOSED: staticPropertyDescriptors
	});
	webidl.converters["sequence<DOMString>"] = webidl.sequenceConverter(webidl.converters.DOMString);
	webidl.converters["DOMString or sequence<DOMString>"] = function(V, prefix, argument) {
		if (webidl.util.Type(V) === "Object" && Symbol.iterator in V) return webidl.converters["sequence<DOMString>"](V);
		return webidl.converters.DOMString(V, prefix, argument);
	};
	webidl.converters.WebSocketInit = webidl.dictionaryConverter([
		{
			key: "protocols",
			converter: webidl.converters["DOMString or sequence<DOMString>"],
			defaultValue: () => new Array(0)
		},
		{
			key: "dispatcher",
			converter: webidl.converters.any,
			defaultValue: () => getGlobalDispatcher()
		},
		{
			key: "headers",
			converter: webidl.nullableConverter(webidl.converters.HeadersInit)
		}
	]);
	webidl.converters["DOMString or sequence<DOMString> or WebSocketInit"] = function(V) {
		if (webidl.util.Type(V) === "Object" && !(Symbol.iterator in V)) return webidl.converters.WebSocketInit(V);
		return { protocols: webidl.converters["DOMString or sequence<DOMString>"](V) };
	};
	webidl.converters.WebSocketSendData = function(V) {
		if (webidl.util.Type(V) === "Object") {
			if (isBlobLike(V)) return webidl.converters.Blob(V, { strict: false });
			if (ArrayBuffer.isView(V) || types.isArrayBuffer(V)) return webidl.converters.BufferSource(V);
		}
		return webidl.converters.USVString(V);
	};
	function onParserDrain() {
		this.ws[kResponse].socket.resume();
	}
	function onParserError(err) {
		let message;
		let code;
		if (err instanceof CloseEvent) {
			message = err.reason;
			code = err.code;
		} else message = err.message;
		fireEvent("error", this, () => new ErrorEvent("error", {
			error: err,
			message
		}));
		closeWebSocketConnection(this, code);
	}
	module.exports = { WebSocket };
}));
//#endregion
//#region node_modules/.pnpm/undici@6.28.0/node_modules/undici/lib/web/eventsource/util.js
var require_util = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* Checks if the given value is a valid LastEventId.
	* @param {string} value
	* @returns {boolean}
	*/
	function isValidLastEventId(value) {
		return value.indexOf("\0") === -1;
	}
	/**
	* Checks if the given value is a base 10 digit.
	* @param {string} value
	* @returns {boolean}
	*/
	function isASCIINumber(value) {
		if (value.length === 0) return false;
		for (let i = 0; i < value.length; i++) if (value.charCodeAt(i) < 48 || value.charCodeAt(i) > 57) return false;
		return true;
	}
	function delay(ms) {
		return new Promise((resolve) => {
			setTimeout(resolve, ms).unref();
		});
	}
	module.exports = {
		isValidLastEventId,
		isASCIINumber,
		delay
	};
}));
//#endregion
//#region node_modules/.pnpm/undici@6.28.0/node_modules/undici/lib/web/eventsource/eventsource-stream.js
var require_eventsource_stream = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const { Transform } = __require("node:stream");
	const { isASCIINumber, isValidLastEventId } = require_util();
	/**
	* @type {number[]} BOM
	*/
	const BOM = [
		239,
		187,
		191
	];
	/**
	* @type {10} LF
	*/
	const LF = 10;
	/**
	* @type {13} CR
	*/
	const CR = 13;
	/**
	* @type {58} COLON
	*/
	const COLON = 58;
	/**
	* @type {32} SPACE
	*/
	const SPACE = 32;
	/**
	* @typedef {object} EventSourceStreamEvent
	* @type {object}
	* @property {string} [event] The event type.
	* @property {string} [data] The data of the message.
	* @property {string} [id] A unique ID for the event.
	* @property {string} [retry] The reconnection time, in milliseconds.
	*/
	/**
	* @typedef eventSourceSettings
	* @type {object}
	* @property {string} lastEventId The last event ID received from the server.
	* @property {string} origin The origin of the event source.
	* @property {number} reconnectionTime The reconnection time, in milliseconds.
	*/
	var EventSourceStream = class extends Transform {
		/**
		* @type {eventSourceSettings}
		*/
		state = null;
		/**
		* Leading byte-order-mark check.
		* @type {boolean}
		*/
		checkBOM = true;
		/**
		* @type {boolean}
		*/
		crlfCheck = false;
		/**
		* @type {boolean}
		*/
		eventEndCheck = false;
		/**
		* @type {Buffer}
		*/
		buffer = null;
		pos = 0;
		event = {
			data: void 0,
			event: void 0,
			id: void 0,
			retry: void 0
		};
		/**
		* @param {object} options
		* @param {eventSourceSettings} options.eventSourceSettings
		* @param {Function} [options.push]
		*/
		constructor(options = {}) {
			options.readableObjectMode = true;
			super(options);
			this.state = options.eventSourceSettings || {};
			if (options.push) this.push = options.push;
		}
		/**
		* @param {Buffer} chunk
		* @param {string} _encoding
		* @param {Function} callback
		* @returns {void}
		*/
		_transform(chunk, _encoding, callback) {
			if (chunk.length === 0) {
				callback();
				return;
			}
			if (this.buffer) this.buffer = Buffer.concat([this.buffer, chunk]);
			else this.buffer = chunk;
			if (this.checkBOM) switch (this.buffer.length) {
				case 1:
					if (this.buffer[0] === BOM[0]) {
						callback();
						return;
					}
					this.checkBOM = false;
					callback();
					return;
				case 2:
					if (this.buffer[0] === BOM[0] && this.buffer[1] === BOM[1]) {
						callback();
						return;
					}
					this.checkBOM = false;
					break;
				case 3:
					if (this.buffer[0] === BOM[0] && this.buffer[1] === BOM[1] && this.buffer[2] === BOM[2]) {
						this.buffer = Buffer.alloc(0);
						this.checkBOM = false;
						callback();
						return;
					}
					this.checkBOM = false;
					break;
				default:
					if (this.buffer[0] === BOM[0] && this.buffer[1] === BOM[1] && this.buffer[2] === BOM[2]) this.buffer = this.buffer.subarray(3);
					this.checkBOM = false;
			}
			while (this.pos < this.buffer.length) {
				if (this.eventEndCheck) {
					if (this.crlfCheck) {
						if (this.buffer[this.pos] === LF) {
							this.buffer = this.buffer.subarray(this.pos + 1);
							this.pos = 0;
							this.crlfCheck = false;
							continue;
						}
						this.crlfCheck = false;
					}
					if (this.buffer[this.pos] === LF || this.buffer[this.pos] === CR) {
						if (this.buffer[this.pos] === CR) this.crlfCheck = true;
						this.buffer = this.buffer.subarray(this.pos + 1);
						this.pos = 0;
						if (this.event.data !== void 0 || this.event.event || this.event.id || this.event.retry) this.processEvent(this.event);
						this.clearEvent();
						continue;
					}
					this.eventEndCheck = false;
					continue;
				}
				if (this.buffer[this.pos] === LF || this.buffer[this.pos] === CR) {
					if (this.buffer[this.pos] === CR) this.crlfCheck = true;
					this.parseLine(this.buffer.subarray(0, this.pos), this.event);
					this.buffer = this.buffer.subarray(this.pos + 1);
					this.pos = 0;
					this.eventEndCheck = true;
					continue;
				}
				this.pos++;
			}
			callback();
		}
		/**
		* @param {Buffer} line
		* @param {EventStreamEvent} event
		*/
		parseLine(line, event) {
			if (line.length === 0) return;
			const colonPosition = line.indexOf(COLON);
			if (colonPosition === 0) return;
			let field = "";
			let value = "";
			if (colonPosition !== -1) {
				field = line.subarray(0, colonPosition).toString("utf8");
				let valueStart = colonPosition + 1;
				if (line[valueStart] === SPACE) ++valueStart;
				value = line.subarray(valueStart).toString("utf8");
			} else {
				field = line.toString("utf8");
				value = "";
			}
			switch (field) {
				case "data":
					if (event[field] === void 0) event[field] = value;
					else event[field] += `\n${value}`;
					break;
				case "retry":
					if (isASCIINumber(value)) event[field] = value;
					break;
				case "id":
					if (isValidLastEventId(value)) event[field] = value;
					break;
				case "event": if (value.length > 0) event[field] = value;
			}
		}
		/**
		* @param {EventSourceStreamEvent} event
		*/
		processEvent(event) {
			if (event.retry && isASCIINumber(event.retry)) this.state.reconnectionTime = parseInt(event.retry, 10);
			if (event.id && isValidLastEventId(event.id)) this.state.lastEventId = event.id;
			if (event.data !== void 0) this.push({
				type: event.event || "message",
				options: {
					data: event.data,
					lastEventId: this.state.lastEventId,
					origin: this.state.origin
				}
			});
		}
		clearEvent() {
			this.event = {
				data: void 0,
				event: void 0,
				id: void 0,
				retry: void 0
			};
		}
	};
	module.exports = { EventSourceStream };
}));
//#endregion
//#region node_modules/.pnpm/undici@6.28.0/node_modules/undici/lib/web/eventsource/eventsource.js
var require_eventsource = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const { pipeline } = __require("node:stream");
	const { fetching } = require_fetch();
	const { makeRequest } = require_request();
	const { webidl } = require_webidl();
	const { EventSourceStream } = require_eventsource_stream();
	const { parseMIMEType } = require_data_url();
	const { createFastMessageEvent } = require_events();
	const { isNetworkError } = require_response();
	const { delay } = require_util();
	const { kEnumerableProperty } = require_util$7();
	const { environmentSettingsObject } = require_util$6();
	let experimentalWarned = false;
	/**
	* A reconnection time, in milliseconds. This must initially be an implementation-defined value,
	* probably in the region of a few seconds.
	*
	* In Comparison:
	* - Chrome uses 3000ms.
	* - Deno uses 5000ms.
	*
	* @type {3000}
	*/
	const defaultReconnectionTime = 3e3;
	/**
	* The readyState attribute represents the state of the connection.
	* @enum
	* @readonly
	* @see https://html.spec.whatwg.org/multipage/server-sent-events.html#dom-eventsource-readystate-dev
	*/
	/**
	* The connection has not yet been established, or it was closed and the user
	* agent is reconnecting.
	* @type {0}
	*/
	const CONNECTING = 0;
	/**
	* The user agent has an open connection and is dispatching events as it
	* receives them.
	* @type {1}
	*/
	const OPEN = 1;
	/**
	* The connection is not open, and the user agent is not trying to reconnect.
	* @type {2}
	*/
	const CLOSED = 2;
	/**
	* Requests for the element will have their mode set to "cors" and their credentials mode set to "same-origin".
	* @type {'anonymous'}
	*/
	const ANONYMOUS = "anonymous";
	/**
	* Requests for the element will have their mode set to "cors" and their credentials mode set to "include".
	* @type {'use-credentials'}
	*/
	const USE_CREDENTIALS = "use-credentials";
	/**
	* The EventSource interface is used to receive server-sent events. It
	* connects to a server over HTTP and receives events in text/event-stream
	* format without closing the connection.
	* @extends {EventTarget}
	* @see https://html.spec.whatwg.org/multipage/server-sent-events.html#server-sent-events
	* @api public
	*/
	var EventSource = class EventSource extends EventTarget {
		#events = {
			open: null,
			error: null,
			message: null
		};
		#url = null;
		#withCredentials = false;
		#readyState = CONNECTING;
		#request = null;
		#controller = null;
		#dispatcher;
		/**
		* @type {import('./eventsource-stream').eventSourceSettings}
		*/
		#state;
		/**
		* Creates a new EventSource object.
		* @param {string} url
		* @param {EventSourceInit} [eventSourceInitDict]
		* @see https://html.spec.whatwg.org/multipage/server-sent-events.html#the-eventsource-interface
		*/
		constructor(url, eventSourceInitDict = {}) {
			super();
			webidl.util.markAsUncloneable(this);
			const prefix = "EventSource constructor";
			webidl.argumentLengthCheck(arguments, 1, prefix);
			if (!experimentalWarned) {
				experimentalWarned = true;
				process.emitWarning("EventSource is experimental, expect them to change at any time.", { code: "UNDICI-ES" });
			}
			url = webidl.converters.USVString(url, prefix, "url");
			eventSourceInitDict = webidl.converters.EventSourceInitDict(eventSourceInitDict, prefix, "eventSourceInitDict");
			this.#dispatcher = eventSourceInitDict.dispatcher;
			this.#state = {
				lastEventId: "",
				reconnectionTime: defaultReconnectionTime
			};
			const settings = environmentSettingsObject;
			let urlRecord;
			try {
				urlRecord = new URL(url, settings.settingsObject.baseUrl);
				this.#state.origin = urlRecord.origin;
			} catch (e) {
				throw new DOMException(e, "SyntaxError");
			}
			this.#url = urlRecord.href;
			let corsAttributeState = ANONYMOUS;
			if (eventSourceInitDict.withCredentials) {
				corsAttributeState = USE_CREDENTIALS;
				this.#withCredentials = true;
			}
			const initRequest = {
				redirect: "follow",
				keepalive: true,
				mode: "cors",
				credentials: corsAttributeState === "anonymous" ? "same-origin" : "omit",
				referrer: "no-referrer"
			};
			initRequest.client = environmentSettingsObject.settingsObject;
			initRequest.headersList = [["accept", {
				name: "accept",
				value: "text/event-stream"
			}]];
			initRequest.cache = "no-store";
			initRequest.initiator = "other";
			initRequest.urlList = [new URL(this.#url)];
			this.#request = makeRequest(initRequest);
			this.#connect();
		}
		/**
		* Returns the state of this EventSource object's connection. It can have the
		* values described below.
		* @returns {0|1|2}
		* @readonly
		*/
		get readyState() {
			return this.#readyState;
		}
		/**
		* Returns the URL providing the event stream.
		* @readonly
		* @returns {string}
		*/
		get url() {
			return this.#url;
		}
		/**
		* Returns a boolean indicating whether the EventSource object was
		* instantiated with CORS credentials set (true), or not (false, the default).
		*/
		get withCredentials() {
			return this.#withCredentials;
		}
		#connect() {
			if (this.#readyState === CLOSED) return;
			this.#readyState = CONNECTING;
			const fetchParams = {
				request: this.#request,
				dispatcher: this.#dispatcher
			};
			const processEventSourceEndOfBody = (response) => {
				if (isNetworkError(response)) {
					this.dispatchEvent(new Event("error"));
					this.close();
				}
				this.#reconnect();
			};
			fetchParams.processResponseEndOfBody = processEventSourceEndOfBody;
			fetchParams.processResponse = (response) => {
				if (isNetworkError(response)) if (response.aborted) {
					this.close();
					this.dispatchEvent(new Event("error"));
					return;
				} else {
					this.#reconnect();
					return;
				}
				const contentType = response.headersList.get("content-type", true);
				const mimeType = contentType !== null ? parseMIMEType(contentType) : "failure";
				const contentTypeValid = mimeType !== "failure" && mimeType.essence === "text/event-stream";
				if (response.status !== 200 || contentTypeValid === false) {
					this.close();
					this.dispatchEvent(new Event("error"));
					return;
				}
				this.#readyState = OPEN;
				this.dispatchEvent(new Event("open"));
				this.#state.origin = response.urlList[response.urlList.length - 1].origin;
				const eventSourceStream = new EventSourceStream({
					eventSourceSettings: this.#state,
					push: (event) => {
						this.dispatchEvent(createFastMessageEvent(event.type, event.options));
					}
				});
				pipeline(response.body.stream, eventSourceStream, (error) => {
					if (error?.aborted === false) {
						this.close();
						this.dispatchEvent(new Event("error"));
					}
				});
			};
			this.#controller = fetching(fetchParams);
		}
		/**
		* @see https://html.spec.whatwg.org/multipage/server-sent-events.html#sse-processing-model
		* @returns {Promise<void>}
		*/
		async #reconnect() {
			if (this.#readyState === CLOSED) return;
			this.#readyState = CONNECTING;
			this.dispatchEvent(new Event("error"));
			await delay(this.#state.reconnectionTime);
			if (this.#readyState !== CONNECTING) return;
			if (this.#state.lastEventId.length) this.#request.headersList.set("last-event-id", this.#state.lastEventId, true);
			this.#connect();
		}
		/**
		* Closes the connection, if any, and sets the readyState attribute to
		* CLOSED.
		*/
		close() {
			webidl.brandCheck(this, EventSource);
			if (this.#readyState === CLOSED) return;
			this.#readyState = CLOSED;
			this.#controller.abort();
			this.#request = null;
		}
		get onopen() {
			return this.#events.open;
		}
		set onopen(fn) {
			if (this.#events.open) this.removeEventListener("open", this.#events.open);
			if (typeof fn === "function") {
				this.#events.open = fn;
				this.addEventListener("open", fn);
			} else this.#events.open = null;
		}
		get onmessage() {
			return this.#events.message;
		}
		set onmessage(fn) {
			if (this.#events.message) this.removeEventListener("message", this.#events.message);
			if (typeof fn === "function") {
				this.#events.message = fn;
				this.addEventListener("message", fn);
			} else this.#events.message = null;
		}
		get onerror() {
			return this.#events.error;
		}
		set onerror(fn) {
			if (this.#events.error) this.removeEventListener("error", this.#events.error);
			if (typeof fn === "function") {
				this.#events.error = fn;
				this.addEventListener("error", fn);
			} else this.#events.error = null;
		}
	};
	const constantsPropertyDescriptors = {
		CONNECTING: {
			__proto__: null,
			configurable: false,
			enumerable: true,
			value: CONNECTING,
			writable: false
		},
		OPEN: {
			__proto__: null,
			configurable: false,
			enumerable: true,
			value: OPEN,
			writable: false
		},
		CLOSED: {
			__proto__: null,
			configurable: false,
			enumerable: true,
			value: CLOSED,
			writable: false
		}
	};
	Object.defineProperties(EventSource, constantsPropertyDescriptors);
	Object.defineProperties(EventSource.prototype, constantsPropertyDescriptors);
	Object.defineProperties(EventSource.prototype, {
		close: kEnumerableProperty,
		onerror: kEnumerableProperty,
		onmessage: kEnumerableProperty,
		onopen: kEnumerableProperty,
		readyState: kEnumerableProperty,
		url: kEnumerableProperty,
		withCredentials: kEnumerableProperty
	});
	webidl.converters.EventSourceInitDict = webidl.dictionaryConverter([{
		key: "withCredentials",
		converter: webidl.converters.boolean,
		defaultValue: () => false
	}, {
		key: "dispatcher",
		converter: webidl.converters.any
	}]);
	module.exports = {
		EventSource,
		defaultReconnectionTime
	};
}));
//#endregion
//#region node_modules/.pnpm/undici@6.28.0/node_modules/undici/index.js
var require_undici = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const Client = require_client();
	const Dispatcher = require_dispatcher();
	const Pool = require_pool();
	const BalancedPool = require_balanced_pool();
	const Agent = require_agent();
	const ProxyAgent = require_proxy_agent();
	const EnvHttpProxyAgent = require_env_http_proxy_agent();
	const RetryAgent = require_retry_agent();
	const errors = require_errors();
	const util = require_util$7();
	const { InvalidArgumentError } = errors;
	const api = require_api();
	const buildConnector = require_connect();
	const MockClient = require_mock_client();
	const MockAgent = require_mock_agent();
	const MockPool = require_mock_pool();
	const mockErrors = require_mock_errors();
	const RetryHandler = require_retry_handler();
	const { getGlobalDispatcher, setGlobalDispatcher } = require_global();
	const DecoratorHandler = require_decorator_handler();
	const RedirectHandler = require_redirect_handler();
	const createRedirectInterceptor = require_redirect_interceptor();
	Object.assign(Dispatcher.prototype, api);
	module.exports.Dispatcher = Dispatcher;
	module.exports.Client = Client;
	module.exports.Pool = Pool;
	module.exports.BalancedPool = BalancedPool;
	module.exports.Agent = Agent;
	module.exports.ProxyAgent = ProxyAgent;
	module.exports.EnvHttpProxyAgent = EnvHttpProxyAgent;
	module.exports.RetryAgent = RetryAgent;
	module.exports.RetryHandler = RetryHandler;
	module.exports.DecoratorHandler = DecoratorHandler;
	module.exports.RedirectHandler = RedirectHandler;
	module.exports.createRedirectInterceptor = createRedirectInterceptor;
	module.exports.interceptors = {
		redirect: require_redirect(),
		retry: require_retry(),
		dump: require_dump(),
		dns: require_dns()
	};
	module.exports.buildConnector = buildConnector;
	module.exports.errors = errors;
	module.exports.util = {
		parseHeaders: util.parseHeaders,
		headerNameToString: util.headerNameToString
	};
	function makeDispatcher(fn) {
		return (url, opts, handler) => {
			if (typeof opts === "function") {
				handler = opts;
				opts = null;
			}
			if (!url || typeof url !== "string" && typeof url !== "object" && !(url instanceof URL)) throw new InvalidArgumentError("invalid url");
			if (opts != null && typeof opts !== "object") throw new InvalidArgumentError("invalid opts");
			if (opts && opts.path != null) {
				if (typeof opts.path !== "string") throw new InvalidArgumentError("invalid opts.path");
				let path = opts.path;
				if (!opts.path.startsWith("/")) path = `/${path}`;
				url = new URL(util.parseOrigin(url).origin + path);
			} else {
				if (!opts) opts = typeof url === "object" ? url : {};
				url = util.parseURL(url);
			}
			const { agent, dispatcher = getGlobalDispatcher() } = opts;
			if (agent) throw new InvalidArgumentError("unsupported opts.agent. Did you mean opts.client?");
			return fn.call(dispatcher, {
				...opts,
				origin: url.origin,
				path: url.search ? `${url.pathname}${url.search}` : url.pathname,
				method: opts.method || (opts.body ? "PUT" : "GET")
			}, handler);
		};
	}
	module.exports.setGlobalDispatcher = setGlobalDispatcher;
	module.exports.getGlobalDispatcher = getGlobalDispatcher;
	const fetchImpl = require_fetch().fetch;
	module.exports.fetch = async function fetch(init, options = void 0) {
		try {
			return await fetchImpl(init, options);
		} catch (err) {
			if (err && typeof err === "object") Error.captureStackTrace(err);
			throw err;
		}
	};
	module.exports.Headers = require_headers().Headers;
	module.exports.Response = require_response().Response;
	module.exports.Request = require_request().Request;
	module.exports.FormData = require_formdata().FormData;
	module.exports.File = globalThis.File ?? __require("node:buffer").File;
	module.exports.FileReader = require_filereader().FileReader;
	const { setGlobalOrigin, getGlobalOrigin } = require_global$1();
	module.exports.setGlobalOrigin = setGlobalOrigin;
	module.exports.getGlobalOrigin = getGlobalOrigin;
	const { CacheStorage } = require_cachestorage();
	const { kConstruct } = require_symbols$1();
	module.exports.caches = new CacheStorage(kConstruct);
	const { deleteCookie, getCookies, getSetCookies, setCookie } = require_cookies();
	module.exports.deleteCookie = deleteCookie;
	module.exports.getCookies = getCookies;
	module.exports.getSetCookies = getSetCookies;
	module.exports.setCookie = setCookie;
	const { parseMIMEType, serializeAMimeType } = require_data_url();
	module.exports.parseMIMEType = parseMIMEType;
	module.exports.serializeAMimeType = serializeAMimeType;
	const { CloseEvent, ErrorEvent, MessageEvent } = require_events();
	module.exports.WebSocket = require_websocket().WebSocket;
	module.exports.CloseEvent = CloseEvent;
	module.exports.ErrorEvent = ErrorEvent;
	module.exports.MessageEvent = MessageEvent;
	module.exports.request = makeDispatcher(api.request);
	module.exports.stream = makeDispatcher(api.stream);
	module.exports.pipeline = makeDispatcher(api.pipeline);
	module.exports.connect = makeDispatcher(api.connect);
	module.exports.upgrade = makeDispatcher(api.upgrade);
	module.exports.MockClient = MockClient;
	module.exports.MockPool = MockPool;
	module.exports.MockAgent = MockAgent;
	module.exports.mockErrors = mockErrors;
	const { EventSource } = require_eventsource();
	module.exports.EventSource = EventSource;
}));
require_tunnel();
require_undici();
var HttpCodes;
(function(HttpCodes) {
	HttpCodes[HttpCodes["OK"] = 200] = "OK";
	HttpCodes[HttpCodes["MultipleChoices"] = 300] = "MultipleChoices";
	HttpCodes[HttpCodes["MovedPermanently"] = 301] = "MovedPermanently";
	HttpCodes[HttpCodes["ResourceMoved"] = 302] = "ResourceMoved";
	HttpCodes[HttpCodes["SeeOther"] = 303] = "SeeOther";
	HttpCodes[HttpCodes["NotModified"] = 304] = "NotModified";
	HttpCodes[HttpCodes["UseProxy"] = 305] = "UseProxy";
	HttpCodes[HttpCodes["SwitchProxy"] = 306] = "SwitchProxy";
	HttpCodes[HttpCodes["TemporaryRedirect"] = 307] = "TemporaryRedirect";
	HttpCodes[HttpCodes["PermanentRedirect"] = 308] = "PermanentRedirect";
	HttpCodes[HttpCodes["BadRequest"] = 400] = "BadRequest";
	HttpCodes[HttpCodes["Unauthorized"] = 401] = "Unauthorized";
	HttpCodes[HttpCodes["PaymentRequired"] = 402] = "PaymentRequired";
	HttpCodes[HttpCodes["Forbidden"] = 403] = "Forbidden";
	HttpCodes[HttpCodes["NotFound"] = 404] = "NotFound";
	HttpCodes[HttpCodes["MethodNotAllowed"] = 405] = "MethodNotAllowed";
	HttpCodes[HttpCodes["NotAcceptable"] = 406] = "NotAcceptable";
	HttpCodes[HttpCodes["ProxyAuthenticationRequired"] = 407] = "ProxyAuthenticationRequired";
	HttpCodes[HttpCodes["RequestTimeout"] = 408] = "RequestTimeout";
	HttpCodes[HttpCodes["Conflict"] = 409] = "Conflict";
	HttpCodes[HttpCodes["Gone"] = 410] = "Gone";
	HttpCodes[HttpCodes["TooManyRequests"] = 429] = "TooManyRequests";
	HttpCodes[HttpCodes["InternalServerError"] = 500] = "InternalServerError";
	HttpCodes[HttpCodes["NotImplemented"] = 501] = "NotImplemented";
	HttpCodes[HttpCodes["BadGateway"] = 502] = "BadGateway";
	HttpCodes[HttpCodes["ServiceUnavailable"] = 503] = "ServiceUnavailable";
	HttpCodes[HttpCodes["GatewayTimeout"] = 504] = "GatewayTimeout";
})(HttpCodes || (HttpCodes = {}));
var Headers;
(function(Headers) {
	Headers["Accept"] = "accept";
	Headers["ContentType"] = "content-type";
})(Headers || (Headers = {}));
var MediaTypes;
(function(MediaTypes) {
	MediaTypes["ApplicationJson"] = "application/json";
})(MediaTypes || (MediaTypes = {}));
HttpCodes.MovedPermanently, HttpCodes.ResourceMoved, HttpCodes.SeeOther, HttpCodes.TemporaryRedirect, HttpCodes.PermanentRedirect;
HttpCodes.BadGateway, HttpCodes.ServiceUnavailable, HttpCodes.GatewayTimeout;
//#endregion
//#region node_modules/.pnpm/@actions+core@3.0.1/node_modules/@actions/core/lib/summary.js
var __awaiter$6 = function(thisArg, _arguments, P, generator) {
	function adopt(value) {
		return value instanceof P ? value : new P(function(resolve) {
			resolve(value);
		});
	}
	return new (P || (P = Promise))(function(resolve, reject) {
		function fulfilled(value) {
			try {
				step(generator.next(value));
			} catch (e) {
				reject(e);
			}
		}
		function rejected(value) {
			try {
				step(generator["throw"](value));
			} catch (e) {
				reject(e);
			}
		}
		function step(result) {
			result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
		}
		step((generator = generator.apply(thisArg, _arguments || [])).next());
	});
};
const { access, appendFile, writeFile } = promises;
const SUMMARY_ENV_VAR = "GITHUB_STEP_SUMMARY";
var Summary = class {
	constructor() {
		this._buffer = "";
	}
	/**
	* Finds the summary file path from the environment, rejects if env var is not found or file does not exist
	* Also checks r/w permissions.
	*
	* @returns step summary file path
	*/
	filePath() {
		return __awaiter$6(this, void 0, void 0, function* () {
			if (this._filePath) return this._filePath;
			const pathFromEnv = process.env[SUMMARY_ENV_VAR];
			if (!pathFromEnv) throw new Error(`Unable to find environment variable for $${SUMMARY_ENV_VAR}. Check if your runtime environment supports job summaries.`);
			try {
				yield access(pathFromEnv, constants.R_OK | constants.W_OK);
			} catch (_a) {
				throw new Error(`Unable to access summary file: '${pathFromEnv}'. Check if the file has correct read/write permissions.`);
			}
			this._filePath = pathFromEnv;
			return this._filePath;
		});
	}
	/**
	* Wraps content in an HTML tag, adding any HTML attributes
	*
	* @param {string} tag HTML tag to wrap
	* @param {string | null} content content within the tag
	* @param {[attribute: string]: string} attrs key-value list of HTML attributes to add
	*
	* @returns {string} content wrapped in HTML element
	*/
	wrap(tag, content, attrs = {}) {
		const htmlAttrs = Object.entries(attrs).map(([key, value]) => ` ${key}="${value}"`).join("");
		if (!content) return `<${tag}${htmlAttrs}>`;
		return `<${tag}${htmlAttrs}>${content}</${tag}>`;
	}
	/**
	* Writes text in the buffer to the summary buffer file and empties buffer. Will append by default.
	*
	* @param {SummaryWriteOptions} [options] (optional) options for write operation
	*
	* @returns {Promise<Summary>} summary instance
	*/
	write(options) {
		return __awaiter$6(this, void 0, void 0, function* () {
			const overwrite = !!(options === null || options === void 0 ? void 0 : options.overwrite);
			const filePath = yield this.filePath();
			yield (overwrite ? writeFile : appendFile)(filePath, this._buffer, { encoding: "utf8" });
			return this.emptyBuffer();
		});
	}
	/**
	* Clears the summary buffer and wipes the summary file
	*
	* @returns {Summary} summary instance
	*/
	clear() {
		return __awaiter$6(this, void 0, void 0, function* () {
			return this.emptyBuffer().write({ overwrite: true });
		});
	}
	/**
	* Returns the current summary buffer as a string
	*
	* @returns {string} string of summary buffer
	*/
	stringify() {
		return this._buffer;
	}
	/**
	* If the summary buffer is empty
	*
	* @returns {boolen} true if the buffer is empty
	*/
	isEmptyBuffer() {
		return this._buffer.length === 0;
	}
	/**
	* Resets the summary buffer without writing to summary file
	*
	* @returns {Summary} summary instance
	*/
	emptyBuffer() {
		this._buffer = "";
		return this;
	}
	/**
	* Adds raw text to the summary buffer
	*
	* @param {string} text content to add
	* @param {boolean} [addEOL=false] (optional) append an EOL to the raw text (default: false)
	*
	* @returns {Summary} summary instance
	*/
	addRaw(text, addEOL = false) {
		this._buffer += text;
		return addEOL ? this.addEOL() : this;
	}
	/**
	* Adds the operating system-specific end-of-line marker to the buffer
	*
	* @returns {Summary} summary instance
	*/
	addEOL() {
		return this.addRaw(EOL);
	}
	/**
	* Adds an HTML codeblock to the summary buffer
	*
	* @param {string} code content to render within fenced code block
	* @param {string} lang (optional) language to syntax highlight code
	*
	* @returns {Summary} summary instance
	*/
	addCodeBlock(code, lang) {
		const attrs = Object.assign({}, lang && { lang });
		const element = this.wrap("pre", this.wrap("code", code), attrs);
		return this.addRaw(element).addEOL();
	}
	/**
	* Adds an HTML list to the summary buffer
	*
	* @param {string[]} items list of items to render
	* @param {boolean} [ordered=false] (optional) if the rendered list should be ordered or not (default: false)
	*
	* @returns {Summary} summary instance
	*/
	addList(items, ordered = false) {
		const tag = ordered ? "ol" : "ul";
		const listItems = items.map((item) => this.wrap("li", item)).join("");
		const element = this.wrap(tag, listItems);
		return this.addRaw(element).addEOL();
	}
	/**
	* Adds an HTML table to the summary buffer
	*
	* @param {SummaryTableCell[]} rows table rows
	*
	* @returns {Summary} summary instance
	*/
	addTable(rows) {
		const tableBody = rows.map((row) => {
			const cells = row.map((cell) => {
				if (typeof cell === "string") return this.wrap("td", cell);
				const { header, data, colspan, rowspan } = cell;
				const tag = header ? "th" : "td";
				const attrs = Object.assign(Object.assign({}, colspan && { colspan }), rowspan && { rowspan });
				return this.wrap(tag, data, attrs);
			}).join("");
			return this.wrap("tr", cells);
		}).join("");
		const element = this.wrap("table", tableBody);
		return this.addRaw(element).addEOL();
	}
	/**
	* Adds a collapsable HTML details element to the summary buffer
	*
	* @param {string} label text for the closed state
	* @param {string} content collapsable content
	*
	* @returns {Summary} summary instance
	*/
	addDetails(label, content) {
		const element = this.wrap("details", this.wrap("summary", label) + content);
		return this.addRaw(element).addEOL();
	}
	/**
	* Adds an HTML image tag to the summary buffer
	*
	* @param {string} src path to the image you to embed
	* @param {string} alt text description of the image
	* @param {SummaryImageOptions} options (optional) addition image attributes
	*
	* @returns {Summary} summary instance
	*/
	addImage(src, alt, options) {
		const { width, height } = options || {};
		const attrs = Object.assign(Object.assign({}, width && { width }), height && { height });
		const element = this.wrap("img", null, Object.assign({
			src,
			alt
		}, attrs));
		return this.addRaw(element).addEOL();
	}
	/**
	* Adds an HTML section heading element
	*
	* @param {string} text heading text
	* @param {number | string} [level=1] (optional) the heading level, default: 1
	*
	* @returns {Summary} summary instance
	*/
	addHeading(text, level) {
		const tag = `h${level}`;
		const allowedTag = [
			"h1",
			"h2",
			"h3",
			"h4",
			"h5",
			"h6"
		].includes(tag) ? tag : "h1";
		const element = this.wrap(allowedTag, text);
		return this.addRaw(element).addEOL();
	}
	/**
	* Adds an HTML thematic break (<hr>) to the summary buffer
	*
	* @returns {Summary} summary instance
	*/
	addSeparator() {
		const element = this.wrap("hr", null);
		return this.addRaw(element).addEOL();
	}
	/**
	* Adds an HTML line break (<br>) to the summary buffer
	*
	* @returns {Summary} summary instance
	*/
	addBreak() {
		const element = this.wrap("br", null);
		return this.addRaw(element).addEOL();
	}
	/**
	* Adds an HTML blockquote to the summary buffer
	*
	* @param {string} text quote text
	* @param {string} cite (optional) citation url
	*
	* @returns {Summary} summary instance
	*/
	addQuote(text, cite) {
		const attrs = Object.assign({}, cite && { cite });
		const element = this.wrap("blockquote", text, attrs);
		return this.addRaw(element).addEOL();
	}
	/**
	* Adds an HTML anchor tag to the summary buffer
	*
	* @param {string} text link text/content
	* @param {string} href hyperlink
	*
	* @returns {Summary} summary instance
	*/
	addLink(text, href) {
		const element = this.wrap("a", text, { href });
		return this.addRaw(element).addEOL();
	}
};
new Summary();
const { chmod, copyFile, lstat, mkdir, open, readdir, rename, rm, rmdir, stat, symlink, unlink } = fs.promises;
process.platform;
fs.constants.O_RDONLY;
process.platform;
events.EventEmitter;
events.EventEmitter;
os.platform();
os.arch();
/**
* The code to exit an action
*/
var ExitCode;
(function(ExitCode) {
	/**
	* A code indicating that the action was successful
	*/
	ExitCode[ExitCode["Success"] = 0] = "Success";
	/**
	* A code indicating that the action was a failure
	*/
	ExitCode[ExitCode["Failure"] = 1] = "Failure";
})(ExitCode || (ExitCode = {}));
/**
* Sets env variable for this action and future actions in the job
* @param name the name of the variable to set
* @param val the value of the variable. Non-string values will be converted to a string via JSON.stringify
*/
function exportVariable(name, val) {
	const convertedVal = toCommandValue(val);
	process.env[name] = convertedVal;
	if (process.env["GITHUB_ENV"] || "") return issueFileCommand("ENV", prepareKeyValueMessage(name, val));
	issueCommand("set-env", { name }, convertedVal);
}
/**
* Registers a secret which will get masked from logs
*
* @param secret - Value of the secret to be masked
* @remarks
* This function instructs the Actions runner to mask the specified value in any
* logs produced during the workflow run. Once registered, the secret value will
* be replaced with asterisks (***) whenever it appears in console output, logs,
* or error messages.
*
* This is useful for protecting sensitive information such as:
* - API keys
* - Access tokens
* - Authentication credentials
* - URL parameters containing signatures (SAS tokens)
*
* Note that masking only affects future logs; any previous appearances of the
* secret in logs before calling this function will remain unmasked.
*
* @example
* ```typescript
* // Register an API token as a secret
* const apiToken = "abc123xyz456";
* setSecret(apiToken);
*
* // Now any logs containing this value will show *** instead
* console.log(`Using token: ${apiToken}`); // Outputs: "Using token: ***"
* ```
*/
function setSecret(secret) {
	issueCommand("add-mask", {}, secret);
}
/**
* Gets the value of an input.
* Unless trimWhitespace is set to false in InputOptions, the value is also trimmed.
* Returns an empty string if the value is not defined.
*
* @param     name     name of the input to get
* @param     options  optional. See InputOptions.
* @returns   string
*/
function getInput(name, options) {
	const val = process.env[`INPUT_${name.replace(/ /g, "_").toUpperCase()}`] || "";
	if (options && options.required && !val) throw new Error(`Input required and not supplied: ${name}`);
	if (options && options.trimWhitespace === false) return val;
	return val.trim();
}
/**
* Sets the value of an output.
*
* @param     name     name of the output to set
* @param     value    value to store. Non-string values will be converted to a string via JSON.stringify
*/
function setOutput(name, value) {
	if (process.env["GITHUB_OUTPUT"] || "") return issueFileCommand("OUTPUT", prepareKeyValueMessage(name, value));
	process.stdout.write(os$1.EOL);
	issueCommand("set-output", { name }, toCommandValue(value));
}
/**
* Sets the action status to failed.
* When the action exits it will be with an exit code of 1
* @param message add error issue message
*/
function setFailed(message) {
	process.exitCode = ExitCode.Failure;
	error(message);
}
/**
* Adds an error issue
* @param message error issue message. Errors will be converted to string via toString()
* @param properties optional properties to add to the annotation.
*/
function error(message, properties = {}) {
	issueCommand("error", toCommandProperties(properties), message instanceof Error ? message.toString() : message);
}
/**
* Writes info to log with console.log.
* @param message info message
*/
function info(message) {
	process.stdout.write(message + os$1.EOL);
}
//#endregion
//#region node_modules/.pnpm/@noble+ciphers@1.3.0/node_modules/@noble/ciphers/utils.js
var require_utils$3 = /* @__PURE__ */ __commonJSMin(((exports) => {
	/**
	* Utilities for hex, bytes, CSPRNG.
	* @module
	*/
	/*! noble-ciphers - MIT License (c) 2023 Paul Miller (paulmillr.com) */
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.wrapCipher = exports.Hash = exports.nextTick = exports.isLE = void 0;
	exports.isBytes = isBytes;
	exports.abool = abool;
	exports.anumber = anumber;
	exports.abytes = abytes;
	exports.ahash = ahash;
	exports.aexists = aexists;
	exports.aoutput = aoutput;
	exports.u8 = u8;
	exports.u32 = u32;
	exports.clean = clean;
	exports.createView = createView;
	exports.bytesToHex = bytesToHex;
	exports.hexToBytes = hexToBytes;
	exports.hexToNumber = hexToNumber;
	exports.bytesToNumberBE = bytesToNumberBE;
	exports.numberToBytesBE = numberToBytesBE;
	exports.utf8ToBytes = utf8ToBytes;
	exports.bytesToUtf8 = bytesToUtf8;
	exports.toBytes = toBytes;
	exports.overlapBytes = overlapBytes;
	exports.complexOverlapBytes = complexOverlapBytes;
	exports.concatBytes = concatBytes;
	exports.checkOpts = checkOpts;
	exports.equalBytes = equalBytes;
	exports.getOutput = getOutput;
	exports.setBigUint64 = setBigUint64;
	exports.u64Lengths = u64Lengths;
	exports.isAligned32 = isAligned32;
	exports.copyBytes = copyBytes;
	/** Checks if something is Uint8Array. Be careful: nodejs Buffer will return true. */
	function isBytes(a) {
		return a instanceof Uint8Array || ArrayBuffer.isView(a) && a.constructor.name === "Uint8Array";
	}
	/** Asserts something is boolean. */
	function abool(b) {
		if (typeof b !== "boolean") throw new Error(`boolean expected, not ${b}`);
	}
	/** Asserts something is positive integer. */
	function anumber(n) {
		if (!Number.isSafeInteger(n) || n < 0) throw new Error("positive integer expected, got " + n);
	}
	/** Asserts something is Uint8Array. */
	function abytes(b, ...lengths) {
		if (!isBytes(b)) throw new Error("Uint8Array expected");
		if (lengths.length > 0 && !lengths.includes(b.length)) throw new Error("Uint8Array expected of length " + lengths + ", got length=" + b.length);
	}
	/**
	* Asserts something is hash
	* TODO: remove
	* @deprecated
	*/
	function ahash(h) {
		if (typeof h !== "function" || typeof h.create !== "function") throw new Error("Hash should be wrapped by utils.createHasher");
		anumber(h.outputLen);
		anumber(h.blockLen);
	}
	/** Asserts a hash instance has not been destroyed / finished */
	function aexists(instance, checkFinished = true) {
		if (instance.destroyed) throw new Error("Hash instance has been destroyed");
		if (checkFinished && instance.finished) throw new Error("Hash#digest() has already been called");
	}
	/** Asserts output is properly-sized byte array */
	function aoutput(out, instance) {
		abytes(out);
		const min = instance.outputLen;
		if (out.length < min) throw new Error("digestInto() expects output buffer of length at least " + min);
	}
	/** Cast u8 / u16 / u32 to u8. */
	function u8(arr) {
		return new Uint8Array(arr.buffer, arr.byteOffset, arr.byteLength);
	}
	/** Cast u8 / u16 / u32 to u32. */
	function u32(arr) {
		return new Uint32Array(arr.buffer, arr.byteOffset, Math.floor(arr.byteLength / 4));
	}
	/** Zeroize a byte array. Warning: JS provides no guarantees. */
	function clean(...arrays) {
		for (let i = 0; i < arrays.length; i++) arrays[i].fill(0);
	}
	/** Create DataView of an array for easy byte-level manipulation. */
	function createView(arr) {
		return new DataView(arr.buffer, arr.byteOffset, arr.byteLength);
	}
	/** Is current platform little-endian? Most are. Big-Endian platform: IBM */
	exports.isLE = (() => new Uint8Array(new Uint32Array([287454020]).buffer)[0] === 68)();
	const hasHexBuiltin = /* @__PURE__ */ (() => typeof Uint8Array.from([]).toHex === "function" && typeof Uint8Array.fromHex === "function")();
	const hexes = /* @__PURE__ */ Array.from({ length: 256 }, (_, i) => i.toString(16).padStart(2, "0"));
	/**
	* Convert byte array to hex string. Uses built-in function, when available.
	* @example bytesToHex(Uint8Array.from([0xca, 0xfe, 0x01, 0x23])) // 'cafe0123'
	*/
	function bytesToHex(bytes) {
		abytes(bytes);
		if (hasHexBuiltin) return bytes.toHex();
		let hex = "";
		for (let i = 0; i < bytes.length; i++) hex += hexes[bytes[i]];
		return hex;
	}
	const asciis = {
		_0: 48,
		_9: 57,
		A: 65,
		F: 70,
		a: 97,
		f: 102
	};
	function asciiToBase16(ch) {
		if (ch >= asciis._0 && ch <= asciis._9) return ch - asciis._0;
		if (ch >= asciis.A && ch <= asciis.F) return ch - (asciis.A - 10);
		if (ch >= asciis.a && ch <= asciis.f) return ch - (asciis.a - 10);
	}
	/**
	* Convert hex string to byte array. Uses built-in function, when available.
	* @example hexToBytes('cafe0123') // Uint8Array.from([0xca, 0xfe, 0x01, 0x23])
	*/
	function hexToBytes(hex) {
		if (typeof hex !== "string") throw new Error("hex string expected, got " + typeof hex);
		if (hasHexBuiltin) return Uint8Array.fromHex(hex);
		const hl = hex.length;
		const al = hl / 2;
		if (hl % 2) throw new Error("hex string expected, got unpadded hex of length " + hl);
		const array = new Uint8Array(al);
		for (let ai = 0, hi = 0; ai < al; ai++, hi += 2) {
			const n1 = asciiToBase16(hex.charCodeAt(hi));
			const n2 = asciiToBase16(hex.charCodeAt(hi + 1));
			if (n1 === void 0 || n2 === void 0) {
				const char = hex[hi] + hex[hi + 1];
				throw new Error("hex string expected, got non-hex character \"" + char + "\" at index " + hi);
			}
			array[ai] = n1 * 16 + n2;
		}
		return array;
	}
	function hexToNumber(hex) {
		if (typeof hex !== "string") throw new Error("hex string expected, got " + typeof hex);
		return BigInt(hex === "" ? "0" : "0x" + hex);
	}
	function bytesToNumberBE(bytes) {
		return hexToNumber(bytesToHex(bytes));
	}
	function numberToBytesBE(n, len) {
		return hexToBytes(n.toString(16).padStart(len * 2, "0"));
	}
	const nextTick = async () => {};
	exports.nextTick = nextTick;
	/**
	* Converts string to bytes using UTF8 encoding.
	* @example utf8ToBytes('abc') // new Uint8Array([97, 98, 99])
	*/
	function utf8ToBytes(str) {
		if (typeof str !== "string") throw new Error("string expected");
		return new Uint8Array(new TextEncoder().encode(str));
	}
	/**
	* Converts bytes to string using UTF8 encoding.
	* @example bytesToUtf8(new Uint8Array([97, 98, 99])) // 'abc'
	*/
	function bytesToUtf8(bytes) {
		return new TextDecoder().decode(bytes);
	}
	/**
	* Normalizes (non-hex) string or Uint8Array to Uint8Array.
	* Warning: when Uint8Array is passed, it would NOT get copied.
	* Keep in mind for future mutable operations.
	*/
	function toBytes(data) {
		if (typeof data === "string") data = utf8ToBytes(data);
		else if (isBytes(data)) data = copyBytes(data);
		else throw new Error("Uint8Array expected, got " + typeof data);
		return data;
	}
	/**
	* Checks if two U8A use same underlying buffer and overlaps.
	* This is invalid and can corrupt data.
	*/
	function overlapBytes(a, b) {
		return a.buffer === b.buffer && a.byteOffset < b.byteOffset + b.byteLength && b.byteOffset < a.byteOffset + a.byteLength;
	}
	/**
	* If input and output overlap and input starts before output, we will overwrite end of input before
	* we start processing it, so this is not supported for most ciphers (except chacha/salse, which designed with this)
	*/
	function complexOverlapBytes(input, output) {
		if (overlapBytes(input, output) && input.byteOffset < output.byteOffset) throw new Error("complex overlap of input and output is not supported");
	}
	/**
	* Copies several Uint8Arrays into one.
	*/
	function concatBytes(...arrays) {
		let sum = 0;
		for (let i = 0; i < arrays.length; i++) {
			const a = arrays[i];
			abytes(a);
			sum += a.length;
		}
		const res = new Uint8Array(sum);
		for (let i = 0, pad = 0; i < arrays.length; i++) {
			const a = arrays[i];
			res.set(a, pad);
			pad += a.length;
		}
		return res;
	}
	function checkOpts(defaults, opts) {
		if (opts == null || typeof opts !== "object") throw new Error("options must be defined");
		return Object.assign(defaults, opts);
	}
	/** Compares 2 uint8array-s in kinda constant time. */
	function equalBytes(a, b) {
		if (a.length !== b.length) return false;
		let diff = 0;
		for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
		return diff === 0;
	}
	/** For runtime check if class implements interface. */
	var Hash = class {};
	exports.Hash = Hash;
	/**
	* Wraps a cipher: validates args, ensures encrypt() can only be called once.
	* @__NO_SIDE_EFFECTS__
	*/
	const wrapCipher = (params, constructor) => {
		function wrappedCipher(key, ...args) {
			abytes(key);
			if (!exports.isLE) throw new Error("Non little-endian hardware is not yet supported");
			if (params.nonceLength !== void 0) {
				const nonce = args[0];
				if (!nonce) throw new Error("nonce / iv required");
				if (params.varSizeNonce) abytes(nonce);
				else abytes(nonce, params.nonceLength);
			}
			const tagl = params.tagLength;
			if (tagl && args[1] !== void 0) abytes(args[1]);
			const cipher = constructor(key, ...args);
			const checkOutput = (fnLength, output) => {
				if (output !== void 0) {
					if (fnLength !== 2) throw new Error("cipher output not supported");
					abytes(output);
				}
			};
			let called = false;
			return {
				encrypt(data, output) {
					if (called) throw new Error("cannot encrypt() twice with same key + nonce");
					called = true;
					abytes(data);
					checkOutput(cipher.encrypt.length, output);
					return cipher.encrypt(data, output);
				},
				decrypt(data, output) {
					abytes(data);
					if (tagl && data.length < tagl) throw new Error("invalid ciphertext length: smaller than tagLength=" + tagl);
					checkOutput(cipher.decrypt.length, output);
					return cipher.decrypt(data, output);
				}
			};
		}
		Object.assign(wrappedCipher, params);
		return wrappedCipher;
	};
	exports.wrapCipher = wrapCipher;
	/**
	* By default, returns u8a of length.
	* When out is available, it checks it for validity and uses it.
	*/
	function getOutput(expectedLength, out, onlyAligned = true) {
		if (out === void 0) return new Uint8Array(expectedLength);
		if (out.length !== expectedLength) throw new Error("invalid output length, expected " + expectedLength + ", got: " + out.length);
		if (onlyAligned && !isAligned32(out)) throw new Error("invalid output, must be aligned");
		return out;
	}
	/** Polyfill for Safari 14. */
	function setBigUint64(view, byteOffset, value, isLE) {
		if (typeof view.setBigUint64 === "function") return view.setBigUint64(byteOffset, value, isLE);
		const _32n = BigInt(32);
		const _u32_max = BigInt(4294967295);
		const wh = Number(value >> _32n & _u32_max);
		const wl = Number(value & _u32_max);
		const h = isLE ? 4 : 0;
		const l = isLE ? 0 : 4;
		view.setUint32(byteOffset + h, wh, isLE);
		view.setUint32(byteOffset + l, wl, isLE);
	}
	function u64Lengths(dataLength, aadLength, isLE) {
		abool(isLE);
		const num = /* @__PURE__ */ new Uint8Array(16);
		const view = createView(num);
		setBigUint64(view, 0, BigInt(aadLength), isLE);
		setBigUint64(view, 8, BigInt(dataLength), isLE);
		return num;
	}
	function isAligned32(bytes) {
		return bytes.byteOffset % 4 === 0;
	}
	function copyBytes(bytes) {
		return Uint8Array.from(bytes);
	}
}));
//#endregion
//#region node_modules/.pnpm/eciesjs@0.5.0/node_modules/eciesjs/dist/consts.js
var require_consts = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.AEAD_TAG_LENGTH = exports.XCHACHA20_NONCE_LENGTH = exports.CURVE25519_PUBLIC_KEY_SIZE = exports.ETH_PUBLIC_KEY_SIZE = exports.UNCOMPRESSED_PUBLIC_KEY_SIZE = exports.COMPRESSED_PUBLIC_KEY_SIZE = exports.SECRET_KEY_LENGTH = void 0;
	exports.SECRET_KEY_LENGTH = 32;
	exports.COMPRESSED_PUBLIC_KEY_SIZE = 33;
	exports.UNCOMPRESSED_PUBLIC_KEY_SIZE = 65;
	exports.ETH_PUBLIC_KEY_SIZE = 64;
	exports.CURVE25519_PUBLIC_KEY_SIZE = 32;
	exports.XCHACHA20_NONCE_LENGTH = 24;
	exports.AEAD_TAG_LENGTH = 16;
}));
//#endregion
//#region node_modules/.pnpm/eciesjs@0.5.0/node_modules/eciesjs/dist/config.js
var require_config = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.ECIES_CONFIG = exports.Config = void 0;
	const consts_js_1 = require_consts();
	var Config = class {
		constructor() {
			this.ellipticCurve = "secp256k1";
			this.isEphemeralKeyCompressed = false;
			this.isHkdfKeyCompressed = false;
			this.symmetricAlgorithm = "aes-256-gcm";
			this.symmetricNonceLength = 16;
		}
		get ephemeralKeySize() {
			const mapping = {
				secp256k1: this.isEphemeralKeyCompressed ? consts_js_1.COMPRESSED_PUBLIC_KEY_SIZE : consts_js_1.UNCOMPRESSED_PUBLIC_KEY_SIZE,
				x25519: consts_js_1.CURVE25519_PUBLIC_KEY_SIZE,
				ed25519: consts_js_1.CURVE25519_PUBLIC_KEY_SIZE
			};
			/* v8 ignore else -- @preserve */
			if (this.ellipticCurve in mapping) return mapping[this.ellipticCurve];
			else throw new Error("Not implemented");
		}
	};
	exports.Config = Config;
	exports.ECIES_CONFIG = new Config();
}));
//#endregion
//#region node_modules/.pnpm/@noble+ciphers@1.3.0/node_modules/@noble/ciphers/cryptoNode.js
var require_cryptoNode$1 = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.crypto = void 0;
	/**
	* Internal webcrypto alias.
	* We prefer WebCrypto aka globalThis.crypto, which exists in node.js 16+.
	* Falls back to Node.js built-in crypto for Node.js <=v14.
	* See utils.ts for details.
	* @module
	*/
	const nc$1 = __require("node:crypto");
	exports.crypto = nc$1 && typeof nc$1 === "object" && "webcrypto" in nc$1 ? nc$1.webcrypto : nc$1 && typeof nc$1 === "object" && "randomBytes" in nc$1 ? nc$1 : void 0;
}));
//#endregion
//#region node_modules/.pnpm/@noble+ciphers@1.3.0/node_modules/@noble/ciphers/webcrypto.js
var require_webcrypto = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.gcm = exports.ctr = exports.cbc = exports.utils = void 0;
	exports.randomBytes = randomBytes;
	exports.getWebcryptoSubtle = getWebcryptoSubtle;
	exports.managedNonce = managedNonce;
	/**
	* WebCrypto-based AES gcm/ctr/cbc, `managedNonce` and `randomBytes`.
	* We use WebCrypto aka globalThis.crypto, which exists in browsers and node.js 16+.
	* node.js versions earlier than v19 don't declare it in global scope.
	* For node.js, package.js on#exports field mapping rewrites import
	* from `crypto` to `cryptoNode`, which imports native module.
	* Makes the utils un-importable in browsers without a bundler.
	* Once node.js 18 is deprecated, we can just drop the import.
	* @module
	*/
	const crypto_1 = require_cryptoNode$1();
	const utils_ts_1 = require_utils$3();
	/**
	* Secure PRNG. Uses `crypto.getRandomValues`, which defers to OS.
	*/
	function randomBytes(bytesLength = 32) {
		if (crypto_1.crypto && typeof crypto_1.crypto.getRandomValues === "function") return crypto_1.crypto.getRandomValues(new Uint8Array(bytesLength));
		if (crypto_1.crypto && typeof crypto_1.crypto.randomBytes === "function") return Uint8Array.from(crypto_1.crypto.randomBytes(bytesLength));
		throw new Error("crypto.getRandomValues must be defined");
	}
	function getWebcryptoSubtle() {
		if (crypto_1.crypto && typeof crypto_1.crypto.subtle === "object" && crypto_1.crypto.subtle != null) return crypto_1.crypto.subtle;
		throw new Error("crypto.subtle must be defined");
	}
	/**
	* Uses CSPRG for nonce, nonce injected in ciphertext.
	* @example
	* const gcm = managedNonce(aes.gcm);
	* const ciphr = gcm(key).encrypt(data);
	* const plain = gcm(key).decrypt(ciph);
	*/
	function managedNonce(fn) {
		const { nonceLength } = fn;
		(0, utils_ts_1.anumber)(nonceLength);
		return ((key, ...args) => ({
			encrypt(plaintext, ...argsEnc) {
				const nonce = randomBytes(nonceLength);
				const ciphertext = fn(key, nonce, ...args).encrypt(plaintext, ...argsEnc);
				const out = (0, utils_ts_1.concatBytes)(nonce, ciphertext);
				ciphertext.fill(0);
				return out;
			},
			decrypt(ciphertext, ...argsDec) {
				const nonce = ciphertext.subarray(0, nonceLength);
				const data = ciphertext.subarray(nonceLength);
				return fn(key, nonce, ...args).decrypt(data, ...argsDec);
			}
		}));
	}
	exports.utils = {
		async encrypt(key, keyParams, cryptParams, plaintext) {
			const cr = getWebcryptoSubtle();
			const iKey = await cr.importKey("raw", key, keyParams, true, ["encrypt"]);
			const ciphertext = await cr.encrypt(cryptParams, iKey, plaintext);
			return new Uint8Array(ciphertext);
		},
		async decrypt(key, keyParams, cryptParams, ciphertext) {
			const cr = getWebcryptoSubtle();
			const iKey = await cr.importKey("raw", key, keyParams, true, ["decrypt"]);
			const plaintext = await cr.decrypt(cryptParams, iKey, ciphertext);
			return new Uint8Array(plaintext);
		}
	};
	const mode = {
		CBC: "AES-CBC",
		CTR: "AES-CTR",
		GCM: "AES-GCM"
	};
	function getCryptParams(algo, nonce, AAD) {
		if (algo === mode.CBC) return {
			name: mode.CBC,
			iv: nonce
		};
		if (algo === mode.CTR) return {
			name: mode.CTR,
			counter: nonce,
			length: 64
		};
		if (algo === mode.GCM) if (AAD) return {
			name: mode.GCM,
			iv: nonce,
			additionalData: AAD
		};
		else return {
			name: mode.GCM,
			iv: nonce
		};
		throw new Error("unknown aes block mode");
	}
	function generate(algo) {
		return (key, nonce, AAD) => {
			(0, utils_ts_1.abytes)(key);
			(0, utils_ts_1.abytes)(nonce);
			const keyParams = {
				name: algo,
				length: key.length * 8
			};
			const cryptParams = getCryptParams(algo, nonce, AAD);
			let consumed = false;
			return {
				encrypt(plaintext) {
					(0, utils_ts_1.abytes)(plaintext);
					if (consumed) throw new Error("Cannot encrypt() twice with same key / nonce");
					consumed = true;
					return exports.utils.encrypt(key, keyParams, cryptParams, plaintext);
				},
				decrypt(ciphertext) {
					(0, utils_ts_1.abytes)(ciphertext);
					return exports.utils.decrypt(key, keyParams, cryptParams, ciphertext);
				}
			};
		};
	}
	/** AES-CBC, native webcrypto version */
	exports.cbc = (() => generate(mode.CBC))();
	/** AES-CTR, native webcrypto version */
	exports.ctr = (() => generate(mode.CTR))();
	/** AES-GCM, native webcrypto version */
	exports.gcm = /* @__PURE__ */ (() => generate(mode.GCM))();
}));
//#endregion
//#region node_modules/.pnpm/@noble+hashes@1.8.0/node_modules/@noble/hashes/cryptoNode.js
var require_cryptoNode = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.crypto = void 0;
	/**
	* Internal webcrypto alias.
	* We prefer WebCrypto aka globalThis.crypto, which exists in node.js 16+.
	* Falls back to Node.js built-in crypto for Node.js <=v14.
	* See utils.ts for details.
	* @module
	*/
	const nc = __require("node:crypto");
	exports.crypto = nc && typeof nc === "object" && "webcrypto" in nc ? nc.webcrypto : nc && typeof nc === "object" && "randomBytes" in nc ? nc : void 0;
}));
//#endregion
//#region node_modules/.pnpm/@noble+hashes@1.8.0/node_modules/@noble/hashes/utils.js
var require_utils$2 = /* @__PURE__ */ __commonJSMin(((exports) => {
	/**
	* Utilities for hex, bytes, CSPRNG.
	* @module
	*/
	/*! noble-hashes - MIT License (c) 2022 Paul Miller (paulmillr.com) */
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.wrapXOFConstructorWithOpts = exports.wrapConstructorWithOpts = exports.wrapConstructor = exports.Hash = exports.nextTick = exports.swap32IfBE = exports.byteSwapIfBE = exports.swap8IfBE = exports.isLE = void 0;
	exports.isBytes = isBytes;
	exports.anumber = anumber;
	exports.abytes = abytes;
	exports.ahash = ahash;
	exports.aexists = aexists;
	exports.aoutput = aoutput;
	exports.u8 = u8;
	exports.u32 = u32;
	exports.clean = clean;
	exports.createView = createView;
	exports.rotr = rotr;
	exports.rotl = rotl;
	exports.byteSwap = byteSwap;
	exports.byteSwap32 = byteSwap32;
	exports.bytesToHex = bytesToHex;
	exports.hexToBytes = hexToBytes;
	exports.asyncLoop = asyncLoop;
	exports.utf8ToBytes = utf8ToBytes;
	exports.bytesToUtf8 = bytesToUtf8;
	exports.toBytes = toBytes;
	exports.kdfInputToBytes = kdfInputToBytes;
	exports.concatBytes = concatBytes;
	exports.checkOpts = checkOpts;
	exports.createHasher = createHasher;
	exports.createOptHasher = createOptHasher;
	exports.createXOFer = createXOFer;
	exports.randomBytes = randomBytes;
	const crypto_1 = require_cryptoNode();
	/** Checks if something is Uint8Array. Be careful: nodejs Buffer will return true. */
	function isBytes(a) {
		return a instanceof Uint8Array || ArrayBuffer.isView(a) && a.constructor.name === "Uint8Array";
	}
	/** Asserts something is positive integer. */
	function anumber(n) {
		if (!Number.isSafeInteger(n) || n < 0) throw new Error("positive integer expected, got " + n);
	}
	/** Asserts something is Uint8Array. */
	function abytes(b, ...lengths) {
		if (!isBytes(b)) throw new Error("Uint8Array expected");
		if (lengths.length > 0 && !lengths.includes(b.length)) throw new Error("Uint8Array expected of length " + lengths + ", got length=" + b.length);
	}
	/** Asserts something is hash */
	function ahash(h) {
		if (typeof h !== "function" || typeof h.create !== "function") throw new Error("Hash should be wrapped by utils.createHasher");
		anumber(h.outputLen);
		anumber(h.blockLen);
	}
	/** Asserts a hash instance has not been destroyed / finished */
	function aexists(instance, checkFinished = true) {
		if (instance.destroyed) throw new Error("Hash instance has been destroyed");
		if (checkFinished && instance.finished) throw new Error("Hash#digest() has already been called");
	}
	/** Asserts output is properly-sized byte array */
	function aoutput(out, instance) {
		abytes(out);
		const min = instance.outputLen;
		if (out.length < min) throw new Error("digestInto() expects output buffer of length at least " + min);
	}
	/** Cast u8 / u16 / u32 to u8. */
	function u8(arr) {
		return new Uint8Array(arr.buffer, arr.byteOffset, arr.byteLength);
	}
	/** Cast u8 / u16 / u32 to u32. */
	function u32(arr) {
		return new Uint32Array(arr.buffer, arr.byteOffset, Math.floor(arr.byteLength / 4));
	}
	/** Zeroize a byte array. Warning: JS provides no guarantees. */
	function clean(...arrays) {
		for (let i = 0; i < arrays.length; i++) arrays[i].fill(0);
	}
	/** Create DataView of an array for easy byte-level manipulation. */
	function createView(arr) {
		return new DataView(arr.buffer, arr.byteOffset, arr.byteLength);
	}
	/** The rotate right (circular right shift) operation for uint32 */
	function rotr(word, shift) {
		return word << 32 - shift | word >>> shift;
	}
	/** The rotate left (circular left shift) operation for uint32 */
	function rotl(word, shift) {
		return word << shift | word >>> 32 - shift >>> 0;
	}
	/** Is current platform little-endian? Most are. Big-Endian platform: IBM */
	exports.isLE = (() => new Uint8Array(new Uint32Array([287454020]).buffer)[0] === 68)();
	/** The byte swap operation for uint32 */
	function byteSwap(word) {
		return word << 24 & 4278190080 | word << 8 & 16711680 | word >>> 8 & 65280 | word >>> 24 & 255;
	}
	/** Conditionally byte swap if on a big-endian platform */
	exports.swap8IfBE = exports.isLE ? (n) => n : (n) => byteSwap(n);
	/** @deprecated */
	exports.byteSwapIfBE = exports.swap8IfBE;
	/** In place byte swap for Uint32Array */
	function byteSwap32(arr) {
		for (let i = 0; i < arr.length; i++) arr[i] = byteSwap(arr[i]);
		return arr;
	}
	exports.swap32IfBE = exports.isLE ? (u) => u : byteSwap32;
	const hasHexBuiltin = /* @__PURE__ */ (() => typeof Uint8Array.from([]).toHex === "function" && typeof Uint8Array.fromHex === "function")();
	const hexes = /* @__PURE__ */ Array.from({ length: 256 }, (_, i) => i.toString(16).padStart(2, "0"));
	/**
	* Convert byte array to hex string. Uses built-in function, when available.
	* @example bytesToHex(Uint8Array.from([0xca, 0xfe, 0x01, 0x23])) // 'cafe0123'
	*/
	function bytesToHex(bytes) {
		abytes(bytes);
		if (hasHexBuiltin) return bytes.toHex();
		let hex = "";
		for (let i = 0; i < bytes.length; i++) hex += hexes[bytes[i]];
		return hex;
	}
	const asciis = {
		_0: 48,
		_9: 57,
		A: 65,
		F: 70,
		a: 97,
		f: 102
	};
	function asciiToBase16(ch) {
		if (ch >= asciis._0 && ch <= asciis._9) return ch - asciis._0;
		if (ch >= asciis.A && ch <= asciis.F) return ch - (asciis.A - 10);
		if (ch >= asciis.a && ch <= asciis.f) return ch - (asciis.a - 10);
	}
	/**
	* Convert hex string to byte array. Uses built-in function, when available.
	* @example hexToBytes('cafe0123') // Uint8Array.from([0xca, 0xfe, 0x01, 0x23])
	*/
	function hexToBytes(hex) {
		if (typeof hex !== "string") throw new Error("hex string expected, got " + typeof hex);
		if (hasHexBuiltin) return Uint8Array.fromHex(hex);
		const hl = hex.length;
		const al = hl / 2;
		if (hl % 2) throw new Error("hex string expected, got unpadded hex of length " + hl);
		const array = new Uint8Array(al);
		for (let ai = 0, hi = 0; ai < al; ai++, hi += 2) {
			const n1 = asciiToBase16(hex.charCodeAt(hi));
			const n2 = asciiToBase16(hex.charCodeAt(hi + 1));
			if (n1 === void 0 || n2 === void 0) {
				const char = hex[hi] + hex[hi + 1];
				throw new Error("hex string expected, got non-hex character \"" + char + "\" at index " + hi);
			}
			array[ai] = n1 * 16 + n2;
		}
		return array;
	}
	/**
	* There is no setImmediate in browser and setTimeout is slow.
	* Call of async fn will return Promise, which will be fullfiled only on
	* next scheduler queue processing step and this is exactly what we need.
	*/
	const nextTick = async () => {};
	exports.nextTick = nextTick;
	/** Returns control to thread each 'tick' ms to avoid blocking. */
	async function asyncLoop(iters, tick, cb) {
		let ts = Date.now();
		for (let i = 0; i < iters; i++) {
			cb(i);
			const diff = Date.now() - ts;
			if (diff >= 0 && diff < tick) continue;
			await (0, exports.nextTick)();
			ts += diff;
		}
	}
	/**
	* Converts string to bytes using UTF8 encoding.
	* @example utf8ToBytes('abc') // Uint8Array.from([97, 98, 99])
	*/
	function utf8ToBytes(str) {
		if (typeof str !== "string") throw new Error("string expected");
		return new Uint8Array(new TextEncoder().encode(str));
	}
	/**
	* Converts bytes to string using UTF8 encoding.
	* @example bytesToUtf8(Uint8Array.from([97, 98, 99])) // 'abc'
	*/
	function bytesToUtf8(bytes) {
		return new TextDecoder().decode(bytes);
	}
	/**
	* Normalizes (non-hex) string or Uint8Array to Uint8Array.
	* Warning: when Uint8Array is passed, it would NOT get copied.
	* Keep in mind for future mutable operations.
	*/
	function toBytes(data) {
		if (typeof data === "string") data = utf8ToBytes(data);
		abytes(data);
		return data;
	}
	/**
	* Helper for KDFs: consumes uint8array or string.
	* When string is passed, does utf8 decoding, using TextDecoder.
	*/
	function kdfInputToBytes(data) {
		if (typeof data === "string") data = utf8ToBytes(data);
		abytes(data);
		return data;
	}
	/** Copies several Uint8Arrays into one. */
	function concatBytes(...arrays) {
		let sum = 0;
		for (let i = 0; i < arrays.length; i++) {
			const a = arrays[i];
			abytes(a);
			sum += a.length;
		}
		const res = new Uint8Array(sum);
		for (let i = 0, pad = 0; i < arrays.length; i++) {
			const a = arrays[i];
			res.set(a, pad);
			pad += a.length;
		}
		return res;
	}
	function checkOpts(defaults, opts) {
		if (opts !== void 0 && {}.toString.call(opts) !== "[object Object]") throw new Error("options should be object or undefined");
		return Object.assign(defaults, opts);
	}
	/** For runtime check if class implements interface */
	var Hash = class {};
	exports.Hash = Hash;
	/** Wraps hash function, creating an interface on top of it */
	function createHasher(hashCons) {
		const hashC = (msg) => hashCons().update(toBytes(msg)).digest();
		const tmp = hashCons();
		hashC.outputLen = tmp.outputLen;
		hashC.blockLen = tmp.blockLen;
		hashC.create = () => hashCons();
		return hashC;
	}
	function createOptHasher(hashCons) {
		const hashC = (msg, opts) => hashCons(opts).update(toBytes(msg)).digest();
		const tmp = hashCons({});
		hashC.outputLen = tmp.outputLen;
		hashC.blockLen = tmp.blockLen;
		hashC.create = (opts) => hashCons(opts);
		return hashC;
	}
	function createXOFer(hashCons) {
		const hashC = (msg, opts) => hashCons(opts).update(toBytes(msg)).digest();
		const tmp = hashCons({});
		hashC.outputLen = tmp.outputLen;
		hashC.blockLen = tmp.blockLen;
		hashC.create = (opts) => hashCons(opts);
		return hashC;
	}
	exports.wrapConstructor = createHasher;
	exports.wrapConstructorWithOpts = createOptHasher;
	exports.wrapXOFConstructorWithOpts = createXOFer;
	/** Cryptographically secure PRNG. Uses internal OS-level `crypto.getRandomValues`. */
	function randomBytes(bytesLength = 32) {
		if (crypto_1.crypto && typeof crypto_1.crypto.getRandomValues === "function") return crypto_1.crypto.getRandomValues(new Uint8Array(bytesLength));
		if (crypto_1.crypto && typeof crypto_1.crypto.randomBytes === "function") return Uint8Array.from(crypto_1.crypto.randomBytes(bytesLength));
		throw new Error("crypto.getRandomValues must be defined");
	}
}));
//#endregion
//#region node_modules/.pnpm/@noble+hashes@1.8.0/node_modules/@noble/hashes/_md.js
var require__md = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.SHA512_IV = exports.SHA384_IV = exports.SHA224_IV = exports.SHA256_IV = exports.HashMD = void 0;
	exports.setBigUint64 = setBigUint64;
	exports.Chi = Chi;
	exports.Maj = Maj;
	/**
	* Internal Merkle-Damgard hash utils.
	* @module
	*/
	const utils_ts_1 = require_utils$2();
	/** Polyfill for Safari 14. https://caniuse.com/mdn-javascript_builtins_dataview_setbiguint64 */
	function setBigUint64(view, byteOffset, value, isLE) {
		if (typeof view.setBigUint64 === "function") return view.setBigUint64(byteOffset, value, isLE);
		const _32n = BigInt(32);
		const _u32_max = BigInt(4294967295);
		const wh = Number(value >> _32n & _u32_max);
		const wl = Number(value & _u32_max);
		const h = isLE ? 4 : 0;
		const l = isLE ? 0 : 4;
		view.setUint32(byteOffset + h, wh, isLE);
		view.setUint32(byteOffset + l, wl, isLE);
	}
	/** Choice: a ? b : c */
	function Chi(a, b, c) {
		return a & b ^ ~a & c;
	}
	/** Majority function, true if any two inputs is true. */
	function Maj(a, b, c) {
		return a & b ^ a & c ^ b & c;
	}
	/**
	* Merkle-Damgard hash construction base class.
	* Could be used to create MD5, RIPEMD, SHA1, SHA2.
	*/
	var HashMD = class extends utils_ts_1.Hash {
		constructor(blockLen, outputLen, padOffset, isLE) {
			super();
			this.finished = false;
			this.length = 0;
			this.pos = 0;
			this.destroyed = false;
			this.blockLen = blockLen;
			this.outputLen = outputLen;
			this.padOffset = padOffset;
			this.isLE = isLE;
			this.buffer = new Uint8Array(blockLen);
			this.view = (0, utils_ts_1.createView)(this.buffer);
		}
		update(data) {
			(0, utils_ts_1.aexists)(this);
			data = (0, utils_ts_1.toBytes)(data);
			(0, utils_ts_1.abytes)(data);
			const { view, buffer, blockLen } = this;
			const len = data.length;
			for (let pos = 0; pos < len;) {
				const take = Math.min(blockLen - this.pos, len - pos);
				if (take === blockLen) {
					const dataView = (0, utils_ts_1.createView)(data);
					for (; blockLen <= len - pos; pos += blockLen) this.process(dataView, pos);
					continue;
				}
				buffer.set(data.subarray(pos, pos + take), this.pos);
				this.pos += take;
				pos += take;
				if (this.pos === blockLen) {
					this.process(view, 0);
					this.pos = 0;
				}
			}
			this.length += data.length;
			this.roundClean();
			return this;
		}
		digestInto(out) {
			(0, utils_ts_1.aexists)(this);
			(0, utils_ts_1.aoutput)(out, this);
			this.finished = true;
			const { buffer, view, blockLen, isLE } = this;
			let { pos } = this;
			buffer[pos++] = 128;
			(0, utils_ts_1.clean)(this.buffer.subarray(pos));
			if (this.padOffset > blockLen - pos) {
				this.process(view, 0);
				pos = 0;
			}
			for (let i = pos; i < blockLen; i++) buffer[i] = 0;
			setBigUint64(view, blockLen - 8, BigInt(this.length * 8), isLE);
			this.process(view, 0);
			const oview = (0, utils_ts_1.createView)(out);
			const len = this.outputLen;
			if (len % 4) throw new Error("_sha2: outputLen should be aligned to 32bit");
			const outLen = len / 4;
			const state = this.get();
			if (outLen > state.length) throw new Error("_sha2: outputLen bigger than state");
			for (let i = 0; i < outLen; i++) oview.setUint32(4 * i, state[i], isLE);
		}
		digest() {
			const { buffer, outputLen } = this;
			this.digestInto(buffer);
			const res = buffer.slice(0, outputLen);
			this.destroy();
			return res;
		}
		_cloneInto(to) {
			to || (to = new this.constructor());
			to.set(...this.get());
			const { blockLen, buffer, length, finished, destroyed, pos } = this;
			to.destroyed = destroyed;
			to.finished = finished;
			to.length = length;
			to.pos = pos;
			if (length % blockLen) to.buffer.set(buffer);
			return to;
		}
		clone() {
			return this._cloneInto();
		}
	};
	exports.HashMD = HashMD;
	/**
	* Initial SHA-2 state: fractional parts of square roots of first 16 primes 2..53.
	* Check out `test/misc/sha2-gen-iv.js` for recomputation guide.
	*/
	/** Initial SHA256 state. Bits 0..32 of frac part of sqrt of primes 2..19 */
	exports.SHA256_IV = Uint32Array.from([
		1779033703,
		3144134277,
		1013904242,
		2773480762,
		1359893119,
		2600822924,
		528734635,
		1541459225
	]);
	/** Initial SHA224 state. Bits 32..64 of frac part of sqrt of primes 23..53 */
	exports.SHA224_IV = Uint32Array.from([
		3238371032,
		914150663,
		812702999,
		4144912697,
		4290775857,
		1750603025,
		1694076839,
		3204075428
	]);
	/** Initial SHA384 state. Bits 0..64 of frac part of sqrt of primes 23..53 */
	exports.SHA384_IV = Uint32Array.from([
		3418070365,
		3238371032,
		1654270250,
		914150663,
		2438529370,
		812702999,
		355462360,
		4144912697,
		1731405415,
		4290775857,
		2394180231,
		1750603025,
		3675008525,
		1694076839,
		1203062813,
		3204075428
	]);
	/** Initial SHA512 state. Bits 0..64 of frac part of sqrt of primes 2..19 */
	exports.SHA512_IV = Uint32Array.from([
		1779033703,
		4089235720,
		3144134277,
		2227873595,
		1013904242,
		4271175723,
		2773480762,
		1595750129,
		1359893119,
		2917565137,
		2600822924,
		725511199,
		528734635,
		4215389547,
		1541459225,
		327033209
	]);
}));
//#endregion
//#region node_modules/.pnpm/@noble+hashes@1.8.0/node_modules/@noble/hashes/_u64.js
var require__u64 = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.toBig = exports.shrSL = exports.shrSH = exports.rotrSL = exports.rotrSH = exports.rotrBL = exports.rotrBH = exports.rotr32L = exports.rotr32H = exports.rotlSL = exports.rotlSH = exports.rotlBL = exports.rotlBH = exports.add5L = exports.add5H = exports.add4L = exports.add4H = exports.add3L = exports.add3H = void 0;
	exports.add = add;
	exports.fromBig = fromBig;
	exports.split = split;
	/**
	* Internal helpers for u64. BigUint64Array is too slow as per 2025, so we implement it using Uint32Array.
	* @todo re-check https://issues.chromium.org/issues/42212588
	* @module
	*/
	const U32_MASK64 = /* @__PURE__ */ BigInt(2 ** 32 - 1);
	const _32n = /* @__PURE__ */ BigInt(32);
	function fromBig(n, le = false) {
		if (le) return {
			h: Number(n & U32_MASK64),
			l: Number(n >> _32n & U32_MASK64)
		};
		return {
			h: Number(n >> _32n & U32_MASK64) | 0,
			l: Number(n & U32_MASK64) | 0
		};
	}
	function split(lst, le = false) {
		const len = lst.length;
		let Ah = new Uint32Array(len);
		let Al = new Uint32Array(len);
		for (let i = 0; i < len; i++) {
			const { h, l } = fromBig(lst[i], le);
			[Ah[i], Al[i]] = [h, l];
		}
		return [Ah, Al];
	}
	const toBig = (h, l) => BigInt(h >>> 0) << _32n | BigInt(l >>> 0);
	exports.toBig = toBig;
	const shrSH = (h, _l, s) => h >>> s;
	exports.shrSH = shrSH;
	const shrSL = (h, l, s) => h << 32 - s | l >>> s;
	exports.shrSL = shrSL;
	const rotrSH = (h, l, s) => h >>> s | l << 32 - s;
	exports.rotrSH = rotrSH;
	const rotrSL = (h, l, s) => h << 32 - s | l >>> s;
	exports.rotrSL = rotrSL;
	const rotrBH = (h, l, s) => h << 64 - s | l >>> s - 32;
	exports.rotrBH = rotrBH;
	const rotrBL = (h, l, s) => h >>> s - 32 | l << 64 - s;
	exports.rotrBL = rotrBL;
	const rotr32H = (_h, l) => l;
	exports.rotr32H = rotr32H;
	const rotr32L = (h, _l) => h;
	exports.rotr32L = rotr32L;
	const rotlSH = (h, l, s) => h << s | l >>> 32 - s;
	exports.rotlSH = rotlSH;
	const rotlSL = (h, l, s) => l << s | h >>> 32 - s;
	exports.rotlSL = rotlSL;
	const rotlBH = (h, l, s) => l << s - 32 | h >>> 64 - s;
	exports.rotlBH = rotlBH;
	const rotlBL = (h, l, s) => h << s - 32 | l >>> 64 - s;
	exports.rotlBL = rotlBL;
	function add(Ah, Al, Bh, Bl) {
		const l = (Al >>> 0) + (Bl >>> 0);
		return {
			h: Ah + Bh + (l / 2 ** 32 | 0) | 0,
			l: l | 0
		};
	}
	const add3L = (Al, Bl, Cl) => (Al >>> 0) + (Bl >>> 0) + (Cl >>> 0);
	exports.add3L = add3L;
	const add3H = (low, Ah, Bh, Ch) => Ah + Bh + Ch + (low / 2 ** 32 | 0) | 0;
	exports.add3H = add3H;
	const add4L = (Al, Bl, Cl, Dl) => (Al >>> 0) + (Bl >>> 0) + (Cl >>> 0) + (Dl >>> 0);
	exports.add4L = add4L;
	const add4H = (low, Ah, Bh, Ch, Dh) => Ah + Bh + Ch + Dh + (low / 2 ** 32 | 0) | 0;
	exports.add4H = add4H;
	const add5L = (Al, Bl, Cl, Dl, El) => (Al >>> 0) + (Bl >>> 0) + (Cl >>> 0) + (Dl >>> 0) + (El >>> 0);
	exports.add5L = add5L;
	const add5H = (low, Ah, Bh, Ch, Dh, Eh) => Ah + Bh + Ch + Dh + Eh + (low / 2 ** 32 | 0) | 0;
	exports.add5H = add5H;
	exports.default = {
		fromBig,
		split,
		toBig,
		shrSH,
		shrSL,
		rotrSH,
		rotrSL,
		rotrBH,
		rotrBL,
		rotr32H,
		rotr32L,
		rotlSH,
		rotlSL,
		rotlBH,
		rotlBL,
		add,
		add3L,
		add3H,
		add4L,
		add4H,
		add5H,
		add5L
	};
}));
//#endregion
//#region node_modules/.pnpm/@noble+hashes@1.8.0/node_modules/@noble/hashes/sha2.js
var require_sha2 = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.sha512_224 = exports.sha512_256 = exports.sha384 = exports.sha512 = exports.sha224 = exports.sha256 = exports.SHA512_256 = exports.SHA512_224 = exports.SHA384 = exports.SHA512 = exports.SHA224 = exports.SHA256 = void 0;
	/**
	* SHA2 hash function. A.k.a. sha256, sha384, sha512, sha512_224, sha512_256.
	* SHA256 is the fastest hash implementable in JS, even faster than Blake3.
	* Check out [RFC 4634](https://datatracker.ietf.org/doc/html/rfc4634) and
	* [FIPS 180-4](https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.180-4.pdf).
	* @module
	*/
	const _md_ts_1 = require__md();
	const u64 = require__u64();
	const utils_ts_1 = require_utils$2();
	/**
	* Round constants:
	* First 32 bits of fractional parts of the cube roots of the first 64 primes 2..311)
	*/
	const SHA256_K = /* @__PURE__ */ Uint32Array.from([
		1116352408,
		1899447441,
		3049323471,
		3921009573,
		961987163,
		1508970993,
		2453635748,
		2870763221,
		3624381080,
		310598401,
		607225278,
		1426881987,
		1925078388,
		2162078206,
		2614888103,
		3248222580,
		3835390401,
		4022224774,
		264347078,
		604807628,
		770255983,
		1249150122,
		1555081692,
		1996064986,
		2554220882,
		2821834349,
		2952996808,
		3210313671,
		3336571891,
		3584528711,
		113926993,
		338241895,
		666307205,
		773529912,
		1294757372,
		1396182291,
		1695183700,
		1986661051,
		2177026350,
		2456956037,
		2730485921,
		2820302411,
		3259730800,
		3345764771,
		3516065817,
		3600352804,
		4094571909,
		275423344,
		430227734,
		506948616,
		659060556,
		883997877,
		958139571,
		1322822218,
		1537002063,
		1747873779,
		1955562222,
		2024104815,
		2227730452,
		2361852424,
		2428436474,
		2756734187,
		3204031479,
		3329325298
	]);
	/** Reusable temporary buffer. "W" comes straight from spec. */
	const SHA256_W = /* @__PURE__ */ new Uint32Array(64);
	var SHA256 = class extends _md_ts_1.HashMD {
		constructor(outputLen = 32) {
			super(64, outputLen, 8, false);
			this.A = _md_ts_1.SHA256_IV[0] | 0;
			this.B = _md_ts_1.SHA256_IV[1] | 0;
			this.C = _md_ts_1.SHA256_IV[2] | 0;
			this.D = _md_ts_1.SHA256_IV[3] | 0;
			this.E = _md_ts_1.SHA256_IV[4] | 0;
			this.F = _md_ts_1.SHA256_IV[5] | 0;
			this.G = _md_ts_1.SHA256_IV[6] | 0;
			this.H = _md_ts_1.SHA256_IV[7] | 0;
		}
		get() {
			const { A, B, C, D, E, F, G, H } = this;
			return [
				A,
				B,
				C,
				D,
				E,
				F,
				G,
				H
			];
		}
		set(A, B, C, D, E, F, G, H) {
			this.A = A | 0;
			this.B = B | 0;
			this.C = C | 0;
			this.D = D | 0;
			this.E = E | 0;
			this.F = F | 0;
			this.G = G | 0;
			this.H = H | 0;
		}
		process(view, offset) {
			for (let i = 0; i < 16; i++, offset += 4) SHA256_W[i] = view.getUint32(offset, false);
			for (let i = 16; i < 64; i++) {
				const W15 = SHA256_W[i - 15];
				const W2 = SHA256_W[i - 2];
				const s0 = (0, utils_ts_1.rotr)(W15, 7) ^ (0, utils_ts_1.rotr)(W15, 18) ^ W15 >>> 3;
				const s1 = (0, utils_ts_1.rotr)(W2, 17) ^ (0, utils_ts_1.rotr)(W2, 19) ^ W2 >>> 10;
				SHA256_W[i] = s1 + SHA256_W[i - 7] + s0 + SHA256_W[i - 16] | 0;
			}
			let { A, B, C, D, E, F, G, H } = this;
			for (let i = 0; i < 64; i++) {
				const sigma1 = (0, utils_ts_1.rotr)(E, 6) ^ (0, utils_ts_1.rotr)(E, 11) ^ (0, utils_ts_1.rotr)(E, 25);
				const T1 = H + sigma1 + (0, _md_ts_1.Chi)(E, F, G) + SHA256_K[i] + SHA256_W[i] | 0;
				const T2 = ((0, utils_ts_1.rotr)(A, 2) ^ (0, utils_ts_1.rotr)(A, 13) ^ (0, utils_ts_1.rotr)(A, 22)) + (0, _md_ts_1.Maj)(A, B, C) | 0;
				H = G;
				G = F;
				F = E;
				E = D + T1 | 0;
				D = C;
				C = B;
				B = A;
				A = T1 + T2 | 0;
			}
			A = A + this.A | 0;
			B = B + this.B | 0;
			C = C + this.C | 0;
			D = D + this.D | 0;
			E = E + this.E | 0;
			F = F + this.F | 0;
			G = G + this.G | 0;
			H = H + this.H | 0;
			this.set(A, B, C, D, E, F, G, H);
		}
		roundClean() {
			(0, utils_ts_1.clean)(SHA256_W);
		}
		destroy() {
			this.set(0, 0, 0, 0, 0, 0, 0, 0);
			(0, utils_ts_1.clean)(this.buffer);
		}
	};
	exports.SHA256 = SHA256;
	var SHA224 = class extends SHA256 {
		constructor() {
			super(28);
			this.A = _md_ts_1.SHA224_IV[0] | 0;
			this.B = _md_ts_1.SHA224_IV[1] | 0;
			this.C = _md_ts_1.SHA224_IV[2] | 0;
			this.D = _md_ts_1.SHA224_IV[3] | 0;
			this.E = _md_ts_1.SHA224_IV[4] | 0;
			this.F = _md_ts_1.SHA224_IV[5] | 0;
			this.G = _md_ts_1.SHA224_IV[6] | 0;
			this.H = _md_ts_1.SHA224_IV[7] | 0;
		}
	};
	exports.SHA224 = SHA224;
	const K512 = /* @__PURE__ */ (() => u64.split([
		"0x428a2f98d728ae22",
		"0x7137449123ef65cd",
		"0xb5c0fbcfec4d3b2f",
		"0xe9b5dba58189dbbc",
		"0x3956c25bf348b538",
		"0x59f111f1b605d019",
		"0x923f82a4af194f9b",
		"0xab1c5ed5da6d8118",
		"0xd807aa98a3030242",
		"0x12835b0145706fbe",
		"0x243185be4ee4b28c",
		"0x550c7dc3d5ffb4e2",
		"0x72be5d74f27b896f",
		"0x80deb1fe3b1696b1",
		"0x9bdc06a725c71235",
		"0xc19bf174cf692694",
		"0xe49b69c19ef14ad2",
		"0xefbe4786384f25e3",
		"0x0fc19dc68b8cd5b5",
		"0x240ca1cc77ac9c65",
		"0x2de92c6f592b0275",
		"0x4a7484aa6ea6e483",
		"0x5cb0a9dcbd41fbd4",
		"0x76f988da831153b5",
		"0x983e5152ee66dfab",
		"0xa831c66d2db43210",
		"0xb00327c898fb213f",
		"0xbf597fc7beef0ee4",
		"0xc6e00bf33da88fc2",
		"0xd5a79147930aa725",
		"0x06ca6351e003826f",
		"0x142929670a0e6e70",
		"0x27b70a8546d22ffc",
		"0x2e1b21385c26c926",
		"0x4d2c6dfc5ac42aed",
		"0x53380d139d95b3df",
		"0x650a73548baf63de",
		"0x766a0abb3c77b2a8",
		"0x81c2c92e47edaee6",
		"0x92722c851482353b",
		"0xa2bfe8a14cf10364",
		"0xa81a664bbc423001",
		"0xc24b8b70d0f89791",
		"0xc76c51a30654be30",
		"0xd192e819d6ef5218",
		"0xd69906245565a910",
		"0xf40e35855771202a",
		"0x106aa07032bbd1b8",
		"0x19a4c116b8d2d0c8",
		"0x1e376c085141ab53",
		"0x2748774cdf8eeb99",
		"0x34b0bcb5e19b48a8",
		"0x391c0cb3c5c95a63",
		"0x4ed8aa4ae3418acb",
		"0x5b9cca4f7763e373",
		"0x682e6ff3d6b2b8a3",
		"0x748f82ee5defb2fc",
		"0x78a5636f43172f60",
		"0x84c87814a1f0ab72",
		"0x8cc702081a6439ec",
		"0x90befffa23631e28",
		"0xa4506cebde82bde9",
		"0xbef9a3f7b2c67915",
		"0xc67178f2e372532b",
		"0xca273eceea26619c",
		"0xd186b8c721c0c207",
		"0xeada7dd6cde0eb1e",
		"0xf57d4f7fee6ed178",
		"0x06f067aa72176fba",
		"0x0a637dc5a2c898a6",
		"0x113f9804bef90dae",
		"0x1b710b35131c471b",
		"0x28db77f523047d84",
		"0x32caab7b40c72493",
		"0x3c9ebe0a15c9bebc",
		"0x431d67c49c100d4c",
		"0x4cc5d4becb3e42b6",
		"0x597f299cfc657e2a",
		"0x5fcb6fab3ad6faec",
		"0x6c44198c4a475817"
	].map((n) => BigInt(n))))();
	const SHA512_Kh = /* @__PURE__ */ (() => K512[0])();
	const SHA512_Kl = /* @__PURE__ */ (() => K512[1])();
	const SHA512_W_H = /* @__PURE__ */ new Uint32Array(80);
	const SHA512_W_L = /* @__PURE__ */ new Uint32Array(80);
	var SHA512 = class extends _md_ts_1.HashMD {
		constructor(outputLen = 64) {
			super(128, outputLen, 16, false);
			this.Ah = _md_ts_1.SHA512_IV[0] | 0;
			this.Al = _md_ts_1.SHA512_IV[1] | 0;
			this.Bh = _md_ts_1.SHA512_IV[2] | 0;
			this.Bl = _md_ts_1.SHA512_IV[3] | 0;
			this.Ch = _md_ts_1.SHA512_IV[4] | 0;
			this.Cl = _md_ts_1.SHA512_IV[5] | 0;
			this.Dh = _md_ts_1.SHA512_IV[6] | 0;
			this.Dl = _md_ts_1.SHA512_IV[7] | 0;
			this.Eh = _md_ts_1.SHA512_IV[8] | 0;
			this.El = _md_ts_1.SHA512_IV[9] | 0;
			this.Fh = _md_ts_1.SHA512_IV[10] | 0;
			this.Fl = _md_ts_1.SHA512_IV[11] | 0;
			this.Gh = _md_ts_1.SHA512_IV[12] | 0;
			this.Gl = _md_ts_1.SHA512_IV[13] | 0;
			this.Hh = _md_ts_1.SHA512_IV[14] | 0;
			this.Hl = _md_ts_1.SHA512_IV[15] | 0;
		}
		get() {
			const { Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl } = this;
			return [
				Ah,
				Al,
				Bh,
				Bl,
				Ch,
				Cl,
				Dh,
				Dl,
				Eh,
				El,
				Fh,
				Fl,
				Gh,
				Gl,
				Hh,
				Hl
			];
		}
		set(Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl) {
			this.Ah = Ah | 0;
			this.Al = Al | 0;
			this.Bh = Bh | 0;
			this.Bl = Bl | 0;
			this.Ch = Ch | 0;
			this.Cl = Cl | 0;
			this.Dh = Dh | 0;
			this.Dl = Dl | 0;
			this.Eh = Eh | 0;
			this.El = El | 0;
			this.Fh = Fh | 0;
			this.Fl = Fl | 0;
			this.Gh = Gh | 0;
			this.Gl = Gl | 0;
			this.Hh = Hh | 0;
			this.Hl = Hl | 0;
		}
		process(view, offset) {
			for (let i = 0; i < 16; i++, offset += 4) {
				SHA512_W_H[i] = view.getUint32(offset);
				SHA512_W_L[i] = view.getUint32(offset += 4);
			}
			for (let i = 16; i < 80; i++) {
				const W15h = SHA512_W_H[i - 15] | 0;
				const W15l = SHA512_W_L[i - 15] | 0;
				const s0h = u64.rotrSH(W15h, W15l, 1) ^ u64.rotrSH(W15h, W15l, 8) ^ u64.shrSH(W15h, W15l, 7);
				const s0l = u64.rotrSL(W15h, W15l, 1) ^ u64.rotrSL(W15h, W15l, 8) ^ u64.shrSL(W15h, W15l, 7);
				const W2h = SHA512_W_H[i - 2] | 0;
				const W2l = SHA512_W_L[i - 2] | 0;
				const s1h = u64.rotrSH(W2h, W2l, 19) ^ u64.rotrBH(W2h, W2l, 61) ^ u64.shrSH(W2h, W2l, 6);
				const s1l = u64.rotrSL(W2h, W2l, 19) ^ u64.rotrBL(W2h, W2l, 61) ^ u64.shrSL(W2h, W2l, 6);
				const SUMl = u64.add4L(s0l, s1l, SHA512_W_L[i - 7], SHA512_W_L[i - 16]);
				const SUMh = u64.add4H(SUMl, s0h, s1h, SHA512_W_H[i - 7], SHA512_W_H[i - 16]);
				SHA512_W_H[i] = SUMh | 0;
				SHA512_W_L[i] = SUMl | 0;
			}
			let { Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl } = this;
			for (let i = 0; i < 80; i++) {
				const sigma1h = u64.rotrSH(Eh, El, 14) ^ u64.rotrSH(Eh, El, 18) ^ u64.rotrBH(Eh, El, 41);
				const sigma1l = u64.rotrSL(Eh, El, 14) ^ u64.rotrSL(Eh, El, 18) ^ u64.rotrBL(Eh, El, 41);
				const CHIh = Eh & Fh ^ ~Eh & Gh;
				const CHIl = El & Fl ^ ~El & Gl;
				const T1ll = u64.add5L(Hl, sigma1l, CHIl, SHA512_Kl[i], SHA512_W_L[i]);
				const T1h = u64.add5H(T1ll, Hh, sigma1h, CHIh, SHA512_Kh[i], SHA512_W_H[i]);
				const T1l = T1ll | 0;
				const sigma0h = u64.rotrSH(Ah, Al, 28) ^ u64.rotrBH(Ah, Al, 34) ^ u64.rotrBH(Ah, Al, 39);
				const sigma0l = u64.rotrSL(Ah, Al, 28) ^ u64.rotrBL(Ah, Al, 34) ^ u64.rotrBL(Ah, Al, 39);
				const MAJh = Ah & Bh ^ Ah & Ch ^ Bh & Ch;
				const MAJl = Al & Bl ^ Al & Cl ^ Bl & Cl;
				Hh = Gh | 0;
				Hl = Gl | 0;
				Gh = Fh | 0;
				Gl = Fl | 0;
				Fh = Eh | 0;
				Fl = El | 0;
				({h: Eh, l: El} = u64.add(Dh | 0, Dl | 0, T1h | 0, T1l | 0));
				Dh = Ch | 0;
				Dl = Cl | 0;
				Ch = Bh | 0;
				Cl = Bl | 0;
				Bh = Ah | 0;
				Bl = Al | 0;
				const All = u64.add3L(T1l, sigma0l, MAJl);
				Ah = u64.add3H(All, T1h, sigma0h, MAJh);
				Al = All | 0;
			}
			({h: Ah, l: Al} = u64.add(this.Ah | 0, this.Al | 0, Ah | 0, Al | 0));
			({h: Bh, l: Bl} = u64.add(this.Bh | 0, this.Bl | 0, Bh | 0, Bl | 0));
			({h: Ch, l: Cl} = u64.add(this.Ch | 0, this.Cl | 0, Ch | 0, Cl | 0));
			({h: Dh, l: Dl} = u64.add(this.Dh | 0, this.Dl | 0, Dh | 0, Dl | 0));
			({h: Eh, l: El} = u64.add(this.Eh | 0, this.El | 0, Eh | 0, El | 0));
			({h: Fh, l: Fl} = u64.add(this.Fh | 0, this.Fl | 0, Fh | 0, Fl | 0));
			({h: Gh, l: Gl} = u64.add(this.Gh | 0, this.Gl | 0, Gh | 0, Gl | 0));
			({h: Hh, l: Hl} = u64.add(this.Hh | 0, this.Hl | 0, Hh | 0, Hl | 0));
			this.set(Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl);
		}
		roundClean() {
			(0, utils_ts_1.clean)(SHA512_W_H, SHA512_W_L);
		}
		destroy() {
			(0, utils_ts_1.clean)(this.buffer);
			this.set(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
		}
	};
	exports.SHA512 = SHA512;
	var SHA384 = class extends SHA512 {
		constructor() {
			super(48);
			this.Ah = _md_ts_1.SHA384_IV[0] | 0;
			this.Al = _md_ts_1.SHA384_IV[1] | 0;
			this.Bh = _md_ts_1.SHA384_IV[2] | 0;
			this.Bl = _md_ts_1.SHA384_IV[3] | 0;
			this.Ch = _md_ts_1.SHA384_IV[4] | 0;
			this.Cl = _md_ts_1.SHA384_IV[5] | 0;
			this.Dh = _md_ts_1.SHA384_IV[6] | 0;
			this.Dl = _md_ts_1.SHA384_IV[7] | 0;
			this.Eh = _md_ts_1.SHA384_IV[8] | 0;
			this.El = _md_ts_1.SHA384_IV[9] | 0;
			this.Fh = _md_ts_1.SHA384_IV[10] | 0;
			this.Fl = _md_ts_1.SHA384_IV[11] | 0;
			this.Gh = _md_ts_1.SHA384_IV[12] | 0;
			this.Gl = _md_ts_1.SHA384_IV[13] | 0;
			this.Hh = _md_ts_1.SHA384_IV[14] | 0;
			this.Hl = _md_ts_1.SHA384_IV[15] | 0;
		}
	};
	exports.SHA384 = SHA384;
	/**
	* Truncated SHA512/256 and SHA512/224.
	* SHA512_IV is XORed with 0xa5a5a5a5a5a5a5a5, then used as "intermediary" IV of SHA512/t.
	* Then t hashes string to produce result IV.
	* See `test/misc/sha2-gen-iv.js`.
	*/
	/** SHA512/224 IV */
	const T224_IV = /* @__PURE__ */ Uint32Array.from([
		2352822216,
		424955298,
		1944164710,
		2312950998,
		502970286,
		855612546,
		1738396948,
		1479516111,
		258812777,
		2077511080,
		2011393907,
		79989058,
		1067287976,
		1780299464,
		286451373,
		2446758561
	]);
	/** SHA512/256 IV */
	const T256_IV = /* @__PURE__ */ Uint32Array.from([
		573645204,
		4230739756,
		2673172387,
		3360449730,
		596883563,
		1867755857,
		2520282905,
		1497426621,
		2519219938,
		2827943907,
		3193839141,
		1401305490,
		721525244,
		746961066,
		246885852,
		2177182882
	]);
	var SHA512_224 = class extends SHA512 {
		constructor() {
			super(28);
			this.Ah = T224_IV[0] | 0;
			this.Al = T224_IV[1] | 0;
			this.Bh = T224_IV[2] | 0;
			this.Bl = T224_IV[3] | 0;
			this.Ch = T224_IV[4] | 0;
			this.Cl = T224_IV[5] | 0;
			this.Dh = T224_IV[6] | 0;
			this.Dl = T224_IV[7] | 0;
			this.Eh = T224_IV[8] | 0;
			this.El = T224_IV[9] | 0;
			this.Fh = T224_IV[10] | 0;
			this.Fl = T224_IV[11] | 0;
			this.Gh = T224_IV[12] | 0;
			this.Gl = T224_IV[13] | 0;
			this.Hh = T224_IV[14] | 0;
			this.Hl = T224_IV[15] | 0;
		}
	};
	exports.SHA512_224 = SHA512_224;
	var SHA512_256 = class extends SHA512 {
		constructor() {
			super(32);
			this.Ah = T256_IV[0] | 0;
			this.Al = T256_IV[1] | 0;
			this.Bh = T256_IV[2] | 0;
			this.Bl = T256_IV[3] | 0;
			this.Ch = T256_IV[4] | 0;
			this.Cl = T256_IV[5] | 0;
			this.Dh = T256_IV[6] | 0;
			this.Dl = T256_IV[7] | 0;
			this.Eh = T256_IV[8] | 0;
			this.El = T256_IV[9] | 0;
			this.Fh = T256_IV[10] | 0;
			this.Fl = T256_IV[11] | 0;
			this.Gh = T256_IV[12] | 0;
			this.Gl = T256_IV[13] | 0;
			this.Hh = T256_IV[14] | 0;
			this.Hl = T256_IV[15] | 0;
		}
	};
	exports.SHA512_256 = SHA512_256;
	/**
	* SHA2-256 hash function from RFC 4634.
	*
	* It is the fastest JS hash, even faster than Blake3.
	* To break sha256 using birthday attack, attackers need to try 2^128 hashes.
	* BTC network is doing 2^70 hashes/sec (2^95 hashes/year) as per 2025.
	*/
	exports.sha256 = (0, utils_ts_1.createHasher)(() => new SHA256());
	/** SHA2-224 hash function from RFC 4634 */
	exports.sha224 = (0, utils_ts_1.createHasher)(() => new SHA224());
	/** SHA2-512 hash function from RFC 4634. */
	exports.sha512 = (0, utils_ts_1.createHasher)(() => new SHA512());
	/** SHA2-384 hash function from RFC 4634. */
	exports.sha384 = (0, utils_ts_1.createHasher)(() => new SHA384());
	/**
	* SHA2-512/256 "truncated" hash function, with improved resistance to length extension attacks.
	* See the paper on [truncated SHA512](https://eprint.iacr.org/2010/548.pdf).
	*/
	exports.sha512_256 = (0, utils_ts_1.createHasher)(() => new SHA512_256());
	/**
	* SHA2-512/224 "truncated" hash function, with improved resistance to length extension attacks.
	* See the paper on [truncated SHA512](https://eprint.iacr.org/2010/548.pdf).
	*/
	exports.sha512_224 = (0, utils_ts_1.createHasher)(() => new SHA512_224());
}));
//#endregion
//#region node_modules/.pnpm/@noble+curves@1.9.7/node_modules/@noble/curves/utils.js
var require_utils$1 = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.notImplemented = exports.bitMask = exports.utf8ToBytes = exports.randomBytes = exports.isBytes = exports.hexToBytes = exports.concatBytes = exports.bytesToUtf8 = exports.bytesToHex = exports.anumber = exports.abytes = void 0;
	exports.abool = abool;
	exports._abool2 = _abool2;
	exports._abytes2 = _abytes2;
	exports.numberToHexUnpadded = numberToHexUnpadded;
	exports.hexToNumber = hexToNumber;
	exports.bytesToNumberBE = bytesToNumberBE;
	exports.bytesToNumberLE = bytesToNumberLE;
	exports.numberToBytesBE = numberToBytesBE;
	exports.numberToBytesLE = numberToBytesLE;
	exports.numberToVarBytesBE = numberToVarBytesBE;
	exports.ensureBytes = ensureBytes;
	exports.equalBytes = equalBytes;
	exports.copyBytes = copyBytes;
	exports.asciiToBytes = asciiToBytes;
	exports.inRange = inRange;
	exports.aInRange = aInRange;
	exports.bitLen = bitLen;
	exports.bitGet = bitGet;
	exports.bitSet = bitSet;
	exports.createHmacDrbg = createHmacDrbg;
	exports.validateObject = validateObject;
	exports.isHash = isHash;
	exports._validateObject = _validateObject;
	exports.memoized = memoized;
	/**
	* Hex, bytes and number utilities.
	* @module
	*/
	/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */
	const utils_js_1 = require_utils$2();
	var utils_js_2 = require_utils$2();
	Object.defineProperty(exports, "abytes", {
		enumerable: true,
		get: function() {
			return utils_js_2.abytes;
		}
	});
	Object.defineProperty(exports, "anumber", {
		enumerable: true,
		get: function() {
			return utils_js_2.anumber;
		}
	});
	Object.defineProperty(exports, "bytesToHex", {
		enumerable: true,
		get: function() {
			return utils_js_2.bytesToHex;
		}
	});
	Object.defineProperty(exports, "bytesToUtf8", {
		enumerable: true,
		get: function() {
			return utils_js_2.bytesToUtf8;
		}
	});
	Object.defineProperty(exports, "concatBytes", {
		enumerable: true,
		get: function() {
			return utils_js_2.concatBytes;
		}
	});
	Object.defineProperty(exports, "hexToBytes", {
		enumerable: true,
		get: function() {
			return utils_js_2.hexToBytes;
		}
	});
	Object.defineProperty(exports, "isBytes", {
		enumerable: true,
		get: function() {
			return utils_js_2.isBytes;
		}
	});
	Object.defineProperty(exports, "randomBytes", {
		enumerable: true,
		get: function() {
			return utils_js_2.randomBytes;
		}
	});
	Object.defineProperty(exports, "utf8ToBytes", {
		enumerable: true,
		get: function() {
			return utils_js_2.utf8ToBytes;
		}
	});
	const _0n = /* @__PURE__ */ BigInt(0);
	const _1n = /* @__PURE__ */ BigInt(1);
	function abool(title, value) {
		if (typeof value !== "boolean") throw new Error(title + " boolean expected, got " + value);
	}
	function _abool2(value, title = "") {
		if (typeof value !== "boolean") {
			const prefix = title && `"${title}"`;
			throw new Error(prefix + "expected boolean, got type=" + typeof value);
		}
		return value;
	}
	/** Asserts something is Uint8Array. */
	function _abytes2(value, length, title = "") {
		const bytes = (0, utils_js_1.isBytes)(value);
		const len = value?.length;
		const needsLen = length !== void 0;
		if (!bytes || needsLen && len !== length) {
			const prefix = title && `"${title}" `;
			const ofLen = needsLen ? ` of length ${length}` : "";
			const got = bytes ? `length=${len}` : `type=${typeof value}`;
			throw new Error(prefix + "expected Uint8Array" + ofLen + ", got " + got);
		}
		return value;
	}
	function numberToHexUnpadded(num) {
		const hex = num.toString(16);
		return hex.length & 1 ? "0" + hex : hex;
	}
	function hexToNumber(hex) {
		if (typeof hex !== "string") throw new Error("hex string expected, got " + typeof hex);
		return hex === "" ? _0n : BigInt("0x" + hex);
	}
	function bytesToNumberBE(bytes) {
		return hexToNumber((0, utils_js_1.bytesToHex)(bytes));
	}
	function bytesToNumberLE(bytes) {
		(0, utils_js_1.abytes)(bytes);
		return hexToNumber((0, utils_js_1.bytesToHex)(Uint8Array.from(bytes).reverse()));
	}
	function numberToBytesBE(n, len) {
		return (0, utils_js_1.hexToBytes)(n.toString(16).padStart(len * 2, "0"));
	}
	function numberToBytesLE(n, len) {
		return numberToBytesBE(n, len).reverse();
	}
	function numberToVarBytesBE(n) {
		return (0, utils_js_1.hexToBytes)(numberToHexUnpadded(n));
	}
	/**
	* Takes hex string or Uint8Array, converts to Uint8Array.
	* Validates output length.
	* Will throw error for other types.
	* @param title descriptive title for an error e.g. 'secret key'
	* @param hex hex string or Uint8Array
	* @param expectedLength optional, will compare to result array's length
	* @returns
	*/
	function ensureBytes(title, hex, expectedLength) {
		let res;
		if (typeof hex === "string") try {
			res = (0, utils_js_1.hexToBytes)(hex);
		} catch (e) {
			throw new Error(title + " must be hex string or Uint8Array, cause: " + e);
		}
		else if ((0, utils_js_1.isBytes)(hex)) res = Uint8Array.from(hex);
		else throw new Error(title + " must be hex string or Uint8Array");
		const len = res.length;
		if (typeof expectedLength === "number" && len !== expectedLength) throw new Error(title + " of length " + expectedLength + " expected, got " + len);
		return res;
	}
	function equalBytes(a, b) {
		if (a.length !== b.length) return false;
		let diff = 0;
		for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
		return diff === 0;
	}
	/**
	* Copies Uint8Array. We can't use u8a.slice(), because u8a can be Buffer,
	* and Buffer#slice creates mutable copy. Never use Buffers!
	*/
	function copyBytes(bytes) {
		return Uint8Array.from(bytes);
	}
	/**
	* Decodes 7-bit ASCII string to Uint8Array, throws on non-ascii symbols
	* Should be safe to use for things expected to be ASCII.
	* Returns exact same result as utf8ToBytes for ASCII or throws.
	*/
	function asciiToBytes(ascii) {
		return Uint8Array.from(ascii, (c, i) => {
			const charCode = c.charCodeAt(0);
			if (c.length !== 1 || charCode > 127) throw new Error(`string contains non-ASCII character "${ascii[i]}" with code ${charCode} at position ${i}`);
			return charCode;
		});
	}
	/**
	* @example utf8ToBytes('abc') // new Uint8Array([97, 98, 99])
	*/
	/**
	* Converts bytes to string using UTF8 encoding.
	* @example bytesToUtf8(Uint8Array.from([97, 98, 99])) // 'abc'
	*/
	const isPosBig = (n) => typeof n === "bigint" && _0n <= n;
	function inRange(n, min, max) {
		return isPosBig(n) && isPosBig(min) && isPosBig(max) && min <= n && n < max;
	}
	/**
	* Asserts min <= n < max. NOTE: It's < max and not <= max.
	* @example
	* aInRange('x', x, 1n, 256n); // would assume x is in (1n..255n)
	*/
	function aInRange(title, n, min, max) {
		if (!inRange(n, min, max)) throw new Error("expected valid " + title + ": " + min + " <= n < " + max + ", got " + n);
	}
	/**
	* Calculates amount of bits in a bigint.
	* Same as `n.toString(2).length`
	* TODO: merge with nLength in modular
	*/
	function bitLen(n) {
		let len;
		for (len = 0; n > _0n; n >>= _1n, len += 1);
		return len;
	}
	/**
	* Gets single bit at position.
	* NOTE: first bit position is 0 (same as arrays)
	* Same as `!!+Array.from(n.toString(2)).reverse()[pos]`
	*/
	function bitGet(n, pos) {
		return n >> BigInt(pos) & _1n;
	}
	/**
	* Sets single bit at position.
	*/
	function bitSet(n, pos, value) {
		return n | (value ? _1n : _0n) << BigInt(pos);
	}
	/**
	* Calculate mask for N bits. Not using ** operator with bigints because of old engines.
	* Same as BigInt(`0b${Array(i).fill('1').join('')}`)
	*/
	const bitMask = (n) => (_1n << BigInt(n)) - _1n;
	exports.bitMask = bitMask;
	/**
	* Minimal HMAC-DRBG from NIST 800-90 for RFC6979 sigs.
	* @returns function that will call DRBG until 2nd arg returns something meaningful
	* @example
	*   const drbg = createHmacDRBG<Key>(32, 32, hmac);
	*   drbg(seed, bytesToKey); // bytesToKey must return Key or undefined
	*/
	function createHmacDrbg(hashLen, qByteLen, hmacFn) {
		if (typeof hashLen !== "number" || hashLen < 2) throw new Error("hashLen must be a number");
		if (typeof qByteLen !== "number" || qByteLen < 2) throw new Error("qByteLen must be a number");
		if (typeof hmacFn !== "function") throw new Error("hmacFn must be a function");
		const u8n = (len) => new Uint8Array(len);
		const u8of = (byte) => Uint8Array.of(byte);
		let v = u8n(hashLen);
		let k = u8n(hashLen);
		let i = 0;
		const reset = () => {
			v.fill(1);
			k.fill(0);
			i = 0;
		};
		const h = (...b) => hmacFn(k, v, ...b);
		const reseed = (seed = u8n(0)) => {
			k = h(u8of(0), seed);
			v = h();
			if (seed.length === 0) return;
			k = h(u8of(1), seed);
			v = h();
		};
		const gen = () => {
			if (i++ >= 1e3) throw new Error("drbg: tried 1000 values");
			let len = 0;
			const out = [];
			while (len < qByteLen) {
				v = h();
				const sl = v.slice();
				out.push(sl);
				len += v.length;
			}
			return (0, utils_js_1.concatBytes)(...out);
		};
		const genUntil = (seed, pred) => {
			reset();
			reseed(seed);
			let res = void 0;
			while (!(res = pred(gen()))) reseed();
			reset();
			return res;
		};
		return genUntil;
	}
	const validatorFns = {
		bigint: (val) => typeof val === "bigint",
		function: (val) => typeof val === "function",
		boolean: (val) => typeof val === "boolean",
		string: (val) => typeof val === "string",
		stringOrUint8Array: (val) => typeof val === "string" || (0, utils_js_1.isBytes)(val),
		isSafeInteger: (val) => Number.isSafeInteger(val),
		array: (val) => Array.isArray(val),
		field: (val, object) => object.Fp.isValid(val),
		hash: (val) => typeof val === "function" && Number.isSafeInteger(val.outputLen)
	};
	function validateObject(object, validators, optValidators = {}) {
		const checkField = (fieldName, type, isOptional) => {
			const checkVal = validatorFns[type];
			if (typeof checkVal !== "function") throw new Error("invalid validator function");
			const val = object[fieldName];
			if (isOptional && val === void 0) return;
			if (!checkVal(val, object)) throw new Error("param " + String(fieldName) + " is invalid. Expected " + type + ", got " + val);
		};
		for (const [fieldName, type] of Object.entries(validators)) checkField(fieldName, type, false);
		for (const [fieldName, type] of Object.entries(optValidators)) checkField(fieldName, type, true);
		return object;
	}
	function isHash(val) {
		return typeof val === "function" && Number.isSafeInteger(val.outputLen);
	}
	function _validateObject(object, fields, optFields = {}) {
		if (!object || typeof object !== "object") throw new Error("expected valid options object");
		function checkField(fieldName, expectedType, isOpt) {
			const val = object[fieldName];
			if (isOpt && val === void 0) return;
			const current = typeof val;
			if (current !== expectedType || val === null) throw new Error(`param "${fieldName}" is invalid: expected ${expectedType}, got ${current}`);
		}
		Object.entries(fields).forEach(([k, v]) => checkField(k, v, false));
		Object.entries(optFields).forEach(([k, v]) => checkField(k, v, true));
	}
	/**
	* throws not implemented error
	*/
	const notImplemented = () => {
		throw new Error("not implemented");
	};
	exports.notImplemented = notImplemented;
	/**
	* Memoizes (caches) computation result.
	* Uses WeakMap: the value is going auto-cleaned by GC after last reference is removed.
	*/
	function memoized(fn) {
		const map = /* @__PURE__ */ new WeakMap();
		return (arg, ...args) => {
			const val = map.get(arg);
			if (val !== void 0) return val;
			const computed = fn(arg, ...args);
			map.set(arg, computed);
			return computed;
		};
	}
}));
//#endregion
//#region node_modules/.pnpm/@noble+curves@1.9.7/node_modules/@noble/curves/abstract/modular.js
var require_modular = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.isNegativeLE = void 0;
	exports.mod = mod;
	exports.pow = pow;
	exports.pow2 = pow2;
	exports.invert = invert;
	exports.tonelliShanks = tonelliShanks;
	exports.FpSqrt = FpSqrt;
	exports.validateField = validateField;
	exports.FpPow = FpPow;
	exports.FpInvertBatch = FpInvertBatch;
	exports.FpDiv = FpDiv;
	exports.FpLegendre = FpLegendre;
	exports.FpIsSquare = FpIsSquare;
	exports.nLength = nLength;
	exports.Field = Field;
	exports.FpSqrtOdd = FpSqrtOdd;
	exports.FpSqrtEven = FpSqrtEven;
	exports.hashToPrivateScalar = hashToPrivateScalar;
	exports.getFieldBytesLength = getFieldBytesLength;
	exports.getMinHashLength = getMinHashLength;
	exports.mapHashToField = mapHashToField;
	/**
	* Utils for modular division and fields.
	* Field over 11 is a finite (Galois) field is integer number operations `mod 11`.
	* There is no division: it is replaced by modular multiplicative inverse.
	* @module
	*/
	/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */
	const utils_ts_1 = require_utils$1();
	const _0n = BigInt(0);
	const _1n = BigInt(1);
	const _2n = /* @__PURE__ */ BigInt(2);
	const _3n = /* @__PURE__ */ BigInt(3);
	const _4n = /* @__PURE__ */ BigInt(4);
	const _5n = /* @__PURE__ */ BigInt(5);
	const _7n = /* @__PURE__ */ BigInt(7);
	const _8n = /* @__PURE__ */ BigInt(8);
	const _9n = /* @__PURE__ */ BigInt(9);
	const _16n = /* @__PURE__ */ BigInt(16);
	function mod(a, b) {
		const result = a % b;
		return result >= _0n ? result : b + result;
	}
	/**
	* Efficiently raise num to power and do modular division.
	* Unsafe in some contexts: uses ladder, so can expose bigint bits.
	* @example
	* pow(2n, 6n, 11n) // 64n % 11n == 9n
	*/
	function pow(num, power, modulo) {
		return FpPow(Field(modulo), num, power);
	}
	/** Does `x^(2^power)` mod p. `pow2(30, 4)` == `30^(2^4)` */
	function pow2(x, power, modulo) {
		let res = x;
		while (power-- > _0n) {
			res *= res;
			res %= modulo;
		}
		return res;
	}
	/**
	* Inverses number over modulo.
	* Implemented using [Euclidean GCD](https://brilliant.org/wiki/extended-euclidean-algorithm/).
	*/
	function invert(number, modulo) {
		if (number === _0n) throw new Error("invert: expected non-zero number");
		if (modulo <= _0n) throw new Error("invert: expected positive modulus, got " + modulo);
		let a = mod(number, modulo);
		let b = modulo;
		let x = _0n, y = _1n, u = _1n, v = _0n;
		while (a !== _0n) {
			const q = b / a;
			const r = b % a;
			const m = x - u * q;
			const n = y - v * q;
			b = a, a = r, x = u, y = v, u = m, v = n;
		}
		if (b !== _1n) throw new Error("invert: does not exist");
		return mod(x, modulo);
	}
	function assertIsSquare(Fp, root, n) {
		if (!Fp.eql(Fp.sqr(root), n)) throw new Error("Cannot find square root");
	}
	function sqrt3mod4(Fp, n) {
		const p1div4 = (Fp.ORDER + _1n) / _4n;
		const root = Fp.pow(n, p1div4);
		assertIsSquare(Fp, root, n);
		return root;
	}
	function sqrt5mod8(Fp, n) {
		const p5div8 = (Fp.ORDER - _5n) / _8n;
		const n2 = Fp.mul(n, _2n);
		const v = Fp.pow(n2, p5div8);
		const nv = Fp.mul(n, v);
		const i = Fp.mul(Fp.mul(nv, _2n), v);
		const root = Fp.mul(nv, Fp.sub(i, Fp.ONE));
		assertIsSquare(Fp, root, n);
		return root;
	}
	function sqrt9mod16(P) {
		const Fp_ = Field(P);
		const tn = tonelliShanks(P);
		const c1 = tn(Fp_, Fp_.neg(Fp_.ONE));
		const c2 = tn(Fp_, c1);
		const c3 = tn(Fp_, Fp_.neg(c1));
		const c4 = (P + _7n) / _16n;
		return (Fp, n) => {
			let tv1 = Fp.pow(n, c4);
			let tv2 = Fp.mul(tv1, c1);
			const tv3 = Fp.mul(tv1, c2);
			const tv4 = Fp.mul(tv1, c3);
			const e1 = Fp.eql(Fp.sqr(tv2), n);
			const e2 = Fp.eql(Fp.sqr(tv3), n);
			tv1 = Fp.cmov(tv1, tv2, e1);
			tv2 = Fp.cmov(tv4, tv3, e2);
			const e3 = Fp.eql(Fp.sqr(tv2), n);
			const root = Fp.cmov(tv1, tv2, e3);
			assertIsSquare(Fp, root, n);
			return root;
		};
	}
	/**
	* Tonelli-Shanks square root search algorithm.
	* 1. https://eprint.iacr.org/2012/685.pdf (page 12)
	* 2. Square Roots from 1; 24, 51, 10 to Dan Shanks
	* @param P field order
	* @returns function that takes field Fp (created from P) and number n
	*/
	function tonelliShanks(P) {
		if (P < _3n) throw new Error("sqrt is not defined for small field");
		let Q = P - _1n;
		let S = 0;
		while (Q % _2n === _0n) {
			Q /= _2n;
			S++;
		}
		let Z = _2n;
		const _Fp = Field(P);
		while (FpLegendre(_Fp, Z) === 1) if (Z++ > 1e3) throw new Error("Cannot find square root: probably non-prime P");
		if (S === 1) return sqrt3mod4;
		let cc = _Fp.pow(Z, Q);
		const Q1div2 = (Q + _1n) / _2n;
		return function tonelliSlow(Fp, n) {
			if (Fp.is0(n)) return n;
			if (FpLegendre(Fp, n) !== 1) throw new Error("Cannot find square root");
			let M = S;
			let c = Fp.mul(Fp.ONE, cc);
			let t = Fp.pow(n, Q);
			let R = Fp.pow(n, Q1div2);
			while (!Fp.eql(t, Fp.ONE)) {
				if (Fp.is0(t)) return Fp.ZERO;
				let i = 1;
				let t_tmp = Fp.sqr(t);
				while (!Fp.eql(t_tmp, Fp.ONE)) {
					i++;
					t_tmp = Fp.sqr(t_tmp);
					if (i === M) throw new Error("Cannot find square root");
				}
				const exponent = _1n << BigInt(M - i - 1);
				const b = Fp.pow(c, exponent);
				M = i;
				c = Fp.sqr(b);
				t = Fp.mul(t, c);
				R = Fp.mul(R, b);
			}
			return R;
		};
	}
	/**
	* Square root for a finite field. Will try optimized versions first:
	*
	* 1. P ≡ 3 (mod 4)
	* 2. P ≡ 5 (mod 8)
	* 3. P ≡ 9 (mod 16)
	* 4. Tonelli-Shanks algorithm
	*
	* Different algorithms can give different roots, it is up to user to decide which one they want.
	* For example there is FpSqrtOdd/FpSqrtEven to choice root based on oddness (used for hash-to-curve).
	*/
	function FpSqrt(P) {
		if (P % _4n === _3n) return sqrt3mod4;
		if (P % _8n === _5n) return sqrt5mod8;
		if (P % _16n === _9n) return sqrt9mod16(P);
		return tonelliShanks(P);
	}
	const isNegativeLE = (num, modulo) => (mod(num, modulo) & _1n) === _1n;
	exports.isNegativeLE = isNegativeLE;
	const FIELD_FIELDS = [
		"create",
		"isValid",
		"is0",
		"neg",
		"inv",
		"sqrt",
		"sqr",
		"eql",
		"add",
		"sub",
		"mul",
		"pow",
		"div",
		"addN",
		"subN",
		"mulN",
		"sqrN"
	];
	function validateField(field) {
		const opts = FIELD_FIELDS.reduce((map, val) => {
			map[val] = "function";
			return map;
		}, {
			ORDER: "bigint",
			MASK: "bigint",
			BYTES: "number",
			BITS: "number"
		});
		(0, utils_ts_1._validateObject)(field, opts);
		return field;
	}
	/**
	* Same as `pow` but for Fp: non-constant-time.
	* Unsafe in some contexts: uses ladder, so can expose bigint bits.
	*/
	function FpPow(Fp, num, power) {
		if (power < _0n) throw new Error("invalid exponent, negatives unsupported");
		if (power === _0n) return Fp.ONE;
		if (power === _1n) return num;
		let p = Fp.ONE;
		let d = num;
		while (power > _0n) {
			if (power & _1n) p = Fp.mul(p, d);
			d = Fp.sqr(d);
			power >>= _1n;
		}
		return p;
	}
	/**
	* Efficiently invert an array of Field elements.
	* Exception-free. Will return `undefined` for 0 elements.
	* @param passZero map 0 to 0 (instead of undefined)
	*/
	function FpInvertBatch(Fp, nums, passZero = false) {
		const inverted = new Array(nums.length).fill(passZero ? Fp.ZERO : void 0);
		const multipliedAcc = nums.reduce((acc, num, i) => {
			if (Fp.is0(num)) return acc;
			inverted[i] = acc;
			return Fp.mul(acc, num);
		}, Fp.ONE);
		const invertedAcc = Fp.inv(multipliedAcc);
		nums.reduceRight((acc, num, i) => {
			if (Fp.is0(num)) return acc;
			inverted[i] = Fp.mul(acc, inverted[i]);
			return Fp.mul(acc, num);
		}, invertedAcc);
		return inverted;
	}
	function FpDiv(Fp, lhs, rhs) {
		return Fp.mul(lhs, typeof rhs === "bigint" ? invert(rhs, Fp.ORDER) : Fp.inv(rhs));
	}
	/**
	* Legendre symbol.
	* Legendre constant is used to calculate Legendre symbol (a | p)
	* which denotes the value of a^((p-1)/2) (mod p).
	*
	* * (a | p) ≡ 1    if a is a square (mod p), quadratic residue
	* * (a | p) ≡ -1   if a is not a square (mod p), quadratic non residue
	* * (a | p) ≡ 0    if a ≡ 0 (mod p)
	*/
	function FpLegendre(Fp, n) {
		const p1mod2 = (Fp.ORDER - _1n) / _2n;
		const powered = Fp.pow(n, p1mod2);
		const yes = Fp.eql(powered, Fp.ONE);
		const zero = Fp.eql(powered, Fp.ZERO);
		const no = Fp.eql(powered, Fp.neg(Fp.ONE));
		if (!yes && !zero && !no) throw new Error("invalid Legendre symbol result");
		return yes ? 1 : zero ? 0 : -1;
	}
	function FpIsSquare(Fp, n) {
		return FpLegendre(Fp, n) === 1;
	}
	function nLength(n, nBitLength) {
		if (nBitLength !== void 0) (0, utils_ts_1.anumber)(nBitLength);
		const _nBitLength = nBitLength !== void 0 ? nBitLength : n.toString(2).length;
		return {
			nBitLength: _nBitLength,
			nByteLength: Math.ceil(_nBitLength / 8)
		};
	}
	/**
	* Creates a finite field. Major performance optimizations:
	* * 1. Denormalized operations like mulN instead of mul.
	* * 2. Identical object shape: never add or remove keys.
	* * 3. `Object.freeze`.
	* Fragile: always run a benchmark on a change.
	* Security note: operations don't check 'isValid' for all elements for performance reasons,
	* it is caller responsibility to check this.
	* This is low-level code, please make sure you know what you're doing.
	*
	* Note about field properties:
	* * CHARACTERISTIC p = prime number, number of elements in main subgroup.
	* * ORDER q = similar to cofactor in curves, may be composite `q = p^m`.
	*
	* @param ORDER field order, probably prime, or could be composite
	* @param bitLen how many bits the field consumes
	* @param isLE (default: false) if encoding / decoding should be in little-endian
	* @param redef optional faster redefinitions of sqrt and other methods
	*/
	function Field(ORDER, bitLenOrOpts, isLE = false, opts = {}) {
		if (ORDER <= _0n) throw new Error("invalid field: expected ORDER > 0, got " + ORDER);
		let _nbitLength = void 0;
		let _sqrt = void 0;
		let modFromBytes = false;
		let allowedLengths = void 0;
		if (typeof bitLenOrOpts === "object" && bitLenOrOpts != null) {
			if (opts.sqrt || isLE) throw new Error("cannot specify opts in two arguments");
			const _opts = bitLenOrOpts;
			if (_opts.BITS) _nbitLength = _opts.BITS;
			if (_opts.sqrt) _sqrt = _opts.sqrt;
			if (typeof _opts.isLE === "boolean") isLE = _opts.isLE;
			if (typeof _opts.modFromBytes === "boolean") modFromBytes = _opts.modFromBytes;
			allowedLengths = _opts.allowedLengths;
		} else {
			if (typeof bitLenOrOpts === "number") _nbitLength = bitLenOrOpts;
			if (opts.sqrt) _sqrt = opts.sqrt;
		}
		const { nBitLength: BITS, nByteLength: BYTES } = nLength(ORDER, _nbitLength);
		if (BYTES > 2048) throw new Error("invalid field: expected ORDER of <= 2048 bytes");
		let sqrtP;
		const f = Object.freeze({
			ORDER,
			isLE,
			BITS,
			BYTES,
			MASK: (0, utils_ts_1.bitMask)(BITS),
			ZERO: _0n,
			ONE: _1n,
			allowedLengths,
			create: (num) => mod(num, ORDER),
			isValid: (num) => {
				if (typeof num !== "bigint") throw new Error("invalid field element: expected bigint, got " + typeof num);
				return _0n <= num && num < ORDER;
			},
			is0: (num) => num === _0n,
			isValidNot0: (num) => !f.is0(num) && f.isValid(num),
			isOdd: (num) => (num & _1n) === _1n,
			neg: (num) => mod(-num, ORDER),
			eql: (lhs, rhs) => lhs === rhs,
			sqr: (num) => mod(num * num, ORDER),
			add: (lhs, rhs) => mod(lhs + rhs, ORDER),
			sub: (lhs, rhs) => mod(lhs - rhs, ORDER),
			mul: (lhs, rhs) => mod(lhs * rhs, ORDER),
			pow: (num, power) => FpPow(f, num, power),
			div: (lhs, rhs) => mod(lhs * invert(rhs, ORDER), ORDER),
			sqrN: (num) => num * num,
			addN: (lhs, rhs) => lhs + rhs,
			subN: (lhs, rhs) => lhs - rhs,
			mulN: (lhs, rhs) => lhs * rhs,
			inv: (num) => invert(num, ORDER),
			sqrt: _sqrt || ((n) => {
				if (!sqrtP) sqrtP = FpSqrt(ORDER);
				return sqrtP(f, n);
			}),
			toBytes: (num) => isLE ? (0, utils_ts_1.numberToBytesLE)(num, BYTES) : (0, utils_ts_1.numberToBytesBE)(num, BYTES),
			fromBytes: (bytes, skipValidation = true) => {
				if (allowedLengths) {
					if (!allowedLengths.includes(bytes.length) || bytes.length > BYTES) throw new Error("Field.fromBytes: expected " + allowedLengths + " bytes, got " + bytes.length);
					const padded = new Uint8Array(BYTES);
					padded.set(bytes, isLE ? 0 : padded.length - bytes.length);
					bytes = padded;
				}
				if (bytes.length !== BYTES) throw new Error("Field.fromBytes: expected " + BYTES + " bytes, got " + bytes.length);
				let scalar = isLE ? (0, utils_ts_1.bytesToNumberLE)(bytes) : (0, utils_ts_1.bytesToNumberBE)(bytes);
				if (modFromBytes) scalar = mod(scalar, ORDER);
				if (!skipValidation) {
					if (!f.isValid(scalar)) throw new Error("invalid field element: outside of range 0..ORDER");
				}
				return scalar;
			},
			invertBatch: (lst) => FpInvertBatch(f, lst),
			cmov: (a, b, c) => c ? b : a
		});
		return Object.freeze(f);
	}
	function FpSqrtOdd(Fp, elm) {
		if (!Fp.isOdd) throw new Error("Field doesn't have isOdd");
		const root = Fp.sqrt(elm);
		return Fp.isOdd(root) ? root : Fp.neg(root);
	}
	function FpSqrtEven(Fp, elm) {
		if (!Fp.isOdd) throw new Error("Field doesn't have isOdd");
		const root = Fp.sqrt(elm);
		return Fp.isOdd(root) ? Fp.neg(root) : root;
	}
	/**
	* "Constant-time" private key generation utility.
	* Same as mapKeyToField, but accepts less bytes (40 instead of 48 for 32-byte field).
	* Which makes it slightly more biased, less secure.
	* @deprecated use `mapKeyToField` instead
	*/
	function hashToPrivateScalar(hash, groupOrder, isLE = false) {
		hash = (0, utils_ts_1.ensureBytes)("privateHash", hash);
		const hashLen = hash.length;
		const minLen = nLength(groupOrder).nByteLength + 8;
		if (minLen < 24 || hashLen < minLen || hashLen > 1024) throw new Error("hashToPrivateScalar: expected " + minLen + "-1024 bytes of input, got " + hashLen);
		return mod(isLE ? (0, utils_ts_1.bytesToNumberLE)(hash) : (0, utils_ts_1.bytesToNumberBE)(hash), groupOrder - _1n) + _1n;
	}
	/**
	* Returns total number of bytes consumed by the field element.
	* For example, 32 bytes for usual 256-bit weierstrass curve.
	* @param fieldOrder number of field elements, usually CURVE.n
	* @returns byte length of field
	*/
	function getFieldBytesLength(fieldOrder) {
		if (typeof fieldOrder !== "bigint") throw new Error("field order must be bigint");
		const bitLength = fieldOrder.toString(2).length;
		return Math.ceil(bitLength / 8);
	}
	/**
	* Returns minimal amount of bytes that can be safely reduced
	* by field order.
	* Should be 2^-128 for 128-bit curve such as P256.
	* @param fieldOrder number of field elements, usually CURVE.n
	* @returns byte length of target hash
	*/
	function getMinHashLength(fieldOrder) {
		const length = getFieldBytesLength(fieldOrder);
		return length + Math.ceil(length / 2);
	}
	/**
	* "Constant-time" private key generation utility.
	* Can take (n + n/2) or more bytes of uniform input e.g. from CSPRNG or KDF
	* and convert them into private scalar, with the modulo bias being negligible.
	* Needs at least 48 bytes of input for 32-byte private key.
	* https://research.kudelskisecurity.com/2020/07/28/the-definitive-guide-to-modulo-bias-and-how-to-avoid-it/
	* FIPS 186-5, A.2 https://csrc.nist.gov/publications/detail/fips/186/5/final
	* RFC 9380, https://www.rfc-editor.org/rfc/rfc9380#section-5
	* @param hash hash output from SHA3 or a similar function
	* @param groupOrder size of subgroup - (e.g. secp256k1.CURVE.n)
	* @param isLE interpret hash bytes as LE num
	* @returns valid private scalar
	*/
	function mapHashToField(key, fieldOrder, isLE = false) {
		const len = key.length;
		const fieldLen = getFieldBytesLength(fieldOrder);
		const minLen = getMinHashLength(fieldOrder);
		if (len < 16 || len < minLen || len > 1024) throw new Error("expected " + minLen + "-1024 bytes of input, got " + len);
		const reduced = mod(isLE ? (0, utils_ts_1.bytesToNumberLE)(key) : (0, utils_ts_1.bytesToNumberBE)(key), fieldOrder - _1n) + _1n;
		return isLE ? (0, utils_ts_1.numberToBytesLE)(reduced, fieldLen) : (0, utils_ts_1.numberToBytesBE)(reduced, fieldLen);
	}
}));
//#endregion
//#region node_modules/.pnpm/@noble+curves@1.9.7/node_modules/@noble/curves/abstract/curve.js
var require_curve = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.wNAF = void 0;
	exports.negateCt = negateCt;
	exports.normalizeZ = normalizeZ;
	exports.mulEndoUnsafe = mulEndoUnsafe;
	exports.pippenger = pippenger;
	exports.precomputeMSMUnsafe = precomputeMSMUnsafe;
	exports.validateBasic = validateBasic;
	exports._createCurveFields = _createCurveFields;
	/**
	* Methods for elliptic curve multiplication by scalars.
	* Contains wNAF, pippenger.
	* @module
	*/
	/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */
	const utils_ts_1 = require_utils$1();
	const modular_ts_1 = require_modular();
	const _0n = BigInt(0);
	const _1n = BigInt(1);
	function negateCt(condition, item) {
		const neg = item.negate();
		return condition ? neg : item;
	}
	/**
	* Takes a bunch of Projective Points but executes only one
	* inversion on all of them. Inversion is very slow operation,
	* so this improves performance massively.
	* Optimization: converts a list of projective points to a list of identical points with Z=1.
	*/
	function normalizeZ(c, points) {
		const invertedZs = (0, modular_ts_1.FpInvertBatch)(c.Fp, points.map((p) => p.Z));
		return points.map((p, i) => c.fromAffine(p.toAffine(invertedZs[i])));
	}
	function validateW(W, bits) {
		if (!Number.isSafeInteger(W) || W <= 0 || W > bits) throw new Error("invalid window size, expected [1.." + bits + "], got W=" + W);
	}
	function calcWOpts(W, scalarBits) {
		validateW(W, scalarBits);
		const windows = Math.ceil(scalarBits / W) + 1;
		const windowSize = 2 ** (W - 1);
		const maxNumber = 2 ** W;
		return {
			windows,
			windowSize,
			mask: (0, utils_ts_1.bitMask)(W),
			maxNumber,
			shiftBy: BigInt(W)
		};
	}
	function calcOffsets(n, window, wOpts) {
		const { windowSize, mask, maxNumber, shiftBy } = wOpts;
		let wbits = Number(n & mask);
		let nextN = n >> shiftBy;
		if (wbits > windowSize) {
			wbits -= maxNumber;
			nextN += _1n;
		}
		const offsetStart = window * windowSize;
		const offset = offsetStart + Math.abs(wbits) - 1;
		const isZero = wbits === 0;
		const isNeg = wbits < 0;
		const isNegF = window % 2 !== 0;
		return {
			nextN,
			offset,
			isZero,
			isNeg,
			isNegF,
			offsetF: offsetStart
		};
	}
	function validateMSMPoints(points, c) {
		if (!Array.isArray(points)) throw new Error("array expected");
		points.forEach((p, i) => {
			if (!(p instanceof c)) throw new Error("invalid point at index " + i);
		});
	}
	function validateMSMScalars(scalars, field) {
		if (!Array.isArray(scalars)) throw new Error("array of scalars expected");
		scalars.forEach((s, i) => {
			if (!field.isValid(s)) throw new Error("invalid scalar at index " + i);
		});
	}
	const pointPrecomputes = /* @__PURE__ */ new WeakMap();
	const pointWindowSizes = /* @__PURE__ */ new WeakMap();
	function getW(P) {
		return pointWindowSizes.get(P) || 1;
	}
	function assert0(n) {
		if (n !== _0n) throw new Error("invalid wNAF");
	}
	/**
	* Elliptic curve multiplication of Point by scalar. Fragile.
	* Table generation takes **30MB of ram and 10ms on high-end CPU**,
	* but may take much longer on slow devices. Actual generation will happen on
	* first call of `multiply()`. By default, `BASE` point is precomputed.
	*
	* Scalars should always be less than curve order: this should be checked inside of a curve itself.
	* Creates precomputation tables for fast multiplication:
	* - private scalar is split by fixed size windows of W bits
	* - every window point is collected from window's table & added to accumulator
	* - since windows are different, same point inside tables won't be accessed more than once per calc
	* - each multiplication is 'Math.ceil(CURVE_ORDER / 𝑊) + 1' point additions (fixed for any scalar)
	* - +1 window is neccessary for wNAF
	* - wNAF reduces table size: 2x less memory + 2x faster generation, but 10% slower multiplication
	*
	* @todo Research returning 2d JS array of windows, instead of a single window.
	* This would allow windows to be in different memory locations
	*/
	var wNAF = class {
		constructor(Point, bits) {
			this.BASE = Point.BASE;
			this.ZERO = Point.ZERO;
			this.Fn = Point.Fn;
			this.bits = bits;
		}
		_unsafeLadder(elm, n, p = this.ZERO) {
			let d = elm;
			while (n > _0n) {
				if (n & _1n) p = p.add(d);
				d = d.double();
				n >>= _1n;
			}
			return p;
		}
		/**
		* Creates a wNAF precomputation window. Used for caching.
		* Default window size is set by `utils.precompute()` and is equal to 8.
		* Number of precomputed points depends on the curve size:
		* 2^(𝑊−1) * (Math.ceil(𝑛 / 𝑊) + 1), where:
		* - 𝑊 is the window size
		* - 𝑛 is the bitlength of the curve order.
		* For a 256-bit curve and window size 8, the number of precomputed points is 128 * 33 = 4224.
		* @param point Point instance
		* @param W window size
		* @returns precomputed point tables flattened to a single array
		*/
		precomputeWindow(point, W) {
			const { windows, windowSize } = calcWOpts(W, this.bits);
			const points = [];
			let p = point;
			let base = p;
			for (let window = 0; window < windows; window++) {
				base = p;
				points.push(base);
				for (let i = 1; i < windowSize; i++) {
					base = base.add(p);
					points.push(base);
				}
				p = base.double();
			}
			return points;
		}
		/**
		* Implements ec multiplication using precomputed tables and w-ary non-adjacent form.
		* More compact implementation:
		* https://github.com/paulmillr/noble-secp256k1/blob/47cb1669b6e506ad66b35fe7d76132ae97465da2/index.ts#L502-L541
		* @returns real and fake (for const-time) points
		*/
		wNAF(W, precomputes, n) {
			if (!this.Fn.isValid(n)) throw new Error("invalid scalar");
			let p = this.ZERO;
			let f = this.BASE;
			const wo = calcWOpts(W, this.bits);
			for (let window = 0; window < wo.windows; window++) {
				const { nextN, offset, isZero, isNeg, isNegF, offsetF } = calcOffsets(n, window, wo);
				n = nextN;
				if (isZero) f = f.add(negateCt(isNegF, precomputes[offsetF]));
				else p = p.add(negateCt(isNeg, precomputes[offset]));
			}
			assert0(n);
			return {
				p,
				f
			};
		}
		/**
		* Implements ec unsafe (non const-time) multiplication using precomputed tables and w-ary non-adjacent form.
		* @param acc accumulator point to add result of multiplication
		* @returns point
		*/
		wNAFUnsafe(W, precomputes, n, acc = this.ZERO) {
			const wo = calcWOpts(W, this.bits);
			for (let window = 0; window < wo.windows; window++) {
				if (n === _0n) break;
				const { nextN, offset, isZero, isNeg } = calcOffsets(n, window, wo);
				n = nextN;
				if (isZero) continue;
				else {
					const item = precomputes[offset];
					acc = acc.add(isNeg ? item.negate() : item);
				}
			}
			assert0(n);
			return acc;
		}
		getPrecomputes(W, point, transform) {
			let comp = pointPrecomputes.get(point);
			if (!comp) {
				comp = this.precomputeWindow(point, W);
				if (W !== 1) {
					if (typeof transform === "function") comp = transform(comp);
					pointPrecomputes.set(point, comp);
				}
			}
			return comp;
		}
		cached(point, scalar, transform) {
			const W = getW(point);
			return this.wNAF(W, this.getPrecomputes(W, point, transform), scalar);
		}
		unsafe(point, scalar, transform, prev) {
			const W = getW(point);
			if (W === 1) return this._unsafeLadder(point, scalar, prev);
			return this.wNAFUnsafe(W, this.getPrecomputes(W, point, transform), scalar, prev);
		}
		createCache(P, W) {
			validateW(W, this.bits);
			pointWindowSizes.set(P, W);
			pointPrecomputes.delete(P);
		}
		hasCache(elm) {
			return getW(elm) !== 1;
		}
	};
	exports.wNAF = wNAF;
	/**
	* Endomorphism-specific multiplication for Koblitz curves.
	* Cost: 128 dbl, 0-256 adds.
	*/
	function mulEndoUnsafe(Point, point, k1, k2) {
		let acc = point;
		let p1 = Point.ZERO;
		let p2 = Point.ZERO;
		while (k1 > _0n || k2 > _0n) {
			if (k1 & _1n) p1 = p1.add(acc);
			if (k2 & _1n) p2 = p2.add(acc);
			acc = acc.double();
			k1 >>= _1n;
			k2 >>= _1n;
		}
		return {
			p1,
			p2
		};
	}
	/**
	* Pippenger algorithm for multi-scalar multiplication (MSM, Pa + Qb + Rc + ...).
	* 30x faster vs naive addition on L=4096, 10x faster than precomputes.
	* For N=254bit, L=1, it does: 1024 ADD + 254 DBL. For L=5: 1536 ADD + 254 DBL.
	* Algorithmically constant-time (for same L), even when 1 point + scalar, or when scalar = 0.
	* @param c Curve Point constructor
	* @param fieldN field over CURVE.N - important that it's not over CURVE.P
	* @param points array of L curve points
	* @param scalars array of L scalars (aka secret keys / bigints)
	*/
	function pippenger(c, fieldN, points, scalars) {
		validateMSMPoints(points, c);
		validateMSMScalars(scalars, fieldN);
		const plength = points.length;
		const slength = scalars.length;
		if (plength !== slength) throw new Error("arrays of points and scalars must have equal length");
		const zero = c.ZERO;
		const wbits = (0, utils_ts_1.bitLen)(BigInt(plength));
		let windowSize = 1;
		if (wbits > 12) windowSize = wbits - 3;
		else if (wbits > 4) windowSize = wbits - 2;
		else if (wbits > 0) windowSize = 2;
		const MASK = (0, utils_ts_1.bitMask)(windowSize);
		const buckets = new Array(Number(MASK) + 1).fill(zero);
		const lastBits = Math.floor((fieldN.BITS - 1) / windowSize) * windowSize;
		let sum = zero;
		for (let i = lastBits; i >= 0; i -= windowSize) {
			buckets.fill(zero);
			for (let j = 0; j < slength; j++) {
				const scalar = scalars[j];
				const wbits = Number(scalar >> BigInt(i) & MASK);
				buckets[wbits] = buckets[wbits].add(points[j]);
			}
			let resI = zero;
			for (let j = buckets.length - 1, sumI = zero; j > 0; j--) {
				sumI = sumI.add(buckets[j]);
				resI = resI.add(sumI);
			}
			sum = sum.add(resI);
			if (i !== 0) for (let j = 0; j < windowSize; j++) sum = sum.double();
		}
		return sum;
	}
	/**
	* Precomputed multi-scalar multiplication (MSM, Pa + Qb + Rc + ...).
	* @param c Curve Point constructor
	* @param fieldN field over CURVE.N - important that it's not over CURVE.P
	* @param points array of L curve points
	* @returns function which multiplies points with scaars
	*/
	function precomputeMSMUnsafe(c, fieldN, points, windowSize) {
		/**
		* Performance Analysis of Window-based Precomputation
		*
		* Base Case (256-bit scalar, 8-bit window):
		* - Standard precomputation requires:
		*   - 31 additions per scalar × 256 scalars = 7,936 ops
		*   - Plus 255 summary additions = 8,191 total ops
		*   Note: Summary additions can be optimized via accumulator
		*
		* Chunked Precomputation Analysis:
		* - Using 32 chunks requires:
		*   - 255 additions per chunk
		*   - 256 doublings
		*   - Total: (255 × 32) + 256 = 8,416 ops
		*
		* Memory Usage Comparison:
		* Window Size | Standard Points | Chunked Points
		* ------------|-----------------|---------------
		*     4-bit   |     520         |      15
		*     8-bit   |    4,224        |     255
		*    10-bit   |   13,824        |   1,023
		*    16-bit   |  557,056        |  65,535
		*
		* Key Advantages:
		* 1. Enables larger window sizes due to reduced memory overhead
		* 2. More efficient for smaller scalar counts:
		*    - 16 chunks: (16 × 255) + 256 = 4,336 ops
		*    - ~2x faster than standard 8,191 ops
		*
		* Limitations:
		* - Not suitable for plain precomputes (requires 256 constant doublings)
		* - Performance degrades with larger scalar counts:
		*   - Optimal for ~256 scalars
		*   - Less efficient for 4096+ scalars (Pippenger preferred)
		*/
		validateW(windowSize, fieldN.BITS);
		validateMSMPoints(points, c);
		const zero = c.ZERO;
		const tableSize = 2 ** windowSize - 1;
		const chunks = Math.ceil(fieldN.BITS / windowSize);
		const MASK = (0, utils_ts_1.bitMask)(windowSize);
		const tables = points.map((p) => {
			const res = [];
			for (let i = 0, acc = p; i < tableSize; i++) {
				res.push(acc);
				acc = acc.add(p);
			}
			return res;
		});
		return (scalars) => {
			validateMSMScalars(scalars, fieldN);
			if (scalars.length > points.length) throw new Error("array of scalars must be smaller than array of points");
			let res = zero;
			for (let i = 0; i < chunks; i++) {
				if (res !== zero) for (let j = 0; j < windowSize; j++) res = res.double();
				const shiftBy = BigInt(chunks * windowSize - (i + 1) * windowSize);
				for (let j = 0; j < scalars.length; j++) {
					const n = scalars[j];
					const curr = Number(n >> shiftBy & MASK);
					if (!curr) continue;
					res = res.add(tables[j][curr - 1]);
				}
			}
			return res;
		};
	}
	/** @deprecated */
	function validateBasic(curve) {
		(0, modular_ts_1.validateField)(curve.Fp);
		(0, utils_ts_1.validateObject)(curve, {
			n: "bigint",
			h: "bigint",
			Gx: "field",
			Gy: "field"
		}, {
			nBitLength: "isSafeInteger",
			nByteLength: "isSafeInteger"
		});
		return Object.freeze({
			...(0, modular_ts_1.nLength)(curve.n, curve.nBitLength),
			...curve,
			p: curve.Fp.ORDER
		});
	}
	function createField(order, field, isLE) {
		if (field) {
			if (field.ORDER !== order) throw new Error("Field.ORDER must match order: Fp == p, Fn == n");
			(0, modular_ts_1.validateField)(field);
			return field;
		} else return (0, modular_ts_1.Field)(order, { isLE });
	}
	/** Validates CURVE opts and creates fields */
	function _createCurveFields(type, CURVE, curveOpts = {}, FpFnLE) {
		if (FpFnLE === void 0) FpFnLE = type === "edwards";
		if (!CURVE || typeof CURVE !== "object") throw new Error(`expected valid ${type} CURVE object`);
		for (const p of [
			"p",
			"n",
			"h"
		]) {
			const val = CURVE[p];
			if (!(typeof val === "bigint" && val > _0n)) throw new Error(`CURVE.${p} must be positive bigint`);
		}
		const Fp = createField(CURVE.p, curveOpts.Fp, FpFnLE);
		const Fn = createField(CURVE.n, curveOpts.Fn, FpFnLE);
		const params = [
			"Gx",
			"Gy",
			"a",
			type === "weierstrass" ? "b" : "d"
		];
		for (const p of params) if (!Fp.isValid(CURVE[p])) throw new Error(`CURVE.${p} must be valid field element of CURVE.Fp`);
		CURVE = Object.freeze(Object.assign({}, CURVE));
		return {
			CURVE,
			Fp,
			Fn
		};
	}
}));
//#endregion
//#region node_modules/.pnpm/@noble+curves@1.9.7/node_modules/@noble/curves/abstract/edwards.js
var require_edwards = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.PrimeEdwardsPoint = void 0;
	exports.edwards = edwards;
	exports.eddsa = eddsa;
	exports.twistedEdwards = twistedEdwards;
	/**
	* Twisted Edwards curve. The formula is: ax² + y² = 1 + dx²y².
	* For design rationale of types / exports, see weierstrass module documentation.
	* Untwisted Edwards curves exist, but they aren't used in real-world protocols.
	* @module
	*/
	/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */
	const utils_ts_1 = require_utils$1();
	const curve_ts_1 = require_curve();
	const modular_ts_1 = require_modular();
	const _0n = BigInt(0);
	const _1n = BigInt(1);
	const _2n = BigInt(2);
	const _8n = BigInt(8);
	function isEdValidXY(Fp, CURVE, x, y) {
		const x2 = Fp.sqr(x);
		const y2 = Fp.sqr(y);
		const left = Fp.add(Fp.mul(CURVE.a, x2), y2);
		const right = Fp.add(Fp.ONE, Fp.mul(CURVE.d, Fp.mul(x2, y2)));
		return Fp.eql(left, right);
	}
	function edwards(params, extraOpts = {}) {
		const validated = (0, curve_ts_1._createCurveFields)("edwards", params, extraOpts, extraOpts.FpFnLE);
		const { Fp, Fn } = validated;
		let CURVE = validated.CURVE;
		const { h: cofactor } = CURVE;
		(0, utils_ts_1._validateObject)(extraOpts, {}, { uvRatio: "function" });
		const MASK = _2n << BigInt(Fn.BYTES * 8) - _1n;
		const modP = (n) => Fp.create(n);
		const uvRatio = extraOpts.uvRatio || ((u, v) => {
			try {
				return {
					isValid: true,
					value: Fp.sqrt(Fp.div(u, v))
				};
			} catch (e) {
				return {
					isValid: false,
					value: _0n
				};
			}
		});
		if (!isEdValidXY(Fp, CURVE, CURVE.Gx, CURVE.Gy)) throw new Error("bad curve params: generator point");
		/**
		* Asserts coordinate is valid: 0 <= n < MASK.
		* Coordinates >= Fp.ORDER are allowed for zip215.
		*/
		function acoord(title, n, banZero = false) {
			const min = banZero ? _1n : _0n;
			(0, utils_ts_1.aInRange)("coordinate " + title, n, min, MASK);
			return n;
		}
		function aextpoint(other) {
			if (!(other instanceof Point)) throw new Error("ExtendedPoint expected");
		}
		const toAffineMemo = (0, utils_ts_1.memoized)((p, iz) => {
			const { X, Y, Z } = p;
			const is0 = p.is0();
			if (iz == null) iz = is0 ? _8n : Fp.inv(Z);
			const x = modP(X * iz);
			const y = modP(Y * iz);
			const zz = Fp.mul(Z, iz);
			if (is0) return {
				x: _0n,
				y: _1n
			};
			if (zz !== _1n) throw new Error("invZ was invalid");
			return {
				x,
				y
			};
		});
		const assertValidMemo = (0, utils_ts_1.memoized)((p) => {
			const { a, d } = CURVE;
			if (p.is0()) throw new Error("bad point: ZERO");
			const { X, Y, Z, T } = p;
			const X2 = modP(X * X);
			const Y2 = modP(Y * Y);
			const Z2 = modP(Z * Z);
			const Z4 = modP(Z2 * Z2);
			const aX2 = modP(X2 * a);
			if (modP(Z2 * modP(aX2 + Y2)) !== modP(Z4 + modP(d * modP(X2 * Y2)))) throw new Error("bad point: equation left != right (1)");
			if (modP(X * Y) !== modP(Z * T)) throw new Error("bad point: equation left != right (2)");
			return true;
		});
		class Point {
			constructor(X, Y, Z, T) {
				this.X = acoord("x", X);
				this.Y = acoord("y", Y);
				this.Z = acoord("z", Z, true);
				this.T = acoord("t", T);
				Object.freeze(this);
			}
			static CURVE() {
				return CURVE;
			}
			static fromAffine(p) {
				if (p instanceof Point) throw new Error("extended point not allowed");
				const { x, y } = p || {};
				acoord("x", x);
				acoord("y", y);
				return new Point(x, y, _1n, modP(x * y));
			}
			static fromBytes(bytes, zip215 = false) {
				const len = Fp.BYTES;
				const { a, d } = CURVE;
				bytes = (0, utils_ts_1.copyBytes)((0, utils_ts_1._abytes2)(bytes, len, "point"));
				(0, utils_ts_1._abool2)(zip215, "zip215");
				const normed = (0, utils_ts_1.copyBytes)(bytes);
				const lastByte = bytes[len - 1];
				normed[len - 1] = lastByte & -129;
				const y = (0, utils_ts_1.bytesToNumberLE)(normed);
				const max = zip215 ? MASK : Fp.ORDER;
				(0, utils_ts_1.aInRange)("point.y", y, _0n, max);
				const y2 = modP(y * y);
				const u = modP(y2 - _1n);
				const v = modP(d * y2 - a);
				let { isValid, value: x } = uvRatio(u, v);
				if (!isValid) throw new Error("bad point: invalid y coordinate");
				const isXOdd = (x & _1n) === _1n;
				const isLastByteOdd = (lastByte & 128) !== 0;
				if (!zip215 && x === _0n && isLastByteOdd) throw new Error("bad point: x=0 and x_0=1");
				if (isLastByteOdd !== isXOdd) x = modP(-x);
				return Point.fromAffine({
					x,
					y
				});
			}
			static fromHex(bytes, zip215 = false) {
				return Point.fromBytes((0, utils_ts_1.ensureBytes)("point", bytes), zip215);
			}
			get x() {
				return this.toAffine().x;
			}
			get y() {
				return this.toAffine().y;
			}
			precompute(windowSize = 8, isLazy = true) {
				wnaf.createCache(this, windowSize);
				if (!isLazy) this.multiply(_2n);
				return this;
			}
			assertValidity() {
				assertValidMemo(this);
			}
			equals(other) {
				aextpoint(other);
				const { X: X1, Y: Y1, Z: Z1 } = this;
				const { X: X2, Y: Y2, Z: Z2 } = other;
				const X1Z2 = modP(X1 * Z2);
				const X2Z1 = modP(X2 * Z1);
				const Y1Z2 = modP(Y1 * Z2);
				const Y2Z1 = modP(Y2 * Z1);
				return X1Z2 === X2Z1 && Y1Z2 === Y2Z1;
			}
			is0() {
				return this.equals(Point.ZERO);
			}
			negate() {
				return new Point(modP(-this.X), this.Y, this.Z, modP(-this.T));
			}
			double() {
				const { a } = CURVE;
				const { X: X1, Y: Y1, Z: Z1 } = this;
				const A = modP(X1 * X1);
				const B = modP(Y1 * Y1);
				const C = modP(_2n * modP(Z1 * Z1));
				const D = modP(a * A);
				const x1y1 = X1 + Y1;
				const E = modP(modP(x1y1 * x1y1) - A - B);
				const G = D + B;
				const F = G - C;
				const H = D - B;
				const X3 = modP(E * F);
				const Y3 = modP(G * H);
				const T3 = modP(E * H);
				const Z3 = modP(F * G);
				return new Point(X3, Y3, Z3, T3);
			}
			add(other) {
				aextpoint(other);
				const { a, d } = CURVE;
				const { X: X1, Y: Y1, Z: Z1, T: T1 } = this;
				const { X: X2, Y: Y2, Z: Z2, T: T2 } = other;
				const A = modP(X1 * X2);
				const B = modP(Y1 * Y2);
				const C = modP(T1 * d * T2);
				const D = modP(Z1 * Z2);
				const E = modP((X1 + Y1) * (X2 + Y2) - A - B);
				const F = D - C;
				const G = D + C;
				const H = modP(B - a * A);
				const X3 = modP(E * F);
				const Y3 = modP(G * H);
				const T3 = modP(E * H);
				const Z3 = modP(F * G);
				return new Point(X3, Y3, Z3, T3);
			}
			subtract(other) {
				return this.add(other.negate());
			}
			multiply(scalar) {
				if (!Fn.isValidNot0(scalar)) throw new Error("invalid scalar: expected 1 <= sc < curve.n");
				const { p, f } = wnaf.cached(this, scalar, (p) => (0, curve_ts_1.normalizeZ)(Point, p));
				return (0, curve_ts_1.normalizeZ)(Point, [p, f])[0];
			}
			multiplyUnsafe(scalar, acc = Point.ZERO) {
				if (!Fn.isValid(scalar)) throw new Error("invalid scalar: expected 0 <= sc < curve.n");
				if (scalar === _0n) return Point.ZERO;
				if (this.is0() || scalar === _1n) return this;
				return wnaf.unsafe(this, scalar, (p) => (0, curve_ts_1.normalizeZ)(Point, p), acc);
			}
			isSmallOrder() {
				return this.multiplyUnsafe(cofactor).is0();
			}
			isTorsionFree() {
				return wnaf.unsafe(this, CURVE.n).is0();
			}
			toAffine(invertedZ) {
				return toAffineMemo(this, invertedZ);
			}
			clearCofactor() {
				if (cofactor === _1n) return this;
				return this.multiplyUnsafe(cofactor);
			}
			toBytes() {
				const { x, y } = this.toAffine();
				const bytes = Fp.toBytes(y);
				bytes[bytes.length - 1] |= x & _1n ? 128 : 0;
				return bytes;
			}
			toHex() {
				return (0, utils_ts_1.bytesToHex)(this.toBytes());
			}
			toString() {
				return `<Point ${this.is0() ? "ZERO" : this.toHex()}>`;
			}
			get ex() {
				return this.X;
			}
			get ey() {
				return this.Y;
			}
			get ez() {
				return this.Z;
			}
			get et() {
				return this.T;
			}
			static normalizeZ(points) {
				return (0, curve_ts_1.normalizeZ)(Point, points);
			}
			static msm(points, scalars) {
				return (0, curve_ts_1.pippenger)(Point, Fn, points, scalars);
			}
			_setWindowSize(windowSize) {
				this.precompute(windowSize);
			}
			toRawBytes() {
				return this.toBytes();
			}
		}
		Point.BASE = new Point(CURVE.Gx, CURVE.Gy, _1n, modP(CURVE.Gx * CURVE.Gy));
		Point.ZERO = new Point(_0n, _1n, _1n, _0n);
		Point.Fp = Fp;
		Point.Fn = Fn;
		const wnaf = new curve_ts_1.wNAF(Point, Fn.BITS);
		Point.BASE.precompute(8);
		return Point;
	}
	/**
	* Base class for prime-order points like Ristretto255 and Decaf448.
	* These points eliminate cofactor issues by representing equivalence classes
	* of Edwards curve points.
	*/
	var PrimeEdwardsPoint = class {
		constructor(ep) {
			this.ep = ep;
		}
		static fromBytes(_bytes) {
			(0, utils_ts_1.notImplemented)();
		}
		static fromHex(_hex) {
			(0, utils_ts_1.notImplemented)();
		}
		get x() {
			return this.toAffine().x;
		}
		get y() {
			return this.toAffine().y;
		}
		clearCofactor() {
			return this;
		}
		assertValidity() {
			this.ep.assertValidity();
		}
		toAffine(invertedZ) {
			return this.ep.toAffine(invertedZ);
		}
		toHex() {
			return (0, utils_ts_1.bytesToHex)(this.toBytes());
		}
		toString() {
			return this.toHex();
		}
		isTorsionFree() {
			return true;
		}
		isSmallOrder() {
			return false;
		}
		add(other) {
			this.assertSame(other);
			return this.init(this.ep.add(other.ep));
		}
		subtract(other) {
			this.assertSame(other);
			return this.init(this.ep.subtract(other.ep));
		}
		multiply(scalar) {
			return this.init(this.ep.multiply(scalar));
		}
		multiplyUnsafe(scalar) {
			return this.init(this.ep.multiplyUnsafe(scalar));
		}
		double() {
			return this.init(this.ep.double());
		}
		negate() {
			return this.init(this.ep.negate());
		}
		precompute(windowSize, isLazy) {
			return this.init(this.ep.precompute(windowSize, isLazy));
		}
		/** @deprecated use `toBytes` */
		toRawBytes() {
			return this.toBytes();
		}
	};
	exports.PrimeEdwardsPoint = PrimeEdwardsPoint;
	/**
	* Initializes EdDSA signatures over given Edwards curve.
	*/
	function eddsa(Point, cHash, eddsaOpts = {}) {
		if (typeof cHash !== "function") throw new Error("\"hash\" function param is required");
		(0, utils_ts_1._validateObject)(eddsaOpts, {}, {
			adjustScalarBytes: "function",
			randomBytes: "function",
			domain: "function",
			prehash: "function",
			mapToCurve: "function"
		});
		const { prehash } = eddsaOpts;
		const { BASE, Fp, Fn } = Point;
		const randomBytes = eddsaOpts.randomBytes || utils_ts_1.randomBytes;
		const adjustScalarBytes = eddsaOpts.adjustScalarBytes || ((bytes) => bytes);
		const domain = eddsaOpts.domain || ((data, ctx, phflag) => {
			(0, utils_ts_1._abool2)(phflag, "phflag");
			if (ctx.length || phflag) throw new Error("Contexts/pre-hash are not supported");
			return data;
		});
		function modN_LE(hash) {
			return Fn.create((0, utils_ts_1.bytesToNumberLE)(hash));
		}
		function getPrivateScalar(key) {
			const len = lengths.secretKey;
			key = (0, utils_ts_1.ensureBytes)("private key", key, len);
			const hashed = (0, utils_ts_1.ensureBytes)("hashed private key", cHash(key), 2 * len);
			const head = adjustScalarBytes(hashed.slice(0, len));
			return {
				head,
				prefix: hashed.slice(len, 2 * len),
				scalar: modN_LE(head)
			};
		}
		/** Convenience method that creates public key from scalar. RFC8032 5.1.5 */
		function getExtendedPublicKey(secretKey) {
			const { head, prefix, scalar } = getPrivateScalar(secretKey);
			const point = BASE.multiply(scalar);
			return {
				head,
				prefix,
				scalar,
				point,
				pointBytes: point.toBytes()
			};
		}
		/** Calculates EdDSA pub key. RFC8032 5.1.5. */
		function getPublicKey(secretKey) {
			return getExtendedPublicKey(secretKey).pointBytes;
		}
		function hashDomainToScalar(context = Uint8Array.of(), ...msgs) {
			const msg = (0, utils_ts_1.concatBytes)(...msgs);
			return modN_LE(cHash(domain(msg, (0, utils_ts_1.ensureBytes)("context", context), !!prehash)));
		}
		/** Signs message with privateKey. RFC8032 5.1.6 */
		function sign(msg, secretKey, options = {}) {
			msg = (0, utils_ts_1.ensureBytes)("message", msg);
			if (prehash) msg = prehash(msg);
			const { prefix, scalar, pointBytes } = getExtendedPublicKey(secretKey);
			const r = hashDomainToScalar(options.context, prefix, msg);
			const R = BASE.multiply(r).toBytes();
			const k = hashDomainToScalar(options.context, R, pointBytes, msg);
			const s = Fn.create(r + k * scalar);
			if (!Fn.isValid(s)) throw new Error("sign failed: invalid s");
			const rs = (0, utils_ts_1.concatBytes)(R, Fn.toBytes(s));
			return (0, utils_ts_1._abytes2)(rs, lengths.signature, "result");
		}
		const verifyOpts = { zip215: true };
		/**
		* Verifies EdDSA signature against message and public key. RFC8032 5.1.7.
		* An extended group equation is checked.
		*/
		function verify(sig, msg, publicKey, options = verifyOpts) {
			const { context, zip215 } = options;
			const len = lengths.signature;
			sig = (0, utils_ts_1.ensureBytes)("signature", sig, len);
			msg = (0, utils_ts_1.ensureBytes)("message", msg);
			publicKey = (0, utils_ts_1.ensureBytes)("publicKey", publicKey, lengths.publicKey);
			if (zip215 !== void 0) (0, utils_ts_1._abool2)(zip215, "zip215");
			if (prehash) msg = prehash(msg);
			const mid = len / 2;
			const r = sig.subarray(0, mid);
			const s = (0, utils_ts_1.bytesToNumberLE)(sig.subarray(mid, len));
			let A, R, SB;
			try {
				A = Point.fromBytes(publicKey, zip215);
				R = Point.fromBytes(r, zip215);
				SB = BASE.multiplyUnsafe(s);
			} catch (error) {
				return false;
			}
			if (!zip215 && A.isSmallOrder()) return false;
			const k = hashDomainToScalar(context, R.toBytes(), A.toBytes(), msg);
			return R.add(A.multiplyUnsafe(k)).subtract(SB).clearCofactor().is0();
		}
		const _size = Fp.BYTES;
		const lengths = {
			secretKey: _size,
			publicKey: _size,
			signature: 2 * _size,
			seed: _size
		};
		function randomSecretKey(seed = randomBytes(lengths.seed)) {
			return (0, utils_ts_1._abytes2)(seed, lengths.seed, "seed");
		}
		function keygen(seed) {
			const secretKey = utils.randomSecretKey(seed);
			return {
				secretKey,
				publicKey: getPublicKey(secretKey)
			};
		}
		function isValidSecretKey(key) {
			return (0, utils_ts_1.isBytes)(key) && key.length === Fn.BYTES;
		}
		function isValidPublicKey(key, zip215) {
			try {
				return !!Point.fromBytes(key, zip215);
			} catch (error) {
				return false;
			}
		}
		const utils = {
			getExtendedPublicKey,
			randomSecretKey,
			isValidSecretKey,
			isValidPublicKey,
			/**
			* Converts ed public key to x public key. Uses formula:
			* - ed25519:
			*   - `(u, v) = ((1+y)/(1-y), sqrt(-486664)*u/x)`
			*   - `(x, y) = (sqrt(-486664)*u/v, (u-1)/(u+1))`
			* - ed448:
			*   - `(u, v) = ((y-1)/(y+1), sqrt(156324)*u/x)`
			*   - `(x, y) = (sqrt(156324)*u/v, (1+u)/(1-u))`
			*/
			toMontgomery(publicKey) {
				const { y } = Point.fromBytes(publicKey);
				const size = lengths.publicKey;
				const is25519 = size === 32;
				if (!is25519 && size !== 57) throw new Error("only defined for 25519 and 448");
				const u = is25519 ? Fp.div(_1n + y, _1n - y) : Fp.div(y - _1n, y + _1n);
				return Fp.toBytes(u);
			},
			toMontgomerySecret(secretKey) {
				const size = lengths.secretKey;
				(0, utils_ts_1._abytes2)(secretKey, size);
				const hashed = cHash(secretKey.subarray(0, size));
				return adjustScalarBytes(hashed).subarray(0, size);
			},
			/** @deprecated */
			randomPrivateKey: randomSecretKey,
			/** @deprecated */
			precompute(windowSize = 8, point = Point.BASE) {
				return point.precompute(windowSize, false);
			}
		};
		return Object.freeze({
			keygen,
			getPublicKey,
			sign,
			verify,
			utils,
			Point,
			lengths
		});
	}
	function _eddsa_legacy_opts_to_new(c) {
		const CURVE = {
			a: c.a,
			d: c.d,
			p: c.Fp.ORDER,
			n: c.n,
			h: c.h,
			Gx: c.Gx,
			Gy: c.Gy
		};
		const curveOpts = {
			Fp: c.Fp,
			Fn: (0, modular_ts_1.Field)(CURVE.n, c.nBitLength, true),
			uvRatio: c.uvRatio
		};
		const eddsaOpts = {
			randomBytes: c.randomBytes,
			adjustScalarBytes: c.adjustScalarBytes,
			domain: c.domain,
			prehash: c.prehash,
			mapToCurve: c.mapToCurve
		};
		return {
			CURVE,
			curveOpts,
			hash: c.hash,
			eddsaOpts
		};
	}
	function _eddsa_new_output_to_legacy(c, eddsa) {
		const Point = eddsa.Point;
		return Object.assign({}, eddsa, {
			ExtendedPoint: Point,
			CURVE: c,
			nBitLength: Point.Fn.BITS,
			nByteLength: Point.Fn.BYTES
		});
	}
	function twistedEdwards(c) {
		const { CURVE, curveOpts, hash, eddsaOpts } = _eddsa_legacy_opts_to_new(c);
		return _eddsa_new_output_to_legacy(c, eddsa(edwards(CURVE, curveOpts), hash, eddsaOpts));
	}
}));
//#endregion
//#region node_modules/.pnpm/@noble+curves@1.9.7/node_modules/@noble/curves/abstract/hash-to-curve.js
var require_hash_to_curve = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports._DST_scalar = void 0;
	exports.expand_message_xmd = expand_message_xmd;
	exports.expand_message_xof = expand_message_xof;
	exports.hash_to_field = hash_to_field;
	exports.isogenyMap = isogenyMap;
	exports.createHasher = createHasher;
	const utils_ts_1 = require_utils$1();
	const modular_ts_1 = require_modular();
	const os2ip = utils_ts_1.bytesToNumberBE;
	function i2osp(value, length) {
		anum(value);
		anum(length);
		if (value < 0 || value >= 1 << 8 * length) throw new Error("invalid I2OSP input: " + value);
		const res = Array.from({ length }).fill(0);
		for (let i = length - 1; i >= 0; i--) {
			res[i] = value & 255;
			value >>>= 8;
		}
		return new Uint8Array(res);
	}
	function strxor(a, b) {
		const arr = new Uint8Array(a.length);
		for (let i = 0; i < a.length; i++) arr[i] = a[i] ^ b[i];
		return arr;
	}
	function anum(item) {
		if (!Number.isSafeInteger(item)) throw new Error("number expected");
	}
	function normDST(DST) {
		if (!(0, utils_ts_1.isBytes)(DST) && typeof DST !== "string") throw new Error("DST must be Uint8Array or string");
		return typeof DST === "string" ? (0, utils_ts_1.utf8ToBytes)(DST) : DST;
	}
	/**
	* Produces a uniformly random byte string using a cryptographic hash function H that outputs b bits.
	* [RFC 9380 5.3.1](https://www.rfc-editor.org/rfc/rfc9380#section-5.3.1).
	*/
	function expand_message_xmd(msg, DST, lenInBytes, H) {
		(0, utils_ts_1.abytes)(msg);
		anum(lenInBytes);
		DST = normDST(DST);
		if (DST.length > 255) DST = H((0, utils_ts_1.concatBytes)((0, utils_ts_1.utf8ToBytes)("H2C-OVERSIZE-DST-"), DST));
		const { outputLen: b_in_bytes, blockLen: r_in_bytes } = H;
		const ell = Math.ceil(lenInBytes / b_in_bytes);
		if (lenInBytes > 65535 || ell > 255) throw new Error("expand_message_xmd: invalid lenInBytes");
		const DST_prime = (0, utils_ts_1.concatBytes)(DST, i2osp(DST.length, 1));
		const Z_pad = i2osp(0, r_in_bytes);
		const l_i_b_str = i2osp(lenInBytes, 2);
		const b = new Array(ell);
		const b_0 = H((0, utils_ts_1.concatBytes)(Z_pad, msg, l_i_b_str, i2osp(0, 1), DST_prime));
		b[0] = H((0, utils_ts_1.concatBytes)(b_0, i2osp(1, 1), DST_prime));
		for (let i = 1; i <= ell; i++) {
			const args = [
				strxor(b_0, b[i - 1]),
				i2osp(i + 1, 1),
				DST_prime
			];
			b[i] = H((0, utils_ts_1.concatBytes)(...args));
		}
		return (0, utils_ts_1.concatBytes)(...b).slice(0, lenInBytes);
	}
	/**
	* Produces a uniformly random byte string using an extendable-output function (XOF) H.
	* 1. The collision resistance of H MUST be at least k bits.
	* 2. H MUST be an XOF that has been proved indifferentiable from
	*    a random oracle under a reasonable cryptographic assumption.
	* [RFC 9380 5.3.2](https://www.rfc-editor.org/rfc/rfc9380#section-5.3.2).
	*/
	function expand_message_xof(msg, DST, lenInBytes, k, H) {
		(0, utils_ts_1.abytes)(msg);
		anum(lenInBytes);
		DST = normDST(DST);
		if (DST.length > 255) {
			const dkLen = Math.ceil(2 * k / 8);
			DST = H.create({ dkLen }).update((0, utils_ts_1.utf8ToBytes)("H2C-OVERSIZE-DST-")).update(DST).digest();
		}
		if (lenInBytes > 65535 || DST.length > 255) throw new Error("expand_message_xof: invalid lenInBytes");
		return H.create({ dkLen: lenInBytes }).update(msg).update(i2osp(lenInBytes, 2)).update(DST).update(i2osp(DST.length, 1)).digest();
	}
	/**
	* Hashes arbitrary-length byte strings to a list of one or more elements of a finite field F.
	* [RFC 9380 5.2](https://www.rfc-editor.org/rfc/rfc9380#section-5.2).
	* @param msg a byte string containing the message to hash
	* @param count the number of elements of F to output
	* @param options `{DST: string, p: bigint, m: number, k: number, expand: 'xmd' | 'xof', hash: H}`, see above
	* @returns [u_0, ..., u_(count - 1)], a list of field elements.
	*/
	function hash_to_field(msg, count, options) {
		(0, utils_ts_1._validateObject)(options, {
			p: "bigint",
			m: "number",
			k: "number",
			hash: "function"
		});
		const { p, k, m, hash, expand, DST } = options;
		if (!(0, utils_ts_1.isHash)(options.hash)) throw new Error("expected valid hash");
		(0, utils_ts_1.abytes)(msg);
		anum(count);
		const log2p = p.toString(2).length;
		const L = Math.ceil((log2p + k) / 8);
		const len_in_bytes = count * m * L;
		let prb;
		if (expand === "xmd") prb = expand_message_xmd(msg, DST, len_in_bytes, hash);
		else if (expand === "xof") prb = expand_message_xof(msg, DST, len_in_bytes, k, hash);
		else if (expand === "_internal_pass") prb = msg;
		else throw new Error("expand must be \"xmd\" or \"xof\"");
		const u = new Array(count);
		for (let i = 0; i < count; i++) {
			const e = new Array(m);
			for (let j = 0; j < m; j++) {
				const elm_offset = L * (j + i * m);
				const tv = prb.subarray(elm_offset, elm_offset + L);
				e[j] = (0, modular_ts_1.mod)(os2ip(tv), p);
			}
			u[i] = e;
		}
		return u;
	}
	function isogenyMap(field, map) {
		const coeff = map.map((i) => Array.from(i).reverse());
		return (x, y) => {
			const [xn, xd, yn, yd] = coeff.map((val) => val.reduce((acc, i) => field.add(field.mul(acc, x), i)));
			const [xd_inv, yd_inv] = (0, modular_ts_1.FpInvertBatch)(field, [xd, yd], true);
			x = field.mul(xn, xd_inv);
			y = field.mul(y, field.mul(yn, yd_inv));
			return {
				x,
				y
			};
		};
	}
	exports._DST_scalar = (0, utils_ts_1.utf8ToBytes)("HashToScalar-");
	/** Creates hash-to-curve methods from EC Point and mapToCurve function. See {@link H2CHasher}. */
	function createHasher(Point, mapToCurve, defaults) {
		if (typeof mapToCurve !== "function") throw new Error("mapToCurve() must be defined");
		function map(num) {
			return Point.fromAffine(mapToCurve(num));
		}
		function clear(initial) {
			const P = initial.clearCofactor();
			if (P.equals(Point.ZERO)) return Point.ZERO;
			P.assertValidity();
			return P;
		}
		return {
			defaults,
			hashToCurve(msg, options) {
				const u = hash_to_field(msg, 2, Object.assign({}, defaults, options));
				const u0 = map(u[0]);
				const u1 = map(u[1]);
				return clear(u0.add(u1));
			},
			encodeToCurve(msg, options) {
				const optsDst = defaults.encodeDST ? { DST: defaults.encodeDST } : {};
				return clear(map(hash_to_field(msg, 1, Object.assign({}, defaults, optsDst, options))[0]));
			},
			/** See {@link H2CHasher} */
			mapToCurve(scalars) {
				if (!Array.isArray(scalars)) throw new Error("expected array of bigints");
				for (const i of scalars) if (typeof i !== "bigint") throw new Error("expected array of bigints");
				return clear(map(scalars));
			},
			hashToScalar(msg, options) {
				const N = Point.Fn.ORDER;
				return hash_to_field(msg, 1, Object.assign({}, defaults, {
					p: N,
					m: 1,
					DST: exports._DST_scalar
				}, options))[0][0];
			}
		};
	}
}));
//#endregion
//#region node_modules/.pnpm/@noble+curves@1.9.7/node_modules/@noble/curves/abstract/montgomery.js
var require_montgomery = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.montgomery = montgomery;
	/**
	* Montgomery curve methods. It's not really whole montgomery curve,
	* just bunch of very specific methods for X25519 / X448 from
	* [RFC 7748](https://www.rfc-editor.org/rfc/rfc7748)
	* @module
	*/
	/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */
	const utils_ts_1 = require_utils$1();
	const modular_ts_1 = require_modular();
	const _0n = BigInt(0);
	const _1n = BigInt(1);
	const _2n = BigInt(2);
	function validateOpts(curve) {
		(0, utils_ts_1._validateObject)(curve, {
			adjustScalarBytes: "function",
			powPminus2: "function"
		});
		return Object.freeze({ ...curve });
	}
	function montgomery(curveDef) {
		const { P, type, adjustScalarBytes, powPminus2, randomBytes: rand } = validateOpts(curveDef);
		const is25519 = type === "x25519";
		if (!is25519 && type !== "x448") throw new Error("invalid type");
		const randomBytes_ = rand || utils_ts_1.randomBytes;
		const montgomeryBits = is25519 ? 255 : 448;
		const fieldLen = is25519 ? 32 : 56;
		const Gu = is25519 ? BigInt(9) : BigInt(5);
		const a24 = is25519 ? BigInt(121665) : BigInt(39081);
		const minScalar = is25519 ? _2n ** BigInt(254) : _2n ** BigInt(447);
		const maxScalar = minScalar + (is25519 ? BigInt(8) * _2n ** BigInt(251) - _1n : BigInt(4) * _2n ** BigInt(445) - _1n) + _1n;
		const modP = (n) => (0, modular_ts_1.mod)(n, P);
		const GuBytes = encodeU(Gu);
		function encodeU(u) {
			return (0, utils_ts_1.numberToBytesLE)(modP(u), fieldLen);
		}
		function decodeU(u) {
			const _u = (0, utils_ts_1.ensureBytes)("u coordinate", u, fieldLen);
			if (is25519) _u[31] &= 127;
			return modP((0, utils_ts_1.bytesToNumberLE)(_u));
		}
		function decodeScalar(scalar) {
			return (0, utils_ts_1.bytesToNumberLE)(adjustScalarBytes((0, utils_ts_1.ensureBytes)("scalar", scalar, fieldLen)));
		}
		function scalarMult(scalar, u) {
			const pu = montgomeryLadder(decodeU(u), decodeScalar(scalar));
			if (pu === _0n) throw new Error("invalid private or public key received");
			return encodeU(pu);
		}
		function scalarMultBase(scalar) {
			return scalarMult(scalar, GuBytes);
		}
		function cswap(swap, x_2, x_3) {
			const dummy = modP(swap * (x_2 - x_3));
			x_2 = modP(x_2 - dummy);
			x_3 = modP(x_3 + dummy);
			return {
				x_2,
				x_3
			};
		}
		/**
		* Montgomery x-only multiplication ladder.
		* @param pointU u coordinate (x) on Montgomery Curve 25519
		* @param scalar by which the point would be multiplied
		* @returns new Point on Montgomery curve
		*/
		function montgomeryLadder(u, scalar) {
			(0, utils_ts_1.aInRange)("u", u, _0n, P);
			(0, utils_ts_1.aInRange)("scalar", scalar, minScalar, maxScalar);
			const k = scalar;
			const x_1 = u;
			let x_2 = _1n;
			let z_2 = _0n;
			let x_3 = u;
			let z_3 = _1n;
			let swap = _0n;
			for (let t = BigInt(montgomeryBits - 1); t >= _0n; t--) {
				const k_t = k >> t & _1n;
				swap ^= k_t;
				({x_2, x_3} = cswap(swap, x_2, x_3));
				({x_2: z_2, x_3: z_3} = cswap(swap, z_2, z_3));
				swap = k_t;
				const A = x_2 + z_2;
				const AA = modP(A * A);
				const B = x_2 - z_2;
				const BB = modP(B * B);
				const E = AA - BB;
				const C = x_3 + z_3;
				const D = x_3 - z_3;
				const DA = modP(D * A);
				const CB = modP(C * B);
				const dacb = DA + CB;
				const da_cb = DA - CB;
				x_3 = modP(dacb * dacb);
				z_3 = modP(x_1 * modP(da_cb * da_cb));
				x_2 = modP(AA * BB);
				z_2 = modP(E * (AA + modP(a24 * E)));
			}
			({x_2, x_3} = cswap(swap, x_2, x_3));
			({x_2: z_2, x_3: z_3} = cswap(swap, z_2, z_3));
			const z2 = powPminus2(z_2);
			return modP(x_2 * z2);
		}
		const lengths = {
			secretKey: fieldLen,
			publicKey: fieldLen,
			seed: fieldLen
		};
		const randomSecretKey = (seed = randomBytes_(fieldLen)) => {
			(0, utils_ts_1.abytes)(seed, lengths.seed);
			return seed;
		};
		function keygen(seed) {
			const secretKey = randomSecretKey(seed);
			return {
				secretKey,
				publicKey: scalarMultBase(secretKey)
			};
		}
		return {
			keygen,
			getSharedSecret: (secretKey, publicKey) => scalarMult(secretKey, publicKey),
			getPublicKey: (secretKey) => scalarMultBase(secretKey),
			scalarMult,
			scalarMultBase,
			utils: {
				randomSecretKey,
				randomPrivateKey: randomSecretKey
			},
			GuBytes: GuBytes.slice(),
			lengths
		};
	}
}));
//#endregion
//#region node_modules/.pnpm/@noble+curves@1.9.7/node_modules/@noble/curves/ed25519.js
var require_ed25519 = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.hash_to_ristretto255 = exports.hashToRistretto255 = exports.encodeToCurve = exports.hashToCurve = exports.RistrettoPoint = exports.edwardsToMontgomery = exports.ED25519_TORSION_SUBGROUP = exports.ristretto255_hasher = exports.ristretto255 = exports.ed25519_hasher = exports.x25519 = exports.ed25519ph = exports.ed25519ctx = exports.ed25519 = void 0;
	exports.edwardsToMontgomeryPub = edwardsToMontgomeryPub;
	exports.edwardsToMontgomeryPriv = edwardsToMontgomeryPriv;
	/**
	* ed25519 Twisted Edwards curve with following addons:
	* - X25519 ECDH
	* - Ristretto cofactor elimination
	* - Elligator hash-to-group / point indistinguishability
	* @module
	*/
	/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */
	const sha2_js_1 = require_sha2();
	const utils_js_1 = require_utils$2();
	const curve_ts_1 = require_curve();
	const edwards_ts_1 = require_edwards();
	const hash_to_curve_ts_1 = require_hash_to_curve();
	const modular_ts_1 = require_modular();
	const montgomery_ts_1 = require_montgomery();
	const utils_ts_1 = require_utils$1();
	const _0n = /* @__PURE__ */ BigInt(0);
	const _1n = BigInt(1);
	const _2n = BigInt(2);
	const _3n = BigInt(3);
	const _5n = BigInt(5);
	const _8n = BigInt(8);
	const ed25519_CURVE_p = BigInt("0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffed");
	const ed25519_CURVE = /* @__PURE__ */ (() => ({
		p: ed25519_CURVE_p,
		n: BigInt("0x1000000000000000000000000000000014def9dea2f79cd65812631a5cf5d3ed"),
		h: _8n,
		a: BigInt("0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffec"),
		d: BigInt("0x52036cee2b6ffe738cc740797779e89800700a4d4141d8ab75eb4dca135978a3"),
		Gx: BigInt("0x216936d3cd6e53fec0a4e231fdd6dc5c692cc7609525a7b2c9562d608f25d51a"),
		Gy: BigInt("0x6666666666666666666666666666666666666666666666666666666666666658")
	}))();
	function ed25519_pow_2_252_3(x) {
		const _10n = BigInt(10), _20n = BigInt(20), _40n = BigInt(40), _80n = BigInt(80);
		const P = ed25519_CURVE_p;
		const b2 = x * x % P * x % P;
		const b4 = (0, modular_ts_1.pow2)(b2, _2n, P) * b2 % P;
		const b5 = (0, modular_ts_1.pow2)(b4, _1n, P) * x % P;
		const b10 = (0, modular_ts_1.pow2)(b5, _5n, P) * b5 % P;
		const b20 = (0, modular_ts_1.pow2)(b10, _10n, P) * b10 % P;
		const b40 = (0, modular_ts_1.pow2)(b20, _20n, P) * b20 % P;
		const b80 = (0, modular_ts_1.pow2)(b40, _40n, P) * b40 % P;
		const b160 = (0, modular_ts_1.pow2)(b80, _80n, P) * b80 % P;
		const b240 = (0, modular_ts_1.pow2)(b160, _80n, P) * b80 % P;
		const b250 = (0, modular_ts_1.pow2)(b240, _10n, P) * b10 % P;
		return {
			pow_p_5_8: (0, modular_ts_1.pow2)(b250, _2n, P) * x % P,
			b2
		};
	}
	function adjustScalarBytes(bytes) {
		bytes[0] &= 248;
		bytes[31] &= 127;
		bytes[31] |= 64;
		return bytes;
	}
	const ED25519_SQRT_M1 = /* @__PURE__ */ BigInt("19681161376707505956807079304988542015446066515923890162744021073123829784752");
	function uvRatio(u, v) {
		const P = ed25519_CURVE_p;
		const v3 = (0, modular_ts_1.mod)(v * v * v, P);
		const pow = ed25519_pow_2_252_3(u * (0, modular_ts_1.mod)(v3 * v3 * v, P)).pow_p_5_8;
		let x = (0, modular_ts_1.mod)(u * v3 * pow, P);
		const vx2 = (0, modular_ts_1.mod)(v * x * x, P);
		const root1 = x;
		const root2 = (0, modular_ts_1.mod)(x * ED25519_SQRT_M1, P);
		const useRoot1 = vx2 === u;
		const useRoot2 = vx2 === (0, modular_ts_1.mod)(-u, P);
		const noRoot = vx2 === (0, modular_ts_1.mod)(-u * ED25519_SQRT_M1, P);
		if (useRoot1) x = root1;
		if (useRoot2 || noRoot) x = root2;
		if ((0, modular_ts_1.isNegativeLE)(x, P)) x = (0, modular_ts_1.mod)(-x, P);
		return {
			isValid: useRoot1 || useRoot2,
			value: x
		};
	}
	const Fp = /* @__PURE__ */ (() => (0, modular_ts_1.Field)(ed25519_CURVE.p, { isLE: true }))();
	const Fn = /* @__PURE__ */ (() => (0, modular_ts_1.Field)(ed25519_CURVE.n, { isLE: true }))();
	const ed25519Defaults = /* @__PURE__ */ (() => ({
		...ed25519_CURVE,
		Fp,
		hash: sha2_js_1.sha512,
		adjustScalarBytes,
		uvRatio
	}))();
	/**
	* ed25519 curve with EdDSA signatures.
	* @example
	* import { ed25519 } from '@noble/curves/ed25519';
	* const { secretKey, publicKey } = ed25519.keygen();
	* const msg = new TextEncoder().encode('hello');
	* const sig = ed25519.sign(msg, priv);
	* ed25519.verify(sig, msg, pub); // Default mode: follows ZIP215
	* ed25519.verify(sig, msg, pub, { zip215: false }); // RFC8032 / FIPS 186-5
	*/
	exports.ed25519 = (() => (0, edwards_ts_1.twistedEdwards)(ed25519Defaults))();
	function ed25519_domain(data, ctx, phflag) {
		if (ctx.length > 255) throw new Error("Context is too big");
		return (0, utils_js_1.concatBytes)((0, utils_js_1.utf8ToBytes)("SigEd25519 no Ed25519 collisions"), new Uint8Array([phflag ? 1 : 0, ctx.length]), ctx, data);
	}
	/** Context of ed25519. Uses context for domain separation. */
	exports.ed25519ctx = (() => (0, edwards_ts_1.twistedEdwards)({
		...ed25519Defaults,
		domain: ed25519_domain
	}))();
	/** Prehashed version of ed25519. Accepts already-hashed messages in sign() and verify(). */
	exports.ed25519ph = (() => (0, edwards_ts_1.twistedEdwards)(Object.assign({}, ed25519Defaults, {
		domain: ed25519_domain,
		prehash: sha2_js_1.sha512
	})))();
	/**
	* ECDH using curve25519 aka x25519.
	* @example
	* import { x25519 } from '@noble/curves/ed25519';
	* const priv = 'a546e36bf0527c9d3b16154b82465edd62144c0ac1fc5a18506a2244ba449ac4';
	* const pub = 'e6db6867583030db3594c1a424b15f7c726624ec26b3353b10a903a6d0ab1c4c';
	* x25519.getSharedSecret(priv, pub) === x25519.scalarMult(priv, pub); // aliases
	* x25519.getPublicKey(priv) === x25519.scalarMultBase(priv);
	* x25519.getPublicKey(x25519.utils.randomSecretKey());
	*/
	exports.x25519 = (() => {
		const P = Fp.ORDER;
		return (0, montgomery_ts_1.montgomery)({
			P,
			type: "x25519",
			powPminus2: (x) => {
				const { pow_p_5_8, b2 } = ed25519_pow_2_252_3(x);
				return (0, modular_ts_1.mod)((0, modular_ts_1.pow2)(pow_p_5_8, _3n, P) * b2, P);
			},
			adjustScalarBytes
		});
	})();
	const ELL2_C1 = /* @__PURE__ */ (() => (ed25519_CURVE_p + _3n) / _8n)();
	const ELL2_C2 = /* @__PURE__ */ (() => Fp.pow(_2n, ELL2_C1))();
	const ELL2_C3 = /* @__PURE__ */ (() => Fp.sqrt(Fp.neg(Fp.ONE)))();
	function map_to_curve_elligator2_curve25519(u) {
		const ELL2_C4 = (ed25519_CURVE_p - _5n) / _8n;
		const ELL2_J = BigInt(486662);
		let tv1 = Fp.sqr(u);
		tv1 = Fp.mul(tv1, _2n);
		let xd = Fp.add(tv1, Fp.ONE);
		let x1n = Fp.neg(ELL2_J);
		let tv2 = Fp.sqr(xd);
		let gxd = Fp.mul(tv2, xd);
		let gx1 = Fp.mul(tv1, ELL2_J);
		gx1 = Fp.mul(gx1, x1n);
		gx1 = Fp.add(gx1, tv2);
		gx1 = Fp.mul(gx1, x1n);
		let tv3 = Fp.sqr(gxd);
		tv2 = Fp.sqr(tv3);
		tv3 = Fp.mul(tv3, gxd);
		tv3 = Fp.mul(tv3, gx1);
		tv2 = Fp.mul(tv2, tv3);
		let y11 = Fp.pow(tv2, ELL2_C4);
		y11 = Fp.mul(y11, tv3);
		let y12 = Fp.mul(y11, ELL2_C3);
		tv2 = Fp.sqr(y11);
		tv2 = Fp.mul(tv2, gxd);
		let e1 = Fp.eql(tv2, gx1);
		let y1 = Fp.cmov(y12, y11, e1);
		let x2n = Fp.mul(x1n, tv1);
		let y21 = Fp.mul(y11, u);
		y21 = Fp.mul(y21, ELL2_C2);
		let y22 = Fp.mul(y21, ELL2_C3);
		let gx2 = Fp.mul(gx1, tv1);
		tv2 = Fp.sqr(y21);
		tv2 = Fp.mul(tv2, gxd);
		let e2 = Fp.eql(tv2, gx2);
		let y2 = Fp.cmov(y22, y21, e2);
		tv2 = Fp.sqr(y1);
		tv2 = Fp.mul(tv2, gxd);
		let e3 = Fp.eql(tv2, gx1);
		let xn = Fp.cmov(x2n, x1n, e3);
		let y = Fp.cmov(y2, y1, e3);
		let e4 = Fp.isOdd(y);
		y = Fp.cmov(y, Fp.neg(y), e3 !== e4);
		return {
			xMn: xn,
			xMd: xd,
			yMn: y,
			yMd: _1n
		};
	}
	const ELL2_C1_EDWARDS = /* @__PURE__ */ (() => (0, modular_ts_1.FpSqrtEven)(Fp, Fp.neg(BigInt(486664))))();
	function map_to_curve_elligator2_edwards25519(u) {
		const { xMn, xMd, yMn, yMd } = map_to_curve_elligator2_curve25519(u);
		let xn = Fp.mul(xMn, yMd);
		xn = Fp.mul(xn, ELL2_C1_EDWARDS);
		let xd = Fp.mul(xMd, yMn);
		let yn = Fp.sub(xMn, xMd);
		let yd = Fp.add(xMn, xMd);
		let tv1 = Fp.mul(xd, yd);
		let e = Fp.eql(tv1, Fp.ZERO);
		xn = Fp.cmov(xn, Fp.ZERO, e);
		xd = Fp.cmov(xd, Fp.ONE, e);
		yn = Fp.cmov(yn, Fp.ONE, e);
		yd = Fp.cmov(yd, Fp.ONE, e);
		const [xd_inv, yd_inv] = (0, modular_ts_1.FpInvertBatch)(Fp, [xd, yd], true);
		return {
			x: Fp.mul(xn, xd_inv),
			y: Fp.mul(yn, yd_inv)
		};
	}
	/** Hashing to ed25519 points / field. RFC 9380 methods. */
	exports.ed25519_hasher = (() => (0, hash_to_curve_ts_1.createHasher)(exports.ed25519.Point, (scalars) => map_to_curve_elligator2_edwards25519(scalars[0]), {
		DST: "edwards25519_XMD:SHA-512_ELL2_RO_",
		encodeDST: "edwards25519_XMD:SHA-512_ELL2_NU_",
		p: ed25519_CURVE_p,
		m: 1,
		k: 128,
		expand: "xmd",
		hash: sha2_js_1.sha512
	}))();
	const SQRT_M1 = ED25519_SQRT_M1;
	const SQRT_AD_MINUS_ONE = /* @__PURE__ */ BigInt("25063068953384623474111414158702152701244531502492656460079210482610430750235");
	const INVSQRT_A_MINUS_D = /* @__PURE__ */ BigInt("54469307008909316920995813868745141605393597292927456921205312896311721017578");
	const ONE_MINUS_D_SQ = /* @__PURE__ */ BigInt("1159843021668779879193775521855586647937357759715417654439879720876111806838");
	const D_MINUS_ONE_SQ = /* @__PURE__ */ BigInt("40440834346308536858101042469323190826248399146238708352240133220865137265952");
	const invertSqrt = (number) => uvRatio(_1n, number);
	const MAX_255B = /* @__PURE__ */ BigInt("0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");
	const bytes255ToNumberLE = (bytes) => exports.ed25519.Point.Fp.create((0, utils_ts_1.bytesToNumberLE)(bytes) & MAX_255B);
	/**
	* Computes Elligator map for Ristretto255.
	* Described in [RFC9380](https://www.rfc-editor.org/rfc/rfc9380#appendix-B) and on
	* the [website](https://ristretto.group/formulas/elligator.html).
	*/
	function calcElligatorRistrettoMap(r0) {
		const { d } = ed25519_CURVE;
		const P = ed25519_CURVE_p;
		const mod = (n) => Fp.create(n);
		const r = mod(SQRT_M1 * r0 * r0);
		const Ns = mod((r + _1n) * ONE_MINUS_D_SQ);
		let c = BigInt(-1);
		const D = mod((c - d * r) * mod(r + d));
		let { isValid: Ns_D_is_sq, value: s } = uvRatio(Ns, D);
		let s_ = mod(s * r0);
		if (!(0, modular_ts_1.isNegativeLE)(s_, P)) s_ = mod(-s_);
		if (!Ns_D_is_sq) s = s_;
		if (!Ns_D_is_sq) c = r;
		const Nt = mod(c * (r - _1n) * D_MINUS_ONE_SQ - D);
		const s2 = s * s;
		const W0 = mod((s + s) * D);
		const W1 = mod(Nt * SQRT_AD_MINUS_ONE);
		const W2 = mod(_1n - s2);
		const W3 = mod(_1n + s2);
		return new exports.ed25519.Point(mod(W0 * W3), mod(W2 * W1), mod(W1 * W3), mod(W0 * W2));
	}
	function ristretto255_map(bytes) {
		(0, utils_js_1.abytes)(bytes, 64);
		const R1 = calcElligatorRistrettoMap(bytes255ToNumberLE(bytes.subarray(0, 32)));
		const R2 = calcElligatorRistrettoMap(bytes255ToNumberLE(bytes.subarray(32, 64)));
		return new _RistrettoPoint(R1.add(R2));
	}
	/**
	* Wrapper over Edwards Point for ristretto255.
	*
	* Each ed25519/ExtendedPoint has 8 different equivalent points. This can be
	* a source of bugs for protocols like ring signatures. Ristretto was created to solve this.
	* Ristretto point operates in X:Y:Z:T extended coordinates like ExtendedPoint,
	* but it should work in its own namespace: do not combine those two.
	* See [RFC9496](https://www.rfc-editor.org/rfc/rfc9496).
	*/
	var _RistrettoPoint = class _RistrettoPoint extends edwards_ts_1.PrimeEdwardsPoint {
		constructor(ep) {
			super(ep);
		}
		static fromAffine(ap) {
			return new _RistrettoPoint(exports.ed25519.Point.fromAffine(ap));
		}
		assertSame(other) {
			if (!(other instanceof _RistrettoPoint)) throw new Error("RistrettoPoint expected");
		}
		init(ep) {
			return new _RistrettoPoint(ep);
		}
		/** @deprecated use `import { ristretto255_hasher } from '@noble/curves/ed25519.js';` */
		static hashToCurve(hex) {
			return ristretto255_map((0, utils_ts_1.ensureBytes)("ristrettoHash", hex, 64));
		}
		static fromBytes(bytes) {
			(0, utils_js_1.abytes)(bytes, 32);
			const { a, d } = ed25519_CURVE;
			const P = ed25519_CURVE_p;
			const mod = (n) => Fp.create(n);
			const s = bytes255ToNumberLE(bytes);
			if (!(0, utils_ts_1.equalBytes)(Fp.toBytes(s), bytes) || (0, modular_ts_1.isNegativeLE)(s, P)) throw new Error("invalid ristretto255 encoding 1");
			const s2 = mod(s * s);
			const u1 = mod(_1n + a * s2);
			const u2 = mod(_1n - a * s2);
			const u1_2 = mod(u1 * u1);
			const u2_2 = mod(u2 * u2);
			const v = mod(a * d * u1_2 - u2_2);
			const { isValid, value: I } = invertSqrt(mod(v * u2_2));
			const Dx = mod(I * u2);
			const Dy = mod(I * Dx * v);
			let x = mod((s + s) * Dx);
			if ((0, modular_ts_1.isNegativeLE)(x, P)) x = mod(-x);
			const y = mod(u1 * Dy);
			const t = mod(x * y);
			if (!isValid || (0, modular_ts_1.isNegativeLE)(t, P) || y === _0n) throw new Error("invalid ristretto255 encoding 2");
			return new _RistrettoPoint(new exports.ed25519.Point(x, y, _1n, t));
		}
		/**
		* Converts ristretto-encoded string to ristretto point.
		* Described in [RFC9496](https://www.rfc-editor.org/rfc/rfc9496#name-decode).
		* @param hex Ristretto-encoded 32 bytes. Not every 32-byte string is valid ristretto encoding
		*/
		static fromHex(hex) {
			return _RistrettoPoint.fromBytes((0, utils_ts_1.ensureBytes)("ristrettoHex", hex, 32));
		}
		static msm(points, scalars) {
			return (0, curve_ts_1.pippenger)(_RistrettoPoint, exports.ed25519.Point.Fn, points, scalars);
		}
		/**
		* Encodes ristretto point to Uint8Array.
		* Described in [RFC9496](https://www.rfc-editor.org/rfc/rfc9496#name-encode).
		*/
		toBytes() {
			let { X, Y, Z, T } = this.ep;
			const P = ed25519_CURVE_p;
			const mod = (n) => Fp.create(n);
			const u1 = mod(mod(Z + Y) * mod(Z - Y));
			const u2 = mod(X * Y);
			const u2sq = mod(u2 * u2);
			const { value: invsqrt } = invertSqrt(mod(u1 * u2sq));
			const D1 = mod(invsqrt * u1);
			const D2 = mod(invsqrt * u2);
			const zInv = mod(D1 * D2 * T);
			let D;
			if ((0, modular_ts_1.isNegativeLE)(T * zInv, P)) {
				let _x = mod(Y * SQRT_M1);
				let _y = mod(X * SQRT_M1);
				X = _x;
				Y = _y;
				D = mod(D1 * INVSQRT_A_MINUS_D);
			} else D = D2;
			if ((0, modular_ts_1.isNegativeLE)(X * zInv, P)) Y = mod(-Y);
			let s = mod((Z - Y) * D);
			if ((0, modular_ts_1.isNegativeLE)(s, P)) s = mod(-s);
			return Fp.toBytes(s);
		}
		/**
		* Compares two Ristretto points.
		* Described in [RFC9496](https://www.rfc-editor.org/rfc/rfc9496#name-equals).
		*/
		equals(other) {
			this.assertSame(other);
			const { X: X1, Y: Y1 } = this.ep;
			const { X: X2, Y: Y2 } = other.ep;
			const mod = (n) => Fp.create(n);
			const one = mod(X1 * Y2) === mod(Y1 * X2);
			const two = mod(Y1 * Y2) === mod(X1 * X2);
			return one || two;
		}
		is0() {
			return this.equals(_RistrettoPoint.ZERO);
		}
	};
	_RistrettoPoint.BASE = /* @__PURE__ */ (() => new _RistrettoPoint(exports.ed25519.Point.BASE))();
	_RistrettoPoint.ZERO = /* @__PURE__ */ (() => new _RistrettoPoint(exports.ed25519.Point.ZERO))();
	_RistrettoPoint.Fp = /* @__PURE__ */ (() => Fp)();
	_RistrettoPoint.Fn = /* @__PURE__ */ (() => Fn)();
	exports.ristretto255 = { Point: _RistrettoPoint };
	/** Hashing to ristretto255 points / field. RFC 9380 methods. */
	exports.ristretto255_hasher = {
		hashToCurve(msg, options) {
			const DST = options?.DST || "ristretto255_XMD:SHA-512_R255MAP_RO_";
			return ristretto255_map((0, hash_to_curve_ts_1.expand_message_xmd)(msg, DST, 64, sha2_js_1.sha512));
		},
		hashToScalar(msg, options = { DST: hash_to_curve_ts_1._DST_scalar }) {
			const xmd = (0, hash_to_curve_ts_1.expand_message_xmd)(msg, options.DST, 64, sha2_js_1.sha512);
			return Fn.create((0, utils_ts_1.bytesToNumberLE)(xmd));
		}
	};
	/**
	* Weird / bogus points, useful for debugging.
	* All 8 ed25519 points of 8-torsion subgroup can be generated from the point
	* T = `26e8958fc2b227b045c3f489f2ef98f0d5dfac05d3c63339b13802886d53fc05`.
	* ⟨T⟩ = { O, T, 2T, 3T, 4T, 5T, 6T, 7T }
	*/
	exports.ED25519_TORSION_SUBGROUP = [
		"0100000000000000000000000000000000000000000000000000000000000000",
		"c7176a703d4dd84fba3c0b760d10670f2a2053fa2c39ccc64ec7fd7792ac037a",
		"0000000000000000000000000000000000000000000000000000000000000080",
		"26e8958fc2b227b045c3f489f2ef98f0d5dfac05d3c63339b13802886d53fc05",
		"ecffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff7f",
		"26e8958fc2b227b045c3f489f2ef98f0d5dfac05d3c63339b13802886d53fc85",
		"0000000000000000000000000000000000000000000000000000000000000000",
		"c7176a703d4dd84fba3c0b760d10670f2a2053fa2c39ccc64ec7fd7792ac03fa"
	];
	/** @deprecated use `ed25519.utils.toMontgomery` */
	function edwardsToMontgomeryPub(edwardsPub) {
		return exports.ed25519.utils.toMontgomery((0, utils_ts_1.ensureBytes)("pub", edwardsPub));
	}
	/** @deprecated use `ed25519.utils.toMontgomery` */
	exports.edwardsToMontgomery = edwardsToMontgomeryPub;
	/** @deprecated use `ed25519.utils.toMontgomerySecret` */
	function edwardsToMontgomeryPriv(edwardsPriv) {
		return exports.ed25519.utils.toMontgomerySecret((0, utils_ts_1.ensureBytes)("pub", edwardsPriv));
	}
	/** @deprecated use `ristretto255.Point` */
	exports.RistrettoPoint = _RistrettoPoint;
	/** @deprecated use `import { ed25519_hasher } from '@noble/curves/ed25519.js';` */
	exports.hashToCurve = (() => exports.ed25519_hasher.hashToCurve)();
	/** @deprecated use `import { ed25519_hasher } from '@noble/curves/ed25519.js';` */
	exports.encodeToCurve = (() => exports.ed25519_hasher.encodeToCurve)();
	/** @deprecated use `import { ristretto255_hasher } from '@noble/curves/ed25519.js';` */
	exports.hashToRistretto255 = (() => exports.ristretto255_hasher.hashToCurve)();
	/** @deprecated use `import { ristretto255_hasher } from '@noble/curves/ed25519.js';` */
	exports.hash_to_ristretto255 = (() => exports.ristretto255_hasher.hashToCurve)();
}));
//#endregion
//#region node_modules/.pnpm/@noble+hashes@1.8.0/node_modules/@noble/hashes/hmac.js
var require_hmac = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.hmac = exports.HMAC = void 0;
	/**
	* HMAC: RFC2104 message authentication code.
	* @module
	*/
	const utils_ts_1 = require_utils$2();
	var HMAC = class extends utils_ts_1.Hash {
		constructor(hash, _key) {
			super();
			this.finished = false;
			this.destroyed = false;
			(0, utils_ts_1.ahash)(hash);
			const key = (0, utils_ts_1.toBytes)(_key);
			this.iHash = hash.create();
			if (typeof this.iHash.update !== "function") throw new Error("Expected instance of class which extends utils.Hash");
			this.blockLen = this.iHash.blockLen;
			this.outputLen = this.iHash.outputLen;
			const blockLen = this.blockLen;
			const pad = new Uint8Array(blockLen);
			pad.set(key.length > blockLen ? hash.create().update(key).digest() : key);
			for (let i = 0; i < pad.length; i++) pad[i] ^= 54;
			this.iHash.update(pad);
			this.oHash = hash.create();
			for (let i = 0; i < pad.length; i++) pad[i] ^= 106;
			this.oHash.update(pad);
			(0, utils_ts_1.clean)(pad);
		}
		update(buf) {
			(0, utils_ts_1.aexists)(this);
			this.iHash.update(buf);
			return this;
		}
		digestInto(out) {
			(0, utils_ts_1.aexists)(this);
			(0, utils_ts_1.abytes)(out, this.outputLen);
			this.finished = true;
			this.iHash.digestInto(out);
			this.oHash.update(out);
			this.oHash.digestInto(out);
			this.destroy();
		}
		digest() {
			const out = new Uint8Array(this.oHash.outputLen);
			this.digestInto(out);
			return out;
		}
		_cloneInto(to) {
			to || (to = Object.create(Object.getPrototypeOf(this), {}));
			const { oHash, iHash, finished, destroyed, blockLen, outputLen } = this;
			to = to;
			to.finished = finished;
			to.destroyed = destroyed;
			to.blockLen = blockLen;
			to.outputLen = outputLen;
			to.oHash = oHash._cloneInto(to.oHash);
			to.iHash = iHash._cloneInto(to.iHash);
			return to;
		}
		clone() {
			return this._cloneInto();
		}
		destroy() {
			this.destroyed = true;
			this.oHash.destroy();
			this.iHash.destroy();
		}
	};
	exports.HMAC = HMAC;
	/**
	* HMAC: RFC2104 message authentication code.
	* @param hash - function that would be used e.g. sha256
	* @param key - message key
	* @param message - message data
	* @example
	* import { hmac } from '@noble/hashes/hmac';
	* import { sha256 } from '@noble/hashes/sha2';
	* const mac1 = hmac(sha256, 'key', 'message');
	*/
	const hmac = (hash, key, message) => new HMAC(hash, key).update(message).digest();
	exports.hmac = hmac;
	exports.hmac.create = (hash, key) => new HMAC(hash, key);
}));
//#endregion
//#region node_modules/.pnpm/@noble+curves@1.9.7/node_modules/@noble/curves/abstract/weierstrass.js
var require_weierstrass = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.DER = exports.DERErr = void 0;
	exports._splitEndoScalar = _splitEndoScalar;
	exports._normFnElement = _normFnElement;
	exports.weierstrassN = weierstrassN;
	exports.SWUFpSqrtRatio = SWUFpSqrtRatio;
	exports.mapToCurveSimpleSWU = mapToCurveSimpleSWU;
	exports.ecdh = ecdh;
	exports.ecdsa = ecdsa;
	exports.weierstrassPoints = weierstrassPoints;
	exports._legacyHelperEquat = _legacyHelperEquat;
	exports.weierstrass = weierstrass;
	/**
	* Short Weierstrass curve methods. The formula is: y² = x³ + ax + b.
	*
	* ### Design rationale for types
	*
	* * Interaction between classes from different curves should fail:
	*   `k256.Point.BASE.add(p256.Point.BASE)`
	* * For this purpose we want to use `instanceof` operator, which is fast and works during runtime
	* * Different calls of `curve()` would return different classes -
	*   `curve(params) !== curve(params)`: if somebody decided to monkey-patch their curve,
	*   it won't affect others
	*
	* TypeScript can't infer types for classes created inside a function. Classes is one instance
	* of nominative types in TypeScript and interfaces only check for shape, so it's hard to create
	* unique type for every function call.
	*
	* We can use generic types via some param, like curve opts, but that would:
	*     1. Enable interaction between `curve(params)` and `curve(params)` (curves of same params)
	*     which is hard to debug.
	*     2. Params can be generic and we can't enforce them to be constant value:
	*     if somebody creates curve from non-constant params,
	*     it would be allowed to interact with other curves with non-constant params
	*
	* @todo https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-7.html#unique-symbol
	* @module
	*/
	/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */
	const hmac_js_1 = require_hmac();
	const utils_1 = require_utils$2();
	const utils_ts_1 = require_utils$1();
	const curve_ts_1 = require_curve();
	const modular_ts_1 = require_modular();
	const divNearest = (num, den) => (num + (num >= 0 ? den : -den) / _2n) / den;
	/**
	* Splits scalar for GLV endomorphism.
	*/
	function _splitEndoScalar(k, basis, n) {
		const [[a1, b1], [a2, b2]] = basis;
		const c1 = divNearest(b2 * k, n);
		const c2 = divNearest(-b1 * k, n);
		let k1 = k - c1 * a1 - c2 * a2;
		let k2 = -c1 * b1 - c2 * b2;
		const k1neg = k1 < _0n;
		const k2neg = k2 < _0n;
		if (k1neg) k1 = -k1;
		if (k2neg) k2 = -k2;
		const MAX_NUM = (0, utils_ts_1.bitMask)(Math.ceil((0, utils_ts_1.bitLen)(n) / 2)) + _1n;
		if (k1 < _0n || k1 >= MAX_NUM || k2 < _0n || k2 >= MAX_NUM) throw new Error("splitScalar (endomorphism): failed, k=" + k);
		return {
			k1neg,
			k1,
			k2neg,
			k2
		};
	}
	function validateSigFormat(format) {
		if (![
			"compact",
			"recovered",
			"der"
		].includes(format)) throw new Error("Signature format must be \"compact\", \"recovered\", or \"der\"");
		return format;
	}
	function validateSigOpts(opts, def) {
		const optsn = {};
		for (let optName of Object.keys(def)) optsn[optName] = opts[optName] === void 0 ? def[optName] : opts[optName];
		(0, utils_ts_1._abool2)(optsn.lowS, "lowS");
		(0, utils_ts_1._abool2)(optsn.prehash, "prehash");
		if (optsn.format !== void 0) validateSigFormat(optsn.format);
		return optsn;
	}
	var DERErr = class extends Error {
		constructor(m = "") {
			super(m);
		}
	};
	exports.DERErr = DERErr;
	/**
	* ASN.1 DER encoding utilities. ASN is very complex & fragile. Format:
	*
	*     [0x30 (SEQUENCE), bytelength, 0x02 (INTEGER), intLength, R, 0x02 (INTEGER), intLength, S]
	*
	* Docs: https://letsencrypt.org/docs/a-warm-welcome-to-asn1-and-der/, https://luca.ntop.org/Teaching/Appunti/asn1.html
	*/
	exports.DER = {
		Err: DERErr,
		_tlv: {
			encode: (tag, data) => {
				const { Err: E } = exports.DER;
				if (tag < 0 || tag > 256) throw new E("tlv.encode: wrong tag");
				if (data.length & 1) throw new E("tlv.encode: unpadded data");
				const dataLen = data.length / 2;
				const len = (0, utils_ts_1.numberToHexUnpadded)(dataLen);
				if (len.length / 2 & 128) throw new E("tlv.encode: long form length too big");
				const lenLen = dataLen > 127 ? (0, utils_ts_1.numberToHexUnpadded)(len.length / 2 | 128) : "";
				return (0, utils_ts_1.numberToHexUnpadded)(tag) + lenLen + len + data;
			},
			decode(tag, data) {
				const { Err: E } = exports.DER;
				let pos = 0;
				if (tag < 0 || tag > 256) throw new E("tlv.encode: wrong tag");
				if (data.length < 2 || data[pos++] !== tag) throw new E("tlv.decode: wrong tlv");
				const first = data[pos++];
				const isLong = !!(first & 128);
				let length = 0;
				if (!isLong) length = first;
				else {
					const lenLen = first & 127;
					if (!lenLen) throw new E("tlv.decode(long): indefinite length not supported");
					if (lenLen > 4) throw new E("tlv.decode(long): byte length is too big");
					const lengthBytes = data.subarray(pos, pos + lenLen);
					if (lengthBytes.length !== lenLen) throw new E("tlv.decode: length bytes not complete");
					if (lengthBytes[0] === 0) throw new E("tlv.decode(long): zero leftmost byte");
					for (const b of lengthBytes) length = length << 8 | b;
					pos += lenLen;
					if (length < 128) throw new E("tlv.decode(long): not minimal encoding");
				}
				const v = data.subarray(pos, pos + length);
				if (v.length !== length) throw new E("tlv.decode: wrong value length");
				return {
					v,
					l: data.subarray(pos + length)
				};
			}
		},
		_int: {
			encode(num) {
				const { Err: E } = exports.DER;
				if (num < _0n) throw new E("integer: negative integers are not allowed");
				let hex = (0, utils_ts_1.numberToHexUnpadded)(num);
				if (Number.parseInt(hex[0], 16) & 8) hex = "00" + hex;
				if (hex.length & 1) throw new E("unexpected DER parsing assertion: unpadded hex");
				return hex;
			},
			decode(data) {
				const { Err: E } = exports.DER;
				if (data[0] & 128) throw new E("invalid signature integer: negative");
				if (data[0] === 0 && !(data[1] & 128)) throw new E("invalid signature integer: unnecessary leading zero");
				return (0, utils_ts_1.bytesToNumberBE)(data);
			}
		},
		toSig(hex) {
			const { Err: E, _int: int, _tlv: tlv } = exports.DER;
			const data = (0, utils_ts_1.ensureBytes)("signature", hex);
			const { v: seqBytes, l: seqLeftBytes } = tlv.decode(48, data);
			if (seqLeftBytes.length) throw new E("invalid signature: left bytes after parsing");
			const { v: rBytes, l: rLeftBytes } = tlv.decode(2, seqBytes);
			const { v: sBytes, l: sLeftBytes } = tlv.decode(2, rLeftBytes);
			if (sLeftBytes.length) throw new E("invalid signature: left bytes after parsing");
			return {
				r: int.decode(rBytes),
				s: int.decode(sBytes)
			};
		},
		hexFromSig(sig) {
			const { _tlv: tlv, _int: int } = exports.DER;
			const seq = tlv.encode(2, int.encode(sig.r)) + tlv.encode(2, int.encode(sig.s));
			return tlv.encode(48, seq);
		}
	};
	const _0n = BigInt(0);
	const _1n = BigInt(1);
	const _2n = BigInt(2);
	const _3n = BigInt(3);
	const _4n = BigInt(4);
	function _normFnElement(Fn, key) {
		const { BYTES: expected } = Fn;
		let num;
		if (typeof key === "bigint") num = key;
		else {
			let bytes = (0, utils_ts_1.ensureBytes)("private key", key);
			try {
				num = Fn.fromBytes(bytes);
			} catch (error) {
				throw new Error(`invalid private key: expected ui8a of size ${expected}, got ${typeof key}`);
			}
		}
		if (!Fn.isValidNot0(num)) throw new Error("invalid private key: out of range [1..N-1]");
		return num;
	}
	/**
	* Creates weierstrass Point constructor, based on specified curve options.
	*
	* @example
	```js
	const opts = {
	p: BigInt('0xffffffff00000001000000000000000000000000ffffffffffffffffffffffff'),
	n: BigInt('0xffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632551'),
	h: BigInt(1),
	a: BigInt('0xffffffff00000001000000000000000000000000fffffffffffffffffffffffc'),
	b: BigInt('0x5ac635d8aa3a93e7b3ebbd55769886bc651d06b0cc53b0f63bce3c3e27d2604b'),
	Gx: BigInt('0x6b17d1f2e12c4247f8bce6e563a440f277037d812deb33a0f4a13945d898c296'),
	Gy: BigInt('0x4fe342e2fe1a7f9b8ee7eb4a7c0f9e162bce33576b315ececbb6406837bf51f5'),
	};
	const p256_Point = weierstrass(opts);
	```
	*/
	function weierstrassN(params, extraOpts = {}) {
		const validated = (0, curve_ts_1._createCurveFields)("weierstrass", params, extraOpts);
		const { Fp, Fn } = validated;
		let CURVE = validated.CURVE;
		const { h: cofactor, n: CURVE_ORDER } = CURVE;
		(0, utils_ts_1._validateObject)(extraOpts, {}, {
			allowInfinityPoint: "boolean",
			clearCofactor: "function",
			isTorsionFree: "function",
			fromBytes: "function",
			toBytes: "function",
			endo: "object",
			wrapPrivateKey: "boolean"
		});
		const { endo } = extraOpts;
		if (endo) {
			if (!Fp.is0(CURVE.a) || typeof endo.beta !== "bigint" || !Array.isArray(endo.basises)) throw new Error("invalid endo: expected \"beta\": bigint and \"basises\": array");
		}
		const lengths = getWLengths(Fp, Fn);
		function assertCompressionIsSupported() {
			if (!Fp.isOdd) throw new Error("compression is not supported: Field does not have .isOdd()");
		}
		function pointToBytes(_c, point, isCompressed) {
			const { x, y } = point.toAffine();
			const bx = Fp.toBytes(x);
			(0, utils_ts_1._abool2)(isCompressed, "isCompressed");
			if (isCompressed) {
				assertCompressionIsSupported();
				const hasEvenY = !Fp.isOdd(y);
				return (0, utils_ts_1.concatBytes)(pprefix(hasEvenY), bx);
			} else return (0, utils_ts_1.concatBytes)(Uint8Array.of(4), bx, Fp.toBytes(y));
		}
		function pointFromBytes(bytes) {
			(0, utils_ts_1._abytes2)(bytes, void 0, "Point");
			const { publicKey: comp, publicKeyUncompressed: uncomp } = lengths;
			const length = bytes.length;
			const head = bytes[0];
			const tail = bytes.subarray(1);
			if (length === comp && (head === 2 || head === 3)) {
				const x = Fp.fromBytes(tail);
				if (!Fp.isValid(x)) throw new Error("bad point: is not on curve, wrong x");
				const y2 = weierstrassEquation(x);
				let y;
				try {
					y = Fp.sqrt(y2);
				} catch (sqrtError) {
					const err = sqrtError instanceof Error ? ": " + sqrtError.message : "";
					throw new Error("bad point: is not on curve, sqrt error" + err);
				}
				assertCompressionIsSupported();
				const isYOdd = Fp.isOdd(y);
				if ((head & 1) === 1 !== isYOdd) y = Fp.neg(y);
				return {
					x,
					y
				};
			} else if (length === uncomp && head === 4) {
				const L = Fp.BYTES;
				const x = Fp.fromBytes(tail.subarray(0, L));
				const y = Fp.fromBytes(tail.subarray(L, L * 2));
				if (!isValidXY(x, y)) throw new Error("bad point: is not on curve");
				return {
					x,
					y
				};
			} else throw new Error(`bad point: got length ${length}, expected compressed=${comp} or uncompressed=${uncomp}`);
		}
		const encodePoint = extraOpts.toBytes || pointToBytes;
		const decodePoint = extraOpts.fromBytes || pointFromBytes;
		function weierstrassEquation(x) {
			const x2 = Fp.sqr(x);
			const x3 = Fp.mul(x2, x);
			return Fp.add(Fp.add(x3, Fp.mul(x, CURVE.a)), CURVE.b);
		}
		/** Checks whether equation holds for given x, y: y² == x³ + ax + b */
		function isValidXY(x, y) {
			const left = Fp.sqr(y);
			const right = weierstrassEquation(x);
			return Fp.eql(left, right);
		}
		if (!isValidXY(CURVE.Gx, CURVE.Gy)) throw new Error("bad curve params: generator point");
		const _4a3 = Fp.mul(Fp.pow(CURVE.a, _3n), _4n);
		const _27b2 = Fp.mul(Fp.sqr(CURVE.b), BigInt(27));
		if (Fp.is0(Fp.add(_4a3, _27b2))) throw new Error("bad curve params: a or b");
		/** Asserts coordinate is valid: 0 <= n < Fp.ORDER. */
		function acoord(title, n, banZero = false) {
			if (!Fp.isValid(n) || banZero && Fp.is0(n)) throw new Error(`bad point coordinate ${title}`);
			return n;
		}
		function aprjpoint(other) {
			if (!(other instanceof Point)) throw new Error("ProjectivePoint expected");
		}
		function splitEndoScalarN(k) {
			if (!endo || !endo.basises) throw new Error("no endo");
			return _splitEndoScalar(k, endo.basises, Fn.ORDER);
		}
		const toAffineMemo = (0, utils_ts_1.memoized)((p, iz) => {
			const { X, Y, Z } = p;
			if (Fp.eql(Z, Fp.ONE)) return {
				x: X,
				y: Y
			};
			const is0 = p.is0();
			if (iz == null) iz = is0 ? Fp.ONE : Fp.inv(Z);
			const x = Fp.mul(X, iz);
			const y = Fp.mul(Y, iz);
			const zz = Fp.mul(Z, iz);
			if (is0) return {
				x: Fp.ZERO,
				y: Fp.ZERO
			};
			if (!Fp.eql(zz, Fp.ONE)) throw new Error("invZ was invalid");
			return {
				x,
				y
			};
		});
		const assertValidMemo = (0, utils_ts_1.memoized)((p) => {
			if (p.is0()) {
				if (extraOpts.allowInfinityPoint && !Fp.is0(p.Y)) return;
				throw new Error("bad point: ZERO");
			}
			const { x, y } = p.toAffine();
			if (!Fp.isValid(x) || !Fp.isValid(y)) throw new Error("bad point: x or y not field elements");
			if (!isValidXY(x, y)) throw new Error("bad point: equation left != right");
			if (!p.isTorsionFree()) throw new Error("bad point: not in prime-order subgroup");
			return true;
		});
		function finishEndo(endoBeta, k1p, k2p, k1neg, k2neg) {
			k2p = new Point(Fp.mul(k2p.X, endoBeta), k2p.Y, k2p.Z);
			k1p = (0, curve_ts_1.negateCt)(k1neg, k1p);
			k2p = (0, curve_ts_1.negateCt)(k2neg, k2p);
			return k1p.add(k2p);
		}
		/**
		* Projective Point works in 3d / projective (homogeneous) coordinates:(X, Y, Z) ∋ (x=X/Z, y=Y/Z).
		* Default Point works in 2d / affine coordinates: (x, y).
		* We're doing calculations in projective, because its operations don't require costly inversion.
		*/
		class Point {
			/** Does NOT validate if the point is valid. Use `.assertValidity()`. */
			constructor(X, Y, Z) {
				this.X = acoord("x", X);
				this.Y = acoord("y", Y, true);
				this.Z = acoord("z", Z);
				Object.freeze(this);
			}
			static CURVE() {
				return CURVE;
			}
			/** Does NOT validate if the point is valid. Use `.assertValidity()`. */
			static fromAffine(p) {
				const { x, y } = p || {};
				if (!p || !Fp.isValid(x) || !Fp.isValid(y)) throw new Error("invalid affine point");
				if (p instanceof Point) throw new Error("projective point not allowed");
				if (Fp.is0(x) && Fp.is0(y)) return Point.ZERO;
				return new Point(x, y, Fp.ONE);
			}
			static fromBytes(bytes) {
				const P = Point.fromAffine(decodePoint((0, utils_ts_1._abytes2)(bytes, void 0, "point")));
				P.assertValidity();
				return P;
			}
			static fromHex(hex) {
				return Point.fromBytes((0, utils_ts_1.ensureBytes)("pointHex", hex));
			}
			get x() {
				return this.toAffine().x;
			}
			get y() {
				return this.toAffine().y;
			}
			/**
			*
			* @param windowSize
			* @param isLazy true will defer table computation until the first multiplication
			* @returns
			*/
			precompute(windowSize = 8, isLazy = true) {
				wnaf.createCache(this, windowSize);
				if (!isLazy) this.multiply(_3n);
				return this;
			}
			/** A point on curve is valid if it conforms to equation. */
			assertValidity() {
				assertValidMemo(this);
			}
			hasEvenY() {
				const { y } = this.toAffine();
				if (!Fp.isOdd) throw new Error("Field doesn't support isOdd");
				return !Fp.isOdd(y);
			}
			/** Compare one point to another. */
			equals(other) {
				aprjpoint(other);
				const { X: X1, Y: Y1, Z: Z1 } = this;
				const { X: X2, Y: Y2, Z: Z2 } = other;
				const U1 = Fp.eql(Fp.mul(X1, Z2), Fp.mul(X2, Z1));
				const U2 = Fp.eql(Fp.mul(Y1, Z2), Fp.mul(Y2, Z1));
				return U1 && U2;
			}
			/** Flips point to one corresponding to (x, -y) in Affine coordinates. */
			negate() {
				return new Point(this.X, Fp.neg(this.Y), this.Z);
			}
			double() {
				const { a, b } = CURVE;
				const b3 = Fp.mul(b, _3n);
				const { X: X1, Y: Y1, Z: Z1 } = this;
				let X3 = Fp.ZERO, Y3 = Fp.ZERO, Z3 = Fp.ZERO;
				let t0 = Fp.mul(X1, X1);
				let t1 = Fp.mul(Y1, Y1);
				let t2 = Fp.mul(Z1, Z1);
				let t3 = Fp.mul(X1, Y1);
				t3 = Fp.add(t3, t3);
				Z3 = Fp.mul(X1, Z1);
				Z3 = Fp.add(Z3, Z3);
				X3 = Fp.mul(a, Z3);
				Y3 = Fp.mul(b3, t2);
				Y3 = Fp.add(X3, Y3);
				X3 = Fp.sub(t1, Y3);
				Y3 = Fp.add(t1, Y3);
				Y3 = Fp.mul(X3, Y3);
				X3 = Fp.mul(t3, X3);
				Z3 = Fp.mul(b3, Z3);
				t2 = Fp.mul(a, t2);
				t3 = Fp.sub(t0, t2);
				t3 = Fp.mul(a, t3);
				t3 = Fp.add(t3, Z3);
				Z3 = Fp.add(t0, t0);
				t0 = Fp.add(Z3, t0);
				t0 = Fp.add(t0, t2);
				t0 = Fp.mul(t0, t3);
				Y3 = Fp.add(Y3, t0);
				t2 = Fp.mul(Y1, Z1);
				t2 = Fp.add(t2, t2);
				t0 = Fp.mul(t2, t3);
				X3 = Fp.sub(X3, t0);
				Z3 = Fp.mul(t2, t1);
				Z3 = Fp.add(Z3, Z3);
				Z3 = Fp.add(Z3, Z3);
				return new Point(X3, Y3, Z3);
			}
			add(other) {
				aprjpoint(other);
				const { X: X1, Y: Y1, Z: Z1 } = this;
				const { X: X2, Y: Y2, Z: Z2 } = other;
				let X3 = Fp.ZERO, Y3 = Fp.ZERO, Z3 = Fp.ZERO;
				const a = CURVE.a;
				const b3 = Fp.mul(CURVE.b, _3n);
				let t0 = Fp.mul(X1, X2);
				let t1 = Fp.mul(Y1, Y2);
				let t2 = Fp.mul(Z1, Z2);
				let t3 = Fp.add(X1, Y1);
				let t4 = Fp.add(X2, Y2);
				t3 = Fp.mul(t3, t4);
				t4 = Fp.add(t0, t1);
				t3 = Fp.sub(t3, t4);
				t4 = Fp.add(X1, Z1);
				let t5 = Fp.add(X2, Z2);
				t4 = Fp.mul(t4, t5);
				t5 = Fp.add(t0, t2);
				t4 = Fp.sub(t4, t5);
				t5 = Fp.add(Y1, Z1);
				X3 = Fp.add(Y2, Z2);
				t5 = Fp.mul(t5, X3);
				X3 = Fp.add(t1, t2);
				t5 = Fp.sub(t5, X3);
				Z3 = Fp.mul(a, t4);
				X3 = Fp.mul(b3, t2);
				Z3 = Fp.add(X3, Z3);
				X3 = Fp.sub(t1, Z3);
				Z3 = Fp.add(t1, Z3);
				Y3 = Fp.mul(X3, Z3);
				t1 = Fp.add(t0, t0);
				t1 = Fp.add(t1, t0);
				t2 = Fp.mul(a, t2);
				t4 = Fp.mul(b3, t4);
				t1 = Fp.add(t1, t2);
				t2 = Fp.sub(t0, t2);
				t2 = Fp.mul(a, t2);
				t4 = Fp.add(t4, t2);
				t0 = Fp.mul(t1, t4);
				Y3 = Fp.add(Y3, t0);
				t0 = Fp.mul(t5, t4);
				X3 = Fp.mul(t3, X3);
				X3 = Fp.sub(X3, t0);
				t0 = Fp.mul(t3, t1);
				Z3 = Fp.mul(t5, Z3);
				Z3 = Fp.add(Z3, t0);
				return new Point(X3, Y3, Z3);
			}
			subtract(other) {
				return this.add(other.negate());
			}
			is0() {
				return this.equals(Point.ZERO);
			}
			/**
			* Constant time multiplication.
			* Uses wNAF method. Windowed method may be 10% faster,
			* but takes 2x longer to generate and consumes 2x memory.
			* Uses precomputes when available.
			* Uses endomorphism for Koblitz curves.
			* @param scalar by which the point would be multiplied
			* @returns New point
			*/
			multiply(scalar) {
				const { endo } = extraOpts;
				if (!Fn.isValidNot0(scalar)) throw new Error("invalid scalar: out of range");
				let point, fake;
				const mul = (n) => wnaf.cached(this, n, (p) => (0, curve_ts_1.normalizeZ)(Point, p));
				/** See docs for {@link EndomorphismOpts} */
				if (endo) {
					const { k1neg, k1, k2neg, k2 } = splitEndoScalarN(scalar);
					const { p: k1p, f: k1f } = mul(k1);
					const { p: k2p, f: k2f } = mul(k2);
					fake = k1f.add(k2f);
					point = finishEndo(endo.beta, k1p, k2p, k1neg, k2neg);
				} else {
					const { p, f } = mul(scalar);
					point = p;
					fake = f;
				}
				return (0, curve_ts_1.normalizeZ)(Point, [point, fake])[0];
			}
			/**
			* Non-constant-time multiplication. Uses double-and-add algorithm.
			* It's faster, but should only be used when you don't care about
			* an exposed secret key e.g. sig verification, which works over *public* keys.
			*/
			multiplyUnsafe(sc) {
				const { endo } = extraOpts;
				const p = this;
				if (!Fn.isValid(sc)) throw new Error("invalid scalar: out of range");
				if (sc === _0n || p.is0()) return Point.ZERO;
				if (sc === _1n) return p;
				if (wnaf.hasCache(this)) return this.multiply(sc);
				if (endo) {
					const { k1neg, k1, k2neg, k2 } = splitEndoScalarN(sc);
					const { p1, p2 } = (0, curve_ts_1.mulEndoUnsafe)(Point, p, k1, k2);
					return finishEndo(endo.beta, p1, p2, k1neg, k2neg);
				} else return wnaf.unsafe(p, sc);
			}
			multiplyAndAddUnsafe(Q, a, b) {
				const sum = this.multiplyUnsafe(a).add(Q.multiplyUnsafe(b));
				return sum.is0() ? void 0 : sum;
			}
			/**
			* Converts Projective point to affine (x, y) coordinates.
			* @param invertedZ Z^-1 (inverted zero) - optional, precomputation is useful for invertBatch
			*/
			toAffine(invertedZ) {
				return toAffineMemo(this, invertedZ);
			}
			/**
			* Checks whether Point is free of torsion elements (is in prime subgroup).
			* Always torsion-free for cofactor=1 curves.
			*/
			isTorsionFree() {
				const { isTorsionFree } = extraOpts;
				if (cofactor === _1n) return true;
				if (isTorsionFree) return isTorsionFree(Point, this);
				return wnaf.unsafe(this, CURVE_ORDER).is0();
			}
			clearCofactor() {
				const { clearCofactor } = extraOpts;
				if (cofactor === _1n) return this;
				if (clearCofactor) return clearCofactor(Point, this);
				return this.multiplyUnsafe(cofactor);
			}
			isSmallOrder() {
				return this.multiplyUnsafe(cofactor).is0();
			}
			toBytes(isCompressed = true) {
				(0, utils_ts_1._abool2)(isCompressed, "isCompressed");
				this.assertValidity();
				return encodePoint(Point, this, isCompressed);
			}
			toHex(isCompressed = true) {
				return (0, utils_ts_1.bytesToHex)(this.toBytes(isCompressed));
			}
			toString() {
				return `<Point ${this.is0() ? "ZERO" : this.toHex()}>`;
			}
			get px() {
				return this.X;
			}
			get py() {
				return this.X;
			}
			get pz() {
				return this.Z;
			}
			toRawBytes(isCompressed = true) {
				return this.toBytes(isCompressed);
			}
			_setWindowSize(windowSize) {
				this.precompute(windowSize);
			}
			static normalizeZ(points) {
				return (0, curve_ts_1.normalizeZ)(Point, points);
			}
			static msm(points, scalars) {
				return (0, curve_ts_1.pippenger)(Point, Fn, points, scalars);
			}
			static fromPrivateKey(privateKey) {
				return Point.BASE.multiply(_normFnElement(Fn, privateKey));
			}
		}
		Point.BASE = new Point(CURVE.Gx, CURVE.Gy, Fp.ONE);
		Point.ZERO = new Point(Fp.ZERO, Fp.ONE, Fp.ZERO);
		Point.Fp = Fp;
		Point.Fn = Fn;
		const bits = Fn.BITS;
		const wnaf = new curve_ts_1.wNAF(Point, extraOpts.endo ? Math.ceil(bits / 2) : bits);
		Point.BASE.precompute(8);
		return Point;
	}
	function pprefix(hasEvenY) {
		return Uint8Array.of(hasEvenY ? 2 : 3);
	}
	/**
	* Implementation of the Shallue and van de Woestijne method for any weierstrass curve.
	* TODO: check if there is a way to merge this with uvRatio in Edwards; move to modular.
	* b = True and y = sqrt(u / v) if (u / v) is square in F, and
	* b = False and y = sqrt(Z * (u / v)) otherwise.
	* @param Fp
	* @param Z
	* @returns
	*/
	function SWUFpSqrtRatio(Fp, Z) {
		const q = Fp.ORDER;
		let l = _0n;
		for (let o = q - _1n; o % _2n === _0n; o /= _2n) l += _1n;
		const c1 = l;
		const _2n_pow_c1_1 = _2n << c1 - _1n - _1n;
		const _2n_pow_c1 = _2n_pow_c1_1 * _2n;
		const c2 = (q - _1n) / _2n_pow_c1;
		const c3 = (c2 - _1n) / _2n;
		const c4 = _2n_pow_c1 - _1n;
		const c5 = _2n_pow_c1_1;
		const c6 = Fp.pow(Z, c2);
		const c7 = Fp.pow(Z, (c2 + _1n) / _2n);
		let sqrtRatio = (u, v) => {
			let tv1 = c6;
			let tv2 = Fp.pow(v, c4);
			let tv3 = Fp.sqr(tv2);
			tv3 = Fp.mul(tv3, v);
			let tv5 = Fp.mul(u, tv3);
			tv5 = Fp.pow(tv5, c3);
			tv5 = Fp.mul(tv5, tv2);
			tv2 = Fp.mul(tv5, v);
			tv3 = Fp.mul(tv5, u);
			let tv4 = Fp.mul(tv3, tv2);
			tv5 = Fp.pow(tv4, c5);
			let isQR = Fp.eql(tv5, Fp.ONE);
			tv2 = Fp.mul(tv3, c7);
			tv5 = Fp.mul(tv4, tv1);
			tv3 = Fp.cmov(tv2, tv3, isQR);
			tv4 = Fp.cmov(tv5, tv4, isQR);
			for (let i = c1; i > _1n; i--) {
				let tv5 = i - _2n;
				tv5 = _2n << tv5 - _1n;
				let tvv5 = Fp.pow(tv4, tv5);
				const e1 = Fp.eql(tvv5, Fp.ONE);
				tv2 = Fp.mul(tv3, tv1);
				tv1 = Fp.mul(tv1, tv1);
				tvv5 = Fp.mul(tv4, tv1);
				tv3 = Fp.cmov(tv2, tv3, e1);
				tv4 = Fp.cmov(tvv5, tv4, e1);
			}
			return {
				isValid: isQR,
				value: tv3
			};
		};
		if (Fp.ORDER % _4n === _3n) {
			const c1 = (Fp.ORDER - _3n) / _4n;
			const c2 = Fp.sqrt(Fp.neg(Z));
			sqrtRatio = (u, v) => {
				let tv1 = Fp.sqr(v);
				const tv2 = Fp.mul(u, v);
				tv1 = Fp.mul(tv1, tv2);
				let y1 = Fp.pow(tv1, c1);
				y1 = Fp.mul(y1, tv2);
				const y2 = Fp.mul(y1, c2);
				const tv3 = Fp.mul(Fp.sqr(y1), v);
				const isQR = Fp.eql(tv3, u);
				return {
					isValid: isQR,
					value: Fp.cmov(y2, y1, isQR)
				};
			};
		}
		return sqrtRatio;
	}
	/**
	* Simplified Shallue-van de Woestijne-Ulas Method
	* https://www.rfc-editor.org/rfc/rfc9380#section-6.6.2
	*/
	function mapToCurveSimpleSWU(Fp, opts) {
		(0, modular_ts_1.validateField)(Fp);
		const { A, B, Z } = opts;
		if (!Fp.isValid(A) || !Fp.isValid(B) || !Fp.isValid(Z)) throw new Error("mapToCurveSimpleSWU: invalid opts");
		const sqrtRatio = SWUFpSqrtRatio(Fp, Z);
		if (!Fp.isOdd) throw new Error("Field does not have .isOdd()");
		return (u) => {
			let tv1, tv2, tv3, tv4, tv5, tv6, x, y;
			tv1 = Fp.sqr(u);
			tv1 = Fp.mul(tv1, Z);
			tv2 = Fp.sqr(tv1);
			tv2 = Fp.add(tv2, tv1);
			tv3 = Fp.add(tv2, Fp.ONE);
			tv3 = Fp.mul(tv3, B);
			tv4 = Fp.cmov(Z, Fp.neg(tv2), !Fp.eql(tv2, Fp.ZERO));
			tv4 = Fp.mul(tv4, A);
			tv2 = Fp.sqr(tv3);
			tv6 = Fp.sqr(tv4);
			tv5 = Fp.mul(tv6, A);
			tv2 = Fp.add(tv2, tv5);
			tv2 = Fp.mul(tv2, tv3);
			tv6 = Fp.mul(tv6, tv4);
			tv5 = Fp.mul(tv6, B);
			tv2 = Fp.add(tv2, tv5);
			x = Fp.mul(tv1, tv3);
			const { isValid, value } = sqrtRatio(tv2, tv6);
			y = Fp.mul(tv1, u);
			y = Fp.mul(y, value);
			x = Fp.cmov(x, tv3, isValid);
			y = Fp.cmov(y, value, isValid);
			const e1 = Fp.isOdd(u) === Fp.isOdd(y);
			y = Fp.cmov(Fp.neg(y), y, e1);
			const tv4_inv = (0, modular_ts_1.FpInvertBatch)(Fp, [tv4], true)[0];
			x = Fp.mul(x, tv4_inv);
			return {
				x,
				y
			};
		};
	}
	function getWLengths(Fp, Fn) {
		return {
			secretKey: Fn.BYTES,
			publicKey: 1 + Fp.BYTES,
			publicKeyUncompressed: 1 + 2 * Fp.BYTES,
			publicKeyHasPrefix: true,
			signature: 2 * Fn.BYTES
		};
	}
	/**
	* Sometimes users only need getPublicKey, getSharedSecret, and secret key handling.
	* This helper ensures no signature functionality is present. Less code, smaller bundle size.
	*/
	function ecdh(Point, ecdhOpts = {}) {
		const { Fn } = Point;
		const randomBytes_ = ecdhOpts.randomBytes || utils_ts_1.randomBytes;
		const lengths = Object.assign(getWLengths(Point.Fp, Fn), { seed: (0, modular_ts_1.getMinHashLength)(Fn.ORDER) });
		function isValidSecretKey(secretKey) {
			try {
				return !!_normFnElement(Fn, secretKey);
			} catch (error) {
				return false;
			}
		}
		function isValidPublicKey(publicKey, isCompressed) {
			const { publicKey: comp, publicKeyUncompressed } = lengths;
			try {
				const l = publicKey.length;
				if (isCompressed === true && l !== comp) return false;
				if (isCompressed === false && l !== publicKeyUncompressed) return false;
				return !!Point.fromBytes(publicKey);
			} catch (error) {
				return false;
			}
		}
		/**
		* Produces cryptographically secure secret key from random of size
		* (groupLen + ceil(groupLen / 2)) with modulo bias being negligible.
		*/
		function randomSecretKey(seed = randomBytes_(lengths.seed)) {
			return (0, modular_ts_1.mapHashToField)((0, utils_ts_1._abytes2)(seed, lengths.seed, "seed"), Fn.ORDER);
		}
		/**
		* Computes public key for a secret key. Checks for validity of the secret key.
		* @param isCompressed whether to return compact (default), or full key
		* @returns Public key, full when isCompressed=false; short when isCompressed=true
		*/
		function getPublicKey(secretKey, isCompressed = true) {
			return Point.BASE.multiply(_normFnElement(Fn, secretKey)).toBytes(isCompressed);
		}
		function keygen(seed) {
			const secretKey = randomSecretKey(seed);
			return {
				secretKey,
				publicKey: getPublicKey(secretKey)
			};
		}
		/**
		* Quick and dirty check for item being public key. Does not validate hex, or being on-curve.
		*/
		function isProbPub(item) {
			if (typeof item === "bigint") return false;
			if (item instanceof Point) return true;
			const { secretKey, publicKey, publicKeyUncompressed } = lengths;
			if (Fn.allowedLengths || secretKey === publicKey) return void 0;
			const l = (0, utils_ts_1.ensureBytes)("key", item).length;
			return l === publicKey || l === publicKeyUncompressed;
		}
		/**
		* ECDH (Elliptic Curve Diffie Hellman).
		* Computes shared public key from secret key A and public key B.
		* Checks: 1) secret key validity 2) shared key is on-curve.
		* Does NOT hash the result.
		* @param isCompressed whether to return compact (default), or full key
		* @returns shared public key
		*/
		function getSharedSecret(secretKeyA, publicKeyB, isCompressed = true) {
			if (isProbPub(secretKeyA) === true) throw new Error("first arg must be private key");
			if (isProbPub(publicKeyB) === false) throw new Error("second arg must be public key");
			const s = _normFnElement(Fn, secretKeyA);
			return Point.fromHex(publicKeyB).multiply(s).toBytes(isCompressed);
		}
		return Object.freeze({
			getPublicKey,
			getSharedSecret,
			keygen,
			Point,
			utils: {
				isValidSecretKey,
				isValidPublicKey,
				randomSecretKey,
				isValidPrivateKey: isValidSecretKey,
				randomPrivateKey: randomSecretKey,
				normPrivateKeyToScalar: (key) => _normFnElement(Fn, key),
				precompute(windowSize = 8, point = Point.BASE) {
					return point.precompute(windowSize, false);
				}
			},
			lengths
		});
	}
	/**
	* Creates ECDSA signing interface for given elliptic curve `Point` and `hash` function.
	* We need `hash` for 2 features:
	* 1. Message prehash-ing. NOT used if `sign` / `verify` are called with `prehash: false`
	* 2. k generation in `sign`, using HMAC-drbg(hash)
	*
	* ECDSAOpts are only rarely needed.
	*
	* @example
	* ```js
	* const p256_Point = weierstrass(...);
	* const p256_sha256 = ecdsa(p256_Point, sha256);
	* const p256_sha224 = ecdsa(p256_Point, sha224);
	* const p256_sha224_r = ecdsa(p256_Point, sha224, { randomBytes: (length) => { ... } });
	* ```
	*/
	function ecdsa(Point, hash, ecdsaOpts = {}) {
		(0, utils_1.ahash)(hash);
		(0, utils_ts_1._validateObject)(ecdsaOpts, {}, {
			hmac: "function",
			lowS: "boolean",
			randomBytes: "function",
			bits2int: "function",
			bits2int_modN: "function"
		});
		const randomBytes = ecdsaOpts.randomBytes || utils_ts_1.randomBytes;
		const hmac = ecdsaOpts.hmac || ((key, ...msgs) => (0, hmac_js_1.hmac)(hash, key, (0, utils_ts_1.concatBytes)(...msgs)));
		const { Fp, Fn } = Point;
		const { ORDER: CURVE_ORDER, BITS: fnBits } = Fn;
		const { keygen, getPublicKey, getSharedSecret, utils, lengths } = ecdh(Point, ecdsaOpts);
		const defaultSigOpts = {
			prehash: false,
			lowS: typeof ecdsaOpts.lowS === "boolean" ? ecdsaOpts.lowS : false,
			format: void 0,
			extraEntropy: false
		};
		const defaultSigOpts_format = "compact";
		function isBiggerThanHalfOrder(number) {
			return number > CURVE_ORDER >> _1n;
		}
		function validateRS(title, num) {
			if (!Fn.isValidNot0(num)) throw new Error(`invalid signature ${title}: out of range 1..Point.Fn.ORDER`);
			return num;
		}
		function validateSigLength(bytes, format) {
			validateSigFormat(format);
			const size = lengths.signature;
			const sizer = format === "compact" ? size : format === "recovered" ? size + 1 : void 0;
			return (0, utils_ts_1._abytes2)(bytes, sizer, `${format} signature`);
		}
		/**
		* ECDSA signature with its (r, s) properties. Supports compact, recovered & DER representations.
		*/
		class Signature {
			constructor(r, s, recovery) {
				this.r = validateRS("r", r);
				this.s = validateRS("s", s);
				if (recovery != null) this.recovery = recovery;
				Object.freeze(this);
			}
			static fromBytes(bytes, format = defaultSigOpts_format) {
				validateSigLength(bytes, format);
				let recid;
				if (format === "der") {
					const { r, s } = exports.DER.toSig((0, utils_ts_1._abytes2)(bytes));
					return new Signature(r, s);
				}
				if (format === "recovered") {
					recid = bytes[0];
					format = "compact";
					bytes = bytes.subarray(1);
				}
				const L = Fn.BYTES;
				const r = bytes.subarray(0, L);
				const s = bytes.subarray(L, L * 2);
				return new Signature(Fn.fromBytes(r), Fn.fromBytes(s), recid);
			}
			static fromHex(hex, format) {
				return this.fromBytes((0, utils_ts_1.hexToBytes)(hex), format);
			}
			addRecoveryBit(recovery) {
				return new Signature(this.r, this.s, recovery);
			}
			recoverPublicKey(messageHash) {
				const FIELD_ORDER = Fp.ORDER;
				const { r, s, recovery: rec } = this;
				if (rec == null || ![
					0,
					1,
					2,
					3
				].includes(rec)) throw new Error("recovery id invalid");
				if (CURVE_ORDER * _2n < FIELD_ORDER && rec > 1) throw new Error("recovery id is ambiguous for h>1 curve");
				const radj = rec === 2 || rec === 3 ? r + CURVE_ORDER : r;
				if (!Fp.isValid(radj)) throw new Error("recovery id 2 or 3 invalid");
				const x = Fp.toBytes(radj);
				const R = Point.fromBytes((0, utils_ts_1.concatBytes)(pprefix((rec & 1) === 0), x));
				const ir = Fn.inv(radj);
				const h = bits2int_modN((0, utils_ts_1.ensureBytes)("msgHash", messageHash));
				const u1 = Fn.create(-h * ir);
				const u2 = Fn.create(s * ir);
				const Q = Point.BASE.multiplyUnsafe(u1).add(R.multiplyUnsafe(u2));
				if (Q.is0()) throw new Error("point at infinify");
				Q.assertValidity();
				return Q;
			}
			hasHighS() {
				return isBiggerThanHalfOrder(this.s);
			}
			toBytes(format = defaultSigOpts_format) {
				validateSigFormat(format);
				if (format === "der") return (0, utils_ts_1.hexToBytes)(exports.DER.hexFromSig(this));
				const r = Fn.toBytes(this.r);
				const s = Fn.toBytes(this.s);
				if (format === "recovered") {
					if (this.recovery == null) throw new Error("recovery bit must be present");
					return (0, utils_ts_1.concatBytes)(Uint8Array.of(this.recovery), r, s);
				}
				return (0, utils_ts_1.concatBytes)(r, s);
			}
			toHex(format) {
				return (0, utils_ts_1.bytesToHex)(this.toBytes(format));
			}
			assertValidity() {}
			static fromCompact(hex) {
				return Signature.fromBytes((0, utils_ts_1.ensureBytes)("sig", hex), "compact");
			}
			static fromDER(hex) {
				return Signature.fromBytes((0, utils_ts_1.ensureBytes)("sig", hex), "der");
			}
			normalizeS() {
				return this.hasHighS() ? new Signature(this.r, Fn.neg(this.s), this.recovery) : this;
			}
			toDERRawBytes() {
				return this.toBytes("der");
			}
			toDERHex() {
				return (0, utils_ts_1.bytesToHex)(this.toBytes("der"));
			}
			toCompactRawBytes() {
				return this.toBytes("compact");
			}
			toCompactHex() {
				return (0, utils_ts_1.bytesToHex)(this.toBytes("compact"));
			}
		}
		const bits2int = ecdsaOpts.bits2int || function bits2int_def(bytes) {
			if (bytes.length > 8192) throw new Error("input is too large");
			const num = (0, utils_ts_1.bytesToNumberBE)(bytes);
			const delta = bytes.length * 8 - fnBits;
			return delta > 0 ? num >> BigInt(delta) : num;
		};
		const bits2int_modN = ecdsaOpts.bits2int_modN || function bits2int_modN_def(bytes) {
			return Fn.create(bits2int(bytes));
		};
		const ORDER_MASK = (0, utils_ts_1.bitMask)(fnBits);
		/** Converts to bytes. Checks if num in `[0..ORDER_MASK-1]` e.g.: `[0..2^256-1]`. */
		function int2octets(num) {
			(0, utils_ts_1.aInRange)("num < 2^" + fnBits, num, _0n, ORDER_MASK);
			return Fn.toBytes(num);
		}
		function validateMsgAndHash(message, prehash) {
			(0, utils_ts_1._abytes2)(message, void 0, "message");
			return prehash ? (0, utils_ts_1._abytes2)(hash(message), void 0, "prehashed message") : message;
		}
		/**
		* Steps A, D of RFC6979 3.2.
		* Creates RFC6979 seed; converts msg/privKey to numbers.
		* Used only in sign, not in verify.
		*
		* Warning: we cannot assume here that message has same amount of bytes as curve order,
		* this will be invalid at least for P521. Also it can be bigger for P224 + SHA256.
		*/
		function prepSig(message, privateKey, opts) {
			if (["recovered", "canonical"].some((k) => k in opts)) throw new Error("sign() legacy options not supported");
			const { lowS, prehash, extraEntropy } = validateSigOpts(opts, defaultSigOpts);
			message = validateMsgAndHash(message, prehash);
			const h1int = bits2int_modN(message);
			const d = _normFnElement(Fn, privateKey);
			const seedArgs = [int2octets(d), int2octets(h1int)];
			if (extraEntropy != null && extraEntropy !== false) {
				const e = extraEntropy === true ? randomBytes(lengths.secretKey) : extraEntropy;
				seedArgs.push((0, utils_ts_1.ensureBytes)("extraEntropy", e));
			}
			const seed = (0, utils_ts_1.concatBytes)(...seedArgs);
			const m = h1int;
			function k2sig(kBytes) {
				const k = bits2int(kBytes);
				if (!Fn.isValidNot0(k)) return;
				const ik = Fn.inv(k);
				const q = Point.BASE.multiply(k).toAffine();
				const r = Fn.create(q.x);
				if (r === _0n) return;
				const s = Fn.create(ik * Fn.create(m + r * d));
				if (s === _0n) return;
				let recovery = (q.x === r ? 0 : 2) | Number(q.y & _1n);
				let normS = s;
				if (lowS && isBiggerThanHalfOrder(s)) {
					normS = Fn.neg(s);
					recovery ^= 1;
				}
				return new Signature(r, normS, recovery);
			}
			return {
				seed,
				k2sig
			};
		}
		/**
		* Signs message hash with a secret key.
		*
		* ```
		* sign(m, d) where
		*   k = rfc6979_hmac_drbg(m, d)
		*   (x, y) = G × k
		*   r = x mod n
		*   s = (m + dr) / k mod n
		* ```
		*/
		function sign(message, secretKey, opts = {}) {
			message = (0, utils_ts_1.ensureBytes)("message", message);
			const { seed, k2sig } = prepSig(message, secretKey, opts);
			return (0, utils_ts_1.createHmacDrbg)(hash.outputLen, Fn.BYTES, hmac)(seed, k2sig);
		}
		function tryParsingSig(sg) {
			let sig = void 0;
			const isHex = typeof sg === "string" || (0, utils_ts_1.isBytes)(sg);
			const isObj = !isHex && sg !== null && typeof sg === "object" && typeof sg.r === "bigint" && typeof sg.s === "bigint";
			if (!isHex && !isObj) throw new Error("invalid signature, expected Uint8Array, hex string or Signature instance");
			if (isObj) sig = new Signature(sg.r, sg.s);
			else if (isHex) {
				try {
					sig = Signature.fromBytes((0, utils_ts_1.ensureBytes)("sig", sg), "der");
				} catch (derError) {
					if (!(derError instanceof exports.DER.Err)) throw derError;
				}
				if (!sig) try {
					sig = Signature.fromBytes((0, utils_ts_1.ensureBytes)("sig", sg), "compact");
				} catch (error) {
					return false;
				}
			}
			if (!sig) return false;
			return sig;
		}
		/**
		* Verifies a signature against message and public key.
		* Rejects lowS signatures by default: see {@link ECDSAVerifyOpts}.
		* Implements section 4.1.4 from https://www.secg.org/sec1-v2.pdf:
		*
		* ```
		* verify(r, s, h, P) where
		*   u1 = hs^-1 mod n
		*   u2 = rs^-1 mod n
		*   R = u1⋅G + u2⋅P
		*   mod(R.x, n) == r
		* ```
		*/
		function verify(signature, message, publicKey, opts = {}) {
			const { lowS, prehash, format } = validateSigOpts(opts, defaultSigOpts);
			publicKey = (0, utils_ts_1.ensureBytes)("publicKey", publicKey);
			message = validateMsgAndHash((0, utils_ts_1.ensureBytes)("message", message), prehash);
			if ("strict" in opts) throw new Error("options.strict was renamed to lowS");
			const sig = format === void 0 ? tryParsingSig(signature) : Signature.fromBytes((0, utils_ts_1.ensureBytes)("sig", signature), format);
			if (sig === false) return false;
			try {
				const P = Point.fromBytes(publicKey);
				if (lowS && sig.hasHighS()) return false;
				const { r, s } = sig;
				const h = bits2int_modN(message);
				const is = Fn.inv(s);
				const u1 = Fn.create(h * is);
				const u2 = Fn.create(r * is);
				const R = Point.BASE.multiplyUnsafe(u1).add(P.multiplyUnsafe(u2));
				if (R.is0()) return false;
				return Fn.create(R.x) === r;
			} catch (e) {
				return false;
			}
		}
		function recoverPublicKey(signature, message, opts = {}) {
			const { prehash } = validateSigOpts(opts, defaultSigOpts);
			message = validateMsgAndHash(message, prehash);
			return Signature.fromBytes(signature, "recovered").recoverPublicKey(message).toBytes();
		}
		return Object.freeze({
			keygen,
			getPublicKey,
			getSharedSecret,
			utils,
			lengths,
			Point,
			sign,
			verify,
			recoverPublicKey,
			Signature,
			hash
		});
	}
	/** @deprecated use `weierstrass` in newer releases */
	function weierstrassPoints(c) {
		const { CURVE, curveOpts } = _weierstrass_legacy_opts_to_new(c);
		return _weierstrass_new_output_to_legacy(c, weierstrassN(CURVE, curveOpts));
	}
	function _weierstrass_legacy_opts_to_new(c) {
		const CURVE = {
			a: c.a,
			b: c.b,
			p: c.Fp.ORDER,
			n: c.n,
			h: c.h,
			Gx: c.Gx,
			Gy: c.Gy
		};
		const Fp = c.Fp;
		let allowedLengths = c.allowedPrivateKeyLengths ? Array.from(new Set(c.allowedPrivateKeyLengths.map((l) => Math.ceil(l / 2)))) : void 0;
		return {
			CURVE,
			curveOpts: {
				Fp,
				Fn: (0, modular_ts_1.Field)(CURVE.n, {
					BITS: c.nBitLength,
					allowedLengths,
					modFromBytes: c.wrapPrivateKey
				}),
				allowInfinityPoint: c.allowInfinityPoint,
				endo: c.endo,
				isTorsionFree: c.isTorsionFree,
				clearCofactor: c.clearCofactor,
				fromBytes: c.fromBytes,
				toBytes: c.toBytes
			}
		};
	}
	function _ecdsa_legacy_opts_to_new(c) {
		const { CURVE, curveOpts } = _weierstrass_legacy_opts_to_new(c);
		const ecdsaOpts = {
			hmac: c.hmac,
			randomBytes: c.randomBytes,
			lowS: c.lowS,
			bits2int: c.bits2int,
			bits2int_modN: c.bits2int_modN
		};
		return {
			CURVE,
			curveOpts,
			hash: c.hash,
			ecdsaOpts
		};
	}
	function _legacyHelperEquat(Fp, a, b) {
		/**
		* y² = x³ + ax + b: Short weierstrass curve formula. Takes x, returns y².
		* @returns y²
		*/
		function weierstrassEquation(x) {
			const x2 = Fp.sqr(x);
			const x3 = Fp.mul(x2, x);
			return Fp.add(Fp.add(x3, Fp.mul(x, a)), b);
		}
		return weierstrassEquation;
	}
	function _weierstrass_new_output_to_legacy(c, Point) {
		const { Fp, Fn } = Point;
		function isWithinCurveOrder(num) {
			return (0, utils_ts_1.inRange)(num, _1n, Fn.ORDER);
		}
		const weierstrassEquation = _legacyHelperEquat(Fp, c.a, c.b);
		return Object.assign({}, {
			CURVE: c,
			Point,
			ProjectivePoint: Point,
			normPrivateKeyToScalar: (key) => _normFnElement(Fn, key),
			weierstrassEquation,
			isWithinCurveOrder
		});
	}
	function _ecdsa_new_output_to_legacy(c, _ecdsa) {
		const Point = _ecdsa.Point;
		return Object.assign({}, _ecdsa, {
			ProjectivePoint: Point,
			CURVE: Object.assign({}, c, (0, modular_ts_1.nLength)(Point.Fn.ORDER, Point.Fn.BITS))
		});
	}
	function weierstrass(c) {
		const { CURVE, curveOpts, hash, ecdsaOpts } = _ecdsa_legacy_opts_to_new(c);
		return _ecdsa_new_output_to_legacy(c, ecdsa(weierstrassN(CURVE, curveOpts), hash, ecdsaOpts));
	}
}));
//#endregion
//#region node_modules/.pnpm/@noble+curves@1.9.7/node_modules/@noble/curves/_shortw_utils.js
var require__shortw_utils = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.getHash = getHash;
	exports.createCurve = createCurve;
	/**
	* Utilities for short weierstrass curves, combined with noble-hashes.
	* @module
	*/
	/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */
	const weierstrass_ts_1 = require_weierstrass();
	/** connects noble-curves to noble-hashes */
	function getHash(hash) {
		return { hash };
	}
	/** @deprecated use new `weierstrass()` and `ecdsa()` methods */
	function createCurve(curveDef, defHash) {
		const create = (hash) => (0, weierstrass_ts_1.weierstrass)({
			...curveDef,
			hash
		});
		return {
			...create(defHash),
			create
		};
	}
}));
//#endregion
//#region node_modules/.pnpm/@noble+curves@1.9.7/node_modules/@noble/curves/secp256k1.js
var require_secp256k1 = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.encodeToCurve = exports.hashToCurve = exports.secp256k1_hasher = exports.schnorr = exports.secp256k1 = void 0;
	/**
	* SECG secp256k1. See [pdf](https://www.secg.org/sec2-v2.pdf).
	*
	* Belongs to Koblitz curves: it has efficiently-computable GLV endomorphism ψ,
	* check out {@link EndomorphismOpts}. Seems to be rigid (not backdoored).
	* @module
	*/
	/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */
	const sha2_js_1 = require_sha2();
	const utils_js_1 = require_utils$2();
	const _shortw_utils_ts_1 = require__shortw_utils();
	const hash_to_curve_ts_1 = require_hash_to_curve();
	const modular_ts_1 = require_modular();
	const weierstrass_ts_1 = require_weierstrass();
	const utils_ts_1 = require_utils$1();
	const secp256k1_CURVE = {
		p: BigInt("0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffc2f"),
		n: BigInt("0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141"),
		h: BigInt(1),
		a: BigInt(0),
		b: BigInt(7),
		Gx: BigInt("0x79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798"),
		Gy: BigInt("0x483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8")
	};
	const secp256k1_ENDO = {
		beta: BigInt("0x7ae96a2b657c07106e64479eac3434e99cf0497512f58995c1396c28719501ee"),
		basises: [[BigInt("0x3086d221a7d46bcde86c90e49284eb15"), -BigInt("0xe4437ed6010e88286f547fa90abfe4c3")], [BigInt("0x114ca50f7a8e2f3f657c1108d9d44cfd8"), BigInt("0x3086d221a7d46bcde86c90e49284eb15")]]
	};
	const _0n = /* @__PURE__ */ BigInt(0);
	const _1n = /* @__PURE__ */ BigInt(1);
	const _2n = /* @__PURE__ */ BigInt(2);
	/**
	* √n = n^((p+1)/4) for fields p = 3 mod 4. We unwrap the loop and multiply bit-by-bit.
	* (P+1n/4n).toString(2) would produce bits [223x 1, 0, 22x 1, 4x 0, 11, 00]
	*/
	function sqrtMod(y) {
		const P = secp256k1_CURVE.p;
		const _3n = BigInt(3), _6n = BigInt(6), _11n = BigInt(11), _22n = BigInt(22);
		const _23n = BigInt(23), _44n = BigInt(44), _88n = BigInt(88);
		const b2 = y * y * y % P;
		const b3 = b2 * b2 * y % P;
		const b6 = (0, modular_ts_1.pow2)(b3, _3n, P) * b3 % P;
		const b9 = (0, modular_ts_1.pow2)(b6, _3n, P) * b3 % P;
		const b11 = (0, modular_ts_1.pow2)(b9, _2n, P) * b2 % P;
		const b22 = (0, modular_ts_1.pow2)(b11, _11n, P) * b11 % P;
		const b44 = (0, modular_ts_1.pow2)(b22, _22n, P) * b22 % P;
		const b88 = (0, modular_ts_1.pow2)(b44, _44n, P) * b44 % P;
		const b176 = (0, modular_ts_1.pow2)(b88, _88n, P) * b88 % P;
		const b220 = (0, modular_ts_1.pow2)(b176, _44n, P) * b44 % P;
		const b223 = (0, modular_ts_1.pow2)(b220, _3n, P) * b3 % P;
		const t1 = (0, modular_ts_1.pow2)(b223, _23n, P) * b22 % P;
		const t2 = (0, modular_ts_1.pow2)(t1, _6n, P) * b2 % P;
		const root = (0, modular_ts_1.pow2)(t2, _2n, P);
		if (!Fpk1.eql(Fpk1.sqr(root), y)) throw new Error("Cannot find square root");
		return root;
	}
	const Fpk1 = (0, modular_ts_1.Field)(secp256k1_CURVE.p, { sqrt: sqrtMod });
	/**
	* secp256k1 curve, ECDSA and ECDH methods.
	*
	* Field: `2n**256n - 2n**32n - 2n**9n - 2n**8n - 2n**7n - 2n**6n - 2n**4n - 1n`
	*
	* @example
	* ```js
	* import { secp256k1 } from '@noble/curves/secp256k1';
	* const { secretKey, publicKey } = secp256k1.keygen();
	* const msg = new TextEncoder().encode('hello');
	* const sig = secp256k1.sign(msg, secretKey);
	* const isValid = secp256k1.verify(sig, msg, publicKey) === true;
	* ```
	*/
	exports.secp256k1 = (0, _shortw_utils_ts_1.createCurve)({
		...secp256k1_CURVE,
		Fp: Fpk1,
		lowS: true,
		endo: secp256k1_ENDO
	}, sha2_js_1.sha256);
	/** An object mapping tags to their tagged hash prefix of [SHA256(tag) | SHA256(tag)] */
	const TAGGED_HASH_PREFIXES = {};
	function taggedHash(tag, ...messages) {
		let tagP = TAGGED_HASH_PREFIXES[tag];
		if (tagP === void 0) {
			const tagH = (0, sha2_js_1.sha256)((0, utils_ts_1.utf8ToBytes)(tag));
			tagP = (0, utils_ts_1.concatBytes)(tagH, tagH);
			TAGGED_HASH_PREFIXES[tag] = tagP;
		}
		return (0, sha2_js_1.sha256)((0, utils_ts_1.concatBytes)(tagP, ...messages));
	}
	const pointToBytes = (point) => point.toBytes(true).slice(1);
	const Pointk1 = /* @__PURE__ */ (() => exports.secp256k1.Point)();
	const hasEven = (y) => y % _2n === _0n;
	function schnorrGetExtPubKey(priv) {
		const { Fn, BASE } = Pointk1;
		const d_ = (0, weierstrass_ts_1._normFnElement)(Fn, priv);
		const p = BASE.multiply(d_);
		return {
			scalar: hasEven(p.y) ? d_ : Fn.neg(d_),
			bytes: pointToBytes(p)
		};
	}
	/**
	* lift_x from BIP340. Convert 32-byte x coordinate to elliptic curve point.
	* @returns valid point checked for being on-curve
	*/
	function lift_x(x) {
		const Fp = Fpk1;
		if (!Fp.isValidNot0(x)) throw new Error("invalid x: Fail if x ≥ p");
		const xx = Fp.create(x * x);
		const c = Fp.create(xx * x + BigInt(7));
		let y = Fp.sqrt(c);
		if (!hasEven(y)) y = Fp.neg(y);
		const p = Pointk1.fromAffine({
			x,
			y
		});
		p.assertValidity();
		return p;
	}
	const num = utils_ts_1.bytesToNumberBE;
	/**
	* Create tagged hash, convert it to bigint, reduce modulo-n.
	*/
	function challenge(...args) {
		return Pointk1.Fn.create(num(taggedHash("BIP0340/challenge", ...args)));
	}
	/**
	* Schnorr public key is just `x` coordinate of Point as per BIP340.
	*/
	function schnorrGetPublicKey(secretKey) {
		return schnorrGetExtPubKey(secretKey).bytes;
	}
	/**
	* Creates Schnorr signature as per BIP340. Verifies itself before returning anything.
	* auxRand is optional and is not the sole source of k generation: bad CSPRNG won't be dangerous.
	*/
	function schnorrSign(message, secretKey, auxRand = (0, utils_js_1.randomBytes)(32)) {
		const { Fn } = Pointk1;
		const m = (0, utils_ts_1.ensureBytes)("message", message);
		const { bytes: px, scalar: d } = schnorrGetExtPubKey(secretKey);
		const a = (0, utils_ts_1.ensureBytes)("auxRand", auxRand, 32);
		const { bytes: rx, scalar: k } = schnorrGetExtPubKey(taggedHash("BIP0340/nonce", Fn.toBytes(d ^ num(taggedHash("BIP0340/aux", a))), px, m));
		const e = challenge(rx, px, m);
		const sig = /* @__PURE__ */ new Uint8Array(64);
		sig.set(rx, 0);
		sig.set(Fn.toBytes(Fn.create(k + e * d)), 32);
		if (!schnorrVerify(sig, m, px)) throw new Error("sign: Invalid signature produced");
		return sig;
	}
	/**
	* Verifies Schnorr signature.
	* Will swallow errors & return false except for initial type validation of arguments.
	*/
	function schnorrVerify(signature, message, publicKey) {
		const { Fn, BASE } = Pointk1;
		const sig = (0, utils_ts_1.ensureBytes)("signature", signature, 64);
		const m = (0, utils_ts_1.ensureBytes)("message", message);
		const pub = (0, utils_ts_1.ensureBytes)("publicKey", publicKey, 32);
		try {
			const P = lift_x(num(pub));
			const r = num(sig.subarray(0, 32));
			if (!(0, utils_ts_1.inRange)(r, _1n, secp256k1_CURVE.p)) return false;
			const s = num(sig.subarray(32, 64));
			if (!(0, utils_ts_1.inRange)(s, _1n, secp256k1_CURVE.n)) return false;
			const e = challenge(Fn.toBytes(r), pointToBytes(P), m);
			const R = BASE.multiplyUnsafe(s).add(P.multiplyUnsafe(Fn.neg(e)));
			const { x, y } = R.toAffine();
			if (R.is0() || !hasEven(y) || x !== r) return false;
			return true;
		} catch (error) {
			return false;
		}
	}
	/**
	* Schnorr signatures over secp256k1.
	* https://github.com/bitcoin/bips/blob/master/bip-0340.mediawiki
	* @example
	* ```js
	* import { schnorr } from '@noble/curves/secp256k1';
	* const { secretKey, publicKey } = schnorr.keygen();
	* // const publicKey = schnorr.getPublicKey(secretKey);
	* const msg = new TextEncoder().encode('hello');
	* const sig = schnorr.sign(msg, secretKey);
	* const isValid = schnorr.verify(sig, msg, publicKey);
	* ```
	*/
	exports.schnorr = (() => {
		const size = 32;
		const seedLength = 48;
		const randomSecretKey = (seed = (0, utils_js_1.randomBytes)(seedLength)) => {
			return (0, modular_ts_1.mapHashToField)(seed, secp256k1_CURVE.n);
		};
		exports.secp256k1.utils.randomSecretKey;
		function keygen(seed) {
			const secretKey = randomSecretKey(seed);
			return {
				secretKey,
				publicKey: schnorrGetPublicKey(secretKey)
			};
		}
		return {
			keygen,
			getPublicKey: schnorrGetPublicKey,
			sign: schnorrSign,
			verify: schnorrVerify,
			Point: Pointk1,
			utils: {
				randomSecretKey,
				randomPrivateKey: randomSecretKey,
				taggedHash,
				lift_x,
				pointToBytes,
				numberToBytesBE: utils_ts_1.numberToBytesBE,
				bytesToNumberBE: utils_ts_1.bytesToNumberBE,
				mod: modular_ts_1.mod
			},
			lengths: {
				secretKey: size,
				publicKey: size,
				publicKeyHasPrefix: false,
				signature: 64,
				seed: seedLength
			}
		};
	})();
	const isoMap = /* @__PURE__ */ (() => (0, hash_to_curve_ts_1.isogenyMap)(Fpk1, [
		[
			"0x8e38e38e38e38e38e38e38e38e38e38e38e38e38e38e38e38e38e38daaaaa8c7",
			"0x7d3d4c80bc321d5b9f315cea7fd44c5d595d2fc0bf63b92dfff1044f17c6581",
			"0x534c328d23f234e6e2a413deca25caece4506144037c40314ecbd0b53d9dd262",
			"0x8e38e38e38e38e38e38e38e38e38e38e38e38e38e38e38e38e38e38daaaaa88c"
		],
		[
			"0xd35771193d94918a9ca34ccbb7b640dd86cd409542f8487d9fe6b745781eb49b",
			"0xedadc6f64383dc1df7c4b2d51b54225406d36b641f5e41bbc52a56612a8c6d14",
			"0x0000000000000000000000000000000000000000000000000000000000000001"
		],
		[
			"0x4bda12f684bda12f684bda12f684bda12f684bda12f684bda12f684b8e38e23c",
			"0xc75e0c32d5cb7c0fa9d0a54b12a0a6d5647ab046d686da6fdffc90fc201d71a3",
			"0x29a6194691f91a73715209ef6512e576722830a201be2018a765e85a9ecee931",
			"0x2f684bda12f684bda12f684bda12f684bda12f684bda12f684bda12f38e38d84"
		],
		[
			"0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffefffff93b",
			"0x7a06534bb8bdb49fd5e9e6632722c2989467c1bfc8e8d978dfb425d2685c2573",
			"0x6484aa716545ca2cf3a70c3fa8fe337e0a3d21162f0d6299a7bf8192bfd2a76f",
			"0x0000000000000000000000000000000000000000000000000000000000000001"
		]
	].map((i) => i.map((j) => BigInt(j)))))();
	const mapSWU = /* @__PURE__ */ (() => (0, weierstrass_ts_1.mapToCurveSimpleSWU)(Fpk1, {
		A: BigInt("0x3f8731abdd661adca08a5558f0f5d272e953d363cb6f0e5d405447c01a444533"),
		B: BigInt("1771"),
		Z: Fpk1.create(BigInt("-11"))
	}))();
	/** Hashing / encoding to secp256k1 points / field. RFC 9380 methods. */
	exports.secp256k1_hasher = (() => (0, hash_to_curve_ts_1.createHasher)(exports.secp256k1.Point, (scalars) => {
		const { x, y } = mapSWU(Fpk1.create(scalars[0]));
		return isoMap(x, y);
	}, {
		DST: "secp256k1_XMD:SHA-256_SSWU_RO_",
		encodeDST: "secp256k1_XMD:SHA-256_SSWU_NU_",
		p: Fpk1.ORDER,
		m: 1,
		k: 128,
		expand: "xmd",
		hash: sha2_js_1.sha256
	}))();
	/** @deprecated use `import { secp256k1_hasher } from '@noble/curves/secp256k1.js';` */
	exports.hashToCurve = (() => exports.secp256k1_hasher.hashToCurve)();
	/** @deprecated use `import { secp256k1_hasher } from '@noble/curves/secp256k1.js';` */
	exports.encodeToCurve = (() => exports.secp256k1_hasher.encodeToCurve)();
}));
//#endregion
//#region node_modules/.pnpm/eciesjs@0.5.0/node_modules/eciesjs/dist/utils/hex.js
var require_hex = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.decodeHex = exports.remove0x = void 0;
	const utils_1 = require_utils$3();
	const remove0x = (hex) => hex.startsWith("0x") || hex.startsWith("0X") ? hex.slice(2) : hex;
	exports.remove0x = remove0x;
	const decodeHex = (hex) => (0, utils_1.hexToBytes)((0, exports.remove0x)(hex));
	exports.decodeHex = decodeHex;
}));
//#endregion
//#region node_modules/.pnpm/eciesjs@0.5.0/node_modules/eciesjs/dist/utils/elliptic.js
var require_elliptic = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.hexToPublicKey = exports.convertPublicKeyFormat = exports.getSharedPoint = exports.getPublicKey = exports.isValidPrivateKey = exports.getValidSecret = void 0;
	const webcrypto_1 = require_webcrypto();
	const ed25519_1 = require_ed25519();
	const secp256k1_1 = require_secp256k1();
	const consts_js_1 = require_consts();
	const hex_js_1 = require_hex();
	const getValidSecret = (curve) => {
		let key;
		do
			key = (0, webcrypto_1.randomBytes)(consts_js_1.SECRET_KEY_LENGTH);
		while (!(0, exports.isValidPrivateKey)(curve, key));
		return key;
	};
	exports.getValidSecret = getValidSecret;
	const isValidPrivateKey = (curve, secret) => _exec(curve, (curve) => curve.utils.isValidSecretKey(secret), () => true, () => true);
	exports.isValidPrivateKey = isValidPrivateKey;
	const getPublicKey = (curve, secret) => _exec(curve, (curve) => curve.getPublicKey(secret), (curve) => curve.getPublicKey(secret), (curve) => curve.getPublicKey(secret));
	exports.getPublicKey = getPublicKey;
	const getSharedPoint = (curve, sk, pk, compressed) => _exec(curve, (curve) => curve.getSharedSecret(sk, pk, compressed), (curve) => curve.getSharedSecret(sk, pk), (curve) => getSharedPointOnEd25519(curve, sk, pk));
	exports.getSharedPoint = getSharedPoint;
	const convertPublicKeyFormat = (curve, pk, compressed) => _exec(curve, (curve) => curve.getSharedSecret(Uint8Array.from(Array(31).fill(0).concat([1])), pk, compressed), () => pk, () => pk);
	exports.convertPublicKeyFormat = convertPublicKeyFormat;
	const hexToPublicKey = (curve, hex) => {
		const decoded = (0, hex_js_1.decodeHex)(hex);
		return _exec(curve, () => compatEthPublicKey(decoded), () => decoded, () => decoded);
	};
	exports.hexToPublicKey = hexToPublicKey;
	function _exec(curve, secp256k1Callback, x25519Callback, ed25519Callback) {
		const _curve = curve;
		/* v8 ignore else -- @preserve */
		if (_curve === "secp256k1") return secp256k1Callback(secp256k1_1.secp256k1);
		else if (_curve === "x25519") return x25519Callback(ed25519_1.x25519);
		else if (_curve === "ed25519") return ed25519Callback(ed25519_1.ed25519);
		else throw new Error("Not implemented");
	}
	const compatEthPublicKey = (pk) => {
		if (pk.length === consts_js_1.ETH_PUBLIC_KEY_SIZE) {
			const fixed = new Uint8Array(1 + pk.length);
			fixed.set([4]);
			fixed.set(pk, 1);
			return fixed;
		}
		return pk;
	};
	const getSharedPointOnEd25519 = (curve, sk, pk) => {
		const { scalar } = curve.utils.getExtendedPublicKey(sk);
		return curve.Point.fromBytes(pk).multiply(scalar).toBytes();
	};
}));
//#endregion
//#region node_modules/.pnpm/@noble+hashes@1.8.0/node_modules/@noble/hashes/hkdf.js
var require_hkdf = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.hkdf = void 0;
	exports.extract = extract;
	exports.expand = expand;
	/**
	* HKDF (RFC 5869): extract + expand in one step.
	* See https://soatok.blog/2021/11/17/understanding-hkdf/.
	* @module
	*/
	const hmac_ts_1 = require_hmac();
	const utils_ts_1 = require_utils$2();
	/**
	* HKDF-extract from spec. Less important part. `HKDF-Extract(IKM, salt) -> PRK`
	* Arguments position differs from spec (IKM is first one, since it is not optional)
	* @param hash - hash function that would be used (e.g. sha256)
	* @param ikm - input keying material, the initial key
	* @param salt - optional salt value (a non-secret random value)
	*/
	function extract(hash, ikm, salt) {
		(0, utils_ts_1.ahash)(hash);
		if (salt === void 0) salt = new Uint8Array(hash.outputLen);
		return (0, hmac_ts_1.hmac)(hash, (0, utils_ts_1.toBytes)(salt), (0, utils_ts_1.toBytes)(ikm));
	}
	const HKDF_COUNTER = /* @__PURE__ */ Uint8Array.from([0]);
	const EMPTY_BUFFER = /* @__PURE__ */ Uint8Array.of();
	/**
	* HKDF-expand from the spec. The most important part. `HKDF-Expand(PRK, info, L) -> OKM`
	* @param hash - hash function that would be used (e.g. sha256)
	* @param prk - a pseudorandom key of at least HashLen octets (usually, the output from the extract step)
	* @param info - optional context and application specific information (can be a zero-length string)
	* @param length - length of output keying material in bytes
	*/
	function expand(hash, prk, info, length = 32) {
		(0, utils_ts_1.ahash)(hash);
		(0, utils_ts_1.anumber)(length);
		const olen = hash.outputLen;
		if (length > 255 * olen) throw new Error("Length should be <= 255*HashLen");
		const blocks = Math.ceil(length / olen);
		if (info === void 0) info = EMPTY_BUFFER;
		const okm = new Uint8Array(blocks * olen);
		const HMAC = hmac_ts_1.hmac.create(hash, prk);
		const HMACTmp = HMAC._cloneInto();
		const T = new Uint8Array(HMAC.outputLen);
		for (let counter = 0; counter < blocks; counter++) {
			HKDF_COUNTER[0] = counter + 1;
			HMACTmp.update(counter === 0 ? EMPTY_BUFFER : T).update(info).update(HKDF_COUNTER).digestInto(T);
			okm.set(T, olen * counter);
			HMAC._cloneInto(HMACTmp);
		}
		HMAC.destroy();
		HMACTmp.destroy();
		(0, utils_ts_1.clean)(T, HKDF_COUNTER);
		return okm.slice(0, length);
	}
	/**
	* HKDF (RFC 5869): derive keys from an initial input.
	* Combines hkdf_extract + hkdf_expand in one step
	* @param hash - hash function that would be used (e.g. sha256)
	* @param ikm - input keying material, the initial key
	* @param salt - optional salt value (a non-secret random value)
	* @param info - optional context and application specific information (can be a zero-length string)
	* @param length - length of output keying material in bytes
	* @example
	* import { hkdf } from '@noble/hashes/hkdf';
	* import { sha256 } from '@noble/hashes/sha2';
	* import { randomBytes } from '@noble/hashes/utils';
	* const inputKey = randomBytes(32);
	* const salt = randomBytes(32);
	* const info = 'application-key';
	* const hk1 = hkdf(sha256, inputKey, salt, info, 32);
	*/
	const hkdf = (hash, ikm, salt, info, length) => expand(hash, extract(hash, ikm, salt), info, length);
	exports.hkdf = hkdf;
}));
//#endregion
//#region node_modules/.pnpm/eciesjs@0.5.0/node_modules/eciesjs/dist/utils/hash.js
var require_hash = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.getSharedKey = exports.deriveKey = void 0;
	const utils_1 = require_utils$3();
	const hkdf_1 = require_hkdf();
	const sha2_1 = require_sha2();
	const deriveKey = (master, salt, info) => (0, hkdf_1.hkdf)(sha2_1.sha256, master, salt, info, 32);
	exports.deriveKey = deriveKey;
	const getSharedKey = (...parts) => (0, exports.deriveKey)((0, utils_1.concatBytes)(...parts));
	exports.getSharedKey = getSharedKey;
}));
//#endregion
//#region node_modules/.pnpm/@ecies+ciphers@0.2.6_@noble+ciphers@1.3.0/node_modules/@ecies/ciphers/dist/_node/compat.js
var require_compat = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports._compat = void 0;
	const node_crypto_1 = __require("node:crypto");
	const utils_1 = require_utils$3();
	const AEAD_TAG_LENGTH = 16;
	/**
	* make `node:crypto`'s ciphers compatible with `@noble/ciphers`.
	*
	* `Cipher`'s interface is the same for both `aes-256-gcm` and `chacha20-poly1305`,
	* albeit the latter is one of `CipherCCMTypes`.
	* Interestingly, whether to set `plaintextLength` or not, or which value to set, has no actual effect.
	*/
	const _compat = (algorithm, key, nonce, AAD) => {
		const isAEAD = algorithm === "aes-256-gcm" || algorithm === "chacha20-poly1305";
		const authTagLength = isAEAD ? AEAD_TAG_LENGTH : 0;
		const options = isAEAD ? { authTagLength } : void 0;
		const encrypt = (plainText) => {
			const cipher = (0, node_crypto_1.createCipheriv)(algorithm, key, nonce, options);
			if (isAEAD && AAD !== void 0) cipher.setAAD(AAD);
			const updated = cipher.update(plainText);
			const finalized = cipher.final();
			const tag = isAEAD ? cipher.getAuthTag() : /* @__PURE__ */ new Uint8Array(0);
			return (0, utils_1.concatBytes)(updated, finalized, tag);
		};
		const decrypt = (cipherText) => {
			const rawCipherText = cipherText.subarray(0, cipherText.length - authTagLength);
			const tag = cipherText.subarray(cipherText.length - authTagLength);
			const decipher = (0, node_crypto_1.createDecipheriv)(algorithm, key, nonce, options);
			if (isAEAD) {
				if (AAD !== void 0) decipher.setAAD(AAD);
				decipher.setAuthTag(tag);
			}
			const updated = decipher.update(rawCipherText);
			const finalized = decipher.final();
			return (0, utils_1.concatBytes)(updated, finalized);
		};
		return {
			encrypt,
			decrypt
		};
	};
	exports._compat = _compat;
}));
//#endregion
//#region node_modules/.pnpm/@ecies+ciphers@0.2.6_@noble+ciphers@1.3.0/node_modules/@ecies/ciphers/dist/aes/node.js
var require_node$1 = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.aes256cbc = exports.aes256gcm = void 0;
	const compat_js_1 = require_compat();
	const aes256gcm = (key, nonce, AAD) => (0, compat_js_1._compat)("aes-256-gcm", key, nonce, AAD);
	exports.aes256gcm = aes256gcm;
	const aes256cbc = (key, nonce, _AAD) => (0, compat_js_1._compat)("aes-256-cbc", key, nonce);
	exports.aes256cbc = aes256cbc;
}));
//#endregion
//#region node_modules/.pnpm/@ecies+ciphers@0.2.6_@noble+ciphers@1.3.0/node_modules/@ecies/ciphers/dist/_node/hchacha.js
var require_hchacha = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports._hchacha20 = void 0;
	/**
	* Copied from `@noble/ciphers/chacha`
	*/
	const _hchacha20 = (s, k, i, o32) => {
		let x00 = s[0], x01 = s[1], x02 = s[2], x03 = s[3], x04 = k[0], x05 = k[1], x06 = k[2], x07 = k[3], x08 = k[4], x09 = k[5], x10 = k[6], x11 = k[7], x12 = i[0], x13 = i[1], x14 = i[2], x15 = i[3];
		for (let r = 0; r < 20; r += 2) {
			x00 = x00 + x04 | 0;
			x12 = rotl(x12 ^ x00, 16);
			x08 = x08 + x12 | 0;
			x04 = rotl(x04 ^ x08, 12);
			x00 = x00 + x04 | 0;
			x12 = rotl(x12 ^ x00, 8);
			x08 = x08 + x12 | 0;
			x04 = rotl(x04 ^ x08, 7);
			x01 = x01 + x05 | 0;
			x13 = rotl(x13 ^ x01, 16);
			x09 = x09 + x13 | 0;
			x05 = rotl(x05 ^ x09, 12);
			x01 = x01 + x05 | 0;
			x13 = rotl(x13 ^ x01, 8);
			x09 = x09 + x13 | 0;
			x05 = rotl(x05 ^ x09, 7);
			x02 = x02 + x06 | 0;
			x14 = rotl(x14 ^ x02, 16);
			x10 = x10 + x14 | 0;
			x06 = rotl(x06 ^ x10, 12);
			x02 = x02 + x06 | 0;
			x14 = rotl(x14 ^ x02, 8);
			x10 = x10 + x14 | 0;
			x06 = rotl(x06 ^ x10, 7);
			x03 = x03 + x07 | 0;
			x15 = rotl(x15 ^ x03, 16);
			x11 = x11 + x15 | 0;
			x07 = rotl(x07 ^ x11, 12);
			x03 = x03 + x07 | 0;
			x15 = rotl(x15 ^ x03, 8);
			x11 = x11 + x15 | 0;
			x07 = rotl(x07 ^ x11, 7);
			x00 = x00 + x05 | 0;
			x15 = rotl(x15 ^ x00, 16);
			x10 = x10 + x15 | 0;
			x05 = rotl(x05 ^ x10, 12);
			x00 = x00 + x05 | 0;
			x15 = rotl(x15 ^ x00, 8);
			x10 = x10 + x15 | 0;
			x05 = rotl(x05 ^ x10, 7);
			x01 = x01 + x06 | 0;
			x12 = rotl(x12 ^ x01, 16);
			x11 = x11 + x12 | 0;
			x06 = rotl(x06 ^ x11, 12);
			x01 = x01 + x06 | 0;
			x12 = rotl(x12 ^ x01, 8);
			x11 = x11 + x12 | 0;
			x06 = rotl(x06 ^ x11, 7);
			x02 = x02 + x07 | 0;
			x13 = rotl(x13 ^ x02, 16);
			x08 = x08 + x13 | 0;
			x07 = rotl(x07 ^ x08, 12);
			x02 = x02 + x07 | 0;
			x13 = rotl(x13 ^ x02, 8);
			x08 = x08 + x13 | 0;
			x07 = rotl(x07 ^ x08, 7);
			x03 = x03 + x04 | 0;
			x14 = rotl(x14 ^ x03, 16);
			x09 = x09 + x14 | 0;
			x04 = rotl(x04 ^ x09, 12);
			x03 = x03 + x04 | 0;
			x14 = rotl(x14 ^ x03, 8);
			x09 = x09 + x14 | 0;
			x04 = rotl(x04 ^ x09, 7);
		}
		let oi = 0;
		o32[oi++] = x00;
		o32[oi++] = x01;
		o32[oi++] = x02;
		o32[oi++] = x03;
		o32[oi++] = x12;
		o32[oi++] = x13;
		o32[oi++] = x14;
		o32[oi++] = x15;
	};
	exports._hchacha20 = _hchacha20;
	const rotl = (a, b) => {
		return a << b | a >>> 32 - b;
	};
}));
//#endregion
//#region node_modules/.pnpm/@ecies+ciphers@0.2.6_@noble+ciphers@1.3.0/node_modules/@ecies/ciphers/dist/chacha/node.js
var require_node = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.chacha20 = exports.xchacha20 = void 0;
	const utils_1 = require_utils$3();
	const compat_js_1 = require_compat();
	const hchacha_js_1 = require_hchacha();
	const xchacha20 = (key, nonce, AAD) => {
		if (nonce.length !== 24) throw new Error("xchacha20's nonce must be 24 bytes");
		const constants = new Uint32Array([
			1634760805,
			857760878,
			2036477234,
			1797285236
		]);
		const subKey = /* @__PURE__ */ new Uint32Array(8);
		(0, hchacha_js_1._hchacha20)(constants, (0, utils_1.u32)(key), (0, utils_1.u32)(nonce.subarray(0, 16)), subKey);
		const subNonce = /* @__PURE__ */ new Uint8Array(12);
		subNonce.set([
			0,
			0,
			0,
			0
		]);
		subNonce.set(nonce.subarray(16), 4);
		return (0, compat_js_1._compat)("chacha20-poly1305", (0, utils_1.u8)(subKey), subNonce, AAD);
	};
	exports.xchacha20 = xchacha20;
	const chacha20 = (key, nonce, AAD) => {
		if (nonce.length !== 12) throw new Error("chacha20's nonce must be 12 bytes");
		return (0, compat_js_1._compat)("chacha20-poly1305", key, nonce, AAD);
	};
	exports.chacha20 = chacha20;
}));
//#endregion
//#region node_modules/.pnpm/eciesjs@0.5.0/node_modules/eciesjs/dist/utils/symmetric.js
var require_symmetric = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.symDecrypt = exports.symEncrypt = void 0;
	const aes_1 = require_node$1();
	const chacha_1 = require_node();
	const utils_1 = require_utils$3();
	const webcrypto_1 = require_webcrypto();
	const consts_js_1 = require_consts();
	const symEncrypt = (config, key, plainText, AAD) => _exec(_encrypt, config, key, plainText, AAD);
	exports.symEncrypt = symEncrypt;
	const symDecrypt = (config, key, cipherText, AAD) => _exec(_decrypt, config, key, cipherText, AAD);
	exports.symDecrypt = symDecrypt;
	function _exec(callback, config, key, data, AAD) {
		const algorithm = config.symmetricAlgorithm;
		if (algorithm === "aes-256-gcm") return callback(aes_1.aes256gcm, key, data, config.symmetricNonceLength, consts_js_1.AEAD_TAG_LENGTH, AAD);
		else if (algorithm === "xchacha20") return callback(chacha_1.xchacha20, key, data, consts_js_1.XCHACHA20_NONCE_LENGTH, consts_js_1.AEAD_TAG_LENGTH, AAD);
		else throw new Error("Not implemented");
	}
	function _encrypt(func, key, data, nonceLength, tagLength, AAD) {
		const nonce = (0, webcrypto_1.randomBytes)(nonceLength);
		const encrypted = func(key, nonce, AAD).encrypt(data);
		const cipherTextLength = encrypted.length - tagLength;
		const cipherText = encrypted.subarray(0, cipherTextLength);
		const tag = encrypted.subarray(cipherTextLength);
		return (0, utils_1.concatBytes)(nonce, tag, cipherText);
	}
	function _decrypt(func, key, data, nonceLength, tagLength, AAD) {
		const nonce = data.subarray(0, nonceLength);
		const cipher = func(key, Uint8Array.from(nonce), AAD);
		const encrypted = data.subarray(nonceLength);
		const tag = encrypted.subarray(0, tagLength);
		const cipherText = encrypted.subarray(tagLength);
		return cipher.decrypt((0, utils_1.concatBytes)(cipherText, tag));
	}
}));
//#endregion
//#region node_modules/.pnpm/eciesjs@0.5.0/node_modules/eciesjs/dist/utils/index.js
var require_utils = /* @__PURE__ */ __commonJSMin(((exports) => {
	var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
		if (k2 === void 0) k2 = k;
		var desc = Object.getOwnPropertyDescriptor(m, k);
		if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) desc = {
			enumerable: true,
			get: function() {
				return m[k];
			}
		};
		Object.defineProperty(o, k2, desc);
	}) : (function(o, m, k, k2) {
		if (k2 === void 0) k2 = k;
		o[k2] = m[k];
	}));
	var __exportStar = exports && exports.__exportStar || function(m, exports$1) {
		for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports$1, p)) __createBinding(exports$1, m, p);
	};
	Object.defineProperty(exports, "__esModule", { value: true });
	__exportStar(require_elliptic(), exports);
	__exportStar(require_hash(), exports);
	__exportStar(require_hex(), exports);
	__exportStar(require_symmetric(), exports);
}));
//#endregion
//#region node_modules/.pnpm/eciesjs@0.5.0/node_modules/eciesjs/dist/keys/PublicKey.js
var require_PublicKey = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.PublicKey = void 0;
	const utils_1 = require_utils$3();
	const config_js_1 = require_config();
	const index_js_1 = require_utils();
	exports.PublicKey = class PublicKey {
		/**
		* Creates a `PublicKey` instance from a hexadecimal string.
		* @param hex - The hexadecimal string representing the public key.
		* @param curve - (optional) The elliptic curve to use (default: `ECIES_CONFIG.ellipticCurve`).
		* @returns A new `PublicKey` instance.
		*/
		static fromHex(hex, curve = config_js_1.ECIES_CONFIG.ellipticCurve) {
			return new PublicKey((0, index_js_1.hexToPublicKey)(curve, hex), curve);
		}
		get _uncompressed() {
			return this.dataUncompressed !== null ? this.dataUncompressed : this.data;
		}
		/**
		* Constructs a `PublicKey` instance from a byte array.
		* @param data - The byte array representing the public key (compressed or uncompressed if secp256k1).
		* @param curve - (optional) The elliptic curve to use (default: `ECIES_CONFIG.ellipticCurve`).
		*/
		constructor(data, curve = config_js_1.ECIES_CONFIG.ellipticCurve) {
			const compressed = (0, index_js_1.convertPublicKeyFormat)(curve, data, true);
			const uncompressed = (0, index_js_1.convertPublicKeyFormat)(curve, data, false);
			this.data = compressed;
			this.dataUncompressed = compressed.length !== uncompressed.length ? uncompressed : null;
		}
		/**
		* Converts the public key to bytes in compressed or uncompressed format.
		* @param compressed - (default: `true`) Whether to return the public key in compressed or uncompressed format (secp256k1 only).
		* @returns The public key as a Uint8Array.
		*/
		toBytes(compressed = true) {
			return compressed ? this.data : this._uncompressed;
		}
		/**
		* Converts the public key to a hexadecimal string in compressed or uncompressed format.
		* @param compressed - (default: `true`) Whether to return the public key in compressed or uncompressed format (secp256k1 only).
		* @returns The public key as a hexadecimal string.
		*/
		toHex(compressed = true) {
			return (0, utils_1.bytesToHex)(this.toBytes(compressed));
		}
		/**
		* Derives a shared secret from receiver's private key (sk) and ephemeral public key (this).
		* Opposite of `encapsulate`.
		* @see PrivateKey.encapsulate
		*
		* @param sk - Receiver's private key.
		* @param compressed - (default: `false`) Whether to use compressed or uncompressed public keys in the key derivation (secp256k1 only).
		* @returns Shared secret, derived with HKDF-SHA256.
		*/
		decapsulate(sk, compressed = false) {
			const senderPoint = this.toBytes(compressed);
			const sharedPoint = sk.multiply(this, compressed);
			return (0, index_js_1.getSharedKey)(senderPoint, sharedPoint);
		}
		/**
		* Compares this public key with another for equality.
		* @param other - The other `PublicKey` to compare with.
		* @returns `true` if the public keys are equal, `false` otherwise.
		*/
		equals(other) {
			return (0, utils_1.equalBytes)(this.data, other.data);
		}
	};
}));
//#endregion
//#region node_modules/.pnpm/eciesjs@0.5.0/node_modules/eciesjs/dist/keys/PrivateKey.js
var require_PrivateKey = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.PrivateKey = void 0;
	const utils_1 = require_utils$3();
	const config_js_1 = require_config();
	const index_js_1 = require_utils();
	const PublicKey_js_1 = require_PublicKey();
	exports.PrivateKey = class PrivateKey {
		/**
		* Creates a `PrivateKey` instance from a hexadecimal string.
		* @param hex - The hexadecimal string representing the private key.
		* @param curve - (optional) The elliptic curve to use (default: `ECIES_CONFIG.ellipticCurve`).
		* @returns A new `PrivateKey` instance.
		*/
		static fromHex(hex, curve = config_js_1.ECIES_CONFIG.ellipticCurve) {
			return new PrivateKey((0, index_js_1.decodeHex)(hex), curve);
		}
		/**
		* @description
		* In version 0.4.18, `Buffer` is returned when available, otherwise `Uint8Array`.
		* From version 0.5.0, `Uint8Array` is returned instead of `Buffer`.
		*/
		get secret() {
			return this.data;
		}
		/**
		* Constructs a `PrivateKey` instance from a byte array or generates a new random private key if no argument is provided.
		* @param secret - (optional) The byte array representing the private key. If not provided, a new random private key will be generated.
		* @param curve - (optional) The elliptic curve to use (default: `ECIES_CONFIG.ellipticCurve`).
		* @throws Will throw an error if the provided `secret` is not a valid private key for the specified curve.
		*/
		constructor(secret, curve = config_js_1.ECIES_CONFIG.ellipticCurve) {
			this.curve = curve;
			if (secret === void 0) this.data = (0, index_js_1.getValidSecret)(curve);
			else if ((0, index_js_1.isValidPrivateKey)(curve, secret)) this.data = secret;
			else throw new Error("Invalid private key");
			this.publicKey = new PublicKey_js_1.PublicKey((0, index_js_1.getPublicKey)(curve, this.data), curve);
		}
		/**
		* Converts the private key to a hexadecimal string.
		* @returns The private key as a hexadecimal string.
		*/
		toHex() {
			return (0, utils_1.bytesToHex)(this.data);
		}
		/**
		* Derives a shared secret from ephemeral private key (this) and receiver's public key (pk).
		* @description The shared key is 32 bytes, derived with `HKDF-SHA256(senderPoint || sharedPoint)`. See implementation for details.
		*
		* There are some variations in different ECIES implementations:
		* which key derivation function to use, compressed or uncompressed `senderPoint`/`sharedPoint`, whether to include `senderPoint`, etc.
		*
		* Because the entropy of `senderPoint`, `sharedPoint` is enough high[1], we don't need salt to derive keys.
		*
		* [1]: Two reasons: the public keys are "random" bytes (albeit secp256k1 public keys are **not uniformly** random), and ephemeral keys are generated in every encryption.
		*
		* @param pk - Receiver's public key.
		* @param compressed - (default: `false`) Whether to use compressed or uncompressed public keys in the key derivation (secp256k1 only).
		* @returns Shared secret, derived with HKDF-SHA256.
		*/
		encapsulate(pk, compressed = false) {
			const senderPoint = this.publicKey.toBytes(compressed);
			const sharedPoint = this.multiply(pk, compressed);
			return (0, index_js_1.getSharedKey)(senderPoint, sharedPoint);
		}
		/**
		* Multiplies the private key with a public key to derive a shared point.
		* @param pk - The public key to multiply with.
		* @param compressed - (default: `false`) Whether to use compressed or uncompressed public keys (secp256k1 only).
		* @returns The shared point as a Uint8Array.
		*/
		multiply(pk, compressed = false) {
			return (0, index_js_1.getSharedPoint)(this.curve, this.data, pk.toBytes(true), compressed);
		}
		/**
		* Compares this private key with another for equality.
		* @param other - The other `PrivateKey` to compare with.
		* @returns `true` if the private keys are equal, `false` otherwise.
		*/
		equals(other) {
			return (0, utils_1.equalBytes)(this.data, other.data);
		}
	};
}));
//#endregion
//#region node_modules/.pnpm/eciesjs@0.5.0/node_modules/eciesjs/dist/keys/index.js
var require_keys = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.PublicKey = exports.PrivateKey = void 0;
	var PrivateKey_js_1 = require_PrivateKey();
	Object.defineProperty(exports, "PrivateKey", {
		enumerable: true,
		get: function() {
			return PrivateKey_js_1.PrivateKey;
		}
	});
	var PublicKey_js_1 = require_PublicKey();
	Object.defineProperty(exports, "PublicKey", {
		enumerable: true,
		get: function() {
			return PublicKey_js_1.PublicKey;
		}
	});
}));
//#endregion
//#region src/decrypt.ts
var import_dist = (/* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.PublicKey = exports.PrivateKey = exports.ECIES_CONFIG = void 0;
	exports.decrypt = decrypt;
	require_utils$3();
	const config_js_1 = require_config();
	const index_js_1 = require_keys();
	const index_js_2 = require_utils();
	/**
	* Decrypts data with a receiver's private key.
	* @description
	* In version 0.4.18, `Buffer` is returned when available, otherwise `Uint8Array`.
	* From version 0.5.0, this function will always return `Uint8Array`.
	* To preserve the pre-0.5.0 behavior of returning a `Buffer`, wrap the result with `Buffer.from(decrypt(...))`.
	*
	* @param receiverRawSK - Raw private key of the receiver, either as a hex `string` or a `Uint8Array`.
	* @param data - Data to decrypt.
	* @returns Decrypted plain text.
	*/
	function decrypt(receiverRawSK, data, config = config_js_1.ECIES_CONFIG) {
		const curve = config.ellipticCurve;
		const receiverSK = receiverRawSK instanceof Uint8Array ? new index_js_1.PrivateKey(receiverRawSK, curve) : index_js_1.PrivateKey.fromHex(receiverRawSK, curve);
		const keySize = config.ephemeralKeySize;
		const ephemeralPK = new index_js_1.PublicKey(data.subarray(0, keySize), curve);
		const encrypted = data.subarray(keySize);
		const sharedKey = ephemeralPK.decapsulate(receiverSK, config.isHkdfKeyCompressed);
		return (0, index_js_2.symDecrypt)(config, sharedKey, encrypted);
	}
	var config_js_2 = require_config();
	Object.defineProperty(exports, "ECIES_CONFIG", {
		enumerable: true,
		get: function() {
			return config_js_2.ECIES_CONFIG;
		}
	});
	var index_js_3 = require_keys();
	Object.defineProperty(exports, "PrivateKey", {
		enumerable: true,
		get: function() {
			return index_js_3.PrivateKey;
		}
	});
	Object.defineProperty(exports, "PublicKey", {
		enumerable: true,
		get: function() {
			return index_js_3.PublicKey;
		}
	});
})))();
const PREFIX = "encrypted:";
var DecryptError = class extends Error {
	code;
	constructor(code, message, options) {
		super(`[${code}] ${message}`, options);
		this.name = "DecryptError";
		this.code = code;
	}
};
function isEncrypted(value) {
	return value.startsWith(PREFIX);
}
function privateKeysFrom(privateKey) {
	return privateKey.split(",").map((key) => key.trim()).filter((key) => key.length > 0);
}
function classifyDecryptError(error) {
	const message = error instanceof Error ? error.message : String(error);
	const cause = error instanceof Error ? error : void 0;
	if (message === "Invalid private key" || message.startsWith("hex string expected")) return new DecryptError("INVALID_PRIVATE_KEY", "could not decrypt using private key", { cause });
	if (message === "Unsupported state or unable to authenticate data") return new DecryptError("WRONG_PRIVATE_KEY", "could not decrypt using private key", { cause });
	if (message === "second arg must be public key" || message.startsWith("bad point:") || message.includes("was invalid. Expected 33 compressed bytes")) return new DecryptError("MALFORMED_ENCRYPTED_DATA", "could not decrypt using private key", { cause });
	return new DecryptError("DECRYPTION_FAILED", message, { cause });
}
function decrypt(value, privateKey) {
	if (!isEncrypted(value)) return value;
	const privateKeys = privateKeysFrom(privateKey);
	if (privateKeys.length === 0) throw new DecryptError("MISSING_PRIVATE_KEY", "could not decrypt because private key is missing");
	const ciphertext = Buffer$1.from(value.slice(10), "base64");
	let lastError;
	for (const key of privateKeys) try {
		return Buffer$1.from((0, import_dist.decrypt)(Buffer$1.from(key, "hex"), ciphertext)).toString("utf8");
	} catch (error) {
		lastError = classifyDecryptError(error);
	}
	throw lastError ?? new DecryptError("DECRYPTION_FAILED", "could not decrypt using private key");
}
//#endregion
//#region src/export-envs.ts
function isDotenvPublicKey(name) {
	return name === "DOTENV_PUBLIC_KEY" || name.startsWith("DOTENV_PUBLIC_KEY_");
}
function exportEnvs(parsed, selection, privateKey) {
	const names = selection.type === "all" ? Object.keys(parsed).filter((name) => !isDotenvPublicKey(name)) : selection.names;
	if (names.length === 0) throw new Error("env file contains no keys to export");
	if (selection.type === "named") {
		const missing = names.filter((name) => !(name in parsed));
		if (missing.length > 0) throw new Error(`keys not found in env file: ${missing.join(", ")}`);
	}
	const exported = {};
	for (const name of names) {
		const raw = parsed[name] ?? "";
		exported[name] = isEncrypted(raw) ? decrypt(raw, privateKey) : raw;
	}
	return exported;
}
//#endregion
//#region src/parse-env.ts
const LINE = /(?:^|^)\s*(?:export\s+)?([\w.-]+)(?:\s*=\s*?|:\s+?)(\s*'(?:\\'|[^'])*'|\s*"(?:\\"|[^"])*"|\s*`(?:\\`|[^`])*`|[^#\r\n]+)?\s*(?:#.*)?(?:$|$)/gm;
function parseEnv(src) {
	const parsed = {};
	const lines = src.replace(/\r\n?/g, "\n");
	const pattern = new RegExp(LINE.source, LINE.flags);
	let match;
	while ((match = pattern.exec(lines)) != null) {
		const key = match[1];
		if (key === void 0) continue;
		let value = (match[2] ?? "").trim();
		const quote = value[0];
		value = value.replace(/^(['"`])([\s\S]*)\1$/, "$2");
		if (quote === "\"") value = value.replace(/\\n/g, "\n").replace(/\\r/g, "\r");
		parsed[key] = value;
	}
	return parsed;
}
//#endregion
//#region src/parse-keys.ts
function parseKeys(input) {
	const names = input.split(/\r?\n/).map((line) => line.trim()).filter((line) => line.length > 0 && !line.startsWith("#"));
	if (names.length === 0) throw new Error("input \"keys\" is required; use \"*\" to export all keys");
	if (names.includes("*")) {
		if (names.length !== 1) throw new Error("input \"keys\" cannot mix \"*\" with named keys");
		return { type: "all" };
	}
	return {
		type: "named",
		names
	};
}
//#endregion
//#region src/main.ts
async function run() {
	try {
		const privateKey = getInput("private_key", { required: true });
		const file = getInput("file", { required: true });
		const selection = parseKeys(getInput("keys", { required: true }));
		const workspace = process.env.GITHUB_WORKSPACE ?? process.cwd();
		const filePath = path.resolve(workspace, file);
		let source;
		try {
			source = await readFile(filePath, "utf8");
		} catch (error) {
			if (error instanceof Error && "code" in error && error.code === "ENOENT") throw new Error(`env file not found: ${filePath}`);
			throw error;
		}
		const exported = exportEnvs(parseEnv(source), selection, privateKey);
		for (const [name, value] of Object.entries(exported)) {
			if (value.length > 0) setSecret(value);
			setOutput(name, value);
			exportVariable(name, value);
		}
		info(`exported ${Object.keys(exported).length} key(s) from ${file}`);
	} catch (error) {
		if (error instanceof Error) setFailed(error.message);
		else setFailed(String(error));
	}
}
//#endregion
//#region src/index.ts
run();
//#endregion
export {};

//# sourceMappingURL=index.js.map