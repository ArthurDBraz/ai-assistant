// The output boundary \u2014 how a finished assistant response leaves the app.
//
// Why this exists:
//   The assistant itself must not know whether the final answer ends up on
//   the console, in Home Assistant, in a Telegram chat, or in an MQTT topic.
//   It just calls `publisher.publish(text)`. Someone else decides where.
//
//   Today, `main.ts` ends with `console.log(content)`. Replacing that with
//   `publisher.publish(content)` and injecting the concrete publisher in
//   `main.ts` is the whole point of this interface.
//
// Suggested shape:
//
//   export interface OutputPublisher {
//     publish(text: string): Promise<void>;
//   }
//
// Later you'll add implementations next to this file:
//   - `console-publisher.ts`         \u2014 wraps `console.log`.
//   - `home-assistant-publisher.ts`  \u2014 POST to a HA REST/webhook endpoint.
//   - `mqtt-publisher.ts`, etc.
//
// The assistant code stays untouched when you add each one.
//
// TODO: define the `OutputPublisher` interface. No implementations yet
//       \u2014 you asked to keep the code unaware that Home Assistant will
//       eventually be wired.

export {};
