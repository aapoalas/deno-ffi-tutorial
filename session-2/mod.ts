const lib = Deno.dlopen(new URL("./libsession-2.so", import.meta.url), {
  is_prime: {
    parameters: ["u64"],
    result: "bool",
  },
  is_prime_async: {
    name: "is_prime",
    parameters: ["u64"],
    result: "bool",
    nonblocking: true,
  },
  is_prime_cb: {
    parameters: ["u64", "pointer", "function"],
    result: "void",
  },
  create_prime: {
    parameters: ["u64"],
    result: "u64",
  },
  create_prime_async: {
    name: "create_prime",
    parameters: ["u64"],
    result: "u64",
    nonblocking: true,
  },
  lib__PrimeSecret__with_primes: {
    parameters: ["u64", "u64"],
    result: "pointer",
  },
  lib__PrimeSecret__with_seed: {
    parameters: ["u64"],
    result: "pointer",
  },
  lib__PrimeSecret__construct_with_primes: {
    parameters: ["buffer", "u64", "u64"],
    result: "pointer",
  },
  lib__PrimeSecret__construct_with_seed: {
    parameters: ["buffer", "u64"],
    result: "pointer",
  },
  lib__PrimeSecret__wait_for_complete: {
    parameters: ["pointer"],
    result: "void",
    nonblocking: true,
  },
  lib__PrimeSecret__on_complete: {
    parameters: ["pointer", "function"],
    result: "void",
  },
  lib__PrimeSecret__is_valid: {
    parameters: ["pointer"],
    result: "u32",
  },
  lib__PrimeSecret__dispose: {
    parameters: ["pointer"],
    result: "void",
  },
  lib__PrimeSecret__destruct: {
    parameters: ["pointer"],
    result: "void",
  },
});

Deno.unrefTimer(setInterval(() => {
  console.log("Tick");
}, 1000));

console.log(lib.symbols.is_prime(9973));
lib.symbols.is_prime_async(18446744073709551557n).then((res) =>
  console.log(res)
);

const callback = new Deno.UnsafeCallback({
  parameters: ["pointer", "bool"],
  result: "void",
}, (data, result) => {
  console.log("Data:", data, "Result:", result);
  callback.unref();
});

const foreignFunction = new Deno.UnsafeFnPointer(callback.pointer, {
  parameters: ["pointer", "bool"],
  result: "void",
});

foreignFunction.call(46, false);

// callback.ref();
//lib.symbols.is_prime_cb(18446744073709551557n, 32, callback.pointer);

const [a_prime, b_prime] = await Promise.all([
  lib.symbols.create_prime_async(13653547412267135n),
  lib.symbols.create_prime_async(34645765686124685n),
]);

console.log(a_prime, b_prime);

console.log("A is prime:", await lib.symbols.is_prime_async(a_prime));
console.log("B is prime:", await lib.symbols.is_prime_async(b_prime));

const PrimeSecret = lib.symbols.lib__PrimeSecret__with_primes(a_prime, b_prime);

// const COMPLETE_RESOLVERS = new Map<Deno.PointerValue, () => void>();
// const COMPLETE_CALLBACK = new Deno.UnsafeCallback({
//   parameters: ["pointer"],
//   result: "void",
// }, (ptr) => {
//   const resolver = COMPLETE_RESOLVERS.get(ptr);
//   if (!resolver) {
//     throw new Error("Could not find resolver");
//   }
//   COMPLETE_RESOLVERS.delete(ptr);
//   resolver();
// });

// console.log("GOGO");
// const promise = new Promise<void>((res) => {
//   console.log("ASD");
//   COMPLETE_RESOLVERS.set(PrimeSecret, res);
// });
// lib.symbols.lib__PrimeSecret__on_complete(
//   PrimeSecret,
//   COMPLETE_CALLBACK.pointer,
// );
// await promise;
// COMPLETE_CALLBACK.close();

console.log("About to wait");
await lib.symbols.lib__PrimeSecret__wait_for_complete(PrimeSecret);
console.log("Waited");
lib.symbols.lib__PrimeSecret__dispose(PrimeSecret);

const buffer = new Uint8Array(40);
lib.symbols.lib__PrimeSecret__construct_with_seed(
  buffer,
  123103913593467447565n,
);
console.log("Buffer after construction with seed:", buffer);
await lib.symbols.lib__PrimeSecret__wait_for_complete(
  Deno.UnsafePointer.of(buffer),
);
console.log("Buffer after waiting for completion:", buffer);
lib.symbols.lib__PrimeSecret__destruct(Deno.UnsafePointer.of(buffer));
console.log("Buffer after dispose:", buffer);
