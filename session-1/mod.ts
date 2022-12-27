const lib = Deno.dlopen(new URL("./libsession-1.so", import.meta.url), {
  double_to_bits: {
    parameters: ["f64"],
    result: "i64",
  },
});

console.log(lib.symbols.double_to_bits(112346.243547357));
