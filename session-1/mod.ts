const lib = Deno.dlopen(new URL("./libsession-1.so", import.meta.url), {
  add_u32: {
    parameters: ["u32", "u32"],
    result: "u32",
  },
  double_to_bits: {
    parameters: ["f64"],
    result: "i64",
  },
  bits_to_double: {
    parameters: ["i64"],
    result: "f64",
  },
  lib__Example__create: {
    parameters: ["buffer"],
    result: "pointer",
  },
  lib__Example__delete: {
    parameters: ["pointer"],
    result: "void",
  },
  lib__Example__destructure: {
    parameters: ["pointer"],
    result: "void",
  },
  lib__Example__getCString: {
    parameters: ["pointer"],
    result: "pointer",
  },
  lib__Example__length: {
    parameters: ["pointer"],
    result: "usize",
  },
});

console.log(lib.symbols.add_u32(2, 3));
console.log(lib.symbols.double_to_bits(112346.243547357));
console.log(
  lib.symbols.bits_to_double(lib.symbols.double_to_bits(112346.243547357)),
);
const string = "My perfect string!!!\0";
const stringBuffer = new TextEncoder().encode(string);
const examplePointer = lib.symbols.lib__Example__create(stringBuffer);
console.log(
  Deno.UnsafePointerView.getCString(
    lib.symbols.lib__Example__getCString(examplePointer),
  ),
);
console.log(lib.symbols.lib__Example__length(examplePointer), string.length);
lib.symbols.lib__Example__delete(examplePointer);
console.log(lib.symbols.lib__Example__length(examplePointer), string.length);
