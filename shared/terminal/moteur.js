/**
 * Moteur du jeu « Terminal » : système de fichiers virtuel, interpréteur de shell (tubes,
 * redirections, variables), une soixantaine de commandes et les défis Linux.
 * Rien ne s'exécute réellement : tout est simulé en mémoire, côté navigateur ou téléphone.
 *
 * Repris de Terminal Quest (https://github.com/brunozapico/terminal_quest), licence MIT,
 * © 2026 Bruno Zapico (voir LICENCE-terminal-quest.txt). Adaptations HESTIM : module ES sans
 * DOM ni stockage navigateur, Linux par défaut, dossier personnel fourni aux validateurs.
 * Fichier généré puis maintenu à la main : les textes français des défis sont dans defis-fr.js.
 */
/* eslint-disable */
const APP_VERSION = "1.0.0";
const FALLBACK_USER = "etudiant";
const normalizeUser = (value) => String(value ?? "").trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 24);
let PLAYER_USER = FALLBACK_USER;
let HOME = `/home/${PLAYER_USER}`;
const setActiveUser = (value) => { PLAYER_USER = normalizeUser(value) || FALLBACK_USER; HOME = `/home/${PLAYER_USER}`; };
const today = () => { const date = new Date(); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; };
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const escapeHTML = (value) => String(value ?? "").replace(/[&<>\"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[char]));
const textLines = (value) => String(value ?? "").replace(/\n$/, "").split("\n");
const basename = (path) => { const parts = path.split("/").filter(Boolean); return parts[parts.length - 1] || "/"; };
const dirname = (path) => { const parts = path.split("/").filter(Boolean); parts.pop(); return "/" + parts.join("/"); };
const modeNumber = (mode) => parseInt(String(mode || "644").replace(/[^0-7]/g, "") || "644", 8);
const formatMode = (mode) => (typeof mode === "number" ? mode : modeNumber(mode)).toString(8).padStart(3, "0").slice(-3);
const formatBytes = (bytes) => bytes < 1024 ? `${bytes}B` : bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)}K` : `${(bytes / (1024 * 1024)).toFixed(1)}M`;
const result = (stdout = "", stderr = "", extra = {}) => ({ stdout, stderr, code: stderr ? 1 : 0, ...extra });

class VirtualFileSystem {
  constructor(options = {}) {
    this.platform = options.platform || "Linux";
    this.hostname = options.hostname || (this.platform === "Linux" ? "hestim-lab" : "terminal-mac");
    this.user = options.user || PLAYER_USER;
    this.home = options.home || `/home/${this.user}`;
    this.root = this.makeDir("/");
    this.putDir("/home");
    this.putDir(this.home);
    this.putDir(`${this.home}/Desktop`);
    this.putDir(`${this.home}/Documents`);
    this.putDir(`${this.home}/Downloads`);
    this.putDir(`${this.home}/projects`);
    this.putDir(`${this.home}/sandbox`);
    this.putDir("/etc");
    this.putDir("/tmp");
    this.putDir("/var");
    this.putDir("/var/log");
  }

  makeDir(name, mode = "755") { return { type: "dir", name, mode, owner: this.user, group: "staff", children: Object.create(null) }; }
  makeFile(name, content = "", mode = "644", extra = {}) { return { type: "file", name, content: String(content), mode, owner: this.user, group: "staff", ...extra }; }
  cloneNode(node) {
    if (!node) return null;
    const copy = { ...node };
    if (node.type === "dir") {
      copy.children = Object.create(null);
      Object.keys(node.children).forEach((key) => { copy.children[key] = this.cloneNode(node.children[key]); });
    }
    if (node.archiveEntries) copy.archiveEntries = JSON.parse(JSON.stringify(node.archiveEntries));
    return copy;
  }
  normalize(input = ".", cwd = this.home) {
    let raw = String(input || ".");
    if (raw === "~") raw = this.home;
    else if (raw.startsWith("~/")) raw = this.home + raw.slice(1);
    else if (!raw.startsWith("/")) raw = `${cwd.replace(/\/$/, "")}/${raw}`;
    const parts = [];
    raw.split("/").forEach((part) => {
      if (!part || part === ".") return;
      if (part === "..") parts.pop();
      else parts.push(part);
    });
    return "/" + parts.join("/");
  }
  _node(abs) {
    if (abs === "/") return this.root;
    let current = this.root;
    for (const part of abs.split("/").filter(Boolean)) {
      if (!current || current.type !== "dir" || !current.children[part]) return null;
      current = current.children[part];
    }
    return current;
  }
  get(path, cwd = this.home) { return this._node(this.normalize(path, cwd)); }
  getAbs(abs) { return this._node(this.normalize(abs, "/")); }
  exists(path, cwd = this.home) { return !!this.get(path, cwd); }
  isDir(path, cwd = this.home) { const node = this.get(path, cwd); return !!node && node.type === "dir"; }
  parentFor(path, cwd = this.home) {
    const abs = this.normalize(path, cwd);
    if (abs === "/") return { abs, parent: null, name: "/" };
    return { abs, parent: this._node(dirname(abs)), name: basename(abs) };
  }
  permission(node, access, user = this.user) {
    if (!node || user === "root") return !!node;
    const owner = node.owner === user;
    const bits = owner
      ? { read: 0o400, write: 0o200, execute: 0o100 }
      : { read: 0o004, write: 0o002, execute: 0o001 };
    return (modeNumber(node.mode) & (bits[access] || 0)) !== 0;
  }
  canModifyParent(parent, user = this.user) {
    return !!parent && parent.type === "dir" && this.permission(parent, "write", user) && this.permission(parent, "execute", user);
  }
  putDir(path, mode = "755") {
    const abs = this.normalize(path, "/");
    if (abs === "/") return this.root;
    let current = this.root;
    for (const part of abs.split("/").filter(Boolean)) {
      if (!current.children[part]) current.children[part] = this.makeDir(part, mode);
      current = current.children[part];
      if (current.type !== "dir") throw new Error(`${abs} is not a directory`);
    }
    return current;
  }
  putFile(path, content = "", mode = "644", extra = {}) {
    const { parent, name } = this.parentFor(path, "/");
    if (!parent || parent.type !== "dir") throw new Error(`parent is not a directory for ${path}`);
    parent.children[name] = this.makeFile(name, content, mode, extra);
    return parent.children[name];
  }
  mkdir(path, cwd, recursive = false, user = this.user) {
    const abs = this.normalize(path, cwd);
    if (abs === "/") return { ok: false, error: "File exists" };
    const parts = abs.split("/").filter(Boolean);
    let current = this.root;
    for (let index = 0; index < parts.length; index += 1) {
      const part = parts[index];
      if (!this.permission(current, "execute", user)) return { ok: false, error: "Permission denied" };
      if (!current.children[part]) {
        if (!recursive && index !== parts.length - 1) return { ok: false, error: "No such file or directory" };
        if (!this.canModifyParent(current, user)) return { ok: false, error: "Permission denied" };
        current.children[part] = this.makeDir(part);
      } else if (current.children[part].type !== "dir") {
        return { ok: false, error: "Not a directory" };
      } else if (!recursive && index === parts.length - 1) {
        return { ok: false, error: "File exists" };
      }
      current = current.children[part];
    }
    return { ok: true };
  }
  touch(path, cwd, user = this.user) {
    const { parent, name } = this.parentFor(path, cwd);
    if (!this.canModifyParent(parent, user)) return { ok: false, error: "Permission denied" };
    if (!parent.children[name]) parent.children[name] = this.makeFile(name);
    else if (parent.children[name].type === "dir") return { ok: false, error: "Is a directory" };
    return { ok: true };
  }
  write(path, cwd, content, append = false, user = this.user) {
    const { parent, name } = this.parentFor(path, cwd);
    if (!this.canModifyParent(parent, user)) return { ok: false, error: "Permission denied" };
    if (parent.children[name] && parent.children[name].type === "dir") return { ok: false, error: "Is a directory" };
    if (parent.children[name] && !this.permission(parent.children[name], "write", user)) return { ok: false, error: "Permission denied" };
    if (!parent.children[name]) parent.children[name] = this.makeFile(name, content);
    else parent.children[name].content = append ? parent.children[name].content + content : content;
    return { ok: true };
  }
  remove(path, cwd, recursive = false, force = false, user = this.user) {
    const record = this.parentFor(path, cwd);
    const node = this.get(path, cwd);
    if (!node) return force ? { ok: true } : { ok: false, error: "No such file or directory" };
    if (record.abs === "/") return { ok: false, error: "Permission denied" };
    if (node.type === "dir" && !recursive) return { ok: false, error: "Is a directory" };
    if (node.type === "dir" && Object.keys(node.children).length && !recursive) return { ok: false, error: "Directory not empty" };
    if (!this.canModifyParent(record.parent, user)) return { ok: false, error: "Permission denied" };
    delete record.parent.children[record.name];
    return { ok: true };
  }
  rmdir(path, cwd, user = this.user) {
    const node = this.get(path, cwd);
    if (!node) return { ok: false, error: "No such file or directory" };
    if (node.type !== "dir") return { ok: false, error: "Not a directory" };
    if (Object.keys(node.children).length) return { ok: false, error: "Directory not empty" };
    const record = this.parentFor(path, cwd);
    if (!this.canModifyParent(record.parent, user)) return { ok: false, error: "Permission denied" };
    delete record.parent.children[record.name];
    return { ok: true };
  }
  copy(source, destination, cwd, recursive = false, user = this.user) {
    const sourceAbs = this.normalize(source, cwd);
    const sourceNode = this._node(sourceAbs);
    if (!sourceNode) return { ok: false, error: "No such file or directory" };
    if (sourceNode.type === "dir" && !recursive) return { ok: false, error: "omitting directory" };
    if (sourceNode.type === "file" && !this.permission(sourceNode, "read", user)) return { ok: false, error: "Permission denied" };
    if (sourceNode.type === "dir" && (!this.permission(sourceNode, "read", user) || !this.permission(sourceNode, "execute", user))) return { ok: false, error: "Permission denied" };
    let destinationAbs = this.normalize(destination, cwd);
    const destinationNode = this._node(destinationAbs);
    if (destinationNode && destinationNode.type === "dir") destinationAbs = `${destinationAbs.replace(/\/$/, "")}/${basename(sourceAbs)}`;
    const parent = this._node(dirname(destinationAbs));
    if (!parent) return { ok: false, error: "No such file or directory" };
    if (!this.canModifyParent(parent, user)) return { ok: false, error: "Permission denied" };
    const copy = this.cloneNode(sourceNode);
    copy.name = basename(destinationAbs);
    parent.children[copy.name] = copy;
    return { ok: true };
  }
  move(source, destination, cwd, user = this.user) {
    const sourceAbs = this.normalize(source, cwd);
    const sourceNode = this._node(sourceAbs);
    if (!sourceNode) return { ok: false, error: "No such file or directory" };
    let destinationAbs = this.normalize(destination, cwd);
    const destinationNode = this._node(destinationAbs);
    if (destinationNode && destinationNode.type === "dir") destinationAbs = `${destinationAbs.replace(/\/$/, "")}/${basename(sourceAbs)}`;
    const parent = this._node(dirname(destinationAbs));
    if (!parent) return { ok: false, error: "No such file or directory" };
    if (!this.canModifyParent(parent, user)) return { ok: false, error: "Permission denied" };
    const sourceRecord = this.parentFor(sourceAbs, "/");
    if (!this.canModifyParent(sourceRecord.parent, user)) return { ok: false, error: "Permission denied" };
    if (sourceRecord.parent === parent && sourceRecord.name === basename(destinationAbs)) return { ok: true };
    const moved = this.cloneNode(sourceNode);
    moved.name = basename(destinationAbs);
    parent.children[moved.name] = moved;
    delete sourceRecord.parent.children[sourceRecord.name];
    return { ok: true };
  }
  list(path, cwd, all = false, user = this.user) {
    const abs = this.normalize(path, cwd);
    const node = this._node(abs);
    if (!node) return { ok: false, error: "No such file or directory" };
    if (node.type === "file") return { ok: true, entries: [{ name: basename(abs), node }] };
    if (!this.permission(node, "read", user) || !this.permission(node, "execute", user)) return { ok: false, error: "Permission denied" };
    let names = Object.keys(node.children).sort((a, b) => a.localeCompare(b));
    if (all) names = [".", "..", ...names];
    return { ok: true, entries: names.map((name) => ({ name, node: name === "." ? node : name === ".." ? this._node(dirname(abs)) || this.root : node.children[name] })) };
  }
  read(path, cwd, user = this.user) {
    const node = this.get(path, cwd);
    if (!node) return { ok: false, error: "No such file or directory" };
    if (node.type !== "file") return { ok: false, error: "Is a directory" };
    if (!this.permission(node, "read", user)) return { ok: false, error: "Permission denied" };
    return { ok: true, content: node.content };
  }
  chmod(path, cwd, mode, user = this.user) {
    const node = this.get(path, cwd);
    if (!node) return { ok: false, error: "No such file or directory" };
    if (user !== "root" && node.owner !== user) return { ok: false, error: "Operation not permitted" };
    if (mode === "+x") node.mode = formatMode(modeNumber(node.mode) | 0o111);
    else if (mode === "-x") node.mode = formatMode(modeNumber(node.mode) & ~0o111);
    else if (/^[0-7]{3,4}$/.test(mode)) node.mode = mode.slice(-3);
    else return { ok: false, error: "invalid mode" };
    return { ok: true };
  }
  size(node) {
    if (!node) return 0;
    if (node.type === "file") return node.content.length;
    return Object.values(node.children).reduce((total, child) => total + this.size(child), 0);
  }
  collectFiles(path, cwd, includeDirectories = false) {
    const abs = this.normalize(path, cwd);
    const start = this._node(abs);
    const found = [];
    if (!start) return found;
    const visit = (node, nodeAbs) => {
      if (node.type === "file") found.push({ abs: nodeAbs, node });
      else {
        if (includeDirectories) found.push({ abs: nodeAbs, node });
        Object.keys(node.children).sort().forEach((name) => visit(node.children[name], `${nodeAbs === "/" ? "" : nodeAbs}/${name}`));
      }
    };
    visit(start, abs);
    return found;
  }
  snapshot(path, cwd) {
    const abs = this.normalize(path, cwd);
    const node = this._node(abs);
    if (!node) return null;
    const rootName = basename(abs);
    const entries = [];
    const visit = (current, currentAbs, relative) => {
      if (current.type === "file") entries.push({ path: relative, type: "file", content: current.content, mode: current.mode });
      else {
        entries.push({ path: relative, type: "dir", mode: current.mode });
        Object.keys(current.children).sort().forEach((name) => visit(current.children[name], `${currentAbs === "/" ? "" : currentAbs}/${name}`, `${relative}/${name}`));
      }
    };
    visit(node, abs, rootName);
    return entries;
  }
  restore(entries, destination, cwd) {
    const base = this.normalize(destination || ".", cwd);
    this.putDir(base);
    entries.filter((entry) => entry.type === "dir").sort((a, b) => a.path.length - b.path.length).forEach((entry) => this.putDir(`${base}/${entry.path}`, entry.mode));
    entries.filter((entry) => entry.type === "file").forEach((entry) => this.putFile(`${base}/${entry.path}`, entry.content, entry.mode));
  }
}

function makeBaseScenario(options = {}) {
  const fs = new VirtualFileSystem(options);
  fs.putFile(`${fs.home}/welcome.txt`, "Welcome to your virtual terminal.\nYou can experiment safely here.\n");
  fs.putFile(`${fs.home}/notes.txt`, "Remember: orient yourself before changing anything.\n");
  fs.putFile(`${fs.home}/projects/README.md`, "# projects\nA safe place to practice.\n");
  fs.putFile(`${fs.home}/projects/todo.txt`, "learn terminal\npractice pipes\nreview permissions\n");
  fs.putFile(`${fs.home}/.profile`, "export EDITOR=vim\n");
  const processes = options.processes || defaultProcesses(fs.platform === "Linux" ? "linux" : "mac", fs.user);
  return { fs, cwd: options.cwd || fs.home, processes, env: { EDITOR: "vim", LANG: "fr_FR.UTF-8" }, remoteFactory: options.remoteFactory || null };
}
function makePracticeScenario() {
  const scenario = makeBaseScenario();
  scenario.cwd = `${scenario.fs.home}/sandbox`;
  scenario.fs.putFile(`${scenario.fs.home}/sandbox/README.txt`, "Practice is disposable.\n");
  return scenario;
}
function makeRemoteScenario(host = "raspberrypi", user = "learner", options = {}) {
  const fs = new VirtualFileSystem({ platform: "Linux", hostname: host, user, home: `/home/${user}` });
  fs.putDir(`/home/${user}`);
  fs.putDir("/var/www");
  fs.putFile("/var/www/index.html", "<h1>server</h1>\n");
  fs.putFile("/var/log/system.log", "INFO boot complete\nINFO ssh ready\n");
  fs.putFile("/var/log/server.log", "INFO listening on :8080\nERROR database timeout\nINFO retry scheduled\nERROR database timeout\n");
  fs.putFile("/var/log/auth.log", `INFO accepted publickey for ${user}\n`);
  fs.putFile(`/home/${user}/README.txt`, "Remote Linux shell.\n");
  return { fs, cwd: options.cwd || `/home/${user}`, processes: options.processes || defaultProcesses("server"), env: { LANG: "C.UTF-8" } };
}
function defaultProcesses(kind = "mac", user = PLAYER_USER) {
  if (kind === "server") return [
    { pid: 1, user: "root", cpu: "0.0", mem: "0.1", command: "systemd" },
    { pid: 742, user: "root", cpu: "0.3", mem: "1.2", command: "sshd" },
    { pid: 2451, user, cpu: "72.4", mem: "8.1", command: "node server.js" },
    { pid: 2490, user, cpu: "1.2", mem: "0.8", command: "tail -f server.log" }
  ];
  if (kind === "linux") return [
    { pid: 1, user: "root", cpu: "0.0", mem: "0.1", command: "systemd" },
    { pid: 612, user: "root", cpu: "0.2", mem: "0.7", command: "sshd" },
    { pid: 931, user, cpu: "1.4", mem: "1.3", command: "bash" },
    { pid: 840, user, cpu: "0.4", mem: "3.2", command: "hestim-planner" }
  ];
  return [
    { pid: 1, user: "root", cpu: "0.0", mem: "0.1", command: "launchd" },
    { pid: 412, user, cpu: "2.0", mem: "1.1", command: "zsh" },
    { pid: 840, user, cpu: "0.4", mem: "3.2", command: "hestim-planner" }
  ];
}

function tokenize(line) {
  const tokens = [];
  let value = "";
  let quote = null;
  let escaped = false;
  let sawSingle = false;
  const flush = () => { if (value !== "" || tokens.length === 0 || sawSingle) tokens.push({ value, expand: !sawSingle }); value = ""; sawSingle = false; };
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (escaped) { value += char; escaped = false; continue; }
    if (char === "\\" && quote !== "'") { escaped = true; continue; }
    if (quote) {
      if (char === quote) quote = null;
      else { value += char; if (quote === "'") sawSingle = true; }
      continue;
    }
    if (char === "'" || char === '"') { quote = char; if (char === "'") sawSingle = true; continue; }
    if (/\s/.test(char)) { if (value !== "" || sawSingle) flush(); continue; }
    if (char === "|" || char === ">") {
      if (value !== "" || sawSingle) flush();
      if (char === ">" && line[index + 1] === ">") { tokens.push({ value: ">>", expand: false }); index += 1; }
      else tokens.push({ value: char, expand: false });
      continue;
    }
    value += char;
  }
  if (escaped) value += "\\";
  if (quote) return { error: "unexpected end of file while looking for matching quote" };
  if (value !== "" || sawSingle) flush();
  return { tokens };
}
function parseShell(line) {
  const tokenized = tokenize(line);
  if (tokenized.error) return tokenized;
  const commands = [];
  let current = { tokens: [], redirect: null };
  const finish = () => { if (current.tokens.length) commands.push(current); current = { tokens: [], redirect: null }; };
  for (let index = 0; index < tokenized.tokens.length; index += 1) {
    const token = tokenized.tokens[index];
    if (token.value === "|") {
      if (!current.tokens.length) return { error: "syntax error near unexpected token `|'" };
      finish();
    } else if (token.value === ">" || token.value === ">>") {
      const target = tokenized.tokens[index + 1];
      if (!target || ["|", ">", ">>"].includes(target.value)) return { error: "syntax error near unexpected token `newline'" };
      current.redirect = { append: token.value === ">>", target };
      index += 1;
    } else current.tokens.push(token);
  }
  finish();
  return { commands };
}
function expandVariables(value, env) {
  return String(value).replace(/\$\{([A-Za-z_][A-Za-z0-9_]*)\}|\$([A-Za-z_][A-Za-z0-9_]*)/g, (_, brace, plain) => env[brace || plain] ?? "");
}
function flagSet(args) {
  const flags = new Set();
  const rest = [];
  args.forEach((arg) => {
    if (arg === "--") return;
    if (/^-[^-].+/.test(arg)) arg.slice(1).split("").forEach((flag) => flags.add(flag));
    else if (/^-[^-]$/.test(arg)) flags.add(arg.slice(1));
    else rest.push(arg);
  });
  return { flags, rest };
}
function wildcardMatch(pattern, value) {
  const regex = "^" + String(pattern).replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\?/g, ".") + "$";
  return new RegExp(regex, "i").test(value);
}

const COMMANDS = Object.create(null);
const registerCommand = (name, definition) => { COMMANDS[name] = { name, category: "Shell", platforms: ["macOS + Linux"], examples: [], options: [], ...definition }; };
const commandError = (name, message) => result("", `${name}: ${message}\n`);
const readOne = (ctx, path) => ctx.fs.read(path, ctx.cwd, ctx.engine.user);
const readSources = (ctx, args, stdin = "") => {
  if (!args.length) return { ok: true, content: stdin, names: [] };
  let content = "";
  const names = [];
  for (const path of args) {
    const read = readOne(ctx, path);
    if (!read.ok) return { ok: false, error: `${path}: ${read.error}` };
    content += read.content;
    names.push(path);
  }
  return { ok: true, content, names };
};
const modeString = (node) => `${node.type === "dir" ? "d" : "-"}${modeNumber(node.mode) & 0o400 ? "r" : "-"}${modeNumber(node.mode) & 0o200 ? "w" : "-"}${modeNumber(node.mode) & 0o100 ? "x" : "-"}${modeNumber(node.mode) & 0o040 ? "r" : "-"}${modeNumber(node.mode) & 0o020 ? "w" : "-"}${modeNumber(node.mode) & 0o010 ? "x" : "-"}${modeNumber(node.mode) & 0o004 ? "r" : "-"}${modeNumber(node.mode) & 0o002 ? "w" : "-"}${modeNumber(node.mode) & 0o001 ? "x" : "-"}`;
const ctxPath = (ctx, path) => ctx.fs.normalize(path, ctx.cwd);

class TerminalEngine {
  constructor(scenario = makeBaseScenario()) {
    this.fs = scenario.fs;
    this.localFs = scenario.fs;
    this.cwd = scenario.cwd || this.fs.home;
    this.localCwd = this.cwd;
    this.remoteFactory = scenario.remoteFactory;
    this.remoteHost = null;
    this.remoteUser = null;
    this.remoteSessions = Object.create(null);
    this.processes = scenario.processes || defaultProcesses(this.fs.platform === "Linux" ? "linux" : "mac", this.fs.user);
    this.baseEnv = { USER: this.fs.user, HOME: this.fs.home, PATH: "/usr/local/bin:/usr/bin:/bin", SHELL: this.fs.platform === "Linux" ? "/bin/bash" : "/bin/zsh", ...scenario.env };
    this.clipboard = "";
    this.history = [];
    this.historyIndex = 0;
    this.lastExecution = result();
  }
  get platform() { return this.fs.platform; }
  get user() { return this.remoteUser || this.localFs.user; }
  get env() { return { ...this.baseEnv, USER: this.user, HOME: this.fs.home, HOSTNAME: this.fs.hostname, OSTYPE: this.fs.platform === "Linux" ? "linux-gnu" : "darwin" }; }
  get prompt() {
    const home = this.fs.home;
    let display = this.cwd === home ? "~" : this.cwd.startsWith(`${home}/`) ? `~${this.cwd.slice(home.length)}` : this.cwd;
    return `${this.user}@${this.fs.hostname}:${display} $`;
  }
  makeRemoteSession(host, user) {
    if (!this.remoteSessions[host]) {
      const scenario = this.remoteFactory ? this.remoteFactory(host, user) : makeRemoteScenario(host, user);
      this.remoteSessions[host] = { fs: scenario.fs, cwd: scenario.cwd || scenario.fs.home, processes: scenario.processes || defaultProcesses("server", user), env: scenario.env || {} };
    }
    return this.remoteSessions[host];
  }
  connectRemote(user, host) {
    if (this.remoteHost) return { ok: false, error: "Already connected. Use exit first." };
    this.localFs = this.fs;
    this.localCwd = this.cwd;
    const session = this.makeRemoteSession(host, user);
    this.fs = session.fs;
    this.cwd = session.cwd;
    this.processes = session.processes;
    this.remoteHost = host;
    this.remoteUser = user;
    return { ok: true };
  }
  disconnectRemote() {
    if (!this.remoteHost) return { ok: false, error: "Not connected to a remote host." };
    const session = this.remoteSessions[this.remoteHost];
    session.cwd = this.cwd;
    session.processes = this.processes;
    this.fs = this.localFs;
    this.cwd = this.localCwd;
    this.remoteHost = null;
    this.remoteUser = null;
    this.processes = defaultProcesses(this.fs.platform === "Linux" ? "linux" : "mac", this.fs.user);
    return { ok: true };
  }
  context(stdin = "") { return { engine: this, fs: this.fs, cwd: this.cwd, stdin, env: this.env, remote: !!this.remoteHost, platform: this.platform }; }
  executeLine(line) {
    const raw = String(line || "").trim();
    if (!raw) return result();
    this.history.push(raw);
    this.historyIndex = this.history.length;
    const parsed = parseShell(raw);
    if (parsed.error) { this.lastExecution = commandError("shell", parsed.error); return this.lastExecution; }
    let stdin = "";
    let stdout = "";
    let stderr = "";
    let clear = false;
    for (let index = 0; index < parsed.commands.length; index += 1) {
      const command = parsed.commands[index];
      const tokens = command.tokens;
      if (!tokens.length) continue;
      const name = tokens[0].expand ? expandVariables(tokens[0].value, this.env) : tokens[0].value;
      const args = tokens.slice(1).map((token) => token.expand ? expandVariables(token.value, this.env) : token.value);
      const entry = COMMANDS[name];
      let commandResult;
      if (!entry) commandResult = commandError(name, `command not found: ${name}`);
      else commandResult = entry.execute(args, this.context(stdin));
      stdout = commandResult.stdout || "";
      stderr += commandResult.stderr || "";
      clear = clear || !!commandResult.clear;
      if (command.redirect && stdout) {
        const target = command.redirect.target.expand ? expandVariables(command.redirect.target.value, this.env) : command.redirect.target.value;
        const written = this.fs.write(target, this.cwd, stdout, command.redirect.append, this.user);
        if (!written.ok) stderr += `${target}: ${written.error}\n`;
        stdout = "";
      }
      stdin = stdout;
    }
    this.lastExecution = result(stdout, stderr, { clear });
    return this.lastExecution;
  }
  autocomplete(line) {
    const raw = String(line || "");
    const match = raw.match(/(?:^|\s)([^\s]*)$/);
    if (!match) return { value: raw, suggestions: [] };
    const token = match[1];
    const start = raw.length - token.length;
    const before = raw.slice(0, start);
    const firstWord = raw.trim().split(/\s+/)[0] || "";
    if (!before.trim() && !token.includes("/") && !token.startsWith("~")) {
      const names = Object.keys(COMMANDS).filter((name) => name.startsWith(token)).sort();
      return { value: names.length === 1 ? raw.slice(0, start) + names[0] : raw, suggestions: names };
    }
    if (!["cd", "ls", "cat", "touch", "rm", "cp", "mv", "find", "head", "tail", "less", "chmod", "rmdir", "du", "tar", "zip", "unzip", "grep"].includes(firstWord)) return { value: raw, suggestions: [] };
    const slash = token.lastIndexOf("/");
    const dirToken = slash >= 0 ? token.slice(0, slash + 1) : "";
    const prefix = slash >= 0 ? token.slice(slash + 1) : token;
    const dirPath = dirToken || ".";
    const listing = this.fs.list(dirPath, this.cwd);
    if (!listing.ok) return { value: raw, suggestions: [] };
    const names = listing.entries.filter((entry) => entry.name !== "." && entry.name !== ".." && entry.name.startsWith(prefix)).map((entry) => entry.name + (entry.node.type === "dir" ? "/" : ""));
    const values = names.map((name) => raw.slice(0, start) + dirToken + name);
    return { value: values.length === 1 ? values[0] : raw, suggestions: values };
  }
}

function formatList(entries, longFormat) {
  if (!longFormat) return entries.map((entry) => entry.name).join("\n") + (entries.length ? "\n" : "");
  const total = entries.reduce((sum, entry) => sum + (entry.node.type === "file" ? entry.node.content.length : 0), 0);
  const lines = [`total ${Math.max(1, Math.ceil(total / 512))}`];
  entries.forEach((entry) => {
    const node = entry.node;
    const size = node.type === "file" ? node.content.length : Object.keys(node.children).length;
    lines.push(`${modeString(node)}  ${node.owner}  ${node.group}  ${String(size).padStart(5, " ")}  ${entry.name}`);
  });
  return lines.join("\n") + "\n";
}
function parseCountArgs(args) {
  let count = 10;
  const files = [];
  for (let index = 0; index < args.length; index += 1) {
    if (args[index] === "-n") count = Number(args[++index]) || 10;
    else if (/^-n\d+$/.test(args[index])) count = Number(args[index].slice(2));
    else files.push(args[index]);
  }
  return { count, files };
}
function fileOutput(ctx, args, transform) {
  const source = readSources(ctx, args, ctx.stdin);
  if (!source.ok) return commandError("file", source.error);
  return result(transform(source.content));
}
function outputPathForFind(abs, startToken, startAbs) {
  if (startToken.startsWith("/")) return abs;
  if (startToken === ".") return abs === startAbs ? "." : `.${abs.slice(startAbs.length)}`;
  return abs === startAbs ? startToken : `${startToken.replace(/\/$/, "")}${abs.slice(startAbs.length)}`;
}
function processTable(processes, compact = false) {
  const rows = processes.filter((process) => !process.killed);
  const header = compact ? "  PID TTY           TIME CMD" : "USER       PID  %CPU %MEM COMMAND";
  const body = rows.map((process) => compact
    ? `${String(process.pid).padStart(5, " ")} ttys001    00:00 ${process.command}`
    : `${process.user.padEnd(8, " ")} ${String(process.pid).padStart(5, " ")} ${String(process.cpu).padStart(5, " ")} ${String(process.mem).padStart(4, " ")} ${process.command}`);
  return [header, ...body].join("\n") + "\n";
}

registerCommand("pwd", {
  category: "Navigation", description: "Print the directory you are currently in.", examples: ["pwd"], help: "pwd\n\nPrint the absolute path of the current working directory."
  , execute: (_args, ctx) => result(`${ctx.cwd}\n`)
});
registerCommand("ls", {
  category: "Navigation", description: "List files and directories.", examples: ["ls", "ls -la"], options: ["-l long format", "-a include hidden entries"], help: "ls [options] [path]\n\nList the contents of a directory. -a includes names beginning with a dot; -l adds metadata.",
  execute: (args, ctx) => {
    const { flags, rest } = flagSet(args);
    const targets = rest.length ? rest : ["."];
      let output = "";
      let stderr = "";
      targets.forEach((target, index) => {
        const listing = ctx.fs.list(target, ctx.cwd, flags.has("a"), ctx.engine.user);
        if (!listing.ok) { stderr += `ls: ${target}: ${listing.error}\n`; return; }
        if (targets.length > 1) output += `${target}:\n`;
        output += formatList(listing.entries, flags.has("l"));
        if (targets.length > 1 && index < targets.length - 1) output += "\n";
      });
      return result(output, stderr);
  }
});
registerCommand("clear", {
  category: "Shell", description: "Clear the simulated terminal screen.", examples: ["clear"], help: "clear\n\nClear the visible terminal transcript. Ctrl-L does the same thing.",
  execute: () => result("", "", { clear: true })
});
registerCommand("whoami", {
  category: "System", description: "Print the current username.", examples: ["whoami"], help: "whoami\n\nPrint the effective user for this simulated session.",
  execute: (_args, ctx) => result(`${ctx.engine.user}\n`)
});
registerCommand("cd", {
  category: "Navigation", description: "Change the current working directory.", examples: ["cd projects", "cd ..", "cd ~"], options: [".. parent directory", "~ home directory", "/ filesystem root"], help: "cd [directory]\n\nMove through the virtual filesystem. Paths may be relative or absolute.",
  execute: (args, ctx) => {
    const target = args[0] || "~";
    const node = ctx.fs.get(target, ctx.cwd);
    if (!node) return commandError("cd", `no such file or directory: ${target}`);
    if (node.type !== "dir") return commandError("cd", `not a directory: ${target}`);
    if (!ctx.fs.permission(node, "execute", ctx.engine.user)) return commandError("cd", `permission denied: ${target}`);
    ctx.engine.cwd = ctx.fs.normalize(target, ctx.cwd);
    return result();
  }
});
registerCommand("mkdir", {
  category: "Files", description: "Create one or more directories.", examples: ["mkdir projects", "mkdir -p src/components"], options: ["-p create parents as needed"], help: "mkdir [-p] directory...\n\nCreate directories. -p also creates missing parent directories.",
  execute: (args, ctx) => {
    const { flags, rest } = flagSet(args);
    if (!rest.length) return commandError("mkdir", "missing operand");
    let stderr = "";
    rest.forEach((path) => { const made = ctx.fs.mkdir(path, ctx.cwd, flags.has("p"), ctx.engine.user); if (!made.ok) stderr += `mkdir: cannot create directory '${path}': ${made.error}\n`; });
    return result("", stderr);
  }
});
registerCommand("rmdir", {
  category: "Files", description: "Remove empty directories.", examples: ["rmdir old-folder"], help: "rmdir directory...\n\nRemove directories only when they are empty.",
  execute: (args, ctx) => {
    if (!args.length) return commandError("rmdir", "missing operand");
    let stderr = "";
    args.forEach((path) => { const removed = ctx.fs.rmdir(path, ctx.cwd, ctx.engine.user); if (!removed.ok) stderr += `rmdir: failed to remove '${path}': ${removed.error}\n`; });
    return result("", stderr);
  }
});
registerCommand("touch", {
  category: "Files", description: "Create an empty file if it does not exist.", examples: ["touch README.md"], help: "touch file...\n\nCreate empty files. In this simulation, timestamps are not modeled.",
  execute: (args, ctx) => {
    if (!args.length) return commandError("touch", "missing file operand");
    let stderr = "";
    args.forEach((path) => { const made = ctx.fs.touch(path, ctx.cwd, ctx.engine.user); if (!made.ok) stderr += `touch: ${path}: ${made.error}\n`; });
    return result("", stderr);
  }
});
registerCommand("cp", {
  category: "Files", description: "Copy files or directories.", examples: ["cp notes.txt notes-copy.txt", "cp -r src backup"], options: ["-r copy directories recursively"], help: "cp [-r] source destination\n\nCopy a file, or a directory when -r is supplied.",
  execute: (args, ctx) => {
    const { flags, rest } = flagSet(args);
    if (rest.length < 2) return commandError("cp", "missing destination file operand");
    const destination = rest[rest.length - 1];
    let stderr = "";
    rest.slice(0, -1).forEach((source) => { const copied = ctx.fs.copy(source, destination, ctx.cwd, flags.has("r"), ctx.engine.user); if (!copied.ok) stderr += `cp: ${source}: ${copied.error}\n`; });
    return result("", stderr);
  }
});
registerCommand("mv", {
  category: "Files", description: "Move or rename files and directories.", examples: ["mv draft.txt final.txt", "mv folder ~/projects"], help: "mv source destination\n\nMove or rename a filesystem entry.",
  execute: (args, ctx) => {
    if (args.length < 2) return commandError("mv", "missing destination file operand");
    const destination = args[args.length - 1];
    let stderr = "";
    args.slice(0, -1).forEach((source) => { const moved = ctx.fs.move(source, destination, ctx.cwd, ctx.engine.user); if (!moved.ok) stderr += `mv: ${source}: ${moved.error}\n`; });
    return result("", stderr);
  }
});
registerCommand("rm", {
  category: "Files", description: "Remove files; recursive removal is simulated safely.", examples: ["rm old.txt", "rm -r build"], options: ["-r recursive", "-f ignore missing entries"], help: "rm [-rf] path...\n\nRemove entries. There is no traditional trash can in Unix; this game keeps the damage virtual.",
  execute: (args, ctx) => {
    const { flags, rest } = flagSet(args);
    if (!rest.length) return commandError("rm", "missing operand");
    let stderr = "";
    let warning = flags.has("r") && flags.has("f") ? "warning: rm -rf is powerful; here it only affects this virtual filesystem.\n" : "";
    rest.forEach((path) => { const removed = ctx.fs.remove(path, ctx.cwd, flags.has("r"), flags.has("f"), ctx.engine.user); if (!removed.ok) stderr += `rm: ${path}: ${removed.error}\n`; });
    return result(warning, stderr);
  }
});
registerCommand("cat", {
  category: "Text", description: "Print file contents.", examples: ["cat README.md", "cat users.txt | grep admin"], options: ["-n number output lines"], help: "cat [-n] [file...]\n\nRead files from top to bottom. With no file, pass stdin through.",
  execute: (args, ctx) => {
    const { flags, rest } = flagSet(args);
    const source = readSources(ctx, rest, ctx.stdin);
    if (!source.ok) return commandError("cat", source.error);
    let content = source.content;
    if (flags.has("n")) content = textLines(content).map((line, index) => `${String(index + 1).padStart(6, " ")}  ${line}`).join("\n") + (content.endsWith("\n") ? "\n" : "");
    return result(content);
  }
});
registerCommand("head", {
  category: "Text", description: "Show the beginning of a file.", examples: ["head -n 3 server.log"], options: ["-n number of lines"], help: "head [-n number] [file]\n\nPrint the first lines of a file.",
  execute: (args, ctx) => { const parsed = parseCountArgs(args); return fileOutput(ctx, parsed.files, (content) => textLines(content).slice(0, parsed.count).join("\n") + "\n"); }
});
registerCommand("tail", {
  category: "Text", description: "Show the end of a file.", examples: ["tail -n 2 server.log"], options: ["-n number of lines"], help: "tail [-n number] [file]\n\nPrint the last lines of a file.",
  execute: (args, ctx) => { const parsed = parseCountArgs(args); return fileOutput(ctx, parsed.files, (content) => textLines(content).slice(-parsed.count).join("\n") + "\n"); }
});
registerCommand("less", {
  category: "Text", description: "Inspect a file page by page (simulated as a readable view).", examples: ["less README.md"], help: "less file\n\nThis educational terminal prints the file and marks the end of the view; a real pager would wait for navigation.",
  execute: (args, ctx) => { if (!args.length) return commandError("less", "missing file operand"); const source = readOne(ctx, args[0]); return source.ok ? result(`[less] ${args[0]}\n${source.content}[end]\n`) : commandError("less", `${args[0]}: ${source.error}`); }
});
registerCommand("echo", {
  category: "Shell", description: "Print text or environment variables.", examples: ["echo hello", "echo $HOME > home.txt"], options: ["-n omit the final newline"], help: "echo [-n] text...\n\nPrint arguments. Variables such as $HOME are expanded before execution.",
  execute: (args) => { const noNewline = args[0] === "-n"; const values = noNewline ? args.slice(1) : args; return result(values.join(" ") + (noNewline ? "" : "\n")); }
});
registerCommand("grep", {
  category: "Search", description: "Search text for a pattern.", examples: ["grep ERROR server.log", "grep -ir admin logs/"], options: ["-i ignore case", "-r recursive", "-n line numbers"], help: "grep [-irn] pattern [file...]\n\nSearch lines for a pattern. Use -r to descend through directories and -i to ignore case.",
  execute: (args, ctx) => {
    const { flags, rest } = flagSet(args);
    if (!rest.length) return commandError("grep", "missing search pattern");
    const pattern = rest.shift();
    let matcher;
    try { matcher = new RegExp(pattern, flags.has("i") ? "i" : ""); } catch (_error) { matcher = new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), flags.has("i") ? "i" : ""); }
    const targets = rest.length ? rest : [];
    const records = [];
    if (!targets.length) records.push({ name: "", content: ctx.stdin });
    targets.forEach((target) => {
      const node = ctx.fs.get(target, ctx.cwd);
      if (!node) records.push({ error: `${target}: No such file or directory` });
      else if (node.type === "dir" && !flags.has("r")) records.push({ error: `${target}: Is a directory` });
      else if (node.type === "dir") ctx.fs.collectFiles(target, ctx.cwd).forEach((entry) => {
        const read = ctx.fs.read(entry.abs, ctx.cwd, ctx.engine.user);
        if (read.ok) records.push({ name: outputPathForFind(entry.abs, target, ctx.fs.normalize(target, ctx.cwd)), content: read.content });
        else records.push({ error: `${target}: ${read.error}` });
      });
      else {
        const read = ctx.fs.read(target, ctx.cwd, ctx.engine.user);
        if (read.ok) records.push({ name: target, content: read.content });
        else records.push({ error: `${target}: ${read.error}` });
      }
    });
    const multiple = records.filter((record) => !record.error).length > 1;
    let output = "";
    let errors = "";
    records.forEach((record) => {
      if (record.error) { errors += `grep: ${record.error}\n`; return; }
      textLines(record.content).forEach((line, lineIndex) => {
        if (!matcher.test(line)) return;
        const prefix = multiple && record.name ? `${record.name}:` : "";
        const numbered = flags.has("n") ? `${lineIndex + 1}:` : "";
        output += `${prefix}${numbered}${line}\n`;
      });
    });
    return result(output, errors);
  }
});
registerCommand("find", {
  category: "Search", description: "Walk a directory tree and filter paths.", examples: ["find . -name '*.txt'"], options: ["-name glob match names", "-type f or d"], help: "find [path] -name pattern\n\nSearch recursively. The common educational form is find . -name '*.log'.",
  execute: (args, ctx) => {
    let startToken = ".";
    let index = 0;
    if (args[0] && !args[0].startsWith("-")) { startToken = args[0]; index = 1; }
    let namePattern = null;
    let type = null;
    while (index < args.length) {
      if (args[index] === "-name") namePattern = args[++index];
      else if (args[index] === "-type") type = args[++index];
      index += 1;
    }
    const startAbs = ctx.fs.normalize(startToken, ctx.cwd);
    const startNode = ctx.fs.get(startToken, ctx.cwd);
    if (!startNode) return commandError("find", `${startToken}: No such file or directory`);
    const entries = ctx.fs.collectFiles(startToken, ctx.cwd, true);
    const matches = entries.filter((entry) => (!namePattern || wildcardMatch(namePattern, basename(entry.abs))) && (!type || (type === "f" ? entry.node.type === "file" : entry.node.type === "dir")));
    return result(matches.map((entry) => outputPathForFind(entry.abs, startToken, startAbs)).join("\n") + (matches.length ? "\n" : ""));
  }
});
registerCommand("wc", {
  category: "Text", description: "Count lines, words, or bytes.", examples: ["wc -l server.log", "cat users.txt | wc -l"], options: ["-l lines", "-w words", "-c bytes"], help: "wc [-lwc] [file]\n\nCount properties of stdin or files. With no flag, print lines, words, and bytes.",
  execute: (args, ctx) => {
    const { flags, rest } = flagSet(args);
    const source = readSources(ctx, rest, ctx.stdin);
    if (!source.ok) return commandError("wc", source.error);
    const content = source.content;
    const lines = content ? content.split("\n").filter((line, i, all) => !(i === all.length - 1 && line === "")).length : 0;
    const words = content.trim() ? content.trim().split(/\s+/).length : 0;
    const bytes = content.length;
    const values = flags.has("l") || flags.has("w") || flags.has("c") ? [flags.has("l") ? lines : null, flags.has("w") ? words : null, flags.has("c") ? bytes : null].filter((value) => value !== null) : [lines, words, bytes];
    return result(values.join(" ") + (rest.length === 1 ? ` ${rest[0]}` : "") + "\n");
  }
});
registerCommand("sort", {
  category: "Text", description: "Sort lines alphabetically or numerically.", examples: ["sort names.txt", "cat names.txt | sort"], options: ["-r reverse order", "-n numeric order"], help: "sort [-rn] [file]\n\nRead lines and emit them in sorted order.",
  execute: (args, ctx) => { const { flags, rest } = flagSet(args); const source = readSources(ctx, rest, ctx.stdin); if (!source.ok) return commandError("sort", source.error); const lines = textLines(source.content).filter((line, index, all) => !(index === all.length - 1 && line === "")); lines.sort((a, b) => flags.has("n") ? Number(a) - Number(b) : a.localeCompare(b)); if (flags.has("r")) lines.reverse(); return result(lines.join("\n") + (lines.length ? "\n" : "")); }
});
registerCommand("uniq", {
  category: "Text", description: "Collapse adjacent duplicate lines.", examples: ["sort users.txt | uniq"], options: ["-c count duplicates"], help: "uniq [-c]\n\nRemove adjacent duplicate lines. Sort first when you want to deduplicate an entire file.",
  execute: (args, ctx) => { const { flags, rest } = flagSet(args); const source = readSources(ctx, rest, ctx.stdin); if (!source.ok) return commandError("uniq", source.error); const lines = textLines(source.content).filter((line, index, all) => !(index === all.length - 1 && line === "")); const output = []; lines.forEach((line) => { const previous = output[output.length - 1]; if (previous && previous.line === line) previous.count += 1; else output.push({ line, count: 1 }); }); return result(output.map((entry) => flags.has("c") ? `${String(entry.count).padStart(7, " ")} ${entry.line}` : entry.line).join("\n") + (output.length ? "\n" : "")); }
});
registerCommand("uname", {
  category: "System", description: "Print the simulated operating system name.", examples: ["uname", "uname -a"], help: "uname [-a]\n\nIdentify the simulated platform. Linux sessions print Linux; macOS sessions print Darwin.",
  execute: (args, ctx) => { const name = ctx.platform === "Linux" ? "Linux" : "Darwin"; return result(args.includes("-a") ? `${name} ${ctx.fs.hostname} ${ctx.platform === "Linux" ? "6.8.0" : "24.0.0"} ${ctx.engine.user} ${ctx.platform === "Linux" ? "GNU/Linux" : "arm64"}\n` : `${name}\n`); }
});
registerCommand("hostname", {
  category: "System", description: "Print the simulated host name.", examples: ["hostname"], help: "hostname\n\nPrint the host identity without making a network request.",
  execute: (_args, ctx) => result(`${ctx.fs.hostname}\n`)
});
registerCommand("df", {
  category: "System", description: "Show simulated filesystem space.", examples: ["df -h"], options: ["-h human-readable sizes"], help: "df [-h]\n\nDisplay a small simulated disk-usage table. It never inspects your real disk.",
  execute: (args, ctx) => { const human = args.includes("-h"); const used = ctx.fs.size(ctx.fs.root); const format = (value) => human ? formatBytes(value) : String(Math.ceil(value / 512)); return result(`Filesystem      Size  Used Avail Capacity Mounted on\nvirtual         20G  ${format(used)}  19G      4% /\n`); }
});
registerCommand("du", {
  category: "System", description: "Estimate simulated directory usage.", examples: ["du -sh projects"], options: ["-s summary", "-h human-readable"], help: "du [-sh] [path]\n\nShow the size of a virtual path.",
  execute: (args, ctx) => { const { flags, rest } = flagSet(args); const target = rest[0] || "."; const node = ctx.fs.get(target, ctx.cwd); if (!node) return commandError("du", `${target}: No such file or directory`); const value = ctx.fs.size(node); return result(`${flags.has("h") ? formatBytes(value) : Math.ceil(value / 512)}\t${target}\n`); }
});
registerCommand("free", {
  category: "System", description: "Show simulated Linux memory usage.", examples: ["free -h"], options: ["-h human-readable"], platforms: ["Linux"], help: "free [-h]\n\nA Linux-oriented command. macOS users commonly use vm_stat or Activity Monitor instead; this game enables free in Linux sessions.",
  execute: (args, ctx) => ctx.platform !== "Linux" ? commandError("zsh", "command not found: free (try a Linux session)") : result(`              total        used        free      shared  buff/cache   available\nMem:           7.7Gi       2.1Gi       3.8Gi       112Mi       1.8Gi       5.2Gi\nSwap:          2.0Gi          0B       2.0Gi\n`)
});
registerCommand("uptime", {
  category: "System", description: "Show simulated system uptime and load.", examples: ["uptime"], help: "uptime\n\nPrint a stable educational snapshot of this virtual host.",
  execute: (_args, ctx) => result(` 10:42  up 7 days, 03:18, 2 users, load averages: 0.42 0.38 0.31\n`)
});
registerCommand("ps", {
  category: "Processes", description: "List simulated processes.", examples: ["ps", "ps aux"], options: ["aux show a wider process table"], help: "ps [aux]\n\nInspect fictional processes. Nothing here represents a process on your computer.",
  execute: (args, ctx) => result(processTable(ctx.engine.processes, !args.some((arg) => arg.includes("a") || arg.includes("x"))))
});
registerCommand("top", {
  category: "Processes", description: "Watch simulated process activity.", examples: ["top"], help: "top\n\nShow a static snapshot of the busiest virtual processes; press Ctrl-L to clear.",
  execute: (_args, ctx) => result(`Processes: ${ctx.engine.processes.filter((process) => !process.killed).length}\nPID    %CPU  %MEM  COMMAND\n${ctx.engine.processes.filter((process) => !process.killed).sort((a, b) => Number(b.cpu) - Number(a.cpu)).map((process) => `${String(process.pid).padEnd(6)} ${String(process.cpu).padEnd(5)} ${String(process.mem).padEnd(5)} ${process.command}`).join("\n")}\n`)
});
registerCommand("kill", {
  category: "Processes", description: "Stop a fictional process by PID.", examples: ["kill 2451"], help: "kill PID\n\nStop a simulated process. PID 1 is protected in this educational environment.",
  execute: (args, ctx) => { const pid = Number(args[0]); const process = ctx.engine.processes.find((entry) => entry.pid === pid && !entry.killed); if (!process) return commandError("kill", `${args[0] || ""}: No such process`); if (pid === 1) return commandError("kill", "1: Operation not permitted"); process.killed = true; return result(); }
});
registerCommand("killall", {
  category: "Processes", description: "Stop fictional processes by name.", examples: ["killall node"], help: "killall name\n\nStop every matching simulated process; use with care in real systems.",
  execute: (args, ctx) => { const name = args[0]; if (!name) return commandError("killall", "usage: killall name"); const matches = ctx.engine.processes.filter((process) => !process.killed && process.command.includes(name)); if (!matches.length) return commandError("killall", `${name}: no process found`); matches.forEach((process) => { if (process.pid !== 1) process.killed = true; }); return result(); }
});
registerCommand("chmod", {
  category: "Permissions", description: "Change a virtual file's permission mode.", examples: ["chmod +x script.sh", "chmod 755 deploy.sh"], options: ["+x add execute permission", "755 owner/group/other mode"], help: "chmod MODE file\n\nPractice r, w and x permissions with symbolic +x or numeric modes such as 755.",
  execute: (args, ctx) => { if (args.length < 2) return commandError("chmod", "missing operand"); const mode = args[0]; let stderr = ""; args.slice(1).forEach((path) => { const changed = ctx.fs.chmod(path, ctx.cwd, mode, ctx.engine.user); if (!changed.ok) stderr += `chmod: ${path}: ${changed.error}\n`; }); return result("", stderr); }
});
registerCommand("ping", {
  category: "Network", description: "Test reachability in a simulated network.", examples: ["ping raspberrypi"], options: ["-c count number of packets"], help: "ping [-c count] host\n\nGenerate fictional responses. No packets leave this browser.",
  execute: (args) => {
    let host = "localhost";
    let count = 3;
    for (let index = 0; index < args.length; index += 1) {
      if (args[index] === "-c") {
        const requested = Number(args[++index]);
        if (!Number.isInteger(requested) || requested < 1 || requested > 20) return commandError("ping", "count must be an integer from 1 to 20");
        count = requested;
      } else if (!args[index].startsWith("-")) host = args[index];
    }
    return result(`PING ${host} (${host}) 56 data bytes\n${Array.from({ length: count }, (_, index) => `64 bytes from ${host}: icmp_seq=${index + 1} ttl=64 time=${(12 + index * 2.1).toFixed(1)} ms`).join("\n")}\n\n--- ${host} ping statistics ---\n${count} packets transmitted, ${count} packets received, 0.0% packet loss\n`);
  }
});
registerCommand("curl", {
  category: "Network", description: "Inspect a simulated HTTP response.", examples: ["curl https://example.com/health"], options: ["-I headers only"], help: "curl [-I] URL\n\nFetch a canned response inside the simulation; it never connects to the internet.",
  execute: (args) => { const url = args.find((arg) => !arg.startsWith("-")); if (!url) return commandError("curl", "try: curl https://example.com"); if (args.includes("-I")) return result(`HTTP/1.1 200 OK\ncontent-type: application/json\nx-terminal-quest: simulated\n\n`); return result(`{\n  "status": "ok",\n  "source": "${url}",\n  "simulated": true\n}\n`); }
});
registerCommand("ssh", {
  category: "Network", description: "Open a simulated remote shell.", examples: ["ssh learner@raspberrypi"], help: "ssh user@host\n\nConnect to a fictional Linux host. The remote filesystem is separate from your local sandbox.",
  execute: (args, ctx) => { const spec = args.find((arg) => !arg.startsWith("-")); if (!spec || !spec.includes("@")) return commandError("ssh", "usage: ssh user@host"); const [user, host] = spec.split("@"); const connected = ctx.engine.connectRemote(user, host); return connected.ok ? result(`The authenticity of host '${host}' is simulated.\nConnected to ${host}.\n`) : commandError("ssh", connected.error); }
});
registerCommand("exit", {
  category: "Network", description: "Leave a simulated remote shell.", examples: ["exit"], help: "exit\n\nReturn from a remote session to the local terminal.",
  execute: (_args, ctx) => { const disconnected = ctx.engine.disconnectRemote(); return disconnected.ok ? result("Connection closed.\n") : result("logout\n"); }
});
function isRemoteSpec(value) { return /^[^:]+@[^:]+:/.test(value); }
function remoteParts(spec) { const match = String(spec).match(/^([^@]+)@([^:]+):(.*)$/); return match ? { user: match[1], host: match[2], path: match[3] || "." } : null; }
function transfer(sourceFs, sourcePath, sourceCwd, destinationFs, destinationPath, destinationCwd) {
  const sourceAbs = sourceFs.normalize(sourcePath, sourceCwd);
  const sourceNode = sourceFs.get(sourcePath, sourceCwd);
  if (!sourceNode) return { ok: false, error: "No such file or directory" };
  let destAbs = destinationFs.normalize(destinationPath, destinationCwd);
  const existing = destinationFs.get(destinationPath, destinationCwd);
  if (existing && existing.type === "dir") destAbs = `${destAbs.replace(/\/$/, "")}/${basename(sourceAbs)}`;
  if (sourceNode.type === "dir") {
    const entries = sourceFs.snapshot(sourcePath, sourceCwd);
    destinationFs.restore(entries, dirname(destAbs), "/");
  } else destinationFs.putFile(destAbs, sourceNode.content, sourceNode.mode, sourceNode.archiveEntries ? { archiveEntries: sourceNode.archiveEntries } : {});
  return { ok: true };
}
registerCommand("scp", {
  category: "Network", description: "Copy a file between local and simulated remote hosts.", examples: ["scp report.txt learner@raspberrypi:~/"], options: ["-r recursive directory copy"], help: "scp source destination\n\nTransfer files to or from a simulated remote host. No network connection is made.",
  execute: (args, ctx) => {
    const { flags, rest } = flagSet(args);
    if (rest.length !== 2) return commandError("scp", "usage: scp source destination");
    const [source, destination] = rest;
    const sourceRemote = isRemoteSpec(source);
    const destinationRemote = isRemoteSpec(destination);
    if (sourceRemote === destinationRemote) return commandError("scp", "one side must be local and one side remote");
    const remote = remoteParts(sourceRemote ? source : destination);
    const session = ctx.engine.makeRemoteSession(remote.host, remote.user);
    const localFs = ctx.engine.localFs;
    const localCwd = ctx.engine.localCwd;
    let copied;
    if (destinationRemote) copied = transfer(localFs, source, localCwd, session.fs, remote.path, session.cwd);
    else copied = transfer(session.fs, remote.path, session.cwd, localFs, destination, localCwd);
    return copied.ok ? result() : commandError("scp", copied.error);
  }
});
registerCommand("tar", {
  category: "Files", description: "Create, inspect or extract a simulated tar archive.", examples: ["tar -cf backup.tar project", "tar -xf backup.tar"], options: ["-c create", "-x extract", "-t list", "-f archive file"], help: "tar -cf archive.tar files...\ntar -tf archive.tar\ntar -xf archive.tar\n\nCommon archive workflows are modeled without touching your real disk.",
  execute: (args, ctx) => {
    const { flags, rest } = flagSet(args);
    const archiveName = rest.shift();
    if (!archiveName) return commandError("tar", "missing archive name");
    if (flags.has("c")) {
      if (!rest.length) return commandError("tar", "cowardly refusing to create an empty archive");
      const entries = [];
      for (const source of rest) { const snapshot = ctx.fs.snapshot(source, ctx.cwd); if (!snapshot) return commandError("tar", `${source}: No such file or directory`); entries.push(...snapshot); }
      ctx.fs.putFile(ctx.fs.normalize(archiveName, ctx.cwd), `tar archive (${entries.length} entries)\n`, "644", { archiveEntries: entries });
      return result();
    }
    const archive = ctx.fs.get(archiveName, ctx.cwd);
    if (!archive || !archive.archiveEntries) return commandError("tar", `${archiveName}: This is not a readable archive`);
    if (flags.has("t")) return result(archive.archiveEntries.map((entry) => entry.path).join("\n") + "\n");
    if (flags.has("x")) { ctx.fs.restore(archive.archiveEntries, ".", ctx.cwd); return result(); }
    return commandError("tar", "use -c, -t or -x");
  }
});
registerCommand("gzip", {
  category: "Files", description: "Compress or decompress a simulated file.", examples: ["gzip release.txt", "gzip -d release.txt.gz"], options: ["-d decompress"], help: "gzip file\ngzip -d file.gz\n\nCompress one file and replace it with a .gz entry inside the virtual filesystem.",
  execute: (args, ctx) => { const decompress = args.includes("-d") || args.includes("--decompress"); const path = args.find((arg) => !arg.startsWith("-")); if (!path) return commandError("gzip", "missing file operand"); if (decompress) { const node = ctx.fs.get(path, ctx.cwd); if (!node || !node.compressedContent) return commandError("gzip", `${path}: not in gzip format`); const restored = path.endsWith(".gz") ? path.slice(0, -3) : `${path}.out`; ctx.fs.putFile(ctx.fs.normalize(restored, ctx.cwd), node.compressedContent, node.mode); ctx.fs.remove(path, ctx.cwd, false, false); return result(); } const source = ctx.fs.get(path, ctx.cwd); if (!source) return commandError("gzip", `${path}: No such file or directory`); if (source.type !== "file") return commandError("gzip", `${path}: Is a directory`); ctx.fs.putFile(ctx.fs.normalize(`${path}.gz`, ctx.cwd), "compressed virtual data\n", source.mode, { compressedContent: source.content }); ctx.fs.remove(path, ctx.cwd, false, false); return result(); }
});
registerCommand("zip", {
  category: "Files", description: "Create a simulated zip archive.", examples: ["zip backup.zip release.txt"], options: ["-r include directories recursively"], help: "zip [-r] archive.zip files...\n\nCreate a portable archive in the virtual filesystem.",
  execute: (args, ctx) => { const { flags, rest } = flagSet(args); const archiveName = rest.shift(); if (!archiveName || !rest.length) return commandError("zip", "usage: zip [-r] archive.zip files..."); const entries = []; for (const source of rest) { const snapshot = ctx.fs.snapshot(source, ctx.cwd); if (!snapshot) return commandError("zip", `${source}: No such file or directory`); if (snapshot.some((entry) => entry.type === "dir") && !flags.has("r")) return commandError("zip", `${source}: is a directory; use -r`); entries.push(...snapshot); } ctx.fs.putFile(ctx.fs.normalize(archiveName, ctx.cwd), `zip archive (${entries.length} entries)\n`, "644", { archiveEntries: entries }); return result(); }
});
registerCommand("unzip", {
  category: "Files", description: "Extract a simulated zip archive.", examples: ["unzip backup.zip -d restored"], options: ["-d destination directory"], help: "unzip archive.zip [-d destination]\n\nExtract an archive into the current directory or a destination.",
  execute: (args, ctx) => { const archiveName = args.find((arg) => !arg.startsWith("-")); const dIndex = args.indexOf("-d"); const destination = dIndex >= 0 ? args[dIndex + 1] : "."; const archive = archiveName && ctx.fs.get(archiveName, ctx.cwd); if (!archive || !archive.archiveEntries) return commandError("unzip", `${archiveName || ""}: cannot find or read archive`); ctx.fs.restore(archive.archiveEntries, destination, ctx.cwd); return result(`Archive: ${archiveName}\n  extracting: ${destination}\n`); }
});
registerCommand("man", {
  category: "Shell", description: "Read a concise manual page.", examples: ["man grep", "man chmod"], help: "man command\n\nOpen Terminal Quest's short, task-oriented reference for a command.",
  execute: (args) => { const name = args[0]; const entry = name && COMMANDS[name]; if (!entry) return commandError("man", `${name || ""}: no manual entry`); const options = entry.options?.length ? `\nCOMMON OPTIONS\n  ${entry.options.join("\n  ")}\n` : ""; return result(`NAME\n  ${entry.name} — ${entry.description}\n\nSYNOPSIS\n  ${entry.help.split("\n")[0]}\n\nGUIDE\n  ${entry.help.split("\n").slice(2).join(" ").trim()}\n${options}\nEXAMPLE\n  ${(entry.examples || [entry.name])[0]}\n`); }
});
registerCommand("history", {
  category: "Shell", description: "Review commands from this session.", examples: ["history"], help: "history\n\nPrint commands entered in the current simulated session.",
  execute: (_args, ctx) => result(ctx.engine.history.map((line, index) => `${String(index + 1).padStart(4, " ")}  ${line}`).join("\n") + (ctx.engine.history.length ? "\n" : ""))
});
registerCommand("which", {
  category: "Shell", description: "Find whether a command is available.", examples: ["which grep"], help: "which command\n\nShow the educational path used for a registered command.",
  execute: (args) => { if (!args.length) return commandError("which", "missing argument"); const output = args.map((name) => COMMANDS[name] ? `/usr/bin/${name}` : `${name} not found`).join("\n"); return result(output + "\n"); }
});
registerCommand("export", {
  category: "Shell", description: "Set an environment variable for this session.", examples: ["export PROJECT=terminal-quest"], help: "export NAME=value\n\nSet a variable in the simulated shell environment.",
  execute: (args, ctx) => { if (!args.length) return result(Object.entries(ctx.env).sort().map(([key, value]) => `declare -x ${key}="${value}"`).join("\n") + "\n"); let stderr = ""; args.forEach((assignment) => { const match = assignment.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/); if (!match) stderr += `export: ${assignment}: not a valid identifier\n`; else ctx.engine.baseEnv[match[1]] = match[2]; }); return result("", stderr); }
});
registerCommand("env", {
  category: "Shell", description: "Print the current environment.", examples: ["env", "env | grep HOME"], help: "env\n\nList variables visible to the current simulated shell.",
  execute: (_args, ctx) => result(Object.entries(ctx.env).sort().map(([key, value]) => `${key}=${value}`).join("\n") + "\n")
});
registerCommand("open", {
  category: "System", description: "Open a path using the simulated macOS desktop.", examples: ["open ."], platforms: ["macOS"], help: "open path\n\nmacOS helper for opening a file or directory; this version only reports what it would open.",
  execute: (args, ctx) => { const path = args[0] || "."; if (!ctx.fs.exists(path, ctx.cwd)) return commandError("open", `${path}: No such file or directory`); return result(`Opening ${ctx.fs.normalize(path, ctx.cwd)} with the macOS desktop (simulated).\n`); }
});
registerCommand("xdg-open", {
  category: "System", description: "Open a path using the simulated Linux desktop.", examples: ["xdg-open ."], platforms: ["Linux"], help: "xdg-open path\n\nLinux desktop helper equivalent to macOS open; it is simulated here.",
  execute: (args, ctx) => { const path = args[0] || "."; if (!ctx.fs.exists(path, ctx.cwd)) return commandError("xdg-open", `${path}: No such file or directory`); return result(`Opening ${ctx.fs.normalize(path, ctx.cwd)} with the Linux desktop (simulated).\n`); }
});
registerCommand("pbcopy", {
  category: "System", description: "Copy stdin into the simulated macOS clipboard.", examples: ["cat notes.txt | pbcopy"], platforms: ["macOS"], help: "pbcopy\n\nCopy stdin to a simulated clipboard. No system clipboard is accessed.",
  execute: (_args, ctx) => { ctx.engine.clipboard = ctx.stdin; return result(); }
});
registerCommand("pbpaste", {
  category: "System", description: "Print the simulated macOS clipboard.", examples: ["pbpaste"], platforms: ["macOS"], help: "pbpaste\n\nPrint the virtual clipboard value.",
  execute: (_args, ctx) => result(ctx.engine.clipboard || "\n")
});
registerCommand("bash", { category: "Shell", description: "Identify Bash as a shell (not a nested interpreter here).", examples: ["echo $SHELL"], platforms: ["Linux"], help: "bash\n\nThe game models one shell syntax while teaching that many Linux servers default to Bash." , execute: (_args) => result("bash: nested shell simulation\n") });
registerCommand("zsh", { category: "Shell", description: "Identify Zsh as a shell (not a nested interpreter here).", examples: ["echo $SHELL"], platforms: ["macOS"], help: "zsh\n\nThe game models one shell syntax while teaching that modern macOS defaults to Zsh." , execute: (_args) => result("zsh: nested shell simulation\n") });
registerCommand("help", {
  category: "Shell", description: "List the commands available in this terminal.", examples: ["help"], help: "help\n\nList every command this simulated terminal understands. Use man <command> for details.",
  execute: () => result(`${Object.keys(COMMANDS).sort().join("  ")}\n\nman <command>: help on one command\n`)
});

const checkResult = (ok, message) => ({ ok: !!ok, message });
const outputContains = (check, value, insensitive = false) => {
  const output = insensitive ? String(check.output || "").toLowerCase() : String(check.output || "");
  const target = insensitive ? String(value).toLowerCase() : String(value);
  return output.includes(target);
};
const fileHas = (check, path, predicate) => {
  const read = check.fs.read(path, check.cwd);
  return read.ok && predicate(read.content);
};
const makeChallenge = (config) => ({
  xp: 100,
  platforms: ["macOS + Linux"],
  hints: ["Think about the tool that matches this objective.", "Type help for the list of commands, or man <command> for help on one.", "Try the simplest form and observe the terminal response."],
  setup: () => makeBaseScenario(),
  ...config
});
const sandboxSetup = (mutate = () => {}) => () => { const scenario = makeBaseScenario(); scenario.cwd = `${scenario.fs.home}/sandbox`; mutate(scenario); return scenario; };
const addFile = (scenario, path, content, mode = "644") => scenario.fs.putFile(path, content, mode);
const addDir = (scenario, path) => scenario.fs.putDir(path);
const base = () => makeBaseScenario();
const challengeList = [
  makeChallenge({ id: "orientation-01", level: 1, levelName: "Where am I?", title: "Find your bearings", explanation: "Before changing anything, get your bearings. The terminal always has a current working directory.", example: "pwd", objective: "Show the directory you are in.", solution: "pwd", validator: (check) => checkResult(check.history.includes("pwd") && String(check.output).trim() === check.home, "Run pwd and verify your home directory."), hints: ["You need a command that prints your current location.", "The command has three letters and starts with p.", "pwd"] }),
  makeChallenge({ id: "orientation-02", level: 1, levelName: "Where am I?", title: "Read the room", explanation: "Listing first lets you see your options before choosing a path.", example: "ls\nls -la", objective: "List the contents of your home directory.", solution: "ls", validator: (check) => checkResult(["Desktop", "Documents", "Downloads", "projects"].every((name) => String(check.output).includes(name)), "The output does not show the expected contents of your home directory yet.") }),
  makeChallenge({ id: "orientation-03", level: 1, levelName: "Where am I?", title: "Know the user", explanation: "On a Mac or a server, knowing which user you are operating as prevents permission surprises.", example: "whoami", objective: "Find which user is running this session.", solution: "whoami", validator: (check) => checkResult(outputContains(check, check.engine.user), "The session user does not appear yet."), hints: ["Look for a command that answers the question ‘who am I?’. ", "It is one very descriptive word.", "whoami"] }),
  makeChallenge({ id: "orientation-04", level: 1, levelName: "Where am I?", title: "See the hidden layer", explanation: "Names that start with a dot often hold configuration. They do not appear in a regular ls.", example: "ls -la", objective: "List hidden files and long-format details in your home directory.", solution: "ls -la", setup: () => { const scenario = base(); addFile(scenario, `${scenario.fs.home}/.config`, "theme=dark\n"); addFile(scenario, `${scenario.fs.home}/.env`, "MODE=practice\n"); return scenario; }, validator: (check) => checkResult(outputContains(check, ".config") && outputContains(check, ".env") && outputContains(check, "total"), "Hidden files or long-format details are missing from the output."), hints: ["ls accepts options to include hidden files and show details.", "The two options are -a and -l; they can be combined.", "ls -la"] }),

  makeChallenge({ id: "navigation-01", level: 2, levelName: "Move Around", title: "Step into projects", explanation: "A relative path is interpreted from the current directory.", example: "cd projects\npwd", objective: "Enter the projects directory.", solution: "cd projects", validator: (check) => checkResult(check.cwd === `${check.home}/projects`, "You are not inside projects yet.") }),
  makeChallenge({ id: "navigation-02", level: 2, levelName: "Move Around", title: "Take one step back", explanation: "The name .. represents the parent directory, one of the most useful pieces for moving quickly.", example: "cd ..", objective: "Return to your home directory from projects.", solution: "cd ..", setup: () => { const scenario = base(); scenario.cwd = `${scenario.fs.home}/projects`; return scenario; }, validator: (check) => checkResult(check.cwd === check.home, "The current directory is not your home directory yet.") }),
  makeChallenge({ id: "navigation-03", level: 2, levelName: "Move Around", title: "Go home", explanation: "~ is a portable shortcut to your home directory.", example: "cd ~", objective: "Return to your home directory using ~.", solution: "cd ~", setup: () => { const scenario = base(); scenario.cwd = `${scenario.fs.home}/Downloads`; return scenario; }, validator: (check) => checkResult(check.cwd === check.home, "~ has not taken you home yet.") }),
  makeChallenge({ id: "navigation-04", level: 2, levelName: "Move Around", title: "Visit the root", explanation: "The leading slash represents the root of the entire filesystem.", example: "cd /\nls", objective: "Reach the root of the virtual filesystem.", solution: "cd /", validator: (check) => checkResult(check.cwd === "/", "You are not at / yet.") }),
  makeChallenge({ id: "navigation-05", level: 2, levelName: "Move Around", title: "Stay put", explanation: ". represents the current directory. It is useful when passing paths to other commands.", example: "cd .", objective: "Use . without changing your current location.", solution: "cd .", validator: (check) => checkResult(check.history.includes("cd .") && check.cwd === check.home, "Run cd . to confirm the current directory."), hints: ["The dot represents where you are.", "You can use it as the destination for cd.", "cd ."] }),

  makeChallenge({ id: "build-01", level: 3, levelName: "Build Something", title: "Make a room", explanation: "Directories are containers. Create a small one before filling it.", example: "mkdir projects", objective: "Inside sandbox, create a directory named projects.", solution: "mkdir projects", setup: sandboxSetup(), validator: (check) => checkResult(check.fs.isDir("projects", check.cwd), "The projects directory does not exist inside sandbox yet.") }),
  makeChallenge({ id: "build-02", level: 3, levelName: "Build Something", title: "Build a path", explanation: "mkdir -p saves you from creating every intermediate directory separately.", example: "mkdir -p src/components", objective: "Inside sandbox, create the src/components path in one step.", solution: "mkdir -p src/components", setup: sandboxSetup(), validator: (check) => checkResult(check.fs.isDir("src/components", check.cwd), "The nested path is not complete yet.") }),
  makeChallenge({ id: "build-03", level: 3, levelName: "Build Something", title: "Leave a marker", explanation: "touch creates an empty file when one does not exist yet.", example: "touch README.md", objective: "Inside sandbox, create a file named README.md.", solution: "touch README.md", setup: sandboxSetup(), validator: (check) => checkResult(check.fs.get("README.md", check.cwd)?.type === "file", "README.md does not exist in sandbox yet.") }),
  makeChallenge({ id: "build-04", level: 3, levelName: "Build Something", title: "A tiny journal", explanation: "Combine creating a directory with creating a file.", example: "mkdir notes\ntouch notes/today.txt", objective: "Create notes inside sandbox and put today.txt inside it.", solution: "mkdir notes\ntouch notes/today.txt", setup: sandboxSetup(), validator: (check) => checkResult(check.fs.isDir("notes", check.cwd) && check.fs.get("notes/today.txt", check.cwd)?.type === "file", "notes or today.txt is missing from sandbox.") }),

  makeChallenge({ id: "move-copy-01", level: 4, levelName: "Move & Copy", title: "Keep a copy", explanation: "cp leaves the original in place and creates another entry.", example: "cp notes.txt notes-copy.txt", objective: "Copy source.txt as source-copy.txt inside sandbox.", solution: "cp source.txt source-copy.txt", setup: sandboxSetup((scenario) => addFile(scenario, `${scenario.fs.home}/sandbox/source.txt`, "keep this original\n")), validator: (check) => checkResult(check.fs.exists("source.txt", check.cwd) && check.fs.exists("source-copy.txt", check.cwd), "The copy or the original file is not where it should be."), hints: ["You need a command that duplicates without deleting the source.", "The general form is cp source destination.", "cp source.txt source-copy.txt"] }),
  makeChallenge({ id: "move-copy-02", level: 4, levelName: "Move & Copy", title: "Rename a draft", explanation: "mv works both for moving and renaming.", example: "mv draft.txt final.txt", objective: "Rename draft.txt to final.txt inside sandbox.", solution: "mv draft.txt final.txt", setup: sandboxSetup((scenario) => addFile(scenario, `${scenario.fs.home}/sandbox/draft.txt`, "ready\n")), validator: (check) => checkResult(!check.fs.exists("draft.txt", check.cwd) && check.fs.exists("final.txt", check.cwd), "The old name still exists or final.txt is missing.") }),
  makeChallenge({ id: "move-copy-03", level: 4, levelName: "Move & Copy", title: "Duplicate a folder", explanation: "Directories need the recursive option because they contain more entries.", example: "cp -r assets assets-copy", objective: "Copy the assets folder as assets-copy, including its contents.", solution: "cp -r assets assets-copy", setup: sandboxSetup((scenario) => { addDir(scenario, `${scenario.fs.home}/sandbox/assets`); addFile(scenario, `${scenario.fs.home}/sandbox/assets/logo.txt`, "asset\n"); }), validator: (check) => checkResult(check.fs.isDir("assets-copy", check.cwd) && check.fs.exists("assets-copy/logo.txt", check.cwd), "The copied folder or its contents are missing."), hints: ["cp needs an option when the source is a directory.", "The option is -r.", "cp -r assets assets-copy"] }),
  makeChallenge({ id: "move-copy-04", level: 4, levelName: "Move & Copy", title: "Move the old folder", explanation: "Moving a directory preserves its contents while changing its location or name.", example: "mv old-name new-name", objective: "Rename old-name to new-name.", solution: "mv old-name new-name", setup: sandboxSetup((scenario) => { addDir(scenario, `${scenario.fs.home}/sandbox/old-name`); addFile(scenario, `${scenario.fs.home}/sandbox/old-name/keep.txt`, "keep\n"); }), validator: (check) => checkResult(!check.fs.exists("old-name", check.cwd) && check.fs.exists("new-name/keep.txt", check.cwd), "The directory was not renamed while preserving its contents.") }),

  makeChallenge({ id: "delete-01", level: 5, levelName: "Delete Carefully", title: "Remove one file", explanation: "rm removes files directly; Unix does not traditionally have a trash can for recovering them.", example: "rm old.txt", objective: "Delete old.txt inside sandbox.", solution: "rm old.txt", setup: sandboxSetup((scenario) => addFile(scenario, `${scenario.fs.home}/sandbox/old.txt`, "temporary\n")), validator: (check) => checkResult(!check.fs.exists("old.txt", check.cwd), "old.txt still exists.") }),
  makeChallenge({ id: "delete-02", level: 5, levelName: "Delete Carefully", title: "Empty first", explanation: "rmdir is deliberately conservative: it only works on empty directories.", example: "rmdir empty-folder", objective: "Delete the empty directory empty-folder.", solution: "rmdir empty-folder", setup: sandboxSetup((scenario) => addDir(scenario, `${scenario.fs.home}/sandbox/empty-folder`)), validator: (check) => checkResult(!check.fs.exists("empty-folder", check.cwd), "empty-folder still exists.") }),
  makeChallenge({ id: "delete-03", level: 5, levelName: "Delete Carefully", title: "Clear a tree", explanation: "rm -r descends through a directory recursively. In real life, double-check the path.", example: "rm -r build", objective: "Delete the build folder and all its contents.", solution: "rm -r build", setup: sandboxSetup((scenario) => { addDir(scenario, `${scenario.fs.home}/sandbox/build/assets`); addFile(scenario, `${scenario.fs.home}/sandbox/build/app.js`, "bundle\n"); }), validator: (check) => checkResult(!check.fs.exists("build", check.cwd), "build or part of its contents still exists."), hints: ["rm alone does not remove directories.", "You need the recursive option.", "rm -r build"] }),

  makeChallenge({ id: "read-01", level: 6, levelName: "Read Files", title: "Read the welcome", explanation: "cat is the direct tool for viewing an entire file.", example: "cat welcome.txt", objective: "Read welcome.txt and find the welcome message.", solution: "cat welcome.txt", validator: (check) => checkResult(outputContains(check, "Welcome to your virtual terminal"), "The output does not contain the welcome message yet.") }),
  makeChallenge({ id: "read-02", level: 6, levelName: "Read Files", title: "Inspect the beginning", explanation: "head is useful when you only need the start of a log or a large file.", example: "head -n 2 server.log", objective: "Show the first two lines of server.log.", solution: "head -n 2 server.log", setup: () => { const scenario = base(); addFile(scenario, `${scenario.fs.home}/server.log`, "BOOT\nREADY\nREQUEST\nDONE\n"); return scenario; }, validator: (check) => checkResult(outputContains(check, "BOOT") && outputContains(check, "READY") && !outputContains(check, "REQUEST"), "The output does not seem to contain only the first two lines.") }),
  makeChallenge({ id: "read-03", level: 6, levelName: "Read Files", title: "Inspect the end", explanation: "tail lets you view the most recent part of a file without printing it all.", example: "tail -n 2 server.log", objective: "Show the last two lines of server.log.", solution: "tail -n 2 server.log", setup: () => { const scenario = base(); addFile(scenario, `${scenario.fs.home}/server.log`, "BOOT\nREADY\nREQUEST\nDONE\n"); return scenario; }, validator: (check) => checkResult(outputContains(check, "REQUEST") && outputContains(check, "DONE") && !outputContains(check, "BOOT"), "The output does not seem to contain only the last two lines.") }),
  makeChallenge({ id: "read-04", level: 6, levelName: "Read Files", title: "Open the notes", explanation: "less sits between cat and a search tool: it lets you inspect without flooding the screen.", example: "less projects/README.md", objective: "Inspect the README inside projects.", solution: "less projects/README.md", validator: (check) => checkResult(outputContains(check, "# projects") && outputContains(check, "[less]"), "The less view does not show the README yet.") }),

  makeChallenge({ id: "search-01", level: 7, levelName: "Find Things", title: "Find an error", explanation: "grep works on content: it tells you which lines contain a word or pattern.", example: "grep ERROR server.log", objective: "Find the lines containing ERROR in server.log.", solution: "grep ERROR server.log", setup: () => { const scenario = base(); addFile(scenario, `${scenario.fs.home}/server.log`, "INFO boot\nERROR timeout\nINFO retry\n"); return scenario; }, validator: (check) => checkResult(outputContains(check, "ERROR timeout"), "The line containing ERROR does not appear.") }),
  makeChallenge({ id: "search-02", level: 7, levelName: "Find Things", title: "Ignore case", explanation: "-i prevents differences between uppercase and lowercase from hiding a match.", example: "grep -i warning system.log", objective: "Find WARNING even though the file writes it with different capitalization.", solution: "grep -i warning system.log", setup: () => { const scenario = base(); addFile(scenario, `${scenario.fs.home}/system.log`, "INFO start\nWarning: low disk\nINFO end\n"); return scenario; }, validator: (check) => checkResult(outputContains(check, "Warning", true), "The search has not found Warning while ignoring case.") }),
  makeChallenge({ id: "search-03", level: 7, levelName: "Search recursively", explanation: "With -r, grep walks through folders and shows which file each match came from.", title: "Search the project", example: "grep -r TODO projects", objective: "Find the TODO line inside any file in projects.", solution: "grep -r TODO projects", setup: () => { const scenario = base(); addFile(scenario, `${scenario.fs.home}/projects/app.js`, "const ready = true;\n// TODO: add tests\n"); return scenario; }, validator: (check) => checkResult(outputContains(check, "TODO") && outputContains(check, "app.js"), "The recursive search did not find the TODO in the project.") }),
  makeChallenge({ id: "search-04", level: 7, levelName: "Find by name", title: "Locate the logs", explanation: "find searches paths and names; it does not need you to know the content in advance.", example: "find . -name '*.log'", objective: "Find every .log file inside your home directory.", solution: "find . -name '*.log'", setup: () => { const scenario = base(); addFile(scenario, `${scenario.fs.home}/projects/app.log`, "INFO\n"); addFile(scenario, `${scenario.fs.home}/Downloads/archive.log`, "old\n"); return scenario; }, validator: (check) => checkResult(outputContains(check, "app.log") && outputContains(check, "archive.log"), "One of the .log files is missing from the search.") }),
  makeChallenge({ id: "search-05", level: 7, levelName: "Find by type", title: "Separate files from folders", explanation: "find can also restrict the entry type, which helps when a name is repeated.", example: "find projects -type f -name '*.txt'", objective: "Find the .txt files inside projects without returning directories.", solution: "find projects -type f -name '*.txt'", validator: (check) => checkResult(outputContains(check, "todo.txt") && !outputContains(check, "projects\n"), "The search does not seem limited to .txt files.") }),

  makeChallenge({ id: "redirect-01", level: 8, levelName: "Redirect", title: "Write a file", explanation: "> connects a command's output to a file and replaces its contents.", example: "echo \"hello\" > hello.txt", objective: "Create hello.txt with one line that says hello.", solution: "echo \"hello\" > hello.txt", setup: sandboxSetup(), validator: (check) => checkResult(fileHas(check, "hello.txt", (content) => content === "hello\n"), "hello.txt does not contain exactly the expected line."), hints: ["Use echo to produce a line and an operator to save it.", "The replacement operator is >.", "echo \"hello\" > hello.txt"] }),
  makeChallenge({ id: "redirect-02", level: 8, levelName: "Redirect", title: "Append a second line", explanation: ">> adds to the end; it is a small difference with big consequences in logs.", example: "echo \"world\" >> hello.txt", objective: "Append the line world to hello.txt without deleting hello.", solution: "echo \"world\" >> hello.txt", setup: sandboxSetup((scenario) => addFile(scenario, `${scenario.fs.home}/sandbox/hello.txt`, "hello\n")), validator: (check) => checkResult(fileHas(check, "hello.txt", (content) => content === "hello\nworld\n"), "The file does not preserve hello and end with world."), hints: ["You need to write without replacing what is already there.", "The operator has two > signs.", "echo \"world\" >> hello.txt"] }),
  makeChallenge({ id: "redirect-03", level: 8, levelName: "Redirect", title: "Save the signal", explanation: "You can combine a search with redirection to turn temporary output into a useful file.", example: "grep ERROR server.log > errors.txt", objective: "Save every ERROR line from server.log in errors.txt.", solution: "grep ERROR server.log > errors.txt", setup: () => { const scenario = base(); addFile(scenario, `${scenario.fs.home}/server.log`, "INFO boot\nERROR timeout\nINFO retry\nERROR refused\n"); return scenario; }, validator: (check) => checkResult(fileHas(check, "errors.txt", (content) => content.split("\n").filter(Boolean).length === 2 && content.includes("ERROR")), "errors.txt does not contain both ERROR lines yet.") }),

  makeChallenge({ id: "pipes-01", level: 9, levelName: "Pipes", title: "Filter a stream", explanation: "A pipe turns the output of the command on the left into the input of the command on the right.", example: "cat users.txt | grep admin", objective: "Show only the lines in users.txt that contain admin.", solution: "cat users.txt | grep admin", setup: () => { const scenario = base(); addFile(scenario, `${scenario.fs.home}/users.txt`, "admin alice\ncharlie\nadmin carla\n"); return scenario; }, validator: (check) => checkResult(outputContains(check, "admin alice") && outputContains(check, "admin carla") && !outputContains(check, "charlie\n"), "The output still includes non-admin lines or misses the expected ones.") }),
  makeChallenge({ id: "pipes-02", level: 9, levelName: "Pipes", title: "Filter a listing", explanation: "Listed names are text too: ls can feed another tool.", example: "ls | grep txt", objective: "List only the .txt files in your home directory.", solution: "ls | grep txt", setup: () => { const scenario = base(); addFile(scenario, `${scenario.fs.home}/alpha.txt`, "a\n"); addFile(scenario, `${scenario.fs.home}/beta.md`, "b\n"); return scenario; }, validator: (check) => checkResult(outputContains(check, "alpha.txt") && !outputContains(check, "beta.md"), "The output is not filtering the listing as requested.") }),
  makeChallenge({ id: "pipes-03", level: 9, levelName: "Pipes", title: "Sort and deduplicate", explanation: "Pipes let you build small tools by chaining transformations.", example: "sort names.txt | uniq", objective: "Sort names.txt and remove consecutive duplicates.", solution: "sort names.txt | uniq", setup: () => { const scenario = base(); addFile(scenario, `${scenario.fs.home}/names.txt`, "zeta\nadmin\nadmin\nroot\n"); return scenario; }, validator: (check) => checkResult(String(check.output).trim() === "admin\nroot\nzeta", "The result is not sorted and deduplicated."), hints: ["You need two operations: one sorts and one collapses repeats.", "Connect them with |.", "sort names.txt | uniq"] }),

  makeChallenge({ id: "combine-01", level: 10, levelName: "Combine", title: "Boss 1 · Project setup", boss: true, xp: 150, explanation: "There is no step-by-step recipe now. Think about the final structure and build it with operations you already know.", example: "mkdir -p website/scripts\ntouch website/index.html website/styles.css website/scripts/app.js", objective: "Inside ~/projects, create website with index.html, styles.css, and scripts/app.js.", solution: "cd ~/projects\nmkdir -p website/scripts\ntouch website/index.html website/styles.css website/scripts/app.js", setup: () => base(), validator: (check) => checkResult(check.fs.isDir("projects/website/scripts", check.home) && check.fs.exists("projects/website/index.html", check.home) && check.fs.exists("projects/website/styles.css", check.home) && check.fs.exists("projects/website/scripts/app.js", check.home), "The website structure is not complete yet."), hints: ["First, work inside ~/projects.", "mkdir -p can build website/scripts.", "mkdir -p ~/projects/website/scripts and then touch the three files"] }),
  makeChallenge({ id: "combine-02", level: 10, levelName: "Combine", title: "Verify the structure", explanation: "Once something exists, find is a reproducible way to verify it.", example: "find website -type f", objective: "Show the three files inside projects/website.", solution: "find projects/website -type f", setup: () => { const scenario = base(); addDir(scenario, `${scenario.fs.home}/projects/website/scripts`); addFile(scenario, `${scenario.fs.home}/projects/website/index.html`, ""); addFile(scenario, `${scenario.fs.home}/projects/website/styles.css`, ""); addFile(scenario, `${scenario.fs.home}/projects/website/scripts/app.js`, ""); return scenario; }, validator: (check) => checkResult(outputContains(check, "index.html") && outputContains(check, "styles.css") && outputContains(check, "app.js"), "The output does not list all three site files.") }),
  makeChallenge({ id: "combine-03", level: 10, levelName: "Combine", title: "Extract the signal", explanation: "Searching and redirecting is one of the most common combinations when investigating incidents.", example: "grep -i error app.log > errors.txt", objective: "Find the error lines regardless of case and save them in errors.txt.", solution: "grep -i error app.log > errors.txt", setup: () => { const scenario = base(); addFile(scenario, `${scenario.fs.home}/app.log`, "INFO start\nError database\nINFO retry\nERROR timeout\n"); return scenario; }, validator: (check) => checkResult(fileHas(check, "errors.txt", (content) => content.includes("Error database") && content.includes("ERROR timeout")), "errors.txt does not contain both error matches."), hints: ["The search needs to ignore case and write to a file.", "Combine grep -i with >.", "grep -i error app.log > errors.txt"] }),
  makeChallenge({ id: "combine-04", level: 10, levelName: "Combine", title: "Package the work", explanation: "Archives are useful when you need to move a coherent set of files without losing its structure.", example: "tar -cf website.tar website\ntar -tf website.tar", objective: "Create website.tar from the website folder and inspect its contents.", solution: "tar -cf website.tar website\ntar -tf website.tar", setup: () => { const scenario = base(); addDir(scenario, `${scenario.fs.home}/website`); addFile(scenario, `${scenario.fs.home}/website/index.html`, "<h1>hello</h1>\n"); addFile(scenario, `${scenario.fs.home}/website/styles.css`, "body {}\n"); return scenario; }, validator: (check) => checkResult(check.fs.get("website.tar", check.cwd)?.archiveEntries?.some((entry) => entry.path.endsWith("index.html")) && outputContains(check, "website/index.html"), "website.tar does not exist or was not inspected."), hints: ["tar creates an archive from a path.", "Use -c to create, -f to name it, and -t to list it.", "tar -cf website.tar website"] }),

  makeChallenge({ id: "permissions-01", level: 11, levelName: "Permissions", title: "Make it executable", explanation: "x means a file can be executed. For a script, it is often the first permission you need to add.", example: "chmod +x script.sh", objective: "Add execute permission to script.sh.", solution: "chmod +x script.sh", setup: sandboxSetup((scenario) => addFile(scenario, `${scenario.fs.home}/sandbox/script.sh`, "#!/bin/sh\necho ready\n")), validator: (check) => checkResult(modeNumber(check.fs.get("script.sh", check.cwd)?.mode) & 0o111, "script.sh does not have x permission yet."), hints: ["The command that changes permissions is chmod.", "Use the symbolic +x mode.", "chmod +x script.sh"] }),
  makeChallenge({ id: "permissions-02", level: 11, levelName: "Permissions", title: "Read 755", explanation: "Numeric notation summarizes r=4, w=2, and x=1 for the owner, group, and others.", example: "chmod 755 deploy.sh", objective: "Set deploy.sh to mode 755.", solution: "chmod 755 deploy.sh", setup: sandboxSetup((scenario) => addFile(scenario, `${scenario.fs.home}/sandbox/deploy.sh`, "#!/bin/sh\n")), validator: (check) => checkResult(check.fs.get("deploy.sh", check.cwd)?.mode === "755", "The final mode of deploy.sh is not 755."), hints: ["Three digits represent the owner, group, and others.", "7 is rwx; 5 is r-x.", "chmod 755 deploy.sh"] }),
  makeChallenge({ id: "permissions-03", level: 11, levelName: "Permissions", title: "Read the mode", explanation: "ls -l lets you inspect a file before executing or sharing it.", example: "ls -l script.sh", objective: "Show script.sh's long permissions and verify that it is executable.", solution: "ls -l script.sh", setup: sandboxSetup((scenario) => addFile(scenario, `${scenario.fs.home}/sandbox/script.sh`, "echo ok\n", "755")), validator: (check) => checkResult(outputContains(check, "-rwxr-xr-x") && outputContains(check, "script.sh"), "The long listing does not show script.sh as executable.") }),

  makeChallenge({ id: "process-01", level: 12, levelName: "Processes", title: "Take a snapshot", explanation: "ps is a snapshot; you do not need to close anything to inspect what is running.", example: "ps aux", objective: "List the simulated processes with detailed information.", solution: "ps aux", validator: (check) => checkResult(outputContains(check, "PID") && outputContains(check, "hestim-planner"), "The process table does not appear in the expected format.") }),
  makeChallenge({ id: "process-02", level: 12, levelName: "Processes", title: "Watch activity", explanation: "top prioritizes a view focused on resource usage.", example: "top", objective: "Open a snapshot of the processes using the most resources.", solution: "top", validator: (check) => checkResult(outputContains(check, "%CPU") && outputContains(check, "COMMAND"), "The top view is not present yet.") }),
  makeChallenge({ id: "process-03", level: 12, levelName: "Processes", title: "Stop one process", explanation: "kill takes a PID, not a name. Confirm the number before using it.", example: "ps\nkill 840", objective: "Stop the fictional hestim-planner process with PID 840.", solution: "kill 840", validator: (check) => checkResult(check.engine.processes.find((process) => process.pid === 840)?.killed === true, "Process 840 is still active.") }),
  makeChallenge({ id: "process-04", level: 12, levelName: "Processes", title: "Stop by name", explanation: "killall operates on a name and can affect more than one process.", example: "killall node", objective: "Stop every fictional process whose command contains node.", solution: "killall node", setup: () => makeBaseScenario({ processes: [{ pid: 1, user: "root", cpu: "0", mem: "0", command: "systemd" }, { pid: 2100, user: PLAYER_USER, cpu: "30", mem: "4", command: "node api.js" }, { pid: 2101, user: PLAYER_USER, cpu: "12", mem: "2", command: "node worker.js" }] }), validator: (check) => checkResult(check.engine.processes.filter((process) => process.command.includes("node")).every((process) => process.killed), "A node process is still active.") }),

  makeChallenge({ id: "system-01", level: 13, levelName: "System", title: "Name the system", explanation: "macOS and Linux share many tools, but they do not always print exactly the same output.", example: "uname -a", objective: "Identify the simulated operating system in this session.", solution: "uname -a", validator: (check) => checkResult(outputContains(check, "Linux"), "This local session should identify itself as Linux.") }),
  makeChallenge({ id: "system-02", level: 13, levelName: "System", title: "Check the disk", explanation: "df reports how much space remains available on mounted filesystems.", example: "df -h", objective: "Check the available space in the virtual filesystem.", solution: "df -h", validator: (check) => checkResult(outputContains(check, "Filesystem") && outputContains(check, "/"), "The df table is not complete.") }),
  makeChallenge({ id: "system-03", level: 13, levelName: "System", title: "Measure a project", explanation: "du checks how much space a path uses; -s summarizes and -h makes it easier to read.", example: "du -sh projects", objective: "Measure the size of the projects folder.", solution: "du -sh projects", validator: (check) => checkResult(outputContains(check, "projects") && /\d/.test(check.output), "The du output does not show a measurement for projects.") }),
  makeChallenge({ id: "system-04", level: 13, levelName: "System", title: "Read the clock", explanation: "uptime summarizes running time and load; it is a quick first look at a server.", example: "uptime", objective: "Check the uptime of the virtual machine.", solution: "uptime", validator: (check) => checkResult(outputContains(check, "load averages"), "The output does not contain the uptime summary.") }),
  makeChallenge({ id: "system-05", level: 13, levelName: "System", title: "Linux memory", explanation: "free is common on Linux but is not a standard macOS command. The difference matters when you change machines.", example: "free -h", objective: "In this Linux session, check the available memory.", solution: "free -h", platforms: ["Linux"], setup: () => makeBaseScenario({ platform: "Linux", hostname: "ubuntu-lab" }), validator: (check) => checkResult(outputContains(check, "Mem:") && outputContains(check, "available"), "The free output does not show the Linux memory table.") }),

  makeChallenge({ id: "network-01", level: 14, levelName: "Network", title: "Check reachability", explanation: "ping provides an initial connectivity signal; it does not prove that a web application works.", example: "ping -c 3 raspberrypi", objective: "Send three simulated pings to raspberrypi.", solution: "ping -c 3 raspberrypi", validator: (check) => checkResult(outputContains(check, "0.0% packet loss") && outputContains(check, "3 packets transmitted"), "The ping statistics do not show three packets without loss."), hints: ["ping takes a host and can limit the number of packets.", "Use -c 3 before the host name.", "ping -c 3 raspberrypi"] }),
  makeChallenge({ id: "network-02", level: 14, levelName: "Network", title: "Inspect an endpoint", explanation: "curl is often the quickest terminal tool for talking to HTTP.", example: "curl https://example.com/health", objective: "Query the simulated health endpoint with curl.", solution: "curl https://example.com/health", validator: (check) => checkResult(outputContains(check, '"status": "ok"') && outputContains(check, '"simulated": true'), "The simulated curl response does not appear.") }),
  makeChallenge({ id: "network-03", level: 14, levelName: "Network", title: "Open the folder", explanation: "xdg-open . opens a folder in the Linux desktop; macOS uses open . instead.", example: "xdg-open .", objective: "Open the current directory with the Linux desktop tool.", solution: "xdg-open .", platforms: ["Linux"], validator: (check) => checkResult(outputContains(check, "Opening") && outputContains(check, "simulated"), "xdg-open did not return the simulated confirmation.") }),

  makeChallenge({ id: "remote-01", level: 15, levelName: "Remote", title: "Boss 4 · Raspberry Pi", boss: true, xp: 150, explanation: "A remote connection changes the context: the prompt and filesystem are no longer those of your Mac.", example: "ssh learner@raspberrypi", objective: "Connect to the simulated Raspberry Pi and enter /var/log.", solution: "ssh learner@raspberrypi\ncd /var/log", setup: () => makeBaseScenario({ remoteFactory: () => makeRemoteScenario("raspberrypi", "learner") }), validator: (check) => checkResult(check.engine.remoteHost === "raspberrypi" && check.cwd === "/var/log", "You are not connected to Raspberry Pi in /var/log yet.") }),
  makeChallenge({ id: "remote-02", level: 15, levelName: "Remote", title: "Send a report", explanation: "scp copies files without requiring a second interactive terminal.", example: "scp report.txt learner@raspberrypi:~/", objective: "Copy report.txt from your local session to raspberrypi's home.", solution: "scp report.txt learner@raspberrypi:~/", setup: () => { const scenario = makeBaseScenario({ remoteFactory: () => makeRemoteScenario("raspberrypi", "learner") }); addFile(scenario, `${scenario.fs.home}/report.txt`, "daily report\n"); return scenario; }, validator: (check) => { const session = check.engine.remoteSessions.raspberrypi; return checkResult(!!session?.fs.exists("report.txt", session.cwd), "report.txt does not appear in the remote home yet."); } }),
  makeChallenge({ id: "remote-03", level: 15, levelName: "Remote", title: "Read the remote log", explanation: "Connect, inspect, and leave: an SSH session is a sequence of contexts, not a different kind of magic.", example: "ssh learner@raspberrypi\ncat /var/log/server.log", objective: "Connect to raspberrypi and read server.log inside /var/log.", solution: "ssh learner@raspberrypi\ncat /var/log/server.log", setup: () => makeBaseScenario({ remoteFactory: () => makeRemoteScenario("raspberrypi", "learner") }), validator: (check) => checkResult(check.engine.remoteHost === "raspberrypi" && outputContains(check, "ERROR database"), "The session did not finish by showing the remote log and its errors.") }),

  makeChallenge({ id: "environment-01", level: 16, levelName: "Environment", title: "Find home", explanation: "HOME is an environment variable; using it makes a path more portable than writing a fixed name.", example: "echo $HOME", objective: "Print the value of HOME.", solution: "echo $HOME", validator: (check) => checkResult(String(check.output).trim() === check.home, "HOME did not print as your home directory.") }),
  makeChallenge({ id: "environment-02", level: 16, levelName: "Environment", title: "Name your project", explanation: "export makes a variable available to the commands that follow in this session.", example: "export PROJECT=terminal-quest\necho $PROJECT", objective: "Set PROJECT to terminal-quest and verify its value.", solution: "export PROJECT=terminal-quest\necho $PROJECT", validator: (check) => checkResult(check.engine.baseEnv.PROJECT === "terminal-quest" && outputContains(check, "terminal-quest"), "PROJECT was not set to the correct value."), hints: ["Variables are assigned with NAME=value.", "export keeps the assignment available to the session.", "export PROJECT=terminal-quest"] }),
  makeChallenge({ id: "environment-03", level: 16, levelName: "Environment", title: "Investigate your tools", explanation: "man, which, and history help you keep working when memory fails.", example: "man grep\nwhich grep\nhistory", objective: "Consult grep's help, locate the command, and review your history.", solution: "man grep\nwhich grep\nhistory", validator: (check) => checkResult(check.engine.history.some((line) => line.startsWith("man grep")) && check.engine.history.some((line) => line.startsWith("which grep")) && check.engine.history.some((line) => line === "history") && outputContains(check, "man grep"), "One or more of the three investigation tools are still missing."), hints: ["You do not need to guess: man explains and which locates.", "After using both, history shows what you did.", "man grep, which grep, then history"] }),

  makeChallenge({ id: "power-01", level: 17, levelName: "Power User", title: "Boss 2 · Lost file", boss: true, xp: 150, explanation: "When you know the name but not the location, find it first and move it second.", example: "find projects -name config.json\nmv projects/app/config.json backup/config.json", objective: "Find config.json inside projects and move it to ~/backup.", solution: "mkdir -p ~/backup\nfind ~/projects -name config.json\nmv ~/projects/app/config.json ~/backup/config.json", setup: () => { const scenario = base(); addDir(scenario, `${scenario.fs.home}/projects/app/config`); addFile(scenario, `${scenario.fs.home}/projects/app/config.json`, '{"mode":"prod"}\n'); addDir(scenario, `${scenario.fs.home}/backup`); return scenario; }, validator: (check) => checkResult(check.fs.exists("backup/config.json", check.home) && !check.fs.exists("projects/app/config.json", check.home), "config.json has not been moved to ~/backup yet."), hints: ["Make sure the destination exists before moving.", "find reveals the path; mv changes its location.", "mkdir -p ~/backup and then mv ~/projects/app/config.json ~/backup/config.json"] }),
  makeChallenge({ id: "power-02", level: 17, levelName: "Power User", title: "Boss 3 · Logs", boss: true, xp: 150, explanation: "This is a common incident-response operation: filter a signal and preserve it.", example: "grep ERROR server.log > errors.txt", objective: "Find every line containing ERROR in server.log and save it in errors.txt.", solution: "grep ERROR server.log > errors.txt", setup: () => { const scenario = base(); addFile(scenario, `${scenario.fs.home}/server.log`, "INFO boot\nERROR timeout\nWARN retry\nERROR refused\n"); return scenario; }, validator: (check) => checkResult(fileHas(check, "errors.txt", (content) => content.split("\n").filter(Boolean).length === 2 && content.split("\n").filter(Boolean).every((line) => line.includes("ERROR"))), "errors.txt does not contain exactly the expected ERROR lines."), hints: ["grep can select lines and > can save them.", "The pattern is ERROR and the output file is errors.txt.", "grep ERROR server.log > errors.txt"] }),
  makeChallenge({ id: "power-03", level: 17, levelName: "Power User", title: "Build a clean report", explanation: "Chain recursive search, sorting, deduplication, and redirection to produce a report.", example: "grep -r admin projects/logs | sort | uniq > admin-users.txt", objective: "Find the admin lines in projects/logs, sort them, remove duplicates, and save them in admin-users.txt.", solution: "grep -r admin projects/logs | sort | uniq > admin-users.txt", setup: () => { const scenario = base(); addDir(scenario, `${scenario.fs.home}/projects/logs`); addFile(scenario, `${scenario.fs.home}/projects/logs/a.log`, "admin alice\nadmin alice\n"); addFile(scenario, `${scenario.fs.home}/projects/logs/b.log`, "guest\nadmin carla\nadmin carla\n"); return scenario; }, validator: (check) => { const read = check.fs.read("admin-users.txt", check.cwd); if (!read.ok) return checkResult(false, "admin-users.txt does not exist yet."); const lines = read.content.split("\n").filter(Boolean); return checkResult(lines.length === 2 && new Set(lines).size === 2 && lines.every((line) => line.includes("admin")), "The report does not contain the expected unique admin lines."); }, hints: ["Start with recursive grep; then turn the output into a stable list.", "sort and uniq should be in a pipe before the redirection.", "grep -r admin projects/logs | sort | uniq > admin-users.txt"] }),

  makeChallenge({ id: "server-01", level: 18, levelName: "Server Mission", title: "Enter the server room", explanation: "The final mission combines remote context, logs, disk space, and processes like a small server shift.", example: "ssh admin@server\ngrep -r ERROR /var/log > ~/errors.txt\ndf -h\nkill 2451", objective: "Connect to the server, save errors from /var/log in ~/errors.txt, check disk space, and stop the resource-hungry node process.", solution: "ssh admin@server\ngrep -r ERROR /var/log > ~/errors.txt\ndf -h\nps aux\nkill 2451", boss: true, xp: 180, setup: () => makeBaseScenario({ remoteFactory: () => makeRemoteScenario("server", "admin") }), validator: (check) => { const remote = check.engine.remoteSessions.server; const errors = remote?.fs.read("/home/admin/errors.txt", "/home/admin"); const process = check.engine.processes.find((entry) => entry.pid === 2451); return checkResult(check.engine.remoteHost === "server" && errors?.ok && errors.content.includes("ERROR") && process?.killed === true, "The mission still needs the connection, error report, and stopped process."); }, hints: ["First change machines with ssh; then work on /var/log.", "grep -r and > can create the report in one operation.", "Use ssh, then grep -r with >, followed by df -h and kill 2451."] }),
  makeChallenge({ id: "server-02", level: 18, levelName: "Server Mission", title: "Recover an archive", explanation: "Compressing, transferring, and recovering files are common tasks when administering a machine.", example: "zip backup.zip release.txt\nunzip backup.zip -d restored\ngzip release.txt", objective: "Create backup.zip with release.txt, extract it into restored, and compress the original with gzip.", solution: "zip backup.zip release.txt\nunzip backup.zip -d restored\ngzip release.txt", setup: sandboxSetup((scenario) => addFile(scenario, `${scenario.fs.home}/sandbox/release.txt`, "release 1.0\n")), validator: (check) => checkResult(!!check.fs.get("backup.zip", check.cwd)?.archiveEntries && check.fs.exists("restored/release.txt", check.cwd) && check.fs.exists("release.txt.gz", check.cwd), "The zip, restored copy, or final .gz file is missing."), hints: ["zip and unzip work with a .zip archive; gzip replaces the original with a .gz file.", "Use unzip -d restored to choose the destination.", "zip backup.zip release.txt; unzip backup.zip -d restored; gzip release.txt"] }),
  makeChallenge({ id: "server-03", level: 18, levelName: "Server Mission", title: "Keep your own manual", explanation: "Fluency also means knowing how to investigate: do not memorize what you can quickly look up.", example: "man find\nwhich find\nhistory", objective: "Use man, which, and history to investigate find and leave a trail of how you solved it.", solution: "man find\nwhich find\nhistory", setup: sandboxSetup(), validator: (check) => checkResult(check.engine.history.includes("man find") && check.engine.history.includes("which find") && check.engine.history.includes("history") && outputContains(check, "which find"), "The investigation sequence is not complete yet.") })
];

const ChallengeEngine = {
  challenges: challengeList,
  byId: (id) => challengeList.find((challenge) => challenge.id === id),
  levels: () => [...new Set(challengeList.map((challenge) => challenge.level))].map((level) => ({ level, name: challengeList.find((challenge) => challenge.level === level).levelName })),
};

/** Change l'utilisateur du terminal (nom affiché dans l'invite et dossier /home/<nom>). */
export const definirJoueur = (nom) => setActiveUser(nom);

export {
  APP_VERSION,
  COMMANDS,
  ChallengeEngine,
  TerminalEngine,
  VirtualFileSystem,
  challengeList,
  checkResult,
  makeBaseScenario,
  makePracticeScenario,
  makeRemoteScenario,
  normalizeUser,
  result,
};
