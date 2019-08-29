import { AzureFunction, Context } from "@azure/functions";
import { run } from "./logic";

const timerTrigger: AzureFunction = async function(
  context: Context,
  myTimer: any
): Promise<void> {
  context.log("Running...");

  await run(context.log);

  context.log("Done");
};

export default timerTrigger;
