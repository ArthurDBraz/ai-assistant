// The `get_current_datetime` tool \u2014 self-describing.
//
// Suggested shape:
//
//   import type { Tool } from "../tool.js";
//
//   export class GetCurrentDateTimeTool implements Tool {
//     readonly schema = {
//       name: "get_current_datetime",
//       description: "Get the current date and time",
//     };
//
//     async execute(): Promise<Date> {
//       return new Date();
//     }
//   }
//
// TODO: implement using the schema and `getCurrentDateTime()` function
//       currently in `main.ts`.

export {};
