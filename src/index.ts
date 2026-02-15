import * as readline from "node:readline";
import { ReplSession } from "./repl";

const session = new ReplSession();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log("Leverr v0.1.0");
console.log('Type :quit to exit, :type <name> for types, :env to see bindings\n');

function prompt() {
  rl.question("leverr> ", (input) => {
    const trimmed = input.trim();
    if (!trimmed) return prompt();
    if (trimmed === ":quit" || trimmed === ":q") {
      console.log("Goodbye!");
      rl.close();
      return;
    }

    const result = session.eval(trimmed);
    if (result.error) {
      console.error(result.error);
    } else if (result.output !== undefined) {
      console.log(result.output);
    }
    prompt();
  });
}

prompt();
