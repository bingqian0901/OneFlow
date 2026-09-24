import assert from "node:assert/strict";
import { initialState, createTask, plan, runStep } from "../src/model";
let state = initialState();
const movie = createTask("movie", "电影之夜");
movie.config.cart = [1, 1, 0];
movie.steps = plan(movie);
state.tasks.unshift(movie);
const before = structuredClone(state.devices);
state = runStep(state, movie.id, movie.steps[0].id);
assert.deepEqual(
  state.devices,
  before,
  "Unconfirmed task must never change devices",
);
state.tasks[0].status = "running";
for (const step of movie.steps) state = runStep(state, movie.id, step.id);
assert.equal(state.tasks[0].status, "completed");
assert.equal(
  state.devices.find((d) => d.id === "tv")!.properties.content,
  "星际穿越",
);
assert.equal(
  state.devices.find((d) => d.id === "ac")!.properties.temperature,
  26,
);
assert.equal(
  state.devices.find((d) => d.id === "light")!.properties.brightness,
  30,
);
assert.equal(state.tasks[0].ordered, false);
const movieCompleted = structuredClone(state);
assert.deepEqual(
  runStep(state, movie.id, movie.steps[0].id),
  movieCompleted,
  "Completed task cannot execute twice",
);
const scheduled = createTask("home", "Scheduled guard");
scheduled.status = "running";
scheduled.steps = plan(scheduled);
state.tasks.unshift(scheduled);
const scheduledState = structuredClone(state);
state = runStep(
  state,
  scheduled.id,
  scheduled.steps.find((s) => s.targetDeviceId === "water")!.id,
);
assert.deepEqual(
  state,
  scheduledState,
  "Scheduled device must not run before its time",
);
state.tasks[0].status = "paused";
const pausedState = structuredClone(state);
state = runStep(state, scheduled.id, scheduled.steps[0].id);
assert.deepEqual(state, pausedState, "Paused task must not execute");
const home = createTask("home", "归家");
home.status = "running";
home.clock = 1120;
home.config.temp = 25;
home.steps = plan(home);
state.tasks.unshift(home);
state.devices.find((d) => d.id === "water")!.online = false;
for (const step of home.steps) state = runStep(state, home.id, step.id);
state.tasks[0].clock = 1120;
state = runStep(
  state,
  home.id,
  home.steps.find((s) => s.targetDeviceId === "water")!.id,
);
assert.equal(state.tasks[0].status, "partial_failed");
assert.equal(
  state.tasks[0].steps.find((s) => s.targetDeviceId === "water")!.status,
  "failed",
);
assert.equal(
  state.devices.find((d) => d.id === "ac")!.properties.temperature,
  25,
);
assert.equal(
  state.tasks[0].steps.find((s) => s.targetDeviceId === "light")!.status,
  "completed",
);
state.tasks[0].status = "running";
state.devices.find((d) => d.id === "water")!.online = true;
state = runStep(
  state,
  home.id,
  home.steps.find((s) => s.targetDeviceId === "water")!.id,
);
assert.equal(state.tasks[0].status, "completed");
assert.equal(
  state.devices.find((d) => d.id === "water")!.properties.temperature,
  45,
);
const disconnected = createTask("work", "办公");
disconnected.status = "running";
disconnected.steps = plan(disconnected);
state.tasks.unshift(disconnected);
state.services[4] = false;
state = runStep(state, disconnected.id, disconnected.steps[0].id);
assert.equal(state.tasks[0].steps[0].status, "failed");
assert.equal(state.devices.find((d) => d.id === "pc")!.properties.document, "");
console.log(
  "PASS: confirmation guard, movie synchronization, offline isolation, retry, service authorization, no automatic order.",
);
