import { run } from "../CheckForNewApartments/logic";

run(console as any)
  .catch(err => {
    if (err.response) {
      console.error(err.response.data)
    }

    console.error(err.stack || err.message);
    process.exit(1);
  });
