import { z } from "zod";

const schema = z.record(z.number());

const res = schema.safeParse({ "foo": 123 });
console.log(JSON.stringify(res, null, 2));
