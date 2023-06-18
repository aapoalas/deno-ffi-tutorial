export const NULLBUF = new Uint8Array();
export const NULL = Deno.UnsafePointer.of(NULLBUF);

const ENCODER = new TextEncoder();
const DECODER = new TextDecoder();

export class CStringArray extends Uint8Array {
  constructor(strings?: string[]) {
    if (!strings || strings.length === 0) {
      super();
      return;
    }
    let stringsLength = 0;
    for (const string of strings) {
      // Byte length of a UTF-8 string is never bigger than 3 times its length.
      // 2 times the length would be a fairly safe guess. For command line arguments,
      // we expect that all characters should be single-byte UTF-8 characters.
      // Add one byte for the null byte.
      stringsLength += string.length + 1;
    }
    super(8 * strings.length + stringsLength);
    const pointerBuffer = new BigUint64Array(this.buffer, 0, strings.length);
    const stringsBuffer = new Uint8Array(this.buffer).subarray(
      strings.length * 8,
    );
    const basePointer = BigInt(Deno.UnsafePointer.of(stringsBuffer));
    let index = 0;
    let offset = 0;
    for (const string of strings) {
      const start = offset;
      const result = ENCODER.encodeInto(
        string,
        stringsBuffer.subarray(start),
      );
      if (result.read !== result.written) {
        throw new Error("Not a single byte UTF-8 string");
      }
      offset = start + result.written + 1; // Leave null byte
      pointerBuffer[index++] = basePointer + BigInt(start);
    }
  }
}

export const cstrToString = (cstr: Uint8Array): string =>
  DECODER.decode(cstr.subarray(0, cstr.byteLength - 1));
export const charBufferToString = (cstr: Uint8Array): string =>
  DECODER.decode(cstr);
let clang_getCString = (cxstring: Uint8Array): Deno.PointerValue => {
  throw new Error("Need to provide");
};
let clang_disposeString = (cxstring: Uint8Array): void => {
  throw new Error("Need to provide");
};
export const provideCXStringAPI = (
  get: typeof clang_getCString,
  dispose: typeof clang_disposeString,
): void => {
  clang_getCString = get;
  clang_disposeString = dispose;
};
export const cxstringToString = (
  cxstring: Uint8Array,
  dispose = true,
): string => {
  const cstring = clang_getCString(cxstring);
  let string = "";
  if (cstring !== NULL) {
    try {
      string = Deno.UnsafePointerView.getCString(cstring);
    } catch {
      const buf = new Uint8Array(
        Deno.UnsafePointerView.getArrayBuffer(cstring, 1024),
      );
      string = cstrToString(buf.subarray(0, buf.indexOf(0)));
    }
  }
  if (dispose) {
    clang_disposeString(cxstring);
  }
  return string;
};
export const cstr = (string: string): Uint8Array =>
  ENCODER.encode(`${string}\0`);
export const charBuffer = (string: string): Uint8Array =>
  ENCODER.encode(string);
